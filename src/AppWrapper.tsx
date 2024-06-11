import { CircularProgress, CssBaseline, GlobalStyles, Theme, ThemeProvider, Typography } from "@mui/material";
import SafeProvider from "@safe-global/safe-apps-react-sdk";
import { SafeThemeProvider } from "@safe-global/safe-react-components";
import { Provider as ReduxProvider } from "react-redux";

import App from "./App";
import { AppInitializer } from "./AppInitializer";
import { useDarkMode } from "./hooks/useDarkMode";
import errorIcon from "./static/error-icon.svg";
import { makeStore } from "./stores/store";

export const AppWrapper = () => {
  const isDarkMode = useDarkMode();
  const themeMode = isDarkMode ? "dark" : "light";

  const store = makeStore();

  return (
    <SafeThemeProvider mode={themeMode}>
      {(safeTheme: Theme) => (
        <ThemeProvider theme={safeTheme}>
          <CssBaseline />
          <GlobalStyles
            styles={{
              ".error-marker": {
                position: "absolute",
                backgroundColor: "lightpink",
                display: "block",
              },
              ".ace_error": {
                backgroundImage: `url(${errorIcon}) !important`,
                backgroundSize: "15px",
              },
              ".ace_tooltip.ace_error": {
                backgroundImage: "none !important",
              },
            }}
          />
          <SafeProvider
            loader={
              <>
                <Typography>Waiting for Safe...</Typography>
                <CircularProgress />
              </>
            }
          >
            <ReduxProvider store={store}>
              <AppInitializer />
              <App />
            </ReduxProvider>
          </SafeProvider>
        </ThemeProvider>
      )}
    </SafeThemeProvider>
  );
};
