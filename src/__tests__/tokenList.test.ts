import { expect } from "chai";
import { ethers } from "ethers";

import { fetchTokenList } from "../hooks/token";
import { networkInfo } from "../networks";

beforeEach(() => {
  jest.spyOn(window, "fetch").mockImplementation(() => {
    console.log("Mock fetch");
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

    console.log(resultingTokens);

    const gnoAddress = ethers.utils.getAddress("0x6810e776880c02933d47db1b9fc05908e5386b96");

    expect(resultingTokens).to.have.lengthOf(2);
    expect(resultingTokens.get(gnoAddress)?.symbol).to.equal("GNO");
    expect(resultingTokens.get(gnoAddress)?.address.toLowerCase()).eq(gnoAddress.toLowerCase());
    expect(resultingTokens.get(gnoAddress)?.decimals).to.equal(18);
  });
});

describe("Fetch should resolve for all networks", () => {
  for (const chainId of networkInfo.keys()) {
    it(`fetches tokens for ${networkInfo.get(chainId)?.name} network`, () => {
      expect(() => fetchTokenList(chainId)).to.not.throw();
    });
  }
});
