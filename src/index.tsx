import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "styled-components";
import { theme } from "@gnosis.pm/safe-react-components";
import { Loader, Title } from "@gnosis.pm/safe-react-components";
import SafeProvider from "@rmeissner/safe-apps-react-sdk";
import GlobalStyle from "./GlobalStyle";
import App from "./App";
import { MessageContextProvider } from "./contexts/MessageContextProvider";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SafeProvider
        loading={
          <>
            <Title size="md">Waiting for Safe...</Title>
            <Loader size="md" />
          </>
        }
      >
        <MessageContextProvider>
          <App />
        </MessageContextProvider>
      </SafeProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
