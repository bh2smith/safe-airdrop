import React, { useCallback, useState, useContext } from "react";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { buildTransfers } from "./transfers";
import { useTokenList } from "./hooks/tokenList";
import { Header } from "./components/Header";
import { CSVForm } from "./components/CSVForm";
import { Loader, Text } from "@gnosis.pm/safe-react-components";
import styled from "styled-components";
import { parseCSV, Payment } from "./parser";
import { MessageContext } from "./contexts/MessageContextProvider";

const App: React.FC = () => {
  const { sdk, safe } = useSafeAppsSDK();
  const { tokenList, isLoading } = useTokenList();
  const [submitting, setSubmitting] = useState(false);
  const [transferContent, setTransferContent] = useState<Payment[]>([]);
  const [csvText, setCsvText] = useState<string>(
    "token_address,receiver,amount,decimals"
  );

  const { addMessage, setMessages } = useContext(MessageContext);

  const onChangeTextHandler = useCallback(
    async (csvText: string) => {
      setCsvText(csvText);
      // Parse CSV
      const parsePromise = parseCSV(csvText, tokenList);
      parsePromise
        .then(([transfers, warnings]) => {
          setTransferContent(transfers);
          setMessages(warnings);
        })
        .catch((reason: any) =>
          addMessage({ severity: "error", message: reason.message })
        );
    },
    [addMessage, setMessages, tokenList]
  );

  const submitTx = useCallback(async () => {
    setSubmitting(true);

    try {
      const txs = buildTransfers(safe, transferContent, tokenList);
      console.log(`Encoded ${txs.length} ERC20 transfers.`);
      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [safe, transferContent, tokenList, sdk.txs]);
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
