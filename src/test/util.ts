import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import { TokenInfo } from "@uniswap/token-lists";
import { ethers } from "ethers";

export function fillBytes(count: number, byte: number): string {
  return ethers.utils.hexlify([...Array(count)].map(() => byte));
}

const dummySafeInfo: SafeInfo = {
  safeAddress: fillBytes(20, 0x05),
  network: "RINKEBY",
};

const unlistedToken: TokenInfo = {
  address: fillBytes(20, 0x04),
  decimals: 18,
  symbol: "UNL",
  name: "Unlisted",
  chainId: -1,
};

const addresses = {
  receiver1: fillBytes(20, 0x01),
  receiver2: fillBytes(20, 0x02),
  receiver3: fillBytes(20, 0x03),
};

export const testData = {
  dummySafeInfo,
  unlistedToken,
  addresses,
};
