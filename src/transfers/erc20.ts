import { erc20Abi, getContract, PublicClient } from "viem";

export function erc20Instance(address: `0x${string}`, provider: PublicClient) {
  return getContract({
    address,
    abi: erc20Abi,
    client: provider,
  });
}
