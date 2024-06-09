import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";

import { useLoadAssets, useLoadCollectibles } from "./hooks/useBalances";
import { useLoadChains } from "./hooks/useChains";

export const AppInitializer = () => {
  const { safe } = useSafeAppsSDK();
  useLoadChains();
  useLoadAssets(safe);
  useLoadCollectibles(safe);
  return <></>;
};
