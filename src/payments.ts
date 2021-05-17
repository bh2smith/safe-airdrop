import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";

import { erc20Instance } from "./erc20";
import { TokenMap } from "./hooks/tokenList";

export interface PrePayment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string | null;
}
export interface Payment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string | null;
  decimals: number;
  symbol: string;
}

export async function toPayment(
  prePayment: PrePayment,
  tokenInfo: TokenMap,
  provider: ethers.providers.Web3Provider,
): Promise<Payment> {
  if (prePayment.tokenAddress === null) {
    // Native asset payment.
    return {
      receiver: prePayment.receiver,
      amount: prePayment.amount,
      tokenAddress: prePayment.tokenAddress,
      decimals: 18,
      symbol: "ETH",
    };
  }
  let decimals: number = tokenInfo.get(prePayment.tokenAddress)?.decimals;
  let symbol: string = tokenInfo.get(prePayment.tokenAddress)?.symbol;
  if (decimals === undefined) {
    // Fetch token decimals from chain.
    const tokenContract = await erc20Instance(prePayment.tokenAddress, provider);
    // TODO - catch error if tokenContract doesn't exist.
    decimals = await tokenContract.decimals;
    symbol = await tokenContract.symbol;
    console.log(`Found unlisted token ${prePayment.tokenAddress} - recovered ${symbol} EVM`);
  }
  return {
    receiver: prePayment.receiver,
    amount: prePayment.amount,
    tokenAddress: prePayment.tokenAddress,
    decimals,
    symbol,
  };
}
