import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import React from "react";
import { act } from "react-dom/test-utils";

import { testData } from "./util";

let lastRegisteredEventHandler;
let lastTrackedParentRequestID: string | undefined;

export const setupMocksForSafeProvider = () => {
  let postMessageSpy: jest.SpyInstance<void, [message: any, options?: PostMessageOptions]>;
  let useEffectSpy: jest.SpyInstance<void, [effect: React.EffectCallback, deps?: React.DependencyList | undefined]>;

  useEffectSpy = jest.spyOn(React, "useEffect");
  useEffectSpy.mockImplementation((f) => f());
  postMessageSpy = jest.spyOn(window.parent, "postMessage");

  postMessageSpy.mockImplementation((message: any, options?: PostMessageOptions): Promise<SafeInfo | undefined> => {
    if (message.method === "getSafeInfo") {
      lastTrackedParentRequestID = message.id;
      return Promise.resolve(testData.dummySafeInfo);
    }
    return Promise.reject("Implementation not mocked");
  });

  jest.spyOn(window, "addEventListener").mockImplementationOnce((event, handler) => {
    if (event === "message") {
      lastRegisteredEventHandler = handler;
    }
  });
  return "test";
};

export const sendSafeInfo = (safeInfo: SafeInfo = testData.dummySafeInfo) => {
  act(() => {
    // we now send the a fake SafeInfo Object to the Safe Provider
    lastRegisteredEventHandler({
      data: { ...safeInfo, version: "1.0", id: lastTrackedParentRequestID, success: true },
      source: window.parent,
      origin: "*",
    });
  });
};
