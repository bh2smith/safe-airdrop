import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { GenericModal, Button, Select, TextFieldInput, Icon } from "@gnosis.pm/safe-react-components";
import { InputAdornment, Typography } from "@material-ui/core";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { AssetBalance } from "src/hooks/balances";
import { networkInfo } from "src/networks";
import { DONATION_ADDRESS } from "src/utils";

export const DonateDialog = ({
  onSubmit,
  isOpen,
  onClose,
  assetBalance,
  csvText,
}: {
  onSubmit: (donationRow: string) => void;
  isOpen: boolean;
  onClose: () => void;
  assetBalance: AssetBalance;
  csvText: string;
}) => {
  const { safe } = useSafeAppsSDK();
  const nativeSymbol = networkInfo.get(safe.chainId)?.currencySymbol || "ETH";

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
      const headerRow = csvText.split(/\r\n|\r|\n/)[0];
      const donationCSVRow = headerRow
        .replace("token_type", "erc20")
        .replace("token_address", selectedToken === "0x0" ? "" : selectedToken)
        .replace("receiver", DONATION_ADDRESS)
        .replace("amount", selectedAmount)
        .replace("id", "");

      onSubmit(`${csvText}\n${donationCSVRow}`);
      onClose();
    }
  };

  if (!isOpen || items.length === 0) {
    return null;
  }
  return (
    <GenericModal
      onClose={onClose}
      title="Donate to project"
      body={
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Typography>
            Select an asset and amount. The resulting transaction will be appended to the end of the current CSV.
          </Typography>
          <Select
            activeItemId={selectedToken || items[0].id}
            items={items}
            name={"Token"}
            label={"The token you want to donate"}
            onItemClick={setSelectedToken}
          />
          <TextFieldInput
            id="amount"
            label="Amount"
            name="amount"
            error={amountError}
            disabled={typeof selectedToken === "undefined"}
            value={selectedAmount}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon size="md" type="assets" />
                </InputAdornment>
              ),
            }}
            onChange={(e) => setSelectedAmount(e.target.value)}
          />
        </div>
      }
      footer={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            size="md"
            color="primary"
            onClick={handleSubmit}
            disabled={Boolean(amountError) || !Boolean(selectedToken) || !Boolean(selectedAmount)}
          >
            Add to CSV
          </Button>
          <Button size="md" color="secondary" onClick={onClose}>
            Abort
          </Button>
        </div>
      }
    />
  );
};
