import React from "react";
import styled from "styled-components";

import MuiAlert from "@material-ui/lab/Alert";
import {
  Card,
  Text,
  Button,
  Link,
  Table,
  Loader,
} from "@gnosis.pm/safe-react-components";
import { TextField } from "@material-ui/core";
import BigNumber from "bignumber.js";
import { TokenMap } from "src/tokenList";

export function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const Form = styled.div`
  flex: 1;
  flex-direction: column;
  display: flex;
  justify-content: space-around;
  gap: 8px;
`;

export interface CSVFormProps {
  onChange: (transactionCSV: string) => void;
  onSubmit: () => void;
  csvText: string;
  transferContent: Payment[];
  tokenList: TokenMap;
  submitting: boolean;
  onAbortSubmit: () => void;
}

export interface Payment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string;
  decimals: number;
}

export const CSVForm = (props: CSVFormProps) => {
  const tokenList = props.tokenList;
  const extractTokenElement = (payment: Payment) => {
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
    );
  };

  const onChangeFileHandler = async (event: any) => {
    console.log("Received Filename", event.target.files[0].name);

    const reader = new FileReader();
    reader.onload = function (evt) {
      if (!evt.target) {
        return;
      }
      props.onChange(evt.target.result as string);
    };
    reader.readAsText(event.target.files[0]);
  };
  return (
    <Card>
      <Form>
        <Text size="md">
          Upload, edit or paste your transfer CSV. <br />
          (token_address,receiver,amount)
        </Text>
        <TextField
          variant="outlined"
          label="CSV"
          onChange={(event) => props.onChange(event.target.value)}
          value={props.csvText}
          multiline
          rows={6}
        />
        <div>
          <input
            accept="*.csv"
            id="csvUploadButton"
            type="file"
            name="file"
            onChange={onChangeFileHandler}
            style={{ display: "none" }}
          />
          <label htmlFor="csvUploadButton">
            <Button
              size="md"
              variant="contained"
              color="primary"
              component="span"
            >
              Upload CSV
            </Button>
          </label>
        </div>
        <div>
          <Link href="./sample.csv" download>
            Sample Transfer File
          </Link>
        </div>
        {props.transferContent.length > 0 && (
          <>
            <div>
              <Table
                headers={[
                  { id: "token", label: "Token" },
                  { id: "receiver", label: "Receiver" },
                  { id: "amount", label: "Amount" },
                ]}
                rows={props.transferContent.map((row, index) => {
                  return {
                    id: "" + index,
                    cells: [
                      { id: "token", content: extractTokenElement(row) },
                      { id: "receiver", content: row.receiver },
                      { id: "amount", content: row.amount.toString() },
                    ],
                  };
                })}
              />
            </div>
            {props.submitting ? (
              <>
                <Loader size="md" />
                <br />
                <Button
                  size="lg"
                  color="secondary"
                  onClick={props.onAbortSubmit}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                style={{ alignSelf: "center" }}
                size="lg"
                color="primary"
                onClick={props.onSubmit}
              >
                Submit
              </Button>
            )}
          </>
        )}
      </Form>
    </Card>
  );
};
