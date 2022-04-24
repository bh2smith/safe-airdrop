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
};

type Token = {
  name: string;
  symbol: string;
  decimals: number;
};

export type AssetBalance = AssetBalanceEntry[];
export type NFTBalance = NFTBalanceEntry[];

const dynamicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraoptions,
) => {
  const safeInfo = (api.getState() as RootState).safeInfo.safeInfo;
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
    baseUrl: `${networkInfo.get(chainId)?.baseAPI}/safes/${safeAddress}`,
  })(args, api, extraoptions);
};

export const balanceApi = createApi({
  reducerPath: "balancerApi",
  baseQuery: dynamicBaseQuery,
  endpoints: (builder) => ({
    getAssetBalance: builder.query<AssetBalance, void>({
      query: () => "balances?trusted=false&exclude_spam=true",
    }),
    getNFTBalance: builder.query<NFTBalance, void>({
      query: () => "collectibles?trusted=false&exclude_spam=true",
    }),
  }),
});

export const { useGetAssetBalanceQuery, useGetNFTBalanceQuery } = balanceApi;
