export function getErrorMessage(state: string): string {
  const messages: Record<string, string> = {
    ready: "All metadata loaded",
    partial: "Some metadata fields are missing",
    absent: "No AI metadata found in this file",
    malformed: "File metadata is corrupted or invalid",
    unsupported: "This is not a supported PNG file",
    too_large: "File is too large (max 100 MiB)",
    read_error: "Could not read the file",
  };

  return messages[state] || "Unknown error";
}

export function getErrorDetails(errorMessage?: string): string {
  if (!errorMessage) return "";
  return errorMessage;
}
