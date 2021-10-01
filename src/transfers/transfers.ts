import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";

import { Payment } from "../assetParser";
import { CollectibleTransfer } from "../collectiblesParser";
import { toWei } from "../utils";

import { erc20Interface } from "./erc20";
import { erc721Interface } from "./erc721";

export function buildAssetTransfers(transferData: Payment[]): BaseTransaction[] {
  const txList: BaseTransaction[] = transferData.map((transfer) => {
    if (transfer.tokenAddress === null) {
      // Native asset transfer
      return {
        to: transfer.receiver,
        value: toWei(transfer.amount, 18).toFixed(),
        data: "0x",
      };
    } else {
      // ERC20 transfer
      const decimals = transfer.decimals;
      const amountData = toWei(transfer.amount, decimals);
      return {
        to: transfer.tokenAddress,
        value: "0",
        data: erc20Interface.encodeFunctionData("transfer", [transfer.receiver, amountData.toFixed()]),
      };
    }
  });
  return txList;
}

export function buildERC721Transfers(transferData: CollectibleTransfer[]): BaseTransaction[] {
  const txList: BaseTransaction[] = transferData.map((transfer) => {
    return {
      to: transfer.tokenAddress,
      value: "0",
      data: erc721Interface.encodeFunctionData("transferFrom", [
        transfer.from,
        transfer.receiver,
        transfer.tokenId.toFixed(),
      ]),
    };
  });
  return txList;
}
