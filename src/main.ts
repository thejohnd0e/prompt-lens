import "./styles/app.css";
import { FileController } from "./app/file-controller";
import { initDropZone } from "./ui/drop-zone";
import { initFileList } from "./ui/file-list";
import { initMetadataPanel } from "./ui/metadata-panel";
import { openFiles } from "./app/file-controller";

const controller = new FileController();

initDropZone(controller);
initFileList(controller);
initMetadataPanel(controller);

const openBtn = document.getElementById("open-files");
openBtn?.addEventListener("click", () => openFiles(controller));
