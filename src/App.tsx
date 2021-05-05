import { SafeInfo, Transaction } from "@gnosis.pm/safe-apps-sdk";
import React, { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import { useSafe } from "@rmeissner/safe-apps-react-sdk";
import { parseString } from "@fast-csv/parse";
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { AbiItem } from "web3-utils";
import { utils } from "ethers";

import { initWeb3 } from "./connect";
import { TokenMap, useTokenList } from "./tokenList";
import { Header } from "./components/Header";
import { Payment, CSVForm } from "./components/CSVForm";
import { Loader, Text } from "@gnosis.pm/safe-react-components";
import styled from "styled-components";

const TEN = new BigNumber(10);

type SnakePayment = {
  receiver: string;
  amount: string;
  token_address: string;
  decimals: number;
};

function buildTransfers(
  safeInfo: SafeInfo,
  transferData: Payment[],
  tokenList: TokenMap
): Transaction[] {
  const web3 = initWeb3(safeInfo.network);
  const erc20 = new web3.eth.Contract(IERC20.abi as AbiItem[]);
  const txList: Transaction[] = transferData.map((transfer) => {
    if (transfer.tokenAddress === null) {
      return {
        to: transfer.receiver,
        value: transfer.amount.multipliedBy(TEN.pow(18)).toString(),
        data: "0x",
      };
    } else {
      const exponent = new BigNumber(
        TEN.pow(
          tokenList.get(transfer.tokenAddress)?.decimals || transfer.decimals
        )
      );
      return {
        to: transfer.tokenAddress,
        value: "0",
        data: erc20.methods
          .transfer(transfer.receiver, transfer.amount.multipliedBy(exponent))
          .encodeABI(),
      };
    }
  });
  return txList;
}

const App: React.FC = () => {
  const safe = useSafe();
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
      const txList = buildTransfers(safe.info, transferContent, tokenList);
      console.log(`Encoded ${txList.length} ERC20 transfers.`);
      const safeTxHash = await safe.sendTransactions(txList);
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
