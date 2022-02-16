import BigNumber from "bignumber.js";

interface NetworkInfo {
  shortName: string;
  chainID: number;
  name: string;
  currencySymbol: string;
  baseAPI?: string;
  blockGasLimit: BigNumber;
}

export const networkInfo = new Map<number, NetworkInfo>([
  [
    1,
    {
      chainID: 1,
      name: "Ethereum",
      shortName: "eth",
      currencySymbol: "ETH",
      baseAPI: "https://safe-transaction.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    4,
    {
      chainID: 4,
      name: "Rinkeby",
      shortName: "rin",
      currencySymbol: "RIN",
      baseAPI: "https://safe-transaction.rinkeby.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    5,
    {
      chainID: 5,
      name: "Goerli",
      shortName: "gor",
      currencySymbol: "GOR",
      baseAPI: "https://safe-transaction.goerli.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    10,
    {
      chainID: 10,
      name: "Optimism",
      shortName: "oeth",
      currencySymbol: "OETH",
      baseAPI: "https://safe-transaction.optimism.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    56,
    {
      chainID: 56,
      name: "Binance Smart Chain",
      shortName: "bnb",
      currencySymbol: "BNB",
      baseAPI: "https://safe-transaction.bsc.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(80_000_000),
    },
  ],
  [
    100,
    {
      chainID: 100,
      name: "Gnosis Chain (formerly xDai)",
      shortName: "xdai", // gno this is the offical shortname. wierdly gnosis Safe still uses xdai
      currencySymbol: "xDAI",
      baseAPI: "https://safe-transaction.xdai.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    137,
    {
      chainID: 137,
      name: "Polygon",
      shortName: "matic",
      currencySymbol: "MATIC",
      baseAPI: "https://safe-transaction.polygon.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    246,
    {
      chainID: 246,
      name: "Energy Web Chain",
      shortName: "ewt",
      currencySymbol: "EWT",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    42161,
    {
      chainID: 42161,
      name: "Arbitrum One",
      shortName: "arb1",
      currencySymbol: "AETH",
      baseAPI: "https://safe-transaction.arbitrum.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(200_000_000),
    },
  ],
  [
    43114,
    {
      chainID: 43114,
      name: "Avalanche",
      shortName: "avax",
      currencySymbol: "AVAX",
      baseAPI: "https://safe-transaction.avalanche.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
  [
    73799,
    {
      chainID: 73799,
      name: "Volta",
      shortName: "vt",
      currencySymbol: "VT",
      baseAPI: "https://safe-transaction.volta.gnosis.io/api/v1",
      blockGasLimit: new BigNumber(30_000_000),
    },
  ],
]);
