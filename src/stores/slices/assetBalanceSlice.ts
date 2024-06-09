import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

type AssetBalanceEntry = {
  tokenAddress: string | null;
  token: Token | null;
  balance: string;
  decimals: number;
};

type Token = {
  name: string;
  symbol: string;
  decimals: number;
};

export type AssetBalance = AssetBalanceEntry[];

export interface AssetBalanceState {
  balances: AssetBalance | undefined;
  isLoading: boolean;
}

const initialState: AssetBalanceState = {
  balances: [],
  isLoading: false,
};

export const assetBalanceSlice = createSlice({
  name: "assetBalances",
  initialState,
  reducers: {
    setAssetBalances: (state, action: PayloadAction<AssetBalanceState>) => {
      state.balances = action.payload.balances;
      state.isLoading = action.payload.isLoading;
    },
  },
});

export const { setAssetBalances } = assetBalanceSlice.actions;

export default assetBalanceSlice.reducer;

export const selectAssetBalances = ({ assetBalance }: RootState) => assetBalance.balances;
