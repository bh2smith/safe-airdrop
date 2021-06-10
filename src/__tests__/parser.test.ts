/* eslint-disable @typescript-eslint/no-unused-expressions */
import { BigNumber } from "bignumber.js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import { EnsResolver } from "../hooks/ens";
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
  let mockEnsResolver: EnsResolver;

  beforeAll(async () => {
    tokenList = await fetchTokenList(testData.dummySafeInfo.chainId);
    const fetchTokenFromList = async (tokenAddress: string) => tokenList.get(tokenAddress);

    let listedTokens = Array.from(tokenList.keys());
    const firstTokenInfo = tokenList.get(listedTokens[0]);
    if (typeof firstTokenInfo !== "undefined") {
      listedToken = firstTokenInfo;
    }

    mockTokenInfoProvider = {
      getTokenInfo: fetchTokenFromList,
    };

    mockEnsResolver = {
      resolveName: async (ensName: string) => {
        if (ensName.startsWith("0x")) {
          return ensName;
        }
        switch (ensName) {
          case "receiver1.eth":
            return testData.addresses.receiver1;
          case "receiver2.eth":
            return testData.addresses.receiver2;
          case "receiver3.eth":
            return testData.addresses.receiver3;
          case "token.eth":
            return listedToken.address;
          case "error.eth":
            throw new Error("unexpected error!");
          default:
            return null;
        }
      },
      lookupAddress: async (address: string) => {
        switch (address) {
          case testData.addresses.receiver1:
            return "receiver1.eth";
          case testData.addresses.receiver2:
            return "receiver2.eth";
          case testData.addresses.receiver3:
            return "receiver3.eth";
          case listedToken.address:
            return "token.eth";
          default:
            return null;
        }
      },
    };
  });

  it("should throw errors for invalid CSVs", async () => {
    // this csv contains more values than headers in row1
    const invalidCSV = "head1,header2\nvalue1,value2,value3";
    expect(parseCSV(invalidCSV, mockTokenInfoProvider, mockEnsResolver)).to.be.rejectedWith(
      "column header mismatch expected: 2 columns got: 3",
    );
  });

  it("should throw errors for unexpected errors while parsing", async () => {
    // we hard coded in our mock that a ens of "error.eth" throws an error.
    const rowWithErrorReceiver = [listedToken.address, "error.eth", "1"];
    expect(
      parseCSV(csvStringFromRows(rowWithErrorReceiver), mockTokenInfoProvider, mockEnsResolver),
    ).to.be.rejectedWith("unexpected error!");
  });

  it("should transform simple, valid CSVs correctly", async () => {
    const rowWithoutDecimal = [listedToken.address, validReceiverAddress, "1"];
    const rowWithDecimalAmount = [listedToken.address, validReceiverAddress, "69.420"];
    const rowWithoutTokenAddress = ["", validReceiverAddress, "1"];

    const [payment, warnings] = await parseCSV(
      csvStringFromRows(rowWithoutDecimal, rowWithDecimalAmount, rowWithoutTokenAddress),
      mockTokenInfoProvider,
      mockEnsResolver,
    );
    expect(warnings).to.be.empty;
    expect(payment).to.have.lengthOf(3);
    const [paymentWithoutDecimal, paymentWithDecimal, paymentWithoutTokenAddress] = payment;
    expect(paymentWithoutDecimal.decimals).to.be.equal(18);
    expect(paymentWithoutDecimal.receiver).to.equal(validReceiverAddress);
    expect(paymentWithoutDecimal.tokenAddress).to.equal(listedToken.address);
    expect(paymentWithoutDecimal.amount.isEqualTo(new BigNumber(1))).to.be.true;
    expect(paymentWithoutDecimal.receiverEnsName).to.be.null;

    expect(paymentWithDecimal.receiver).to.equal(validReceiverAddress);
    expect(paymentWithDecimal.tokenAddress?.toLowerCase()).to.equal(listedToken.address.toLowerCase());
    expect(paymentWithDecimal.decimals).to.equal(18);
    expect(paymentWithDecimal.amount.isEqualTo(new BigNumber(69.42))).to.be.true;
    expect(paymentWithDecimal.receiverEnsName).to.be.null;

    expect(paymentWithoutTokenAddress.decimals).to.be.equal(18);
    expect(paymentWithoutTokenAddress.receiver).to.equal(validReceiverAddress);
    expect(paymentWithoutTokenAddress.tokenAddress).to.equal(null);
    expect(paymentWithoutTokenAddress.amount.isEqualTo(new BigNumber(1))).to.be.true;
    expect(paymentWithoutTokenAddress.receiverEnsName).to.be.null;
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
      mockEnsResolver,
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
      `no token contract was found at ${testData.unlistedToken.address.toLowerCase()}`,
    );
    expect(warningTokenNotFound.lineNo).to.equal(2);

    expect(warningInvalidTokenAddress.message).to.equal("Invalid Token Address: 0x420");
    expect(warningInvalidTokenAddress.lineNo).to.equal(3);
    expect(warningInvalidTokenAddressForInvalidAddress.message).to.equal(`No token contract was found at 0x420`);
    expect(warningInvalidTokenAddressForInvalidAddress.lineNo).to.equal(3);

    expect(warningInvalidReceiverAddress.message).to.equal("Invalid Receiver Address: 0x420");
    expect(warningInvalidReceiverAddress.lineNo).to.equal(4);
  });

  it("tries to resolved ens names", async () => {
    const receiverEnsName = [listedToken.address, "receiver1.eth", "1"];
    const tokenEnsName = ["token.eth", validReceiverAddress, "69.420"];
    const unknownReceiverEnsName = [listedToken.address, "unknown.eth", "1"];
    const unknownTokenEnsName = ["unknown.eth", "receiver1.eth", "1"];

    const [payment, warnings] = await parseCSV(
      csvStringFromRows(receiverEnsName, tokenEnsName, unknownReceiverEnsName, unknownTokenEnsName),
      mockTokenInfoProvider,
      mockEnsResolver,
    );

    expect(warnings).to.have.lengthOf(3);
    expect(payment).to.have.lengthOf(2);
    const [paymentReceiverEnsName, paymentTokenEnsName] = payment;
    const [warningUnknownReceiverEnsName, warningInvalidTokenAddress, warningInvalidContract] = warnings;
    expect(paymentReceiverEnsName.decimals).to.be.equal(18);
    expect(paymentReceiverEnsName.receiver).to.equal(testData.addresses.receiver1);
    expect(paymentReceiverEnsName.tokenAddress).to.equal(listedToken.address);
    expect(paymentReceiverEnsName.amount.isEqualTo(new BigNumber(1))).to.be.true;
    expect(paymentReceiverEnsName.receiverEnsName).to.equal("receiver1.eth");

    expect(paymentTokenEnsName.receiver).to.equal(validReceiverAddress);
    expect(paymentTokenEnsName.tokenAddress?.toLowerCase()).to.equal(listedToken.address.toLowerCase());
    expect(paymentTokenEnsName.decimals).to.equal(18);
    expect(paymentTokenEnsName.amount.isEqualTo(new BigNumber(69.42))).to.be.true;
    expect(paymentReceiverEnsName.receiverEnsName).to.equal("receiver1.eth");

    expect(warningUnknownReceiverEnsName.lineNo).to.equal(3);
    expect(warningUnknownReceiverEnsName.message).to.equal("Invalid Receiver Address: unknown.eth");

    expect(warningInvalidTokenAddress.lineNo).to.equal(4);
    expect(warningInvalidTokenAddress.message).to.equal("Invalid Token Address: unknown.eth");

    expect(warningInvalidContract.lineNo).to.equal(4);
    expect(warningInvalidContract.message).to.equal("No token contract was found at unknown.eth");
  });
});
