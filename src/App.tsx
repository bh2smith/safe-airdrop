import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { GenericModal, Icon, Loader, Text, Title, Divider, Button } from "@gnosis.pm/safe-react-components";
import { Fab } from "@material-ui/core";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React, { useState } from "react";
import styled from "styled-components";

import { CSVForm } from "./components/CSVForm";
import { Header } from "./components/Header";
import { useTokenList, networkMap } from "./hooks/token";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const { safe } = useSafeAppsSDK();
  const [showHelp, setShowHelp] = useState(false);
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
            <CSVForm />
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
