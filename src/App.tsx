import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { Breadcrumb, BreadcrumbElement, Button, Card, Divider, Loader, Text } from "@gnosis.pm/safe-react-components";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Unsubscribe } from "redux";
import styled from "styled-components";

import { CSVForm } from "./components/CSVForm";
import { Header } from "./components/Header";
import { Summary } from "./components/Summary";
import { useTokenList } from "./hooks/token";
import { AssetTransfer, CollectibleTransfer } from "./parser/csvParser";
import { useGetAssetBalanceQuery, useGetNFTBalanceQuery } from "./stores/api/balanceApi";
import { setupParserListener } from "./stores/middleware/parseListener";
import { setSafeAppProvider, setSafeInfo } from "./stores/slices/safeInfoSlice";
import { RootState, startAppListening } from "./stores/store";
import { buildAssetTransfers, buildCollectibleTransfers } from "./transfers/transfers";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const assetBalanceQuery = useGetAssetBalanceQuery();
  const nftBalanceQuery = useGetNFTBalanceQuery();

  const { messages } = useSelector((state: RootState) => state.messages);
  const { transfers, parsing } = useSelector((state: RootState) => state.csvEditor);

  const [submitting, setSubmitting] = useState(false);
  const { sdk, safe } = useSafeAppsSDK();
  const dispatch = useDispatch();

  useEffect(() => {
    const provider = new SafeAppProvider(safe, sdk);
    dispatch(setSafeInfo(safe));
    dispatch(setSafeAppProvider(provider));
    const subscriptions: Unsubscribe[] = [setupParserListener(startAppListening)];
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  });

  const assetTransfers = transfers.filter(
    (transfer) => transfer.token_type === "erc20" || transfer.token_type === "native",
  ) as AssetTransfer[];
  const collectibleTransfers = transfers.filter(
    (transfer) => transfer.token_type === "erc1155" || transfer.token_type === "erc721",
  ) as CollectibleTransfer[];

  const submitTx = useCallback(async () => {
    setSubmitting(true);
    try {
      const txs: BaseTransaction[] = [];
      txs.push(...buildAssetTransfers(assetTransfers));
      txs.push(...buildCollectibleTransfers(collectibleTransfers));

      console.log(`Encoded ${txs.length} transfers.`);
      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [assetTransfers, collectibleTransfers, sdk.txs]);

  return (
    <Container>
      <Header />
      {
        <>
          {isLoading || assetBalanceQuery.isLoading || nftBalanceQuery.isLoading ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  paddingTop: "36px",
                }}
              >
                <Text size={"xl"} strong>
                  Loading tokenlist and balances...
                </Text>
                <Loader size={"md"} />
              </div>
            </>
          ) : (
            <Card className="cardWithCustomShadow">
              <Breadcrumb>
                <BreadcrumbElement text="CSV Transfer File" iconType="paste" />
              </Breadcrumb>
              <CSVForm />
              <Divider />
              <Breadcrumb>
                <BreadcrumbElement text="Summary" iconType="transactionsInactive" />
                <BreadcrumbElement text="Transfers" color="placeHolder" />
              </Breadcrumb>
              <Summary assetTransfers={assetTransfers} collectibleTransfers={collectibleTransfers} />
              {submitting ? (
                <>
                  <Loader size="md" />
                  <br />
                  <Button size="lg" color="secondary" onClick={() => setSubmitting(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  style={{ alignSelf: "flex-start", marginTop: 16, marginBottom: 16 }}
                  size="lg"
                  color={messages.length === 0 ? "primary" : "error"}
                  onClick={submitTx}
                  disabled={parsing || transfers.length + collectibleTransfers.length === 0}
                >
                  {parsing ? (
                    <Loader size="sm" color="primaryLight" />
                  ) : messages.length === 0 ? (
                    "Submit"
                  ) : (
                    "Submit with errors"
                  )}
                </Button>
              )}
            </Card>
          )}
        </>
      }
    </Container>
  );
};

const Container = styled.div`
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: left;
  width: 100%;
`;

export default App;
