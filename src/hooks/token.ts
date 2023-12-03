import { SafeAppProvider } from "@safe-global/safe-apps-provider";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { SafeBalanceResponse } from "@safe-global/safe-gateway-typescript-sdk";
import { ethers, utils } from "ethers";
import xdaiTokens from "honeyswap-default-token-list";
import { useState, useEffect, useMemo } from "react";

import { networkInfo } from "../networks";
import rinkeby from "../static/rinkebyTokens.json";
import { erc20Instance } from "../transfers/erc20";
import { TokenInfo } from "../utils";

export type TokenMap = Map<string | null, MinimalTokenInfo>;

function tokenMap(tokenList: TokenInfo[]): TokenMap {
  const res: TokenMap = new Map<string, MinimalTokenInfo>();
  for (const token of tokenList) {
    if (token.address) {
      res.set(utils.getAddress(token.address), token);
    }
  }
  return res;
}

export const fetchTokenList = async (chainId: number): Promise<TokenMap> => {
  let tokens: TokenInfo[];
  switch (chainId) {
    case 1:
      const mainnetTokenURL = "https://tokens.coingecko.com/uniswap/all.json";
      tokens = await fetch(mainnetTokenURL)
        .then((response) => response.json())
        .then((response) => response.tokens)
        .catch(() => []);
      break;
    case 4:
      // Hardcoded this because the list provided at
      // https://github.com/Uniswap/default-token-list/blob/master/src/tokens/rinkeby.json
      // Doesn't have GNO or OWL and/or many others.
      tokens = rinkeby;
      break;
    case 100:
      tokens = xdaiTokens.tokens;
      break;
    default:
      console.warn(`Unimplemented token list for ${networkInfo.get(chainId)?.name} network`);
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
  getSelectedNetworkShortname: () => string | undefined;
}

export const useTokenInfoProvider: () => TokenInfoProvider = () => {
  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);
  const [balances, setBalances] = useState<SafeBalanceResponse>({
    fiatTotal: "0",
    items: [],
  });
  useEffect(() => {
    let isMounted = true;
    sdk.safe
      .experimental_getBalances()
      .then((balances) => {
        isMounted && setBalances(balances);
      })
      .catch(() => console.error("Error fetching balances from safe apps sdk"));
    return () => {
      isMounted = false;
    };
  }, [sdk.safe]);
  const { tokenList } = useTokenList();

  return useMemo(
    () => ({
      getTokenInfo: async (tokenAddress: string) => {
        if (tokenList?.has(tokenAddress)) {
          return tokenList.get(tokenAddress);
        }

        const tokenInfoFromBalances = balances.items.find((item) => item.tokenInfo.address === tokenAddress);
        if (tokenInfoFromBalances) {
          return {
            decimals: tokenInfoFromBalances.tokenInfo.decimals,
            symbol: tokenInfoFromBalances.tokenInfo.symbol,
            address: tokenAddress,
            logoURI: tokenInfoFromBalances.tokenInfo.logoUri,
          };
        }

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
      },
      getNativeTokenSymbol: () => networkInfo.get(safe.chainId)?.currencySymbol ?? "ETH",
      getSelectedNetworkShortname: () => networkInfo.get(safe.chainId)?.shortName,
    }),
    [balances.items, safe.chainId, tokenList, web3Provider],
  );
};
