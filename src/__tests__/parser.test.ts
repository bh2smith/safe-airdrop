/* eslint-disable @typescript-eslint/no-unused-expressions */
import { BigNumber } from "bignumber.js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import { TokenMap, MinimalTokenInfo, fetchTokenList, TokenInfoProvider } from "../hooks/token";
import { parseCSV } from "../parser";
import { testData } from "../test/util";

let tokenList: TokenMap;
let listedToken: MinimalTokenInfo;

const validReceiverAddress = testData.addresses.receiver1;

// this lets us handle expectations on Promises.
chai.use(chaiAsPromised);

/**
 * concatenates csv row arrays into one string.
 * @param rows array of row-arrays
 */
const csvStringFromRows = (...rows: string[][]): string => {
  const headerRow = "token_address,receiver,amount";
  return [headerRow, ...rows.map((row) => row.join(","))].join("\n");
};

describe("Parsing CSVs ", () => {
  let mockTokenInfoProvider: TokenInfoProvider;

  beforeAll(async () => {
    tokenList = await fetchTokenList(testData.dummySafeInfo.network);
    const fetchTokenFromList = async (tokenAddress: string) => {
      return tokenList.get(tokenAddress);
    };
    mockTokenInfoProvider = {
      getTokenInfo: fetchTokenFromList,
    };

    let listedTokens = Array.from(tokenList.keys());
    const firstTokenInfo = tokenList.get(listedTokens[0]);
    if (typeof firstTokenInfo !== "undefined") {
      listedToken = firstTokenInfo;
    }
  });

  it("should throw errors for invalid CSVs", async () => {
    // thins csv contains more values than headers in row1
    const invalidCSV = "head1,header2\nvalue1,value2,value3";
    expect(parseCSV(invalidCSV, mockTokenInfoProvider)).to.be.rejectedWith(
      "column header mismatch expected: 2 columns got: 3",
    );
  });

  it("should transform simple, valid CSVs correctly", async () => {
    const rowWithoutDecimal = [listedToken.address, validReceiverAddress, "1"];
    const rowWithDecimalAmount = [listedToken.address, validReceiverAddress, "69.420"];
    const rowWithoutTokenAddress = ["", validReceiverAddress, "1"];

    const [payment, warnings] = await parseCSV(
      csvStringFromRows(rowWithoutDecimal, rowWithDecimalAmount, rowWithoutTokenAddress),
      mockTokenInfoProvider,
    );
    expect(warnings).to.be.empty;
    expect(payment).to.have.lengthOf(3);
    const [paymentWithoutDecimal, paymentWithDecimal, paymentWithoutTokenAddress] = payment;
    expect(paymentWithoutDecimal.decimals).to.be.equal(18);
    expect(paymentWithoutDecimal.receiver).to.equal(validReceiverAddress);
    expect(paymentWithoutDecimal.tokenAddress).to.equal(listedToken.address);
    expect(paymentWithoutDecimal.amount.isEqualTo(new BigNumber(1))).to.be.true;

    expect(paymentWithDecimal.receiver).to.equal(validReceiverAddress);
    expect(paymentWithDecimal.tokenAddress?.toLowerCase()).to.equal(listedToken.address.toLowerCase());
    expect(paymentWithDecimal.decimals).to.equal(18);
    expect(paymentWithDecimal.amount.isEqualTo(new BigNumber(69.42))).to.be.true;

    expect(paymentWithoutTokenAddress.decimals).to.be.equal(18);
    expect(paymentWithoutTokenAddress.receiver).to.equal(validReceiverAddress);
    expect(paymentWithoutTokenAddress.tokenAddress).to.equal(null);
    expect(paymentWithoutTokenAddress.amount.isEqualTo(new BigNumber(1))).to.be.true;
  });

  it("should generate validation warnings", async () => {
    const rowWithNegativeAmount = [listedToken.address, validReceiverAddress, "-1"];

    const unlistedTokenWithoutDecimalInContract = [testData.unlistedToken.address, validReceiverAddress, "1"];
    const rowWithInvalidTokenAddress = ["0x420", validReceiverAddress, "1"];
    const rowWithInvalidReceiverAddress = [listedToken.address, "0x420", "1"];

    const [payment, warnings] = await parseCSV(
      csvStringFromRows(
        rowWithNegativeAmount,
        unlistedTokenWithoutDecimalInContract,
        rowWithInvalidTokenAddress,
        rowWithInvalidReceiverAddress,
      ),
      mockTokenInfoProvider,
    );
    expect(warnings).to.have.lengthOf(5);
    const [
      warningNegativeAmount,
      warningTokenNotFound,
      warningInvalidTokenAddress,
      warningInvalidTokenAddressForInvalidAddress,
      warningInvalidReceiverAddress,
    ] = warnings;
    expect(payment).to.be.empty;

    expect(warningNegativeAmount.message).to.equal("Only positive amounts possible: -1");
    expect(warningNegativeAmount.lineNo).to.equal(1);

    expect(warningTokenNotFound.message.toLowerCase()).to.equal(
      `no valid token contract with tokens was found at ${testData.unlistedToken.address.toLowerCase()}`,
    );
    expect(warningTokenNotFound.lineNo).to.equal(2);

    expect(warningInvalidTokenAddress.message).to.equal("Invalid Token Address: 0x420");
    expect(warningInvalidTokenAddress.lineNo).to.equal(3);
    expect(warningInvalidTokenAddressForInvalidAddress.message).to.equal(
      `No valid token contract with tokens was found at 0x420`,
    );
    expect(warningInvalidTokenAddressForInvalidAddress.lineNo).to.equal(3);

    expect(warningInvalidReceiverAddress.message).to.equal("Invalid Receiver Address: 0x420");
    expect(warningInvalidReceiverAddress.lineNo).to.equal(4);
  });
});
