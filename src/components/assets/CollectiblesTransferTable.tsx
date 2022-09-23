import { Text } from "@gnosis.pm/safe-react-components";
import React, { memo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { areEqual, FixedSizeList as List } from "react-window";

import { CollectibleTransfer } from "../../parser/csvParser";
import { Receiver } from "../Receiver";

import { ERC721Token } from "./ERC721Token";

type TransferTableProps = {
  transferContent: CollectibleTransfer[];
};

type RowProps = {
  index: number;
  style: any;
  data: CollectibleTransfer[];
};

type ListHeaderProps = {
  width: number;
};

export const ListHeader = (props: ListHeaderProps) => {
  const { width } = props;
  return (
    <>
      <div
        style={{
          width,
          height: 60,
          display: "flex",
          flexDirection: "row",
          borderBottom: "1px solid rgba(224, 224, 224, 1)",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, padding: 16, minWidth: 285 }}>
          <Text size="lg">Token</Text>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 80 }}>
          <Text size="lg">Type</Text>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 285 }}>
          <Text size="lg">Receiver</Text>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 80 }}>
          <Text size="lg">Value</Text>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 80 }}>
          <Text size="lg">Id</Text>
        </div>
      </div>
    </>
  );
};

export const Row = memo((props: RowProps) => {
  const { index, style, data } = props;
  const row = data[index];
  return (
    <div style={style}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          borderBottom: "1px solid rgba(224, 224, 224, 1)",
          alignItems: "center",
        }}
      >
        <ERC721Token
          tokenAddress={row.tokenAddress}
          id={row.tokenId}
          token_type={row.token_type}
          hasMetaData={row.hasMetaData}
        />
        <div style={{ flex: "1", padding: 16, minWidth: 80 }}>
          <Text size="md">{row.token_type.toUpperCase()}</Text>
        </div>
        <Receiver receiverAddress={row.receiver} receiverEnsName={row.receiverEnsName} />
        <div style={{ flex: "1", padding: 16, minWidth: 80 }}>
          <Text size="md">{row.amount?.toString()}</Text>
        </div>
        <div style={{ flex: "1", padding: 16, minWidth: 80 }}>
          <Text size="md">{row.tokenId.toString()}</Text>
        </div>
      </div>
    </div>
  );
}, areEqual);

export const CollectiblesTransferTable = (props: TransferTableProps) => {
  const { transferContent } = props;
  return (
    <div
      style={{
        flex: 1,
        boxShadow:
          "rgb(247, 245, 245) 0px 3px 3px -2px, rgb(247, 245, 245) 0px 3px 4px 0px, rgb(247, 245, 245) 0px 1px 8px 0px",
      }}
    >
      <AutoSizer disableHeight>
        {({ width }) => (
          <>
            <ListHeader width={width} />
            <List
              height={Math.min(460, transferContent.length * 55)}
              itemCount={transferContent.length}
              itemSize={55}
              width={width}
              itemData={transferContent}
            >
              {Row}
            </List>
          </>
        )}
      </AutoSizer>
    </div>
  );
};
