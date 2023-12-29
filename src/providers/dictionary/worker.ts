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

type PortType = {
  postMessage: (msg: unknown) => void;
};

type dictRecord = Record<string, string[]>;

enum InitStatus {
  NotInitailized,
  Initializing,
  Initialized,
}

let initialized = InitStatus.NotInitailized;
const initListeners: (() => void)[] = [];
let error: Error = new Error(""); // The error to return if init failed.
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

async function init(port: PortType, url: string, integrity?: string) {
  if (initialized == InitStatus.Initialized) {
    port.postMessage(true);
    return;
  }

  if (initialized == InitStatus.Initializing) {
    await new Promise((resolve) => {
      initListeners.push(() => {
        resolve(true);
      });
    });
    // @ts-expect-error The value of initialized is expected to be changed.
    port.postMessage(initialized === InitStatus.Initialized ? true : error);
    return;
  }

  initialized = InitStatus.Initializing;

  try {
    // Start initializing module before fetching data to take advantage of
    // parallelism.
    const zstdPromise = ZstdInit();

    console.time("Fetch data");
    const response = integrity
      ? await fetch(url, { cache: "force-cache", integrity })
      : await fetch(url);
    const compressed = new Uint8Array(await response.arrayBuffer());
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

    initialized = InitStatus.Initialized;
    port.postMessage(true);
  } catch (e) {
    error = e as Error;
    initialized = InitStatus.NotInitailized;
    port.postMessage(e);
  }

  initListeners.forEach((fn) => {
    fn();
  });
}

function findWord(port: PortType, word: string): void {
  if (!initialized) throw "Not initialized.";

  const key = toKey(word);

  const result: string[] = [];
  mapping.get(key)?.forEach((entry) => {
    result.push(...jsonData[entry]);
  });
  port.postMessage(result);
}

function patternMatch(port: PortType, pattern: string): void {
  if (!initialized) throw "Not initialized.";

  // Replace "*" by ".*", "?" by ".", prepend "\" for all other special chars.
  const transformed = pattern
    .toLowerCase()
    .replace(/[/\\^$.|?*+()[\]{}]/g, (c) =>
      c === "*" ? ".*" : c === "?" ? "." : "\\" + c,
    );
  const re = RegExp(`^${transformed}$`);

  port.postMessage(wordList.filter((word) => re.test(word)));
}

function onmessageHandler(port: PortType, msg: MessageEvent<MessageType>) {
  if (msg.data.action === "init") {
    init(port, msg.data.url, msg.data.integrity);
  } else if (msg.data.action === "find") {
    findWord(port, msg.data.word);
  } else if (msg.data.action === "pattern_match") {
    patternMatch(port, msg.data.pattern);
  } else {
    throw "Unimplemented.";
  }
}

if (self.onconnect === null) {
  self.onconnect = (event: MessageEvent<MessageType>) => {
    const port = event.ports[0];
    port.onmessage = (msg: MessageEvent<MessageType>) => {
      onmessageHandler(port, msg);
    };
  };
} else {
  self.onmessage = (msg: MessageEvent<MessageType>) => {
    onmessageHandler(self, msg);
  };
}
