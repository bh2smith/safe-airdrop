import { useEffect } from "react";
import { LS_KEY } from "src/stores/middleware/persistState";
import { rehydrateBookmarks } from "src/stores/slices/bookmarkSlice";
import { useAppDispatch } from "src/stores/store";

export const useHydrateBookmarks = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const bookmarksStringified = localStorage.getItem(`${LS_KEY}/bookmarks`);
    const bookmarks = bookmarksStringified ? JSON.parse(bookmarksStringified) : undefined;
    if (bookmarks) {
      dispatch(rehydrateBookmarks(bookmarks));
    }
  }, [dispatch]);
};
