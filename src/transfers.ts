import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";

import { erc20Interface } from "./erc20";
import { Payment } from "./parser";
import { toWei } from "./utils";

export function buildTransfers(transferData: Payment[]): BaseTransaction[] {
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
