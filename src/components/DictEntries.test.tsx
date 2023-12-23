// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@vitest/web-worker";
import { DictState, IDictionary } from "providers/dictionary/IDictionary";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { DictEntries } from "./DictEntries";

vi.mock("providers/dictionary/GcideDictionary", () => {
  class MockDict implements IDictionary {
    static get(): MockDict {
      return new MockDict();
    }

    async findWord(word: string): Promise<string[]> {
      if (word === "Study") return ["1", "2"];
      if (word === "Hello") return ["3"];
      return [];
    }

    getState(): DictState {
      return DictState.loaded;
    }

    async patternMatch(): Promise<string[]> {
      return [];
    }
  }

  return { GcideDictionary: MockDict };
});

describe("DictEntries component test", () => {
  beforeEach(() => {});

  afterEach(() => {
    cleanup();
  });

  test("Rendering of DictEntries", async () => {
    const { rerender } = render(<DictEntries word="Study" />);
    await screen.findAllByText("1");
    await screen.findAllByText("2");

    rerender(<DictEntries word="Hello" />);
    await screen.findAllByText("3");
    // Old text replaced.
    expect(async () => screen.getAllByText("1")).rejects.toThrowError();
  });
});
