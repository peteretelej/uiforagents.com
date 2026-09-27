// Publishes the kit's agent surfaces into the build output at the site root,
// mirroring the kit package layout so every target in the published llms.txt
// resolves: /llms.txt, /schema/, /docs/components/, /items/.
import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const kit = fileURLToPath(new URL("../../uiforagents/", import.meta.url));

await cp(`${kit}llms.txt`, `${dist}llms.txt`);
await cp(`${kit}schema`, `${dist}schema`, { recursive: true });
await cp(`${kit}docs/components`, `${dist}docs/components`, { recursive: true });
await cp(`${kit}items`, `${dist}items`, { recursive: true });
console.log("agent surfaces: llms.txt, schema/, docs/components/, items/ -> dist/");
