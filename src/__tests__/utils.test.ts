import { BigNumber } from "bignumber.js";

import { fromWei, toWei, TEN, ONE, ZERO, resolveIpfsUri } from "../utils";

// TODO - this is super ugly at the moment and is probably missing some stuff.
describe("toWei()", () => {
  it("decimals", () => {
    expect(toWei("0.00000001", 0).eq(ZERO));
    expect(toWei("0.1", 1).eq(ONE));
    expect(toWei("0.0000000000000000001", 18).eq(ONE));
  });
  it("integers", () => {
    expect(toWei(1, 0).eq(ONE));
    expect(toWei(123, 1).eq(new BigNumber(1230)));
    expect(toWei(1, 18).eq(new BigNumber(1000000000000000000)));
  });
  it("mixed", () => {
    expect(toWei(1.234, 0).eq(ONE));
    expect(toWei(1.234, 3).eq(new BigNumber(1234)));
    expect(toWei(1.00000000000000000001, 18).eq(new BigNumber(1000000000000000000)));
  });
});

describe("fromWei()", () => {
  it("works as expected on legit input", () => {
    const oneETH = TEN.pow(18);
    expect(fromWei(oneETH, 0).toString()).toEqual("1000000000000000000");
    expect(fromWei(oneETH, 9).toString()).toEqual((10 ** 9).toString());
    expect(fromWei(oneETH, 18).toString()).toEqual("1");
    expect(fromWei(oneETH, 19).toString()).toEqual("0.1");
    expect(fromWei(oneETH, 20).toString()).toEqual("0.01");

    expect(fromWei(oneETH, 0).toFixed()).toEqual("1000000000000000000");
    expect(fromWei(oneETH, 9).toFixed()).toEqual((10 ** 9).toString());
    expect(fromWei(oneETH, 18).toFixed()).toEqual("1");
    expect(fromWei(oneETH, 19).toFixed()).toEqual("0.1");
    expect(fromWei(oneETH, 20).toFixed()).toEqual("0.01");
  });
});

describe("resolveIpfsUri", () => {
  it("returns non ipfs urls unchanged", () => {
    const normalURI = "https://gnosis-safe.io";
    expect(resolveIpfsUri(normalURI)).toEqual(normalURI);
  });

  it("returns infura url for ipfs urls", () => {
    const ipfsURI = "ipfs://SomeHash";
    expect(resolveIpfsUri(ipfsURI)).toEqual("https://cloudflare-ipfs.com/ipfs/SomeHash");
  });
});
