import { AssetBalance } from "src/stores/slices/assetBalanceSlice";
import { NFTBalance } from "src/stores/slices/collectiblesSlice";

import { AssetTransfer, CollectibleTransfer } from "../hooks/useCsvParser";
import { assetTransfersToSummary, checkAllBalances } from "../parser/balanceCheck";
import { testData } from "../test/util";
import { toWei } from "../utils";

describe("transferToSummary and check balances", () => {
  it("works for integer native currency", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "native",
        tokenAddress: null,
        amount: "1",
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: "2",
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: "3",
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(null)?.amount.toFixed()).toEqual("6");

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

    expect(checkAllBalances(exactBalance, undefined, transfers)).toHaveLength(0);
    expect(checkAllBalances(biggerBalance, undefined, transfers)).toHaveLength(0);
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).toHaveLength(1);
    expect(smallBalanceCheckResult[0].token).toEqual("ETH");
    expect(smallBalanceCheckResult[0].token_type).toEqual("native");
    expect(smallBalanceCheckResult[0].transferAmount).toEqual("6");
  });

  it("works for decimals in native currency", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "native",
        tokenAddress: null,
        amount: "0.1",
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: "0.01",
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: "0.001",
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(null)?.amount.toFixed()).toEqual("0.111");

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

    expect(checkAllBalances(exactBalance, undefined, transfers)).toHaveLength(0);
    expect(checkAllBalances(biggerBalance, undefined, transfers)).toHaveLength(0);
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).toHaveLength(1);
    expect(smallBalanceCheckResult[0].token).toEqual("ETH");
    expect(smallBalanceCheckResult[0].token_type).toEqual("native");
    expect(smallBalanceCheckResult[0].transferAmount).toEqual("0.111");
  });

  it("works for decimals in erc20", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "0.1",
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "0.01",
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "0.001",
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(testData.unlistedERC20Token.address)?.amount.toFixed()).toEqual("0.111");

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

    expect(checkAllBalances(exactBalance, undefined, transfers)).toHaveLength(0);
    expect(checkAllBalances(biggerBalance, undefined, transfers)).toHaveLength(0);
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).toHaveLength(1);
    expect(smallBalanceCheckResult[0].token).toEqual("ULT");
    expect(smallBalanceCheckResult[0].token_type).toEqual("erc20");
    expect(smallBalanceCheckResult[0].transferAmount).toEqual("0.111");
  });

  it("works for integer in erc20", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "1",
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "2",
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "3",
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(testData.unlistedERC20Token.address)?.amount.toFixed()).toEqual("6");

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

    expect(checkAllBalances(exactBalance, undefined, transfers)).toHaveLength(0);
    expect(checkAllBalances(biggerBalance, undefined, transfers)).toHaveLength(0);
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).toHaveLength(1);
    expect(smallBalanceCheckResult[0].token).toEqual("ULT");
    expect(smallBalanceCheckResult[0].token_type).toEqual("erc20");
    expect(smallBalanceCheckResult[0].transferAmount).toEqual("6");
  });

  it("works for mixed payments", () => {
    const transfers: AssetTransfer[] = [
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "1.1",
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "2",
        receiver: testData.addresses.receiver2,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "erc20",
        tokenAddress: testData.unlistedERC20Token.address,
        amount: "3.3",
        receiver: testData.addresses.receiver3,
        decimals: 18,
        symbol: "ULT",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: "3",
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
      {
        token_type: "native",
        tokenAddress: null,
        amount: "0.33",
        receiver: testData.addresses.receiver1,
        decimals: 18,
        symbol: "ETH",
        receiverEnsName: null,
      },
    ];
    const summary = assetTransfersToSummary(transfers);
    expect(summary.get(testData.unlistedERC20Token.address)?.amount.toFixed()).toEqual("6.4");
    expect(summary.get(null)?.amount.toFixed()).toEqual("3.33");

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

    expect(checkAllBalances(exactBalance, undefined, transfers)).toHaveLength(0);
    expect(checkAllBalances(biggerBalance, undefined, transfers)).toHaveLength(0);
    const smallBalanceCheckResult = checkAllBalances(smallerBalance, undefined, transfers);
    expect(smallBalanceCheckResult).toHaveLength(2);
    expect(smallBalanceCheckResult[0].token).toEqual("ULT");
    expect(smallBalanceCheckResult[0].token_type).toEqual("erc20");
    expect(smallBalanceCheckResult[0].transferAmount).toEqual("6.4");
    expect(smallBalanceCheckResult[0].isDuplicate).toBeFalsy();

    expect(smallBalanceCheckResult[1].token).toEqual("ETH");
    expect(smallBalanceCheckResult[1].token_type).toEqual("native");
    expect(smallBalanceCheckResult[1].transferAmount).toEqual("3.33");
    expect(smallBalanceCheckResult[1].isDuplicate).toBeFalsy();

    const lessNativeMoreErc20CheckResult = checkAllBalances(lessNativeMoreErc20, undefined, transfers);
    expect(lessNativeMoreErc20CheckResult).toHaveLength(1);
    expect(lessNativeMoreErc20CheckResult[0].token).toEqual("ETH");
    expect(lessNativeMoreErc20CheckResult[0].token_type).toEqual("native");
    expect(lessNativeMoreErc20CheckResult[0].transferAmount).toEqual("3.33");
    expect(lessNativeMoreErc20CheckResult[0].isDuplicate).toBeFalsy();
  });

  it("balance check works for erc721 tokens", () => {
    const transfers: CollectibleTransfer[] = [
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: "69",
        receiver: testData.addresses.receiver1,
        tokenName: "Test Collectible",
        receiverEnsName: null,
        from: testData.addresses.receiver2,
      },
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: "420",
        receiver: testData.addresses.receiver1,
        tokenName: "Test Collectible",
        receiverEnsName: null,
        from: testData.addresses.receiver2,
      },
    ];

    const exactBalance: NFTBalance = {
      results: [
        {
          address: testData.unlistedERC20Token.address,
          id: "69",
          tokenName: "Test Collectible",
          tokenSymbol: "TC",
          imageUri: "",
          name: "",
        },
        {
          address: testData.unlistedERC20Token.address,
          id: "420",
          tokenName: "Test Collectible",
          tokenSymbol: "TC",
          imageUri: "",
          name: "",
        },
      ],
      next: null,
      count: 2,
      previous: null,
    };
    const biggerBalance: NFTBalance = {
      results: [
        {
          address: testData.unlistedERC20Token.address,
          id: "69",
          tokenName: "Test Collectible",
          tokenSymbol: "TC",
          imageUri: "",
          name: "",
        },
        {
          address: testData.unlistedERC20Token.address,
          id: "420",
          tokenName: "Test Collectible",
          tokenSymbol: "TC",
          imageUri: "",
          name: "",
        },
        {
          address: testData.unlistedERC20Token.address,
          id: "42069",
          tokenName: "Test Collectible",
          tokenSymbol: "TC",
          imageUri: "",
          name: "",
        },
      ],
      next: null,
      count: 3,
      previous: null,
    };
    const smallerBalance: NFTBalance = {
      results: [
        {
          address: testData.unlistedERC20Token.address,
          id: "69",
          tokenName: "Test Collectible",
          tokenSymbol: "TC",
          imageUri: "",
          name: "",
        },
      ],
      next: null,
      count: 1,
      previous: null,
    };

    expect(checkAllBalances(undefined, exactBalance.results, transfers)).toHaveLength(0);
    expect(checkAllBalances(undefined, biggerBalance.results, transfers)).toHaveLength(0);
    const smallBalanceCheckResult = checkAllBalances(undefined, smallerBalance.results, transfers);
    expect(smallBalanceCheckResult).toHaveLength(1);
    expect(smallBalanceCheckResult[0].token).toEqual("Test Collectible");
    expect(smallBalanceCheckResult[0].token_type).toEqual("erc721");
    expect(smallBalanceCheckResult[0].id).toEqual("420");
    expect(smallBalanceCheckResult[0].transferAmount).toBeUndefined();
    expect(smallBalanceCheckResult[0].isDuplicate).toBeFalsy();
  });

  it("detects duplicate transfers for erc721 tokens", () => {
    const transfers: CollectibleTransfer[] = [
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: "69",
        receiver: testData.addresses.receiver1,
        receiverEnsName: null,
        from: testData.addresses.receiver2,
      },
      {
        token_type: "erc721",
        tokenAddress: testData.unlistedERC20Token.address,
        tokenId: "69",
        receiver: testData.addresses.receiver2,
        receiverEnsName: null,
        from: testData.addresses.receiver2,
      },
    ];

    const exactBalance: NFTBalance = {
      results: [
        {
          address: testData.unlistedERC20Token.address,
          id: "69",
          tokenName: "Test Collectible",
          tokenSymbol: "TC",
          imageUri: "",
          name: "",
        },
      ],
      next: null,
      count: 1,
      previous: null,
    };

    const balanceCheckResult = checkAllBalances(undefined, exactBalance.results, transfers);
    expect(balanceCheckResult).toHaveLength(1);
    expect(balanceCheckResult[0].token).toEqual("Test Collectible");
    expect(balanceCheckResult[0].token_type).toEqual("erc721");
    expect(balanceCheckResult[0].id).toEqual("69");
    expect(balanceCheckResult[0].transferAmount).toBeUndefined();
    expect(balanceCheckResult[0].isDuplicate).toBeTruthy();
  });
});
