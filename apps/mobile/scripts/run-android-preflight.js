const { spawn } = require("child_process");
const path = require("path");

const mode = process.argv[2];
const androidDir = path.join(__dirname, "..", "android");
const isWindows = process.platform === "win32";

const command = isWindows ? "gradlew.bat" : "./gradlew";
const argsByMode = {
  quick: [":app:buildReleasePreBundle", "--no-daemon", "--console=plain"],
  full: ["clean", ":app:bundleRelease", "--no-daemon", "--console=plain"],
};

if (!argsByMode[mode]) {
  console.error("Usage: node scripts/run-android-preflight.js <quick|full>");
  process.exit(1);
}

const child = spawn(command, argsByMode[mode], {
  cwd: androidDir,
  stdio: "inherit",
  shell: isWindows,
  env: {
    ...process.env,
    EXPO_NO_METRO_WORKSPACE_ROOT: "1",
    EAS_BUILD: "true",
  },
});

child.on("error", (error) => {
  console.error("Failed to run Android preflight:", error.message);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
