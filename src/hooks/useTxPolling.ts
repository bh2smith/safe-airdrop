import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { GatewayTransactionDetails } from "@gnosis.pm/safe-apps-sdk";
import { useCallback, useEffect, useState } from "react";

export const useTxPolling = (initialTx: GatewayTransactionDetails) => {
  const { sdk } = useSafeAppsSDK();
  const [safeTx, setSafeTx] = useState<GatewayTransactionDetails>(initialTx);
  const [intervalID, setIntervalID] = useState<number>();

  const detailedExecutionInfo = safeTx?.detailedExecutionInfo;
  const safeTxHash = detailedExecutionInfo?.type === "MULTISIG" ? detailedExecutionInfo.safeTxHash : undefined;

  const updateTxState = useCallback(async () => {
    if (!safeTxHash) {
      return;
    }
    const polledTx = await sdk.txs.getBySafeTxHash(safeTxHash);
    setSafeTx(polledTx);
  }, [safeTxHash, sdk.txs]);

  useEffect(() => {
    if (intervalID) {
      window.clearInterval(intervalID);
    }

    const newInterval = window.setInterval(updateTxState, 5000);
    setIntervalID(newInterval);
    return () => window.clearInterval(newInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTxState]);

  return safeTx;
};
