import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { GenericModal, AddressInput, Button, Icon } from "@gnosis.pm/safe-react-components";
import { Typography } from "@material-ui/core";
import BigNumber from "bignumber.js";
import { utils } from "ethers";
import { useState } from "react";
import { useCollectibleTokenInfoProvider } from "src/hooks/collectibleTokenInfoProvider";
import { useEnsResolver } from "src/hooks/ens";
import { useTokenInfoProvider } from "src/hooks/token";
import { networkInfo } from "src/networks";
import { AssetBalance, NFTBalance } from "src/stores/api/balanceApi";
import { updateCsvContent } from "src/stores/slices/csvEditorSlice";
import { useAppDispatch } from "src/stores/store";
import { fromWei } from "src/utils";

export const DrainSafeDialog = ({
  isOpen,
  onClose,
  assetBalance,
  nftBalance,
}: {
  isOpen: boolean;
  onClose: () => void;
  assetBalance: AssetBalance;
  nftBalance: NFTBalance;
}) => {
  const [drainAddress, setDrainAddress] = useState("");
  const { safe } = useSafeAppsSDK();

  const collectibleTokenInfoProvider = useCollectibleTokenInfoProvider();
  const tokenInfoProvider = useTokenInfoProvider();

  const dispatch = useAppDispatch();

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

      nftBalance?.forEach((collectible) => {
        drainCSV += `\nnft,${collectible.address},${drainAddress},,${collectible.id}`;
      });
    }
    dispatch(updateCsvContent({ csvContent: drainCSV, tokenInfoProvider, collectibleTokenInfoProvider, ensResolver }));
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
