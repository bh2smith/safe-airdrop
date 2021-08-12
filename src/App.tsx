import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Loader, Text } from "@gnosis.pm/safe-react-components";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React from "react";
import styled from "styled-components";

import { CSVForm } from "./components/CSVForm";
import { Header } from "./components/Header";
import { useTokenList, networkMap } from "./hooks/token";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();
  const { safe } = useSafeAppsSDK();
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
