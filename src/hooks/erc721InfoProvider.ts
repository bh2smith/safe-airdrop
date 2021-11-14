import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { ethers } from "ethers";
import { useCallback, useMemo } from "react";

import { erc721Instance } from "../transfers/erc721";

export type ERC721TokenInfo = {
  name: string;
  symbol: string;
};

export interface ERC721InfoProvider {
  getTokenInfo: (tokenAddress: string) => Promise<ERC721TokenInfo | undefined>;
  getFromAddress: () => string;
}

export const useERC721InfoProvider: () => ERC721InfoProvider = () => {
  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);

  const erc721ContractCache = useMemo(() => new Map<string, ERC721TokenInfo | undefined>(), []);

  const getTokenInfo = useCallback(
    async (tokenAddress: string) => {
      if (erc721ContractCache.has(tokenAddress)) {
        return erc721ContractCache.get(tokenAddress);
      }
      console.log("fetching erc721 token info");
      const erc721Contract = erc721Instance(tokenAddress, web3Provider);
      const name = await erc721Contract.name().catch(() => undefined);
      const symbol = await erc721Contract.symbol().catch(() => undefined);

      let fetchedTokenInfo: ERC721TokenInfo | undefined = undefined;
      if (name && symbol) {
        fetchedTokenInfo = {
          name,
          symbol,
        };
      }
      erc721ContractCache.set(tokenAddress, fetchedTokenInfo);
      return fetchedTokenInfo;
    },
    [erc721ContractCache, web3Provider],
  );

  const getFromAddress = useCallback(() => {
    return safe.safeAddress;
  }, [safe]);

  return useMemo(
    () => ({
      getTokenInfo: (tokenAddress: string) => getTokenInfo(tokenAddress),
      getFromAddress: () => getFromAddress(),
    }),
    [getTokenInfo, getFromAddress],
  );
};
