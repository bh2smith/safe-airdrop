import { Icon, Text } from "@gnosis.pm/safe-react-components";
import { Fab, Snackbar } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideMessages, Message, removeMessage, toggleMessages } from "src/stores/slices/messageSlice";
import { RootState } from "src/stores/store";
import styled from "styled-components";

import { FAQModal } from "./FAQModal";

export function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}
const HeaderContainer = styled.div`
  flex: 1;
  width: 100%;
  position: absolute;
  justify-content: flex-end;
  display: flex;
  top: 24px;
  right: 24px;
  z-index: 2;
  gap: 8px;
`;

const AlertWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

export const Header = (): JSX.Element => {
  const dispatch = useDispatch();
  const { messages, showMessages } = useSelector((state: RootState) => state.messages);
  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    dispatch(hideMessages());
  };

  return (
    <HeaderContainer>
      <Fab
        variant="circular"
        size="small"
        className={messages.length === 0 ? "statusDotButtonEmpty" : "statusDotButtonErrors"}
        style={{ textTransform: "none", width: "34px", height: "34px" }}
        onClick={() => dispatch(toggleMessages())}
      >
        {messages.length === 0 ? (
          <Icon color="white" type="check" size="sm" />
        ) : (
          <Text size="xl" color="white">
            {messages.length}
          </Text>
        )}
      </Fab>
      <FAQModal />
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={showMessages}
        onClose={handleClose}
        autoHideDuration={6000}
        style={{ gap: "4px", top: "64px" }}
      >
        <AlertWrapper>
          {messages.length === 0 && (
            <Alert secerity="success" key="successMessage">
              No warnings or errors.
            </Alert>
          )}
          {messages.map((message: Message, index: number) => (
            <Alert severity={message.severity} key={"message" + index} onClose={() => dispatch(removeMessage(message))}>
              {message.message}
            </Alert>
          ))}
        </AlertWrapper>
      </Snackbar>
    </HeaderContainer>
  );
};
