import { getContract, parseAbi, PublicClient } from "viem";

export const erc1155Interface = parseAbi(["function tokenURI(uint256 id) view returns (string)"]);

export function erc1155Instance(address: `0x${string}`, provider: PublicClient) {
  return getContract({
    address,
    abi: erc1155Interface,
    client: provider,
  });
}
