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

/**
 * Replaces ipfs:// part of the uri with the infura.io ipfs endpoint.
 *
 * @param uri URI which might be a ipfs url
 * @returns URI resolved to the infura ipfs host or uri if it's not an ipfs uri.
 */
export function resolveIpfsUri(uri: string): string {
  return uri.startsWith("ipfs://")
    ? uri.replace("ipfs://ipfs/", "ipfs://").replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
    : uri;
}
