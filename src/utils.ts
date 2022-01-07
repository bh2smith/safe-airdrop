import { BigNumber } from "bignumber.js";

import { AssetBalance, CollectibleBalance } from "./hooks/balances";
import { AssetTransfer, CollectibleTransfer, Transfer } from "./parser/csvParser";

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);
export const TWO = new BigNumber(2);
export const TEN = new BigNumber(10);
export const MAX_U256 = TWO.pow(255).minus(1);

export interface TokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: {
    readonly [key: string]: string | number | boolean | null;
  };
}

export function toWei(amount: string | number | BigNumber, decimals: number): BigNumber {
  let res = TEN.pow(decimals).multipliedBy(amount);
  if (res.decimalPlaces() > 0) {
    // TODO - reinstate this warning by passing along with return content
    // Return (Transaction[], Message)
    // setLastError({
    //   message:
    //     "Precision too high. Some digits are ignored for row " + index,
    // });
    res = res.decimalPlaces(0, BigNumber.ROUND_DOWN);
  }
  return res;
}

export function fromWei(amount: BigNumber, decimals: number): BigNumber {
  return amount.dividedBy(TEN.pow(decimals));
}

export type AssetSummaryEntry = {
  tokenAddress: string | null;
  amount: BigNumber;
  decimals: number;
  symbol?: string;
};

export const assetTransfersToSummary = (transfers: AssetTransfer[]) => {
  return transfers.reduce((previousValue, currentValue): Map<string | null, AssetSummaryEntry> => {
    let tokenSummary = previousValue.get(currentValue.tokenAddress);
    if (typeof tokenSummary === "undefined") {
      tokenSummary = {
        tokenAddress: currentValue.tokenAddress,
        amount: new BigNumber(0),
        decimals: currentValue.decimals,
        symbol: currentValue.symbol,
      };
      previousValue.set(currentValue.tokenAddress, tokenSummary);
    }
    tokenSummary.amount = tokenSummary.amount.plus(currentValue.amount);

    return previousValue;
  }, new Map<string | null, AssetSummaryEntry>());
};

export type CollectibleSummaryEntry = {
  tokenAddress: string;
  id: BigNumber;
  amount: number;
  name?: string;
};

export const collectibleTransfersToSummary = (transfers: CollectibleTransfer[]) => {
  return transfers.reduce((previousValue, currentValue): Map<string | null, CollectibleSummaryEntry> => {
    const entryKey = `${currentValue.tokenAddress}:${currentValue.tokenId.toFixed()}`;
    let tokenSummary = previousValue.get(entryKey);
    if (typeof tokenSummary === "undefined") {
      tokenSummary = {
        tokenAddress: currentValue.tokenAddress,
        amount: 0, // We track the amount to detect duplicate ids
        name: currentValue.tokenName,
        id: currentValue.tokenId,
      };
      previousValue.set(entryKey, tokenSummary);
    }
    tokenSummary.amount = tokenSummary.amount + 1;

    return previousValue;
  }, new Map<string | null, CollectibleSummaryEntry>());
};

export type InsufficientBalanceInfo = {
  token: string;
  transferAmount: string;
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

  for (const { tokenAddress, amount, decimals, symbol } of assetSummary.values()) {
    if (tokenAddress === null) {
      // Check ETH Balance
      const tokenBalance = assetBalance?.find((balanceEntry) => balanceEntry.tokenAddress === null);

      if (
        typeof tokenBalance === "undefined" ||
        !isSufficientBalance(new BigNumber(tokenBalance.balance), amount, 18)
      ) {
        insufficientTokens.push({
          token: "ETH",
          token_type: "native",
          transferAmount: amount.toFixed(),
        });
      }
    } else {
      const tokenBalance = assetBalance?.find(
        (balanceEntry) => balanceEntry.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase(),
      );
      if (
        typeof tokenBalance === "undefined" ||
        !isSufficientBalance(new BigNumber(tokenBalance.balance), amount, decimals)
      ) {
        insufficientTokens.push({
          token: symbol || tokenAddress,
          token_type: "erc20",
          transferAmount: amount.toFixed(),
        });
      }
    }
  }

  for (const { tokenAddress, amount, name, id } of collectibleSummary.values()) {
    const tokenBalance = collectibleBalance?.find(
      (balanceEntry) =>
        balanceEntry.address?.toLowerCase() === tokenAddress.toLowerCase() && balanceEntry.id === id.toFixed(),
    );
    if (typeof tokenBalance === "undefined" || amount > 1) {
      const tokenName =
        name ??
        tokenBalance?.tokenName ??
        collectibleBalance?.find((balanceEntry) => balanceEntry.address?.toLowerCase() === tokenAddress.toLowerCase())
          ?.tokenName;
      insufficientTokens.push({
        token: tokenName ?? tokenAddress,
        token_type: "erc721",
        transferAmount: amount.toFixed(),
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
