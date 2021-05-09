import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { TokenInfo } from "@uniswap/token-lists";
import { utils } from "ethers";
import xdaiTokens from "honeyswap-default-token-list";
import { useState, useEffect } from "react";

import rinkeby from "../static/rinkebyTokens.json";

export type TokenMap = Map<string, TokenInfo>;

// TODO - shouldn't there be a more convenient way of converting a list into a map?
function tokenMap(tokenList: TokenInfo[]): TokenMap {
  const res: TokenMap = new Map<string, TokenInfo>();
  for (const token of tokenList) {
    res.set(utils.getAddress(token.address), token);
  }
  return res;
}

export const fetchTokenList = async (
  networkName: string
): Promise<TokenMap> => {
  let tokens: TokenInfo[];
  if (networkName === "MAINNET") {
    const mainnetTokenURL = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";
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
  }
  return tokenMap(tokens);
};

/**
 * Hook which fetches the tokenList for Components.
 * Will Execute only once on initial load because useEffect gets passed an empty array.
 */
export function useTokenList(): { tokenList: TokenMap; isLoading: boolean } {
  const { safe } = useSafeAppsSDK();
  const [tokenList, setTokenList] = useState<TokenMap>();
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
