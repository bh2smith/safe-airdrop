import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
// TODO - Will need for web3Provider
// import { useMemo } from "react";
// import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
// import { ethers } from "ethers";
import { Loader, Text } from "@gnosis.pm/safe-react-components";
import React, { useCallback, useState, useContext } from "react";
import styled from "styled-components";

import { CSVForm } from "./components/CSVForm";
import { Header } from "./components/Header";
import { MessageContext } from "./contexts/MessageContextProvider";
import { useTokenList } from "./hooks/tokenList";
import { parseCSV, Payment } from "./parser";
import { buildTransfers } from "./transfers";

const App: React.FC = () => {
  const { sdk } = useSafeAppsSDK();
  const { tokenList, isLoading } = useTokenList();
  const [submitting, setSubmitting] = useState(false);
  const [transferContent, setTransferContent] = useState<Payment[]>([]);
  const [csvText, setCsvText] = useState<string>(
    "token_address,receiver,amount,decimals"
  );
  const { addMessage, setCodeWarnings } = useContext(MessageContext);

  // const web3Provider = useMemo(
  //   () => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)),
  //   [sdk, safe]
  // );

  const onChangeTextHandler = useCallback(
    async (csvText: string) => {
      setCsvText(csvText);
      // Parse CSV
      const parsePromise = parseCSV(csvText, tokenList);
      parsePromise
        .then(([transfers, warnings]) => {
          setTransferContent(transfers);
          setCodeWarnings(warnings);
        })
        .catch((reason: any) =>
          addMessage({ severity: "error", message: reason.message })
        );
    },
    [addMessage, setCodeWarnings, tokenList]
  );

  const submitTx = useCallback(async () => {
    setSubmitting(true);
    try {
      // TODO - will need to pass web3Provider in here eventually
      const txs = buildTransfers(transferContent, tokenList);
      console.log(`Encoded ${txs.length} ERC20 transfers.`);
      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [transferContent, tokenList, sdk.txs]);
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
