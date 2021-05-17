import React, { useState, ReactElement } from "react";

export type CodeWarning = {
  message: string;
  severity: string;
  lineNo: number;
};

export type Message = {
  message: string;
  severity: string;
};

type MessageContextType = {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  removeMessage: (message: Message) => void;
  addMessage: (message: Message) => void;
  codeWarnings: CodeWarning[];
  setCodeWarnings: (messages: CodeWarning[]) => void;
};

export const MessageContext = React.createContext<MessageContextType>({
  messages: [],
  setMessages: (messages: (Message | CodeWarning)[]) => {},
  removeMessage: (message: Message | CodeWarning) => {},
  addMessage: (message: Message | CodeWarning) => {},
  codeWarnings: [],
  setCodeWarnings: (messages: CodeWarning[]) => {},
});

type MessageContextProviderProps = {
  children: ReactElement;
};

export const MessageContextProvider = (props: MessageContextProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [codeWarnings, setCodeWarnings] = useState<CodeWarning[]>([]);

  const removeMessage = (messageToRemove: Message | CodeWarning) =>
    setMessages(messages.filter((message) => message.message !== messageToRemove.message));

  const addMessage = (messageToAdd: Message | CodeWarning) => {
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
    codeWarnings,
    setCodeWarnings,
  };

  return <MessageContext.Provider value={contextValue}>{props.children}</MessageContext.Provider>;
};
