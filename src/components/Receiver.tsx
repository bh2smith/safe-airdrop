import { Icon, Text, Tooltip } from "@gnosis.pm/safe-react-components";
import React from "react";
import styled from "styled-components";

type ReceiverProps = {
  receiverEnsName: string | null;
  receiverAddress: string;
};

const Container = styled.div`
  flex: 1;
  flex-direction: row;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  padding: 16px;
  min-width: 285px;
`;

export const Receiver = (props: ReceiverProps) => {
  const { receiverEnsName, receiverAddress } = props;
  return receiverEnsName !== null ? (
    <Container>
      <Text size="md">{receiverEnsName}</Text>
      <Tooltip title={receiverAddress}>
        <span>
          <Icon type="info" size="sm" />
        </span>
      </Tooltip>
    </Container>
  ) : (
    <Container>
      <Text size="md">{receiverAddress}</Text>
    </Container>
  );
};
