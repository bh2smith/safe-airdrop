import BigNumber from "bignumber.js";
import { expect } from "chai";

import { AssetBalance, CollectibleBalance } from "../hooks/balances";
import { assetTransfersToSummary, checkAllBalances } from "../parser/balanceCheck";
import { AssetTransfer, CollectibleTransfer } from "../parser/csvParser";
import { testData } from "../test/util";
import { toWei } from "../utils";

describe("transferToSummary and check balances", () => {
  it("works for integer native currency", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(1),
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(2),
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(3),
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(null)?.amount.toFixed()).to.equal("6");

    const exactBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("6", 18).toFixed(),
        decimals: 18,
      },
    ];
    const biggerBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("7", 18).toFixed(),
        decimals: 18,
      },
    ];
    const smallerBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("5.999999999999", 18).toFixed(),
        decimals: 18,
      },
    ];

    expect(checkAllBalances(exactBalance, undefined, transfers)).to.be.empty;
    expect(checkAllBalances(biggerBalance, undefined, transfers)).to.be.empty;
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).to.have.length(1);
    expect(smallBalanceCheckResult[0].token).to.equal("ETH");
    expect(smallBalanceCheckResult[0].token_type).to.equal("native");
    expect(smallBalanceCheckResult[0].transferAmount).to.equal("6");
  });

  it("works for decimals in native currency", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(0.1),
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(0.01),
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(0.001),
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(null)?.amount.toFixed()).to.equal("0.111");

    const exactBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("0.111", 18).toFixed(),
        decimals: 18,
      },
    ];
    const biggerBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("0.1111", 18).toFixed(),
        decimals: 18,
      },
    ];
    const smallerBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("0.11", 18).toFixed(),
        decimals: 18,
      },
    ];

    expect(checkAllBalances(exactBalance, undefined, transfers)).to.be.empty;
    expect(checkAllBalances(biggerBalance, undefined, transfers)).to.be.empty;
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).to.have.length(1);
    expect(smallBalanceCheckResult[0].token).to.equal("ETH");
    expect(smallBalanceCheckResult[0].token_type).to.equal("native");
    expect(smallBalanceCheckResult[0].transferAmount).to.equal("0.111");
  });

  it("works for decimals in erc20", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(0.1),
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(0.01),
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(0.001),
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(testData.unlistedERC20Token.address)?.amount.toFixed()).to.equal("0.111");

    const exactBalance: AssetBalance = [
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("0.111", 18).toFixed(),
        decimals: 18,
      },
    ];
    const biggerBalance: AssetBalance = [
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("0.1111", 18).toFixed(),
        decimals: 18,
      },
    ];
    const smallerBalance: AssetBalance = [
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("0.11", 18).toFixed(),
        decimals: 18,
      },
    ];

    expect(checkAllBalances(exactBalance, undefined, transfers)).to.be.empty;
    expect(checkAllBalances(biggerBalance, undefined, transfers)).to.be.empty;
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).to.have.length(1);
    expect(smallBalanceCheckResult[0].token).to.equal("ULT");
    expect(smallBalanceCheckResult[0].token_type).to.equal("erc20");
    expect(smallBalanceCheckResult[0].transferAmount).to.equal("0.111");
  });

  it("works for integer in erc20", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(1),
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(2),
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(3),
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(testData.unlistedERC20Token.address)?.amount.toFixed()).to.equal("6");

    const exactBalance: AssetBalance = [
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("6", 18).toFixed(),
        decimals: 18,
      },
    ];
    const biggerBalance: AssetBalance = [
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("7", 18).toFixed(),
        decimals: 18,
      },
    ];
    const smallerBalance: AssetBalance = [
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("5.999999999999", 18).toFixed(),
        decimals: 18,
      },
    ];

    expect(checkAllBalances(exactBalance, undefined, transfers)).to.be.empty;
    expect(checkAllBalances(biggerBalance, undefined, transfers)).to.be.empty;
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).to.have.length(1);
    expect(smallBalanceCheckResult[0].token).to.equal("ULT");
    expect(smallBalanceCheckResult[0].token_type).to.equal("erc20");
    expect(smallBalanceCheckResult[0].transferAmount).to.equal("6");
  });

  it("works for mixed payments", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(1.1),
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(2),
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: new BigNumber(3.3),
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(3),
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: new BigNumber(0.33),
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(testData.unlistedERC20Token.address)?.amount.toFixed()).to.equal("6.4");
    expect(summary.get(null)?.amount.toFixed()).to.equal("3.33");

    const exactBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("3.33", 18).toFixed(),
        decimals: 18,
      },
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("6.4", 18).toFixed(),
        decimals: 18,
      },
    ];
    const biggerBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("3.34", 18).toFixed(),
        decimals: 18,
      },
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("6.5", 18).toFixed(),
        decimals: 18,
      },
    ];
    const smallerBalance: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("3.32", 18).toFixed(),
        decimals: 18,
      },
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("6.3", 18).toFixed(),
        decimals: 18,
      },
    ];

    const lessNativeMoreErc20: AssetBalance = [
      {
        token: null,
        tokenAddress: null,
        balance: toWei("3.32", 18).toFixed(),
        decimals: 18,
      },
      {
        token: {
          decimals: 18,
          symbol: "ULT",
          name: "Unlisted Token",
        },
        tokenAddress: testData.unlistedERC20Token.address,
        balance: toWei("69", 18).toFixed(),
        decimals: 18,
      },
    ];

    expect(checkAllBalances(exactBalance, undefined, transfers)).to.be.empty;
    expect(checkAllBalances(biggerBalance, undefined, transfers)).to.be.empty;
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).to.have.length(2);
    expect(smallBalanceCheckResult[0].token).to.equal("ULT");
    expect(smallBalanceCheckResult[0].token_type).to.equal("erc20");
    expect(smallBalanceCheckResult[0].transferAmount).to.equal("6.4");
    expect(smallBalanceCheckResult[0].isDuplicate).to.be.false;

    expect(smallBalanceCheckResult[1].token).to.equal("ETH");
    expect(smallBalanceCheckResult[1].token_type).to.equal("native");
    expect(smallBalanceCheckResult[1].transferAmount).to.equal("3.33");
    expect(smallBalanceCheckResult[1].isDuplicate).to.be.false;

    const lessNativeMoreErc20CheckResult = checkAllBalances(lessNativeMoreErc20, undefined, transfers);
    expect(lessNativeMoreErc20CheckResult).to.have.length(1);
    expect(lessNativeMoreErc20CheckResult[0].token).to.equal("ETH");
    expect(lessNativeMoreErc20CheckResult[0].token_type).to.equal("native");
    expect(lessNativeMoreErc20CheckResult[0].transferAmount).to.equal("3.33");
    expect(lessNativeMoreErc20CheckResult[0].isDuplicate).to.be.false;
  });

  it("balance check works for erc721 tokens", () => {
    const transfers: CollectibleTransfer[] = [
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: new BigNumber(69),
        receiver: testData.addresses.receiver1,
        tokenName: "Test Collectible",
        receiverEnsName: null,
        hasMetaData: false,
        from: testData.addresses.receiver2,
      },
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: new BigNumber(420),
        receiver: testData.addresses.receiver1,
        tokenName: "Test Collectible",
        receiverEnsName: null,
        hasMetaData: false,
        from: testData.addresses.receiver2,
      },
    ];

    const exactBalance: CollectibleBalance = [
      {
        address: testData.unlistedERC20Token.address,
        id: "69",
        tokenName: "Test Collectible",
        tokenSymbol: "TC",
      },
      {
        address: testData.unlistedERC20Token.address,
        id: "420",
        tokenName: "Test Collectible",
        tokenSymbol: "TC",
      },
    ];
    const biggerBalance: CollectibleBalance = [
      {
        address: testData.unlistedERC20Token.address,
        id: "69",
        tokenName: "Test Collectible",
        tokenSymbol: "TC",
      },
      {
        address: testData.unlistedERC20Token.address,
        id: "420",
        tokenName: "Test Collectible",
        tokenSymbol: "TC",
      },
      {
        address: testData.unlistedERC20Token.address,
        id: "42069",
        tokenName: "Test Collectible",
        tokenSymbol: "TC",
      },
    ];
    const smallerBalance: CollectibleBalance = [
      {
        address: testData.unlistedERC20Token.address,
        id: "69",
        tokenName: "Test Collectible",
        tokenSymbol: "TC",
      },
    ];

    expect(checkAllBalances(undefined, exactBalance, transfers)).to.be.empty;
    expect(checkAllBalances(undefined, biggerBalance, transfers)).to.be.empty;
    const smallBalanceCheckResult = checkAllBalances(undefined, smallerBalance, transfers);
    expect(smallBalanceCheckResult).to.have.length(1);
    expect(smallBalanceCheckResult[0].token).to.equal("Test Collectible");
    expect(smallBalanceCheckResult[0].token_type).to.equal("erc721");
    expect(smallBalanceCheckResult[0].id?.toFixed()).to.equal("420");
    expect(smallBalanceCheckResult[0].transferAmount).to.be.undefined;
    expect(smallBalanceCheckResult[0].isDuplicate).to.be.false;
  });

  it("detects duplicate transfers for erc721 tokens", () => {
    const transfers: CollectibleTransfer[] = [
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: new BigNumber(69),
        receiver: testData.addresses.receiver1,
        receiverEnsName: null,
        hasMetaData: false,
        from: testData.addresses.receiver2,
      },
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: new BigNumber(69),
        receiver: testData.addresses.receiver2,
        receiverEnsName: null,
        hasMetaData: false,
        from: testData.addresses.receiver2,
      },
    ];

    const exactBalance: CollectibleBalance = [
      {
        address: testData.unlistedERC20Token.address,
        id: "69",
        tokenName: "Test Collectible",
        tokenSymbol: "TC",
      },
    ];

    const balanceCheckResult = checkAllBalances(undefined, exactBalance, transfers);
    expect(balanceCheckResult).to.have.length(1);
    expect(balanceCheckResult[0].token).to.equal("Test Collectible");
    expect(balanceCheckResult[0].token_type).to.equal("erc721");
    expect(balanceCheckResult[0].id?.toFixed()).to.equal("69");
    expect(balanceCheckResult[0].transferAmount).to.undefined;
    expect(balanceCheckResult[0].isDuplicate).to.be.true;
  });
});
