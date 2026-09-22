import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const manifest = JSON.parse(await readFile(".next/app-build-manifest.json", "utf8"));
const chunks = [...new Set([...manifest.pages["/layout"], ...manifest.pages["/page"]])].filter((file) => file.endsWith(".js"));
let total = 0;
for (const chunk of chunks) total += gzipSync(await readFile(`.next/${chunk}`)).length;
console.log(`Homepage JavaScript: ${(total / 1000).toFixed(1)} KB gzipped across ${chunks.length} chunks (budget: < 200 KB).`);
if (total >= 200000) process.exitCode = 1;
