import { utils } from "ethers";
import { parseString, RowValidateCallback } from "@fast-csv/parse";
import { TokenMap } from "./hooks/tokenList";
import { Message } from "./contexts/MessageContextProvider";
import BigNumber from "bignumber.js";
/**
 * Includes methods to parse, transform and validate csv content
 */

export interface Payment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string;
  decimals?: number;
}

export type CSVRow = {
  receiver: string;
  amount: string;
  token_address: string;
  decimals?: string;
};

const generateWarnings = (
  // We need the row parameter because of the api of fast-csv
  _row: Payment,
  rowNumber: number,
  warnings: string
) => {
  const messages: Message[] = warnings.split(";").map((warning: string) => ({
    message: rowNumber + ": " + warning,
    severity: "warning",
  }));
  return messages;
};

export const parseCSV = (csvText: string, tokenList: TokenMap) => {
  return new Promise<[Payment[], Message[]]>((resolve, reject) => {
    const results: any[] = [];
    const resultingWarnings: Message[] = [];
    parseString<CSVRow, Payment>(csvText, { headers: true })
      .transform(transformRow)
      .validate((row: Payment, callback: RowValidateCallback) =>
        validateRow(row, tokenList, callback)
      )
      .on("data", (data) => results.push(data))
      .on("end", () => resolve([results, resultingWarnings]))
      .on("data-invalid", (row: Payment, rowNumber: number, warnings: string) =>
        resultingWarnings.push(...generateWarnings(row, rowNumber, warnings))
      )
      .on("error", (error) => reject(error));
  });
};

/**
 * Transforms each row into a payment object.
 */
const transformRow = (row: CSVRow): Payment => ({
  // avoids errors from getAddress. Invalid addresses are later caught in validateRow
  tokenAddress:
    row.token_address === "" || row.token_address === null
      ? null
      : utils.isAddress(row.token_address)
      ? utils.getAddress(row.token_address)
      : row.token_address,
  amount: new BigNumber(row.amount),
  receiver: utils.isAddress(row.receiver)
    ? utils.getAddress(row.receiver)
    : row.receiver,
  decimals: row.decimals ? Number(row.decimals) : undefined,
});

/**
 * Validates, that addresses are valid, the amount is big enough and a decimal is given or can be found in token lists.
 */
const validateRow = (
  row: Payment,
  tokenList: TokenMap,
  callback: RowValidateCallback
) => {
  const warnings = [
    ...areAddressesValid(row),
    ...isAmountPositive(row),
    ...isDecimalValid(row, tokenList),
  ];
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
  row.amount.isGreaterThan(0)
    ? []
    : ["Only positive amounts possible: " + row.amount.toFixed()];

const isDecimalValid = (row: Payment, tokenList: TokenMap): string[] => {
  if (row.tokenAddress == null || row.tokenAddress === "") {
    return [];
  } else {
    const decimals =
      tokenList.get(
        utils.isAddress(row.tokenAddress)
          ? utils.getAddress(row.tokenAddress)
          : row.tokenAddress
      )?.decimals || row.decimals;
    return decimals >= 0 ? [] : ["Invalid decimals: " + decimals];
  }
};
