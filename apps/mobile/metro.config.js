const path = require("path");

// Ensure hoisted packages (nativewind, react-native-css-interop) can find
// react-native which lives in apps/mobile/node_modules in this monorepo.
const Module = require("module");
const originalResolve = Module._resolveFilename;
const localModules = path.resolve(__dirname, "node_modules");
Module._resolveFilename = function (request, parent, isMain, options) {
  // For any module that might only live in the mobile workspace node_modules,
  // fall back to looking there when the default resolution fails.
  try {
    return originalResolve.call(this, request, parent, isMain, options);
  } catch (err) {
    // Only retry for non-relative, non-absolute requires
    if (!request.startsWith(".") && !path.isAbsolute(request)) {
      try {
        return originalResolve.call(
          this,
          request,
          Object.assign({}, parent, {
            paths: [localModules, ...(parent?.paths || [])],
          }),
          isMain,
          options,
        );
      } catch {
        // Fall through to original error
      }
    }
    throw err;
  }
};

const { getDefaultConfig } = require("expo/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require("nativewind/metro");
const exclusionList = require("metro-config/src/defaults/exclusionList");

// ─── Monorepo root ────────────────────────────────────────────────
const workspaceRoot = path.resolve(__dirname, "../..");
const rootNodeModules = path.resolve(workspaceRoot, "node_modules");
const webBuildOutput = path.resolve(workspaceRoot, "apps", "web", ".next");

function escapePathForRegex(filePath) {
  return filePath.replace(/[\\/]/g, "[/\\\\]");
}

const config = getDefaultConfig(__dirname);

// 1. Let Metro watch the entire monorepo so it can find packages/*
config.watchFolders = [workspaceRoot];

// Ignore Next.js build output from apps/web to avoid flaky missing-path
// watch errors while Metro crawls the monorepo.
config.resolver.blockList = exclusionList([
  new RegExp(`^${escapePathForRegex(webBuildOutput)}([/\\\\].*)?$`),
]);

// 2. Tell Metro where to resolve node_modules from (local first, then root)
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  rootNodeModules,
];

// 3. Redirect browser-only packages to an empty stub so Metro doesn't fail.
//    We use MoveNet (not BlazePose) so @mediapipe/pose is never executed.
const emptyStub = path.resolve(__dirname, "stubs", "empty-module.js");
const localNodeModules = path.resolve(__dirname, "node_modules");
const reanimatedModuleEntry = require.resolve(
  "react-native-reanimated/lib/module/index.js",
  { paths: [rootNodeModules, localNodeModules] },
);

config.resolver.extraNodeModules = {
  "@mediapipe/pose": emptyStub,
  "@tensorflow/tfjs-backend-webgpu": emptyStub,
  "@tensorflow/tfjs-backend-webgl": emptyStub,
  "@mediapipe/face_detection": emptyStub,
  "@mediapipe/face_mesh": emptyStub,
  "@mediapipe/hands": emptyStub,
  "@mediapipe/selfie_segmentation": emptyStub,
};

// Singletons that must NEVER load from two different locations.
// resolveRequest overrides the entire resolution pipeline — unlike
// extraNodeModules it is called for every module regardless of whether
// a copy already exists somewhere in nodeModulesPaths.
const SINGLETONS = new Set([
  "react",
  "react-native",
  "react-native-reanimated",
  "react-native-svg",
  "react-native-safe-area-context",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-native/Libraries/Core/InitializeCore",
  "scheduler",
]);

const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SINGLETONS.has(moduleName)) {
    if (moduleName === "react-native-reanimated") {
      return {
        filePath: reanimatedModuleEntry,
        type: "sourceFile",
      };
    }

    // Always resolve singleton from the local apps/mobile/node_modules
    return {
      filePath: require.resolve(moduleName, { paths: [localNodeModules] }),
      type: "sourceFile",
    };
  }
  // Fall back to default Metro resolution
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 4. Use worker threads instead of child-process workers to avoid EPERM spawn
//    failures in constrained sandboxed environments.
config.transformer.unstable_workerThreads = true;

module.exports = withSentryConfig(withNativeWind(config, { input: "./global.css" }));
