import { useEffect, useState } from "react";

import "./DarkModeToggle.css";

function getSystemPrefersLight() {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function getIsLight() {
  const localStorageColorScheme = localStorage.getItem("color-scheme");
  if (localStorageColorScheme !== null) {
    return localStorageColorScheme === "light";
  }
  return getSystemPrefersLight();
}

function setBrowserIsLight(isLight: boolean) {
  const classList = document.firstElementChild!.classList;
  if (isLight === getSystemPrefersLight()) {
    classList.remove("dark-mode");
    classList.remove("light-mode");
    localStorage.removeItem("color-scheme");
  } else if (isLight) {
    classList.remove("dark-mode");
    classList.add("light-mode");
    localStorage.setItem("color-scheme", "light");
  } else {
    classList.add("dark-mode");
    classList.remove("light-mode");
    localStorage.setItem("color-scheme", "dark");
  }
}

export function DarkModeToggle() {
  const [isLight, setIsLight] = useState(getIsLight());

  useEffect(() => {
    const localStorageColorScheme = localStorage.getItem("color-scheme");
    if (localStorageColorScheme !== null) {
      document.firstElementChild!.classList.add(
        (localStorageColorScheme === "light" ? "light" : "dark") + "-mode",
      );
    }

    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (e) => {
        setIsLight(e.matches);
        setBrowserIsLight(e.matches);
      });
  }, []);

  function handleClick() {
    const nextIsLight = !isLight;
    setIsLight(nextIsLight);
    setBrowserIsLight(nextIsLight);
  }

  return (
    <button
      onClick={handleClick}
      className="material-symbols-outlined dark-mode-toggle"
      aria-label="Dark mode toggle"
    >
      {isLight ? "\ue51c" : "\ue518"}
    </button>
  );
}
