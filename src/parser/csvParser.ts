import { parseString, RowValidateCallback } from "@fast-csv/parse";
import { BigNumber } from "bignumber.js";

import { CodeWarning } from "../contexts/MessageContextProvider";
import { CollectibleTokenInfoProvider } from "../hooks/collectibleTokenInfoProvider";
import { EnsResolver } from "../hooks/ens";
import { TokenInfoProvider } from "../hooks/token";

import { transform } from "./transformation";
import { validateRow } from "./validation";

/**
 * Includes methods to parse, transform and validate csv content
 */

export type Transfer = AssetTransfer | CollectibleTransfer;

export type AssetTokenType = "erc20" | "native";
export type CollectibleTokenType = "erc721" | "erc1155";

export interface AssetTransfer {
  token_type: AssetTokenType;
  receiver: string;
  amount: BigNumber;
  tokenAddress: string | null;
  decimals: number;
  symbol?: string;
  receiverEnsName: string | null;
  position?: number;
}

export interface CollectibleTransfer {
  token_type: CollectibleTokenType;
  from: string;
  receiver: string;
  tokenAddress: string;
  tokenName?: string;
  tokenId: BigNumber;
  amount?: BigNumber;
  receiverEnsName: string | null;
  hasMetaData: boolean;
}

export interface UnknownTransfer {
  token_type: "unknown";
}

export type CSVRow = {
  token_type?: string;
  token_address: string;
  receiver: string;
  value?: string;
  amount?: string;
  id?: string;
};

const generateWarnings = (
  // We need the row parameter because of the api of fast-csv
  _row: Transfer,
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

const countLines = (text: string) => text.split(/\r\n|\r|\n/).length;

export class CSVParser {
  public static parseCSV = (
    csvText: string,
    tokenInfoProvider: TokenInfoProvider,
    erc721TokenInfoProvider: CollectibleTokenInfoProvider,
    ensResolver: EnsResolver,
  ): Promise<[Transfer[], CodeWarning[]]> => {
    const noLines = countLines(csvText);
    // Hard limit at 400 lines of txs
    if (noLines > 401) {
      return new Promise<[Transfer[], CodeWarning[]]>((resolve, reject) => {
        reject({
          message: "Max number of lines exceeded. Due to the block gas limit transactions are limited to 400 lines.",
        });
      });
    }

    return new Promise<[Transfer[], CodeWarning[]]>((resolve, reject) => {
      const results: Transfer[] = [];
      const resultingWarnings: CodeWarning[] = [];
      parseString<CSVRow, Transfer | UnknownTransfer>(csvText, { headers: true })
        .transform((row: CSVRow, callback) =>
          transform(row, tokenInfoProvider, erc721TokenInfoProvider, ensResolver, callback),
        )
        .validate((row: Transfer | UnknownTransfer, callback: RowValidateCallback) => validateRow(row, callback))
        .on("data", (data: Transfer) => results.push(data))
        .on("end", () => resolve([results, resultingWarnings]))
        .on("data-invalid", (row: Transfer, rowNumber: number, warnings: string) =>
          resultingWarnings.push(...generateWarnings(row, rowNumber, warnings)),
        )
        .on("error", (error) => reject(error));
    });
  };
}
