import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { useCsvContent } from "src/hooks/useCsvContent";
import { useCurrentChain } from "src/hooks/useCurrentChain";
import { useDarkMode } from "src/hooks/useDarkMode";
import { AssetBalance } from "src/stores/slices/assetBalanceSlice";
import { updateCsvContent } from "src/stores/slices/csvEditorSlice";
import { useAppDispatch } from "src/stores/store";
import { DONATION_ADDRESS } from "src/utils";

import AssetIconDarkMode from "../static/assets-light.svg";
import AssetIcon from "../static/assets.svg";

export const DonateDialog = ({
  isOpen,
  onClose,
  assetBalance,
}: {
  isOpen: boolean;
  onClose: () => void;
  assetBalance: AssetBalance;
}) => {
  const dispatch = useAppDispatch();
  const csvContent = useCsvContent();
  const darkMode = useDarkMode();
  const chainConfig = useCurrentChain();
  const nativeSymbol = chainConfig?.currencySymbol || "ETH";

  const items = assetBalance?.map((asset) => ({
    id: asset.tokenAddress || "0x0",
    label: asset.token?.name || nativeSymbol,
    subLabel: `${ethers.utils.formatUnits(asset.balance, asset.decimals)} ${asset.token?.symbol || nativeSymbol}`,
  }));
  const [selectedToken, setSelectedToken] = useState<string | undefined>(
    items && items.length > 0 ? items[0].id : undefined,
  );
  const [selectedAmount, setSelectedAmount] = useState<string>("0");
  const [amountError, setAmountError] = useState<string>();

  useEffect(() => {
    try {
      if (typeof selectedAmount === "undefined") {
        setAmountError(undefined);
        return;
      }
      const selectedBalance = assetBalance?.find(
        (asset) => asset.tokenAddress === selectedToken || (selectedToken === "0x0" && asset.tokenAddress === null),
      );
      if (!selectedBalance) {
        setAmountError("Select an asset with balance > 0");
        return;
      }

      if (
        BigNumber.from(selectedBalance.balance).lt(
          ethers.utils.parseUnits(Number(selectedAmount).toString(), selectedBalance.decimals),
        )
      ) {
        setAmountError("Balance of selected asset too low");
        return;
      } else {
        setAmountError(undefined);
      }
    } catch (error) {
      console.error(error);
      setAmountError("Amount must be a number");
    }
  }, [selectedAmount, selectedToken, assetBalance]);

  const handleSubmit = () => {
    if (selectedToken && selectedAmount) {
      const headerRow = csvContent.split(/\r\n|\r|\n/)[0];
      const donationCSVRow = headerRow
        .replace("token_type", "erc20")
        .replace("token_address", selectedToken === "0x0" ? "" : selectedToken)
        .replace("receiver", DONATION_ADDRESS)
        .replace("amount", selectedAmount)
        .replace("value", selectedAmount)
        .replace("id", "");

      dispatch(
        updateCsvContent({
          csvContent: `${csvContent}\n${donationCSVRow}`,
        }),
      );
      onClose();
    }
  };

  if (!isOpen || items.length === 0) {
    return null;
  }
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Donate</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography>
            Select an asset and amount. The resulting transaction will be appended to the end of the current CSV.
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="token">Select token</InputLabel>
            <Select
              labelId="token"
              value={selectedToken || items[0].id}
              name="Token"
              label="Select token"
              onChange={(event) => setSelectedToken(event.target.value)}
            >
              {items.map((item) => (
                <MenuItem value={item.id}>
                  <Box>
                    <Typography>{item.label}</Typography>
                    <Typography variant="caption">{item.subLabel}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            id="amount"
            label="Amount"
            name="amount"
            error={!!amountError}
            helperText={amountError}
            disabled={typeof selectedToken === "undefined"}
            value={selectedAmount}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <img src={darkMode ? AssetIconDarkMode : AssetIcon} alt="" width="24px" height="24px" />
                </InputAdornment>
              ),
            }}
            onChange={(e) => setSelectedAmount(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
          <Button color="primary" onClick={onClose}>
            Abort
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={Boolean(amountError) || !Boolean(selectedToken) || !Boolean(Number(selectedAmount))}
          >
            Add to CSV
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};
