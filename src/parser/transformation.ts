import { RowTransformCallback } from "@fast-csv/parse";
import { BigNumber } from "bignumber.js";
import { utils } from "ethers";

import { CollectibleTokenInfoProvider } from "../hooks/collectibleTokenInfoProvider";
import { EnsResolver } from "../hooks/ens";
import { TokenInfoProvider } from "../hooks/token";
import { AssetTransfer, CollectibleTransfer, CSVRow, Transfer, UnknownTransfer } from "../hooks/useCsvParser";

interface PrePayment {
  receiver: string;
  amount: string;
  tokenAddress: string | null;
  tokenType: "erc20" | "native";
}

interface PreCollectibleTransfer {
  receiver: string;
  tokenId: string;
  tokenAddress: string;
  tokenType: "nft";
  amount?: string;
}

export const transform = (
  row: CSVRow,
  tokenInfoProvider: TokenInfoProvider,
  erc721InfoProvider: CollectibleTokenInfoProvider,
  ensResolver: EnsResolver,
  callback: RowTransformCallback<Transfer | UnknownTransfer>,
): void => {
  const selectedChainShortname = tokenInfoProvider.getSelectedNetworkShortname();

  const trimmedReceiver = trimMatchingNetwork(row.receiver, selectedChainShortname);

  switch (row.token_type?.toLowerCase()) {
    case "erc20":
      transformAsset(
        { ...row, token_type: "erc20", receiver: trimmedReceiver },
        tokenInfoProvider,
        ensResolver,
        callback,
      );
      break;
    case "native":
      transformAsset(
        { ...row, token_type: "native", receiver: trimmedReceiver },
        tokenInfoProvider,
        ensResolver,
        callback,
      );
      break;
    case "nft":
    case "erc721":
    case "erc1155":
      transformCollectible(
        { ...row, token_type: "nft", receiver: trimmedReceiver },
        erc721InfoProvider,
        ensResolver,
        callback,
      );
      break;
    default:
      // Fallback so people can still use the old csv file format
      transformAsset(
        { ...row, token_type: "erc20", receiver: trimmedReceiver },
        tokenInfoProvider,
        ensResolver,
        callback,
      );
      break;
  }
};

export const transformAsset = (
  row: Omit<CSVRow, "token_type"> & { token_type: "erc20" | "native" },
  tokenInfoProvider: TokenInfoProvider,
  ensResolver: EnsResolver,
  callback: RowTransformCallback<Transfer>,
): void => {
  const selectedChainShortname = tokenInfoProvider.getSelectedNetworkShortname();
  const prePayment: PrePayment = {
    // avoids errors from getAddress. Invalid addresses are later caught in validateRow
    tokenAddress: transformERC20TokenAddress(row.token_address),
    amount: row.amount ?? row.value ?? "",
    receiver: normalizeAddress(trimMatchingNetwork(row.receiver, selectedChainShortname)),
    tokenType: row.token_type,
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
  row: Omit<CSVRow, "token_type"> & { token_type: "nft" },
  erc721InfoProvider: CollectibleTokenInfoProvider,
  ensResolver: EnsResolver,
  callback: RowTransformCallback<Transfer>,
): void => {
  let amount = row.amount ?? row.value ?? "1";
  amount = amount === "" ? "1" : amount;
  const prePayment: PreCollectibleTransfer = {
    // avoids errors from getAddress. Invalid addresses are later caught in validateRow
    tokenAddress: normalizeAddress(row.token_address),
    tokenId: row.id ?? "",
    receiver: normalizeAddress(row.receiver),
    tokenType: row.token_type,
    amount,
  };

  toCollectibleTransfer(prePayment, erc721InfoProvider, ensResolver)
    .then((row) => callback(null, row))
    .catch((reason) => callback(reason));
};

const toCollectibleTransfer = async (
  preCollectible: PreCollectibleTransfer,
  collectibleTokenInfoProvider: CollectibleTokenInfoProvider,
  ensResolver: EnsResolver,
): Promise<CollectibleTransfer> => {
  const fromAddress = collectibleTokenInfoProvider.getFromAddress();

  let [resolvedReceiverAddress, receiverEnsName] = utils.isAddress(preCollectible.receiver)
    ? [preCollectible.receiver, null]
    : [
        (await ensResolver.isEnsEnabled()) ? await ensResolver.resolveName(preCollectible.receiver) : null,
        preCollectible.receiver,
      ];
  resolvedReceiverAddress = resolvedReceiverAddress !== null ? resolvedReceiverAddress : preCollectible.receiver;

  const tokenInfo = await collectibleTokenInfoProvider.getTokenInfo(
    preCollectible.tokenAddress,
    new BigNumber(preCollectible.tokenId),
  );

  if (tokenInfo?.token_type === "erc721") {
    return {
      from: fromAddress,
      receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : preCollectible.receiver,
      tokenId: preCollectible.tokenId,
      tokenAddress: preCollectible.tokenAddress,
      receiverEnsName,
      token_type: "erc721",
    };
  } else if (tokenInfo?.token_type === "erc1155") {
    return {
      from: fromAddress,
      receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : preCollectible.receiver,
      tokenId: preCollectible.tokenId,
      tokenAddress: preCollectible.tokenAddress,
      receiverEnsName,
      amount: preCollectible.amount,
      token_type: "erc1155",
    };
  } else {
    // return a fake token which will fail validation.
    return {
      from: fromAddress,
      receiver: resolvedReceiverAddress !== null ? resolvedReceiverAddress : preCollectible.receiver,
      tokenId: preCollectible.tokenId,
      tokenAddress: preCollectible.tokenAddress,
      tokenName: "TOKEN_NOT_FOUND",
      receiverEnsName,
      token_type: "erc721",
    };
  }
};

/**
 * returns null if the tokenAddress is empty.
 * Parses and normalizes tokenAddress into a checksum address if the tokenAddress is provided
 */
const transformERC20TokenAddress = (tokenAddress: string | null) =>
  tokenAddress === "" || tokenAddress === null ? null : normalizeAddress(tokenAddress);

const trimMatchingNetwork = (address: string, selectedPrefix?: string) => {
  if (selectedPrefix && address && address.trim().startsWith(`${selectedPrefix}:`)) {
    return address.substr(address.indexOf(":") + 1);
  } else {
    return address;
  }
};

/*
 *  Parses and normalizes tokenAddress
 */
const normalizeAddress = (address: string) => (utils.isAddress(address) ? utils.getAddress(address) : address);
