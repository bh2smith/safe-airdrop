import { getContract, parseAbi, PublicClient } from "viem";

export const abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
]);

export function erc721Instance(address: `0x${string}`, provider: PublicClient) {
  return getContract({
    address,
    abi,
    client: provider,
  });
}
