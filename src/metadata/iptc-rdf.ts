import { SaxesParser } from "saxes";

export interface AiMetadata {
  prompt: string;
  aiSystem: string;
  aiSystemVersion: string;
  digitalSourceType: string;
}

export function readIptcAiFields(xmpRaw: string): AiMetadata {
  const parser = new SaxesParser();
  const result: AiMetadata = {
    prompt: "",
    aiSystem: "",
    aiSystemVersion: "",
    digitalSourceType: "",
  };

  parser.on("opentag", (node: { name: string; attributes: Record<string, string> }) => {
    if (node.name !== "rdf:Description") {
      return;
    }

    const attrs = node.attributes;
    if (attrs["Iptc4xmpExt:AIPromptInformation"]) {
      result.prompt = attrs["Iptc4xmpExt:AIPromptInformation"];
    }
    if (attrs["Iptc4xmpExt:AISystemUsed"]) {
      result.aiSystem = attrs["Iptc4xmpExt:AISystemUsed"];
    }
    if (attrs["Iptc4xmpExt:AISystemVersionUsed"]) {
      result.aiSystemVersion = attrs["Iptc4xmpExt:AISystemVersionUsed"];
    }
    if (attrs["Iptc4xmpExt:DigitalSourceType"]) {
      result.digitalSourceType = attrs["Iptc4xmpExt:DigitalSourceType"];
    }
  });

  try {
    parser.write(xmpRaw).close();
  } catch {
    // Return partial results on parse error
  }

  return result;
}

export function readIptcAiFieldsFromElement(xmpRaw: string): AiMetadata {
  const parser = new SaxesParser();
  const result: AiMetadata = {
    prompt: "",
    aiSystem: "",
    aiSystemVersion: "",
    digitalSourceType: "",
  };

  let currentElement = "";
  let depth = 0;

  parser.on("opentag", (node: { name: string }) => {
    depth++;
    currentElement = node.name;
  });

  parser.on("text", (text: string) => {
    if (depth <= 0) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    switch (currentElement) {
      case "Iptc4xmpExt:AIPromptInformation":
        result.prompt += trimmed;
        break;
      case "Iptc4xmpExt:AISystemUsed":
        result.aiSystem += trimmed;
        break;
      case "Iptc4xmpExt:AISystemVersionUsed":
        result.aiSystemVersion += trimmed;
        break;
      case "Iptc4xmpExt:DigitalSourceType":
        result.digitalSourceType += trimmed;
        break;
    }
  });

  parser.on("closetag", () => {
    depth--;
  });

  try {
    parser.write(xmpRaw).close();
  } catch {
    // Return partial results
  }

  return result;
}
