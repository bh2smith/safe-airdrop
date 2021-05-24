import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Loader, Text } from "@gnosis.pm/safe-react-components";
import { ethers } from "ethers";
import React, { useCallback, useState, useContext, useMemo } from "react";
import styled from "styled-components";

import { CSVForm } from "./components/CSVForm";
import { Header } from "./components/Header";
import { MessageContext } from "./contexts/MessageContextProvider";
import { useTokenInfoProvider, useTokenList } from "./hooks/token";
import { parseCSV, Payment } from "./parser";
import { buildTransfers } from "./transfers";
import { checkAllBalances, transfersToSummary } from "./utils";

const App: React.FC = () => {
  const { safe, sdk } = useSafeAppsSDK();

  const { tokenList, isLoading } = useTokenList();
  const tokenInfoProvider = useTokenInfoProvider();
  const [submitting, setSubmitting] = useState(false);
  const [transferContent, setTransferContent] = useState<Payment[]>([]);
  const [csvText, setCsvText] = useState<string>("token_address,receiver,amount");
  const { addMessage, setCodeWarnings, setMessages } = useContext(MessageContext);

  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [safe, sdk]);

  const onChangeTextHandler = useCallback(
    (csvText: string) => {
      setCsvText(csvText);
      // Parse CSV
      const parsePromise = parseCSV(csvText, tokenInfoProvider);
      parsePromise
        .then(([transfers, warnings]) => {
          console.log("CSV parsed!");
          const summary = transfersToSummary(transfers);
          checkAllBalances(summary, web3Provider, safe).then((insufficientBalances) =>
            setMessages(
              insufficientBalances.map((insufficientBalanceInfo) => ({
                message: `Insufficient Balance: ${insufficientBalanceInfo.transferAmount} of ${insufficientBalanceInfo.token}`,
                severity: "warning",
              })),
            ),
          );
          setTransferContent(transfers);
          setCodeWarnings(warnings);
        })
        .catch((reason: any) => addMessage({ severity: "error", message: reason.message }));
    },
    [addMessage, safe, setCodeWarnings, setMessages, tokenInfoProvider, web3Provider],
  );

  const submitTx = useCallback(async () => {
    setSubmitting(true);
    try {
      const txs = buildTransfers(transferContent);
      console.log(`Encoded ${txs.length} ERC20 transfers.`);
      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [transferContent, sdk.txs]);
  return (
    <Container>
      <Header />
      {isLoading ? (
        <>
          <Loader size={"lg"} />
          <Text size={"lg"}>Loading Tokenlist...</Text>
        </>
      ) : (
        <CSVForm
          csvText={csvText}
          onAbortSubmit={() => setSubmitting(false)}
          submitting={submitting}
          transferContent={transferContent}
          onSubmit={submitTx}
          onChange={onChangeTextHandler}
          tokenList={tokenList}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: left;
  width: 100%;
`;

export default App;
