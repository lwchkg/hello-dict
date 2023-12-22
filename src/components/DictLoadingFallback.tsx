import { useEffect, useState } from "react";

export function DictLoadingFallback() {
  const pause = 100;
  const [isShowing, setIsShowing] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setIsShowing(true);
    }, pause);
  }, []);
  return isShowing ? <p>Loading dictionary...</p> : null;
}
