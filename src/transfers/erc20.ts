import { ethers } from "ethers";

import { ERC20, ERC20__factory } from "../contracts";

export const erc20Interface = ERC20__factory.createInterface();

export function erc20Instance(address: string, provider: ethers.providers.Provider): ERC20 {
  return ERC20__factory.connect(address, provider);
}
