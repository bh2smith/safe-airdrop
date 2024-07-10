import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

type Bookmark = {
  name: string;
  chainId: string;
  csvContent: string;
  transfers: number;
};

export interface BookmarkState {
  bookmarksPerChain: Record<string, Bookmark[]>;
}

const initialState: BookmarkState = {
  bookmarksPerChain: {},
};

export const bookmarksSlice = createSlice({
  name: "bookmarks",
  initialState,
  reducers: {
    addBookmark: (state, action: PayloadAction<Bookmark>) => {
      state.bookmarksPerChain[action.payload.chainId] ??= [];
      state.bookmarksPerChain[action.payload.chainId].push(action.payload);
    },
    setBookmarksByChain: (state, action: PayloadAction<{ bookmarks: Bookmark[]; chainId: string }>) => {
      state.bookmarksPerChain[action.payload.chainId] = action.payload.bookmarks;
    },
    rehydrateBookmarks: (state, action: PayloadAction<BookmarkState>) => {
      state.bookmarksPerChain = action.payload.bookmarksPerChain;
    },
  },
});

export const { addBookmark, rehydrateBookmarks, setBookmarksByChain } = bookmarksSlice.actions;

export default bookmarksSlice.reducer;

const selectAllBookmarks = ({ bookmarks }: RootState) => bookmarks;

export const selectBookmarksByChain = createSelector(
  [selectAllBookmarks, (_, chainId: string) => chainId],
  (bookmarks, chainId): Bookmark[] | undefined => bookmarks.bookmarksPerChain[chainId],
);
