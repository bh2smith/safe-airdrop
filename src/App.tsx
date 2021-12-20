import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { Button, Card, Divider, Loader, Text } from "@gnosis.pm/safe-react-components";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React, { useCallback, useState } from "react";
import styled from "styled-components";

import { FAQModal } from "./components/FAQModal";
import { Header } from "./components/Header";
import { Summary } from "./components/Summary";
import { CSVForm } from "./components/assets/CSVForm";
import { useTokenList, networkMap } from "./hooks/token";
import { AssetTransfer, CollectibleTransfer, Transfer } from "./parser/csvParser";
import { buildAssetTransfers, buildCollectibleTransfers } from "./transfers/transfers";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const { safe } = useSafeAppsSDK();
  const [tokenTransfers, setTokenTransfers] = useState<Transfer[]>([]);

  const [submitting, setSubmitting] = useState(false);
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
          {isLoading ? (
            <>
              <Loader size={"lg"} />
              <Text size={"lg"}>Loading Tokenlist...</Text>
            </>
          ) : (
            <Card className="cardWithCustomShadow">
              <CSVForm updateTransferTable={setTokenTransfers} setParsing={setParsing} />
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
      }
      <FAQModal />
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
