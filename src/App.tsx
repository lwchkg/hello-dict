import "App.css";
import { GcideDictionary } from "providers/dictionary/GcideDictionary";
import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { About } from "routes/about";
import { Word } from "routes/word";

import AppLogo from "assets/hello-dict-icon.svg?react";

function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<About />}></Route>
        <Route path="/about" element={<About />}></Route>
        <Route path="/word/:word" element={<Word />}></Route>
      </Routes>
    </HashRouter>
  );
}

function App() {
  const [word, setWord] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setWord(e.target.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    window.location.assign("#/word/" + encodeURIComponent(word));
    e.preventDefault();
  }

  useEffect(() => {
    GcideDictionary.get();
  }, []);

  return (
    <>
      <span className="logo">
        <AppLogo />
      </span>
      <form className="word-input" onSubmit={handleSubmit}>
        <input
          placeholder="Search the dictionary..."
          onChange={handleChange}
          value={word}
        />
        <button type="submit">&gt;</button>
      </form>
      <main>
        <Router />
      </main>
    </>
  );
}

export default App;
