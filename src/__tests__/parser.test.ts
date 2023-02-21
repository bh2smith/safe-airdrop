import { renderHook } from "@testing-library/react-hooks";

import type { CollectibleTokenInfoProvider } from "../hooks/collectibleTokenInfoProvider";
import * as useCollectibleTokenInfoProvider from "../hooks/collectibleTokenInfoProvider";
import * as useEnsResolver from "../hooks/ens";
import type { EnsResolver } from "../hooks/ens";
import * as useTokenInfoProvider from "../hooks/token";
import { TokenMap, MinimalTokenInfo, fetchTokenList, TokenInfoProvider } from "../hooks/token";
import { AssetTransfer, CollectibleTransfer, useCsvParser } from "../hooks/useCsvParser";
import { testData } from "../test/util";

const HEADER_ERC20 = "token_type,token_address,receiver,amount";

let tokenList: TokenMap;
let listedToken: MinimalTokenInfo;

const validReceiverAddress = testData.addresses.receiver1;

/**
 * concatenates csv row arrays into one string.
 * @param rows array of row-arrays
 */
const csvStringFromRows = (
  rows: string[][],
  headerRow: string = "token_type,token_address,receiver,amount,id",
): string => {
  return [headerRow, ...rows.map((row) => row.join(","))].join("\n");
};

