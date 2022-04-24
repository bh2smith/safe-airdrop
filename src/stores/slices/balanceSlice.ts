import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AssetBalance, NFTBalance } from "../api/balanceApi";

export interface BalanceState {
  assetBalance: AssetBalance;
  nftBalance: NFTBalance;
  isLoading: boolean;
}

const initialState: BalanceState = {
  assetBalance: [],
  nftBalance: [],
  isLoading: true,
};

export const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    setAssetBalance: (state, action: PayloadAction<AssetBalance>) => {
      state.assetBalance = action.payload;
    },
    setNFTBalance: (state, action: PayloadAction<NFTBalance>) => {
      state.nftBalance = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAssetBalance, setNFTBalance, setLoading } = balanceSlice.actions;

export default balanceSlice.reducer;
