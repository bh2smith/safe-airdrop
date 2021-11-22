import { prependListener } from "process";

import { RowTransformCallback } from "@fast-csv/parse";
import { BigNumber } from "bignumber.js";
import { utils } from "ethers";

import { EnsResolver } from "../hooks/ens";
import { ERC721InfoProvider } from "../hooks/erc721InfoProvider";
import { TokenInfoProvider } from "../hooks/token";

import { AssetTransfer, CollectibleTransfer, CSVRow, Transfer, UnknownTransfer } from "./csvParser";

interface PrePayment {
  receiver: string;
  amount: BigNumber;
  tokenAddress: string | null;
  tokenType: string;
}

interface PreCollectibleTransfer {
  receiver: string;
  tokenId: BigNumber;
  tokenAddress: string;
  tokenType: string;
  value?: BigNumber;
}

export const transform = (
  row: CSVRow,
  tokenInfoProvider: TokenInfoProvider,
  erc721InfoProvider: ERC721InfoProvider,
  ensResolver: EnsResolver,
  callback: RowTransformCallback<Transfer | UnknownTransfer>,
): void => {
  switch (row.token_type.toLowerCase()) {
    case "erc20":
    case "native":
      transformAsset(row, tokenInfoProvider, ensResolver, callback);
      break;
    case "erc721":
    case "erc1155":
      transformCollectible(row, erc721InfoProvider, ensResolver, callback);
      break;
    default:
      callback(null, { token_type: "unknown" });

      break;
  }
};

export const transformAsset = (
  row: CSVRow,
  tokenInfoProvider: TokenInfoProvider,
  ensResolver: EnsResolver,
  callback: RowTransformCallback<Transfer>,
): void => {
  const prePayment: PrePayment = {
    // avoids errors from getAddress. Invalid addresses are later caught in validateRow
    tokenAddress: transformERC20TokenAddress(row.token_address),
    amount: new BigNumber(row.value ?? ""),
    receiver: normalizeAddress(row.receiver),
    tokenType: row.token_type.toLowerCase(),
  };

  toPayment(prePayment, tokenInfoProvider, ensResolver)
    .then((row) => callback(null, row))
    .catch((reason) => callback(reason));
};

const toPayment = async (
  row: PrePayment,
  tokenInfoProvider: TokenInfoProvider,
  ensResolver: EnsResolver,
): Promise<AssetTransfer> => {
  // depending on whether there is an ens name or an address provided we either resolve or lookup
  // For performance reasons the lookup will be done after the parsing.
  let [resolvedReceiverAddress, receiverEnsName] = utils.isAddress(row.receiver)
    ? [row.receiver, null]
    : [(await ensResolver.isEnsEnabled()) ? await ensResolver.resolveName(row.receiver) : null, row.receiver];
  resolvedReceiverAddress = resolvedReceiverAddress !== null ? resolvedReceiverAddress : row.receiver;
  if (row.tokenAddress === null) {
    // Native asset payment.
    return {
      receiver: resolvedReceiverAddress,
      amount: row.amount,
      tokenAddress: row.tokenAddress,
      decimals: 18,
      symbol: tokenInfoProvider.getNativeTokenSymbol(),
      receiverEnsName,
      token_type: "native",
    };
  }
  let resolvedTokenAddress = (await ensResolver.isEnsEnabled())
    ? await ensResolver.resolveName(row.tokenAddress)
    : row.tokenAddress;
  const tokenInfo =
    resolvedTokenAddress === null ? undefined : await tokenInfoProvider.getTokenInfo(resolvedTokenAddress);
  if (typeof tokenInfo !== "undefined") {
    let decimals = tokenInfo.decimals;
    let symbol = tokenInfo.symbol;
    return {
      receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : row.receiver,
      amount: row.amount,
      tokenAddress: resolvedTokenAddress,
      decimals,
      symbol,
      receiverEnsName,
      token_type: "erc20",
    };
  } else {
    return {
      receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : row.receiver,
      amount: row.amount,
      tokenAddress: row.tokenAddress,
      decimals: -1,
      symbol: "TOKEN_NOT_FOUND",
      receiverEnsName,
      token_type: "erc20",
    };
  }
};

/**
 * Transforms each row into a payment object.
 */
export const transformCollectible = (
  row: CSVRow,
  erc721InfoProvider: ERC721InfoProvider,
  ensResolver: EnsResolver,
  callback: RowTransformCallback<Transfer>,
): void => {
  const prePayment: PreCollectibleTransfer = {
    // avoids errors from getAddress. Invalid addresses are later caught in validateRow
    tokenAddress: normalizeAddress(row.token_address),
    tokenId: new BigNumber(row.id ?? ""),
    receiver: normalizeAddress(row.receiver),
    tokenType: row.token_type.toLowerCase(),
    value: new BigNumber(row.value ?? ""),
  };

  toCollectibleTransfer(prePayment, erc721InfoProvider, ensResolver)
    .then((row) => callback(null, row))
    .catch((reason) => callback(reason));
};

const toCollectibleTransfer = async (
  prePayment: PreCollectibleTransfer,
  erc721InfoProvider: ERC721InfoProvider,
  ensResolver: EnsResolver,
): Promise<CollectibleTransfer> => {
  const fromAddress = erc721InfoProvider.getFromAddress();

  let [resolvedReceiverAddress, receiverEnsName] = utils.isAddress(prePayment.receiver)
    ? [prePayment.receiver, null]
    : [
        (await ensResolver.isEnsEnabled()) ? await ensResolver.resolveName(prePayment.receiver) : null,
        prePayment.receiver,
      ];

  console.log("TokenType:" + prePayment.tokenType);
  resolvedReceiverAddress = resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver;
  if (prePayment.tokenType === "erc721") {
    const tokenInfo =
      prePayment.tokenAddress === null ? undefined : await erc721InfoProvider.getTokenInfo(prePayment.tokenAddress);
    if (typeof tokenInfo !== "undefined") {
      return {
        from: fromAddress,
        receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
        tokenId: prePayment.tokenId,
        tokenAddress: prePayment.tokenAddress,
        tokenName: tokenInfo.name,
        receiverEnsName,
        token_type: prePayment.tokenType,
      };
    } else {
      return {
        from: fromAddress,
        receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
        tokenId: prePayment.tokenId,
        tokenAddress: prePayment.tokenAddress,
        tokenName: "TOKEN_NOT_FOUND",
        receiverEnsName,
        token_type: prePayment.tokenType,
      };
    }
  } else if (prePayment.tokenType === "erc1155") {
    return {
      from: fromAddress,
      receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
      tokenId: prePayment.tokenId,
      tokenAddress: prePayment.tokenAddress,
      receiverEnsName,
      value: prePayment.value,
      token_type: "erc1155",
    };
  } else {
    return {
      from: fromAddress,
      receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : prePayment.receiver,
      tokenId: prePayment.tokenId,
      tokenAddress: prePayment.tokenAddress,
      receiverEnsName: "",
      tokenName: "TOKEN_NOT_SUPPORTED_YET",
      token_type: "erc1155",
    };
  }
};

/**
 * returns null if the tokenAddress is empty.
 * Parses and normalizes tokenAddress into a checksum address if the tokenAddress is provided
 */
const transformERC20TokenAddress = (tokenAddress: string | null) =>
  tokenAddress === "" || tokenAddress === null ? null : normalizeAddress(tokenAddress);

/*
 *  Parses and normalizes tokenAddress
 */
const normalizeAddress = (address: string) => (utils.isAddress(address) ? utils.getAddress(address) : address);
