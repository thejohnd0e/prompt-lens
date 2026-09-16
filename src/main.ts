import "./styles/app.css";
import { FileController } from "./app/file-controller";
import { initDropZone } from "./ui/drop-zone";
import { initFileList } from "./ui/file-list";
import { initMetadataPanel } from "./ui/metadata-panel";
import { openFiles } from "./app/file-controller";
import { openUrl } from "@tauri-apps/plugin-opener";

const controller = new FileController();

initDropZone(controller);
initFileList(controller);
initMetadataPanel(controller);

const openBtn = document.getElementById("open-files");
openBtn?.addEventListener("click", () => openFiles(controller));

document.querySelector<HTMLAnchorElement>(".toolbar__link")?.addEventListener("click", (event) => {
  event.preventDefault();
  void openUrl("https://github.com/thejohnd0e/prompt-lens");
});
