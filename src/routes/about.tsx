import { setTitleWithPrefix } from "utils/setTitle";

export function About() {
  setTitleWithPrefix();
  return (
    <>
      <h1>Hello Dict</h1>
      <p>
        Dictionary coded in React.js. Just type in the word in the box and
        search.
      </p>
      <p>Coded with ❤️ by WC Leung.</p>
      <h2>Credits</h2>
      <p>
        Dictionary data from{" "}
        <a href="https://gcide.gnu.org.ua/">
          GNU Collaborative International Dictionary of English
        </a>
        , version 0.51.
      </p>
    </>
  );
}
