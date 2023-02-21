import { Box, Typography } from "@mui/material";
import React, { memo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { areEqual, FixedSizeList as List } from "react-window";

import { AssetTransfer } from "../../hooks/useCsvParser";
import { Receiver } from "../Receiver";

import { ERC20Token } from "./ERC20Token";

type TransferTableProps = {
  transferContent: AssetTransfer[];
};

type RowProps = {
  index: number;
  style: any;
  data: AssetTransfer[];
};

type ListHeaderProps = {
  width: number;
};

const ListHeader = (props: ListHeaderProps) => {
  const { width } = props;
  return (
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
      <div style={{ flex: 1, padding: 16, minWidth: 144 }}>
        <Typography>Receiver</Typography>
      </div>
      <div style={{ flex: 1, padding: 16, minWidth: 80 }}>
        <Typography>Amount</Typography>
      </div>
    </div>
  );
};

const Row = memo((props: RowProps) => {
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
        <ERC20Token tokenAddress={row.tokenAddress} symbol={row.symbol} />
        <Receiver receiverAddress={row.receiver} receiverEnsName={row.receiverEnsName} />
        <div style={{ flex: "1", padding: 16, minWidth: 80 }}>
          <Typography>{row.amount}</Typography>
        </div>
      </div>
    </div>
  );
}, areEqual);

export const AssetTransferTable = (props: TransferTableProps) => {
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
