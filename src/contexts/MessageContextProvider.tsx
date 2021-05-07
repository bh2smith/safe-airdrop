import React, { useState, ReactElement } from "react";

export type Message = {
  message: string;
  severity: string;
};

type MessageContextType = {
  messages: Message[];
  setMessages: (message: Message[]) => void;
  removeMessage: (message: Message) => void;
  addMessage: (message: Message) => void;
};

export const MessageContext = React.createContext<MessageContextType>({
  messages: [],
  setMessages: (messages: Message[]) => {},
  removeMessage: (message: Message) => {},
  addMessage: (message: Message) => {},
});

type MessageContextProviderProps = {
  children: ReactElement;
};

export const MessageContextProvider = (props: MessageContextProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const removeMessage = (messageToRemove: Message) =>
    setMessages(
      messages.filter((message) => message.message !== messageToRemove.message)
    );

  const addMessage = (messageToAdd: Message) => {
    // Do not add equal message
    if (!messages.some((message) => message.message === messageToAdd.message)) {
      setMessages([messageToAdd, ...messages]);
    }
  };
  const contextValue = {
    messages,
    setMessages,
    removeMessage,
    addMessage,
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {props.children}
    </MessageContext.Provider>
  );
};
