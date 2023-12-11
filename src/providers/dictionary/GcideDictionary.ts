import gcideUrl from "assets/gcide-0.51.json?url";
import { DictState, IDictionarySync } from "./IDictionary";
import { toKey } from "./util_dictionary";
import sanitizeHtml from "sanitize-html";

const dicts: Map<string, GcideDictionary> = new Map();

function gcideTransformHtml(html: string): string {
  // Replace "<h2>[text1]</h2><br /><h2>[text2]</h2>" by
  // "<h2>[text1] | [text2]</h2>". Sanitize first because the html in the data
  // is not yet sanitized and may contain human errors.
  return sanitizeHtml(html, {
    allowedAttributes: { a: [] },
  }).replace("</h2><br /><h2>", " | ");
}

export class GcideDictionary implements IDictionarySync {
  jsonData: { [x: string]: string[] } = {};
  listeners: (() => void)[] = [];
  mapping: Map<string, string[]> = new Map();
  url: string = "";

  #state: DictState = DictState.uninitialized;

  private constructor(url: string) {
    this.url = url;
    this.#initDict();
  }

  static get(url: string = gcideUrl): GcideDictionary {
    if (!dicts.has(url)) dicts.set(url, new GcideDictionary(url));
    return dicts.get(url)!;
  }

  async findWord(word: string): Promise<string[] | null> {
    if (this.#state === DictState.loaded)
      return Promise.resolve(this.findWordSync(word));
    if (this.#state === DictState.permaError)
      return Promise.reject("Unable to load dictionary.");

    return new Promise((resolve, reject) => {
      this.listeners.push(() => {
        if (this.#state === DictState.loaded) resolve(this.findWordSync(word));
        else reject("Unable to load dictionary.");
      });
    });
  }

  findWordSync(word: string): string[] | null {
    if (
      this.#state === DictState.uninitialized ||
      this.#state === DictState.retry
    )
      this.#initDict();

    if (this.#state !== DictState.loaded) return null;

    const key = toKey(word);

    const result: string[] = [];
    this.mapping.get(key)?.forEach((entry) => {
      result.push(...this.jsonData[entry].map(gcideTransformHtml));
    });
    return result;
  }

  getState(): DictState {
    return this.#state;
  }

  private async generateMapping(): Promise<void> {
    Object.keys(this.jsonData).forEach((word: string) => {
      const key = toKey(word);
      if (!this.mapping.has(key)) this.mapping.set(key, [word]);
      else this.mapping.get(key)?.push(word);
    });
  }

  async #initDict(): Promise<void> {
    if (
      this.#state === DictState.loading ||
      this.#state === DictState.loaded ||
      this.#state === DictState.permaError
    )
      return;

    try {
      this.#state = DictState.loading;
      const response = await fetch(this.url);
      console.log("Read data.");
      this.jsonData = await response.json();
      console.log("Parsed data.");
      await this.generateMapping();
      this.#state = DictState.loaded;
      console.log("Generated index.");
    } catch (e) {
      console.log(e);
      this.#state = DictState.retry;
    }

    this.listeners.forEach((l) => l());
    this.listeners = [];
    return;
  }
}
