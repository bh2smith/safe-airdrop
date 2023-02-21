import { Box, Button, Card, CircularProgress, Grid, Typography, useTheme } from "@mui/material";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { BaseTransaction, GatewayTransactionDetails } from "@safe-global/safe-apps-sdk";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Unsubscribe } from "redux";

import { CSVForm } from "./components/CSVForm";
import { FAQModal } from "./components/FAQModal";
import { Loading } from "./components/Loading";
import { Summary } from "./components/Summary";
import { TransactionStatusScreen } from "./components/TransactionStatusScreen";
import { useTokenList } from "./hooks/token";
import { AssetTransfer, CollectibleTransfer, useCsvParser } from "./hooks/useCsvParser";
import { useEnsResolver } from "./hooks/useEnsResolver";
import CheckIcon from "./static/check.svg";
import AppIcon from "./static/logo.svg";
import { useGetAssetBalanceQuery, useGetAllNFTsQuery } from "./stores/api/balanceApi";
import { setupParserListener } from "./stores/middleware/parseListener";
import { setSafeInfo } from "./stores/slices/safeInfoSlice";
import { RootState, startAppListening } from "./stores/store";
import { buildAssetTransfers, buildCollectibleTransfers } from "./transfers/transfers";

import "./styles/globals.css";

const App: React.FC = () => {
  const theme = useTheme();
  const { isLoading } = useTokenList();
  const { sdk, safe } = useSafeAppsSDK();
  const assetBalanceQuery = useGetAssetBalanceQuery();
  const nftBalanceQuery = useGetAllNFTsQuery();

  const { messages } = useSelector((state: RootState) => state.messages);
  const { transfers, parsing } = useSelector((state: RootState) => state.csvEditor);

  const [pendingTx, setPendingTx] = useState<GatewayTransactionDetails>();
  const { parseCsv } = useCsvParser();
  const ensResolver = useEnsResolver();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setSafeInfo(safe));
    const subscriptions: Unsubscribe[] = [setupParserListener(startAppListening, parseCsv, ensResolver)];
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [dispatch, safe, sdk, parseCsv, ensResolver]);

  const assetTransfers = transfers.filter(
    (transfer) => transfer.token_type === "erc20" || transfer.token_type === "native",
  ) as AssetTransfer[];
  const collectibleTransfers = transfers.filter(
    (transfer) => transfer.token_type === "erc1155" || transfer.token_type === "erc721",
  ) as CollectibleTransfer[];

  const submitTx = useCallback(async () => {
    try {
      const txs: BaseTransaction[] = [];
      txs.push(...buildAssetTransfers(assetTransfers));
      txs.push(...buildCollectibleTransfers(collectibleTransfers));

      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      setPendingTx(safeTx);
    } catch (e) {
      console.error(e);
    }
  }, [assetTransfers, collectibleTransfers, sdk.txs]);

  return (
    <Box
      sx={{
        maxWidth: "950px",
        paddingTop: "24px",
        position: "relative",
        margin: "auto",
      }}
    >
      <Box display="flex" flexDirection="column" justifyContent="left">
        {
          <>
            {isLoading || assetBalanceQuery.isLoading || nftBalanceQuery.isLoading ? (
              <Loading />
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                <Grid container>
                  <Grid item xs={4}>
                    <Box>
                      <Typography mb={2} variant="h3" fontWeight={700} display="flex" alignItems="center" gap={1}>
                        <img src={AppIcon} width="32px" height="32px" alt="logo" /> CSV Airdrop
                      </Typography>
                      <FAQModal />
                    </Box>
                  </Grid>
                  <Grid item xs display="flex" direction="row" alignItems="center" gap={2}>
                    <img
                      src={CheckIcon}
                      alt="check"
                      width={24}
                      height={24}
                      style={{ background: theme.palette.background.light, borderRadius: "12px" }}
                    />
                    <Typography>
                      Send arbitrarily many distinct tokens, to arbitrarily many distinct accounts with various
                      different values from a CSV file in a single transaction.
                    </Typography>
                  </Grid>
                </Grid>

                {!pendingTx && (
                  <Card sx={{ padding: 2, mt: 3 }}>
                    <CSVForm />
                  </Card>
                )}
                <Card sx={{ padding: 2 }}>
                  <Summary assetTransfers={assetTransfers} collectibleTransfers={collectibleTransfers} />
                  {pendingTx ? (
                    <TransactionStatusScreen tx={pendingTx} reset={() => setPendingTx(undefined)} />
                  ) : (
                    <Button
                      variant="contained"
                      style={{ alignSelf: "flex-start", marginTop: 16, marginBottom: 16 }}
                      size="stretched"
                      color={messages.length === 0 ? "primary" : "error"}
                      onClick={submitTx}
                      disabled={parsing || transfers.length + collectibleTransfers.length === 0}
                    >
                      {parsing ? (
                        <>
                          <CircularProgress size="small" color="secondary" /> Parsing
                        </>
                      ) : messages.length === 0 ? (
                        "Submit"
                      ) : (
                        "Submit with errors"
                      )}
                    </Button>
                  )}
                </Card>
              </Box>
            )}
          </>
        }
      </Box>
    </Box>
  );
};

export default App;
