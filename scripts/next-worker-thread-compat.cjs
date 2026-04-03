/**
 * Next.js worker-thread compatibility shim for sandboxed environments.
 *
 * Child-process workers can fail with EPERM in constrained sandboxes.
 * With worker threads enabled, Next's `exportPages` request includes
 * function-valued config fields (for example `generateBuildId`) that are
 * not structured-cloneable and can throw DataCloneError.
 *
 * Patch jest-worker call dispatch so `exportPages` receives a clone-safe
 * `nextConfig` payload.
 */

try {
  const jestWorker = require("next/dist/compiled/jest-worker");
  const WorkerProto = jestWorker?.Worker?.prototype;

  if (WorkerProto && !WorkerProto.__auraExportPagesPatched) {
    const originalCallFunctionWithArgs = WorkerProto._callFunctionWithArgs;
    const debug = process.env.AURA_NEXT_WORKER_DEBUG === "1";

    const isPlainObject = (value) => {
      if (!value || typeof value !== "object") return false;
      const proto = Object.getPrototypeOf(value);
      return proto === Object.prototype || proto === null;
    };

    const stripFunctionsDeep = (value, seen = new WeakMap()) => {
      if (value === null || value === undefined) return value;

      const valueType = typeof value;
      if (valueType === "function") return undefined;
      if (valueType !== "object") return value;

      if (seen.has(value)) return seen.get(value);

      if (Array.isArray(value)) {
        const out = new Array(value.length);
        seen.set(value, out);
        for (let i = 0; i < value.length; i += 1) {
          out[i] = stripFunctionsDeep(value[i], seen);
        }
        return out;
      }

      if (!isPlainObject(value)) {
        return value;
      }

      const out = {};
      seen.set(value, out);

      for (const key of Object.keys(value)) {
        const nextValue = stripFunctionsDeep(value[key], seen);
        if (nextValue !== undefined) {
          out[key] = nextValue;
        }
      }

      return out;
    };

    WorkerProto._callFunctionWithArgs = function patchedCallFunctionWithArgs(method, ...args) {
      if (debug) {
        process.stderr.write(`[aura-worker] method=${String(method)}\n`);
      }

      if (method === "exportPages") {
        const input = args[0];

        if (input && typeof input === "object") {
          args[0] = stripFunctionsDeep(input);
        }
      }

      return originalCallFunctionWithArgs.call(this, method, ...args);
    };

    WorkerProto.__auraExportPagesPatched = true;
  }
} catch {
  // If internals change, keep default behavior instead of crashing at preload.
}
