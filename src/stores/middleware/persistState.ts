import type { Middleware } from "@reduxjs/toolkit";

import type { RootState } from "../store";

export const LS_KEY = "csv-airdrop-v1";

export const persistBookmarkState: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  const sliceType = action.type.split("/")[0];
  if (sliceType === "bookmarks") {
    const state = store.getState();
    const sliceState = state["bookmarks"];
    localStorage.setItem(`${LS_KEY}/bookmarks`, JSON.stringify(sliceState));
  }

  return result;
};