describe("Parsing CSVs ", () => {
  let mockTokenInfoProvider: TokenInfoProvider;
  let mockCollectibleTokenInfoProvider: CollectibleTokenInfoProvider;
  let mockEnsResolver: EnsResolver;

  beforeEach(async () => {
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
    jest.spyOn(useTokenInfoProvider, "useTokenInfoProvider").mockReturnValue(mockTokenInfoProvider);

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
    jest
      .spyOn(useCollectibleTokenInfoProvider, "useCollectibleTokenInfoProvider")
      .mockReturnValue(mockCollectibleTokenInfoProvider);

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
    jest.spyOn(useEnsResolver, "useEnsResolver").mockReturnValue(mockEnsResolver);
  });

  it("should throw errors for invalid CSVs", async () => {
    const { result } = renderHook(() => useCsvParser());
    // this csv contains more values than headers in row1
    const invalidCSV = "head1,header2\nvalue1,value2,value3";
    expect(result.current.parseCsv(invalidCSV)).resolves.toEqual([
      [],
      [{ lineNo: 0, message: "Unknown header field(s): head1, header2", severity: "error" }],
    ]);
  });

  it("should skip files with >400 lines of transfers", async () => {
    const { result } = renderHook(() => useCsvParser());

    let largeCSV = csvStringFromRows(
      Array(501).fill(["erc20", listedToken.address, validReceiverAddress, "1"]),
      "token_type,token_address,receiver,amount",
    );
    expect(result.current.parseCsv(largeCSV)).rejects.toEqual(
      "Max number of lines exceeded. Due to the block gas limit transactions are limited to 500 lines.",
    );
  });

  it("should transform simple, valid CSVs correctly", async () => {
    const { result } = renderHook(() => useCsvParser());

    const rowWithoutDecimal = ["erc20", listedToken.address, validReceiverAddress, "1"];
    const rowWithDecimalAmount = ["erc20", listedToken.address, validReceiverAddress, "69.420"];
    const rowWithoutTokenAddress = ["native", "", validReceiverAddress, "1"];

    const [payment, warnings] = await result.current.parseCsv(
      csvStringFromRows([rowWithoutDecimal, rowWithDecimalAmount, rowWithoutTokenAddress], HEADER_ERC20),
    );
    expect(warnings).toHaveLength(0);
    expect(payment).toHaveLength(3);
    const [paymentWithoutDecimal, paymentWithDecimal, paymentWithoutTokenAddress] = payment as AssetTransfer[];
    expect(paymentWithoutDecimal.decimals).toEqual(18);
    expect(paymentWithoutDecimal.receiver).toEqual(validReceiverAddress);
    expect(paymentWithoutDecimal.tokenAddress).toEqual(listedToken.address);
    expect(paymentWithoutDecimal.amount).toEqual("1");
    expect(paymentWithoutDecimal.receiverEnsName).toBeNull();

    expect(paymentWithDecimal.receiver).toEqual(validReceiverAddress);
    expect(paymentWithDecimal.tokenAddress?.toLowerCase()).toEqual(listedToken.address.toLowerCase());
    expect(paymentWithDecimal.decimals).toEqual(18);
    expect(paymentWithDecimal.amount).toEqual("69.420");
    expect(paymentWithDecimal.receiverEnsName).toBeNull();

    expect(paymentWithoutTokenAddress.decimals).toEqual(18);
    expect(paymentWithoutTokenAddress.receiver).toEqual(validReceiverAddress);
    expect(paymentWithoutTokenAddress.tokenAddress).toEqual(null);
    expect(paymentWithoutTokenAddress.amount).toEqual("1");
    expect(paymentWithoutTokenAddress.receiverEnsName).toBeNull();
  });

  it("should generate erc20 validation warnings", async () => {
    const { result } = renderHook(() => useCsvParser());

    const rowWithNegativeAmount = ["erc20", listedToken.address, validReceiverAddress, "-1"];

    const unlistedTokenWithoutDecimalInContract = [
      "erc20",
      testData.unlistedERC20Token.address,
      validReceiverAddress,
      "1",
    ];
    const rowWithInvalidTokenAddress = ["erc20", "0x420", validReceiverAddress, "1"];
    const rowWithInvalidReceiverAddress = ["erc20", listedToken.address, "0x420", "1"];

    const [payment, warnings] = await result.current.parseCsv(
      csvStringFromRows(
        [
          rowWithNegativeAmount,
          unlistedTokenWithoutDecimalInContract,
          rowWithInvalidTokenAddress,
          rowWithInvalidReceiverAddress,
        ],
        HEADER_ERC20,
      ),
    );
    expect(warnings).toHaveLength(5);
    const [
      warningNegativeAmount,
      warningTokenNotFound,
      warningInvalidTokenAddress,
      warningInvalidTokenAddressForInvalidAddress,
      warningInvalidReceiverAddress,
    ] = warnings;
    expect(payment).toHaveLength(0);

    expect(warningNegativeAmount.message).toEqual("Only positive amounts/values possible: -1");
    expect(warningNegativeAmount.lineNo).toEqual(1);

    expect(warningTokenNotFound.message.toLowerCase()).toEqual(
      `no token contract was found at ${testData.unlistedERC20Token.address.toLowerCase()}`,
    );
    expect(warningTokenNotFound.lineNo).toEqual(2);

    expect(warningInvalidTokenAddress.message).toEqual("Invalid Token Address: 0x420");
    expect(warningInvalidTokenAddress.lineNo).toEqual(3);
    expect(warningInvalidTokenAddressForInvalidAddress.message).toEqual(`No token contract was found at 0x420`);
    expect(warningInvalidTokenAddressForInvalidAddress.lineNo).toEqual(3);

    expect(warningInvalidReceiverAddress.message).toEqual("Invalid Receiver Address: 0x420");
    expect(warningInvalidReceiverAddress.lineNo).toEqual(4);
  });

  it("tries to resolve ens names", async () => {
    const { result } = renderHook(() => useCsvParser());

    const receiverEnsName = ["erc20", listedToken.address, "receiver1.eth", "1"];
    const tokenEnsName = ["erc20", "token.eth", validReceiverAddress, "69.420"];
    const unknownReceiverEnsName = ["erc20", listedToken.address, "unknown.eth", "1"];
    const unknownTokenEnsName = ["erc20", "unknown.eth", "receiver1.eth", "1"];

    const [payment, warnings] = await result.current.parseCsv(
      csvStringFromRows([receiverEnsName, tokenEnsName, unknownReceiverEnsName, unknownTokenEnsName], HEADER_ERC20),
    );
    expect(warnings).toHaveLength(3);
    expect(payment).toHaveLength(2);
    const [paymentReceiverEnsName, paymentTokenEnsName] = payment as AssetTransfer[];
    const [warningUnknownReceiverEnsName, warningInvalidTokenAddress, warningInvalidContract] = warnings;
    expect(paymentReceiverEnsName.decimals).toEqual(18);
    expect(paymentReceiverEnsName.receiver).toEqual(testData.addresses.receiver1);
    expect(paymentReceiverEnsName.tokenAddress).toEqual(listedToken.address);
    expect(paymentReceiverEnsName.amount).toEqual("1");
    expect(paymentReceiverEnsName.receiverEnsName).toEqual("receiver1.eth");

    expect(paymentTokenEnsName.receiver).toEqual(validReceiverAddress);
    expect(paymentTokenEnsName.tokenAddress?.toLowerCase()).toEqual(listedToken.address.toLowerCase());
    expect(paymentTokenEnsName.decimals).toEqual(18);
    expect(paymentTokenEnsName.amount).toEqual("69.420");
    expect(paymentReceiverEnsName.receiverEnsName).toEqual("receiver1.eth");

    expect(warningUnknownReceiverEnsName.lineNo).toEqual(3);
    expect(warningUnknownReceiverEnsName.message).toEqual("Invalid Receiver Address: unknown.eth");

    expect(warningInvalidTokenAddress.lineNo).toEqual(4);
    expect(warningInvalidTokenAddress.message).toEqual("Invalid Token Address: unknown.eth");

    expect(warningInvalidContract.lineNo).toEqual(4);
    expect(warningInvalidContract.message).toEqual("No token contract was found at unknown.eth");
  });

  it("parses valid collectible transfers", async () => {
    const { result } = renderHook(() => useCsvParser());

    const rowWithErc721AndAddress = ["nft", testData.addresses.dummyErc721Address, validReceiverAddress, "", "1"];
    const rowWithErc721AndENS = ["nft", testData.addresses.dummyErc721Address, "receiver2.eth", "", "69"];
    const rowWithErc721AndIDZero = ["nft", testData.addresses.dummyErc721Address, "receiver1.eth", "", "0"];
    const rowWithErc1155AndAddress = ["nft", testData.addresses.dummyErc1155Address, validReceiverAddress, "69", "420"];
    const rowWithErc1155AndENS = ["nft", testData.addresses.dummyErc1155Address, "receiver3.eth", "9", "99"];

    const [payment, warnings] = await result.current.parseCsv(
      csvStringFromRows([
        rowWithErc721AndAddress,
        rowWithErc721AndENS,
        rowWithErc721AndIDZero,
        rowWithErc1155AndAddress,
        rowWithErc1155AndENS,
      ]),
    );
    expect(warnings).toHaveLength(0);
    expect(payment).toHaveLength(5);
    const [
      transferErc721AndAddress,
      transferErc721AndENS,
      transferErc721AndIDZero,
      transferErc1155AndAddress,
      transferErc1155AndENS,
    ] = payment as CollectibleTransfer[];
    expect(transferErc721AndAddress.receiver).toEqual(validReceiverAddress);
    expect(transferErc721AndAddress.tokenAddress).toEqual(testData.addresses.dummyErc721Address);
    expect(transferErc721AndAddress.amount).toBeUndefined();
    expect(transferErc721AndAddress.tokenId).toEqual("1");
    expect(transferErc721AndAddress.receiverEnsName).toBeNull();

    expect(transferErc721AndENS.receiver).toEqual(testData.addresses.receiver2);
    expect(transferErc721AndENS.tokenAddress).toEqual(testData.addresses.dummyErc721Address);
    expect(transferErc721AndENS.tokenId).toEqual("69");
    expect(transferErc721AndENS.amount).toBeUndefined();
    expect(transferErc721AndENS.receiverEnsName).toEqual("receiver2.eth");

    expect(transferErc721AndIDZero.receiver).toEqual(testData.addresses.receiver1);
    expect(transferErc721AndIDZero.tokenAddress).toEqual(testData.addresses.dummyErc721Address);
    expect(transferErc721AndIDZero.tokenId).toEqual("0");
    expect(transferErc721AndIDZero.amount).toBeUndefined();
    expect(transferErc721AndIDZero.receiverEnsName).toEqual("receiver1.eth");

    expect(transferErc1155AndAddress.receiver).toEqual(validReceiverAddress);
    expect(transferErc1155AndAddress.tokenAddress.toLowerCase()).toEqual(
      testData.addresses.dummyErc1155Address.toLowerCase(),
    );
    expect(transferErc1155AndAddress.amount).not.toBeUndefined();
    expect(transferErc1155AndAddress.amount).toEqual("69");
    expect(transferErc1155AndAddress.tokenId).toEqual("420");
    expect(transferErc1155AndAddress.receiverEnsName).toBeNull();

    expect(transferErc1155AndENS.receiver).toEqual(testData.addresses.receiver3);
    expect(transferErc1155AndENS.tokenAddress.toLowerCase()).toEqual(
      testData.addresses.dummyErc1155Address.toLowerCase(),
    );
    expect(transferErc1155AndENS.amount).not.toBeUndefined();
    expect(transferErc1155AndENS.amount).toEqual("9");
    expect(transferErc1155AndENS.tokenId).toEqual("99");
    expect(transferErc1155AndENS.receiverEnsName).toEqual("receiver3.eth");
  });

  it("should generate erc721/erc1155 validation warnings", async () => {
    const { result } = renderHook(() => useCsvParser());

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

    const [payment, warnings] = await result.current.parseCsv(
      csvStringFromRows([
        rowErc1155WithNegativeValue,
        rowErc1155WithDecimalValue,
        rowErc1155WithMissingId,
        rowErc1155WithInvalidTokenAddress,
        rowErc1155WithInvalidReceiverAddress,
        rowErc721WithNegativeId,
        rowErc721WithDecimalId,
        rowErc721WithMissingId,
        rowErc721WithInvalidToken,
        rowErc721WithInvalidReceiver,
      ]),
    );
    expect(warnings).toHaveLength(14);
    const [
      warningErc1155WithNegativeValue,
      warningErc1155WithDecimalValue,
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
    expect(payment).toHaveLength(0);

    expect(warningErc1155WithNegativeValue.lineNo).toEqual(1);
    expect(warningErc1155WithNegativeValue.message).toEqual("ERC1155 Tokens need a defined value > 0: -1");

    expect(warningErc1155WithDecimalValue.lineNo).toEqual(2);
    expect(warningErc1155WithDecimalValue.message).toEqual("Value / amount of ERC1155 must be an integer: 1.5");

    expect(warningErc1155WithMissingId.lineNo).toEqual(3);
    expect(warningErc1155WithMissingId.message).toEqual("Only positive Token IDs possible: NaN");

    expect(warningErc1155WithMissingId2.lineNo).toEqual(3);
    expect(warningErc1155WithMissingId2.message).toEqual("Token IDs must be integer numbers: NaN");

    expect(warningErc1155WithInvalidTokenAddress.lineNo).toEqual(4);
    expect(warningErc1155WithInvalidTokenAddress.message).toEqual("Invalid Token Address: 0xwhoopsie");

    expect(warningErc1155WithInvalidTokenAddress2.lineNo).toEqual(4);
    expect(warningErc1155WithInvalidTokenAddress2.message).toEqual("No token contract was found at 0xwhoopsie");

    expect(warningErc1155WithInvalidReceiverAddress.lineNo).toEqual(5);
    expect(warningErc1155WithInvalidReceiverAddress.message).toEqual("Invalid Receiver Address: 0xwhoopsie");

    expect(warningErc721WithNegativeId.lineNo).toEqual(6);
    expect(warningErc721WithNegativeId.message).toEqual("Only positive Token IDs possible: -20");

    expect(warningErc721WithDecimalId.lineNo).toEqual(7);
    expect(warningErc721WithDecimalId.message).toEqual("Token IDs must be integer numbers: 69.42");

    expect(warningErc721WithMissingId.lineNo).toEqual(8);
    expect(warningErc721WithMissingId.message).toEqual("Only positive Token IDs possible: NaN");

    expect(warningErc721WithMissingId2.lineNo).toEqual(8);
    expect(warningErc721WithMissingId2.message).toEqual("Token IDs must be integer numbers: NaN");

    expect(warningErc721WithInvalidToken.lineNo).toEqual(9);
    expect(warningErc721WithInvalidToken.message).toEqual("Invalid Token Address: 0xwhoopsie");

    expect(warningErc721WithInvalidToken2.lineNo).toEqual(9);
    expect(warningErc721WithInvalidToken2.message).toEqual("No token contract was found at 0xwhoopsie");

    expect(warningErc721WithInvalidReceiver.lineNo).toEqual(10);
    expect(warningErc721WithInvalidReceiver.message).toEqual("Invalid Receiver Address: 0xwhoopsie");
  });

  describe("Support backward compatibility", () => {
    it("fallback to erc20 without token_type", async () => {
      const { result } = renderHook(() => useCsvParser());

      const missingTokenType = ["", listedToken.address, validReceiverAddress, "15"];

      const [payment] = await result.current.parseCsv(csvStringFromRows([missingTokenType], HEADER_ERC20));
      expect(payment).toHaveLength(1);
      const [erc20Transfer] = payment as AssetTransfer[];

      expect(erc20Transfer.token_type).toEqual("erc20");
    });

    it("allow value instead of amount column", async () => {
      const { result } = renderHook(() => useCsvParser());

      const nativeTransfer = ["native", listedToken.address, validReceiverAddress, "15"];
      const headerRow = "token_type,token_address,receiver,value";
      const csvString = [headerRow, nativeTransfer.join(",")].join("\n");

      const [payment, warnings] = await result.current.parseCsv(csvString);
      expect(warnings).toHaveLength(0);
      expect(payment).toHaveLength(1);
      const [nativeTransferData] = payment as AssetTransfer[];

      expect(nativeTransferData.amount).toEqual("15");
    });
  });
});
