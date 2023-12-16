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

export type MessageType = InitMessageType | FindWordMessageType;

type dictRecord = Record<string, string[]>;

function generateMapping(jsonData: dictRecord): Map<string, string[]> {
  const mapping = new Map();

  Object.keys(jsonData).forEach((word: string) => {
    const key = toKey(word);
    if (!mapping.has(key)) mapping.set(key, [word]);
    else mapping.get(key)?.push(word);
  });

  return mapping;
}

let initialized = false;
let jsonData: dictRecord;
let mapping: Map<string, string[]>;

async function init(url: string, integrity?: string) {
  let compressed: Uint8Array;
  try {
    const response = integrity
      ? await fetch(url, { cache: "force-cache", integrity })
      : await fetch(url);

    console.log("Read data.");
    compressed = new Uint8Array(await response.arrayBuffer());
  } catch (e) {
    postMessage(e);
    return;
  }
  const { ZstdSimple } = await ZstdInit();

  const jsonByteArray = ZstdSimple.decompress(compressed);
  const jsonString = new TextDecoder().decode(jsonByteArray);
  jsonData = JSON.parse(jsonString);

  console.log("Parsed data.");
  mapping = generateMapping(jsonData);
  console.log("Generated index.");

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

self.onmessage = (msg: MessageEvent<MessageType>) => {
  if (msg.data.action === "init") {
    init(msg.data.url, msg.data.integrity);
  } else if (msg.data.action === "find") {
    findWord(msg.data.word);
  } else {
    throw "Unimplemented.";
  }
};
