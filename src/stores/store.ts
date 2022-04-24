import {
  configureStore,
  createListenerMiddleware,
  ListenerEffectAPI,
  TypedAddListener,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/dist/query";

import { balanceApi } from "./api/balanceApi";
import balanceReducer from "./slices/balanceSlice";
import csvReducer from "./slices/csvEditorSlice";
import messageReducer from "./slices/messageSlice";
import safeInfoReducer from "./slices/safeInfoSlice";

const listenerMiddlewareInstance = createListenerMiddleware({
  onError: () => console.error,
});

export const store = configureStore({
  reducer: {
    csvEditor: csvReducer,
    messages: messageReducer,
    safeInfo: safeInfoReducer,
    balance: balanceReducer,
    [balanceApi.reducerPath]: balanceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["csvEditor/updateCsvContent", "safeInfo/setSafeAppProvider"],
      },
    })
      .prepend(listenerMiddlewareInstance.middleware)
      .concat(balanceApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>;

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export type AppAddListener = TypedAddListener<RootState, AppDispatch>;

export const startAppListening = listenerMiddlewareInstance.startListening as AppStartListening;
