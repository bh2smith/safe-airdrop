import { SafeAppProvider } from "@safe-global/safe-apps-provider";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { useCallback, useMemo } from "react";
import { useGetAllNFTsQuery } from "src/stores/api/balanceApi";
import { resolveIpfsUri } from "src/utils";

import { erc1155Instance } from "../transfers/erc1155";
import { erc165Instance } from "../transfers/erc165";
import { erc721Instance } from "../transfers/erc721";

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
  const nftBalanceQuery = useGetAllNFTsQuery();
  const currentNftBalance = nftBalanceQuery.currentData;

  const collectibleContractCache = useMemo(() => new Map<string, CollectibleTokenInfo | undefined>(), []);

  const contractInterfaceCache = useMemo(() => new Map<string, ["erc721" | "erc1155" | undefined]>(), []);

  const determineInterface: (tokenAddress: string) => Promise<["erc721" | "erc1155" | undefined]> = useCallback(
    async (tokenAddress: string) => {
      if (contractInterfaceCache.has(tokenAddress)) {
        return contractInterfaceCache.get(tokenAddress) ?? [undefined];
      }
      if (currentNftBalance) {
        const tokenInfo = currentNftBalance.results.find((nftEntry) => nftEntry.address === tokenAddress);
        if (tokenInfo) {
          return Promise.resolve(["erc721"]);
        }
      }
      let determinedInterface: ["erc721" | "erc1155" | undefined] = [undefined];
      const erc165Contract = erc165Instance(tokenAddress, web3Provider);
      const isErc1155 = await erc165Contract.supportsInterface(ERC1155_INTERFACE_ID).catch(() => false);
      if (isErc1155) {
        return ["erc1155"];
      } else {
        const isErc721 = await erc165Contract.supportsInterface(ERC721_INTERFACE_ID).catch(() => false);
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
    async (tokenAddress: string, id: BigNumber) => {
      let tokenId: string = "-1";
      if (!id.isNaN() && id.isInteger() && id.isPositive()) {
        tokenId = id.toFixed();
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
    tokenAddress: string,
    id: BigNumber,
    token_type: "erc1155" | "erc721",
  ) => Promise<CollectibleTokenMetaInfo> = useCallback(
    async (tokenAddress: string, id: BigNumber, token_type: "erc1155" | "erc721") => {
      if (token_type === "erc721") {
        if (currentNftBalance) {
          const tokenInfo = currentNftBalance.results.find(
            (nftEntry) => nftEntry.address === tokenAddress && nftEntry.id === id.toFixed(),
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
          name: await erc721Contract.name().catch(() => undefined),
        };
        let tokenURI = await erc721Contract.tokenURI(id.toFixed()).catch(() => undefined);
        if (tokenURI) {
          tokenURI = resolveIpfsUri(tokenURI);
          const metaDataJSON = await ethers.utils.fetchJson(tokenURI).catch(() => undefined);
          metaInfo.imageURI = metaDataJSON?.image ? resolveIpfsUri(metaDataJSON?.image) : undefined;
        }
        return metaInfo;
      } else {
        const erc1155Contract = erc1155Instance(tokenAddress, web3Provider);
        const metaInfo: CollectibleTokenMetaInfo = {};
        let tokenURI = await erc1155Contract.uri(id.toFixed()).catch(() => undefined);
        if (tokenURI) {
          tokenURI = resolveIpfsUri(tokenURI);
          const metaDataJSON = await ethers.utils.fetchJson(tokenURI).catch(() => undefined);
          metaInfo.imageURI = metaDataJSON?.image ? resolveIpfsUri(metaDataJSON?.image) : undefined;
          metaInfo.name = metaDataJSON?.name;
        }
        return metaInfo;
      }
    },
    [currentNftBalance, web3Provider],
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
