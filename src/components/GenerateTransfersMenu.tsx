import { Box, Button, Tooltip } from "@mui/material";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useState } from "react";
import { selectAssetBalances } from "src/stores/slices/assetBalanceSlice";
import { selectCollectibles } from "src/stores/slices/collectiblesSlice";
import { useAppSelector } from "src/stores/store";

import { NETWORKS_WITH_DONATIONS_DEPLOYED } from "../networks";

import { DonateDialog } from "./DonateDialog";
import { DrainSafeDialog } from "./DrainSafeDialog";

export const GenerateTransfersMenu = () => {
  const assetBalance = useAppSelector(selectAssetBalances);
  const nftBalance = useAppSelector(selectCollectibles);

  const [isDrainModalOpen, setIsDrainModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  const { safe } = useSafeAppsSDK();

  const isDonationAvailable = NETWORKS_WITH_DONATIONS_DEPLOYED.includes(safe.chainId);

  return (
    <>
      <Box display="flex" gap={3}>
        {isDonationAvailable && (
          <Tooltip title="Select a token and amount to donate to this Safe app">
            <Button size="stretched" variant="outlined" color="primary" onClick={() => setIsDonateModalOpen(true)}>
              Donate
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Send all assets and collectibles from this safe">
          <Button size="stretched" variant="contained" color="primary" onClick={() => setIsDrainModalOpen(true)}>
            Drain safe
          </Button>
        </Tooltip>
      </Box>
      {nftBalance && assetBalance && (
        <DrainSafeDialog
          assetBalance={assetBalance}
          nftBalance={nftBalance}
          onClose={() => setIsDrainModalOpen(false)}
          isOpen={isDrainModalOpen}
        />
      )}
      {assetBalance && (
        <DonateDialog
          assetBalance={assetBalance}
          isOpen={isDonateModalOpen}
          onClose={() => setIsDonateModalOpen(false)}
        />
      )}
    </>
  );
};
