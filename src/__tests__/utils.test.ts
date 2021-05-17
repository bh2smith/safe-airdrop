import { BigNumber } from "bignumber.js";
import { expect } from "chai";

import { Payment } from "../parser";
import { testData } from "../test/util";
import { fromWei, toWei, TEN, ONE, ZERO, transfersToSummary } from "../utils";

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
    expect(fromWei(oneETH, 0).toString()).to.be.equal("1000000000000000000");
    expect(fromWei(oneETH, 9).toString()).to.be.equal((10 ** 9).toString());
    expect(fromWei(oneETH, 18).toString()).to.be.equal("1");
    expect(fromWei(oneETH, 19).toString()).to.be.equal("0.1");
    expect(fromWei(oneETH, 20).toString()).to.be.equal("0.01");

    expect(fromWei(oneETH, 0).toFixed()).to.be.equal("1000000000000000000");
    expect(fromWei(oneETH, 9).toFixed()).to.be.equal((10 ** 9).toString());
    expect(fromWei(oneETH, 18).toFixed()).to.be.equal("1");
    expect(fromWei(oneETH, 19).toFixed()).to.be.equal("0.1");
    expect(fromWei(oneETH, 20).toFixed()).to.be.equal("0.01");
  });
});

describe("transferToSummary()", () => {
  it("works for integer native currency", () => {
    const transfers: Payment[] = [
      {
        tokenAddress: null,
        amount: new BigNumber(1),
        receiver: testData.addresses.receiver1,
      },
      {
        tokenAddress: null,
        amount: new BigNumber(2),
        receiver: testData.addresses.receiver2,
      },
      {
        tokenAddress: null,
        amount: new BigNumber(3),
        receiver: testData.addresses.receiver3,
      },
    ];
    const summary = transfersToSummary(transfers);
    expect(summary.get(null).amount.toFixed()).to.equal("6");
  });

  it("works for decimals in native currency", () => {
    const transfers: Payment[] = [
      {
        tokenAddress: null,
        amount: new BigNumber(0.1),
        receiver: testData.addresses.receiver1,
      },
      {
        tokenAddress: null,
        amount: new BigNumber(0.01),
        receiver: testData.addresses.receiver2,
      },
      {
        tokenAddress: null,
        amount: new BigNumber(0.001),
        receiver: testData.addresses.receiver3,
      },
    ];
    const summary = transfersToSummary(transfers);
    expect(summary.get(null).amount.toFixed()).to.equal("0.111");
  });

  it("works for decimals in erc20", () => {
    const transfers: Payment[] = [
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(0.1),
        receiver: testData.addresses.receiver1,
      },
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(0.01),
        receiver: testData.addresses.receiver2,
      },
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(0.001),
        receiver: testData.addresses.receiver3,
      },
    ];
    const summary = transfersToSummary(transfers);
    expect(summary.get(testData.unlistedToken.address).amount.toFixed()).to.equal("0.111");
  });

  it("works for integer in erc20", () => {
    const transfers: Payment[] = [
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(1),
        receiver: testData.addresses.receiver1,
      },
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(2),
        receiver: testData.addresses.receiver2,
      },
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(3),
        receiver: testData.addresses.receiver3,
      },
    ];
    const summary = transfersToSummary(transfers);
    expect(summary.get(testData.unlistedToken.address).amount.toFixed()).to.equal("6");
  });

  it("works for mixed payments", () => {
    const transfers: Payment[] = [
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(1.1),
        receiver: testData.addresses.receiver1,
      },
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(2),
        receiver: testData.addresses.receiver2,
      },
      {
        tokenAddress: testData.unlistedToken.address,
        amount: new BigNumber(3.3),
        receiver: testData.addresses.receiver3,
      },
      {
        tokenAddress: null,
        amount: new BigNumber(3),
        receiver: testData.addresses.receiver1,
      },
      {
        tokenAddress: null,
        amount: new BigNumber(0.33),
        receiver: testData.addresses.receiver1,
      },
    ];
    const summary = transfersToSummary(transfers);
    expect(summary.get(testData.unlistedToken.address).amount.toFixed()).to.equal("6.4");
    expect(summary.get(null).amount.toFixed()).to.equal("3.33");
  });
});
