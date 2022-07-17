import { GatewayTransactionDetails, TransactionStatus } from "@gnosis.pm/safe-apps-sdk";
import { Button, Card, Loader } from "@gnosis.pm/safe-react-components";
import { Grid, Typography } from "@material-ui/core";
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
        return "Cancelled";
      case TransactionStatus.FAILED:
        return "Failed";
      case TransactionStatus.PENDING:
        return "Transaction pending";
      case TransactionStatus.SUCCESS:
        return "Transaction successful";
      case TransactionStatus.WILL_BE_REPLACED:
        return "Transaction will be replaced";
      default:
        return "Unknown state";
    }
  };

  const isTxFinished = () => {
    switch (polledTx?.txStatus) {
      case TransactionStatus.AWAITING_CONFIRMATIONS:
      case TransactionStatus.AWAITING_EXECUTION:
      case TransactionStatus.WILL_BE_REPLACED:
      case TransactionStatus.PENDING:
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
          {!isTxFinished() && <Loader size="md" />}
        </Grid>
        <Grid item>
          <Typography variant="overline">Transaction execution</Typography>
          <Typography style={{ marginBottom: "16px" }} variant="body2">
            {getPendingStateText()}
          </Typography>
          {isTxFinished() && (
            <Button size={"md"} onClick={() => reset}>
              New transaction
            </Button>
          )}
        </Grid>
      </Grid>
    </Card>
  );
};
