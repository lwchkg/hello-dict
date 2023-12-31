import "App.less";
import { GcideDictionary } from "providers/dictionary/GcideDictionary";
import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { About } from "routes/about";
import { Search } from "routes/search";
import { Word } from "routes/word";

import { DarkModeToggle } from "components/DarkModeToggle";

import { patternToUrl, wordToUrl } from "utils/routerUrl";

import AppLogo from "assets/hello-dict-icon.svg?react";

function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<About />}></Route>
        <Route path="/about" element={<About />}></Route>
        <Route path="/word/:word" element={<Word />}></Route>
        <Route path="/search/:pattern" element={<Search />}></Route>
        <Route path="*" element={<About />}></Route>
      </Routes>
    </HashRouter>
  );
}

function getUrlFromSearchText(text: string) {
  if (text === "") return "#";
  if (/[?*]/.test(text)) return patternToUrl(text);
  return wordToUrl(text);
}

function App() {
  const [word, setWord] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setWord(e.target.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    window.location.assign(getUrlFromSearchText(word));
    e.preventDefault();
  }

  useEffect(() => {
    GcideDictionary.get();
  }, []);

  return (
    <>
      <header>
        <span className="logo">
          <AppLogo />
        </span>
        <DarkModeToggle />
        <form className="word-input" onSubmit={handleSubmit}>
          <input
            placeholder="Search the dictionary..."
            onChange={handleChange}
            value={word}
          />
          <button type="submit" aria-label="submit">
            &gt;
          </button>
        </form>
      </header>
      <main>
        <Router />
      </main>
    </>
  );
}

export default App;
