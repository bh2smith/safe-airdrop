import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { ethers, BigNumber } from "ethers";
import { useCallback, useMemo } from "react";
import { resolveIpfsUri, ZERO } from "src/utils";

import { erc1155Instance } from "../transfers/erc1155";
import { erc165Instance } from "../transfers/erc165";
import { erc721Instance } from "../transfers/erc721";

const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC721_METADATA_INTERFACE_ID = "0x5b5e139f";
const ERC1155_INTERFACE_ID = "0xd9b67a26";
const ERC1155_METADATA_INTERFACE_ID = "0x0e89341c";

export type CollectibleTokenInfo = {
  token_type: "erc721" | "erc1155";
  address: string;
  hasMetaInfo: boolean;
};

export type CollectibleTokenMetaInfo = {
  imageURI?: string;
  name?: string;
};

export interface CollectibleTokenInfoProvider {
  getTokenInfo: (tokenAddress: string, id: BigNumber) => Promise<CollectibleTokenInfo | undefined>;
  getFromAddress: () => string;
  fetchMetaInfo: (
    tokenAddress: string,
    id: BigNumber,
    token_type: "erc1155" | "erc721",
  ) => Promise<CollectibleTokenMetaInfo>;
}

export const useCollectibleTokenInfoProvider: () => CollectibleTokenInfoProvider = () => {
  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);

  const collectibleContractCache = useMemo(() => new Map<string, CollectibleTokenInfo | undefined>(), []);

  const contractInterfaceCache = useMemo(
    () => new Map<string, ["erc721" | "erc721_Meta" | "erc1155" | "erc1155_Meta" | undefined]>(),
    [],
  );

  const determineInterface: (
    tokenAddress: string,
  ) => Promise<["erc721" | "erc721_Meta" | "erc1155" | "erc1155_Meta" | undefined]> = useCallback(
    async (tokenAddress: string) => {
      if (contractInterfaceCache.has(tokenAddress)) {
        return contractInterfaceCache.get(tokenAddress) ?? [undefined];
      }
      let determinedInterface: ["erc721" | "erc721_Meta" | "erc1155" | "erc1155_Meta" | undefined] = [undefined];
      const erc165Contract = erc165Instance(tokenAddress, web3Provider);
      const isErc1155 = await erc165Contract.supportsInterface(ERC1155_INTERFACE_ID).catch(() => false);
      if (isErc1155) {
        determinedInterface = ["erc1155"];
        if (await erc165Contract.supportsInterface(ERC1155_METADATA_INTERFACE_ID).catch(() => false)) {
          determinedInterface.push("erc1155_Meta");
        }
      } else {
        const isErc721 = await erc165Contract.supportsInterface(ERC721_INTERFACE_ID).catch(() => false);
        if (isErc721) {
          determinedInterface = ["erc721"];
          if (await erc165Contract.supportsInterface(ERC721_METADATA_INTERFACE_ID).catch(() => false)) {
            determinedInterface.push("erc721_Meta");
          }
        }
      }
      if (determinedInterface) {
        contractInterfaceCache.set(tokenAddress, determinedInterface);
      }
      return determinedInterface;
    },
    [contractInterfaceCache, web3Provider],
  );
  const getTokenInfo = useCallback(
    async (tokenAddress: string, id: BigNumber) => {
      let tokenId: string = "-1";
      // We used to check that its an integer and is also a number (but this doesn't exist on ethers.BigNumber)
      if (id.gt(ZERO)) {
        tokenId = id.toString();
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
          hasMetaInfo: tokenInterfaces.includes("erc721_Meta"),
        };
      } else if (tokenInterfaces.includes("erc1155")) {
        fetchedTokenInfo = {
          token_type: "erc1155",
          address: tokenAddress,
          hasMetaInfo: tokenInterfaces.includes("erc1155_Meta"),
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
    tokenAddress: string,
    id: BigNumber,
    token_type: "erc1155" | "erc721",
  ) => Promise<CollectibleTokenMetaInfo> = useCallback(
    async (tokenAddress: string, id: BigNumber, token_type: "erc1155" | "erc721") => {
      if (token_type === "erc721") {
        const erc721Contract = erc721Instance(tokenAddress, web3Provider);
        const metaInfo: CollectibleTokenMetaInfo = {
          name: await erc721Contract.name().catch(() => undefined),
        };
        let tokenURI = await erc721Contract.tokenURI(id.toString()).catch(() => undefined);
        if (tokenURI) {
          tokenURI = resolveIpfsUri(tokenURI);
          const metaDataJSON = await ethers.utils.fetchJson(tokenURI).catch(() => undefined);
          metaInfo.imageURI = metaDataJSON?.image ? resolveIpfsUri(metaDataJSON?.image) : undefined;
        }
        return metaInfo;
      } else {
        const erc1155Contract = erc1155Instance(tokenAddress, web3Provider);
        const metaInfo: CollectibleTokenMetaInfo = {};
        let tokenURI = await erc1155Contract.uri(id.toString()).catch(() => undefined);
        if (tokenURI) {
          tokenURI = resolveIpfsUri(tokenURI);
          const metaDataJSON = await ethers.utils.fetchJson(tokenURI).catch(() => undefined);
          metaInfo.imageURI = metaDataJSON?.image ? resolveIpfsUri(metaDataJSON?.image) : undefined;
          metaInfo.name = metaDataJSON?.name;
        }
        return metaInfo;
      }
    },
    [web3Provider],
  );

  const getFromAddress = useCallback(() => {
    return safe.safeAddress;
  }, [safe]);

  return useMemo(
    () => ({
      getTokenInfo: (tokenAddress: string, id: BigNumber) => getTokenInfo(tokenAddress, id),
      getFromAddress: () => getFromAddress(),
      fetchMetaInfo: (tokenAddress: string, id: BigNumber, token_type: "erc1155" | "erc721") =>
        fetchMetaInfo(tokenAddress, id, token_type),
    }),
    [getTokenInfo, getFromAddress, fetchMetaInfo],
  );
};

/**
 * Maps cannot hash custom objects. So we convert token address and id to a unique key.
 */
const toKey = (tokenAddr: string, id: string) => `addr: ${tokenAddr}, id: ${id}`;
