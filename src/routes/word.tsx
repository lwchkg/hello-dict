import { Suspense, useDeferredValue, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { DictEntries } from "components/DictEntries";

function Fallback() {
  const pause = 100;
  const [isShowing, setIsShowing] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setIsShowing(true);
    }, pause);
  }, []);
  return isShowing ? <p>Loading dictionary...</p> : null;
}

export function Word() {
  let { word } = useParams();
  if (!word) word = "";

  const deferredWord = useDeferredValue(word);
  return (
    <Suspense fallback={Fallback()}>
      <DictEntries word={deferredWord} />
    </Suspense>
  );
}
