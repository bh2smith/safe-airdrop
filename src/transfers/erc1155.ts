import { ethers } from "ethers";

import { ERC1155, ERC1155__factory } from "../contracts";

export const erc1155Interface = ERC1155__factory.createInterface();

export function erc1155Instance(address: string, provider: ethers.providers.Provider): ERC1155 {
  return ERC1155__factory.connect(address, provider);
}
