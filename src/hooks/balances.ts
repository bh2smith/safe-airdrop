import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

const baseAPIMap = new Map([
  [1, "https://safe-transaction.gnosis.io/api/v1"],
  [4, "https://safe-transaction.rinkeby.gnosis.io/api/v1"],
  [100, "https://safe-transaction.xdai.gnosis.io/api/v1"],
  [137, "https://safe-transaction.polygon.gnosis.io/api/v1"],
  [56, "https://safe-transaction.bsc.gnosis.io/api/v1"],
]);

type Token = {
  name: string;
  symbol: string;
  decimals: number;
};

type AssetBalanceEntry = {
  tokenAddress: string | null;
  token: Token | null;
  balance: string;
  decimals: number;
};

type CollectibleBalanceEntry = {
  address: string;
  tokenName: string;
  tokenSymbol: string;
  id: string;
};

export type AssetBalance = AssetBalanceEntry[];
export type CollectibleBalance = CollectibleBalanceEntry[];

export interface BalanceLoader {
  assetBalance: AssetBalance | undefined;

  collectibleBalance: CollectibleBalance | undefined;

  isLoading: boolean;
}

export const useBalances: () => BalanceLoader = () => {
  const { safe } = useSafeAppsSDK();

  const [isAssetBalanceLoading, setIsAssetBalanceLoading] = useState(true);
  const [isCollectibleBalanceLoading, setIsCollectibleBalanceLoading] = useState(true);

  const [assetBalance, setAssetBalance] = useState<AssetBalance | undefined>(undefined);
  const [collectibleBalance, setCollectibleBalance] = useState<CollectibleBalance | undefined>(undefined);

  const fetchAssetBalance = useCallback(async (chainId: number, safeAddress: string) => {
    if (baseAPIMap.has(chainId)) {
      return await fetch(`${baseAPIMap.get(chainId)}/safes/${safeAddress}/balances?trusted=false&exclude_spam=false`)
        .then((response) => {
          if (response.ok) {
            return response.json() as Promise<AssetBalanceEntry[]>;
          } else {
            throw Error(response.statusText);
          }
        })
        .catch(() => undefined);
    } else {
      return undefined;
    }
  }, []);

  const fetchCollectibleBalance = useCallback(async (chainId: number, safeAddress: string) => {
    if (baseAPIMap.has(chainId)) {
      return await fetch(
        `${baseAPIMap.get(chainId)}/safes/${safeAddress}/collectibles?trusted=false&exclude_spam=false`,
      )
        .then((response) => {
          if (response.ok) {
            return response.json() as Promise<CollectibleBalanceEntry[]>;
          } else {
            throw Error(response.statusText);
          }
        })
        .catch(() => undefined);
    } else {
      return undefined;
    }
  }, []);

  useEffect(() => {
    console.log("Loading Balances...");
    let isMounted = true;
    setIsAssetBalanceLoading(true);
    setIsCollectibleBalanceLoading(true);

    fetchAssetBalance(safe.chainId, safe.safeAddress).then((result) => {
      if (isMounted) {
        setAssetBalance(result);
        setIsAssetBalanceLoading(false);
      }
    });

    fetchCollectibleBalance(safe.chainId, safe.safeAddress).then((result) => {
      if (isMounted) {
        setCollectibleBalance(result);
        setIsCollectibleBalanceLoading(false);
      }
    });
    return function callback() {
      isMounted = false;
    };
  }, [fetchAssetBalance, fetchCollectibleBalance, safe.chainId, safe.safeAddress]);

  return {
    assetBalance: useMemo(() => assetBalance, [assetBalance]),
    collectibleBalance: useMemo(() => collectibleBalance, [collectibleBalance]),
    isLoading: isAssetBalanceLoading || isCollectibleBalanceLoading,
  };
};
