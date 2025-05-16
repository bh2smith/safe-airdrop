import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useCallback, useMemo } from "react";
import { selectCollectibles } from "src/stores/slices/collectiblesSlice";
import { useAppSelector } from "src/stores/store";
import { fetchJson, resolveIpfsUri } from "src/utils";

import { erc1155Instance } from "../transfers/erc1155";
import { erc165Instance } from "../transfers/erc165";
import { erc721Instance } from "../transfers/erc721";

import { useWeb3Provider } from "./useWeb3Provider";

const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC1155_INTERFACE_ID = "0xd9b67a26";

export type CollectibleTokenInfo = {
  token_type: "erc721" | "erc1155";
  address: string;
};

export type CollectibleTokenMetaInfo = {
  imageURI?: string;
  name?: string;
};

export interface CollectibleTokenInfoProvider {
  getTokenInfo: (tokenAddress: `0x${string}`, id: string) => Promise<CollectibleTokenInfo | undefined>;
  getFromAddress: () => `0x${string}`;
  fetchMetaInfo: (
    tokenAddress: `0x${string}`,
    id: string,
    token_type: "erc1155" | "erc721",
  ) => Promise<CollectibleTokenMetaInfo>;
}

export const useCollectibleTokenInfoProvider: () => CollectibleTokenInfoProvider = () => {
  const { safe } = useSafeAppsSDK();
  const web3Provider = useWeb3Provider();
  const currentNftBalance = useAppSelector(selectCollectibles);
  const collectibleContractCache = useMemo(() => new Map<string, CollectibleTokenInfo | undefined>(), []);

  const contractInterfaceCache = useMemo(() => new Map<string, ["erc721" | "erc1155" | undefined]>(), []);

  const determineInterface: (tokenAddress: `0x${string}`) => Promise<["erc721" | "erc1155" | undefined]> = useCallback(
    async (tokenAddress: `0x${string}`) => {
      if (contractInterfaceCache.has(tokenAddress)) {
        return contractInterfaceCache.get(tokenAddress) ?? [undefined];
      }
      if (currentNftBalance) {
        const tokenInfo = currentNftBalance.find((nftEntry) => nftEntry.address === tokenAddress);
        if (tokenInfo) {
          return Promise.resolve(["erc721"]);
        }
      }
      let determinedInterface: ["erc721" | "erc1155" | undefined] = [undefined];
      const erc165Contract = erc165Instance(tokenAddress, web3Provider);
      const isErc1155 = await erc165Contract.read.supportsInterface([ERC1155_INTERFACE_ID]).catch(() => false);
      if (isErc1155) {
        return ["erc1155"];
      } else {
        const isErc721 = await erc165Contract.read.supportsInterface([ERC721_INTERFACE_ID]).catch(() => false);
        if (isErc721) {
          return ["erc721"];
        }
      }
      if (determinedInterface) {
        contractInterfaceCache.set(tokenAddress, determinedInterface);
      }
      return determinedInterface;
    },
    [contractInterfaceCache, currentNftBalance, web3Provider],
  );
  const getTokenInfo = useCallback(
    async (tokenAddress: `0x${string}`, id: string) => {
      let tokenId: string = "-1";
      if (isNonNegativeInteger(id)) {
        tokenId = BigInt(id).toString();
      }
      if (collectibleContractCache.has(toKey(tokenAddress, tokenId))) {
        return collectibleContractCache.get(toKey(tokenAddress, tokenId));
      }
      const tokenInterfaces = await determineInterface(tokenAddress);
      let fetchedTokenInfo: CollectibleTokenInfo | undefined = undefined;
      if (tokenInterfaces.includes("erc721")) {
        fetchedTokenInfo = {
          token_type: "erc721",
          address: tokenAddress,
        };
      } else if (tokenInterfaces.includes("erc1155")) {
        fetchedTokenInfo = {
          token_type: "erc1155",
          address: tokenAddress,
        };
      }
      // We don't remember undefined tokenInfos in case there was a i.e. connection problem
      if (fetchedTokenInfo) {
        collectibleContractCache.set(toKey(tokenAddress, tokenId), fetchedTokenInfo);
      }
      return fetchedTokenInfo;
    },
    [collectibleContractCache, determineInterface],
  );

  const fetchMetaInfo: (
    tokenAddress: `0x${string}`,
    id: string,
    token_type: "erc1155" | "erc721",
  ) => Promise<CollectibleTokenMetaInfo> = useCallback(
    async (tokenAddress: `0x${string}`, id: string, token_type: "erc1155" | "erc721") => {
      if (token_type === "erc721") {
        if (currentNftBalance) {
          const tokenInfo = currentNftBalance.find(
            (nftEntry) => nftEntry.address === tokenAddress && nftEntry.id === id,
          );
          if (tokenInfo && tokenInfo.imageUri && tokenInfo.name) {
            return {
              imageURI: tokenInfo.imageUri,
              name: tokenInfo.name,
            };
          }
        }
        const erc721Contract = erc721Instance(tokenAddress, web3Provider);
        const metaInfo: CollectibleTokenMetaInfo = {
          name: await erc721Contract.read.name().catch(() => undefined),
        };
        let tokenURI = await erc721Contract.read.tokenURI([BigInt(id)]).catch(() => undefined);
        if (tokenURI) {
          tokenURI = resolveIpfsUri(tokenURI);
          const metaDataJSON = await fetchJson(tokenURI).catch(() => undefined);
          metaInfo.imageURI = metaDataJSON?.image ? resolveIpfsUri(metaDataJSON?.image) : undefined;
        }
        return metaInfo;
      } else {
        const erc1155Contract = erc1155Instance(tokenAddress, web3Provider);
        const metaInfo: CollectibleTokenMetaInfo = {};
        let tokenURI = await erc1155Contract.read.tokenURI([BigInt(id)]).catch(() => undefined);
        if (tokenURI) {
          tokenURI = resolveIpfsUri(tokenURI);
          const metaDataJSON = await fetchJson(tokenURI).catch(() => undefined);
          metaInfo.imageURI = metaDataJSON?.image ? resolveIpfsUri(metaDataJSON?.image) : undefined;
          metaInfo.name = metaDataJSON?.name;
        }
        return metaInfo;
      }
    },
    [currentNftBalance, web3Provider],
  );

  const getFromAddress = useCallback(() => {
    return safe.safeAddress as `0x${string}`;
  }, [safe]);

  return useMemo(
    () => ({
      getTokenInfo: (tokenAddress: `0x${string}`, id: string) => getTokenInfo(tokenAddress, id),
      getFromAddress: () => getFromAddress(),
      fetchMetaInfo: (tokenAddress: `0x${string}`, id: string, token_type: "erc1155" | "erc721") =>
        fetchMetaInfo(tokenAddress, id, token_type),
    }),
    [getTokenInfo, getFromAddress, fetchMetaInfo],
  );
};

/**
 * Maps cannot hash custom objects. So we convert token address and id to a unique key.
 */
const toKey = (tokenAddr: string, id: string) => `addr: ${tokenAddr}, id: ${id}`;

const isNonNegativeInteger = (str: string): boolean => {
  return /^\d+$/.test(str);
};
