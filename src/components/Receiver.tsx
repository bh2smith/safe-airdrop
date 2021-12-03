import { Icon, Text, Tooltip } from "@gnosis.pm/safe-react-components";
import React from "react";

type ReceiverProps = {
  receiverEnsName: string | null;
  receiverAddress: string;
};

export const Receiver = (props: ReceiverProps) => {
  const { receiverEnsName, receiverAddress } = props;
  return receiverEnsName !== null ? (
    <div
      style={{
        flex: 1,
        flexDirection: "row",
        display: "flex",
        justifyContent: "start",
        alignItems: "center",
        gap: 8,
        padding: 16,
        minWidth: 285,
      }}
    >
      <Text size="md">{receiverEnsName}</Text>
      <Tooltip title={receiverAddress}>
        <span>
          <Icon type="info" size="sm" />
        </span>
      </Tooltip>
    </div>
  ) : (
    <div
      style={{
        flex: 1,
        flexDirection: "row",
        display: "flex",
        justifyContent: "start",
        alignItems: "center",
        gap: 8,
        padding: 16,
        minWidth: 285,
      }}
    >
      <Text size="md">{receiverAddress}</Text>
    </div>
  );
};
