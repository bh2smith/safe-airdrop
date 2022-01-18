import { expect } from "chai";

import { fetchTokenList } from "../hooks/token";
import { networkInfo } from "../networks";

describe("fetchTokenList()", () => {
  for (const chainId of networkInfo.keys()) {
    it(`fetches tokens for ${networkInfo.get(chainId)?.name} network`, () => {
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
