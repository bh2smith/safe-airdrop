import { SafeInfo } from "@safe-global/safe-apps-sdk";
import { useEffect, useMemo } from "react";
import { NetworkInfo } from "src/networks";
import { AssetBalance, setAssetBalances } from "src/stores/slices/assetBalanceSlice";
import { NFTBalance, setCollectibles } from "src/stores/slices/collectiblesSlice";
import { useAppDispatch } from "src/stores/store";
import useSwr from "swr";
import useSWRInfinite from "swr/infinite";

import { useCurrentChain } from "./useCurrentChain";

const COLLECTIBLE_LIMIT = 10;
const COLLECTIBLE_MAX_PAGES = 10;

const getBaseURL = (chainConfig: NetworkInfo, safeAddress: string, version: "v1" | "v2"): string => {
  return `${chainConfig.baseAPI}/api/${version}/safes/${safeAddress}`;
};

const useErc20Balances = (safeAddress?: string, chainId?: number) => {
  const chainConfig = useCurrentChain();

  const { data, isLoading } = useSwr(
    !safeAddress || !chainConfig ? null : "erc20-balances",
    async () => {
      if (!chainConfig || !safeAddress) {
        return undefined;
      }
      const endpointUrl = `${getBaseURL(chainConfig, safeAddress, "v1")}/balances?trusted=false&exclude_spam=true`;

      const result = await fetch(endpointUrl).then((resp) => {
        if (resp.ok) {
          return resp.json() as Promise<AssetBalance>;
        }
        throw new Error("Error fetching fungible balances");
      });

      return result;
    },
    { errorRetryCount: 1, revalidateOnFocus: false },
  );

  return {
    balances: data,
    isLoading,
  };
};

const useCollectibleBalances = (safeAddress?: string, chainId?: number) => {
  const chainConfig = useCurrentChain();

  const getKey = useMemo(
    () => (pageIndex: number, previousPageData: NFTBalance) => {
      if (!safeAddress || !chainConfig) {
        // We cannot fetch data while the address is resolving or the chains are loading
        return null;
      }
      if (!previousPageData) {
        // Load first page
        return `${getBaseURL(chainConfig, safeAddress, "v2")}/collectibles?trusted=false&exclude_spam=true&limit=10`;
      }
      if (previousPageData && !previousPageData.next) return null; // reached the end

      // Load next page
      return previousPageData.next;
    },
    [safeAddress, chainConfig],
  );

  const { data, setSize, size, isLoading } = useSWRInfinite(
    getKey,
    async (url: string) => {
      const result = await fetch(url).then((resp) => {
        if (resp.ok) {
          return resp.json() as Promise<NFTBalance>;
        }
        throw new Error("Error fetching collectibles");
      });

      return result;
    },
    { errorRetryCount: 1, revalidateOnFocus: false },
  );

  // We load up to 10 pages of NFTs for performance reasons
  useEffect(() => {
    if (data && data.length > 0) {
      const totalPages = Math.max(COLLECTIBLE_MAX_PAGES, Math.ceil(data[0].count / COLLECTIBLE_LIMIT));
      if (totalPages > size && size !== COLLECTIBLE_LIMIT) {
        setSize(Math.ceil(data[0].count / COLLECTIBLE_LIMIT));
      }
    }
  }, [data, setSize, size]);

  const flatData = useMemo(() => {
    if (data === undefined) {
      return [];
    }
    return data.flatMap((entry) => entry.results);
  }, [data]);

  return {
    collectibles: flatData,
    isLoading,
  };
};

export const useLoadCollectibles = (safe?: SafeInfo) => {
  const dispatch = useAppDispatch();
  const data = useCollectibleBalances(safe?.safeAddress, safe?.chainId);

  // Store in slice
  useEffect(() => {
    if (data) {
      dispatch(setCollectibles(data));
    }
  }, [data, dispatch]);
};

export const useLoadAssets = (safe?: SafeInfo) => {
  const dispatch = useAppDispatch();
  const data = useErc20Balances(safe?.safeAddress, safe?.chainId);

  // Store in slice
  useEffect(() => {
    if (data) {
      dispatch(setAssetBalances(data));
    }
  }, [data, dispatch]);
};
