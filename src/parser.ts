import { parseString, RowTransformCallback, RowValidateCallback } from "@fast-csv/parse";
import { BigNumber } from "bignumber.js";
import { utils } from "ethers";

import { CodeWarning } from "./contexts/MessageContextProvider";
import { TokenInfoProvider } from "./hooks/token";

/**
 * Includes methods to parse, transform and validate csv content
 */

export interface Payment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string | null;
  decimals: number;
  symbol: string;
}

export type CSVRow = {
  receiver: string;
  amount: string;
  token_address: string;
  decimals?: string;
};

export interface PrePayment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string | null;
}

const generateWarnings = (
  // We need the row parameter because of the api of fast-csv
  _row: Payment,
  rowNumber: number,
  warnings: string,
) => {
  const messages: CodeWarning[] = warnings.split(";").map((warning: string) => ({
    message: warning,
    severity: "warning",
    lineNo: rowNumber,
  }));
  return messages;
};

export const parseCSV = (
  csvText: string,
  tokenInfoProvider: TokenInfoProvider,
): Promise<[Payment[], CodeWarning[]]> => {
  return new Promise<[Payment[], CodeWarning[]]>((resolve, reject) => {
    const results: any[] = [];
    const resultingWarnings: CodeWarning[] = [];
    parseString<CSVRow, Payment>(csvText, { headers: true })
      .transform((row: CSVRow, callback) => transformRow(row, tokenInfoProvider, callback))
      .validate((row: Payment, callback: RowValidateCallback) => validateRow(row, callback))
      .on("data", (data) => results.push(data))
      .on("end", () => resolve([results, resultingWarnings]))
      .on("data-invalid", (row: Payment, rowNumber: number, warnings: string) =>
        resultingWarnings.push(...generateWarnings(row, rowNumber, warnings)),
      )
      .on("error", (error) => reject(error));
  });
};

/**
 * Transforms each row into a payment object.
 */
const transformRow = (
  row: CSVRow,
  tokenInfoProvider: TokenInfoProvider,
  callback: RowTransformCallback<Payment>,
): void => {
  const prePayment: PrePayment = {
    // avoids errors from getAddress. Invalid addresses are later caught in validateRow
    tokenAddress:
      row.token_address === "" || row.token_address === null
        ? null
        : utils.isAddress(row.token_address)
        ? utils.getAddress(row.token_address)
        : row.token_address,
    amount: new BigNumber(row.amount),
    receiver: utils.isAddress(row.receiver) ? utils.getAddress(row.receiver) : row.receiver,
  };
  toPayment(prePayment, tokenInfoProvider)
    .then((row) => callback(null, row))
    .catch((reason) => callback(reason));
};

/**
 * Validates, that addresses are valid, the amount is big enough and a decimal is given or can be found in token lists.
 */
const validateRow = (row: Payment, callback: RowValidateCallback) => {
  const warnings = [...areAddressesValid(row), ...isAmountPositive(row), ...isTokenValid(row)];
  callback(null, warnings.length === 0, warnings.join(";"));
};

const areAddressesValid = (row: Payment): string[] => {
  const warnings: string[] = [];
  if (!(row.tokenAddress === null || utils.isAddress(row.tokenAddress))) {
    warnings.push("Invalid Token Address: " + row.tokenAddress);
  }
  if (!utils.isAddress(row.receiver)) {
    warnings.push("Invalid Receiver Address: " + row.receiver);
  }
  return warnings;
};

const isAmountPositive = (row: Payment): string[] =>
  row.amount.isGreaterThan(0) ? [] : ["Only positive amounts possible: " + row.amount.toFixed()];

const isTokenValid = (row: Payment): string[] =>
  row.decimals === -1 && row.symbol === "SYMBOL_UNKNOWN"
    ? [`No valid token contract with tokens was found at ${row.tokenAddress}`]
    : [];

export async function toPayment(prePayment: PrePayment, tokenInfoProvider: TokenInfoProvider): Promise<Payment> {
  if (prePayment.tokenAddress === null) {
    // Native asset payment.
    return {
      receiver: prePayment.receiver,
      amount: prePayment.amount,
      tokenAddress: prePayment.tokenAddress,
      decimals: 18,
      symbol: "ETH",
    };
  }
  const tokenInfo = await tokenInfoProvider.getTokenInfo(prePayment.tokenAddress);
  if (typeof tokenInfo !== "undefined") {
    let decimals = tokenInfo.decimals;
    let symbol = tokenInfo.symbol;
    return {
      receiver: prePayment.receiver,
      amount: prePayment.amount,
      tokenAddress: prePayment.tokenAddress,
      decimals,
      symbol,
    };
  } else {
    return {
      receiver: prePayment.receiver,
      amount: prePayment.amount,
      tokenAddress: prePayment.tokenAddress,
      decimals: -1,
      symbol: "SYMBOL_UNKNOWN",
    };
  }
}
