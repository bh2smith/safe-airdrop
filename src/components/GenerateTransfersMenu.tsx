import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Breadcrumb, BreadcrumbElement, ButtonLink, Tooltip } from "@gnosis.pm/safe-react-components";
import { useState } from "react";
import styled from "styled-components";

import { AssetBalance, CollectibleBalance } from "../hooks/balances";
import { NETWORKS_WITH_DONATIONS_DEPLOYED } from "../networks";

import { DonateDialog } from "./DonateDialog";
import { DrainSafeDialog } from "./DrainSafeDialog";

export interface GenerateTransfersMenuProps {
  assetBalance?: AssetBalance;
  collectibleBalance?: CollectibleBalance;
  setCsvText: (csv: string) => void;
  csvText: string;
}

const GenerateHeader = styled(Breadcrumb)`
  padding: 0px 0px 8px 0px;
`;

const GenerateMenuButton = styled(ButtonLink)`
  background-color: rgb(246, 247, 248);
  border-radius: 4px;
  margin-bottom: 4px;
  min-width: 100px;
  &:hover {
    background-color: rgb(239, 250, 248);
  }
`;

export const GenerateTransfersMenu = (props: GenerateTransfersMenuProps) => {
  const { assetBalance, collectibleBalance, setCsvText, csvText } = props;
  const [isDrainModalOpen, setIsDrainModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  const { safe } = useSafeAppsSDK();

  const isDonationAvailable = NETWORKS_WITH_DONATIONS_DEPLOYED.includes(safe.chainId);

  return (
    <>
      <div style={{ position: "relative", borderLeft: "thin solid #008C73" }}>
        <GenerateHeader>
          <BreadcrumbElement text="Generate" iconType="add" />
          <BreadcrumbElement text="Transfers" color="placeHolder" />
        </GenerateHeader>
        <div style={{ marginLeft: "5px" }}>
          <Tooltip title="Send all assets and collectibles from this safe">
            <GenerateMenuButton
              color="primary"
              iconType="exportImg"
              iconSize="sm"
              onClick={() => setIsDrainModalOpen(true)}
            >
              Drain safe
            </GenerateMenuButton>
          </Tooltip>
          {isDonationAvailable && (
            <Tooltip title="Select a token and amount to donate to this Safe app">
              <GenerateMenuButton
                color="primary"
                iconType="gift"
                iconSize="sm"
                onClick={() => setIsDonateModalOpen(true)}
              >
                Donate
              </GenerateMenuButton>
            </Tooltip>
          )}
        </div>
      </div>
      {assetBalance && collectibleBalance && (
        <DrainSafeDialog
          assetBalance={assetBalance}
          collectibleBalance={collectibleBalance}
          onClose={() => setIsDrainModalOpen(false)}
          onSubmit={(drainCsv) => setCsvText(drainCsv)}
          isOpen={isDrainModalOpen}
        />
      )}
      {assetBalance && (
        <DonateDialog
          assetBalance={assetBalance}
          isOpen={isDonateModalOpen}
          onClose={() => setIsDonateModalOpen(false)}
          onSubmit={(updatedCSV) => setCsvText(updatedCSV)}
          csvText={csvText}
        />
      )}
    </>
  );
};
