import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";

import { TokenInfo } from "../utils";

const dummySafeInfo: SafeInfo = {
  safeAddress: "0x123",
  chainId: 4,
  threshold: 1,
  owners: [],
};

const unlistedToken: TokenInfo = {
  address: "0x6b175474e89094c44da98b954eedeac495271d0f",
  decimals: 18,
  symbol: "UNL",
  name: "Unlisted",
  chainId: -1,
};

const addresses = {
  receiver1: "0x1000000000000000000000000000000000000000",
  receiver2: "0x2000000000000000000000000000000000000000",
  receiver3: "0x3000000000000000000000000000000000000000",
};

export const testData = {
  dummySafeInfo,
  unlistedToken,
  addresses,
};
