import { TokenInfo } from "@uniswap/token-lists";
import rinkeby from "./static/rinkebyTokens.json";
import { utils } from "ethers";
import xdaiTokens from "honeyswap-default-token-list";
import { useSafe } from "@rmeissner/safe-apps-react-sdk";
import { useState, useEffect } from "react";

export type TokenMap = Map<string, TokenInfo>;

// TODO - shouldn't there be a more convenient way of converting a list into a map?
function tokenMap(tokenList: TokenInfo[]): TokenMap {
  const res: TokenMap = new Map<string, TokenInfo>();
  console.log("Sanitizing Token Addresses");
  for (const token of tokenList) {
    res.set(utils.getAddress(token.address), token);
  }
  return res;
}

export const fetchTokenList = async (networkName: string) => {
  let tokens: TokenInfo[];
  if (networkName === "mainnet") {
    const mainnetTokenURL = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";
    tokens = (await (await fetch(mainnetTokenURL)).json()).tokens;
  } else if (networkName === "rinkeby") {
    // Hardcoded this because the list provided at
    // https://github.com/Uniswap/default-token-list/blob/master/src/tokens/rinkeby.json
    // Doesn't have GNO or OWL and/or many others.
    tokens = rinkeby;
  } else if (networkName === "xdai") {
    tokens = xdaiTokens.tokens;
  } else {
    console.error(`Unimplemented token list for ${networkName} network`);
  }
  console.log(`Fetched ${tokens.length} for ${networkName} network`);
  return tokenMap(tokens);
};

/**
 * Hook which fetches the tokenList for Components.
 * Will Execute only once on initial load because useEffect gets passed an empty array.
 */
export function useTokenList() {
  const safe = useSafe();
  const [tokenList, setTokenList] = useState<TokenMap>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchToken = async () => {
      setIsLoading(true);
      const result = await fetchTokenList(safe.info.network);
      setTokenList(result);
      setIsLoading(false);
    };
    fetchToken();
  }, [safe.info.network]);
  return { tokenList, isLoading };
}
