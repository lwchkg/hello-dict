import { Suspense, useDeferredValue } from "react";
import { useParams } from "react-router-dom";

import { DictEntries } from "components/DictEntries";
import { DictLoadingFallback } from "components/DictLoadingFallback";

import { setTitleWithPrefix } from "utils/setTitle";

export function Word() {
  let { word } = useParams();
  if (!word) word = "";

  const deferredWord = useDeferredValue(word);
  setTitleWithPrefix(deferredWord);
  return (
    <Suspense fallback={DictLoadingFallback()}>
      <DictEntries word={deferredWord} />
    </Suspense>
  );
}
