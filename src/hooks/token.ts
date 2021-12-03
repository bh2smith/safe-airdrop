import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { ethers, utils } from "ethers";
import xdaiTokens from "honeyswap-default-token-list";
import { useState, useEffect, useMemo } from "react";

import { erc20Instance } from "../erc20";
import rinkeby from "../static/rinkebyTokens.json";
import rskTestnet from "../static/rskTestnetTokens.json";
import rsk from "../static/rskTokens.json";
import { TokenInfo } from "../utils";

export type TokenMap = Map<string | null, MinimalTokenInfo>;

export const networkMap = new Map([
  [1, "mainnet"],
  [4, "rinkeby"],
  [100, "xdai"],
  [137, "polygon"],
  [56, "bsc"],
  [30, "rsk"],
  [31, "trsk"],
]);

const customNativeTokens = new Map([
  [1, "ETH"],
  [4, "ETH"],
  [56, "BNB"],
  [100, "xDai"],
  [137, "MATIC"],
  [30, "RBTC"],
  [31, "tRBTC"],
]);

function tokenMap(tokenList: TokenInfo[]): TokenMap {
  const res: TokenMap = new Map<string, MinimalTokenInfo>();
  for (const token of tokenList) {
    res.set(utils.getAddress(token.address), token);
  }
  return res;
}

export const fetchTokenList = async (chainId: number): Promise<TokenMap> => {
  let tokens: TokenInfo[];
  switch (chainId) {
    case 1:
      const mainnetTokenURL = "https://tokens.coingecko.com/uniswap/all.json";
      tokens = (await (await fetch(mainnetTokenURL)).json()).tokens;
      break;
    case 4:
      // Hardcoded this because the list provided at
      // https://github.com/Uniswap/default-token-list/blob/master/src/tokens/rinkeby.json
      // Doesn't have GNO or OWL and/or many others.
      tokens = rinkeby;
      break;
    case 30:
      tokens = rsk;
      break;
    case 31:
      tokens = rskTestnet;
      break;
    case 100:
      tokens = xdaiTokens.tokens;
      break;
    default:
      console.warn(`Unimplemented token list for ${networkMap.get(chainId)} network`);
      tokens = [];
  }
  return tokenMap(tokens);
};

/**
 * Hook which fetches the tokenList for Components.
 * Will Execute only once on initial load.
 */
export function useTokenList(): {
  tokenList: TokenMap;
  isLoading: boolean;
} {
  const { safe } = useSafeAppsSDK();
  const [tokenList, setTokenList] = useState<TokenMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchTokenList(safe.chainId).then((result) => {
      if (isMounted) {
        setTokenList(result);
        setIsLoading(false);
      }
    });
    return function callback() {
      isMounted = false;
    };
  }, [safe.chainId]);
  return { tokenList, isLoading };
}

export type MinimalTokenInfo = {
  decimals: number;
  address: string;
  symbol?: string;
  logoURI?: string;
};

export interface TokenInfoProvider {
  getTokenInfo: (tokenAddress: string) => Promise<MinimalTokenInfo | undefined>;
  getNativeTokenSymbol: () => string;
}

export const useTokenInfoProvider: () => TokenInfoProvider = () => {
  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);
  const { tokenList } = useTokenList();

  return useMemo(
    () => ({
      getTokenInfo: async (tokenAddress: string) => {
        if (tokenList?.has(tokenAddress)) {
          return tokenList.get(tokenAddress);
        } else {
          const tokenContract = erc20Instance(tokenAddress, web3Provider);
          const decimals = await tokenContract.decimals().catch((reason) => undefined);
          const symbol = await tokenContract.symbol().catch((reason) => undefined);

          if (typeof decimals !== "undefined") {
            tokenList?.set(tokenAddress, {
              decimals,
              symbol,
              address: tokenAddress,
            });
            return { decimals, symbol, address: tokenAddress };
          } else {
            return undefined;
          }
        }
      },
      getNativeTokenSymbol: () => customNativeTokens.get(safe.chainId) || "ETH",
    }),
    [safe.chainId, tokenList, web3Provider],
  );
};
