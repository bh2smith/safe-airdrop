import { SafeInfo, Transaction } from "@gnosis.pm/safe-apps-sdk";
import BigNumber from "bignumber.js";
import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { Button, Loader, Title } from "@gnosis.pm/safe-react-components";
import { useSafe } from "@rmeissner/safe-apps-react-sdk";
import { parseString } from "@fast-csv/parse";
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { AbiItem } from "web3-utils";

import { initWeb3 } from "./connect";
import { fetchTokenList, TokenMap } from "./tokenList"

const Container = styled.form`
  margin-bottom: 2rem;
  width: 100%;
  max-width: 480px;

  display: grid;
  grid-template-columns: 1fr;
  grid-column-gap: 1rem;
  grid-row-gap: 1rem;
`;

interface SnakePayment {
  receiver: string;
  amount: string;
  token_address: string;
  decimals: number;
}
interface Payment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string;
  decimals: number;
}

function buildTransfers(
  safeInfo: SafeInfo,
  transferData: Payment[]
): Transaction[] {
  const web3 = initWeb3(safeInfo.network);
  const erc20 = new web3.eth.Contract(IERC20.abi as AbiItem[]);
  const txList: Transaction[] = transferData.map((transfer) => {
    console.log(new BigNumber(10 ** transfer.decimals).toString())
    return {
      to: transfer.tokenAddress,
      value: "0",
      data: erc20.methods
        .transfer(
          transfer.receiver,
          transfer.amount.multipliedBy(
            new BigNumber(10 ** transfer.decimals).toString()
          )
        )
        .encodeABI(),
    };
  });
  return txList;
}

const App: React.FC = () => {
  const safe = useSafe();
  const [submitting, setSubmitting] = useState(false);
  const [transferContent, setTransferContent] = useState<Payment[]>([]);
  const [tokenList, setTokenList] = useState<TokenMap>();

  const onChangeHandler = async (event: any) => {
    console.log("Received Filename", event.target.files[0].name);

    const reader = new FileReader();
    const filePromise = new Promise<SnakePayment[]>((resolve, reject) => {
      reader.onload = function (evt) {
        if (!evt.target) {
          return;
        }
        // Parse CSV
        const results: any[] = [];
        parseString(evt.target.result as string, { headers: true })
          .on("data", (data) => results.push(data))
          .on("end", () => resolve(results))
          .on("error", (error) => reject(error));
      };
    });

    reader.readAsText(event.target.files[0]);
    const parsedFile = await filePromise;

    const results: Payment[] = parsedFile
      .map(({ amount, receiver, token_address, decimals }) => ({
        amount: new BigNumber(amount),
        receiver,
        tokenAddress: token_address,
        decimals,
      }))
      .filter((payment) => !payment.amount.isZero());
    const tokens = await fetchTokenList(safe.info.network);
    setTokenList(tokens);
    setTransferContent(results);
  };

  const submitTx = useCallback(async () => {
    setSubmitting(true);

    try {
      const txList = buildTransfers(safe.info, transferContent);
      console.log(`Encoded ${txList.length} ERC20 transfers.`);
      const safeTxHash = await safe.sendTransactions(txList);
      console.log({ safeTxHash });
      const safeTx = await safe.loadSafeTransaction(safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [safe, transferContent]);

  return (
    <Container>
      <Title size="md">CSV Airdrop</Title>

      <input type="file" name="file" onChange={onChangeHandler} />

      <table>
        <thead>
          <tr>
            <td>Token</td>
            <td>Receiver</td>
            <td>Amount</td>
          </tr>
        </thead>
        <tbody>
          {transferContent.map((row, index) => {
            return (
              <tr key={index}>
                {/* <td>
                  <img alt={tokenList[row.tokenAddress].symbol} src={tokenList[row.tokenAddress].logoURI}/>
                </td> */}
                <td>{tokenList.get(row.tokenAddress)?.symbol || row.tokenAddress}</td>
                <td>{row.receiver}</td>
                <td>{row.amount.toString(10)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {submitting ? (
        <>
          <Loader size="md" />
          <br />
          <Button
            size="lg"
            color="secondary"
            onClick={() => {
              setSubmitting(false);
            }}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button size="lg" color="primary" onClick={submitTx}>
          Submit
        </Button>
      )}
    </Container>
  );
};

export default App;
