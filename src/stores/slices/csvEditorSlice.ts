import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Transfer } from "src/hooks/useCsvParser";

import { RootState } from "../store";
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

export const selectCsvContent = ({ csvEditor }: RootState) => csvEditor.csvContent;
