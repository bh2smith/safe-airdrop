import styled from "@emotion/styled";
import { EthHashInfo } from "@safe-global/safe-react-components";
import React from "react";
import { DONATION_ADDRESS } from "src/utils";

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
  min-width: 144px;
`;

export const Receiver = (props: ReceiverProps) => {
  const { receiverEnsName, receiverAddress } = props;
  const isDonation = receiverAddress.toLowerCase() === DONATION_ADDRESS.toLowerCase();
  const displayName = isDonation ? "Donation Safe ❤️" : receiverEnsName;
  return (
    <Container>
      <EthHashInfo address={receiverAddress} name={displayName} showAvatar={false} showCopyButton={false} />
    </Container>
  );
};
