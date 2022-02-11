import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { ethers } from "ethers";

import { AssetTransfer, CollectibleTransfer } from "../parser/csvParser";
import { toWei } from "../utils";

import { erc1155Interface } from "./erc1155";
import { erc20Interface } from "./erc20";
import { erc721Interface } from "./erc721";

export function buildAssetTransfers(transferData: AssetTransfer[]): BaseTransaction[] {
  const txList: BaseTransaction[] = transferData.map((transfer) => {
    if (transfer.tokenAddress === null) {
      // Native asset transfer
      return {
        to: transfer.receiver,
        value: toWei(transfer.value, 18).toFixed(),
        data: "0x",
      };
    } else {
      // ERC20 transfer
      const decimals = transfer.decimals;
      const valueData = toWei(transfer.value, decimals);
      return {
        to: transfer.tokenAddress,
        value: "0",
        data: erc20Interface.encodeFunctionData("transfer", [transfer.receiver, valueData.toFixed()]),
      };
    }
  });
  return txList;
}

export function buildCollectibleTransfers(transferData: CollectibleTransfer[]): BaseTransaction[] {
  const txList: BaseTransaction[] = transferData.map((transfer) => {
    if (transfer.token_type === "erc721") {
      return {
        to: transfer.tokenAddress,
        value: "0",
        data: erc721Interface.encodeFunctionData("safeTransferFrom", [
          transfer.from,
          transfer.receiver,
          transfer.tokenId.toFixed(),
        ]),
      };
    } else {
      return {
        to: transfer.tokenAddress,
        value: "0",
        data: erc1155Interface.encodeFunctionData("safeTransferFrom", [
          transfer.from,
          transfer.receiver,
          transfer.tokenId.toFixed(),
          transfer.value?.toFixed() ?? "0",
          ethers.utils.hexlify("0x00"),
        ]),
      };
    }
  });
  return txList;
}
