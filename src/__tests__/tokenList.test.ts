import { ethers } from "ethers";

import { fetchTokenList } from "../hooks/token";
import { staticNetworkInfo } from "../networks";
console.warn = () => {};
beforeEach(() => {
  jest.spyOn(window, "fetch").mockImplementation(() => {
    return Promise.resolve({
      json: () =>
        Promise.resolve({
          tokens: [
            {
              name: "Gnosis",
              address: "0x6810e776880c02933d47db1b9fc05908e5386b96",
              symbol: "GNO",
              decimals: 18,
            },
            {
              name: "Dai Stablecoin",
              address: "0x6b175474e89094c44da98b954eedeac495271d0f",
              symbol: "DAI",
              decimals: 18,
            },
            {
              name: "Spam Token",
              address: "",
              symbol: "SPAM",
              decimals: 0,
            },
          ],
        }),
      status: 200,
    } as any);
  });
});

describe("Mainnet tokenlist", () => {
  it("Should parse its response correctly", async () => {
    const resultingTokens = await fetchTokenList(1);
    const gnoAddress = ethers.utils.getAddress("0x6810e776880c02933d47db1b9fc05908e5386b96");

    expect(resultingTokens.size).toEqual(2);
    expect(resultingTokens.get(gnoAddress)?.symbol).toEqual("GNO");
    expect(resultingTokens.get(gnoAddress)?.address.toLowerCase()).toEqual(gnoAddress.toLowerCase());
    expect(resultingTokens.get(gnoAddress)?.decimals).toEqual(18);
  });

  it("Should not crash on errors", async () => {
    jest.spyOn(window, "fetch").mockImplementation(() => {
      return Promise.reject("Unexpected error.");
    });

    const resultingTokens = await fetchTokenList(1);
    expect(resultingTokens.size).toEqual(0);
  });

  it("Should not crash on unsuccessful fetches", async () => {
    jest.spyOn(window, "fetch").mockImplementation(() => {
      return Promise.resolve({
        status: 404,
        statusText: "Page not found",
      } as any);
    });

    const resultingTokens = await fetchTokenList(1);
    expect(resultingTokens.size).toEqual(0);
  });
});

describe("Fetch should resolve for all networks", () => {
  for (const chainId of staticNetworkInfo.keys()) {
    it(`fetches tokens for ${staticNetworkInfo.get(chainId)?.name} network`, () => {
      expect(() => fetchTokenList(chainId)).not.toThrow();
    });
  }
});
