import { GcideDictionary } from "providers/dictionary/GcideDictionary";
import { Fragment } from "react";

import { reactPromise } from "utils/reactPromise";
import { wordToUrl } from "utils/routerUrl";

const maxMatches = 1000;

let cache: {
  pattern?: string;
  result?: Promise<string[] | null>;
} = {};

// The dictionary query must be cached for the promise to work.
function getCachedSearchResults(pattern: string): Promise<string[] | null> {
  if (!cache || cache.pattern !== pattern) {
    cache = {
      pattern,
      result: GcideDictionary.get().patternMatch(pattern),
    };
  }
  return cache.result!;
}

export function SearchResult({ pattern }: { pattern: string }) {
  if (pattern === "") {
    return (
      <div className="dict-result">
        <p>Type search pattern and press Enter...</p>
      </div>
    );
  }

  let matches = reactPromise(getCachedSearchResults(pattern));

  if (matches === null) {
    return (
      <div className="dict-result">
        <p>Unable to load dictionary.</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="dict-result">
        <p>There is no word matching {pattern}.</p>
      </div>
    );
  }

  const numMatches = matches.length;

  if (matches.length > maxMatches) {
    matches = matches.slice(0, maxMatches);
  }

  return (
    <div className="dict-result">
      {numMatches > maxMatches ? (
        <p>
          Displaying the first {maxMatches} out of {numMatches} matches:
        </p>
      ) : (
        <p>There are {numMatches} matches:</p>
      )}
      {matches.map((word, i) => (
        <Fragment key={word + i.toString()}>
          <a className="search-result" href={wordToUrl(word)}>
            {word}
          </a>{" "}
        </Fragment>
      ))}
      {numMatches > maxMatches ? "..." : null}
    </div>
  );
}
