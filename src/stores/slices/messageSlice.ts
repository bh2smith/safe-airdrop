import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CodeWarning = {
  message: string;
  severity: string;
  lineNo: number;
};

export type Message = {
  message: string;
  severity: string;
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
    hideMessages: (state) => {
      state.showMessages = false;
    },
    toggleMessages: (state) => {
      state.showMessages = !state.showMessages;
    },
  },
});

export const { setMessages, setCodeWarnings, removeMessage, hideMessages, toggleMessages } = messageSlice.actions;

export default messageSlice.reducer;
