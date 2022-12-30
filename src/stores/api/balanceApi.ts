import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { networkInfo } from "src/networks";

import { RootState } from "../store";

type AssetBalanceEntry = {
  tokenAddress: string | null;
  token: Token | null;
  balance: string;
  decimals: number;
};

type NFTBalanceEntry = {
  address: string;
  tokenName: string;
  tokenSymbol: string;
  id: string;
  imageUri: string;
  name: string;
};

type Token = {
  name: string;
  symbol: string;
  decimals: number;
};

export type AssetBalance = AssetBalanceEntry[];
export type NFTBalance = { next: string | null; results: NFTBalanceEntry[] };

const dynamicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraoptions,
) => {
  const isCollectible = args.toString().startsWith("collectibles");
  const safeInfo = (api.getState() as RootState).safeInfo.safeInfo;
  console.log("dynamic", args, safeInfo);
  if (!safeInfo) {
    return {
      error: {
        status: 400,
        statusText: "Bad Request",
        data: "No Safe Info received",
      },
    };
  }
  const { chainId, safeAddress } = safeInfo;
  const baseAPI = networkInfo.get(chainId)?.baseAPI;
  if (!baseAPI) {
    return {
      error: {
        status: 400,
        statusText: "Bad Request",
        data: "No Base API for Chain ID found",
      },
    };
  }
  return fetchBaseQuery({
    baseUrl: isCollectible
      ? `${networkInfo.get(chainId)?.baseAPI?.replace("v1", "v2")}/safes/${safeAddress}`
      : `${networkInfo.get(chainId)?.baseAPI}/safes/${safeAddress}`,
  })(args, api, extraoptions);
};

export const balanceApi = createApi({
  reducerPath: "balancerApi",
  baseQuery: dynamicBaseQuery,
  endpoints: (builder) => ({
    getAssetBalance: builder.query<AssetBalance, void>({
      query: () => "balances?trusted=false&exclude_spam=true",
    }),
    getNFTPage: builder.query<NFTBalance, { offset: number }>({
      query: ({ offset }) => `collectibles/?trusted=false&exclude_spam=true&offset=${offset}&limit=10`,
    }),
    getAllNFTs: builder.query<NFTBalance, void>({
      queryFn: async (_args, queryApi, _extraOptions, fetchWithBQ) => {
        let allNFTs: NFTBalance = { results: [], next: "initialPage" };
        let offset = 0;
        while (allNFTs.next !== null) {
          console.log("Fetching next page of NFTs");
          const safeInfo = (queryApi.getState() as RootState).safeInfo.safeInfo;
          console.log("safeInfo state in queryFn", safeInfo);

          const { data, error } = await fetchWithBQ(
            `collectibles/?trusted=false&exclude_spam=true&offset=${offset}&limit=10`,
          );
          if (error) {
            return Promise.resolve({ error });
          }
          const nextBalance = data as NFTBalance;
          console.log("Result:", nextBalance);
          allNFTs.next = nextBalance?.next ?? null;
          // the endpoint is quite slow so we cap the NFTs to 100 now
          if (offset === 100) {
            break;
          }
          offset += 10;

          if (nextBalance) {
            const { results } = nextBalance;
            if (results) {
              allNFTs.results.push(...results);
            }
          }
        }
        return Promise.resolve({ data: allNFTs });
      },
    }),
  }),
});

export const { useGetAssetBalanceQuery, useGetAllNFTsQuery } = balanceApi;
