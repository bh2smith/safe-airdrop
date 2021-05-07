import { buildTransfers, TEN } from "../transfers";
import { expect } from "chai";
import { TokenInfo } from "@uniswap/token-lists";
import BigNumber from "bignumber.js";
import { fetchTokenList, TokenMap } from "src/hooks/tokenList";
import { Payment } from "src/parser";
import { testData } from "../test/util";

let dummySafeInfo = testData.dummySafeInfo;
let tokenList: TokenMap;
let listedTokens: string[];
let listedToken: TokenInfo;
const receiverAddress = testData.addresses.receiver1;

// TODO - make method erc20TransferData and replace data checks with this instead of hardcoded strings.
// function erc20TransferData(amount: BigNumber, receiver: string): Bytes {}

describe("Build Transfers:", () => {
  beforeAll(async () => {
    tokenList = await fetchTokenList(dummySafeInfo.network);
    listedTokens = Array.from(tokenList.keys());
    listedToken = tokenList.get(listedTokens[0]);
  });

  function listedUnlistedAndNativePayments(
    amount,
    receiver
  ): [Payment, Payment, Payment] {
    return [
      // Listed ERC20
      {
        receiver,
        amount: amount,
        tokenAddress: listedToken.address,
        decimals: listedToken.decimals,
      },
      // Unlisted ERC20
      {
        receiver,
        amount: amount,
        tokenAddress: testData.unlistedToken.address,
        decimals: testData.unlistedToken.decimals,
      },
      // Native Asset
      {
        receiver,
        amount: amount,
        tokenAddress: null,
        decimals: null,
      },
    ];
  }

  describe("Integers", () => {
    it("works with large integers on listed, unlisted and native asset transfers", () => {
      let max_amount = new BigNumber(2 ** 255 - 1).dividedBy(
        TEN.pow(listedToken.decimals)
      );
      let large_payments = listedUnlistedAndNativePayments(
        max_amount,
        receiverAddress
      );

      let [listedTransfer, unlistedTransfer, nativeTransfer] = buildTransfers(
        dummySafeInfo,
        large_payments,
        tokenList
      );
      expect(listedTransfer.value).to.be.equal("0");
      expect(listedTransfer.to).to.be.equal(listedToken.address);
      expect(listedTransfer.data).to.be.equal(
        "0xa9059cbb0000000000000000000000001000000000000000000000000000000000000000800000000000016c889a28c160ce0422bb9138ff1d4e48274000000000000000"
      );

      expect(unlistedTransfer.value).to.be.equal("0");
      expect(unlistedTransfer.to).to.be.equal(testData.unlistedToken.address);
      expect(unlistedTransfer.data).to.be.equal(
        "0xa9059cbb0000000000000000000000001000000000000000000000000000000000000000800000000000016c889a28c160ce0422bb9138ff1d4e48274000000000000000"
      );

      expect(nativeTransfer.value).to.be.equal(
        max_amount.multipliedBy(TEN.pow(18)).toFixed()
      );
      expect(nativeTransfer.to).to.be.equal(receiverAddress);
      expect(nativeTransfer.data).to.be.equal("0x");
    });
  });

  describe("Decimals", () => {
    it("works with decimal payments on listed, unlisted and native transfers", () => {
      let fractional_amount = new BigNumber("0.0000001");
      let small_payments = listedUnlistedAndNativePayments(
        fractional_amount,
        receiverAddress
      );
      let [listed, unlisted, native] = buildTransfers(
        dummySafeInfo,
        small_payments,
        tokenList
      );
      expect(listed.value).to.be.equal("0");
      expect(listed.to).to.be.equal(listedToken.address);
      expect(listed.data).to.be.equal(
        "0xa9059cbb0000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e800"
      );

      expect(unlisted.value).to.be.equal("0");
      expect(unlisted.to).to.be.equal(testData.unlistedToken.address);
      expect(unlisted.data).to.be.equal(
        "0xa9059cbb0000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e800"
      );

      expect(native.value).to.be.equal(
        fractional_amount.multipliedBy(TEN.pow(18)).toFixed()
      );
      expect(native.to).to.be.equal(receiverAddress);
      expect(native.data).to.be.equal("0x");
    });
  });

  describe("Mixed", () => {
    it("works with arbitrary amount strings on listed, unlisted and native transfers", () => {
      let amount = new BigNumber("123456.000000789");
      let payments = listedUnlistedAndNativePayments(amount, receiverAddress);
      let [listed, unlisted, native] = buildTransfers(
        dummySafeInfo,
        payments,
        tokenList
      );
      expect(listed.value).to.be.equal("0");
      expect(listed.to).to.be.equal(listedToken.address);
      expect(listed.data).to.be.equal(
        "0xa9059cbb0000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000001a24902beecbd5109200"
      );

      expect(unlisted.value).to.be.equal("0");
      expect(unlisted.to).to.be.equal(testData.unlistedToken.address);
      expect(unlisted.data).to.be.equal(
        "0xa9059cbb0000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000001a24902beecbd5109200"
      );

      expect(native.value).to.be.equal(
        amount.multipliedBy(TEN.pow(18)).toFixed()
      );
      expect(native.to).to.be.equal(receiverAddress);
      expect(native.data).to.be.equal("0x");
    });
  });

  describe("Truncation on too many decimals", () => {
    it("cuts fractional part of token with 0 decimals", () => {
      let amount = new BigNumber("1.000000789");
      const crappyToken: TokenInfo = {
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
        decimals: 0,
        symbol: "NOD",
        name: "No Decimals",
        chainId: -1,
      };
      let payment: Payment = {
        receiver: receiverAddress,
        amount: amount,
        tokenAddress: crappyToken.address,
        decimals: crappyToken.decimals,
      };
      let [transfer] = buildTransfers(dummySafeInfo, [payment], tokenList);
      expect(transfer.value).to.be.equal("0");
      expect(transfer.to).to.be.equal(crappyToken.address);
      expect(transfer.data).to.be.equal(
        "0xa9059cbb00000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
      );
    });
  });
});
