import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const temporary = await mkdtemp(join(tmpdir(), "bank-match-tests-"));
try {
  const outfile = join(temporary, "matching.test.mjs");
  await build({ entryPoints: ["src/lib/matching-engine.test.ts"], outfile, bundle: true, platform: "node", format: "esm" });
  const result = spawnSync(process.execPath, ["--test", outfile], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally { await rm(temporary, { recursive: true, force: true }); }
