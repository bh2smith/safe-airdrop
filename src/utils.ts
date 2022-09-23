import { ethers, BigNumber } from "ethers";

export const ZERO = BigNumber.from(0);
export const ONE = BigNumber.from(1);
export const TWO = BigNumber.from(2);
export const TEN = BigNumber.from(10);
export const MAX_U256 = TWO.pow(255).sub(1);

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
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

export function fromWei(amount: BigNumber, decimals: number): BigNumber {
  return BigNumber.from(ethers.utils.formatUnits(amount, decimals));
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
