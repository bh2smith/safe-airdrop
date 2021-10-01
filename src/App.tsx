import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Dot, Icon, Loader, Tab, Text } from "@gnosis.pm/safe-react-components";
import { Item } from "@gnosis.pm/safe-react-components/dist/navigation/Tab";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React, { useState } from "react";
import styled from "styled-components";

import { Header } from "./components/Header";
import { NFTCSVForm } from "./components/NFTCSVForm";
import { AssetCSVForm } from "./components/assets/AssetCSVForm";
import { useTokenList, networkMap } from "./hooks/token";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const { safe } = useSafeAppsSDK();
  const [selectedTab, setSelectedTab] = useState("assets");
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
          <Dot className="navDot" color="primary">
            <Text size="sm" color="white">
              7
            </Text>
          </Dot>
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
          <Dot className="navDot" color="primary">
            <Text size="sm" color="white">
              2
            </Text>
          </Dot>
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
              {selectedTab === "assets" && <AssetCSVForm />}
              {selectedTab === "collectibles" && <NFTCSVForm />}
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
