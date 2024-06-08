import { useEffect, useMemo } from "react";
import { NetworkInfo, staticNetworkInfo } from "src/networks";
import { setNetworks } from "src/stores/slices/networksSlice";
import { useAppDispatch } from "src/stores/store";
import useSwr from "swr";

const CONFIG_SERVICE_URL = "https://safe-config.safe.global/api/v1/chains";

type ChainEndpointResponse = {
  next: string | null;
  previous: string | null;
  count: number;
  results: {
    chainId: string;
    chainName: string;
    shortName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: 18;
      logoUri: string;
    };
    transactionService: string;
  }[];
};

export const useLoadChains = () => {
  const chains = useChains();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      setNetworks({
        networks: [...chains.values()],
      }),
    );
  }, [chains, dispatch]);
};

const useChains = () => {
  const { data: chainConfigs, isLoading } = useSwr("chains", async (): Promise<NetworkInfo[]> => {
    const result = await fetch(CONFIG_SERVICE_URL).then((resp) => {
      if (resp.ok) {
        return resp.json() as Promise<ChainEndpointResponse>;
      }
      return Promise.reject(new Error("Unexpected error while loading chain configs. Falling back to static list."));
    });

    return result.results.map((chainConfig) => ({
      chainID: Number(chainConfig.chainId),
      name: chainConfig.chainName,
      shortName: chainConfig.shortName,
      currencySymbol: chainConfig.nativeCurrency.symbol,
      baseAPI: chainConfig.transactionService,
    }));
  });

  return useMemo(() => {
    if (isLoading || chainConfigs === undefined) {
      return staticNetworkInfo;
    } else {
      const mappedNetworks = new Map<number, NetworkInfo>();
      chainConfigs.forEach((chainConfig) => {
        mappedNetworks.set(chainConfig.chainID, chainConfig);
      });
      return mappedNetworks;
    }
  }, [chainConfigs, isLoading]);
};
