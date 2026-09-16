import { FileController } from "../app/file-controller";
import { getErrorMessage } from "../app/error-messages";

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

function showErrorDetails(
  container: HTMLElement,
  errorMessage?: string
): void {
  if (!errorMessage) return;

  const details = document.createElement("div");
  details.className = "error-details";

  const toggle = document.createElement("button");
  toggle.className = "error-details__toggle";
  toggle.textContent = "Show details";

  const content = document.createElement("div");
  content.className = "error-details__content";
  content.textContent = errorMessage;
  content.style.display = "none";

  toggle.addEventListener("click", () => {
    const isVisible = content.style.display !== "none";
    content.style.display = isVisible ? "none" : "block";
    toggle.textContent = isVisible ? "Show details" : "Hide details";
  });

  details.appendChild(toggle);
  details.appendChild(content);
  container.appendChild(details);
}

export function initMetadataPanel(controller: FileController): void {
  const container = document.getElementById("metadata-panel");
  if (!container) return;

  let prevPreviewUrl: string | null = null;

  function render(): void {
    if (prevPreviewUrl) {
      URL.revokeObjectURL(prevPreviewUrl);
      prevPreviewUrl = null;
    }

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
      previewSection.appendChild(img);
      container!.appendChild(previewSection);

      prevPreviewUrl = entry.previewUrl;
    }

    if (entry.metadata) {
      const infoSection = document.createElement("div");
      infoSection.className = "metadata-section";

      const infoTitle = document.createElement("div");
      infoTitle.className = "metadata-section__title";
      infoTitle.textContent = "File Info";
      infoSection.appendChild(infoTitle);

      infoSection.appendChild(
        createField("File Name", entry.name)
      );
      infoSection.appendChild(
        createField("Status", entry.state)
      );

      container!.appendChild(infoSection);

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
        createField("AI System Version", entry.metadata.aiSystemVersion)
      );
      metaSection.appendChild(
        createField("Digital Source Type", entry.metadata.digitalSourceType)
      );
      metaSection.appendChild(
        createField("Source URL", entry.metadata.sourceUrl)
      );

      container!.appendChild(metaSection);
    }

    const errorSection = document.createElement("div");
    errorSection.className = "metadata-section";

    const errorTitle = document.createElement("div");
    errorTitle.className = "metadata-section__title";
    errorTitle.textContent = "Status";
    errorSection.appendChild(errorTitle);

    errorSection.appendChild(
      createField("Message", getErrorMessage(entry.state))
    );

    if (entry.errorMessage) {
      showErrorDetails(errorSection, entry.errorMessage);
    }

    container!.appendChild(errorSection);
  }

  controller.subscribe(render);
  render();
}
