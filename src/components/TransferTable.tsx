import { Table, Text } from "@gnosis.pm/safe-react-components";
import React from "react";

import { Payment } from "../parser";

import { Receiver } from "./Receiver";
import { Token } from "./Token";

type TransferTableProps = {
  transferContent: Payment[];
};

export const TransferTable = (props: TransferTableProps) => {
  const { transferContent } = props;
  return (
    <div>
      <Table
        isStickyHeader={true}
        maxHeight={750}
        headers={[
          { id: "token", label: "Token" },
          { id: "receiver", label: "Receiver" },
          { id: "amount", label: "Amount" },
        ]}
        rows={transferContent.map((row, index) => {
          return {
            id: "" + index,
            cells: [
              { id: "token", content: <Token tokenAddress={row.tokenAddress} symbol={row.symbol} /> },
              {
                id: "receiver",
                content: <Receiver receiverAddress={row.receiver} receiverEnsName={row.receiverEnsName} />,
              },
              { id: "amount", content: <Text size="md">{row.amount.toString()}</Text> },
            ],
          };
        })}
      />
    </div>
  );
};
