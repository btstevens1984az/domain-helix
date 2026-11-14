#!/usr/bin/env node
/** @deprecated Use `npm run gifs` — kept for README compatibility. */
import { spawnSync } from "node:child_process";
const r = spawnSync(process.execPath, ["scripts/generate-gifs.mjs"], {
  stdio: "inherit",
  cwd: new URL("..", import.meta.url).pathname,
});
process.exit(r.status ?? 1);
