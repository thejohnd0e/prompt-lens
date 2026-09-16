import { FileController } from "../app/file-controller";
import { currentMonitor, getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

function createField(
  label: string,
  value: string,
  copyable = true
): HTMLElement {
  const field = document.createElement("div");
  field.className = "field";

  const labelEl = document.createElement("span");
  labelEl.className = "field__label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "field__value";
  if (value) {
    valueEl.textContent = value;
  } else {
    valueEl.textContent = "Not available";
    valueEl.classList.add("field__value--empty");
  }

  field.appendChild(labelEl);
  field.appendChild(valueEl);

  if (copyable && value) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "field__copy";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(value);
        copyBtn.textContent = "Copied!";
        copyBtn.classList.add("field__copy--copied");
        setTimeout(() => {
          copyBtn.textContent = "Copy";
          copyBtn.classList.remove("field__copy--copied");
        }, 1500);
      } catch {
        copyBtn.textContent = "Error";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 1500);
      }
    });
    field.appendChild(copyBtn);
  }

  return field;
}

async function fitWindowToContent(container: HTMLElement): Promise<void> {
  try {
    const window = getCurrentWindow();
    const scaleFactor = await window.scaleFactor();
    const currentSize = await window.innerSize();
    const monitor = await currentMonitor();
    const maxHeight = monitor
      ? Math.floor(monitor.workArea.size.height / monitor.scaleFactor)
      : 900;
    const toolbarHeight = document.querySelector<HTMLElement>(".toolbar")?.offsetHeight ?? 0;
    const contentHeight = container.scrollHeight;
    const height = Math.min(
      Math.max(contentHeight + toolbarHeight + 16, 480),
      Math.max(maxHeight - 32, 480)
    );
    const width = Math.max(Math.round(currentSize.width / scaleFactor), 760);

    await window.setSize(new LogicalSize(width, height));
  } catch {
    // Window sizing is unavailable when running the frontend outside Tauri.
  }
}

export function initMetadataPanel(controller: FileController): void {
  const container = document.getElementById("metadata-panel");
  if (!container) return;

  function render(): void {
    const entry = controller.getSelectedEntry();

    if (!entry) {
      container!.innerHTML =
        '<p class="metadata-panel__empty">Select a file to view metadata</p>';
      return;
    }

    container!.innerHTML = "";

    if (entry.previewUrl) {
      const previewSection = document.createElement("div");
      previewSection.className = "metadata-section";

      const img = document.createElement("img");
      img.className = "preview-img";
      img.src = entry.previewUrl;
      img.alt = entry.name;
      img.loading = "lazy";
      img.addEventListener("load", () => {
        void fitWindowToContent(container!);
      });
      previewSection.appendChild(img);
      container!.appendChild(previewSection);

    }

    if (entry.metadata) {
      const metaSection = document.createElement("div");
      metaSection.className = "metadata-section";

      const metaTitle = document.createElement("div");
      metaTitle.className = "metadata-section__title";
      metaTitle.textContent = "AI Metadata";
      metaSection.appendChild(metaTitle);

      metaSection.appendChild(
        createField("Prompt", entry.metadata.prompt)
      );
      metaSection.appendChild(
        createField("AI System", entry.metadata.aiSystem)
      );
      metaSection.appendChild(
        createField("Source URL", entry.metadata.sourceUrl)
      );

      container!.appendChild(metaSection);
    }
    requestAnimationFrame(() => void fitWindowToContent(container!));
  }

  controller.subscribe(render);
  const resizeObserver = new ResizeObserver(() => {
    if (container!.scrollHeight > container!.clientHeight + 1) {
      requestAnimationFrame(() => void fitWindowToContent(container!));
    }
  });
  resizeObserver.observe(container);
  render();
}
