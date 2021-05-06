import { expect } from "chai";
import { initWeb3, getSafeEndpoint, getRpcEndpoint } from "src/connect";

const configuredNetworks = ["mainnet", "rinkeby", "xdai"];

describe("initWeb3()", () => {
  for (let networkName of configuredNetworks) {
    it(`connects to ${networkName}`, () => {
      expect(() => initWeb3(networkName)).to.not.throw();
    });
  }

  it("Throws on unknown networks", () => {
    let unknownNetwork = "something not configured";
    expect(() => initWeb3(unknownNetwork)).to.throw(
      `Network not configured. Please use a different network or configure the network id for ${unknownNetwork}`
    );
  });
});

describe("getSafeEndpoint()", () => {
  for (let networkName of configuredNetworks) {
    it(`connects to ${networkName}`, () => {
      expect(() => getSafeEndpoint(networkName)).to.not.throw();
    });
  }

  it("Throws on unknown networks", () => {
    for (let unknownNetwork of ["unknown", "randomText"])
      expect(() => getSafeEndpoint(unknownNetwork)).to.throw(
        `Safe Endpoint for ${unknownNetwork} is not configured. Please use a different network or configure the safe endpoint for ${unknownNetwork}`
      );
  });
});

describe("getRpcEndpoint()", () => {
  for (let networkName of configuredNetworks) {
    it(`connects to ${networkName}`, () => {
      expect(() => getRpcEndpoint(networkName)).to.not.throw();
      // TODO - test the actual return value
    });
  }

  it("Throws on unknown networks", () => {
    for (let unknownNetwork of ["unknown", "randomText"])
      expect(() => getRpcEndpoint(unknownNetwork)).to.throw(
        `Network not configured. Please use a different network or configure the network id for ${unknownNetwork}`
      );
  });

  // TODO - Test missing Infura key error
});
