import { decompressSync } from "fflate";

export interface PngTextChunk {
  keyword: string;
  value: string;
}

export function parseITxt(data: Uint8Array): PngTextChunk {
  const decoder = new TextDecoder("utf-8");
  let i = 0;

  while (i < data.length && data[i] !== 0) i++;
  const keyword = decoder.decode(data.slice(0, i));
  i++;

  if (i >= data.length) {
    return { keyword, value: "" };
  }

  const compressionFlag = data[i];
  i++;

  if (i >= data.length) {
    return { keyword, value: "" };
  }

  const compressionMethod = data[i];
  i++;

  while (i < data.length && data[i] !== 0) i++;
  i++;

  while (i < data.length && data[i] !== 0) i++;
  i++;

  const textData = data.slice(i);

  if (compressionFlag === 0) {
    return { keyword, value: decoder.decode(textData) };
  }

  if (compressionMethod !== 0) {
    return { keyword, value: "" };
  }

  try {
    const decompressed = decompressSync(textData);
    return { keyword, value: decoder.decode(decompressed) };
  } catch {
    return { keyword, value: "" };
  }
}

export function parseTExT(data: Uint8Array): PngTextChunk {
  const decoder = new TextDecoder("iso-8859-1");
  let i = 0;

  while (i < data.length && data[i] !== 0) i++;
  const keyword = decoder.decode(data.slice(0, i));
  i++;

  const value = decoder.decode(data.slice(i));
  return { keyword, value };
}

export function parseItxtParameters(data: Uint8Array): string {
  const result = parseITxt(data);
  return result.keyword === "parameters" ? result.value : "";
}

export function parseTextSource(data: Uint8Array): string {
  const result = parseTExT(data);
  return result.keyword === "Source" ? result.value : "";
}
