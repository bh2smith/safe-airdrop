import { Title } from "@gnosis.pm/safe-react-components";
import { Snackbar } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import React, { useContext } from "react";
import styled from "styled-components";

import { MessageContext, Message } from "../contexts/MessageContextProvider";

export function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}
const HeaderContainer = styled.div`
  flex: 1;
  width: 100%;
`;

export const Header = () => {
  const messageContext = useContext(MessageContext);
  const messages = messageContext.messages;
  return (
    <HeaderContainer>
      <Title size="md">CSV Airdrop</Title>
      {messages?.length > 0 && (
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={messages?.length > 0}
          onClose={() => messageContext.setMessages([])}
          autoHideDuration={6000}
        >
          <div>
            {messages.map((message: Message, index: number) => (
              <Alert
                severity={message.severity}
                key={"message" + index}
                onClose={() => messageContext.removeMessage(message)}
              >
                {message.message}
              </Alert>
            ))}
          </div>
        </Snackbar>
      )}
    </HeaderContainer>
  );
};
