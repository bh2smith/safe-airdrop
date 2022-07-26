import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { GenericModal, AddressInput, Button, Icon } from "@gnosis.pm/safe-react-components";
import { Typography } from "@material-ui/core";
import BigNumber from "bignumber.js";
import { utils } from "ethers";
import { useState } from "react";
import { AssetBalance, CollectibleBalance } from "src/hooks/balances";
import { useEnsResolver } from "src/hooks/ens";
import { networkInfo } from "src/networks";
import { fromWei } from "src/utils";

export const DrainSafeDialog = ({
  onSubmit,
  isOpen,
  onClose,
  assetBalance,
  collectibleBalance,
}: {
  onSubmit: (csvText: string) => void;
  isOpen: boolean;
  onClose: () => void;
  assetBalance: AssetBalance;
  collectibleBalance: CollectibleBalance;
}) => {
  const [drainAddress, setDrainAddress] = useState("");
  const { safe } = useSafeAppsSDK();

  const selectedNetworkInfo = networkInfo.get(safe.chainId);

  const ensResolver = useEnsResolver();

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
    onSubmit(drainCSV);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <GenericModal
      onClose={onClose}
      title="Transfer all funds"
      body={
        <>
          <Typography style={{ marginBottom: "16px" }}>
            Select an address to transfer all funds to. These funds include all ERC20, ERC721 and native tokens.
            <br />
            <strong>
              <Icon size="sm" type="alert" color="warning" />
              This will replace the entire CSV file.
            </strong>
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
              onClose();
            }}
          >
            Submit
          </Button>
          <Button size="md" color="secondary" onClick={onClose}>
            Abort
          </Button>
        </div>
      }
    />
  );
};
