import { ethers } from "ethers";

import { ERC721, ERC721__factory } from "../contracts";

export const erc721Interface = ERC721__factory.createInterface();

export function erc721Instance(address: string, provider: ethers.providers.Provider): ERC721 {
  return ERC721__factory.connect(address, provider);
}
