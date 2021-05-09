import { assert } from "console";

import { TokenInfo } from "@uniswap/token-lists";
import { BigNumber } from "bignumber.js";
import { expect } from "chai";

import { erc20Interface } from "../erc20";
import { fetchTokenList, TokenMap } from "../hooks/tokenList";
import { Payment } from "../parser";
import { testData } from "../test/util";
import { buildTransfers } from "../transfers";
import { toWei, fromWei, MAX_U256 } from "../utils";

const dummySafeInfo = testData.dummySafeInfo;
let tokenList: TokenMap;
let listedTokens: string[];
let listedToken: TokenInfo;
const receiver = testData.addresses.receiver1;

describe("Build Transfers:", () => {
  beforeAll(async () => {
    tokenList = await fetchTokenList(dummySafeInfo.network);
    listedTokens = Array.from(tokenList.keys());
    listedToken = tokenList.get(listedTokens[0]);
    assert(tokenList.get(testData.unlistedToken.address) === undefined);
  });

  describe("Integers", () => {
    it("works with large integers on listed, unlisted and native asset transfers", () => {
      const largePayments: Payment[] = [
        // Listed ERC20
        {
          receiver,
          amount: fromWei(MAX_U256, listedToken.decimals),
          tokenAddress: listedToken.address,
          decimals: listedToken.decimals,
        },
        // Unlisted ERC20
        {
          receiver,
          amount: fromWei(MAX_U256, testData.unlistedToken.decimals),
          tokenAddress: testData.unlistedToken.address,
          decimals: testData.unlistedToken.decimals,
        },
        // Native Asset
        {
          receiver,
          amount: fromWei(MAX_U256, 18),
          tokenAddress: null,
          decimals: null,
        },
      ];

      const [listedTransfer, unlistedTransfer, nativeTransfer] = buildTransfers(
        largePayments,
        tokenList
      );
      expect(listedTransfer.value).to.be.equal("0");
      expect(listedTransfer.to).to.be.equal(listedToken.address);
      expect(listedTransfer.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          MAX_U256.toFixed(),
        ])
      );

      expect(unlistedTransfer.value).to.be.equal("0");
      expect(unlistedTransfer.to).to.be.equal(testData.unlistedToken.address);
      expect(unlistedTransfer.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          MAX_U256.toFixed(),
        ])
      );

      expect(nativeTransfer.value).to.be.equal(MAX_U256.toFixed());
      expect(nativeTransfer.to).to.be.equal(receiver);
      expect(nativeTransfer.data).to.be.equal("0x");
    });
  });

  describe("Decimals", () => {
    it("works with decimal payments on listed, unlisted and native transfers", () => {
      const tinyAmount = new BigNumber("0.0000001");
      const smallPayments: Payment[] = [
        // Listed ERC20
        {
          receiver,
          amount: tinyAmount,
          tokenAddress: listedToken.address,
          decimals: listedToken.decimals,
        },
        // Unlisted ERC20
        {
          receiver,
          amount: tinyAmount,
          tokenAddress: testData.unlistedToken.address,
          decimals: testData.unlistedToken.decimals,
        },
        // Native Asset
        {
          receiver,
          amount: tinyAmount,
          tokenAddress: null,
          decimals: null,
        },
      ];
      const [listed, unlisted, native] = buildTransfers(
        smallPayments,
        tokenList
      );
      expect(listed.value).to.be.equal("0");
      expect(listed.to).to.be.equal(listedToken.address);
      expect(listed.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          toWei(tinyAmount, listedToken.decimals).toFixed(),
        ])
      );

      expect(unlisted.value).to.be.equal("0");
      expect(unlisted.to).to.be.equal(testData.unlistedToken.address);
      expect(unlisted.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          toWei(tinyAmount, testData.unlistedToken.decimals).toFixed(),
        ])
      );

      expect(native.value).to.be.equal(toWei(tinyAmount, 18).toString());
      expect(native.to).to.be.equal(receiver);
      expect(native.data).to.be.equal("0x");
    });
  });

  describe("Mixed", () => {
    it("works with arbitrary amount strings on listed, unlisted and native transfers", () => {
      const mixedAmount = new BigNumber("123456.000000789");
      const mixedPayments = [
        // Listed ERC20
        {
          receiver,
          amount: mixedAmount,
          tokenAddress: listedToken.address,
          decimals: listedToken.decimals,
        },
        // Unlisted ERC20
        {
          receiver,
          amount: mixedAmount,
          tokenAddress: testData.unlistedToken.address,
          decimals: testData.unlistedToken.decimals,
        },
        // Native Asset
        {
          receiver,
          amount: mixedAmount,
          tokenAddress: null,
          decimals: null,
        },
      ];
      const [listed, unlisted, native] = buildTransfers(
        mixedPayments,
        tokenList
      );
      expect(listed.value).to.be.equal("0");
      expect(listed.to).to.be.equal(listedToken.address);
      expect(listed.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          toWei(mixedAmount, listedToken.decimals).toFixed(),
        ])
      );

      expect(unlisted.value).to.be.equal("0");
      expect(unlisted.to).to.be.equal(testData.unlistedToken.address);
      expect(unlisted.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          toWei(mixedAmount, testData.unlistedToken.decimals).toFixed(),
        ])
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
      const payment: Payment = {
        receiver,
        amount: amount,
        tokenAddress: crappyToken.address,
        decimals: crappyToken.decimals,
      };
      const [transfer] = buildTransfers([payment], tokenList);
      expect(transfer.value).to.be.equal("0");
      expect(transfer.to).to.be.equal(crappyToken.address);
      expect(transfer.data).to.be.equal(
        erc20Interface.encodeFunctionData("transfer", [
          receiver,
          toWei(amount, crappyToken.decimals).toFixed(),
        ])
      );
    });
  });
});
