// @vitest-environment jsdom
import { ZstdInit } from "@oneidentity/zstd-js";
import "@vitest/web-worker";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
  vi,
} from "vitest";

import { WaitForSignals } from "utils/waitForSignals";

import { GcideDictionary } from "./GcideDictionary";
import { DictState } from "./IDictionary";

const testingDictData: Record<string, string[]> = {
  a: ["item a1", "item a2"],
  ward: ["ward"],
  warden: ["warden"],
  weird: ["weird"],
  word: ["item word"],
  // If below 100 bytes, @oneidentity/zstd-js will fail.
  padding: ["This structure needs to be padded to at least 100 bytes."],
};
Object.freeze(testingDictData);

async function getCompressedData(): Promise<Uint8Array> {
  const { ZstdSimple } = await ZstdInit();
  const uncompressed = new TextEncoder().encode(
    JSON.stringify(testingDictData),
  );
  return ZstdSimple.compress(uncompressed);
}

async function getTestingDataUrl() {
  const compressed = await getCompressedData();
  return "data:text/plain;base64," + btoa(String.fromCodePoint(...compressed));
}

describe("GcideDictionary mock data test", () => {
  let dataUrl = "";

  beforeAll(async () => {
    dataUrl = await getTestingDataUrl();
  });

  test("Data content", async () => {
    //@ts-expect-error Access private constructor.
    const dict: GcideDictionary = new GcideDictionary(dataUrl);

    expect(await dict.findWord("a")).toStrictEqual(testingDictData["a"]);
    expect(await dict.findWord("word")).toStrictEqual(testingDictData["word"]);

    // Empty array for word not found in the dictionary.
    expect(await dict.findWord("w")).toStrictEqual([]);
  });

  test("Pattern matching", async () => {
    //@ts-expect-error Access private constructor.
    const dict: GcideDictionary = new GcideDictionary(dataUrl);

    expect(await dict.patternMatch("w?rd")).toStrictEqual(["ward", "word"]);
    expect(await dict.patternMatch("w*rd")).toStrictEqual([
      "ward",
      "weird",
      "word",
    ]);
    expect(await dict.patternMatch("w?rd*")).toStrictEqual([
      "ward",
      "warden",
      "word",
    ]);

    expect(await dict.patternMatch("*no_match*")).toStrictEqual([]);
  });

  test("dictionary loads if there is no SharedWorker support", async () => {
    // Remove global.SharedWorker to emulate the lack of ShareWorker support.
    const realSharedWorker = SharedWorker;
    // @ts-expect-error Deletion of SharedWorker is a TS error.
    delete global.SharedWorker;

    //@ts-expect-error Access private constructor.
    const dict: GcideDictionary = new GcideDictionary(dataUrl);

    expect(await dict.findWord("a")).toStrictEqual(testingDictData["a"]);

    global.SharedWorker = realSharedWorker;
  });
});

describe("GcideDictionary network test", () => {
  let dataUrl = "";
  let mockFunc = vi.fn();
  const realFetch = global.fetch;

  beforeAll(async () => {
    dataUrl = await getTestingDataUrl();
  });

  beforeEach(() => {
    mockFunc = vi.fn();
    global.fetch = mockFunc;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  test("status codes should be correct", async () => {
    mockFunc.mockImplementation(async (input, init?) => {
      if (input === "mock") {
        await waiter.promise;
        return realFetch(dataUrl);
      }
      // Do real fetch to load other resources, e.g. wasm modules.
      return realFetch(input, init);
    });

    const waiter = new WaitForSignals();

    //@ts-expect-error Access private constructor.
    const dict: GcideDictionary = new GcideDictionary("mock");
    expect(dict.getState()).toBe(DictState.loading);
    waiter.signal();

    // Find a word to force dictionary initialization to finish.
    await dict.findWord("test");

    expect(dict.getState()).toBe(DictState.loaded);
  });

  test("retry if fail to load", async () => {
    // Mock function that causes fetch to fail.
    mockFunc.mockImplementation(async (input, init?) => {
      if (input === dataUrl) return realFetch("deadbeef");
      return realFetch(input, init);
    });

    //@ts-expect-error Access private constructor.
    const dict: GcideDictionary = new GcideDictionary(dataUrl);

    // Find a word to force dictionary initialization to finish.
    try {
      await dict.findWord("test");
    } catch (_) {
      /* Do nothing. */
    }

    expect(dict.getState()).toBe(DictState.retry);

    // First retry.
    await dict.findWord("test");
    expect(dict.getState()).toBe(DictState.retry);

    // Second retry. Fetch should succeed.
    mockFunc.mockImplementation(async (input, init?) => {
      return realFetch(input, init);
    });

    await dict.findWord("test");
    expect(dict.getState()).toBe(DictState.loaded);
  });

  test("request to dictionary data must be made with subresource integrity", async () => {
    let failed: boolean | string = false;

    mockFunc.mockImplementation(async (input: string, init?) => {
      if (input.startsWith("https://")) {
        if (!init?.integrity?.length || init?.integrity.length === 0) {
          failed = `No subresource integrity`;
        }
        return realFetch("data:text/plain,mock_data", init);
      }
      return realFetch(input, init);
    });

    //@ts-expect-error Access private constructor.
    const dict: GcideDictionary = new GcideDictionary();

    // Find a word to force dictionary initialization to finish.
    try {
      await dict.findWord("test");
    } catch (_) {
      /* Do nothing. Throwing is expected. */
    }

    expect(failed).toBeFalsy();
  });
});

describe("GcideDictionary actual data test", () => {
  test("find words the exist", async () => {
    const dict = GcideDictionary.get();
    for (const word of ["Test", "Study"]) {
      const entries = await dict.findWord(word);
      if (entries === null) throw "Must not be null";
      expectTypeOf(entries).toBeArray();
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((entry) => expectTypeOf(entry).toBeString());
    }
  });

  test("find words that does not exist", async () => {
    const dict = GcideDictionary.get();
    const word = "asdf;lkj";
    const entries = await dict.findWord(word);
    if (entries === null) throw "Must not be null";
    expectTypeOf(entries).toBeArray;
    expect(entries.length).toBe(0);
  });

  test("pattern match with matches", async () => {
    const dict = GcideDictionary.get();
    const entries = await dict.patternMatch("t?st");
    if (entries === null) throw "Must not be null";
    expectTypeOf(entries).toBeArray();
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry) => expectTypeOf(entry).toBeString());
  });

  test("pattern match with no match", async () => {
    const dict = GcideDictionary.get();
    const entries = await dict.patternMatch("?;z*;z?");
    if (entries === null) throw "Must not be null";
    expectTypeOf(entries).toBeArray;
    expect(entries.length).toBe(0);
  });
});
