import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, IconButton } from "@mui/material";
import { useDarkMode } from "src/hooks/useDarkMode";

import { AssetTransfer, CollectibleTransfer } from "../hooks/useCsvParser";
import AssetIconDarkMode from "../static/assets-light.svg";
import AssetIcon from "../static/assets.svg";
import NftIconDarkMode from "../static/nft-light.svg";
import NftIcon from "../static/nft.svg";

import { AssetTransferTable } from "./assets/AssetTransferTable";
import { CollectiblesTransferTable } from "./assets/CollectiblesTransferTable";

type SummaryProps = {
  assetTransfers: AssetTransfer[];
  collectibleTransfers: CollectibleTransfer[];
};

export const Summary = (props: SummaryProps): JSX.Element => {
  const { assetTransfers, collectibleTransfers } = props;
  const assetTxCount = assetTransfers.length;
  const collectibleTxCount = collectibleTransfers.length;
  const darkMode = useDarkMode();
  return (
    <Box>
      <Typography mb={2} variant="h6" fontWeight={700}>
        Summary
      </Typography>

      <Accordion disabled={assetTxCount === 0} sx={{ maxWidth: 1400, mb: 2, "&.Mui-expanded": { mb: 2 } }}>
        <AccordionSummary
          expandIcon={
            <IconButton size="small">
              <ExpandMoreIcon color="border" />
            </IconButton>
          }
          sx={{ "&.Mui-expanded": { backgroundColor: ({ palette }) => `${palette.background.paper} !important` } }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              width: "100%",
              alignItems: "center",
              justifyContent: "flex-start",
              flexDirection: "row",
            }}
          >
            <img src={darkMode ? AssetIconDarkMode : AssetIcon} alt="assets" width={26} height={26} />

            <Typography className="subtitle1" fontWeight={700}>
              Assets
            </Typography>
            <div style={{ flex: 4 }}>
              <Typography>
                {`${assetTxCount > 0 ? assetTxCount : "no"} transfer${
                  assetTxCount > 1 || assetTxCount === 0 ? "s" : ""
                }`}
              </Typography>
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          {assetTransfers.length > 0 && <AssetTransferTable transferContent={assetTransfers} />}
        </AccordionDetails>
      </Accordion>
      <Accordion disabled={collectibleTxCount === 0} sx={{ maxWidth: 1400, mb: 2, "&.Mui-expanded": { mb: 2 } }}>
        <AccordionSummary
          expandIcon={
            <IconButton size="small">
              <ExpandMoreIcon color="border" />
            </IconButton>
          }
          sx={{ "&.Mui-expanded": { backgroundColor: ({ palette }) => `${palette.background.paper} !important` } }}
        >
          <div
            style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center", justifyContent: "flex-start" }}
          >
            <img src={darkMode ? NftIconDarkMode : NftIcon} alt="nfts" width={26} height={26} />
            <Typography className="navLabel">Collectibles</Typography>
            <div style={{ flex: 4 }}>
              <Typography>
                {`${collectibleTxCount > 0 ? collectibleTxCount : "no"} transfer${
                  collectibleTxCount > 1 || collectibleTxCount === 0 ? "s" : ""
                }`}
              </Typography>
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          {collectibleTransfers.length > 0 && <CollectiblesTransferTable transferContent={collectibleTransfers} />}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
