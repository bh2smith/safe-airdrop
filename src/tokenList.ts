import { TokenInfo } from '@uniswap/token-lists';
import rinkeby from './static/rinkebyTokens.json';

export type TokenMap = Map<string, TokenInfo>;


// TODO - shouldn't there be a more convienient way of converting a list into a map?
function tokenMap(tokenList: TokenInfo[]): TokenMap {
  const res: TokenMap = new Map<string, TokenInfo>();
  for (const token of tokenList) {
    res.set(token.address, token);
  }
  return res
} 

export const fetchTokenList = async (networkName: string) => {
  let tokens: TokenInfo[];
  if (networkName === "mainnet") {
    // TODO - may not be fetchin this token list correctly by hardcoded URL
    // Espesially given that we import @uniswap/token-lists
    // Note there is also a repo uniswap/default-token-lists
    const mainnetTokenURL = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";
    tokens = (await (await fetch(mainnetTokenURL)).json()).tokens
  } else if (networkName === "rinkeby") {
    // Hardcoded this because the list provided at 
    // https://github.com/Uniswap/default-token-list/blob/master/src/tokens/rinkeby.json
    // Doesn't have GNO or OWL.
    tokens = rinkeby;
  } else {
    console.error(`Unimplemented token list for ${networkName} network`)
  }
  console.log(`Fetched ${tokens.length} for ${networkName} network`);
  console.log("These are indexed by address as", tokenMap(tokens));

  console.log(tokenMap(tokens)["0xd0dab4e640d95e9e8a47545598c33e31bdb53c7c"])
  return tokenMap(tokens)
}
