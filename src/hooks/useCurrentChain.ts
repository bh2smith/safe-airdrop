import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useMemo } from "react";
import { selectNetworks } from "src/stores/slices/networksSlice";
import { useAppSelector } from "src/stores/store";

export const useCurrentChain = () => {
  const { safe } = useSafeAppsSDK();
  const chains = useAppSelector(selectNetworks);

  return useMemo(() => {
    return chains.find((chain) => chain.chainID === safe.chainId);
  }, [chains, safe]);
};
