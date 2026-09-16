import { SaxesParser } from "saxes";
import { decompressSync } from "fflate";

export interface XmpParseLimits {
  maxDepth: number;
  maxElements: number;
  maxAttributes: number;
  maxTextChars: number;
}

const DEFAULT_LIMITS: XmpParseLimits = {
  maxDepth: 10,
  maxElements: 500,
  maxAttributes: 100,
  maxTextChars: 100_000,
};

export interface XmpData {
  raw: string;
  namespaces: Record<string, string>;
}

function decodeXmpData(data: Uint8Array, isCompressed: boolean): string {
  if (isCompressed) {
    try {
      const decompressed = decompressSync(data);
      return new TextDecoder("utf-8").decode(decompressed);
    } catch {
      return "";
    }
  }
  return new TextDecoder("utf-8").decode(data);
}

export function parseXmp(
  xmlString: string,
  limits: XmpParseLimits = DEFAULT_LIMITS
): XmpData | null {
  if (xmlString.includes("<!DOCTYPE") || xmlString.includes("<!ENTITY")) {
    return null;
  }

  const parser = new SaxesParser();
  const namespaces: Record<string, string> = {};
  let elementCount = 0;
  let attributeCount = 0;
  let textCharCount = 0;
  let depth = 0;
  let valid = true;

  parser.on("opentag", (node: { prefix?: string; attributes: Record<string, string> }) => {
    elementCount++;
    depth++;

    if (depth > limits.maxDepth || elementCount > limits.maxElements) {
      valid = false;
      return;
    }

    if (node.prefix && node.prefix.startsWith("xmlns")) {
      namespaces[node.prefix.substring(6)] = "";
    }

    for (const key in node.attributes) {
      attributeCount++;
      if (attributeCount > limits.maxAttributes) {
        valid = false;
        return;
      }

      if (key.startsWith("xmlns:")) {
        namespaces[key.substring(6)] = node.attributes[key];
      }
    }
  });

  parser.on("closetag", () => {
    depth--;
  });

  parser.on("text", (text: string) => {
    textCharCount += text.length;
    if (textCharCount > limits.maxTextChars) {
      valid = false;
    }
  });

  try {
    parser.write(xmlString).close();
  } catch {
    return null;
  }

  if (!valid) {
    return null;
  }

  return { raw: xmlString, namespaces };
}

export function extractXmpFromChunk(data: Uint8Array): XmpData | null {
  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(data);

  const xmpMatch = text.match(
    /<x:xmpmeta[^>]*>([\s\S]*?)<\/x:xmpmeta>/
  );
  if (!xmpMatch) {
    return null;
  }

  return parseXmp(xmpMatch[1]);
}

export { decodeXmpData };
