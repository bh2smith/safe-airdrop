import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import { BigNumber } from "bignumber.js";
import { ethers, utils } from "ethers";

import { erc20Instance } from "./erc20";
import { TokenMap } from "./hooks/tokenList";
import { Payment } from "./parser";

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);
export const TWO = new BigNumber(2);
export const TEN = new BigNumber(10);
export const MAX_U256 = TWO.pow(255).minus(1);

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

export type SummaryEntry = {
  tokenAddress: string;
  amount: BigNumber;
  decimals: number;
};

export const transfersToSummary = (transfers: Payment[]) => {
  return transfers.reduce((previousValue, currentValue): Map<string, SummaryEntry> => {
    let tokenSummary = previousValue.get(currentValue.tokenAddress);
    if (typeof tokenSummary === "undefined") {
      tokenSummary = {
        tokenAddress: currentValue.tokenAddress,
        amount: new BigNumber(0),
        decimals: currentValue.decimals,
      };
      previousValue.set(currentValue.tokenAddress, tokenSummary);
    }
    tokenSummary.amount = tokenSummary.amount.plus(currentValue.amount);

    return previousValue;
  }, new Map<string, SummaryEntry>());
};

export type InsufficientBalanceInfo = {
  token: string;
  transferAmount: string;
};

export const checkAllBalances = async (
  summary: Map<string, SummaryEntry>,
  web3Provider: ethers.providers.Web3Provider,
  safe: SafeInfo,
  tokenList: TokenMap,
): Promise<InsufficientBalanceInfo[]> => {
  const insufficientTokens: InsufficientBalanceInfo[] = [];
  for (const { tokenAddress, amount, decimals } of summary.values()) {
    if (tokenAddress === null) {
      // Check ETH Balance
      const tokenBalance = await web3Provider.getBalance(safe.safeAddress, "latest");
      if (!isSufficientBalance(tokenBalance, amount, 18)) {
        insufficientTokens.push({
          token: "ETH",
          transferAmount: amount.toFixed(),
        });
      }
    } else {
      const erc20Contract = erc20Instance(utils.getAddress(tokenAddress), web3Provider);
      const tokenBalance = await erc20Contract.balanceOf(safe.safeAddress);
      const tokenInfo = tokenList.get(tokenAddress);
      if (!isSufficientBalance(tokenBalance, amount, tokenInfo?.decimals || decimals)) {
        insufficientTokens.push({
          token: tokenInfo?.symbol || tokenAddress,
          transferAmount: amount.toFixed(),
        });
      }
    }
  }
  return insufficientTokens;
};

const isSufficientBalance = (tokenBalance: ethers.BigNumber, transferAmount: BigNumber, decimals: number) => {
  const tokenBalanceNumber = new BigNumber(tokenBalance.toString());
  const transferAmountInWei = toWei(transferAmount, decimals);
  return tokenBalanceNumber.gte(transferAmountInWei);
};
