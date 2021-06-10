import { Loader, Text } from "@gnosis.pm/safe-react-components";
import { setUseWhatChange } from "@simbathesailor/use-what-changed";
import React from "react";
import styled from "styled-components";

import { CSVForm } from "./components/CSVForm";
import { Header } from "./components/Header";
import { useTokenList } from "./hooks/token";

setUseWhatChange(process.env.NODE_ENV === "development");

const App: React.FC = () => {
  const { isLoading } = useTokenList();

  return (
    <Container>
      <Header />
      {isLoading ? (
        <>
          <Loader size={"lg"} />
          <Text size={"lg"}>Loading Tokenlist...</Text>
        </>
      ) : (
        <CSVForm />
      )}
    </Container>
  );
};

const Container = styled.div`
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: left;
  width: 100%;
`;

export default App;
