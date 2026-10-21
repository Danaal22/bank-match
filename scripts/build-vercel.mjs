import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Build both halves without depending on Replit-only build variables.
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const env = { ...process.env, NODE_ENV: "production", PORT: "3000", BASE_PATH: "/" };
for (const args of [
  ["--filter", "@workspace/api-server", "run", "build"],
  ["--filter", "@workspace/bank-match", "run", "build"],
]) {
  const result = spawnSync("pnpm", args, { cwd: repositoryRoot, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
