import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SafeInfoState {
  safeInfo: SafeInfo | undefined;
  safeAppProvider: SafeAppProvider | undefined;
}

const initialState: SafeInfoState = {
  safeInfo: undefined,
  safeAppProvider: undefined,
};

export const safeInfoSlice = createSlice({
  name: "safeInfo",
  initialState,
  reducers: {
    setSafeInfo: (state, action: PayloadAction<SafeInfo>) => {
      state.safeInfo = action.payload;
    },
    setSafeAppProvider: (state, action: PayloadAction<SafeAppProvider>) => {
      state.safeAppProvider = action.payload;
    },
  },
});

export const { setSafeInfo, setSafeAppProvider } = safeInfoSlice.actions;

export default safeInfoSlice.reducer;
