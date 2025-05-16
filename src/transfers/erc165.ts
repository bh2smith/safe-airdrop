import { getContract, parseAbi, PublicClient } from "viem";

export const abi = parseAbi(["function supportsInterface(bytes4 interfaceId) public view returns (bool)"]);

export function erc165Instance(address: `0x${string}`, provider: PublicClient) {
  return getContract({
    address,
    abi,
    client: provider,
  });
}
