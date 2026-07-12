(function createModuleRegistry(global) {
  const modules = new Map();
  const initializedModules = new WeakSet();
  let sharedContext = {};
  let configured = false;

  function initialize(module) {
    if (!configured || !module || initializedModules.has(module) || typeof module.init !== "function") return;
    module.init(sharedContext);
    initializedModules.add(module);
  }

  function register(name, module) {
    const moduleName = String(name || "").trim();
    if (!moduleName) throw new Error("Modül adı boş olamaz.");
    if (!module || typeof module !== "object") throw new Error(`${moduleName} modülü geçerli bir nesne olmalıdır.`);
    if (modules.has(moduleName)) throw new Error(`${moduleName} modülü birden fazla kez kaydedilemez.`);
    modules.set(moduleName, module);
    initialize(module);
    return module;
  }

  function configure(context = {}) {
    sharedContext = { ...sharedContext, ...context };
    configured = true;
    modules.forEach(initialize);
  }

  function get(name) {
    return modules.get(name) || null;
  }

  function requireModule(name) {
    const module = get(name);
    if (!module) throw new Error(`${name} modülü kayıtlı değil.`);
    return module;
  }

  function list() {
    return [...modules.keys()];
  }

  global.AppModules = Object.freeze({ register, configure, get, require: requireModule, list });
})(window);
