import styled from "@emotion/styled";
import { Alert, Fab, Snackbar, Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideMessages, Message, removeMessage, toggleMessages } from "src/stores/slices/messageSlice";
import { RootState } from "src/stores/store";

import { FAQModal } from "./FAQModal";

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
        {messages.length === 0 ? <span>CHECK ICON</span> : <Typography>{messages.length}</Typography>}
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
            <Alert severity="success" key="successMessage">
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
