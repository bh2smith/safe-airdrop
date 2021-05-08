import React, { useContext } from "react";
import styled from "styled-components";
import {
  Card,
  Text,
  Button,
  Link,
  Table,
  Loader,
} from "@gnosis.pm/safe-react-components";
import { TokenMap } from "src/hooks/tokenList";
import { Payment } from "src/parser";
import AceEditor, { IMarker } from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-text";
import { MessageContext } from "src/contexts/MessageContextProvider";

const Form = styled.div`
  flex: 1;
  flex-direction: column;
  display: flex;
  justify-content: space-around;
  gap: 8px;
`;

const EditorWrapper = styled.div``;

export interface CSVFormProps {
  onChange: (transactionCSV: string) => void;
  onSubmit: () => void;
  csvText: string;
  transferContent: Payment[];
  tokenList: TokenMap;
  submitting: boolean;
  onAbortSubmit: () => void;
}

export const CSVForm = (props: CSVFormProps) => {
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
          (token_address,receiver,amount,decimals)
        </Text>
        <EditorWrapper>
          <AceEditor
            onChange={(newCode) => props.onChange(newCode)}
            value={props.csvText}
            theme="tomorrow"
            width={"700px"}
            mode={"text"}
            minLines={6}
            maxLines={32}
            setOptions={{
              firstLineNumber: 0,
            }}
            debounceChangePeriod={200}
            showPrintMargin={false}
            style={{
              borderWidth: 1,
              borderColor: "rgba(0, 0, 0, 0.23)",
              borderRadius: "4px",
              borderStyle: "solid",
              boxShadow: "rgba(40, 54, 61, 0.12) 1px 2px 4px 0px",
            }}
            markers={codeWarnings.map(
              (warning): IMarker => ({
                startRow: warning.lineNo,
                endRow: warning.lineNo,
                className: "error-marker",
                type: "fullLine",
                startCol: 0,
                endCol: 30,
              })
            )}
          />
        </EditorWrapper>
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
