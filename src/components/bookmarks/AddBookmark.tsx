import { BookmarkAdd } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useCsvContent } from "src/hooks/useCsvContent";
import { useCurrentChain } from "src/hooks/useCurrentChain";
import { addBookmark } from "src/stores/slices/bookmarkSlice";
import { setMessages } from "src/stores/slices/messageSlice";
import { RootState, useAppDispatch } from "src/stores/store";

import { SquareButton } from "../common/SquareButton";

const AddBookmarkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const currentContent = useCsvContent();
  const dispatch = useAppDispatch();
  const currentChain = useCurrentChain();
  const [name, setName] = useState("");
  const { transfers } = useSelector((state: RootState) => state.csvEditor);

  const onSubmit = () => {
    if (!currentChain) {
      return;
    }
    dispatch(
      addBookmark({
        chainId: currentChain.chainID.toString(),
        name: name,
        csvContent: currentContent,
        transfers: transfers.length,
      }),
    );
    dispatch(
      setMessages([
        {
          message: "Successfully stored transfer",
          severity: "success",
        },
      ]),
    );
    onClose();
  };

  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTitle>Add new bookmark</DialogTitle>
      <DialogContent>
        <Typography>
          This action lets you choose a name for the current CSV content and store it to reuse the same transfer data
          later.
        </Typography>

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
          <pre>{currentContent}</pre>
        </Box>
        <TextField
          sx={{ mt: 3 }}
          name="name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button variant="contained" onClick={onSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AddBookmark = () => {
  const [open, setOpen] = useState(false);

  console.log("Is open?", open);

  return (
    <>
      <SquareButton icon={<BookmarkAdd />} title="Save to bookmark library" onClick={() => setOpen(true)} />
      <AddBookmarkModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};
