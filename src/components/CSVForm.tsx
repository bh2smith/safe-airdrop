import { Box, Grid, Typography } from "@mui/material";

import { CSVEditor } from "./CSVEditor";
import { CSVUpload } from "./CSVUpload";
import { GenerateTransfersMenu } from "./GenerateTransfersMenu";

export interface CSVFormProps {}

export const CSVForm = (props: CSVFormProps): JSX.Element => {
  return (
    <>
      <Box display="flex" mb={3} flexDirection="column" alignItems="center" gap={1}>
        <Typography variant="h6" fontWeight={700}>
          Upload, edit or paste your asset transfer CSV
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
          (token_type,token_address,receiver,amount,id)
        </Typography>
      </Box>
      <CSVEditor />

      <Grid mt={3} gap={2} container direction="row">
        <Grid item md={6} display="flex" alignItems="flex-start">
          <CSVUpload />
        </Grid>
        <Grid item md={5} display="flex" alignItems="flex-start">
          <GenerateTransfersMenu />
        </Grid>
      </Grid>
    </>
  );
};
