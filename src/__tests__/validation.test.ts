import { BigNumber } from "bignumber.js";

import { fetchTokenList, MinimalTokenInfo } from "../hooks/token";
import { UnknownTransfer, AssetTransfer, CollectibleTransfer } from "../hooks/useCsvParser";
import { validateRow, validateAssetRow, validateCollectibleRow } from "../parser/validation";
import { testData } from "../test/util";

const dummySafeInfo = testData.dummySafeInfo;
let listedToken: MinimalTokenInfo;

describe("validateRow", () => {
  it("should return warnings for unknown token_type", () => {
    const unknownTransfer: UnknownTransfer = { token_type: "unknown" };
    const result = validateRow(unknownTransfer);
    expect(result).toEqual(["Unknown token_type: Must be one of erc20, native or nft"]);
  });

  it("should call validateAssetRow for erc20", () => {
    const assetTransfer: AssetTransfer = {
      token_type: "erc20",
      tokenAddress: null,
      receiver: testData.addresses.receiver1,
      amount: "1",
      decimals: 18,
      receiverEnsName: null,
    };
    const result = validateRow(assetTransfer);
    expect(result).toEqual([]);
  });

  it("should call validateCollectibleRow for erc721", () => {
    const collectibleTransfer: CollectibleTransfer = {
      token_type: "erc721",
      tokenAddress: testData.addresses.dummyErc721Address,
      receiver: testData.addresses.receiver1,
      tokenId: new BigNumber("69").toFixed(),
      from: testData.dummySafeInfo.safeAddress,
      receiverEnsName: null,
    };
    const result = validateRow(collectibleTransfer);
    expect(result).toEqual([]);
  });
});

describe("validateAssetRow", () => {
  beforeAll(async () => {
    const tokenList = await fetchTokenList(dummySafeInfo.chainId);
    let listedTokens = Array.from(tokenList.keys());
    const tokenInfo = tokenList.get(listedTokens[0]);
    if (typeof tokenInfo !== "undefined") {
      listedToken = tokenInfo;
    }
  });

  it("should validate positive amount", () => {
    const assetTransfer: AssetTransfer = {
      token_type: "erc20",
      tokenAddress: listedToken.address,
      receiver: testData.addresses.receiver1,
      amount: "-1",
      decimals: listedToken.decimals,
      receiverEnsName: null,
    };
    const result = validateAssetRow(assetTransfer);
    expect(result).toContain("Only positive amounts/values possible: -1");
  });

  it("should validate if token is found", () => {
    const assetTransfer: AssetTransfer = {
      token_type: "erc20",
      tokenAddress: listedToken.address,
      receiver: testData.addresses.receiver1,
      amount: "10",
      decimals: -1,
      symbol: "TOKEN_NOT_FOUND",
      receiverEnsName: null,
    };
    const result = validateAssetRow(assetTransfer);
    expect(result).toContain("No token contract was found at " + listedToken.address);
  });
});

describe("validateCollectibleRow", () => {
  it("should validate positive token ID", () => {
    const collectibleTransfer: CollectibleTransfer = {
      token_type: "erc721",
      tokenAddress: testData.addresses.dummyErc721Address,
      receiver: testData.addresses.receiver1,
      tokenId: "-1",
      from: testData.dummySafeInfo.safeAddress,
      receiverEnsName: null,
    };
    const result = validateCollectibleRow(collectibleTransfer);
    expect(result).toContain("Only positive Token IDs possible: -1");
  });

  it("should validate integer token ID", () => {
    const collectibleTransfer: CollectibleTransfer = {
      token_type: "erc721",
      tokenAddress: testData.addresses.dummyErc721Address,
      receiver: testData.addresses.receiver1,
      tokenId: "1.5",
      from: testData.dummySafeInfo.safeAddress,
      receiverEnsName: null,
    };
    const result = validateCollectibleRow(collectibleTransfer);
    expect(result).toContain("Token IDs must be integer numbers: 1.5");
  });

  it("should validate value for ERC1155 tokens", () => {
    const erc1155Transfer: CollectibleTransfer = {
      token_type: "erc1155",
      tokenAddress: testData.addresses.dummyErc721Address,
      receiver: testData.addresses.receiver1,
      tokenId: "1",
      amount: "0",
      from: testData.dummySafeInfo.safeAddress,
      receiverEnsName: null,
    };
    const result = validateCollectibleRow(erc1155Transfer);
    expect(result).toContain("ERC1155 Tokens need a defined value > 0: 0");
  });
});
