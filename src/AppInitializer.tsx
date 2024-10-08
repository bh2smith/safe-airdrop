import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";

import { useLoadAssets, useLoadCollectibles } from "./hooks/useBalances";
import { useLoadChains } from "./hooks/useChains";
import { useHydrateBookmarks } from "./hooks/useHydrateBookmarks";
import { useLoadAddressbook } from "./hooks/useLoadAddressbook";

export const AppInitializer = () => {
  const { safe } = useSafeAppsSDK();
  useLoadChains();
  useLoadAssets(safe);
  useLoadCollectibles(safe);
  useLoadAddressbook();
  useHydrateBookmarks();
  return <></>;
};
