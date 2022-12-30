import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SafeInfoState {
  safeInfo: SafeInfo | undefined;
}

const initialState: SafeInfoState = {
  safeInfo: undefined,
};

export const safeInfoSlice = createSlice({
  name: "safeInfo",
  initialState,
  reducers: {
    setSafeInfo: (state, action: PayloadAction<SafeInfo>) => {
      state.safeInfo = action.payload;
    },
  },
});

export const { setSafeInfo } = safeInfoSlice.actions;

export default safeInfoSlice.reducer;
