import SafeProvider from "@gnosis.pm/safe-apps-react-sdk";
import { render, RenderResult, screen } from "@testing-library/react";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";

import { useEnsResolver } from "../../hooks/ens";
import { sendSafeInfo, setupMocksForSafeProvider } from "../../test/safeUtil";

/**
 * Small component which executes some hook functions and tracks them
 * @returns
 */
const TestENSComponent = (): JSX.Element => {
  const ensResolver = useEnsResolver();
  const [isEnabled, setIsEnabled] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    ensResolver.isEnsEnabled().then((result) => {
      act(() => {
        setIsEnabled(result);
      });
    });
  }, [ensResolver]);

  return typeof isEnabled !== "undefined" ? <div data-testid="isEnsEnabled">{isEnabled.toString()}</div> : <></>;
};

const renderTestComponent = (container: HTMLElement) =>
  render(
    <SafeProvider loader={<div>loading...</div>}>
      <TestENSComponent />
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
  // cleanup on exiting
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
