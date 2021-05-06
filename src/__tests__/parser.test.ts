/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from "chai";
import { TokenMap, fetchTokenList } from "src/hooks/tokenList";
import { TokenInfo } from "@uniswap/token-lists";
import { parseCSV } from "src/parser";
import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import BigNumber from "bignumber.js";

let tokenList: TokenMap;
let listedTokens: string[];
let listedToken: TokenInfo;
const unlistedTokenAddress: string =
  "0x6b175474e89094c44da98b954eedeac495271d0f";

let validReceiverAddress = "0x1000000000000000000000000000000000000000";

const headerRow = "token_address,receiver,amount,decimals";

let dummySafeInfo: SafeInfo = {
  safeAddress: "0x123",
  network: "rinkeby",
  ethBalance: "100",
};

describe("Parsing CSVs ", () => {
  beforeEach(async () => {
    tokenList = await fetchTokenList(dummySafeInfo.network);
    listedTokens = Array.from(tokenList.keys());
    listedToken = tokenList.get(listedTokens[0]);
  });
  it("should transform simple, valid CSVs correctly", async () => {
    const rowWithoutDecimal = [listedToken.address, validReceiverAddress, "1"];
    const rowWithDecimal = [
      unlistedTokenAddress,
      validReceiverAddress,
      "69.420",
      "18",
    ];
    const rowWithoutTokenAddress = ["", validReceiverAddress, "1"];

    const [payment, warnings] = await parseCSV(
      headerRow +
        "\n" +
        rowWithoutDecimal.join(",") +
        "\n" +
        rowWithDecimal.join(",") +
        "\n" +
        rowWithoutTokenAddress.join(","),
      tokenList
    );
    expect(warnings).to.be.empty;
    expect(payment).to.have.lengthOf(3);
    expect(payment[0].decimals).to.be.undefined;
    expect(payment[0].receiver).to.equal(validReceiverAddress);
    expect(payment[0].tokenAddress).to.equal(listedToken.address);
    expect(payment[0].amount.isEqualTo(new BigNumber(1))).to.be.true;

    expect(payment[1].receiver).to.equal(validReceiverAddress);
    expect(payment[1].tokenAddress.toLowerCase()).to.equal(
      unlistedTokenAddress.toLowerCase()
    );
    expect(payment[1].decimals).to.equal(18);
    expect(payment[1].amount.isEqualTo(new BigNumber(69.42))).to.be.true;

    expect(payment[2].decimals).to.be.undefined;
    expect(payment[2].receiver).to.equal(validReceiverAddress);
    expect(payment[2].tokenAddress).to.equal("");
    expect(payment[2].amount.isEqualTo(new BigNumber(1))).to.be.true;
  });

  it("should generate validation warnings", async () => {
    const rowWithNegativeAmount = [
      listedToken.address,
      validReceiverAddress,
      "-1",
    ];
    const rowWithInvalidDecimal = [
      unlistedTokenAddress,
      validReceiverAddress,
      "1",
      "19",
    ];
    const unlistedTokenWithoutDecimal = [
      unlistedTokenAddress,
      validReceiverAddress,
      "1",
    ];
    const rowWithInvalidTokenAddress = [
      "0x420",
      validReceiverAddress,
      "1",
      "18",
    ];
    const rowWithInvalidReceiverAddress = [
      unlistedTokenAddress,
      "0x420",
      "1",
      "18",
    ];

    const [payment, warnings] = await parseCSV(
      headerRow +
        "\n" +
        rowWithNegativeAmount.join(",") +
        "\n" +
        rowWithInvalidDecimal.join(",") +
        "\n" +
        unlistedTokenWithoutDecimal.join(",") +
        "\n" +
        rowWithInvalidTokenAddress.join(",") +
        "\n" +
        rowWithInvalidReceiverAddress.join(","),
      tokenList
    );
    expect(warnings).to.have.lengthOf(5);
    expect(payment).to.be.empty;
    expect(warnings[0].message).to.equal(
      "1: Only positive amounts possible: -1"
    );
    expect(warnings[1].message).to.equal("2: Invalid decimals: 19");
    expect(warnings[2].message).to.equal("3: Invalid decimals: undefined");
    expect(warnings[3].message).to.equal("4: Invalid Token Address: 0x420");
    expect(warnings[4].message).to.equal("5: Invalid Receiver Address: 0x420");
  });
});
