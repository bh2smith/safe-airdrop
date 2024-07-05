import { AlertColor } from "@mui/material";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

export type CodeWarning = {
  message: string;
  severity: string;
  lineNum: number;
};

export type Message = {
  message: string;
  severity: AlertColor;
};

interface MessageState {
  messages: Message[];
  codeWarnings: CodeWarning[];
  showMessages: boolean;
}

const initialState: MessageState = {
  messages: [],
  codeWarnings: [],
  showMessages: false,
};

export const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    setCodeWarnings: (state, action: PayloadAction<CodeWarning[]>) => {
      state.codeWarnings = action.payload;
    },
    removeMessage: (state, action: PayloadAction<Message>) => {
      state.messages = state.messages.filter((message) => message.message !== action.payload.message);
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages ??= [];
      state.messages.push(action.payload);
    },
  },
});

export const { setMessages, setCodeWarnings, removeMessage, addMessage } = messageSlice.actions;

export const selectMessages = ({ messages }: RootState) => messages;

export default messageSlice.reducer;
