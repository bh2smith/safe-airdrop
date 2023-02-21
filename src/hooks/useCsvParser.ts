import { useCallback } from "react";
import { usePapaParse } from "react-papaparse";
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

enum HEADER_FIELDS {
  TYPE = "token_type",
  TOKEN_ADDRESS = "token_address",
  RECEIVER = "receiver",
  VALUE = "value",
  AMOUNT = "amount",
  ID = "id",
}

const generateWarnings = (
  // We need the row parameter because of the api of fast-csv
  _row: Transfer | UnknownTransfer,
  rowNumber: number,
  warnings: string[],
) => {
  const messages: CodeWarning[] = warnings.map((warning: string) => ({
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
  const { readString } = usePapaParse();

  const parseCsv = useCallback(
    async (csvText: string): Promise<[Transfer[], CodeWarning[]]> => {
      return new Promise<[Transfer[], CodeWarning[]]>((resolve, reject) => {
        const noLines = countLines(csvText);
        // Hard limit at 500 lines of txs
        if (noLines > 501) {
          reject("Max number of lines exceeded. Due to the block gas limit transactions are limited to 500 lines.");
          return;
        }

        readString(csvText, {
          header: true,
          worker: true,
          complete: async (results) => {
            // Check headers
            const unknownFields = results.meta.fields?.filter(
              (field) => !Object.values<string>(HEADER_FIELDS).includes(field),
            );

            if (unknownFields && unknownFields?.length > 0) {
              resolve([
                [],
                [
                  {
                    lineNo: 0,
                    message: `Unknown header field(s): ${unknownFields.join(", ")}`,
                    severity: "error",
                  },
                ],
              ]);
              return;
            }
            const csvRows = results.data as CSVRow[];
            const numberedRows = csvRows
              .map((row, idx) => ({ content: row, lineNo: idx + 1 }))
              // Empty rows have no receiver
              .filter((row) => row.content.receiver !== undefined && row.content.receiver !== "");
            const transformedRows: ((Transfer | UnknownTransfer) & { lineNo: number })[] = await Promise.all(
              numberedRows.map((row) =>
                transform(row.content, tokenInfoProvider, collectibleTokenInfoProvider, ensResolver).then(
                  (transfer) => ({
                    ...transfer,
                    lineNo: row.lineNo,
                  }),
                ),
              ),
            );

            // validation warnings
            const resultingWarnings = transformedRows.map((row) => {
              const validationWarnings = validateRow(row);
              return generateWarnings(row, row.lineNo, validationWarnings);
            });

            // add syntax errors
            resultingWarnings.push(
              results.errors.map((error) => ({
                lineNo: error.row + 1,
                message: error.message,
                severity: "error",
              })),
            );

            const validRows = transformedRows.filter((_, idx) => resultingWarnings[idx]?.length === 0) as Transfer[];
            resolve([validRows, resultingWarnings.flat()]);
          },
        });
      });
    },
    [collectibleTokenInfoProvider, ensResolver, readString, tokenInfoProvider],
  );

  return {
    parseCsv,
  };
};
