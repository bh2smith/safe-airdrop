import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

export type AddressbookEntry = {
  address: string;
  chainId: string;
  name: string;
};

export interface AddressbookState {
  namedAddresses: AddressbookEntry[];
}

const initialState: AddressbookState = {
  namedAddresses: [],
};

export const addressbookSlice = createSlice({
  name: "addressbook",
  initialState,
  reducers: {
    setAddressbook: (state, action: PayloadAction<AddressbookEntry[]>) => {
      state.namedAddresses = action.payload;
    },
  },
});

export const { setAddressbook } = addressbookSlice.actions;

export default addressbookSlice.reducer;

export const selectAddressbook = ({ addressbook }: RootState) => addressbook.namedAddresses;
