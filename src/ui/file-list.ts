import { FileController } from "../app/file-controller";
import { createStateClass, stateLabel } from "../app/file-state";

export function initFileList(controller: FileController): void {
  const container = document.getElementById("file-list");
  if (!container) return;

  function render(): void {
    const entries = controller.getEntries();
    const selectedId = controller.getSelectedId();

    if (entries.length === 0) {
      container!.innerHTML =
        '<p class="file-list__empty">Drop PNG files here or click Open</p>';
      return;
    }

    container!.innerHTML = "";

    for (const entry of entries) {
      const item = document.createElement("div");
      item.className = "file-item";
      if (entry.id === selectedId) {
        item.classList.add("file-item--selected");
      }

      const name = document.createElement("span");
      name.className = "file-item__name";
      name.textContent = entry.name;
      name.title = entry.name;

      const status = document.createElement("span");
      status.className = `file-item__status ${createStateClass(entry.state)}`;
      status.textContent = stateLabel(entry.state);

      const remove = document.createElement("button");
      remove.className = "file-item__remove";
      remove.textContent = "×";
      remove.title = "Remove";
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        controller.remove(entry.id);
      });

      item.appendChild(name);
      item.appendChild(status);
      item.appendChild(remove);

      item.addEventListener("click", () => {
        controller.select(entry.id);
      });

      container!.appendChild(item);
    }
  }

  controller.subscribe(render);
  render();
}
