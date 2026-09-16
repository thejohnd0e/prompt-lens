import { parsePngChunks, validatePngSignature } from "./png-parser";
import { parseITxt, parseTExT } from "./png-text";
import { extractXmpFromChunk } from "./xmp-reader";
import { readIptcAiFields, readIptcAiFieldsFromElement } from "./iptc-rdf";
import { MAX_FILE_SIZE, MAX_PROMPT_LENGTH } from "./limits";

export type FileState =
  | "ready"
  | "partial"
  | "absent"
  | "malformed"
  | "unsupported"
  | "too_large"
  | "read_error";

export interface AiMetadataResult {
  prompt: string;
  aiSystem: string;
  aiSystemVersion: string;
  digitalSourceType: string;
  sourceUrl: string;
  state: FileState;
  errorMessage?: string;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

export async function readAiMetadata(
  file: File
): Promise<AiMetadataResult> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      prompt: "",
      aiSystem: "",
      aiSystemVersion: "",
      digitalSourceType: "",
      sourceUrl: "",
      state: "too_large",
      errorMessage: `File size ${file.size} exceeds limit of ${MAX_FILE_SIZE}`,
    };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch (e) {
    return {
      prompt: "",
      aiSystem: "",
      aiSystemVersion: "",
      digitalSourceType: "",
      sourceUrl: "",
      state: "read_error",
      errorMessage: String(e),
    };
  }

  if (!validatePngSignature(bytes)) {
    return {
      prompt: "",
      aiSystem: "",
      aiSystemVersion: "",
      digitalSourceType: "",
      sourceUrl: "",
      state: "unsupported",
      errorMessage: "Not a valid PNG file",
    };
  }

  let xmpRaw = "";
  let parameters = "";
  let sourceUrl = "";

  try {
    for (const chunk of parsePngChunks(bytes)) {
      if (chunk.type === "iTXt") {
        const parsed = parseITxt(chunk.data);
        if (parsed.keyword === "XML:com.adobe.xmp") {
          const xmpData = extractXmpFromChunk(
            new TextEncoder().encode(parsed.value)
          );
          if (xmpData) {
            xmpRaw = xmpData.raw;
          }
        } else if (parsed.keyword === "parameters") {
          parameters = parsed.value;
        }
      } else if (chunk.type === "tEXt") {
        const parsed = parseTExT(chunk.data);
        if (parsed.keyword === "Source") {
          sourceUrl = parsed.value;
        }
      }
    }
  } catch (e) {
    return {
      prompt: "",
      aiSystem: "",
      aiSystemVersion: "",
      digitalSourceType: "",
      sourceUrl: "",
      state: "malformed",
      errorMessage: String(e),
    };
  }

  let aiFields = {
    prompt: "",
    aiSystem: "",
    aiSystemVersion: "",
    digitalSourceType: "",
  };

  if (xmpRaw) {
    try {
      aiFields = readIptcAiFields(xmpRaw);
      if (!aiFields.prompt) {
        const alt = readIptcAiFieldsFromElement(xmpRaw);
        if (alt.prompt) aiFields = alt;
      }
    } catch {
      // XMP parse failed, continue with empty fields
    }
  }

  let prompt = aiFields.prompt;
  if (!prompt && parameters) {
    prompt = parameters;
  }
  prompt = truncate(prompt, MAX_PROMPT_LENGTH);

  const hasAny =
    prompt || aiFields.aiSystem || aiFields.aiSystemVersion || aiFields.digitalSourceType;

  let state: FileState;
  if (xmpRaw && hasAny) {
    state = "ready";
  } else if (xmpRaw || hasAny) {
    state = "partial";
  } else if (parameters || sourceUrl) {
    state = "partial";
  } else {
    state = "absent";
  }

  return {
    prompt,
    aiSystem: aiFields.aiSystem,
    aiSystemVersion: aiFields.aiSystemVersion,
    digitalSourceType: aiFields.digitalSourceType,
    sourceUrl,
    state,
  };
}
