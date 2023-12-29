import sanitizeHtml from "sanitize-html";

import { wordToUrl } from "utils/routerUrl";

import { DictState, type IDictionary } from "./IDictionary";
import workerUrl from "./worker.js?worker&url";
import type { MessageType } from "./worker.ts";

const gcideUrl =
  "https://cdn.jsdelivr.net/gh/lwchkg/hello-dict-data@c9208f18aeb218b9b2a7ad911def1e29c41088c4/gcide-0.51-cleaned.json.oneidzst";
const gcideIntegrity =
  "sha384-M6NIA0mb6JAC2nPnH+NllpKx5JL8+ZSc9hcKYqMf+XhambiFneWjI11K/LQeBje0";

const dictionaryLoadFailMsg = "Unable to load dictionary.";

let dict: GcideDictionary | null = null;

// prettier-ignore
const tagToClass = ["pos", "hw", "sn", "q", "it", "ant", "asp", "booki",
"causedby", "cnvto", "compof", "contr", "cref", "film", "fld", "itran",
"itrans", "abbr", "altname", "altnpluf", "ets", "etsep", "ex", "mark", "qex",
"sd", "ship", "source", "pluf", "uex", "isa", "mathex", "ratio", "singf",
"xlati", "tran", "tr", "iref", "figref", "ptcl", "title", "stype", "part",
"parts", "membof", "member", "members", "corr", "qperson", "prod", "prodmac",
"stage", "inv", "methodfor", "examp", "unit", "uses", "usedby", "perf",
"recipr", "sig", "wns", "w16ns", "spn", "kingdom", "phylum", "subphylum",
"class", "subclass", "ord", "subord", "suborder", "fam", "subfam", "gen", "var",
"varn", "qau", "au", "ety"];

function gcideTransformHtml(html: string): string {
  // Replace "<h2>[text1]</h2><br /><h2>[text2]</h2>" by
  // "<h2>[text1] | [text2]</h2>". Sanitize first because the html in the data
  // is not yet sanitized and may contain human errors.
  html = html
    .replace(/\[<source>/g, "<source1>[")
    .replace(/<\/source>]/g, "]</source1>");

  return sanitizeHtml(html, {
    allowedAttributes: { "*": ["class"], a: ["href"] },
    transformTags: {
      "*": function (tagName, attribs) {
        if (tagName === "a") {
          return {
            tagName,
            attribs: { ...attribs, href: wordToUrl(attribs.href) },
          };
        }
        if (tagName === "source1") {
          return { tagName: "span", attribs: { ...attribs, class: "source" } };
        }
        if (tagToClass.includes(tagName)) {
          return { tagName: "span", attribs: { ...attribs, class: tagName } };
        }
        return { tagName, attribs };
      },
    },
  })
    .replace(/<\/h2><br \/><h2>/g, " | ")
    .replace(/<br \/>/g, "")
    .replace(/<span class="sn">1\./g, '</p><p><span class="sn">1.');
}

export class GcideDictionary implements IDictionary {
  initListeners: (() => void)[] = [];
  port: Worker | SharedWorker["port"];
  readonly url: string = gcideUrl;
  worker: Worker | SharedWorker = SharedWorker
    ? new SharedWorker(new URL(workerUrl, import.meta.url), {
        type: "module",
        name: workerUrl,
      })
    : new Worker(new URL(workerUrl, import.meta.url), {
        type: "module",
      });
  workerListeners: (() => void)[] = [];
  #state: DictState = DictState.uninitialized;

  private constructor(testingDictUrl?: string) {
    this.port =
      this.worker instanceof SharedWorker ? this.worker.port : this.worker;
    if (testingDictUrl) this.url = testingDictUrl;
    this.#initDict();
  }

  static get(): GcideDictionary {
    if (dict === null) dict = new GcideDictionary();
    return dict;
  }

  async findWord(word: string): Promise<string[] | null> {
    if (
      this.#state === DictState.uninitialized ||
      this.#state === DictState.retry ||
      this.#state === DictState.loaded
    ) {
      return this.#findWordInner(word);
    }

    if (this.#state === DictState.permaError) {
      throw new Error(dictionaryLoadFailMsg);
    }

    return new Promise((resolve, reject) => {
      this.initListeners.push(() => {
        if (this.#state === DictState.loaded) {
          resolve(this.#findWordInner(word));
        } else {
          reject(new Error(dictionaryLoadFailMsg));
        }
      });
    });
  }

  getState(): DictState {
    return this.#state;
  }

  async patternMatch(pattern: string): Promise<string[] | null> {
    if (
      this.#state === DictState.uninitialized ||
      this.#state === DictState.retry ||
      this.#state === DictState.loaded
    ) {
      return this.#patternMatchInner(pattern);
    }

    if (this.#state === DictState.permaError) {
      throw new Error(dictionaryLoadFailMsg);
    }

    return new Promise((resolve, reject) => {
      this.initListeners.push(() => {
        if (this.#state === DictState.loaded) {
          resolve(this.#patternMatchInner(pattern));
        } else {
          reject(new Error(dictionaryLoadFailMsg));
        }
      });
    });
  }

  async #findWordInner(word: string): Promise<string[] | null> {
    if (
      this.#state === DictState.uninitialized ||
      this.#state === DictState.retry
    )
      await this.#initDict();

    if (this.#state !== DictState.loaded) return null;

    if (this.port.onmessage) {
      await new Promise<void>((resolve) => {
        this.workerListeners.push(() => resolve());
      });
    }
    return await new Promise<string[]>((resolve) => {
      this.port.onmessage = (msg: MessageEvent<string[]>) => {
        resolve(msg.data.map(gcideTransformHtml));
        this.#maybeSendNextWorkerMessage();
      };

      this.port.postMessage({ action: "find", word });
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

      const msg: MessageType = {
        action: "init",
        url: this.url,
      };
      if (this.url == gcideUrl) msg.integrity = gcideIntegrity;

      if (this.port.onmessage) {
        await new Promise<void>((resolve) => {
          this.workerListeners.push(() => resolve());
        });
      }
      await new Promise<void>((resolve, reject) => {
        this.port.onmessage = (msg: MessageEvent<boolean | Error>) => {
          if (msg.data === true) {
            resolve();
          } else {
            reject(msg.data);
          }
          this.#maybeSendNextWorkerMessage();
        };

        this.port.postMessage(msg);
      });
      this.#state = DictState.loaded;
    } catch (e) {
      this.#state = DictState.retry;
    }

    this.initListeners.forEach((l) => l());
    this.initListeners = [];
  }

  #maybeSendNextWorkerMessage(): void {
    if (this.workerListeners.length == 0) this.port.onmessage = null;
    else this.workerListeners.shift()!();
  }

  async #patternMatchInner(pattern: string): Promise<string[] | null> {
    if (
      this.#state === DictState.uninitialized ||
      this.#state === DictState.retry
    )
      await this.#initDict();

    if (this.#state !== DictState.loaded) return null;

    if (this.port.onmessage) {
      await new Promise<void>((resolve) => {
        this.workerListeners.push(() => resolve());
      });
    }
    return await new Promise<string[]>((resolve) => {
      this.port.onmessage = (msg: MessageEvent<string[]>) => {
        resolve(msg.data.map(gcideTransformHtml));
        this.#maybeSendNextWorkerMessage();
      };

      this.port.postMessage({ action: "pattern_match", pattern });
    });
  }
}
