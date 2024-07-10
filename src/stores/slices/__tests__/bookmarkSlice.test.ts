import {
  BookmarkState,
  addBookmark,
  bookmarksSlice,
  rehydrateBookmarks,
  selectBookmarksByChain,
  setBookmarksByChain,
} from "../bookmarkSlice";

describe("bookmarkSlice", () => {
  it("should be possible to add bookmarks", () => {
    const testBookmark1 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,",
      name: "TestTransfer",
      transfers: 1,
    };
    const testBookmark2 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    const testBookmark3 = {
      chainId: "100",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    let state = bookmarksSlice.reducer(undefined, addBookmark(testBookmark1));

    expect(state).toEqual({
      bookmarksPerChain: {
        "1": [testBookmark1],
      },
    });

    state = bookmarksSlice.reducer(state, addBookmark(testBookmark2));

    expect(state).toEqual({
      bookmarksPerChain: {
        "1": [testBookmark1, testBookmark2],
      },
    });

    state = bookmarksSlice.reducer(state, addBookmark(testBookmark3));

    expect(state).toEqual({
      bookmarksPerChain: {
        "1": [testBookmark1, testBookmark2],
        "100": [testBookmark3],
      },
    });
  });

  it("should be possible to set bookmarks for chain", () => {
    const testBookmark1 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,",
      name: "TestTransfer",
      transfers: 1,
    };
    const testBookmark2 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    const testBookmark3 = {
      chainId: "100",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    let state: BookmarkState = {
      bookmarksPerChain: {
        "1": [testBookmark1, testBookmark2],
        "100": [testBookmark3],
      },
    };

    state = bookmarksSlice.reducer(
      state,
      setBookmarksByChain({
        chainId: "100",
        bookmarks: [],
      }),
    );

    expect(state).toEqual({
      bookmarksPerChain: {
        "1": [testBookmark1, testBookmark2],
        "100": [],
      },
    });

    state = bookmarksSlice.reducer(
      state,
      setBookmarksByChain({
        chainId: "1",
        bookmarks: [testBookmark2],
      }),
    );

    expect(state).toEqual({
      bookmarksPerChain: {
        "1": [testBookmark2],
        "100": [],
      },
    });
  });

  it("should be possible to rehydrate the bookmark state", () => {
    const testBookmark1 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,",
      name: "TestTransfer",
      transfers: 1,
    };
    const testBookmark2 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    const testBookmark3 = {
      chainId: "100",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    let bookmarkPayload: BookmarkState = {
      bookmarksPerChain: {
        "1": [testBookmark1, testBookmark2],
        "100": [testBookmark3],
      },
    };

    let state = bookmarksSlice.reducer(undefined, rehydrateBookmarks(bookmarkPayload));

    expect(state).toEqual(bookmarkPayload);
  });

  it("should be able to select bookmarks by chainId", () => {
    const testBookmark1 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,",
      name: "TestTransfer",
      transfers: 1,
    };
    const testBookmark2 = {
      chainId: "1",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    const testBookmark3 = {
      chainId: "100",
      csvContent:
        "token_type,token_address,receiver,amount,id\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x1000000000000000000000000000000000000000,0.0001,\nerc20,0x6810e776880c02933d47db1b9fc05908e5386b96,0x2000000000000000000000000000000000000000,0.0005",
      name: "TestTransfer",
      transfers: 2,
    };
    let state: BookmarkState = {
      bookmarksPerChain: {
        "1": [testBookmark1, testBookmark2],
        "100": [testBookmark3],
      },
    };

    expect(selectBookmarksByChain.resultFunc(state, "11155111")).toBeUndefined();

    expect(selectBookmarksByChain.resultFunc(state, "1")).toEqual([testBookmark1, testBookmark2]);

    expect(selectBookmarksByChain.resultFunc(state, "100")).toEqual([testBookmark3]);
  });
});
