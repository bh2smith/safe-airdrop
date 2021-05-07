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

let dummySafeInfo: SafeInfo = {
  safeAddress: "0x123",
  network: "rinkeby",
  ethBalance: "100",
};

/**
 * concatenates csv row arrays into one string.
 * @param rows array of row-arrays
 */
const csvStringFromRows = (...rows: string[][]): string => {
  const headerRow = "token_address,receiver,amount,decimals";
  return [headerRow, ...rows.map((row) => row.join(","))].join("\n");
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
      csvStringFromRows(
        rowWithoutDecimal,
        rowWithDecimal,
        rowWithoutTokenAddress
      ),
      tokenList
    );
    expect(warnings).to.be.empty;
    expect(payment).to.have.lengthOf(3);
    const [
      paymentWithoutDecimal,
      paymentWithDecimal,
      paymentWithoutTokenAddress,
    ] = payment;
    expect(paymentWithoutDecimal.decimals).to.be.undefined;
    expect(paymentWithoutDecimal.receiver).to.equal(validReceiverAddress);
    expect(paymentWithoutDecimal.tokenAddress).to.equal(listedToken.address);
    expect(paymentWithoutDecimal.amount.isEqualTo(new BigNumber(1))).to.be.true;

    expect(paymentWithDecimal.receiver).to.equal(validReceiverAddress);
    expect(paymentWithDecimal.tokenAddress.toLowerCase()).to.equal(
      unlistedTokenAddress.toLowerCase()
    );
    expect(paymentWithDecimal.decimals).to.equal(18);
    expect(paymentWithDecimal.amount.isEqualTo(new BigNumber(69.42))).to.be
      .true;

    expect(paymentWithoutTokenAddress.decimals).to.be.undefined;
    expect(paymentWithoutTokenAddress.receiver).to.equal(validReceiverAddress);
    expect(paymentWithoutTokenAddress.tokenAddress).to.equal("");
    expect(paymentWithoutTokenAddress.amount.isEqualTo(new BigNumber(1))).to.be
      .true;
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
      csvStringFromRows(
        rowWithNegativeAmount,
        rowWithInvalidDecimal,
        unlistedTokenWithoutDecimal,
        rowWithInvalidTokenAddress,
        rowWithInvalidReceiverAddress
      ),
      tokenList
    );
    expect(warnings).to.have.lengthOf(5);
    const [
      warningNegativeAmount,
      warningTooHighDecimals,
      warningUndefinedDecimals,
      warningInvalidTokenAddress,
      warningInvalidReceiverAddress,
    ] = warnings.map((warning) => warning.message);
    expect(payment).to.be.empty;

    expect(warningNegativeAmount).to.equal(
      "1: Only positive amounts possible: -1"
    );
    expect(warningTooHighDecimals).to.equal("2: Invalid decimals: 19");
    expect(warningUndefinedDecimals).to.equal("3: Invalid decimals: undefined");
    expect(warningInvalidTokenAddress).to.equal(
      "4: Invalid Token Address: 0x420"
    );
    expect(warningInvalidReceiverAddress).to.equal(
      "5: Invalid Receiver Address: 0x420"
    );
  });
});
