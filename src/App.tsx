import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { Breadcrumb, BreadcrumbElement, Button, Card, Divider, Loader, Text } from "@gnosis.pm/safe-react-components";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React, { useCallback, useState, useContext } from "react";
import styled from "styled-components";

import { CSVForm } from "./components/CSVForm";
import { Confirmation } from "./components/Confirmation";
import { Header } from "./components/Header";
import { Summary } from "./components/Summary";
import { MessageContext } from "./contexts/MessageContextProvider";
import { useBalances } from "./hooks/balances";
import { useTokenList } from "./hooks/token";
import { AssetTransfer, CollectibleTransfer, Transfer } from "./parser/csvParser";
import { buildAssetTransfers, buildCollectibleTransfers } from "./transfers/transfers";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const balanceLoader = useBalances();
  const [tokenTransfers, setTokenTransfers] = useState<Transfer[]>([]);
  const { messages } = useContext(MessageContext);

  const [submitting, setSubmitting] = useState(false);
  const [createdTXNonce, setCreatedTXNonce] = useState<number | undefined>(undefined);
  const [parsing, setParsing] = useState(false);
  const { sdk } = useSafeAppsSDK();

  const assetTransfers = tokenTransfers.filter(
    (transfer) => transfer.token_type === "erc20" || transfer.token_type === "native",
  ) as AssetTransfer[];
  const collectibleTransfers = tokenTransfers.filter(
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
      if (safeTx) {
        if (safeTx.detailedExecutionInfo?.type === "MULTISIG") {
          setCreatedTXNonce(safeTx.detailedExecutionInfo.nonce);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [assetTransfers, collectibleTransfers, sdk.txs]);

  const nextTransaction = () => {
    setCreatedTXNonce(undefined);
    setTokenTransfers([]);
  };

  return (
    <Container>
      <Header />
      {
        <>
          {isLoading || balanceLoader.isLoading ? (
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
              {createdTXNonce ? (
                <Confirmation createNewTX={nextTransaction} noTxs={tokenTransfers.length} txNonce={createdTXNonce} />
              ) : (
                <>
                  <Breadcrumb>
                    <BreadcrumbElement text="CSV Transfer File" iconType="paste" />
                  </Breadcrumb>
                  <CSVForm updateTransferTable={setTokenTransfers} setParsing={setParsing} />
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
                      disabled={parsing || tokenTransfers.length + collectibleTransfers.length === 0}
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
                </>
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
