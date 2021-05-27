import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { TokenInfo } from "@uniswap/token-lists";
import { ethers, utils } from "ethers";
import xdaiTokens from "honeyswap-default-token-list";
import { useState, useEffect, useMemo } from "react";

import { erc20Instance } from "../erc20";
import rinkeby from "../static/rinkebyTokens.json";

export type TokenMap = Map<string | null, MinimalTokenInfo>;

function tokenMap(tokenList: TokenInfo[]): TokenMap {
  const res: TokenMap = new Map<string, MinimalTokenInfo>();
  for (const token of tokenList) {
    res.set(utils.getAddress(token.address), token);
  }
  return res;
}

export const fetchTokenList = async (networkName: string): Promise<TokenMap> => {
  let tokens: TokenInfo[];
  if (networkName === "MAINNET") {
    const mainnetTokenURL = "https://tokens.coingecko.com/uniswap/all.json";
    tokens = (await (await fetch(mainnetTokenURL)).json()).tokens;
  } else if (networkName === "RINKEBY") {
    // Hardcoded this because the list provided at
    // https://github.com/Uniswap/default-token-list/blob/master/src/tokens/rinkeby.json
    // Doesn't have GNO or OWL and/or many others.
    tokens = rinkeby;
  } else if (networkName === "XDAI") {
    tokens = xdaiTokens.tokens;
  } else {
    console.error(`Unimplemented token list for ${networkName} network`);
    throw new Error(`Unimplemented token list for ${networkName} network`);
  }
  console.log(`Fetched ${tokens.length} for ${networkName} network`);
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
    const fetchToken = async () => {
      setIsLoading(true);
      const result = await fetchTokenList(safe.network);
      setTokenList(result);
      setIsLoading(false);
    };
    fetchToken();
  }, [safe.network]);
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
    }),
    [tokenList, web3Provider],
  );
};
