import { Box, Grid, Stack, Typography } from "@mui/material";

import { CSVEditor } from "./CSVEditor";
import { CSVUpload } from "./CSVUpload";
import { GenerateTransfersMenu } from "./GenerateTransfersMenu";
import { AddBookmark } from "./bookmarks/AddBookmark";
import { BookmarkLibrary } from "./bookmarks/BookmarkLibrary";

export interface CSVFormProps {}

export const CSVForm = (props: CSVFormProps): JSX.Element => {
  return (
    <Stack spacing={2}>
      <Box display="flex" mb={3} flexDirection="column" alignItems="center" gap={1}>
        <Typography variant="h6" fontWeight={700}>
          Upload, edit or paste your asset transfer CSV
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
          (token_type,token_address,receiver,amount,id)
        </Typography>
      </Box>
      <Grid direction="row" container alignItems="start">
        <Grid item xs={12} md={11}>
          <CSVEditor />
        </Grid>
        <Grid item xs={12} md={1}>
          <Stack direction={{ md: "column", xs: "row" }} spacing={2} p={{ md: 2, xs: "16px 0px" }}>
            <BookmarkLibrary />
            <AddBookmark />
          </Stack>
        </Grid>
      </Grid>

      <Grid gap={2} container direction="row">
        <Grid item md={6} display="flex" alignItems="flex-start">
          <CSVUpload />
        </Grid>
        <Grid item md={5} display="flex" alignItems="flex-start">
          <GenerateTransfersMenu />
        </Grid>
      </Grid>
    </Stack>
  );
};
