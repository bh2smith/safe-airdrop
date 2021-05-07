import React, { useCallback, useState, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { parseString } from "@fast-csv/parse";
import { utils, ethers } from "ethers";
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { buildTransfers } from "./transfers";
import { useTokenList } from "./tokenList";
import { Header } from "./components/Header";
import { Payment, CSVForm } from "./components/CSVForm";
import { Loader, Text } from "@gnosis.pm/safe-react-components";
import styled from "styled-components";

type SnakePayment = {
  receiver: string;
  amount: string;
  token_address: string;
  decimals: number;
};

const App: React.FC = () => {
  // const safe = useSafe();
  const { sdk, safe } = useSafeAppsSDK();
  const web3Provider = useMemo(
    () => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)),
    [sdk, safe]
  );
  const erc20Interface = new ethers.Contract(
    "IERC20",
    IERC20.abi,
    web3Provider
  );
  const { tokenList, isLoading } = useTokenList();
  const [submitting, setSubmitting] = useState(false);
  const [transferContent, setTransferContent] = useState<Payment[]>([]);
  const [csvText, setCsvText] = useState<string>(
    "token_address,receiver,amount"
  );
  const [lastError, setLastError] = useState<any>();

  const onChangeTextHandler = async (csvText: string) => {
    console.log("Changed CSV", csvText);
    setCsvText(csvText);
    // Parse CSV
    const parsePromise = new Promise<SnakePayment[]>((resolve, reject) => {
      const results: any[] = [];
      parseString(csvText, { headers: true })
        .validate(
          (data) =>
            (data.token_address === "" ||
              data.token_address === null ||
              utils.isAddress(data.token_address)) &&
            utils.isAddress(data.receiver) &&
            Math.sign(data.amount) >= 0
        )
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (error) => reject(error));
    });

    parsePromise
      .then((rows) => {
        const transfers: Payment[] = rows
          .map(({ amount, receiver, token_address, decimals }) => ({
            amount: new BigNumber(amount),
            receiver,
            tokenAddress:
              token_address === "" ? null : utils.getAddress(token_address),
            decimals,
          }))
          .filter((payment) => !payment.amount.isZero());
        setTransferContent(transfers);
      })
      .catch((reason: any) => setLastError(reason));
  };

  const submitTx = useCallback(async () => {
    setSubmitting(true);
    try {
      const txList = buildTransfers(transferContent, tokenList, erc20Interface);
      console.log(`Encoded ${txList.length} ERC20 transfers.`);
      const safeTxHash = await web3Provider.sendTransaction(txList);
      console.log({ safeTxHash });
      const safeTx = await safe.loadSafeTransaction(safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [safe, transferContent, tokenList]);
  return (
    <Container>
      <Header lastError={lastError} onCloseError={() => setLastError(null)} />
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
