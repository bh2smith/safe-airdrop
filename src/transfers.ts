import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { AbiItem } from "web3-utils";
import { SafeInfo, Transaction } from "@gnosis.pm/safe-apps-sdk";
import { initWeb3 } from "./connect";
import { TokenMap } from "./hooks/tokenList";
import BigNumber from "bignumber.js";
import { Payment } from "./parser";

export const TEN = new BigNumber(10);

export function buildTransfers(
  safeInfo: SafeInfo,
  transferData: Payment[],
  tokenList: TokenMap
): Transaction[] {
  const web3 = initWeb3(safeInfo.network);
  const erc20 = new web3.eth.Contract(IERC20.abi as AbiItem[]);
  const txList: Transaction[] = transferData.map((transfer, index) => {
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
        data: erc20.methods
          .transfer(transfer.receiver, amountData.toFixed())
          .encodeABI(),
      };
    }
  });
  return txList;
}
