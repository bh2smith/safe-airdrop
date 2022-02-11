import { RowValidateCallback } from "@fast-csv/parse";
import { utils } from "ethers";

import { AssetTransfer, CollectibleTransfer, Transfer, UnknownTransfer } from "./csvParser";

export const validateRow = (row: Transfer | UnknownTransfer, callback: RowValidateCallback) => {
  switch (row.token_type) {
    case "erc20":
    case "native":
      validateAssetRow(row, callback);
      break;
    case "erc1155":
    case "erc721":
      validateCollectibleRow(row, callback);
      break;
    default:
      callback(null, false, "Unknown token_type: Must be one of erc20, native or nft");
  }
};

/**
 * Validates, that addresses are valid, the amount is big enough and a decimal is given or can be found in token lists.
 */
export const validateAssetRow = (row: AssetTransfer, callback: RowValidateCallback) => {
  const warnings = [...areAddressesValid(row), ...isAmountPositive(row), ...isAssetTokenValid(row)];
  callback(null, warnings.length === 0, warnings.join(";"));
};

export const validateCollectibleRow = (row: CollectibleTransfer, callback: RowValidateCallback) => {
  const warnings = [
    ...areAddressesValid(row),
    ...isTokenIdPositive(row),
    ...isCollectibleTokenValid(row),
    ...isTokenValueValid(row),
    ...isTokenValueInteger(row),
    ...isTokenIdInteger(row),
  ];
  callback(null, warnings.length === 0, warnings.join(";"));
};

const areAddressesValid = (row: Transfer): string[] => {
  const warnings: string[] = [];
  if (!(row.tokenAddress === null || utils.isAddress(row.tokenAddress))) {
    warnings.push(`Invalid Token Address: ${row.tokenAddress}`);
  }
  if (row.receiver.includes(":")) {
    warnings.push(`The chain prefix must match the current network: ${row.receiver}`);
  } else {
    if (!utils.isAddress(row.receiver)) {
      warnings.push(`Invalid Receiver Address: ${row.receiver}`);
    }
  }
  return warnings;
};

const isAmountPositive = (row: AssetTransfer): string[] =>
  row.amount.isGreaterThan(0) ? [] : ["Only positive amounts/values possible: " + row.amount.toFixed()];

const isAssetTokenValid = (row: AssetTransfer): string[] =>
  row.decimals === -1 && row.symbol === "TOKEN_NOT_FOUND" ? [`No token contract was found at ${row.tokenAddress}`] : [];

const isCollectibleTokenValid = (row: CollectibleTransfer): string[] =>
  row.tokenName === "TOKEN_NOT_FOUND" ? [`No token contract was found at ${row.tokenAddress}`] : [];

const isTokenIdPositive = (row: CollectibleTransfer): string[] =>
  row.tokenId.isGreaterThan(0) ? [] : [`Only positive Token IDs possible: ${row.tokenId.toFixed()}`];

const isTokenIdInteger = (row: CollectibleTransfer): string[] =>
  row.tokenId.isInteger() ? [] : [`Token IDs must be integer numbers: ${row.tokenId.toFixed()}`];

const isTokenValueInteger = (row: CollectibleTransfer): string[] =>
  !row.amount || row.amount.isNaN() || row.amount.isInteger()
    ? []
    : [`Value of ERC1155 must be an integer: ${row.amount.toFixed()}`];

const isTokenValueValid = (row: CollectibleTransfer): string[] =>
  row.token_type === "erc721" || (typeof row.amount !== "undefined" && row.amount.isGreaterThan(0))
    ? []
    : [`ERC1155 Tokens need a defined value > 0: ${row.amount?.toFixed()}`];
