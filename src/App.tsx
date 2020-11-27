/** @format */
import { Transaction } from "@gnosis.pm/safe-apps-sdk";
import BigNumber from "bignumber.js";
import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { Button, Loader, Title } from "@gnosis.pm/safe-react-components";
import { useSafe } from "@rmeissner/safe-apps-react-sdk";
import { parseString } from "@fast-csv/parse";

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
}
interface Payment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string;
}

const App: React.FC = () => {
  const safe = useSafe();
  const [submitting, setSubmitting] = useState(false);
  const [transferContent, setTransferContent] = useState<Payment[]>([]);

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
      .map(({ amount, receiver, token_address }) => ({
        amount: new BigNumber(amount),
        receiver,
        tokenAddress: token_address,
      }))
      .filter((payment) => !payment.amount.isZero());
    setTransferContent(results);
  };

  const submitTx = useCallback(async () => {
    setSubmitting(true);
    try {
      // const safeTxHash = await safe.sendTransactions([
      //   {
      //     to: safe.info.safeAddress,
      //     value: "0",
      //     data: "0x",
      //   },
      //   {
      //     to: safe.info.safeAddress,
      //     value: "0",
      //     data: "0x",
      //   },
      // ]);
      const txList: Transaction[] = transferContent.map((transfer) => {
        return {
          to: transfer.tokenAddress,
          value: "0",
          data: "0x",
        };
      });
      const safeTxHash = await safe.sendTransactions(txList);
      console.log({ safeTxHash });
      const safeTx = await safe.loadSafeTransaction(safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [safe]);

  return (
    <Container>
      <Title size="md">{safe.info.safeAddress}</Title>

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
                <td>{row.tokenAddress}</td>
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
