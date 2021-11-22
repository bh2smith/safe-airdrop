import { Table, Text } from "@gnosis.pm/safe-react-components";
import React from "react";

import { CollectibleTransfer } from "../../parser/csvParser";
import { Receiver } from "../Receiver";

import { ERC20Token } from "./ERC20Token";

type TransferTableProps = {
  transferContent: CollectibleTransfer[];
};

export const CollectiblesTransferTable = (props: TransferTableProps) => {
  const { transferContent } = props;
  return (
    <div style={{ flex: "1" }}>
      <Table
        headers={[
          { id: "position", label: "#" },
          { id: "token", label: "Token" },
          { id: "receiver", label: "Receiver" },
          { id: "value", label: "Value" },
          { id: "id", label: "ID" },
        ]}
        rows={transferContent.map((row, index) => {
          return {
            id: "" + index,
            cells: [
              { id: "position", content: row.position },
              { id: "token", content: <ERC20Token tokenAddress={row.tokenAddress} symbol={row.tokenName} /> },
              {
                id: "receiver",
                content: <Receiver receiverAddress={row.receiver} receiverEnsName={row.receiverEnsName} />,
              },
              { id: "value", content: <Text size="md">{row.value?.toString()}</Text> },
              { id: "id", content: <Text size="md">{row.tokenId.toString()}</Text> },
            ],
          };
        })}
      />
    </div>
  );
};
