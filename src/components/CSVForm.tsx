import { Text } from "@gnosis.pm/safe-react-components";
import styled from "styled-components";

import { CSVEditor } from "./CSVEditor";
import { CSVUpload } from "./CSVUpload";
import { GenerateTransfersMenu } from "./GenerateTransfersMenu";

const Form = styled.div`
  flex: 1;
  flex-direction: column;
  display: flex;
  justify-content: space-around;
  gap: 8px;
`;
export interface CSVFormProps {}

export const CSVForm = (props: CSVFormProps): JSX.Element => {
  return (
    <Form>
      <Text size="xl">
        Send arbitrarily many distinct tokens, to arbitrarily many distinct accounts with various different values from
        a CSV file in a single transaction.
      </Text>
      <Text size="lg">
        Upload, edit or paste your asset transfer CSV <br /> (
        <span style={{ fontFamily: "monospace" }}>token_type,token_address,receiver,amount,id</span>)
      </Text>
      <CSVEditor />
      <CSVUpload />
      <GenerateTransfersMenu />
    </Form>
  );
};
