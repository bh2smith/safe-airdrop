import { parseString, RowValidateCallback } from "@fast-csv/parse";
import { useCallback } from "react";
import { transform } from "src/parser/transformation";
import { validateRow } from "src/parser/validation";
import { CodeWarning } from "src/stores/slices/messageSlice";

import { useCollectibleTokenInfoProvider } from "./collectibleTokenInfoProvider";
import { useEnsResolver } from "./ens";
import { useTokenInfoProvider } from "./token";

export type Transfer = AssetTransfer | CollectibleTransfer;

export type AssetTokenType = "erc20" | "native";
export type CollectibleTokenType = "erc721" | "erc1155";

export interface AssetTransfer {
  token_type: AssetTokenType;
  receiver: string;
  amount: string;
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
  tokenId: string;
  amount?: string;
  receiverEnsName: string | null;
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

export const useCsvParser = (): { parseCsv: (csvText: string) => Promise<[Transfer[], CodeWarning[]]> } => {
  const collectibleTokenInfoProvider = useCollectibleTokenInfoProvider();
  const tokenInfoProvider = useTokenInfoProvider();
  const ensResolver = useEnsResolver();

  const parseCsv = useCallback(
    (csvText: string) => {
      const noLines = countLines(csvText);
      // Hard limit at 500 lines of txs
      if (noLines > 501) {
        return new Promise<[Transfer[], CodeWarning[]]>((resolve, reject) => {
          reject("Max number of lines exceeded. Due to the block gas limit transactions are limited to 500 lines.");
        });
      }

      return new Promise<[Transfer[], CodeWarning[]]>((resolve, reject) => {
        const results: Transfer[] = [];
        const resultingWarnings: CodeWarning[] = [];
        parseString<CSVRow, Transfer | UnknownTransfer>(csvText, { headers: true })
          .transform((row: CSVRow, callback) =>
            transform(row, tokenInfoProvider, collectibleTokenInfoProvider, ensResolver, callback),
          )
          .validate((row: Transfer | UnknownTransfer, callback: RowValidateCallback) => validateRow(row, callback))
          .on("data", (data: Transfer) => results.push(data))
          .on("end", () => resolve([results, resultingWarnings]))
          .on("data-invalid", (row: Transfer, rowNumber: number, warnings: string) =>
            resultingWarnings.push(...generateWarnings(row, rowNumber, warnings)),
          )
          .on("error", (error) => reject(error));
      });
    },
    [collectibleTokenInfoProvider, ensResolver, tokenInfoProvider],
  );

  return {
    parseCsv,
  };
};
