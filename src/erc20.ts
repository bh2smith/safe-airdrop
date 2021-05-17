import { ethers } from "ethers";

import { IERC20, IERC20__factory } from "./contracts";

export const erc20Interface = IERC20__factory.createInterface();

export function erc20Instance(address: string, provider: ethers.providers.Provider): IERC20 {
  return IERC20__factory.connect(address, provider);
}
