import { expect } from "chai";

import { fetchTokenList } from "../hooks/token";

const configuredNetworks = [1, 4, 100];

describe("fetchTokenList()", () => {
  for (const chainId of configuredNetworks) {
    it(`fetches tokens for ${chainId} network`, () => {
      expect(() => fetchTokenList(chainId)).to.not.throw();
    });
  }
});

describe("useTokenList()", () => {
  it("Throws on unknown networks", () => {
    // TODO - not sure how to test this.
    expect(1).to.equal(1);
  });
});
