import { Transfer } from "src/hooks/useCsvParser";
import { EnsResolver } from "src/hooks/useEnsResolver";
import { checkAllBalances } from "src/parser/balanceCheck";

import { balanceApi } from "../api/balanceApi";
import { setTransfers, startParsing, stopParsing, updateCsvContent } from "../slices/csvEditorSlice";
import { CodeWarning, setCodeWarnings, setMessages } from "../slices/messageSlice";
import { AppStartListening } from "../store";

export const setupParserListener = (
  startListening: AppStartListening,
  parseCsv: (csvText: string) => Promise<[Transfer[], CodeWarning[]]>,
  ensResolver: EnsResolver,
) => {
  const subscription = startListening({
    actionCreator: updateCsvContent,
    effect: async (action, listenerApi) => {
      const { csvContent } = action.payload;
      listenerApi.cancelActiveListeners();
      await listenerApi.delay(750);
      listenerApi.dispatch(startParsing());
      try {
        let [transfers, codeWarnings] = await parseCsv(csvContent);
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
        listenerApi.dispatch(setCodeWarnings(codeWarnings));

        const currentState = listenerApi.getState();
        const assetBalanceResult = balanceApi.endpoints.getAssetBalance.select()(currentState);
        const nftBalanceResult = balanceApi.endpoints.getAllNFTs.select()(currentState);
        const insufficientBalances = checkAllBalances(assetBalanceResult.data, nftBalanceResult.data, transfers);

        listenerApi.dispatch(stopParsing());

        listenerApi.dispatch(
          setMessages(
            insufficientBalances.map((insufficientBalanceInfo) => {
              if (insufficientBalanceInfo.token_type === "erc20" || insufficientBalanceInfo.token_type === "native") {
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
      } catch (err) {
        listenerApi.dispatch(
          setMessages([
            {
              message: JSON.stringify(err),
              severity: "error",
            },
          ]),
        );
        listenerApi.dispatch(stopParsing());
      }
    },
  });

  return () => subscription();
};
