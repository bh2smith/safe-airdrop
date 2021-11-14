// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";
import "@testing-library/react";

// we have to mock some crypto functionality of the browser window for the gnosis safe mocks
import crypto from "crypto";

function getRandomValues(buf: Uint8Array) {
  if (!(buf instanceof Uint8Array)) {
    throw new TypeError("expected Uint8Array");
  }
  if (buf.length > 65536) {
    const e = new Error();
    e.message =
      "Failed to execute 'getRandomValues' on 'Crypto': The " +
      "ArrayBufferView's byte length (" +
      buf.length +
      ") exceeds the " +
      "number of bytes of entropy available via this API (65536).";
    e.name = "QuotaExceededError";
    throw e;
  }
  const bytes = crypto.randomBytes(buf.length);
  buf.set(bytes);
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.crypto = { getRandomValues };
