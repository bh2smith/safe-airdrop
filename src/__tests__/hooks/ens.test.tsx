import { Web3Provider } from "@ethersproject/providers";
import SafeProvider from "@gnosis.pm/safe-apps-react-sdk";
import { render, RenderResult, screen } from "@testing-library/react";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";

import { useEnsResolver } from "../../hooks/ens";
import { sendSafeInfo, setupMocksForSafeProvider } from "../../test/safeUtil";
import { testData } from "../../test/util";

type TestENSComponentProps = { ensNamesToResolve?: string[]; addressesToLookup?: string[] };
/**
 * Small component which executes some hook functions and puts the results in the dom.
 */
const TestENSComponent = (props: TestENSComponentProps): JSX.Element => {
  const { ensNamesToResolve, addressesToLookup } = props;
  const ensResolver = useEnsResolver();
  const [isEnsEnabled, setIsEnsEnabled] = useState<boolean | undefined>(undefined);
  const [resolvedNames, setResolvedNames] = useState<Array<string | null> | undefined>(undefined);
  const [lookedUpAddresses, setLookedUpAddresses] = useState<Array<string | null> | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      ensResolver.isEnsEnabled().then((result) => {
        act(() => {
          setIsEnsEnabled(result);
        });
      });
      if (addressesToLookup) {
        const results: Array<string | null> = [];
        for (const address of addressesToLookup) {
          results.push(await ensResolver.lookupAddress(address));
        }
        setLookedUpAddresses(results);
      }
      if (ensNamesToResolve) {
        const results: Array<string | null> = [];
        for (const name of ensNamesToResolve) {
          results.push(await ensResolver.resolveName(name));
        }
        setResolvedNames(results);
      }
    };
    fetchData();
  }, [addressesToLookup, ensNamesToResolve, ensResolver]);

  return (
    <div>
      {typeof isEnsEnabled !== "undefined" ? <div data-testid="isEnsEnabled">{isEnsEnabled.toString()}</div> : <></>}
      {typeof resolvedNames !== "undefined" ? (
        resolvedNames.map((resolvedName, idx) => (
          <div key={idx} data-testid="resolvedName">
            {resolvedName}
          </div>
        ))
      ) : (
        <></>
      )}
      {typeof lookedUpAddresses !== "undefined" ? (
        lookedUpAddresses.map((lookedUpAddress, idx) => (
          <div key={idx} data-testid="lookedUpAddress">
            {lookedUpAddress}
          </div>
        ))
      ) : (
        <></>
      )}
    </div>
  );
};

const renderTestComponent = (container: HTMLElement, props: TestENSComponentProps = {}) =>
  render(
    <SafeProvider loader={<div>loading...</div>}>
      <TestENSComponent addressesToLookup={props.addressesToLookup} ensNamesToResolve={props.ensNamesToResolve} />
    </SafeProvider>,
    { container },
  );

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  setupMocksForSafeProvider();
});

