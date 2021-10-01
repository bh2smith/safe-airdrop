import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { Button, Card, Divider, Dot, Icon, Loader, Tab, Text } from "@gnosis.pm/safe-react-components";
import { Item } from "@gnosis.pm/safe-react-components/dist/navigation/Tab";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React, { useCallback, useState } from "react";
import styled from "styled-components";

import { Payment } from "./assetParser";
import { CollectibleTransfer } from "./collectiblesParser";
import { Header } from "./components/Header";
import { NFTCSVForm } from "./components/NFTCSVForm";
import { AssetCSVForm } from "./components/assets/AssetCSVForm";
import { AssetTransferTable } from "./components/assets/AssetTransferTable";
import { CollectiblesTransferTable } from "./components/assets/CollectiblesTransferTable";
import { useTokenList, networkMap } from "./hooks/token";
import { buildAssetTransfers, buildERC721Transfers } from "./transfers/transfers";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const { safe } = useSafeAppsSDK();
  const [assetTxCount, setAssetTxCount] = useState(0);
  const [assetsCsvText, setAssetsCsvText] = useState<string>("token_address,receiver,amount");
  const [assetTransfers, setAssetTransfers] = useState<Payment[]>([]);

  const [collectiblesCsvText, setCollectiblesCsvText] = useState<string>("token_address,tokenId,receiver");
  const [collectibleTxCount, setCollectibleTxCount] = useState(0);
  const [collectibleTransfers, setCollectibleTransfers] = useState<CollectibleTransfer[]>([]);

  const [selectedTab, setSelectedTab] = useState("assets");

  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { sdk } = useSafeAppsSDK();

  const submitTx = useCallback(async () => {
    setSubmitting(true);
    try {
      const txs: BaseTransaction[] = [];
      txs.push(...buildAssetTransfers(assetTransfers));
      txs.push(...buildERC721Transfers(collectibleTransfers));

      console.log(`Encoded ${txs.length} ERC20 transfers.`);
      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [assetTransfers, collectibleTransfers, sdk.txs]);

  const navigationItems: Item[] = [
    {
      id: "assets",
      icon: "assets",
      label: "Assets",
      customContent: (
        <div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center" }}>
          <Icon size="md" type="assets" />
          <Text size="md" className="navLabel">
            Assets
          </Text>
          {assetTxCount > 0 && (
            <Dot className="navDot" color="primary">
              <Text size="sm" color="white">
                {assetTxCount}
              </Text>
            </Dot>
          )}
        </div>
      ),
    },
    {
      id: "collectibles",
      icon: "collectibles",
      label: "Collectibles",
      customContent: (
        <div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center" }}>
          <Icon size="md" type="collectibles" />
          <Text size="md" className="navLabel">
            Collectibles
          </Text>
          {collectibleTxCount > 0 && (
            <Dot className="navDot" color="primary">
              <Text size="sm" color="white">
                {collectibleTxCount}
              </Text>
            </Dot>
          )}
        </div>
      ),
    },
  ];
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
            <>
              <Tab items={navigationItems} selectedTab={selectedTab} onChange={setSelectedTab} />
              {selectedTab === "assets" && (
                <AssetCSVForm
                  updateTxCount={setAssetTxCount}
                  updateCsvContent={setAssetsCsvText}
                  csvContent={assetsCsvText}
                  updateTransferTable={setAssetTransfers}
                  setParsing={setParsing}
                />
              )}
              {selectedTab === "collectibles" && (
                <NFTCSVForm
                  updateTxCount={setCollectibleTxCount}
                  updateCsvContent={setCollectiblesCsvText}
                  csvContent={collectiblesCsvText}
                  updateTransferTable={setCollectibleTransfers}
                  setParsing={setParsing}
                />
              )}
              <Divider />
              <Card className="cardWithCustomShadow">
                <div className="tableContainer">
                  {assetTransfers.length > 0 && <AssetTransferTable transferContent={assetTransfers} />}
                  {collectibleTransfers.length > 0 && (
                    <CollectiblesTransferTable transferContent={collectibleTransfers} />
                  )}
                </div>
              </Card>
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
                  style={{ alignSelf: "flex-start", marginTop: 16 }}
                  size="lg"
                  color="primary"
                  onClick={submitTx}
                  disabled={parsing || assetTransfers.length + collectibleTransfers.length === 0}
                >
                  {parsing ? <Loader size="sm" color="primaryLight" /> : "Submit"}
                </Button>
              )}
            </>
          )}
        </>
      ) : (
        <Text size={"xl"}>Network with chainId {safe.chainId} not yet supported.</Text>
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
