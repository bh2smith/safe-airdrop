import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import {
  AddressInput,
  Breadcrumb,
  BreadcrumbElement,
  Button,
  ButtonLink,
  GenericModal,
  Tooltip,
} from "@gnosis.pm/safe-react-components";
import { Typography } from "@material-ui/core";
import BigNumber from "bignumber.js";
import { utils } from "ethers";
import React, { useState } from "react";
import styled from "styled-components";

import { AssetBalance, CollectibleBalance } from "../hooks/balances";
import { useEnsResolver } from "../hooks/ens";
import { networkInfo } from "../networks";
import { fromWei } from "../utils";

import { DonateDialog } from "./DonateDialog";

export interface GenerateTransfersMenuProps {
  assetBalance?: AssetBalance;
  collectibleBalance?: CollectibleBalance;
  setCsvText: (csv: string) => void;
  csvText: string;
}

const GenerateHeader = styled(Breadcrumb)`
  padding: 8px 0px;
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

  const [drainAddress, setDrainAddress] = useState("");
  const { safe } = useSafeAppsSDK();

  const ensResolver = useEnsResolver();

  const selectedNetworkInfo = networkInfo.get(safe.chainId);

  const invalidNetworkError = drainAddress.includes(":") ? "The chain prefix must match the current network" : "";
  const invalidAddressError = utils.isAddress(drainAddress) ? "" : "The address is invalid";
  const error = drainAddress ? invalidNetworkError || invalidAddressError : "";

  const generateDrainTransfers = () => {
    let drainCSV = "token_type,token_address,receiver,amount,id,";
    if (drainAddress) {
      assetBalance?.forEach((asset) => {
        if (asset.token === null && asset.tokenAddress === null) {
          const decimalBalance = fromWei(new BigNumber(asset.balance), 18);
          // The API returns zero balances for the native token.
          if (!decimalBalance.isZero()) {
            drainCSV += `\nnative,,${drainAddress},${decimalBalance},`;
          }
        } else {
          const tokenDecimals = asset.token?.decimals;
          if (tokenDecimals) {
            drainCSV += `\nerc20,${asset.tokenAddress},${drainAddress},${fromWei(
              new BigNumber(asset.balance),
              tokenDecimals,
            )},`;
          }
        }
      });

      collectibleBalance?.forEach((collectible) => {
        drainCSV += `\nnft,${collectible.address},${drainAddress},,${collectible.id}`;
      });
    }
    setCsvText(drainCSV);
  };
  return (
    <>
      <div style={{ position: "relative", paddingLeft: "8px" }}>
        <div
          style={{
            borderLeft: "1px solid  #008C73",
            borderRadius: "4px",
            width: "10px",
            height: "45%",
            position: "absolute",
            borderBottomLeftRadius: "0px",
            top: 0,
            left: 0,
          }}
        />
        <div
          style={{
            borderLeft: "1px solid #008C73",
            borderRadius: "4px",
            width: "10px",
            height: "45%",
            position: "absolute",
            bottom: 0,
            left: 0,
            borderTopLeftRadius: "0px",
          }}
        />
        <GenerateHeader>
          <BreadcrumbElement text="Generate" iconType="add" />
          <BreadcrumbElement text="Transfers" color="placeHolder" />
        </GenerateHeader>
        <div>
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
        </div>
      </div>
      {isDrainModalOpen && (
        <GenericModal
          onClose={() => setIsDrainModalOpen(false)}
          title="Transfer all funds"
          body={
            <>
              <Typography>
                Select an address to transfer all funds to. These funds include all ERC20, ERC721 and native tokens.
                <strong>This will replace the entire CSV file.</strong>
              </Typography>

              <AddressInput
                address={drainAddress}
                hiddenLabel
                label="Address"
                name="address"
                error={error}
                getAddressFromDomain={(name) => ensResolver.resolveName(name).then((address) => address ?? name)}
                onChangeAddress={setDrainAddress}
                placeholder="Ethereum address"
                showNetworkPrefix={true}
                networkPrefix={selectedNetworkInfo?.shortName}
              />
            </>
          }
          footer={
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                size="md"
                color="primary"
                onClick={() => {
                  generateDrainTransfers();
                  setIsDrainModalOpen(false);
                }}
              >
                Submit
              </Button>
              <Button size="md" color="secondary" onClick={() => setIsDrainModalOpen(false)}>
                Abort
              </Button>
            </div>
          }
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
