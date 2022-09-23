import { BigNumber } from "bignumber.js";

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);
export const TWO = new BigNumber(2);
export const TEN = new BigNumber(10);
export const MAX_U256 = TWO.pow(255).minus(1);

export const DONATION_ADDRESS = "0xD011a7e124181336ED417B737A495745F150d248";

export interface TokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: {
    readonly [key: string]: string | number | boolean | null;
  };
}

export function toWei(amount: string | number | BigNumber, decimals: number): BigNumber {
  // # TODO - replace all this logic with ethers.utils.formatUnits
  let res = TEN.pow(decimals).multipliedBy(amount);
  const decimalPlaces = res.decimalPlaces();
  // unsure when this can be null, so we simply skip the case as a possibility.
  if (decimalPlaces != null && decimalPlaces > 0) {
    // TODO - reinstate this warning by passing along with return content
    // Return (Transaction[], Message)
    // setLastError({
    //   message:
    //     "Precision too high. Some digits are ignored for row " + index,
    // });
    res = res.decimalPlaces(0, BigNumber.ROUND_DOWN);
  }
  return res;
}

export function fromWei(amount: BigNumber, decimals: number): BigNumber {
  // # TODO - replace all this logic with ethers.utils.parseUnits
  return amount.dividedBy(TEN.pow(decimals));
}

/**
 * Replaces ipfs:// part of the uri with the infura.io ipfs endpoint.
 *
 * @param uri URI which might be a ipfs url
 * @returns URI resolved to the infura ipfs host or uri if it's not an ipfs uri.
 */
export function resolveIpfsUri(uri: string): string {
  return uri.startsWith("ipfs://") ? uri.replace("ipfs://", "https://ipfs.infura.io/ipfs/") : uri;
}
