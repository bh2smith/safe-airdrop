import { Transaction } from "@gnosis.pm/safe-apps-sdk";
import { TokenMap } from "./hooks/tokenList";
import BigNumber from "bignumber.js";
import { Payment } from "./parser";
import { ethers } from "ethers";
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";

export const TEN = new BigNumber(10);

// TODO - when token data is unknown need to get contract at address with web3Provider
// const erc20 = new ethers.Contract(token.address, IERC20.abi, provider);

export function buildTransfers(
  transferData: Payment[],
  tokenList: TokenMap
): Transaction[] {
  const erc20 = new ethers.utils.Interface(IERC20.abi);
  const txList: Transaction[] = transferData.map((transfer, _) => {
    if (transfer.tokenAddress === null) {
      // Native asset transfer
      return {
        to: transfer.receiver,
        value: transfer.amount.multipliedBy(TEN.pow(18)).toFixed(),
        data: "0x",
      };
    } else {
      // ERC20 transfer
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
        data: erc20.encodeFunctionData("transfer", [
          transfer.receiver,
          amountData.toFixed(),
        ]),
      };
    }
  });
  return txList;
}
