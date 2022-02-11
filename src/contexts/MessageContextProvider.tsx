import React, { useState, ReactElement, useCallback } from "react";

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
  showMessages: boolean;
  hideMessages: () => void;
  toggleMessages: () => void;
};

export const MessageContext = React.createContext<MessageContextType>({
  messages: [],
  setMessages: (messages: (Message | CodeWarning)[]) => {},
  removeMessage: (message: Message | CodeWarning) => {},
  addMessage: (message: Message | CodeWarning) => {},
  codeWarnings: [],
  setCodeWarnings: (messages: CodeWarning[]) => {},
  showMessages: false,
  hideMessages: () => {},
  toggleMessages: () => {},
});

type MessageContextProviderProps = {
  children: ReactElement;
};

export const MessageContextProvider = (props: MessageContextProviderProps) => {
  const [messages, internalSetMessages] = useState<Message[]>([]);
  const [codeWarnings, setCodeWarnings] = useState<CodeWarning[]>([]);
  const [showMessages, setShowMessages] = useState(false);

  const removeMessage = (messageToRemove: Message | CodeWarning) => {
    setMessages(messages.filter((message) => message.message !== messageToRemove.message));
  };

  const setMessages = useCallback((newMessages: Message[]) => {
    internalSetMessages(newMessages);
    if (newMessages.length > 0) {
      setShowMessages(true);
    }
  }, []);

  const addMessage = (messageToAdd: Message | CodeWarning) => {
    // Do not add equal message
    if (!messages.some((message) => message.message === messageToAdd.message)) {
      setMessages([messageToAdd, ...messages]);
    }
  };

  const hideMessages = () => setShowMessages(false);

  const toggleMessages = () => setShowMessages(!showMessages);

  const contextValue = {
    messages,
    setMessages,
    removeMessage,
    addMessage,
    codeWarnings,
    setCodeWarnings,
    showMessages,
    hideMessages,
    toggleMessages,
  };

  return <MessageContext.Provider value={contextValue}>{props.children}</MessageContext.Provider>;
};
