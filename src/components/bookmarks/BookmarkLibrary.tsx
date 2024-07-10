import { Bookmarks } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  DialogActions,
  Button,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import { useCurrentChain } from "src/hooks/useCurrentChain";
import { selectBookmarksByChain, setBookmarksByChain } from "src/stores/slices/bookmarkSlice";
import { updateCsvContent } from "src/stores/slices/csvEditorSlice";
import { setMessages } from "src/stores/slices/messageSlice";
import { useAppDispatch, RootState, useAppSelector } from "src/stores/store";

import { SquareButton } from "../common/SquareButton";

const LoadBookmarkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const currentChain = useCurrentChain();
  const bookmarks = useAppSelector((state: RootState) =>
    selectBookmarksByChain(state, currentChain?.chainID.toString() ?? "-1"),
  );

  const [selectedIdx, setSelectedIdx] = useState(0);

  const isDisabled = !bookmarks || bookmarks.length === 0;

  const onLoad = () => {
    if (!bookmarks || !bookmarks[selectedIdx]) {
      return;
    }

    dispatch(updateCsvContent({ csvContent: bookmarks[selectedIdx].csvContent }));

    dispatch(
      setMessages([
        {
          message: "Successfully loaded transfer from library",
          severity: "success",
        },
      ]),
    );
    onClose();
  };

  const onDelete = () => {
    if (!bookmarks || !bookmarks[selectedIdx] || !currentChain) {
      return;
    }

    const updatedBookmarks = bookmarks.slice(0, selectedIdx).concat(bookmarks.slice(selectedIdx + 1));
    dispatch(
      setBookmarksByChain({
        bookmarks: updatedBookmarks,
        chainId: currentChain.chainID.toString(),
      }),
    );
    dispatch(
      setMessages([
        {
          message: "Successfully loaded transfer from library",
          severity: "success",
        },
      ]),
    );
    setSelectedIdx(0);
  };

  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTitle>Load bookmarked file</DialogTitle>
      <DialogContent>
        <Typography mb={3}>Select one of your stored transfers and restore it.</Typography>

        {bookmarks && bookmarks.length > 0 ? (
          <>
            <FormControl fullWidth>
              <InputLabel id="library-item-select">Select Bookmark</InputLabel>
              <Select
                labelId="library-item-select"
                id="library-item"
                value={selectedIdx}
                fullWidth
                label="Select Bookmark"
                variant="outlined"
                onChange={(event) => setSelectedIdx(Number(event.target.value))}
              >
                {bookmarks?.map((bookmark, bookmarkIdx) => (
                  <MenuItem value={bookmarkIdx}>{bookmark.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography mt={2} variant="h6" fontWeight={700}>
              Preview:
            </Typography>
            <Box
              sx={{
                overflow: "auto",
                width: "100%",
                padding: 1,
                backgroundColor: ({ palette }) => palette.background.main,
                borderRadius: "6px",
                border: ({ palette }) => `1px solid ${palette.border.main}`,
              }}
            >
              <pre>{bookmarks?.[selectedIdx]?.csvContent}</pre>
            </Box>
          </>
        ) : (
          <Typography variant="body2">No bookmarks stored</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button variant="contained" onClick={onLoad} disabled={isDisabled}>
          Load Content
        </Button>
        <Button variant="danger" onClick={onDelete} disabled={isDisabled}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const BookmarkLibrary = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SquareButton
        icon={<Bookmarks />}
        title="Open bookmark library"
        onClick={() => {
          setOpen(true);
        }}
      />
      <LoadBookmarkModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};
