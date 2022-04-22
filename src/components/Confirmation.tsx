import { Button, IconText, Title } from "@gnosis.pm/safe-react-components";
import { ReactElement } from "react";
import styled from "styled-components";

interface ConfirmationProps {
  txNonce: number;
  noTxs: number;
  createNewTX: () => void;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Confirmation: (props: ConfirmationProps) => ReactElement = (props) => {
  const { txNonce, noTxs, createNewTX } = props;
  return (
    <Wrapper>
      <Title size="lg">Transaction created</Title>
      <IconText
        iconType="sent"
        iconSize="md"
        iconColor="primary"
        textSize="xl"
        text={`A transaction with nonce ${txNonce} containing ${noTxs} transfers was successfully created.
        Check your transactions queue for more information.`}
      />
      <div>
        <Button size="lg" onClick={createNewTX}>
          Create new Transaction
        </Button>
      </div>
    </Wrapper>
  );
};
