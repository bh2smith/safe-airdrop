import { TokenInfo } from "@uniswap/token-lists";
import rinkeby from "./static/rinkebyTokens.json";
import { utils } from "ethers";
import xdaiTokens from "honeyswap-default-token-list";

export type TokenMap = Map<string, TokenInfo>;

// TODO - shouldn't there be a more convienient way of converting a list into a map?
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
