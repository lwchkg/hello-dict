import { describe, expect, test } from "vitest";

import { WaitForSignals } from "./waitForSignals";

describe("waitForSignals", (): void => {
  test("resolves immediately if the number of signals is zero.", async () => {
    const waiter = new WaitForSignals(0);
    await waiter.promise;
  });

  test("resolves after set number of signals has been sent.", async () => {
    const waiter = new WaitForSignals(2);

    const promise = waiter.promise.then(() => {
      // The counter here must match the expected number of signals.
      expect(waiter.getCount()).toBe(2);
    });

    // Execute emptyAwait to allow the Promise.then to execute.
    const emptyAwait = async () => {};

    waiter.signal();
    await emptyAwait();

    waiter.signal();
    await emptyAwait();

    waiter.signal();
    await emptyAwait();

    await promise;
  });

  test("rejects if fail is called.", async (): Promise<void> => {
    const waiter = new WaitForSignals();
    waiter.fail(new Error("Foo"));
    await expect(waiter.promise).rejects.toThrowError("Foo");
  });

  test("rejects if fail is called before waiter has finished.", async (): Promise<void> => {
    const waiter = new WaitForSignals(2);
    waiter.signal();
    waiter.fail(new Error("Foo"));
    await expect(waiter.promise).rejects.toThrowError("Foo");
  });

  test("calling fail after the waiter has finished does not do anything.", async () => {
    const waiter = new WaitForSignals();
    waiter.signal();
    waiter.fail();
    await waiter.promise;
  });

  test("getCount returns the current count of received signals.", async () => {
    const waiter = new WaitForSignals(2);

    expect(waiter.getCount()).toBe(0);

    waiter.signal();
    expect(waiter.getCount()).toBe(1);

    waiter.signal();
    expect(waiter.getCount()).toBe(2);

    // getCount should increase even if more than enough signals are sent.
    waiter.signal();
    expect(waiter.getCount()).toBe(3);
  });
});
