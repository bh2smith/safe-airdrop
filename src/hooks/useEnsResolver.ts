import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useCallback, useMemo } from "react";
import { selectAddressbook } from "src/stores/slices/addressbookSlice";
import { useAppSelector } from "src/stores/store";
import { isAddress } from "viem";

import { useWeb3Provider } from "./useWeb3Provider";

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
  const { safe } = useSafeAppsSDK();
  const web3Provider = useWeb3Provider();
  const resolveCache = useMemo(() => new Map<string, `0x${string}` | null>(), []);

  const lookupCache = useMemo(() => new Map<string, string | null>(), []);

  const addressbook = useAppSelector(selectAddressbook);

  const lookupAddress = useCallback(
    async (address: `0x${string}`) => {
      const nameFromAb = addressbook.find((abItem) => {
        return abItem.address.toLowerCase() === address.toLowerCase() && abItem.chainId === safe?.chainId.toString();
      })?.name;

      if (nameFromAb) {
        return Promise.resolve(nameFromAb);
      }

      return await web3Provider.getEnsName({ address: address });
    },
    [addressbook, safe?.chainId, web3Provider],
  );

  const cachedResolveName = useCallback(
    async (ensName: string) => {
      if (isAddress(ensName)) {
        return ensName;
      }
      const cachedAddress = resolveCache.get(ensName);
      const resolvedAddress = cachedAddress ?? (await web3Provider.getEnsAddress({ name: ensName }).catch(() => null));
      if (!resolveCache.has(ensName)) {
        resolveCache.set(ensName, resolvedAddress);
      }
      return resolvedAddress;
    },
    [resolveCache, web3Provider],
  );

  const cachedLookupAddress = useCallback(
    async (address: `0x${string}`) => {
      const cachedAddress = lookupCache.get(address);
      const resolvedEnsName = typeof cachedAddress !== "undefined" ? cachedAddress : await lookupAddress(address);
      if (!lookupCache.has(address)) {
        lookupCache.set(address, resolvedEnsName);
      }
      return resolvedEnsName;
    },
    [lookupAddress, lookupCache],
  );

  const isEnsEnabled = useCallback(async () => {
    const chainId = await web3Provider.getChainId();
    return chainId === 1 || chainId === 11155111;
  }, [web3Provider]);

  return useMemo(
    () => ({
      resolveName: (ensName: string) => cachedResolveName(ensName),
      lookupAddress: (address: `0x${string}`) => cachedLookupAddress(address),
      isEnsEnabled: () => isEnsEnabled(),
    }),
    [cachedResolveName, cachedLookupAddress, isEnsEnabled],
  );
};
