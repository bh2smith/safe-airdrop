import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Breadcrumb, BreadcrumbElement, ButtonLink, Tooltip } from "@gnosis.pm/safe-react-components";
import { useState } from "react";
import { useGetAssetBalanceQuery, useGetNFTBalanceQuery } from "src/stores/api/balanceApi";
import styled from "styled-components";

import { NETWORKS_WITH_DONATIONS_DEPLOYED } from "../networks";

import { DonateDialog } from "./DonateDialog";
import { DrainSafeDialog } from "./DrainSafeDialog";

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

export const GenerateTransfersMenu = () => {
  const assetBalanceQuery = useGetAssetBalanceQuery();
  const nftBalanceQuery = useGetNFTBalanceQuery();

  const assetBalance = assetBalanceQuery.currentData;
  const nftBalance = nftBalanceQuery.currentData;

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
