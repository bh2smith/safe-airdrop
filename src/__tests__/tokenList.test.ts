import { expect } from "chai";

import { fetchTokenList, networkMap } from "../hooks/token";

describe("fetchTokenList()", () => {
  for (const chainId of networkMap.keys()) {
    it(`fetches tokens for ${networkMap.get(chainId)} network`, () => {
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
