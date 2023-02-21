import { Button, Card, CircularProgress, Grid, Typography } from "@mui/material";
import { GatewayTransactionDetails, TransactionStatus } from "@safe-global/safe-apps-sdk";
import { useTxPolling } from "src/hooks/useTxPolling";

export const TransactionStatusScreen = ({ tx, reset }: { tx: GatewayTransactionDetails; reset: () => void }) => {
  const polledTx = useTxPolling(tx);

  const getPendingStateText = () => {
    switch (polledTx?.txStatus) {
      case TransactionStatus.AWAITING_CONFIRMATIONS:
        return "Awaiting confirmations";
      case TransactionStatus.AWAITING_EXECUTION:
        return "Awaiting execution";
      case TransactionStatus.CANCELLED:
        return "Transaction cancelled!";
      case TransactionStatus.FAILED:
        return "Transaction failed!";
      case TransactionStatus.SUCCESS:
        return "Transaction successful!";
      default:
        return "Unknown state";
    }
  };

  const isTxFinished = () => {
    switch (polledTx?.txStatus) {
      case TransactionStatus.AWAITING_CONFIRMATIONS:
      case TransactionStatus.AWAITING_EXECUTION:
        return false;
      case TransactionStatus.CANCELLED:
      case TransactionStatus.FAILED:
      case TransactionStatus.SUCCESS:
        return true;
      default:
        return false;
    }
  };

  return (
    <Card className="cardWithCustomShadow">
      <Grid container spacing={2}>
        <Grid item alignItems="flex-end">
          {!isTxFinished() && <CircularProgress />}
        </Grid>
        <Grid item>
          <Typography variant="overline">Transaction execution</Typography>
          <Typography sx={{ marginBottom: "16px" }} variant="body2">
            {getPendingStateText()}
          </Typography>

          <Button variant="outlined" onClick={reset}>
            New transaction
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};
