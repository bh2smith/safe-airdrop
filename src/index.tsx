import SafeProvider from "@gnosis.pm/safe-apps-react-sdk";
import { theme, Loader, Title } from "@gnosis.pm/safe-react-components";
import React from "react";
import ReactDOM from "react-dom";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider } from "styled-components";

import App from "./App";
import GlobalStyle from "./GlobalStyle";
import { store } from "./stores/store";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SafeProvider
        loader={
          <>
            <Title size="md">Waiting for Safe...</Title>
            <Loader size="md" />
          </>
        }
      >
        <ReduxProvider store={store}>
          <App />
        </ReduxProvider>
      </SafeProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