afterEach(() => {
  jest.clearAllMocks();
  if (container) {
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

test("isEnsEnabled with ens capable network", async () => {
  const fakeWeb3Provider: any = {
    getNetwork: () => {
      return Promise.resolve({ chainId: 4, network: "rinkeby", ensAddress: "0x00000000000001" });
    },
  };

  jest.spyOn(ethers.providers, "Web3Provider").mockImplementation(() => fakeWeb3Provider);
  let renderedContainer: undefined | RenderResult;
  act(() => {
    if (container !== null) {
      renderedContainer = renderTestComponent(container);
    }
  });

  sendSafeInfo();

  expect(renderedContainer).toBeTruthy();
  const ensEnabledElement = await screen.findByTestId("isEnsEnabled");
  expect(ensEnabledElement?.innerHTML).toBe("true");
});

test("isEnsEnabled with non ens network", async () => {
  const fakeWeb3Provider: any = {
    getNetwork: () => {
      return Promise.resolve({ chainId: 9, network: "randomnetwork" });
    },
  };

  jest.spyOn(ethers.providers, "Web3Provider").mockImplementation(() => fakeWeb3Provider);
  let renderedContainer: undefined | RenderResult;
  act(() => {
    if (container !== null) {
      renderedContainer = renderTestComponent(container);
    }
  });

  sendSafeInfo();

  expect(renderedContainer).toBeTruthy();
  const ensEnabledElement = await screen.findByTestId("isEnsEnabled");
  expect(ensEnabledElement?.innerHTML).toBe("false");
});

/**
 * we render the test component twice with the same props and check, that the web3Provider functions get called only once.
 */
test("resolving an address and lookups are cached", async () => {
  const resolveName = jest.fn(async (name) => {
    if ((await name) === "test.eth") {
      return Promise.resolve(testData.addresses.receiver1);
    } else {
      return Promise.resolve(null);
    }
  });
  const lookupAddress = jest.fn(async (address) => {
    if ((await address) === testData.addresses.receiver1) {
      return Promise.resolve("test.eth");
    } else {
      return address;
    }
  });
  const fakeWeb3Provider: Partial<Web3Provider> = {
    getNetwork: () =>
      Promise.resolve({ chainId: 4, network: "rinkeby", _defaultProvider: () => null, name: "rinkeby" }),
    resolveName: (name) => resolveName(name),
    lookupAddress: (address) => lookupAddress(address),
  };

  jest.spyOn(ethers.providers, "Web3Provider").mockImplementation(() => fakeWeb3Provider as any);
  let renderedContainer;
  act(() => {
    if (container !== null) {
      renderedContainer = renderTestComponent(container, {
        addressesToLookup: [testData.addresses.receiver1, testData.addresses.receiver1],
        ensNamesToResolve: ["test.eth", "test.eth"],
      });
    }
  });

  sendSafeInfo();

  expect(renderedContainer).toBeTruthy();

  const resolvedNameElement = await screen.findAllByTestId("resolvedName");
  expect(resolvedNameElement.map((value) => value.innerHTML)).toEqual([
    testData.addresses.receiver1,
    testData.addresses.receiver1,
  ]);

  const lookedUpAddressElement = await screen.findAllByTestId("lookedUpAddress");
  expect(lookedUpAddressElement.map((value) => value.innerHTML)).toEqual(["test.eth", "test.eth"]);

  expect(lookupAddress).toHaveBeenCalledTimes(1);
  expect(resolveName).toHaveBeenCalledTimes(1);
});

/**
 * we render the test component twice with the same props and check, that the web3Provider functions get called twice
 * We want null lookups to not be cached because they can appear when there are some network errors and shouldn't cache that.
 */
test("null lookups are cached/ resolved addresses are not cached", async () => {
  const resolveName = jest.fn(async (name) => {
    return Promise.resolve(null);
  });
  const lookupAddress = jest.fn(async (address) => {
    return Promise.resolve(null);
  });
  const fakeWeb3Provider: Partial<Web3Provider> = {
    getNetwork: () =>
      Promise.resolve({ chainId: 4, network: "rinkeby", _defaultProvider: () => null, name: "rinkeby" }),
    resolveName: (name) => resolveName(name),
    lookupAddress: (address) => lookupAddress(address),
  };

  jest.spyOn(ethers.providers, "Web3Provider").mockImplementation(() => fakeWeb3Provider as any);
  let renderedContainer;
  act(() => {
    if (container !== null) {
      renderedContainer = renderTestComponent(container, {
        addressesToLookup: [testData.addresses.receiver3, testData.addresses.receiver3],
        ensNamesToResolve: ["unknown.eth", "unknown.eth"],
      });
    }
  });

  sendSafeInfo();

  expect(renderedContainer).toBeTruthy();

  const resolvedNameElement = await screen.findAllByTestId("resolvedName");
  expect(resolvedNameElement.map((value) => value.innerHTML)).toEqual(["", ""]);

  const lookedUpAddressElement = await screen.findAllByTestId("lookedUpAddress");
  expect(lookedUpAddressElement.map((value) => value.innerHTML)).toEqual(["", ""]);

  expect(lookupAddress).toHaveBeenCalledTimes(1);
  expect(resolveName).toHaveBeenCalledTimes(2);
});
