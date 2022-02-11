import { BigNumber } from "bignumber.js";
import { expect } from "chai";
import { ethers } from "ethers";

import { fetchTokenList, MinimalTokenInfo } from "../hooks/token";
import { AssetTransfer, CollectibleTransfer } from "../parser/csvParser";
import { testData } from "../test/util";
import { erc1155Interface } from "../transfers/erc1155";
import { erc20Interface } from "../transfers/erc20";
import { erc721Interface } from "../transfers/erc721";
import { buildAssetTransfers, buildCollectibleTransfers } from "../transfers/transfers";
import { toWei, fromWei, MAX_U256, TokenInfo } from "../utils";

const dummySafeInfo = testData.dummySafeInfo;
let listedToken: MinimalTokenInfo;
const receiver = testData.addresses.receiver1;

describe("Build Transfers:", () => {
  beforeAll(async () => {
    const tokenList = await fetchTokenList(dummySafeInfo.chainId);
    let listedTokens = Array.from(tokenList.keys());
    const tokenInfo = tokenList.get(listedTokens[0]);
    if (typeof tokenInfo !== "undefined") {
      listedToken = tokenInfo;
    }
  });

  describe("Integers", () => {
    it("works with large integers on listed, unlisted and native asset transfers", () => {
      const largePayments: AssetTransfer[] = [
        // Listed ERC20
        {
          token_type: "erc20",
          receiver,
          amount: fromWei(MAX_U256, listedToken.decimals),
          tokenAddress: listedToken.address,
          decimals: listedToken.decimals,
          symbol: "LIT",
          receiverEnsName: null,
        },
        // Unlisted ERC20
        {
          token_type: "erc20",
          receiver,
          amount: fromWei(MAX_U256, testData.unlistedERC20Token.decimals),
          tokenAddress: testData.unlistedERC20Token.address,
          decimals: testData.unlistedERC20Token.decimals,
          symbol: "ULT",
          receiverEnsName: null,
        },
        // Native Asset
        {
          token_type: "native",
          receiver,
          amount: fromWei(MAX_U256, 18),
          tokenAddress: null,
          decimals: 18,
          symbol: "ETH",
          receiverEnsName: null,
        },
      ];

      const [listedTransfer, unlistedTransfer, nativeTransfer] = buildAssetTransfers(largePayments);
      expect(listedTransfer.value).to.be.equal("0");
      expect(listedTransfer.to).to.be.equal(listedToken.address);
      expect(listedTransfer.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [receiver, MAX_U256.toFixed()]),
      );

      expect(unlistedTransfer.value).to.be.equal("0");
      expect(unlistedTransfer.to).to.be.equal(testData.unlistedERC20Token.address);
      expect(unlistedTransfer.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [receiver, MAX_U256.toFixed()]),
      );

      expect(nativeTransfer.value).to.be.equal(MAX_U256.toFixed());
      expect(nativeTransfer.to).to.be.equal(receiver);
      expect(nativeTransfer.data).to.be.equal("0x");
    });
  });

  describe("Decimals", () => {
    it("works with decimal payments on listed, unlisted and native transfers", () => {
      const tinyAmount = new BigNumber("0.0000001");
      const smallPayments: AssetTransfer[] = [
        // Listed ERC20
        {
          token_type: "erc20",
          receiver,
          amount: tinyAmount,
          tokenAddress: listedToken.address,
          decimals: listedToken.decimals,
          symbol: "LIT",
          receiverEnsName: null,
        },
        // Unlisted ERC20
        {
          token_type: "erc20",
          receiver,
          amount: tinyAmount,
          tokenAddress: testData.unlistedERC20Token.address,
          decimals: testData.unlistedERC20Token.decimals,
          symbol: "ULT",
          receiverEnsName: null,
        },
        // Native Asset
        {
          token_type: "native",
          receiver,
          amount: tinyAmount,
          tokenAddress: null,
          decimals: 18,
          symbol: "ETH",
          receiverEnsName: null,
        },
      ];

      const [listed, unlisted, native] = buildAssetTransfers(smallPayments);
      expect(listed.value).to.be.equal("0");
      expect(listed.to).to.be.equal(listedToken.address);
      expect(listed.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [receiver, toWei(tinyAmount, listedToken.decimals).toFixed()]),
      );

      expect(unlisted.value).to.be.equal("0");
      expect(unlisted.to).to.be.equal(testData.unlistedERC20Token.address);
      expect(unlisted.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          toWei(tinyAmount, testData.unlistedERC20Token.decimals).toFixed(),
        ]),
      );

      expect(native.value).to.be.equal(toWei(tinyAmount, 18).toString());
      expect(native.to).to.be.equal(receiver);
      expect(native.data).to.be.equal("0x");
    });
  });

  describe("Mixed", () => {
    it("works with arbitrary value strings on listed, unlisted and native transfers", () => {
      const mixedAmount = new BigNumber("123456.000000789");
      const mixedPayments: AssetTransfer[] = [
        // Listed ERC20
        {
          token_type: "erc20",
          receiver,
          amount: mixedAmount,
          tokenAddress: listedToken.address,
          decimals: listedToken.decimals,
          symbol: "LIT",
          receiverEnsName: null,
        },
        // Unlisted ERC20
        {
          token_type: "erc20",
          receiver,
          amount: mixedAmount,
          tokenAddress: testData.unlistedERC20Token.address,
          decimals: testData.unlistedERC20Token.decimals,
          symbol: "ULT",
          receiverEnsName: null,
        },
        // Native Asset
        {
          token_type: "native",
          receiver,
          amount: mixedAmount,
          tokenAddress: null,
          decimals: 18,
          symbol: "ETH",
          receiverEnsName: null,
        },
      ];

      const [listed, unlisted, native] = buildAssetTransfers(mixedPayments);
      expect(listed.value).to.be.equal("0");
      expect(listed.to).to.be.equal(listedToken.address);
      expect(listed.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [receiver, toWei(mixedAmount, listedToken.decimals).toFixed()]),
      );

      expect(unlisted.value).to.be.equal("0");
      expect(unlisted.to).to.be.equal(testData.unlistedERC20Token.address);
      expect(unlisted.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          toWei(mixedAmount, testData.unlistedERC20Token.decimals).toFixed(),
        ]),
      );

      expect(native.value).to.be.equal(toWei(mixedAmount, 18).toFixed());
      expect(native.to).to.be.equal(receiver);
      expect(native.data).to.be.equal("0x");
    });
  });

  describe("Truncation on too many decimals", () => {
    it("cuts fractional part of token with 0 decimals", () => {
      const amount = new BigNumber("1.000000789");
      const crappyToken: TokenInfo = {
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
        decimals: 0,
        symbol: "NOD",
        name: "No Decimals",
        chainId: -1,
      };

      const payment: AssetTransfer = {
        token_type: "erc20",
        receiver,
        amount,
        tokenAddress: crappyToken.address,
        decimals: crappyToken.decimals,
        symbol: "BTC",
        receiverEnsName: null,
      };
      const [transfer] = buildAssetTransfers([payment]);
      expect(transfer.value).to.be.equal("0");
      expect(transfer.to).to.be.equal(crappyToken.address);
      expect(transfer.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [receiver, toWei(amount, crappyToken.decimals).toFixed()]),
      );
    });
  });

  describe("Collectibles", () => {
    const transfers: CollectibleTransfer[] = [
      {
        token_type: "erc721",
        receiver,
        from: testData.dummySafeInfo.safeAddress,
        receiverEnsName: null,
        tokenAddress: testData.addresses.dummyErc721Address,
        tokenName: "Test NFT",
        tokenId: new BigNumber("69"),
        hasMetaData: false,
      },
      {
        token_type: "erc1155",
        receiver,
        from: testData.dummySafeInfo.safeAddress,
        receiverEnsName: null,
        tokenAddress: testData.addresses.dummyErc1155Address,
        tokenName: "Test MultiToken",
        amount: new BigNumber("69"),
        tokenId: new BigNumber("420"),
        hasMetaData: false,
      },
    ];

    const [firstTransfer, secondTransfer] = buildCollectibleTransfers(transfers);

    expect(firstTransfer.value).to.be.equal("0");
    expect(firstTransfer.to).to.be.equal(testData.addresses.dummyErc721Address);
    expect(firstTransfer.data).to.be.equal(
      erc721Interface.encodeFunctionData("safeTransferFrom", [testData.dummySafeInfo.safeAddress, receiver, 69]),
    );

    expect(secondTransfer.value).to.be.equal("0");
    expect(secondTransfer.to).to.be.equal(testData.addresses.dummyErc1155Address);
    expect(secondTransfer.data).to.be.equal(
      erc1155Interface.encodeFunctionData("safeTransferFrom", [
        testData.dummySafeInfo.safeAddress,
        receiver,
        420,
        69,
        ethers.utils.hexlify("0x00"),
      ]),
    );
  });
});
