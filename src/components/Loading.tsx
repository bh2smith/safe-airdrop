import { CircularProgress, Typography } from "@mui/material";

export const Loading = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        paddingTop: "36px",
      }}
    >
      <Typography>Loading tokenlist and balances...</Typography>
      <CircularProgress />
    </div>
  );
};
