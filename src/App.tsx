import React, { useCallback, useState, useMemo, useContext } from "react";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { buildTransfers } from "./transfers";
import { useTokenList } from "./hooks/tokenList";
import { Header } from "./components/Header";
import { CSVForm } from "./components/CSVForm";
import { Loader, Text } from "@gnosis.pm/safe-react-components";
import styled from "styled-components";
import { ethers } from "ethers";
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
  const web3Provider = useMemo(
    () => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)),
    [sdk, safe]
  );

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
      const erc20Interface = new ethers.Contract("", IERC20.abi, web3Provider);
      const txs = buildTransfers(transferContent, tokenList, erc20Interface);
      console.log(`Encoded ${txs.length} ERC20 transfers.`);
      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [web3Provider, transferContent, tokenList, sdk.txs]);
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
