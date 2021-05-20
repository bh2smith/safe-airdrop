import { Card, Text, Button, Table, Loader } from "@gnosis.pm/safe-react-components";
import { useContext } from "react";
import styled from "styled-components";

import { MessageContext } from "../../src/contexts/MessageContextProvider";
import { TokenMap } from "../hooks/token";
import { Payment } from "../parser";

import { CSVEditor } from "./CSVEditor";
import { CSVUpload } from "./CSVUpload";

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

export const CSVForm = (props: CSVFormProps): JSX.Element => {
  const { codeWarnings } = useContext(MessageContext);

  console.log("Found ", codeWarnings.length + " Code Warnings");

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
        {payment.symbol}
      </div>
    );
  };

  return (
    <Card>
      <Form>
        <Text size="md">
          Upload, edit or paste your transfer CSV. <br />
          (token_address,receiver,amount,decimals)
        </Text>

        <CSVEditor csvText={props.csvText} onChange={props.onChange} />

        <CSVUpload onChange={props.onChange} />

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
                <Button size="lg" color="secondary" onClick={props.onAbortSubmit}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button style={{ alignSelf: "center" }} size="lg" color="primary" onClick={props.onSubmit}>
                Submit
              </Button>
            )}
          </>
        )}
      </Form>
    </Card>
  );
};
