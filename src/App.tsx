import { Suspense, useEffect, useState } from "react";

import "App.css";
import { DictEntries } from "components/DictEntries";
import { GcideDictionary } from "providers/dictionary/GcideDictionary";

function App() {
  const [word, setWord] = useState("");
  const [savedWord, setSavedWord] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setWord(e.target.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    setSavedWord(word);
    e.preventDefault();
  }

  useEffect(() => {
    GcideDictionary.get();
  }, []);

  return (
    <>
      <span className="logo">GCIDE dictionary</span>
      <form className="word-input" onSubmit={handleSubmit}>
        <input
          placeholder="Search the dictionary..."
          onChange={handleChange}
          value={word}
        />
        <button type="submit">&gt;</button>
      </form>
      <Suspense fallback={<p>Loading dictionary...</p>}>
        <DictEntries word={savedWord} />
      </Suspense>
    </>
  );
}

export default App;
