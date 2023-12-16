import { Suspense } from "react";
import { useParams } from "react-router-dom";

import { DictEntries } from "components/DictEntries";

export function Word() {
  let { word } = useParams();
  if (!word) word = "";
  return (
    <Suspense fallback={<p>Loading dictionary...</p>}>
      <DictEntries word={word} />
    </Suspense>
  );
}
