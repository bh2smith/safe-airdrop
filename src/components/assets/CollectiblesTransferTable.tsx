import { Box, Typography } from "@mui/material";
import React, { memo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { areEqual, FixedSizeList as List } from "react-window";

import { CollectibleTransfer } from "../../hooks/useCsvParser";
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
        <div style={{ flex: 1, padding: 16, minWidth: 144 }}>
          <Typography>Token</Typography>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 80 }}>
          <Typography>Type</Typography>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 144 }}>
          <Typography>Receiver</Typography>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 80 }}>
          <Typography>Value</Typography>
        </div>
        <div style={{ flex: 1, padding: 16, minWidth: 80 }}>
          <Typography>Id</Typography>
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
        <ERC721Token tokenAddress={row.tokenAddress} id={row.tokenId} token_type={row.token_type} />
        <div style={{ flex: "1", padding: 16, minWidth: 80 }}>
          <Typography>{row.token_type.toUpperCase()}</Typography>
        </div>
        <Receiver receiverAddress={row.receiver} receiverEnsName={row.receiverEnsName} />
        <div style={{ flex: "1", padding: 16, minWidth: 80 }}>
          <Typography>{row.amount}</Typography>
        </div>
        <div style={{ flex: "1", padding: 16, minWidth: 80 }}>
          <Typography>{row.tokenId}</Typography>
        </div>
      </div>
    </div>
  );
}, areEqual);

export const CollectiblesTransferTable = (props: TransferTableProps) => {
  const { transferContent } = props;
  return (
    <Box
      sx={{
        border: ({ palette }) => `1px solid ${palette.border.main}`,
      }}
    >
      <AutoSizer disableHeight>
        {({ width }) => (
          <>
            <ListHeader width={width} />
            <List
              height={Math.min(460, transferContent.length * 64)}
              itemCount={transferContent.length}
              itemSize={64}
              width={width}
              itemData={transferContent}
            >
              {Row}
            </List>
          </>
        )}
      </AutoSizer>
    </Box>
  );
};
