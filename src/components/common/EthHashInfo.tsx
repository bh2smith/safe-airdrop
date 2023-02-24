import { Box, Typography } from "@mui/material";
import { ReactElement } from "react";

import Identicon from "./Identicon";

const shortenAddress = (address: string, length = 4): string => {
  if (!address) {
    return "";
  }

  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
};

type EthHashInfoProps = {
  address: string;
  chainId?: string;
  name?: string | null;
  showAvatar?: boolean;
  shortAddress?: boolean;
  hasExplorer?: boolean;
  avatarSize?: number;
};

export const EthHashInfo = ({
  address,
  shortAddress = true,
  showAvatar = true,
  avatarSize,
  hasExplorer,
}: EthHashInfoProps): ReactElement => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "0.5em",
        lineHeight: "1.4",
      }}
    >
      {showAvatar && (
        <div
          style={{
            flexShrink: 0,
          }}
        >
          <Identicon address={address} size={avatarSize} />
        </div>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: "0.25em", whiteSpace: "nowrap" }}>
        <Typography variant="body2" fontWeight="inherit">
          {shortAddress ? shortenAddress(address) : address}
        </Typography>

        {/*  TODO{hasExplorer && <ExplorerLink address={address} />} */}
      </Box>
    </Box>
  );
};
