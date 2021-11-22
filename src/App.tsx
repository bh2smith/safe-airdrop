import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { Button, Card, Divider, GenericModal, Icon, Loader, Title, Text } from "@gnosis.pm/safe-react-components";
import { Fab } from "@material-ui/core";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React, { useCallback, useState } from "react";
import styled from "styled-components";

import { Header } from "./components/Header";
import { Summary } from "./components/Summary";
import { AssetCSVForm } from "./components/assets/CSVForm";
import { useTokenList, networkMap } from "./hooks/token";
import { AssetTransfer, CollectibleTransfer, Transfer } from "./parser/csvParser";
import { buildAssetTransfers, buildCollectibleTransfers } from "./transfers/transfers";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const { safe } = useSafeAppsSDK();
  const [csvText, setCsvText] = useState<string>("token_type,token_address,receiver,value,id");
  const [tokenTransfers, setTokenTransfers] = useState<Transfer[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { sdk } = useSafeAppsSDK();
  const [showHelp, setShowHelp] = useState(false);

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

      console.log(`Encoded ${txs.length} ERC20 transfers.`);
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
      {networkMap.has(safe.chainId) ? (
        <>
          {isLoading ? (
            <>
              <Loader size={"lg"} />
              <Text size={"lg"}>Loading Tokenlist...</Text>
            </>
          ) : (
            <Card className="cardWithCustomShadow">
              <AssetCSVForm
                updateCsvContent={setCsvText}
                csvContent={csvText}
                updateTransferTable={setTokenTransfers}
                setParsing={setParsing}
              />
              <Divider />
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
                  color="primary"
                  onClick={submitTx}
                  disabled={parsing || tokenTransfers.length + collectibleTransfers.length === 0}
                >
                  {parsing ? <Loader size="sm" color="primaryLight" /> : "Submit"}
                </Button>
              )}
            </Card>
          )}
        </>
      ) : (
        <Text size={"xl"}>Network with chainId {safe.chainId} not yet supported.</Text>
      )}
      <Fab
        variant="extended"
        size="small"
        style={{ position: "absolute", top: 24, right: 24, textTransform: "none" }}
        onClick={() => setShowHelp(true)}
      >
        <Icon size="md" type="question" />
        <Text size="xl">Help</Text>
      </Fab>
      {showHelp && (
        <GenericModal
          onClose={() => setShowHelp(false)}
          title={<Title size="lg">How to use the CSV Airdrop Gnosis App</Title>}
          body={
            <div>
              <Title size="md" strong>
                Preparing a Transfer File
              </Title>
              <Text size="lg">
                Transfer files are expected to be in CSV format with the following required columns:
                <ul>
                  <li>
                    <code>receiver</code>: Ethereum address of transfer receiver.
                  </li>
                  <li>
                    <code>token_address</code>: Ethereum address of ERC20 token to be transferred.
                  </li>
                  <li>
                    <code>amount</code>: the amount of token to be transferred.
                  </li>
                </ul>
                <p>
                  <b>
                    Important: The CSV file has to use "," as a separator and the header row always has to be provided
                    as the first row and include the described column names.
                  </b>
                </p>
              </Text>
              <Divider />
              <Title size="md" strong>
                Native Token Transfers
              </Title>
              <Text size="lg">
                Since native tokens do not have a token address, you must leave the <code>token_address</code> column
                blank for native transfers.
              </Text>
            </div>
          }
          footer={
            <Button size="md" color="secondary" onClick={() => setShowHelp(false)}>
              Close
            </Button>
          }
        ></GenericModal>
      )}
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
