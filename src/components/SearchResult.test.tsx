// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@vitest/web-worker";
import { DictState, IDictionary } from "providers/dictionary/IDictionary";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { wordToUrl } from "utils/routerUrl";

import { SearchResult } from "./SearchResult";

const mockPatterns: Record<string, string[]> = {
  "s?t": ["sat", "set", "sit", "sot"],
  "t?st": ["test", "tost"],
};

vi.mock("providers/dictionary/GcideDictionary", () => {
  class MockDict implements IDictionary {
    static get(): MockDict {
      return new MockDict();
    }

    async findWord(): Promise<string[]> {
      return [];
    }

    getState(): DictState {
      return DictState.loaded;
    }

    async patternMatch(pattern: string): Promise<string[]> {
      if (Object.prototype.hasOwnProperty.call(mockPatterns, pattern)) {
        return mockPatterns[pattern];
      }
      return [];
    }
  }

  return { GcideDictionary: MockDict };
});

describe("SearchResult component test", () => {
  beforeEach(() => {});

  afterEach(() => {
    cleanup();
  });

  test("Rendering of SearchResult", async () => {
    const { rerender } = render(<SearchResult pattern="s?t" />);
    await screen.findByText(mockPatterns["s?t"][0]);
    mockPatterns["s?t"].map((word) => {
      expect(
        screen.getByText(word).attributes.getNamedItem("href")?.value,
      ).toBe(wordToUrl(word));
    });

    rerender(<SearchResult pattern="t?st" />);
    await screen.findByText(mockPatterns["t?st"][0]);
    mockPatterns["t?st"].map((word) => {
      expect(
        screen.getByText(word).attributes.getNamedItem("href")?.value,
      ).toBe(wordToUrl(word));
    });
  });
});
