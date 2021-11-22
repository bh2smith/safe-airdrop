import { Table, Text } from "@gnosis.pm/safe-react-components";
import React from "react";

import { AssetTransfer } from "../../parser/csvParser";
import { Receiver } from "../Receiver";

import { ERC20Token } from "./ERC20Token";

type TransferTableProps = {
  transferContent: AssetTransfer[];
};

export const AssetTransferTable = (props: TransferTableProps) => {
  const { transferContent } = props;
  return (
    <div style={{ flex: "1" }}>
      <Table
        isStickyHeader={true}
        maxHeight={750}
        headers={[
          { id: "position", label: "#" },
          { id: "token", label: "Token" },
          { id: "receiver", label: "Receiver" },
          { id: "value", label: "Value" },
        ]}
        rows={transferContent.map((row, index) => {
          return {
            id: "" + index,
            cells: [
              { id: "position", content: row.position },
              { id: "token", content: <ERC20Token tokenAddress={row.tokenAddress} symbol={row.symbol} /> },
              {
                id: "receiver",
                content: <Receiver receiverAddress={row.receiver} receiverEnsName={row.receiverEnsName} />,
              },
              { id: "value", content: <Text size="md">{row.amount.toString()}</Text> },
            ],
          };
        })}
      />
    </div>
  );
};
