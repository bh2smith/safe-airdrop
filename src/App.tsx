import { SafeInfo, Transaction } from "@gnosis.pm/safe-apps-sdk";
import React, { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { Button, Loader, Title, Table, Card, Link } from "@gnosis.pm/safe-react-components";
import { useSafe } from "@rmeissner/safe-apps-react-sdk";
import { parseString } from "@fast-csv/parse";
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { AbiItem } from "web3-utils";
import { utils } from "ethers";

import { initWeb3 } from "./connect";
import { fetchTokenList, TokenMap } from "./tokenList";
import { createStyles, TextField, Snackbar } from '@material-ui/core';
import { Container, Header, Form, Alert } from './components';
import { fdatasync } from 'fs';

const TEN = new BigNumber(10);

type SnakePayment = {
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
  const [submitting, setSubmitting] = useState(false);
  const [transferContent, setTransferContent] = useState<Payment[]>([]);
  const [tokenList, setTokenList] = useState<TokenMap>();
  const [csvText, setCsvText] = useState<string>("");
  const [lastError, setLastError] = useState<any>();

  const onChangeFileHandler = async (event: any) => {
    console.log("Received Filename", event.target.files[0].name);
 
    const reader = new FileReader();
    const filePromise = new Promise<SnakePayment[]>((resolve, reject) => {
      reader.onload = function (evt) {
        if (!evt.target) {
          return;
        }
        // Parse CSV
        const results: any[] = [];
        setCsvText(evt.target.result as string);
        parseString(evt.target.result as string, { headers: true })
          .validate((data) => (data.token_address === "" || data.token_address === null || utils.isAddress(data.token_address)) && utils.isAddress(data.receiver) && (Math.sign(data.amount) >= 0))
          .on("data", (data) => results.push(data))
          .on("end", () => resolve(results))
          .on("error", (error) => reject(error))
      };
    });

    reader.readAsText(event.target.files[0]);
    const parsedFile = await filePromise;

    const transfers: Payment[] = parsedFile
      .map(({ amount, receiver, token_address, decimals }) => ({
        amount: new BigNumber(amount),
        receiver,
        tokenAddress:
          token_address === "" ? null : utils.getAddress(token_address),
        decimals,
      }))
      .filter((payment) => !payment.amount.isZero());

    // TODO - could reduce token list by filtering on uniqe items from transfers
    const tokens = await fetchTokenList(safe.info.network);
    setTokenList(tokens);
    setTransferContent(transfers);
  };

  const onChangeTextHandler = async (event: any) => {
    const newCSV = event.target.value;
    console.log("Changed CSV", newCSV);
    setCsvText(newCSV);
    // Parse CSV
    const parsePromise = new Promise<SnakePayment[]>((resolve, reject) => {
      const results: any[] = [];
          parseString(newCSV, { headers: true })
          .validate((data) => (data.token_address === "" || data.token_address === null || utils.isAddress(data.token_address)) && utils.isAddress(data.receiver) && (Math.sign(data.amount) >= 0))
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });

    parsePromise.then((rows) => {
    const transfers: Payment[] = rows.map(({ amount, receiver, token_address, decimals }) => ({
        amount: new BigNumber(amount),
        receiver,
        tokenAddress:
          token_address === "" ? null : utils.getAddress(token_address),
        decimals,
      }))
      .filter((payment) => !payment.amount.isZero());

    // TODO - could reduce token list by filtering on uniqe items from transfers
    fetchTokenList(safe.info.network).then(setTokenList);
    setTransferContent(transfers);
    })
    .catch((reason: any) => setLastError(reason));
  };


const extractTokenElement = (payment: Payment, ) => {
  return (
    <div>
      <img /* TODO - alt doesn't really work here */
      alt={""}
      src={tokenList.get(payment.tokenAddress)?.logoURI}
      style={{
        maxWidth: 20,
        marginRight: 3,
      }}
  />{" "}
  {tokenList.get(payment.tokenAddress)?.symbol || payment.tokenAddress}
  </div>
  )
}

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
  console.log("Error: ", lastError?.message);
  return (
    <Container>
      <Header>
        <Title size="md">CSV Airdrop</Title>
        {lastError && 
          <Snackbar anchorOrigin={{vertical: 'top', horizontal: 'center'}} open={true} autoHideDuration={6000}>
            <Alert severity="error" onClose={() => setLastError(null)} >
              {JSON.stringify(lastError?.message)}
            </Alert>
          </Snackbar>
        }
      </Header>
      <Card>
        <Form>
          <TextField label="CSV" onChange={onChangeTextHandler} value={csvText} multiline rows={6} />
          <div>
            <input accept="*.csv" id="csvUploadButton" type="file" name="file" onChange={onChangeFileHandler} style={{display: "none"}}/>
            <label htmlFor="csvUploadButton">
              <Button size="md" variant="contained" color="primary" component="span">
                Upload CSV
              </Button>
            </label>
          </div>
          <div>
            <Link href="./sample.csv" download>
              Sample Transfer File
            </Link>
          </div>
          {transferContent.length > 0 &&
          <>
            <div>
              <Table headers={
                [{id: "token", label: "Token"}, 
                  {id: "receiver", label: "Receiver"}, 
                  {id: "amount", label: "Amount"}]}
                  rows={transferContent.map((row, index) => {
                    return {id: "" + index, cells: [
                      {id: "token", content: extractTokenElement(row)}, 
                      {id: "receiver", content: row.receiver},
                      {id: "amount", content: row.amount.toString()}
                    ]}
                  })}
                  />
            </div>
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
              <Button style={{alignSelf: "center"}} size="lg" color="primary" onClick={submitTx}>
                Submit
              </Button>
            )}
            </>
          }
          
        </Form>
      </Card>
    </Container>
  );
};

const styles = createStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    justifyContent: "left",
  }
})

export default App;
