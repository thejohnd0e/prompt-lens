import { crc32 } from "./crc32";

export interface PngChunk {
  type: string;
  data: Uint8Array;
  offset: number;
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

export function validatePngSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return false;
  }
  return true;
}

export function* parsePngChunks(
  bytes: Uint8Array
): Generator<PngChunk, void, undefined> {
  if (!validatePngSignature(bytes)) {
    throw new Error("Invalid PNG signature");
  }

  let offset = 8;
  const decoder = new TextDecoder("ascii");

  while (offset + 8 <= bytes.length) {
    const length =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];

    if (length < 0 || offset + 12 + length > bytes.length) {
      throw new Error(
        `Invalid chunk length ${length} at offset ${offset}`
      );
    }

    const type = decoder.decode(
      bytes.slice(offset + 4, offset + 8)
    );

    const dataStart = offset + 8;
    const data = bytes.slice(dataStart, dataStart + length);

    const expectedCrc =
      ((bytes[dataStart + length] << 24) |
      (bytes[dataStart + length + 1] << 16) |
      (bytes[dataStart + length + 2] << 8) |
      bytes[dataStart + length + 3]) >>> 0;

    const actualCrc = crc32(bytes, offset + 4, 4 + length);
    if (actualCrc !== expectedCrc) {
      throw new Error(
        `CRC mismatch in chunk ${type}: expected ${expectedCrc.toString(16)}, got ${actualCrc.toString(16)}`
      );
    }

    yield { type, data, offset };

    offset += 12 + length;

    if (type === "IEND") break;
  }
}
