import { resolveIpfsUri } from "../utils";

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
