import { parseString, RowTransformCallback, RowValidateCallback } from "@fast-csv/parse";
import { BigNumber } from "bignumber.js";
import { utils } from "ethers";

import { CodeWarning } from "./contexts/MessageContextProvider";
import { EnsResolver } from "./hooks/ens";
import { TokenInfoProvider } from "./hooks/token";

/**
 * Includes methods to parse, transform and validate csv content
 */

export interface Payment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string | null;
  decimals: number;
  symbol?: string;
  receiverEnsName: string | null;
}

export type CSVRow = {
  receiver: string;
  amount: string;
  token_address: string;
  decimals?: string;
};

interface PrePayment {
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

export class AssetParser {
  public static parseCSV = (
    csvText: string,
    tokenInfoProvider: TokenInfoProvider,
    ensResolver: EnsResolver,
  ): Promise<[Payment[], CodeWarning[]]> => {
    return new Promise<[Payment[], CodeWarning[]]>((resolve, reject) => {
      const results: Payment[] = [];
      const resultingWarnings: CodeWarning[] = [];
      parseString<CSVRow, Payment>(csvText, { headers: true })
        .transform((row: CSVRow, callback) => AssetParser.transformRow(row, tokenInfoProvider, ensResolver, callback))
        .validate((row: Payment, callback: RowValidateCallback) => AssetParser.validateRow(row, callback))
        .on("data", (data: Payment) => results.push(data))
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
  private static transformRow = (
    row: CSVRow,
    tokenInfoProvider: TokenInfoProvider,
    ensResolver: EnsResolver,
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

    AssetParser.toPayment(prePayment, tokenInfoProvider, ensResolver)
      .then((row) => callback(null, row))
      .catch((reason) => callback(reason));
  };

  /**
   * Validates, that addresses are valid, the amount is big enough and a decimal is given or can be found in token lists.
   */
  private static validateRow = (row: Payment, callback: RowValidateCallback) => {
    const warnings = [
      ...AssetParser.areAddressesValid(row),
      ...AssetParser.isAmountPositive(row),
      ...AssetParser.isTokenValid(row),
    ];
    callback(null, warnings.length === 0, warnings.join(";"));
  };

  private static areAddressesValid = (row: Payment): string[] => {
    const warnings: string[] = [];
    if (!(row.tokenAddress === null || utils.isAddress(row.tokenAddress))) {
      warnings.push("Invalid Token Address: " + row.tokenAddress);
    }
    if (!utils.isAddress(row.receiver)) {
      warnings.push("Invalid Receiver Address: " + row.receiver);
    }
    return warnings;
  };

  private static isAmountPositive = (row: Payment): string[] =>
    row.amount.isGreaterThan(0) ? [] : ["Only positive amounts possible: " + row.amount.toFixed()];

  private static isTokenValid = (row: Payment): string[] =>
    row.decimals === -1 && row.symbol === "TOKEN_NOT_FOUND"
      ? [`No token contract was found at ${row.tokenAddress}`]
      : [];

  private static async toPayment(
    prePayment: PrePayment,
    tokenInfoProvider: TokenInfoProvider,
    ensResolver: EnsResolver,
  ): Promise<Payment> {
    // depending on whether there is an ens name or an address provided we either resolve or lookup
    // For performance reasons the lookup will be done after the parsing.
    let [resolvedReceiverAddress, receiverEnsName] = utils.isAddress(prePayment.receiver)
      ? [prePayment.receiver, null]
      : [
          (await ensResolver.isEnsEnabled()) ? await ensResolver.resolveName(prePayment.receiver) : null,
          prePayment.receiver,
        ];
    resolvedReceiverAddress = resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver;
    if (prePayment.tokenAddress === null) {
      // Native asset payment.
      return {
        receiver: resolvedReceiverAddress,
        amount: prePayment.amount,
        tokenAddress: prePayment.tokenAddress,
        decimals: 18,
        symbol: tokenInfoProvider.getNativeTokenSymbol(),
        receiverEnsName,
      };
    }
    let resolvedTokenAddress = (await ensResolver.isEnsEnabled())
      ? await ensResolver.resolveName(prePayment.tokenAddress)
      : prePayment.tokenAddress;
    const tokenInfo =
      resolvedTokenAddress === null ? undefined : await tokenInfoProvider.getTokenInfo(resolvedTokenAddress);
    if (typeof tokenInfo !== "undefined") {
      let decimals = tokenInfo.decimals;
      let symbol = tokenInfo.symbol;
      return {
        receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
        amount: prePayment.amount,
        tokenAddress: resolvedTokenAddress,
        decimals,
        symbol,
        receiverEnsName,
      };
    } else {
      return {
        receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
        amount: prePayment.amount,
        tokenAddress: prePayment.tokenAddress,
        decimals: -1,
        symbol: "TOKEN_NOT_FOUND",
        receiverEnsName,
      };
    }
  }
}
