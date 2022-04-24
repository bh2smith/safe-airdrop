import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CollectibleTokenInfoProvider } from "src/hooks/collectibleTokenInfoProvider";
import { EnsResolver } from "src/hooks/ens";
import { TokenInfoProvider } from "src/hooks/token";
import { Transfer } from "src/parser/csvParser";

export interface CSVEditorState {
  csvContent: string;
  transfers: Transfer[];
  parsing: boolean;
}

const initialState: CSVEditorState = {
  csvContent: "token_type,token_address,receiver,amount,id",
  transfers: [],
  parsing: false,
};

export const csvEditorSlice = createSlice({
  name: "csvEditor",
  initialState,
  reducers: {
    updateCsvContent: (
      state,
      action: PayloadAction<{
        csvContent: string;
        ensResolver: EnsResolver;
        tokenInfoProvider: TokenInfoProvider;
        collectibleTokenInfoProvider: CollectibleTokenInfoProvider;
      }>,
    ) => {
      state.csvContent = action.payload.csvContent;
    },
    setTransfers: (state, action: PayloadAction<Transfer[]>) => {
      state.transfers = action.payload;
    },
    startParsing: (state) => {
      state.parsing = true;
    },
    stopParsing: (state) => {
      state.parsing = false;
    },
  },
});

export const { updateCsvContent, setTransfers, startParsing, stopParsing } = csvEditorSlice.actions;

export default csvEditorSlice.reducer;
