import { Transaction } from "@gnosis.pm/safe-apps-sdk";
import { TokenMap } from "./hooks/tokenList";
import BigNumber from "bignumber.js";
import { Payment } from "./parser";
import { Contract } from "ethers";

export const TEN = new BigNumber(10);

export function buildTransfers(
  transferData: Payment[],
  tokenList: TokenMap,
  // provider: ethers.providers.Provider
  erc20: Contract
): Transaction[] {
  const txList: Transaction[] = transferData.map((transfer, _) => {
    if (transfer.tokenAddress === null) {
      return {
        to: transfer.receiver,
        value: transfer.amount.multipliedBy(TEN.pow(18)).toFixed(),
        data: "0x",
      };
    } else {
      const exponent = new BigNumber(
        TEN.pow(
          tokenList.get(transfer.tokenAddress)?.decimals || transfer.decimals
        )
      );
      let amountData = transfer.amount.multipliedBy(exponent);
      if (amountData.decimalPlaces() > 0) {
        // TODO - reinstate this warning by passing along with return content
        // Return (Transaction[], Message)
        // setLastError({
        //   message:
        //     "Precision too high. Some digits are ignored for row " + index,
        // });
        amountData = amountData.decimalPlaces(0, BigNumber.ROUND_DOWN);
      }

      return {
        to: transfer.tokenAddress,
        value: "0",
        data: erc20.interface.encodeFunctionData("transfer", [
          transfer.receiver,
          amountData.toFixed(),
        ]),
      };
    }
  });
  return txList;
}
