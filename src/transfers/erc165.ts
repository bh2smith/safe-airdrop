import { ethers } from "ethers";

import { ERC165, ERC165__factory } from "../contracts";

export const erc165Interface = ERC165__factory.createInterface();

export function erc165Instance(address: string, provider: ethers.providers.Provider): ERC165 {
  return ERC165__factory.connect(address, provider);
}
