import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { ethers } from "ethers";
import { useCallback, useMemo } from "react";

export interface EnsResolver {
  /**
   * Resolves a ENS name to a corresponding address.
   * Important: If the name is already a valid address, this address will be returned.
   *
   * @returns null if the ENS name cannot be resolved.
   *
   * @param ensName ENS Name or address.
   */
  resolveName(ensName: string): Promise<string | null>;

  /**
   * Looks up the ENS name of an address.
   *
   * @returns null if no ENS name is registered for that address.
   * @param address address to lookup
   */
  lookupAddress(address: string): Promise<string | null>;

  /**
   * @returns true, if ENS is enabled for current network.
   */
  isEnsEnabled(): Promise<boolean>;
}

export const useEnsResolver: () => EnsResolver = () => {
  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);
  const resolveCache = useMemo(() => new Map<string, string | null>(), []);

  const lookupCache = useMemo(() => new Map<string, string | null>(), []);

  const cachedResolveName = useCallback(
    async (ensName: string) => {
      const cachedAddress = resolveCache.get(ensName);
      const resolvedAddress =
        typeof cachedAddress !== "undefined" ? cachedAddress : await web3Provider.resolveName(ensName);
      if (!resolveCache.has(ensName)) {
        resolveCache.set(ensName, resolvedAddress);
      }
      return resolvedAddress;
    },
    [resolveCache, web3Provider],
  );

  const cachedLookupAddress = useCallback(
    async (address: string) => {
      const cachedAddress = lookupCache.get(address);
      const resolvedEnsName =
        typeof cachedAddress !== "undefined" ? cachedAddress : await web3Provider.lookupAddress(address);
      if (!lookupCache.has(address)) {
        lookupCache.set(address, resolvedEnsName);
      }
      return resolvedEnsName;
    },
    [lookupCache, web3Provider],
  );

  const isEnsEnabled = useCallback(async () => {
    const network = await web3Provider.getNetwork();
    return typeof network.ensAddress !== "undefined" && network.ensAddress !== null;
  }, [web3Provider]);

  return useMemo(
    () => ({
      resolveName: (ensName: string) => cachedResolveName(ensName),
      lookupAddress: (address: string) => cachedLookupAddress(address),
      isEnsEnabled: () => isEnsEnabled(),
    }),
    [cachedResolveName, cachedLookupAddress, isEnsEnabled],
  );
};
