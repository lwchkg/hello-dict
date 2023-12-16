import { GcideDictionary } from "providers/dictionary/GcideDictionary";
import sanitizeHtml from "sanitize-html";

import { reactPromise } from "utils/reactPromise";

const cache = new Map<string, Promise<string[] | null>>();
const dict = GcideDictionary.get();

// The dictionary query must be cached for the promise to work.
function getCachedWords(word: string): Promise<string[] | null> {
  if (!cache.has(word)) cache.set(word, dict.findWord(word));
  return cache.get(word)!;
}

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedAttributes: { a: ["href", "name", "target"] },
  });
}

export function DictEntries({ word }: { word: string }) {
  if (word === "") {
    return (
      <div className="dict-result">
        <p>Type word and press Enter...</p>
      </div>
    );
  }

  const definitions = reactPromise(getCachedWords(word)) as string[] | null;

  if (definitions === null) {
    return (
      <div className="dict-result">
        <p>Unable to load dictionary.</p>
      </div>
    );
  }

  if (definitions.length === 0) {
    return (
      <div className="dict-result">
        <p>Unable to find {word}.</p>
      </div>
    );
  }

  return (
    <div className="dict-result">
      {definitions.map((def, i) => (
        <div
          className="dict-item"
          key={i}
          dangerouslySetInnerHTML={{ __html: sanitize(def) }}
        />
      ))}
    </div>
  );
}
