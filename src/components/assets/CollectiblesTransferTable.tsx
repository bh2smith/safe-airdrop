import { Table, Text } from "@gnosis.pm/safe-react-components";
import React from "react";

import { CollectibleTransfer } from "../../parser/csvParser";
import { Receiver } from "../Receiver";

import { ERC721Token } from "./ERC721Token";

type TransferTableProps = {
  transferContent: CollectibleTransfer[];
};

export const CollectiblesTransferTable = (props: TransferTableProps) => {
  const { transferContent } = props;
  return (
    <div style={{ flex: "1" }}>
      <Table
        isStickyHeader={true}
        maxHeight={500}
        headers={[
          { id: "token", label: "Token" },
          { id: "type", label: "Type" },
          { id: "receiver", label: "Receiver" },
          { id: "value", label: "Value" },
          { id: "id", label: "ID" },
        ]}
        rows={transferContent.map((row, index) => {
          return {
            id: "" + index,
            cells: [
              {
                id: "token",
                content: (
                  <ERC721Token
                    tokenAddress={row.tokenAddress}
                    id={row.tokenId}
                    token_type={row.token_type}
                    hasMetaData={row.hasMetaData}
                  />
                ),
              },
              { id: "type", content: row.token_type.toUpperCase() },
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
