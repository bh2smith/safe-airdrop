import { SafeAppProvider } from "@safe-global/safe-apps-provider";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useMemo } from "react";
import { createPublicClient, custom, type PublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";

const ensChains = {
  1: mainnet,
  11155111: sepolia,
};

export const useWeb3Provider = (): PublicClient => {
  const { safe, sdk } = useSafeAppsSDK();
  const chain = ensChains[safe.chainId];
  return useMemo(
    () => createPublicClient({ transport: custom(new SafeAppProvider(safe, sdk)), chain }) as PublicClient,
    [safe, sdk, chain],
  );
};
