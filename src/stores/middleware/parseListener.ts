import { checkAllBalances } from "src/parser/balanceCheck";
import { CSVParser } from "src/parser/csvParser";

import { balanceApi } from "../api/balanceApi";
import { setTransfers, startParsing, stopParsing, updateCsvContent } from "../slices/csvEditorSlice";
import { setCodeWarnings, setMessages } from "../slices/messageSlice";
import { AppStartListening } from "../store";

export const setupParserListener = (startListening: AppStartListening) => {
  const subscription = startListening({
    actionCreator: updateCsvContent,
    effect: async (action, listenerApi) => {
      const { collectibleTokenInfoProvider, csvContent, ensResolver, tokenInfoProvider } = action.payload;
      listenerApi.cancelActiveListeners();
      await listenerApi.delay(750);
      listenerApi.dispatch(startParsing());

      const assetBalanceSubscription = listenerApi.dispatch(balanceApi.endpoints.getAssetBalance.initiate());
      const nftBalanceSubscription = listenerApi.dispatch(balanceApi.endpoints.getNFTBalance.initiate());

      let [transfers, codeWarnings] = await CSVParser.parseCSV(
        csvContent,
        tokenInfoProvider,
        collectibleTokenInfoProvider,
        ensResolver,
      );
      const uniqueReceiversWithoutEnsName = transfers.reduce(
        (previousValue, currentValue): Set<string> =>
          currentValue.receiverEnsName === null ? previousValue.add(currentValue.receiver) : previousValue,
        new Set<string>(),
      );
      if (uniqueReceiversWithoutEnsName.size < 15) {
        transfers = await Promise.all(
          // If there is no ENS Name we will try to lookup the address
          transfers.map(async (transfer) =>
            transfer.receiverEnsName
              ? transfer
              : {
                  ...transfer,
                  receiverEnsName: (await ensResolver.isEnsEnabled())
                    ? await ensResolver.lookupAddress(transfer.receiver)
                    : null,
                },
          ),
        );
      }
      transfers = transfers.map((transfer, idx) => ({ ...transfer, position: idx + 1 }));
      listenerApi.dispatch(setTransfers(transfers));
      const result = await listenerApi.condition((action, state) => {
        const assetBalanceResult = balanceApi.endpoints.getAssetBalance.select()(state);
        const nftBalanceResult = balanceApi.endpoints.getNFTBalance.select()(state);

        return assetBalanceResult.isSuccess && nftBalanceResult.isSuccess;
      }, 3000);
      if (result) {
        const currentState = listenerApi.getState();
        const assetBalanceResult = balanceApi.endpoints.getAssetBalance.select()(currentState);
        const nftBalanceResult = balanceApi.endpoints.getNFTBalance.select()(currentState);
        const insufficientBalances = checkAllBalances(assetBalanceResult.data, nftBalanceResult.data, transfers);
        listenerApi.dispatch(
          setMessages(
            insufficientBalances.map((insufficientBalanceInfo) => {
              if (insufficientBalanceInfo.token_type === "erc20" || insufficientBalanceInfo.token_type === "native") {
                if (insufficientBalanceInfo.token_type === "native") {
                  insufficientBalanceInfo.token = tokenInfoProvider.getNativeTokenSymbol();
                }
                return {
                  message: `Insufficient Balance: ${insufficientBalanceInfo.transferAmount} of ${insufficientBalanceInfo.token}`,
                  severity: "error",
                };
              } else {
                if (insufficientBalanceInfo.isDuplicate) {
                  return {
                    message: `Duplicate transfer for ERC721 token ${insufficientBalanceInfo.token} with ID ${insufficientBalanceInfo.id}`,
                    severity: "warning",
                  };
                } else {
                  return {
                    message: `Collectible ERC721 token ${insufficientBalanceInfo.token} with ID ${insufficientBalanceInfo.id} is not held by this safe`,
                    severity: "error",
                  };
                }
              }
            }),
          ),
        );
      }

      listenerApi.dispatch(setCodeWarnings(codeWarnings));
      listenerApi.dispatch(stopParsing());
      assetBalanceSubscription.unsubscribe();
      nftBalanceSubscription.unsubscribe();
    },
  });

  return () => subscription();
};
