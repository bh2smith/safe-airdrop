import { Table, Text } from "@gnosis.pm/safe-react-components";
import React from "react";

import { CollectibleTransfer } from "../../collectiblesParser";
import { Receiver } from "../Receiver";

import { ERC20Token } from "./ERC20Token";

type TransferTableProps = {
  transferContent: CollectibleTransfer[];
};

export const CollectiblesTransferTable = (props: TransferTableProps) => {
  const { transferContent } = props;
  return (
    <div>
      <Table
        headers={[
          { id: "token", label: "Token" },
          { id: "id", label: "ID" },
          { id: "receiver", label: "Receiver" },
        ]}
        rows={transferContent.map((row, index) => {
          return {
            id: "" + index,
            cells: [
              { id: "token", content: <ERC20Token tokenAddress={row.tokenAddress} symbol={row.tokenName} /> },
              {
                id: "receiver",
                content: <Receiver receiverAddress={row.receiver} receiverEnsName={row.receiverEnsName} />,
              },
              { id: "id", content: <Text size="md">{row.tokenId.toString()}</Text> },
            ],
          };
        })}
      />
    </div>
  );
};
