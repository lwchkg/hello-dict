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
});

describe("GcideDictionary slow fetch test", () => {
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
});

describe("GcideDictionary actual data test", () => {
  test("searchable words", async () => {
    const dict = GcideDictionary.get();
    for (const word of ["Test", "Study"]) {
      const entries = await dict.findWord(word);
      if (entries === null) throw "Must not be null";
      expectTypeOf(entries).toBeArray();
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((entry) => expectTypeOf(entry).toBeString());
    }
  });

  test("unserachable words", async () => {
    const dict = GcideDictionary.get();
    const word = "asdf;lkj";
    const entries = await dict.findWord(word);
    if (entries === null) throw "Must not be null";
    expectTypeOf(entries).toBeArray;
    expect(entries.length).toBe(0);
  });
});
