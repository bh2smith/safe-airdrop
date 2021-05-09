import { ethers } from "ethers";
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";

export const erc20Interface = new ethers.utils.Interface(IERC20.abi);

export function erc20Instance(
  address: string,
  provider: ethers.providers.Provider
): ethers.Contract {
  return new ethers.Contract(address, erc20Interface, provider);
}
