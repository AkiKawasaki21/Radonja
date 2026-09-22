import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Preserve the supplied PNGs byte for byte: no resampling or lossy conversion.
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  path.resolve(project, "../radonjamain.PNG"),
  path.resolve(project, "../radonja.PNG"),
];
const destination = path.join(project, "public/portraits");
await mkdir(destination, { recursive: true });

await copyFile(sources[0], path.join(destination, "radonja-main.png"));
await copyFile(sources[1], path.join(destination, "hidden-portrait.png"));

console.log("Copied original PNGs to public/portraits without image conversion.");
