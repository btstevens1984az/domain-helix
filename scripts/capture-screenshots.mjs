#!/usr/bin/env node
/** Legacy entry — prefer `npm run gifs` */
import { spawnSync } from "node:child_process";
const r = spawnSync("node", ["scripts/generate-gifs.mjs"], { stdio: "inherit" });
process.exit(r.status ?? 1);
