import Web3 from "web3";

const NetworkMap = {
  mainnet: 1,
  ropsten: 3,
  rinkeby: 4,
  goerli: 5,
  kovan: 42,
  xdai: 100,
};

type NetworkName = keyof typeof NetworkMap;

// TODO - access infura key without publish (yarn add dotenv)
const INFURA_API_KEY = process.env.INFURA_API_KEY;

const SAFE_ENDPOINT_URLS = {
  [NetworkMap.rinkeby]: `https://safe-transaction.rinkeby.gnosis.io`,
  [NetworkMap.xdai]: `https://safe-transaction.xdai.gnosis.io`,
  [NetworkMap.mainnet]: `https://safe-transaction.gnosis.io`,
};

const checkNetwork = (networkName: string): networkName is NetworkName => {
  const networkId = (NetworkMap as Record<string, number | undefined>)[
    networkName
  ];
  return networkId !== undefined && SAFE_ENDPOINT_URLS[networkId] !== undefined;
};

export const getSafeEndpoint = (networkName: string): string => {
  if (!checkNetwork(networkName)) {
    throw new Error(
      `Safe Endpoint for ${networkName} is not configured. Please use a different network or configure the safe endpoint for ${networkName}`
    );
  }
  return SAFE_ENDPOINT_URLS[NetworkMap[networkName]];
};

export function getRpcEndpoint(networkName: string): string {
  if (!checkNetwork(networkName)) {
    throw new Error(
      `Network not configured. Please use a different network or configure the network id for ${networkName}`
    );
  }
  if (!INFURA_API_KEY) {
    console.error(`Missing Infura key!`);
  }

  // xDai not available on Infura, going with the default xDai endpoint instead
  if (networkName === "xdai") {
    return "wss://rpc.xdaichain.com/wss";
  }
  return `wss://${networkName}.infura.io/ws/v3/${INFURA_API_KEY}`;
}

export const initWeb3 = (network: string): Web3 => {
  const infuraEndpoint = getRpcEndpoint(network);
  const web3 = new Web3(new Web3.providers.WebsocketProvider(infuraEndpoint));

  return web3;
};
