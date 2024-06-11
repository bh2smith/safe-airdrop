import {
  configureStore,
  createListenerMiddleware,
  ListenerEffectAPI,
  TypedAddListener,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import addressBookReducer from "./slices/addressbookSlice";
import assetBalanceReducer from "./slices/assetBalanceSlice";
import collectiblesReducer from "./slices/collectiblesSlice";
import csvReducer from "./slices/csvEditorSlice";
import messageReducer from "./slices/messageSlice";
import networksReducer from "./slices/networksSlice";
import safeInfoReducer from "./slices/safeInfoSlice";

const listenerMiddlewareInstance = createListenerMiddleware({
  onError: () => console.error,
});

export const makeStore = (initialState?: Record<string, any>) =>
  configureStore({
    reducer: {
      csvEditor: csvReducer,
      messages: messageReducer,
      safeInfo: safeInfoReducer,
      networks: networksReducer,
      collectibles: collectiblesReducer,
      assetBalance: assetBalanceReducer,
      addressbook: addressBookReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddlewareInstance.middleware),
    preloadedState: initialState,
  });

export type RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;

export type AppDispatch = ReturnType<typeof makeStore>["dispatch"];

export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>;

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export type AppAddListener = TypedAddListener<RootState, AppDispatch>;

export const startAppListening = listenerMiddlewareInstance.startListening as AppStartListening;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectIsLoading = (state: RootState) => state.assetBalance.isLoading || state.collectibles.isLoading;
