import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { ethers } from "ethers";
import { useMemo } from "react";

export interface EnsResolver {
  /**
   * Resolves a ENS name to a corresponding address.
   * Important: If the name is already a valid address, this address will be returned.
   *
   * Returns null if the ENS name cannot be resolved.
   *
   * @param ensName ENS Name or address.
   */
  resolveName(ensName: string): Promise<string | null>;
}

export const useEnsResolver: () => EnsResolver = () => {
  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);

  return useMemo(
    () => ({
      resolveName: (ensName: string) => web3Provider.resolveName(ensName),
    }),
    [web3Provider],
  );
};
