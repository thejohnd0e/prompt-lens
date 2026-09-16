import { readAiMetadata } from "../metadata/read-ai-metadata";
import { FileEntry } from "./file-state";

export type Listener = () => void;

export class FileController {
  private entries: FileEntry[] = [];
  private selectedId: string | null = null;
  private listeners: Listener[] = [];
  private processing = false;
  private processQueue: File[] = [];

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  getEntries(): FileEntry[] {
    return this.entries;
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  getSelectedEntry(): FileEntry | null {
    return this.entries.find((e) => e.id === this.selectedId) || null;
  }

  select(id: string): void {
    this.selectedId = id;
    this.notify();
  }

  remove(id: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry?.previewUrl) {
      URL.revokeObjectURL(entry.previewUrl);
    }
    this.entries = this.entries.filter((e) => e.id !== id);
    if (this.selectedId === id) {
      this.selectedId = this.entries[0]?.id || null;
    }
    this.notify();
  }

  clear(): void {
    for (const entry of this.entries) {
      if (entry.previewUrl) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    }
    this.entries = [];
    this.selectedId = null;
    this.notify();
  }

  async addFiles(files: File[]): Promise<void> {
    const existingPaths = new Set(
      this.entries.map((e) => e.name)
    );

    const newFiles = files.filter(
      (f) => f.type === "image/png" && !existingPaths.has(f.name)
    );

    for (const file of newFiles) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.entries.push({
        id,
        path: file.name,
        name: file.name,
        state: "partial",
      });
    }

    this.notify();

    if (!this.processing && newFiles.length > 0) {
      this.processQueue.push(...newFiles);
      this.processFiles();
    }
  }

  private async processFiles(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.processQueue.length > 0) {
      const file = this.processQueue.shift()!;
      const entry = this.entries.find((e) => e.name === file.name);
      if (!entry) continue;

      const result = await readAiMetadata(file);

      entry.state = result.state;
      entry.errorMessage = result.errorMessage;
      entry.metadata = {
        prompt: result.prompt,
        aiSystem: result.aiSystem,
        aiSystemVersion: result.aiSystemVersion,
        digitalSourceType: result.digitalSourceType,
        sourceUrl: result.sourceUrl,
      };

      if (result.state !== "read_error") {
        const blob = new Blob([file], { type: "image/png" });
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
        entry.previewUrl = URL.createObjectURL(blob);
      }

      this.notify();
    }

    this.processing = false;

    if (this.selectedId === null && this.entries.length > 0) {
      this.selectedId = this.entries[0].id;
      this.notify();
    }
  }
}

export async function openFiles(controller: FileController): Promise<void> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "PNG Images",
          extensions: ["png"],
        },
      ],
    });

    if (selected) {
      const files: File[] = [];

      for (const item of Array.isArray(selected) ? selected : [selected]) {
        if (typeof item === "string") {
          const { readFile } = await import("@tauri-apps/plugin-fs");
          const bytes = await readFile(item);
          const blob = new Blob([bytes], { type: "image/png" });
          const name = item.split(/[/\\]/).pop() || "unknown.png";
          files.push(new File([blob], name, { type: "image/png" }));
        }
      }

      if (files.length > 0) {
        await controller.addFiles(files);
      }
    }
  } catch (e) {
    console.error("Failed to open files:", e);
  }
}
