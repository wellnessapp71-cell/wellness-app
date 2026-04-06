const { existsSync } = require("fs");
const { resolve } = require("path");
const { spawnSync } = require("child_process");

const repoRoot = resolve(__dirname, "..", "..", "..");
const appRoot = resolve(__dirname, "..");
const compatShim = resolve(
  repoRoot,
  "scripts",
  "next-worker-thread-compat.cjs",
);

const nextCandidates = [
  resolve(appRoot, "node_modules", "next", "dist", "bin", "next"),
  resolve(repoRoot, "node_modules", "next", "dist", "bin", "next"),
];

const nextBin = nextCandidates.find((candidate) => existsSync(candidate));

if (!nextBin) {
  console.error(
    "Unable to locate Next.js binary. Run npm install at repo root or apps/web.",
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--require", compatShim, nextBin, "build"],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
