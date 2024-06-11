import { PostMessageOptions, SafeInfo } from "@safe-global/safe-apps-sdk";
import React from "react";
import { act } from "react-dom/test-utils";

import { testData } from "./util";

let lastRegisteredEventHandler;
let lastTrackedParentRequestID: string | undefined;

/**
 * Registers mocks to specific window events and the useEffect hook in order to capture the postMessage call to the parent window (gnosis safe).
 *
 * After rendering the SafeProvider the test has to invoke sendSafeInfo to mock send a gnosis safe to the SafeProvider using the captured values.
 *
 * @see sendSafeInfo
 */
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
};

/**
 * Mocks a MessageEvent by calling the previously registered handler.
 * This MessageEvent includes the SafeInfo and some required meta information.
 *
 * @param safeInfo Optional Safe Info data which should be sent to the SafeProvider. By default its the dummySafeInfo from testData.
 */
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
