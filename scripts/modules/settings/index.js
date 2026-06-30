(function () {
  const state = {
    initialized: false,
    callbacks: {},
    els: {}
  };

  const GLOBAL_SETTINGS_KEY = "sorubank:global-settings:v1";

  function byId(id) {
    return document.querySelector(`#${id}`);
  }

  function loadGlobalSettings() {
    try {
      const saved = localStorage.getItem(GLOBAL_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : {
        landingModule: "",
        autoBackupEnabled: true,
        autoBackupLimit: 20,
        theme: "light"
      };
    } catch {
      return { landingModule: "", autoBackupEnabled: true, autoBackupLimit: 20, theme: "light" };
    }
  }

  function saveGlobalSettings(settings) {
    localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
    if (window.scheduleCloudSave) window.scheduleCloudSave();
  }

  function getLocalStorageSize() {
    let total = 0;
    try {
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length + x.length) * 2; // UTF-16 is 2 bytes per char
        }
      }
    } catch (e) {}
    if (total === 0) return "0 KB";
    if (total < 1024) return total + " B";
    return (total / 1024).toFixed(1) + " KB";
  }

  function collectElements() {
    return {
      shell: byId("globalSettingsShell"),
      backBtn: byId("globalSettingsBackBtn"),
      profileBtn: byId("globalSettingsProfileBtn"),
      userName: byId("globalSettingsUserName"),
      userEmail: byId("globalSettingsUserEmail"),
      avatar: byId("globalSettingsAvatar"),
      syncType: byId("globalSettingsSyncType"),
      dataSize: byId("globalSettingsDataSize"),
      tabs: document.querySelectorAll("[data-global-settings-tab]"),
      panels: document.querySelectorAll("[data-global-settings-panel]"),
      mobileSelect: byId("globalSettingsMobileSelect"),
      exportDataBtn: byId("exportDataBtn"),
      exportSelectedBackupBtn: byId("exportSelectedBackupBtn"),
      importDataInput: byId("importDataInput"),
      createSnapshotBtn: byId("createSnapshotBtn"),
      restoreLatestSnapshotBtn: byId("restoreLatestSnapshotBtn"),
      backupRestoreMode: byId("backupRestoreMode"),
      landingModule: byId("landingModuleSelect"),
      autoBackupToggle: byId("autoBackupToggle"),
      autoBackupLimit: byId("autoBackupLimitSelect"),
      appThemeSelect: byId("appThemeSelect")
    };
  }

  function setPanel(panel = "profile") {
    state.els.tabs.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.globalSettingsTab === panel);
    });
    if (state.els.mobileSelect) {
      state.els.mobileSelect.value = panel;
    }
    state.els.panels.forEach((section) => {
      section.classList.toggle("is-active", section.dataset.globalSettingsPanel === panel);
    });
  }

  function selectedBackupModules(defaultModules = []) {
    const checked = [...document.querySelectorAll(".backup-module-check:checked")].map((input) => input.value);
    return checked.length ? checked : defaultModules;
  }

  function backupRestoreMode(defaultMode = "replace") {
    return state.els.backupRestoreMode?.value || defaultMode;
  }

  function clearImportInput() {
    if (state.els.importDataInput) state.els.importDataInput.value = "";
  }

  function bindEvents() {
    state.els.backBtn?.addEventListener("click", () => state.callbacks.returnToModuleHub?.());
    state.els.profileBtn?.addEventListener("click", () => state.callbacks.openProfileDialog?.());
    state.els.tabs.forEach((button) => {
      button.addEventListener("click", () => setPanel(button.dataset.globalSettingsTab));
    });
    if (state.els.mobileSelect) {
      state.els.mobileSelect.addEventListener("change", (e) => setPanel(e.target.value));
    }
    state.els.exportDataBtn?.addEventListener("click", () => state.callbacks.exportData?.());
    state.els.exportSelectedBackupBtn?.addEventListener("click", () => state.callbacks.exportSelectedBackup?.());
    state.els.importDataInput?.addEventListener("change", (event) => state.callbacks.importData?.(event.target.files[0]));
    state.els.createSnapshotBtn?.addEventListener("click", () => state.callbacks.createSnapshot?.());
    state.els.restoreLatestSnapshotBtn?.addEventListener("click", () => state.callbacks.restoreLatestSnapshot?.());

    state.els.landingModule?.addEventListener("change", (e) => {
      const settings = loadGlobalSettings();
      settings.landingModule = e.target.value;
      saveGlobalSettings(settings);
    });
    state.els.autoBackupToggle?.addEventListener("change", (e) => {
      const settings = loadGlobalSettings();
      settings.autoBackupEnabled = e.target.checked;
      saveGlobalSettings(settings);
    });
    state.els.autoBackupLimit?.addEventListener("change", (e) => {
      const settings = loadGlobalSettings();
      settings.autoBackupLimit = Number(e.target.value) || 20;
      saveGlobalSettings(settings);
    });
    state.els.appThemeSelect?.addEventListener("change", (e) => {
      const settings = loadGlobalSettings();
      settings.theme = e.target.value;
      saveGlobalSettings(settings);
      window.applyTheme?.(e.target.value);
    });
  }

  function init(callbacks = {}) {
    state.callbacks = { ...state.callbacks, ...callbacks };
    if (state.initialized) return;
    state.els = collectElements();
    bindEvents();
    state.initialized = true;
  }

  function render(session = {}, callbacks = {}) {
    if (!state.initialized) init(state.callbacks);
    
    const userNameStr = session?.name || "Kullanıcı";
    if (state.els.userName) state.els.userName.textContent = userNameStr;
    if (state.els.userEmail) state.els.userEmail.textContent = session?.email || "Yerel profil";
    if (state.els.avatar) {
      state.els.avatar.textContent = userNameStr.charAt(0).toUpperCase();
    }
    
    if (state.els.dataSize) {
      state.els.dataSize.textContent = getLocalStorageSize();
    }
    
    if (state.els.syncType) {
      const cloudConfig = JSON.parse(localStorage.getItem("sorubank:cloud-config:v1") || "{}");
      const isCloud = Boolean(cloudConfig.url && cloudConfig.anonKey);
      state.els.syncType.textContent = isCloud ? "Bulut Eşitlemeli" : "Yerel Profil";
    }

    const settings = loadGlobalSettings();
    if (state.els.landingModule) state.els.landingModule.value = settings.landingModule || "";
    if (state.els.autoBackupToggle) state.els.autoBackupToggle.checked = settings.autoBackupEnabled !== false;
    if (state.els.autoBackupLimit) state.els.autoBackupLimit.value = settings.autoBackupLimit || "20";
    if (state.els.appThemeSelect) state.els.appThemeSelect.value = settings.theme || "light";

    callbacks.renderCloudStatus?.();
    callbacks.updateBackupSnapshotStatus?.();
  }

  window.SorubankSettingsModule = {
    init,
    render,
    setPanel,
    selectedBackupModules,
    backupRestoreMode,
    clearImportInput
  };
})();
