import { Suspense, useDeferredValue } from "react";
import { useParams } from "react-router-dom";

import { DictLoadingFallback } from "components/DictLoadingFallback";
import { SearchResult } from "components/SearchResult";

import { setTitleWithPrefix } from "utils/setTitle";

export function Search() {
  let { pattern } = useParams();
  if (!pattern) pattern = "";

  const deferredterm = useDeferredValue(pattern);
  setTitleWithPrefix(deferredterm);
  return (
    <Suspense fallback={DictLoadingFallback()}>
      <SearchResult pattern={deferredterm} />
    </Suspense>
  );
}
