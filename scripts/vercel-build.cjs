/**
 * Vercel build wrapper — catches and logs any errors clearly.
 */
const { execSync } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

const webDir = path.resolve(__dirname, "..", "apps", "web");

console.log("=== VERCEL BUILD DIAGNOSTICS ===");
console.log("Node version:", process.version);
console.log("CWD:", process.cwd());
console.log("Web dir:", webDir);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("VERCEL:", process.env.VERCEL);

if (!existsSync(webDir)) {
  console.error("ERROR: web directory not found:", webDir);
  process.exit(1);
}

// Check prisma
try {
  const prismaPath = require.resolve("@prisma/client", {
    paths: [webDir, __dirname],
  });
  console.log("Prisma client found at:", prismaPath);
} catch (e) {
  console.error("WARNING: @prisma/client not found:", e.message);
}

// Check next
try {
  const nextPath = require.resolve("next", { paths: [webDir, __dirname] });
  console.log("Next.js found at:", nextPath);
} catch (e) {
  console.error("ERROR: next not found:", e.message);
  process.exit(1);
}

console.log("=== STARTING NEXT BUILD ===");

try {
  execSync("npx next build", {
    cwd: webDir,
    stdio: "inherit",
    env: { ...process.env, VERCEL: "1" },
  });
  console.log("=== BUILD SUCCEEDED ===");
} catch (e) {
  console.error("=== BUILD FAILED ===");
  console.error("Exit code:", e.status);
  console.error("Signal:", e.signal);
  if (e.stderr) console.error("STDERR:", e.stderr.toString());
  process.exit(e.status || 1);
}
