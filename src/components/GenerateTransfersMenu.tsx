import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { AddressInput, Button, ButtonLink, GenericModal, Menu, Tooltip } from "@gnosis.pm/safe-react-components";
import { Collapse } from "@material-ui/core";
import BigNumber from "bignumber.js";
import { utils } from "ethers";
import React, { useState } from "react";

import { AssetBalance, CollectibleBalance } from "../hooks/balances";
import { useEnsResolver } from "../hooks/ens";
import { networkInfo } from "../networks";
import { fromWei } from "../utils";

export interface GenerateTransfersMenuProps {
  assetBalance?: AssetBalance;
  collectibleBalance?: CollectibleBalance;
  setCsvText: (csv: string) => void;
}

export const GenerateTransfersMenu = (props: GenerateTransfersMenuProps): JSX.Element => {
  const { assetBalance, collectibleBalance, setCsvText } = props;
  const [isGenerationMenuOpen, setIsGenerationMenuOpen] = useState(false);
  const [isDrainModalOpen, setIsDrainModalOpen] = useState(false);
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
      <div className="generateMenu">
        <Menu className="leftAlignedMenu">
          <ButtonLink color="primary" iconType="add" onClick={() => setIsGenerationMenuOpen(!isGenerationMenuOpen)}>
            Generate transfers
          </ButtonLink>
        </Menu>
        <Collapse in={isGenerationMenuOpen}>
          <div className="openedGenerateMenu">
            <Tooltip title="Send all assets and collectibles from this safe">
              <ButtonLink color="primary" iconType="exportImg" iconSize="sm" onClick={() => setIsDrainModalOpen(true)}>
                Drain safe
              </ButtonLink>
            </Tooltip>
          </div>
        </Collapse>
      </div>
      {isDrainModalOpen && (
        <GenericModal
          onClose={() => setIsDrainModalOpen(false)}
          title="Enter an address to send all assets to"
          body={
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
          }
          footer={
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                size="md"
                color="primary"
                onClick={() => {
                  generateDrainTransfers();
                  setIsDrainModalOpen(false);
                  setIsGenerationMenuOpen(false);
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
    </>
  );
};
