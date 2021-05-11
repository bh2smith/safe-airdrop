/* eslint-disable @typescript-eslint/no-unused-expressions */
import { TokenInfo } from "@uniswap/token-lists";
import { BigNumber } from "bignumber.js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import { TokenMap, fetchTokenList } from "../hooks/tokenList";
import { parseCSV } from "../parser";
import { testData } from "../test/util";

let tokenList: TokenMap;
let listedTokens: string[];
let listedToken: TokenInfo;

const validReceiverAddress = testData.addresses.receiver1;
const unlistedTokenAddress = testData.unlistedToken.address;

// this lets us handle expectations on Promises.
chai.use(chaiAsPromised);

/**
 * concatenates csv row arrays into one string.
 * @param rows array of row-arrays
 */
const csvStringFromRows = (...rows: string[][]): string => {
  const headerRow = "token_address,receiver,amount,decimals";
  return [headerRow, ...rows.map((row) => row.join(","))].join("\n");
};

describe("Parsing CSVs ", () => {
  beforeAll(async () => {
    tokenList = await fetchTokenList(testData.dummySafeInfo.network);
    listedTokens = Array.from(tokenList.keys());
    listedToken = tokenList.get(listedTokens[0]);
  });

  it("should throw errors for invalid CSVs", async () => {
    // thins csv contains more values than headers in row1
    const invalidCSV = "head1,header2\nvalue1,value2,value3";
    expect(parseCSV(invalidCSV, tokenList)).to.be.rejectedWith(
      "column header mismatch expected: 2 columns got: 3"
    );
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
    expect(paymentWithoutTokenAddress.tokenAddress).to.equal(null);
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
      "-2",
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
      warningNegativeDecimals,
      warningUndefinedDecimals,
      warningInvalidTokenAddress,
      warningInvalidReceiverAddress,
    ] = warnings;
    expect(payment).to.be.empty;

    expect(warningNegativeAmount.message).to.equal(
      "Only positive amounts possible: -1"
    );
    expect(warningNegativeAmount.lineNo).to.equal(1);
    expect(warningNegativeDecimals.message).to.equal("Invalid decimals: -2");
    expect(warningNegativeDecimals.lineNo).to.equal(2);

    expect(warningUndefinedDecimals.message).to.equal(
      "Invalid decimals: undefined"
    );
    expect(warningUndefinedDecimals.lineNo).to.equal(3);

    expect(warningInvalidTokenAddress.message).to.equal(
      "Invalid Token Address: 0x420"
    );
    expect(warningInvalidTokenAddress.lineNo).to.equal(4);

    expect(warningInvalidReceiverAddress.message).to.equal(
      "Invalid Receiver Address: 0x420"
    );
    expect(warningInvalidReceiverAddress.lineNo).to.equal(5);
  });
});
