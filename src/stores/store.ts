import {
  configureStore,
  createListenerMiddleware,
  ListenerEffectAPI,
  TypedAddListener,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/dist/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import assetBalanceReducer from "./slices/assetBalanceSlice";
import collectiblesReducer from "./slices/collectiblesSlice";
import csvReducer from "./slices/csvEditorSlice";
import messageReducer from "./slices/messageSlice";
import networksReducer from "./slices/networksSlice";
import safeInfoReducer from "./slices/safeInfoSlice";

const listenerMiddlewareInstance = createListenerMiddleware({
  onError: () => console.error,
});

export const store = configureStore({
  reducer: {
    csvEditor: csvReducer,
    messages: messageReducer,
    safeInfo: safeInfoReducer,
    networks: networksReducer,
    collectibles: collectiblesReducer,
    assetBalance: assetBalanceReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddlewareInstance.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>;

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export type AppAddListener = TypedAddListener<RootState, AppDispatch>;

export const startAppListening = listenerMiddlewareInstance.startListening as AppStartListening;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectIsLoading = (state: RootState) => state.assetBalance.isLoading || state.collectibles.isLoading;
