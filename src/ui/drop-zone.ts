import { FileController } from "../app/file-controller";

export function initDropZone(controller: FileController): void {
  const dropZone = document.createElement("div");
  dropZone.className = "drop-zone";
  dropZone.innerHTML = '<span class="drop-zone__text">Drop PNG files here</span>';
  document.body.appendChild(dropZone);

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
