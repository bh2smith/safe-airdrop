import { isAddress } from "@ethersproject/address";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { ethers, utils } from "ethers";
import { useState } from "react";
import { useCurrentChain } from "src/hooks/useCurrentChain";
import { useEnsResolver } from "src/hooks/useEnsResolver";
import { AssetBalance } from "src/stores/slices/assetBalanceSlice";
import { NFTBalance } from "src/stores/slices/collectiblesSlice";
import { updateCsvContent } from "src/stores/slices/csvEditorSlice";
import { useAppDispatch } from "src/stores/store";

export const DrainSafeDialog = ({
  isOpen,
  onClose,
  assetBalance,
  nftBalance,
}: {
  isOpen: boolean;
  onClose: () => void;
  assetBalance: AssetBalance;
  nftBalance: NFTBalance["results"];
}) => {
  const [drainAddress, setDrainAddress] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");

  const [resolving, setResolving] = useState(false);

  const dispatch = useAppDispatch();

  const selectedNetworkInfo = useCurrentChain();
  const ensResolver = useEnsResolver();

  const invalidNetworkError = resolvedAddress.includes(":")
    ? `The chain prefix must match the current network: ${selectedNetworkInfo?.shortName}`
    : undefined;

  const invalidAddressError = utils.isAddress(resolvedAddress) ? undefined : "The address is invalid";
  const error = drainAddress ? invalidNetworkError || invalidAddressError : undefined;

  const generateDrainTransfers = () => {
    let drainCSV = "token_type,token_address,receiver,amount,id";
    if (drainAddress) {
      assetBalance?.forEach((asset) => {
        if (asset.token === null && asset.tokenAddress === null) {
          const decimalBalance = ethers.utils.parseUnits(asset.balance, 18);
          // The API returns zero balances for the native token.
          if (!decimalBalance.isZero()) {
            drainCSV += `\nnative,,${drainAddress},${decimalBalance},`;
          }
        } else {
          const tokenDecimals = asset.token?.decimals;
          if (tokenDecimals) {
            drainCSV += `\nerc20,${asset.tokenAddress},${drainAddress},${ethers.utils.parseUnits(
              asset.balance,
              tokenDecimals,
            )},`;
          }
        }
      });

      nftBalance.forEach((collectible) => {
        drainCSV += `\nnft,${collectible.address},${drainAddress},,${collectible.id}`;
      });
    }
    dispatch(updateCsvContent({ csvContent: drainCSV }));
  };

  const onAddressChanged: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = async (event) => {
    const newAddress = event.target.value;
    setDrainAddress(newAddress);
    const addressWithoutPrefix =
      selectedNetworkInfo && newAddress.startsWith(`${selectedNetworkInfo.shortName}:`)
        ? newAddress.slice(selectedNetworkInfo.shortName.length + 1)
        : newAddress;

    if (isAddress(addressWithoutPrefix)) {
      setResolvedAddress(addressWithoutPrefix);
    } else {
      setResolving(true);
      const resolvedAddress = await ensResolver.resolveName(addressWithoutPrefix).catch(() => null);
      setResolvedAddress(resolvedAddress || addressWithoutPrefix);
      setResolving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog onClose={onClose} open sx={{ padding: 3 }}>
      <DialogTitle>Transfer all funds</DialogTitle>
      <DialogContent>
        <Box>
          <Typography style={{ marginBottom: "16px" }}>
            Select an address to transfer all funds to. These funds include all ERC20, ERC721 and native tokens.
          </Typography>
          <Typography mb={2} variant="subtitle1" fontWeight={700} display="flex" alignItems="center">
            <WarningIcon /> This will replace the entire CSV file.
          </Typography>

          <TextField
            fullWidth
            onChange={onAddressChanged}
            value={drainAddress}
            variant="outlined"
            placeholder="Address or ENS"
            InputProps={{
              endAdornment: resolving ? (
                <InputAdornment position="end">
                  <CircularProgress />
                </InputAdornment>
              ) : !error ? (
                <InputAdornment position="end">
                  <CheckCircleRoundedIcon color="primary" />
                </InputAdornment>
              ) : undefined,
            }}
            error={!!error}
            helperText={error}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
          <Button color="primary" onClick={onClose}>
            Abort
          </Button>
          <Button
            disabled={!!error || drainAddress === ""}
            variant="contained"
            color="primary"
            onClick={() => {
              generateDrainTransfers();
              onClose();
            }}
          >
            Submit
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};
