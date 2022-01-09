import { AddressInput, Button, ButtonLink, GenericModal, Menu, Tooltip } from "@gnosis.pm/safe-react-components";
import { Collapse } from "@material-ui/core";
import BigNumber from "bignumber.js";
import React, { useState } from "react";

import { AssetBalance, CollectibleBalance } from "../hooks/balances";
import { useEnsResolver } from "../hooks/ens";
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

  const ensResolver = useEnsResolver();

  const generateDrainTransfers = () => {
    let drainCSV = "token_type,token_address,receiver,value,id,";
    if (drainAddress) {
      assetBalance?.forEach((asset) => {
        if (asset.token === null && asset.tokenAddress === null) {
          drainCSV += `\nnative,,${drainAddress},${fromWei(new BigNumber(asset.balance), 18)},`;
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
              error=""
              hiddenLabel
              label="Address"
              name="address"
              getAddressFromDomain={(name) => ensResolver.resolveName(name).then((address) => address ?? name)}
              onChangeAddress={setDrainAddress}
              placeholder="Ethereum address"
              showNetworkPrefix={false}
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
