import { BigNumber } from "bignumber.js";

import { AssetBalance, CollectibleBalance } from "../hooks/balances";
import { toWei } from "../utils";

import { AssetTransfer, CollectibleTransfer, Transfer } from "./csvParser";

export type AssetSummaryEntry = {
  tokenAddress: string | null;
  value: BigNumber;
  decimals: number;
  symbol?: string;
};

export const assetTransfersToSummary = (transfers: AssetTransfer[]) => {
  return transfers.reduce((previousValue, currentValue): Map<string | null, AssetSummaryEntry> => {
    let tokenSummary = previousValue.get(currentValue.tokenAddress);
    if (typeof tokenSummary === "undefined") {
      tokenSummary = {
        tokenAddress: currentValue.tokenAddress,
        value: new BigNumber(0),
        decimals: currentValue.decimals,
        symbol: currentValue.symbol,
      };
      previousValue.set(currentValue.tokenAddress, tokenSummary);
    }
    tokenSummary.value = tokenSummary.value.plus(currentValue.value);

    return previousValue;
  }, new Map<string | null, AssetSummaryEntry>());
};

export type CollectibleSummaryEntry = {
  tokenAddress: string;
  id: BigNumber;
  count: number;
  name?: string;
};

export const collectibleTransfersToSummary = (transfers: CollectibleTransfer[]) => {
  return transfers.reduce((previousValue, currentValue): Map<string | null, CollectibleSummaryEntry> => {
    const entryKey = `${currentValue.tokenAddress}:${currentValue.tokenId.toFixed()}`;
    let tokenSummary = previousValue.get(entryKey);
    if (typeof tokenSummary === "undefined") {
      tokenSummary = {
        tokenAddress: currentValue.tokenAddress,
        count: 0,
        name: currentValue.tokenName,
        id: currentValue.tokenId,
      };
      previousValue.set(entryKey, tokenSummary);
    }
    tokenSummary.count = tokenSummary.count + 1;

    return previousValue;
  }, new Map<string | null, CollectibleSummaryEntry>());
};

export type InsufficientBalanceInfo = {
  token: string;
  transferAmount?: string;
  isDuplicate: boolean;
  token_type: "erc20" | "native" | "erc721";
  id?: BigNumber;
};

export const checkAllBalances = (
  assetBalance: AssetBalance | undefined,
  collectibleBalance: CollectibleBalance | undefined,
  transfers: Transfer[],
): InsufficientBalanceInfo[] => {
  const insufficientTokens: InsufficientBalanceInfo[] = [];

  const assetSummary = assetTransfersToSummary(
    transfers.filter(
      (transfer) => transfer.token_type === "erc20" || transfer.token_type === "native",
    ) as AssetTransfer[],
  );

  // erc1155 balance checks are not possible yet through the safe api
  const collectibleSummary = collectibleTransfersToSummary(
    transfers.filter((transfer) => transfer.token_type === "erc721") as CollectibleTransfer[],
  );

  for (const { tokenAddress, value, decimals, symbol } of assetSummary.values()) {
    if (tokenAddress === null) {
      // Check ETH Balance
      const tokenBalance = assetBalance?.find((balanceEntry) => balanceEntry.tokenAddress === null);

      if (typeof tokenBalance === "undefined" || !isSufficientBalance(new BigNumber(tokenBalance.balance), value, 18)) {
        insufficientTokens.push({
          token: "ETH",
          token_type: "native",
          transferAmount: value.toFixed(),
          isDuplicate: false, // For Erc20 / Coin Transfers duplicates are never an issue
        });
      }
    } else {
      const tokenBalance = assetBalance?.find(
        (balanceEntry) => balanceEntry.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase(),
      );
      if (
        typeof tokenBalance === "undefined" ||
        !isSufficientBalance(new BigNumber(tokenBalance.balance), value, decimals)
      ) {
        insufficientTokens.push({
          token: symbol || tokenAddress,
          token_type: "erc20",
          transferAmount: value.toFixed(),
          isDuplicate: false, // For Erc20 / Coin Transfers duplicates are never an issue
        });
      }
    }
  }

  for (const { tokenAddress, count, name, id } of collectibleSummary.values()) {
    const tokenBalance = collectibleBalance?.find(
      (balanceEntry) =>
        balanceEntry.address?.toLowerCase() === tokenAddress.toLowerCase() && balanceEntry.id === id.toFixed(),
    );
    if (typeof tokenBalance === "undefined" || count > 1) {
      const tokenName =
        name ??
        tokenBalance?.tokenName ??
        collectibleBalance?.find((balanceEntry) => balanceEntry.address?.toLowerCase() === tokenAddress.toLowerCase())
          ?.tokenName;
      insufficientTokens.push({
        token: tokenName ?? tokenAddress,
        token_type: "erc721",
        isDuplicate: count > 1,
        id: id,
      });
    }
  }

  return insufficientTokens;
};

const isSufficientBalance = (tokenBalance: BigNumber, transferAmount: BigNumber, decimals: number) => {
  const transferAmountInWei = toWei(transferAmount, decimals);
  return tokenBalance.gte(transferAmountInWei);
};
