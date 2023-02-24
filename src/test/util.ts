import { SafeInfo } from "@safe-global/safe-apps-sdk";

import { CollectibleTokenInfo } from "../hooks/collectibleTokenInfoProvider";
import { TokenInfo } from "../utils";

const dummySafeInfo: SafeInfo = {
  safeAddress: "0x1230000000000000000000000000000000000000",
  chainId: 4,
  threshold: 1,
  owners: [],
  isReadOnly: true,
};

const unlistedERC20Token: TokenInfo = {
  address: "0x6b175474e89094c44da98b954eedeac495271d0f",
  decimals: 18,
  symbol: "UNL",
  name: "Unlisted",
  chainId: -1,
};

const dummyERC721Token: CollectibleTokenInfo = {
  token_type: "erc721",
  address: "0x5500000000000000000000000000000000000000",
};

const dummyERC1155Token: CollectibleTokenInfo = {
  token_type: "erc1155",
  address: "0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656",
};

const addresses = {
  receiver1: "0x1000000000000000000000000000000000000000",
  receiver2: "0x2000000000000000000000000000000000000000",
  receiver3: "0x3000000000000000000000000000000000000000",
  dummyErc721Address: "0x5500000000000000000000000000000000000000",
  dummyErc1155Address: "0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656",
};

export const testData = {
  dummySafeInfo,
  unlistedERC20Token,
  addresses,
  dummyERC721Token,
  dummyERC1155Token,
};
