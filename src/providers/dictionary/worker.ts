import { ZstdInit } from "@oneidentity/zstd-js/wasm/decompress";

import { toKey } from "./util_dictionary";

type InitMessageType = {
  action: "init";
  integrity?: string;
  url: string;
};

type FindWordMessageType = {
  action: "find";
  word: string;
};

type PatternMatchMessageType = {
  action: "pattern_match";
  pattern: string;
};

export type MessageType =
  | InitMessageType
  | FindWordMessageType
  | PatternMatchMessageType;

type dictRecord = Record<string, string[]>;

let initialized = false;
let jsonData: dictRecord;
const mapping = new Map<string, string[]>();
const wordList: string[] = [];

function generateMappingAndWordList(jsonData: dictRecord): void {
  Object.keys(jsonData).forEach((word: string) => {
    const key = toKey(word);
    if (!mapping.has(key)) {
      mapping.set(key, [word]);
      wordList.push(word.toLowerCase());
    } else {
      mapping.get(key)?.push(word);
    }
  });
}

async function init(url: string, integrity?: string) {
  // Start initializing module before fetching data to take advantage of
  // parallelism.
  const zstdPromise = ZstdInit();

  console.time("Fetch data");
  let compressed: Uint8Array;
  try {
    const response = integrity
      ? await fetch(url, { cache: "force-cache", integrity })
      : await fetch(url);
    compressed = new Uint8Array(await response.arrayBuffer());
  } catch (e) {
    postMessage(e);
    return;
  }
  console.timeEnd("Fetch data");

  const { ZstdSimple } = await zstdPromise;

  console.time("Decompress data");
  const jsonByteArray = ZstdSimple.decompress(compressed);
  console.timeEnd("Decompress data");

  console.time("Convert to string");
  const jsonString = new TextDecoder().decode(jsonByteArray);
  console.timeEnd("Convert to string");

  console.time("JSON parse");
  jsonData = JSON.parse(jsonString);
  console.timeEnd("JSON parse");

  console.time("Generate index");
  generateMappingAndWordList(jsonData);
  console.timeEnd("Generate index");

  initialized = true;

  self.postMessage(true);
}

function findWord(word: string): void {
  if (!initialized) throw "Not initialized.";

  const key = toKey(word);

  const result: string[] = [];
  mapping.get(key)?.forEach((entry) => {
    result.push(...jsonData[entry]);
  });
  self.postMessage(result);
}

function patternMatch(pattern: string): void {
  if (!initialized) throw "Not initialized.";

  // Replace "*" by ".*", "?" by ".", prepend "\" for all other special chars.
  const transformed = pattern
    .toLowerCase()
    .replace(/[/\\^$.|?*+()[\]{}]/g, (c) =>
      c === "*" ? ".*" : c === "?" ? "." : "\\" + c,
    );
  const re = RegExp(`^${transformed}$`);

  self.postMessage(wordList.filter((word) => re.test(word)));
}

self.onmessage = (msg: MessageEvent<MessageType>) => {
  if (msg.data.action === "init") {
    init(msg.data.url, msg.data.integrity);
  } else if (msg.data.action === "find") {
    findWord(msg.data.word);
  } else if (msg.data.action === "pattern_match") {
    patternMatch(msg.data.pattern);
  } else {
    throw "Unimplemented.";
  }
};
