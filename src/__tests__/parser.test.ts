/* eslint-disable @typescript-eslint/no-unused-expressions */
import { BigNumber } from "bignumber.js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import { CollectibleTokenInfoProvider } from "../hooks/collectibleTokenInfoProvider";
import { EnsResolver } from "../hooks/ens";
import { TokenMap, MinimalTokenInfo, fetchTokenList, TokenInfoProvider } from "../hooks/token";
import { AssetTransfer, CollectibleTransfer, CSVParser } from "../parser/csvParser";
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
  const headerRow = "token_type,token_address,receiver,amount,id";
  return [headerRow, ...rows.map((row) => row.join(","))].join("\n");
};

describe("Parsing CSVs ", () => {
  let mockTokenInfoProvider: TokenInfoProvider;
  let mockCollectibleTokenInfoProvider: CollectibleTokenInfoProvider;
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
      getNativeTokenSymbol: () => "ETH",
      getSelectedNetworkShortname: () => "eth",
    };

    mockCollectibleTokenInfoProvider = {
      getFromAddress: () => testData.dummySafeInfo.safeAddress,
      getTokenInfo: async (tokenAddress) => {
        switch (tokenAddress.toLowerCase()) {
          case testData.addresses.dummyErc721Address:
            return testData.dummyERC721Token;
          case testData.addresses.dummyErc1155Address:
            return testData.dummyERC1155Token;
          default:
            return undefined;
        }
      },
      fetchMetaInfo: jest.fn(),
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
      isEnsEnabled: async () => true,
    };
  });

  it("should throw errors for invalid CSVs", async () => {
    // this csv contains more values than headers in row1
    const invalidCSV = "head1,header2\nvalue1,value2,value3";
    expect(
      CSVParser.parseCSV(invalidCSV, mockTokenInfoProvider, mockCollectibleTokenInfoProvider, mockEnsResolver),
    ).to.be.rejectedWith("column header mismatch expected: 2 columns got: 3");
  });

  it("should skip files with >400 lines of transfers", async () => {
    let largeCSV = csvStringFromRows(...Array(401).fill(["erc20", listedToken.address, validReceiverAddress, "1"]));
    expect(
      CSVParser.parseCSV(largeCSV, mockTokenInfoProvider, mockCollectibleTokenInfoProvider, mockEnsResolver),
    ).to.be.rejectedWith(
      "Max number of lines exceeded. Due to the block gas limit transactions are limited to 400 lines.",
    );
  });

  it("should throw errors for unexpected errors while parsing", async () => {
    // we hard coded in our mock that a ens of "error.eth" throws an error.
    const rowWithErrorReceiver = ["erc20", listedToken.address, "error.eth", "1"];
    expect(
      CSVParser.parseCSV(
        csvStringFromRows(rowWithErrorReceiver),
        mockTokenInfoProvider,
        mockCollectibleTokenInfoProvider,
        mockEnsResolver,
      ),
    ).to.be.rejectedWith("unexpected error!");
  });

  it("should transform simple, valid CSVs correctly", async () => {
    const rowWithoutDecimal = ["erc20", listedToken.address, validReceiverAddress, "1"];
    const rowWithDecimalAmount = ["erc20", listedToken.address, validReceiverAddress, "69.420"];
    const rowWithoutTokenAddress = ["native", "", validReceiverAddress, "1"];

    const [payment, warnings] = await CSVParser.parseCSV(
      csvStringFromRows(rowWithoutDecimal, rowWithDecimalAmount, rowWithoutTokenAddress),
      mockTokenInfoProvider,
      mockCollectibleTokenInfoProvider,
      mockEnsResolver,
    );
    expect(warnings).to.be.empty;
    expect(payment).to.have.lengthOf(3);
    const [paymentWithoutDecimal, paymentWithDecimal, paymentWithoutTokenAddress] = payment as AssetTransfer[];
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

  it("should generate erc20 validation warnings", async () => {
    const rowWithNegativeAmount = ["erc20", listedToken.address, validReceiverAddress, "-1"];

    const unlistedTokenWithoutDecimalInContract = [
      "erc20",
      testData.unlistedERC20Token.address,
      validReceiverAddress,
      "1",
    ];
    const rowWithInvalidTokenAddress = ["erc20", "0x420", validReceiverAddress, "1"];
    const rowWithInvalidReceiverAddress = ["erc20", listedToken.address, "0x420", "1"];

    const [payment, warnings] = await CSVParser.parseCSV(
      csvStringFromRows(
        rowWithNegativeAmount,
        unlistedTokenWithoutDecimalInContract,
        rowWithInvalidTokenAddress,
        rowWithInvalidReceiverAddress,
      ),
      mockTokenInfoProvider,
      mockCollectibleTokenInfoProvider,
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

    expect(warningNegativeAmount.message).to.equal("Only positive amounts/values possible: -1");
    expect(warningNegativeAmount.lineNo).to.equal(1);

    expect(warningTokenNotFound.message.toLowerCase()).to.equal(
      `no token contract was found at ${testData.unlistedERC20Token.address.toLowerCase()}`,
    );
    expect(warningTokenNotFound.lineNo).to.equal(2);

    expect(warningInvalidTokenAddress.message).to.equal("Invalid Token Address: 0x420");
    expect(warningInvalidTokenAddress.lineNo).to.equal(3);
    expect(warningInvalidTokenAddressForInvalidAddress.message).to.equal(`No token contract was found at 0x420`);
    expect(warningInvalidTokenAddressForInvalidAddress.lineNo).to.equal(3);

    expect(warningInvalidReceiverAddress.message).to.equal("Invalid Receiver Address: 0x420");
    expect(warningInvalidReceiverAddress.lineNo).to.equal(4);
  });

  it("tries to resolve ens names", async () => {
    const receiverEnsName = ["erc20", listedToken.address, "receiver1.eth", "1"];
    const tokenEnsName = ["erc20", "token.eth", validReceiverAddress, "69.420"];
    const unknownReceiverEnsName = ["erc20", listedToken.address, "unknown.eth", "1"];
    const unknownTokenEnsName = ["erc20", "unknown.eth", "receiver1.eth", "1"];

    const [payment, warnings] = await CSVParser.parseCSV(
      csvStringFromRows(receiverEnsName, tokenEnsName, unknownReceiverEnsName, unknownTokenEnsName),
      mockTokenInfoProvider,
      mockCollectibleTokenInfoProvider,
      mockEnsResolver,
    );
    expect(warnings).to.have.lengthOf(3);
    expect(payment).to.have.lengthOf(2);
    const [paymentReceiverEnsName, paymentTokenEnsName] = payment as AssetTransfer[];
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

  it("parses valid collectible transfers", async () => {
    const rowWithErc721AndAddress = ["nft", testData.addresses.dummyErc721Address, validReceiverAddress, "", "1"];
    const rowWithErc721AndENS = ["nft", testData.addresses.dummyErc721Address, "receiver2.eth", "", "69"];
    const rowWithErc1155AndAddress = ["nft", testData.addresses.dummyErc1155Address, validReceiverAddress, "69", "420"];
    const rowWithErc1155AndENS = ["nft", testData.addresses.dummyErc1155Address, "receiver3.eth", "9", "99"];

    const [payment, warnings] = await CSVParser.parseCSV(
      csvStringFromRows(rowWithErc721AndAddress, rowWithErc721AndENS, rowWithErc1155AndAddress, rowWithErc1155AndENS),
      mockTokenInfoProvider,
      mockCollectibleTokenInfoProvider,
      mockEnsResolver,
    );
    expect(warnings).to.be.empty;
    expect(payment).to.have.lengthOf(4);
    const [transferErc721AndAddress, transferErc721AndENS, transferErc1155AndAddress, transferErc1155AndENS] =
      payment as CollectibleTransfer[];
    expect(transferErc721AndAddress.receiver).to.equal(validReceiverAddress);
    expect(transferErc721AndAddress.tokenAddress).to.equal(testData.addresses.dummyErc721Address);
    expect(transferErc721AndAddress.amount).to.be.undefined;
    expect(transferErc721AndAddress.tokenId.isEqualTo(new BigNumber(1))).to.be.true;
    expect(transferErc721AndAddress.receiverEnsName).to.be.null;

    expect(transferErc721AndENS.receiver).to.equal(testData.addresses.receiver2);
    expect(transferErc721AndENS.tokenAddress).to.equal(testData.addresses.dummyErc721Address);
    expect(transferErc721AndENS.tokenId.isEqualTo(new BigNumber(69))).to.be.true;
    expect(transferErc721AndENS.amount).to.be.undefined;
    expect(transferErc721AndENS.receiverEnsName).to.equal("receiver2.eth");

    expect(transferErc1155AndAddress.receiver).to.equal(validReceiverAddress);
    expect(transferErc1155AndAddress.tokenAddress.toLowerCase()).to.equal(
      testData.addresses.dummyErc1155Address.toLowerCase(),
    );
    expect(transferErc1155AndAddress.amount).not.to.be.undefined;
    expect(transferErc1155AndAddress.amount?.isEqualTo(new BigNumber(69))).to.be.true;
    expect(transferErc1155AndAddress.tokenId.isEqualTo(new BigNumber(420))).to.be.true;
    expect(transferErc1155AndAddress.receiverEnsName).to.be.null;

    expect(transferErc1155AndENS.receiver).to.equal(testData.addresses.receiver3);
    expect(transferErc1155AndENS.tokenAddress.toLowerCase()).to.equal(
      testData.addresses.dummyErc1155Address.toLowerCase(),
    );
    expect(transferErc1155AndENS.amount).not.to.be.undefined;
    expect(transferErc1155AndENS.amount?.isEqualTo(new BigNumber(9))).to.be.true;
    expect(transferErc1155AndENS.tokenId.isEqualTo(new BigNumber(99))).to.be.true;
    expect(transferErc1155AndENS.receiverEnsName).to.equal("receiver3.eth");
  });

  it("should generate erc721/erc1155 validation warnings", async () => {
    const rowErc1155WithNegativeValue = [
      "nft",
      testData.addresses.dummyErc1155Address,
      validReceiverAddress,
      "-1",
      "5",
    ];

    const rowErc1155WithDecimalValue = [
      "nft",
      testData.addresses.dummyErc1155Address,
      validReceiverAddress,
      "1.5",
      "5",
    ];

    const rowErc1155WithMissingValue = ["nft", testData.addresses.dummyErc1155Address, validReceiverAddress, "", "5"];

    const rowErc1155WithMissingId = ["nft", testData.addresses.dummyErc1155Address, validReceiverAddress, "5", ""];

    const rowErc1155WithInvalidTokenAddress = ["nft", "0xwhoopsie", validReceiverAddress, "5", "5"];

    const rowErc1155WithInvalidReceiverAddress = [
      "nft",
      testData.addresses.dummyErc1155Address,
      "0xwhoopsie",
      "5",
      "5",
    ];

    const rowErc721WithNegativeId = ["nft", testData.addresses.dummyErc721Address, validReceiverAddress, "", "-20"];

    const rowErc721WithMissingId = ["nft", testData.addresses.dummyErc721Address, validReceiverAddress, "", ""];

    const rowErc721WithDecimalId = ["nft", testData.addresses.dummyErc721Address, validReceiverAddress, "", "69.420"];

    const rowErc721WithInvalidToken = ["nft", "0xwhoopsie", validReceiverAddress, "", "69"];

    const rowErc721WithInvalidReceiver = ["nft", testData.addresses.dummyErc721Address, "0xwhoopsie", "", "69"];

    const [payment, warnings] = await CSVParser.parseCSV(
      csvStringFromRows(
        rowErc1155WithNegativeValue,
        rowErc1155WithDecimalValue,
        rowErc1155WithMissingValue,
        rowErc1155WithMissingId,
        rowErc1155WithInvalidTokenAddress,
        rowErc1155WithInvalidReceiverAddress,
        rowErc721WithNegativeId,
        rowErc721WithDecimalId,
        rowErc721WithMissingId,
        rowErc721WithInvalidToken,
        rowErc721WithInvalidReceiver,
      ),
      mockTokenInfoProvider,
      mockCollectibleTokenInfoProvider,
      mockEnsResolver,
    );
    expect(warnings).to.have.lengthOf(15);
    const [
      warningErc1155WithNegativeValue,
      warningErc1155WithDecimalValue,
      warningErc1155WithMissingValue,
      warningErc1155WithMissingId,
      warningErc1155WithMissingId2,
      warningErc1155WithInvalidTokenAddress,
      warningErc1155WithInvalidTokenAddress2,
      warningErc1155WithInvalidReceiverAddress,
      warningErc721WithNegativeId,
      warningErc721WithDecimalId,
      warningErc721WithMissingId,
      warningErc721WithMissingId2,
      warningErc721WithInvalidToken,
      warningErc721WithInvalidToken2,
      warningErc721WithInvalidReceiver,
    ] = warnings;
    expect(payment).to.be.empty;

    expect(warningErc1155WithNegativeValue.lineNo).to.equal(1);
    expect(warningErc1155WithNegativeValue.message).to.equal("ERC1155 Tokens need a defined value > 0: -1");

    expect(warningErc1155WithDecimalValue.lineNo).to.equal(2);
    expect(warningErc1155WithDecimalValue.message).to.equal("Value of ERC1155 must be an integer: 1.5");

    expect(warningErc1155WithMissingValue.lineNo).to.equal(3);
    expect(warningErc1155WithMissingValue.message).to.equal("ERC1155 Tokens need a defined value > 0: NaN");

    expect(warningErc1155WithMissingId.lineNo).to.equal(4);
    expect(warningErc1155WithMissingId.message).to.equal("Only positive Token IDs possible: NaN");

    expect(warningErc1155WithMissingId2.lineNo).to.equal(4);
    expect(warningErc1155WithMissingId2.message).to.equal("Token IDs must be integer numbers: NaN");

    expect(warningErc1155WithInvalidTokenAddress.lineNo).to.equal(5);
    expect(warningErc1155WithInvalidTokenAddress.message).to.equal("Invalid Token Address: 0xwhoopsie");

    expect(warningErc1155WithInvalidTokenAddress2.lineNo).to.equal(5);
    expect(warningErc1155WithInvalidTokenAddress2.message).to.equal("No token contract was found at 0xwhoopsie");

    expect(warningErc1155WithInvalidReceiverAddress.lineNo).to.equal(6);
    expect(warningErc1155WithInvalidReceiverAddress.message).to.equal("Invalid Receiver Address: 0xwhoopsie");

    expect(warningErc721WithNegativeId.lineNo).to.equal(7);
    expect(warningErc721WithNegativeId.message).to.equal("Only positive Token IDs possible: -20");

    expect(warningErc721WithDecimalId.lineNo).to.equal(8);
    expect(warningErc721WithDecimalId.message).to.equal("Token IDs must be integer numbers: 69.42");

    expect(warningErc721WithMissingId.lineNo).to.equal(9);
    expect(warningErc721WithMissingId.message).to.equal("Only positive Token IDs possible: NaN");

    expect(warningErc721WithMissingId2.lineNo).to.equal(9);
    expect(warningErc721WithMissingId2.message).to.equal("Token IDs must be integer numbers: NaN");

    expect(warningErc721WithInvalidToken.lineNo).to.equal(10);
    expect(warningErc721WithInvalidToken.message).to.equal("Invalid Token Address: 0xwhoopsie");

    expect(warningErc721WithInvalidToken2.lineNo).to.equal(10);
    expect(warningErc721WithInvalidToken2.message).to.equal("No token contract was found at 0xwhoopsie");

    expect(warningErc721WithInvalidReceiver.lineNo).to.equal(11);
    expect(warningErc721WithInvalidReceiver.message).to.equal("Invalid Receiver Address: 0xwhoopsie");
  });

  describe("Support backward compatibility", () => {
    it("fallback to erc20 without token_type", async () => {
      const missingTokenType = ["", listedToken.address, validReceiverAddress, "15"];

      const [payment, warnings] = await CSVParser.parseCSV(
        csvStringFromRows(missingTokenType),
        mockTokenInfoProvider,
        mockCollectibleTokenInfoProvider,
        mockEnsResolver,
      );
      expect(warnings).to.be.empty;
      expect(payment).to.have.length(1);
      const [erc20Transfer] = payment as AssetTransfer[];

      expect(erc20Transfer.token_type).to.equal("erc20");
    });

    it("allow value instead of amount column", async () => {
      const nativeTransfer = ["native", listedToken.address, validReceiverAddress, "15"];
      const headerRow = "token_type,token_address,receiver,value,id";
      const csvString = [headerRow, nativeTransfer.join(",")].join("\n");

      const [payment, warnings] = await CSVParser.parseCSV(
        csvString,
        mockTokenInfoProvider,
        mockCollectibleTokenInfoProvider,
        mockEnsResolver,
      );
      expect(warnings).to.be.empty;
      expect(payment).to.have.length(1);
      const [nativeTransferData] = payment as AssetTransfer[];

      expect(nativeTransferData.amount.isEqualTo(new BigNumber(15))).to.be.true;
    });
  });
});
