// Provide minimal fallbacks for runtimes that don't expose WeakRef APIs yet.
if (typeof globalThis.WeakRef !== "function") {
  class WeakRefPolyfill {
    constructor(value) {
      this._value = value;
    }

    deref() {
      return this._value;
    }
  }

  globalThis.WeakRef = WeakRefPolyfill;
}

if (typeof globalThis.FinalizationRegistry !== "function") {
  class FinalizationRegistryPolyfill {
    constructor() {}

    register() {}

    unregister() {
      return false;
    }
  }

  globalThis.FinalizationRegistry = FinalizationRegistryPolyfill;
}
