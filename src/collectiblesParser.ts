import { parseString, RowTransformCallback, RowValidateCallback } from "@fast-csv/parse";
import { BigNumber } from "bignumber.js";
import { utils } from "ethers";

import { CodeWarning } from "./contexts/MessageContextProvider";
import { EnsResolver } from "./hooks/ens";
import { ERC721InfoProvider } from "./hooks/erc721InfoProvider";

/**
 * Includes methods to parse, transform and validate csv content
 */

export interface CollectibleTransfer {
  from: string;
  receiver: string;
  tokenAddress: string;
  tokenName: string;
  tokenId: BigNumber;
  receiverEnsName: string | null;
}

export type CSVRow = {
  receiver: string;
  tokenId: string;
  token_address: string;
};

export type PreCollectibleTransfer = {
  receiver: string;
  tokenId: BigNumber;
  tokenAddress: string;
};

const generateWarnings = (
  // We need the row parameter because of the api of fast-csv
  _row: CollectibleTransfer,
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

export class CollectiblesParser {
  public static parseCSV = (
    csvText: string,
    erc721InfoProvider: ERC721InfoProvider,
    ensResolver: EnsResolver,
  ): Promise<[CollectibleTransfer[], CodeWarning[]]> => {
    return new Promise<[CollectibleTransfer[], CodeWarning[]]>((resolve, reject) => {
      const results: CollectibleTransfer[] = [];
      const resultingWarnings: CodeWarning[] = [];
      parseString<CSVRow, CollectibleTransfer>(csvText, { headers: true })
        .transform((row: CSVRow, callback) =>
          CollectiblesParser.transformRow(row, erc721InfoProvider, ensResolver, callback),
        )
        .validate((row: CollectibleTransfer, callback: RowValidateCallback) =>
          CollectiblesParser.validateRow(row, callback),
        )
        .on("data", (data: CollectibleTransfer) => results.push(data))
        .on("end", () => resolve([results, resultingWarnings]))
        .on("data-invalid", (row: CollectibleTransfer, rowNumber: number, warnings: string) =>
          resultingWarnings.push(...generateWarnings(row, rowNumber, warnings)),
        )
        .on("error", (error) => reject(error));
    });
  };

  /**
   * Transforms each row into a payment object.
   */
  private static transformRow = (
    row: CSVRow,
    erc721InfoProvider: ERC721InfoProvider,
    ensResolver: EnsResolver,
    callback: RowTransformCallback<CollectibleTransfer>,
  ): void => {
    const prePayment: PreCollectibleTransfer = {
      // avoids errors from getAddress. Invalid addresses are later caught in validateRow
      tokenAddress: utils.isAddress(row.token_address) ? utils.getAddress(row.token_address) : row.token_address,
      tokenId: new BigNumber(row.tokenId),
      receiver: utils.isAddress(row.receiver) ? utils.getAddress(row.receiver) : row.receiver,
    };

    CollectiblesParser.toCollectibleTransfer(prePayment, erc721InfoProvider, ensResolver)
      .then((row) => callback(null, row))
      .catch((reason) => callback(reason));
  };

  /**
   * Validates, that addresses are valid, the amount is big enough and a decimal is given or can be found in token lists.
   */
  private static validateRow = (row: CollectibleTransfer, callback: RowValidateCallback) => {
    const warnings = [
      ...CollectiblesParser.areAddressesValid(row),
      ...CollectiblesParser.isTokenIdPositive(row),
      ...CollectiblesParser.isTokenValid(row),
    ];
    callback(null, warnings.length === 0, warnings.join(";"));
  };

  private static areAddressesValid = (row: CollectibleTransfer): string[] => {
    const warnings: string[] = [];
    if (!(row.tokenAddress === null || utils.isAddress(row.tokenAddress))) {
      warnings.push("Invalid Token Address: " + row.tokenAddress);
    }
    if (!utils.isAddress(row.receiver)) {
      warnings.push("Invalid Receiver Address: " + row.receiver);
    }
    return warnings;
  };

  private static isTokenIdPositive = (row: CollectibleTransfer): string[] =>
    row.tokenId.isGreaterThan(0) ? [] : ["Only positive tokenIds possible: " + row.tokenId.toFixed()];

  /**
   * I'm not sure if checking for the tokenName is enough.
   */
  private static isTokenValid = (row: CollectibleTransfer): string[] =>
    row.tokenName === "TOKEN_NOT_FOUND" ? [`No erc721 contract was found at ${row.tokenAddress}`] : [];

  private static async toCollectibleTransfer(
    prePayment: PreCollectibleTransfer,
    erc721InfoProvider: ERC721InfoProvider,
    ensResolver: EnsResolver,
  ): Promise<CollectibleTransfer> {
    // depending on whether there is an ens name or an address provided we either resolve or lookup
    // For performance reasons the lookup will be done after the parsing.
    let [resolvedReceiverAddress, receiverEnsName] = utils.isAddress(prePayment.receiver)
      ? [prePayment.receiver, null]
      : [
          (await ensResolver.isEnsEnabled()) ? await ensResolver.resolveName(prePayment.receiver) : null,
          prePayment.receiver,
        ];
    resolvedReceiverAddress = resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver;
    const tokenInfo =
      prePayment.tokenAddress === null ? undefined : await erc721InfoProvider.getTokenInfo(prePayment.tokenAddress);
    const fromAddress = erc721InfoProvider.getFromAddress();
    if (typeof tokenInfo !== "undefined") {
      return {
        from: fromAddress,
        receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
        tokenId: prePayment.tokenId,
        tokenAddress: prePayment.tokenAddress,
        tokenName: tokenInfo.name,
        receiverEnsName,
      };
    } else {
      return {
        from: fromAddress,
        receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
        tokenId: prePayment.tokenId,
        tokenAddress: prePayment.tokenAddress,
        tokenName: "TOKEN_NOT_FOUND",
        receiverEnsName,
      };
    }
  }
}
