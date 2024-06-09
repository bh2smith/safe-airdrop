import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NetworkInfo, staticNetworkInfo } from "src/networks";

import { RootState } from "../store";

export interface NetworksState {
  networks: NetworkInfo[];
}

const initialState: NetworksState = {
  // Initially we use our default networks as a fallback if the service is not reachable
  networks: [...staticNetworkInfo.values()],
};

export const networksSlice = createSlice({
  name: "networks",
  initialState,
  reducers: {
    setNetworks: (state, action: PayloadAction<NetworksState>) => {
      state.networks = action.payload.networks;
    },
  },
});

export const { setNetworks } = networksSlice.actions;

export default networksSlice.reducer;

export const selectNetworks = ({ networks }: RootState) => networks.networks;
