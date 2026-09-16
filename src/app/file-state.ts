export type FileState =
  | "ready"
  | "partial"
  | "absent"
  | "malformed"
  | "unsupported"
  | "too_large"
  | "read_error";

export interface FileEntry {
  id: string;
  path: string;
  name: string;
  state: FileState;
  previewUrl?: string;
  metadata?: {
    prompt: string;
    aiSystem: string;
    aiSystemVersion: string;
    digitalSourceType: string;
    sourceUrl: string;
  };
  errorMessage?: string;
}

export function createStateClass(state: FileState): string {
  switch (state) {
    case "ready":
      return "file-item__status--ready";
    case "partial":
      return "file-item__status--partial";
    case "absent":
      return "file-item__status--absent";
    default:
      return "file-item__status--error";
  }
}

export function stateLabel(state: FileState): string {
  return state.charAt(0).toUpperCase() + state.slice(1).replace("_", " ");
}
