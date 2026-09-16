import { FileController } from "../app/file-controller";
import { getCurrentWebview } from "@tauri-apps/api/webview";

export function initDropZone(controller: FileController): void {
  const dropZone = document.createElement("div");
  dropZone.className = "drop-zone";
  dropZone.innerHTML = '<span class="drop-zone__text">Drop PNG files here</span>';
  document.body.appendChild(dropZone);

  void getCurrentWebview().onDragDropEvent(async (event) => {
    if (event.payload.type === "enter" || event.payload.type === "over") {
      dropZone.classList.add("drop-zone--active");
      return;
    }

    dropZone.classList.remove("drop-zone--active");

    if (event.payload.type === "drop") {
      try {
        await controller.addPaths(event.payload.paths);
      } catch (error) {
        console.error("Failed to read dropped files:", error);
      }
    }
  });

  let dragCounter = 0;

  document.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) {
      dropZone.classList.add("drop-zone--active");
    }
  });

  document.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone.classList.remove("drop-zone--active");
    }
  });

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove("drop-zone--active");

    const files: File[] = [];
    if (e.dataTransfer?.files) {
      for (const file of e.dataTransfer.files) {
        if (file.type === "image/png") {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      await controller.addFiles(files);
    }
  });
}
