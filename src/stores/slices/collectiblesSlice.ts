import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

type NFTBalanceEntry = {
  address: string;
  tokenName: string;
  tokenSymbol: string;
  id: string;
  imageUri: string;
  name: string;
};

export type NFTBalance = { count: number; next: string | null; previous: string | null; results: NFTBalanceEntry[] };

export interface CollectiblesState {
  collectibles: NFTBalanceEntry[] | undefined;
  isLoading: boolean;
}

const initialState: CollectiblesState = {
  collectibles: [],
  isLoading: false,
};

export const collectiblesSlice = createSlice({
  name: "collectibles",
  initialState,
  reducers: {
    setCollectibles: (state, action: PayloadAction<CollectiblesState>) => {
      state.collectibles = action.payload.collectibles;
      state.isLoading = action.payload.isLoading;
    },
  },
});

export const { setCollectibles } = collectiblesSlice.actions;

export default collectiblesSlice.reducer;

export const selectCollectibles = ({ collectibles }: RootState) => collectibles.collectibles;
