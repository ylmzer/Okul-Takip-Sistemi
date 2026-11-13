function normalizeCloudConfig(config = {}) {
  return {
    url: String(config.url || config.supabaseUrl || "").trim(),
    anonKey: String(config.anonKey || config.supabaseAnonKey || "").trim()
  };
}

function storedCloudConfig() {
  try {
    return normalizeCloudConfig(JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY) || "{}"));
  } catch {
    return normalizeCloudConfig();
  }
}

function saveStoredCloudConfig(config) {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(normalizeCloudConfig(config)));
  scheduleAutoBackupSnapshot("settings-change");
}

async function loadCloudConfig() {
  const browserConfig = normalizeCloudConfig(window.SORUBANK_SUPABASE || {});
  if (browserConfig.url && browserConfig.anonKey) {
    return { ...browserConfig, source: "system" };
  }

  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (response.ok) {
      const serverConfig = normalizeCloudConfig(await response.json());
      if (serverConfig.url && serverConfig.anonKey) {
        return { ...serverConfig, source: "system" };
      }
    }
  } catch {
    // Local file usage or static hosting without an API endpoint should still work offline.
  }

  const manual = storedCloudConfig();
  return { ...manual, source: manual.url ? "manual" : "none" };
}

function renderCloudStatus() {
  if (!els.cloudStatusTitle) return;

  const isSystem = cloudState.configSource === "system";
  if (isSystem) {
    if (els.supabaseUrlInput) els.supabaseUrlInput.value = "";
    if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = "";
  } else {
    const config = storedCloudConfig();
    if (els.supabaseUrlInput && !els.supabaseUrlInput.value) els.supabaseUrlInput.value = config.url;
    if (els.supabaseAnonKeyInput && !els.supabaseAnonKeyInput.value) els.supabaseAnonKeyInput.value = config.anonKey;
  }

  const config = storedCloudConfig();
  const email = cloudState.session?.user?.email || "";
  const configured = cloudState.enabled || (isSystem ? true : Boolean(config.url && config.anonKey));
  const connected = Boolean(cloudState.session);
  const busy = cloudState.syncing;
  let title = "Yerel kullanım";
  let text = "Supabase bağlantısı yapılınca verileriniz hesabınızla eşitlenir.";

  if (!configured) {
    title = "Supabase ayarı bekleniyor";
    text = "Project URL ve anon public key girilince giriş ve eşitleme açılır.";
  } else if (!cloudState.client) {
    title = "Bulut bağlantısı hazır değil";
    text = cloudState.lastError || "Supabase kütüphanesi yüklenemedi veya bağlantı ayarı eksik.";
  } else if (connected) {
    title = busy ? "Eşitleniyor" : "Buluta bağlı";
    text = busy
      ? "Okul Takip Sistemi verileri Supabase ile eşitleniyor."
      : `${email} hesabı ile bağlı${cloudState.lastSyncAt ? ` · Son eşitleme ${new Date(cloudState.lastSyncAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : ""}.`;
  } else {
    title = "Giriş bekleniyor";
    text = "Hesabınıza girince bu cihazdaki veriler ile bulut verileri eşitlenebilir.";
  }

  if (cloudState.lastError && configured && !busy) {
    text = cloudState.lastError;
  }

  els.cloudStatusTitle.textContent = title;
  els.cloudStatusText.textContent = text;
  const syncPanel = document.querySelector('[data-global-settings-panel="sync"]');
  if (syncPanel) {
    syncPanel.classList.toggle("cloud-connected", connected);
  }
  [els.signInBtn, els.signUpBtn].forEach((button) => {
    if (button) button.disabled = !cloudState.client || connected || busy;
  });
  if (els.signOutBtn) els.signOutBtn.disabled = !connected || busy;
  if (els.syncNowBtn) els.syncNowBtn.disabled = !connected || busy;
}

let isPushing = false;
let hasPendingPush = false;
let isSyncingFromCloud = false;
let isCloudInitialized = false;

function finalizeCloudInitialization() {
  isCloudInitialized = true;
  const hasLocalWrite = localStorage.getItem("sorubank:cloud-local-write");
  if (hasLocalWrite && cloudState.client && cloudState.session) {
    console.log("Pending local write detected after cloud init. Pushing to cloud...");
    scheduleCloudSave();
  }
  const loginPanel = document.getElementById("loginPanel");
  if (loginPanel) loginPanel.style.opacity = "1";
}

async function scheduleCloudSave() {
  // Buluttan veri indirilirken push yapma - race condition engeller
  if (isSyncingFromCloud) return;
  localStorage.setItem("sorubank:cloud-local-write", new Date().toISOString());
  if (!isCloudInitialized || !cloudState.client || !cloudState.session) return;

  if (isPushing) {
    hasPendingPush = true;
    return;
  }

  isPushing = true;
  while (true) {
    hasPendingPush = false;
    try {
      await pushCloudState({ silent: true, throwOnError: true });
    } catch (err) {
      console.error("Cloud save failed:", err);
      showToast("Değişiklikler buluta kaydedilemedi. İnternet bağlantınızı kontrol edin.", "error");
      isPushing = false;
      return;
    }
    if (!hasPendingPush) break;
  }
  isPushing = false;
}

function withTimeout(promise, ms = 6000) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Bağlantı zaman aşımına uğradı")), ms))
  ]);
}

function reloadAppState() {
  // localStorage'daki güncel verileri okuyarak tüm modülleri yeniden başlat
  try {
    // Soru Bankası state'ini yeniden yükle
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = normalizeState(JSON.parse(raw));
    }
    // Modülleri yeniden başlat ve yeni verileri localStorage'dan oku
    ["course-tracking", "student-tracking", "annual-plan"].forEach((moduleName) => getAppModule(moduleName)?.loadState?.());
    // Skill modülünü yeniden yükle
    if (typeof loadSkillProfileStore === "function") {
      skillProfileStore = loadSkillProfileStore();
      skillState = getActiveSkillProfileState();
    }
    if (typeof renderSkillModule === "function") renderSkillModule();
    // Render
    render();
    renderAccessShell();
    setView(state.currentView || "bank");
  } catch (e) {
    console.warn("reloadAppState failed:", e);
  }
}

async function checkAndSyncCloudBackground(options = {}) {
  if (!cloudState.client || !cloudState.session) return;

  const overlay = options.silent ? null : document.getElementById("cloudLoadingOverlay");
  if (overlay) overlay.removeAttribute("hidden");

  try {
    const userId = cloudState.session.user.id;
    const { data, error } = await withTimeout(
      cloudState.client
        .from("sorubank_cloud_states")
        .select("updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      6000
    );

    if (error) throw error;
    const localWriteAt = localStorage.getItem("sorubank:cloud-local-write") || "";
    if (!data) {
      if (localWriteAt) {
        await pushCloudState({ silent: true });
      }
      if (overlay) overlay.setAttribute("hidden", "true");
      return;
    }

    const remoteUpdatedAt = data.updated_at;
    const localLastSync = localStorage.getItem("sorubank:cloud-last-sync") || "";
    const remoteTime = remoteUpdatedAt ? Date.parse(remoteUpdatedAt) : 0;
    const localSyncTime = localLastSync ? Date.parse(localLastSync) : 0;
    const localWriteTime = localWriteAt ? Date.parse(localWriteAt) : 0;

    // Eğer yerelde buluta henüz gönderilmemiş daha yeni bir değişiklik varsa, buluttaki eski veriyi çekip yereli ezme; yereli buluta gönder!
    if (localWriteTime && (!remoteTime || localWriteTime >= remoteTime - 1000)) {
      console.log("Newer local write detected. Pushing local state to cloud instead of overwriting...");
      await pushCloudState({ silent: true });
      if (overlay) overlay.setAttribute("hidden", "true");
      return;
    }

    const isRemoteNewer = remoteUpdatedAt && (!localSyncTime || Math.abs(remoteTime - localSyncTime) > 1000) && remoteTime > localSyncTime;

    if (isRemoteNewer) {
      console.log("Newer remote state detected. Syncing background...");
      const { data: remoteStateData, error: readError } = await withTimeout(
        cloudState.client
          .from("sorubank_cloud_states")
          .select("state, updated_at")
          .eq("user_id", userId)
          .maybeSingle(),
        6000
      );
      
      if (readError) throw readError;
      if (remoteStateData?.state) {
        const isBackupPackage = remoteStateData.state.type === "sorubank-backup" && remoteStateData.state.storage;
        if (isBackupPackage) {
          isSyncingFromCloud = true;
          applyBackupPackage(remoteStateData.state, "replace");
          localStorage.setItem("sorubank:cloud-last-sync", remoteUpdatedAt);
          localStorage.removeItem("sorubank:cloud-local-write");
          cloudState.lastSyncAt = remoteUpdatedAt;
          renderCloudStatus();
          console.log("Background sync complete. Refreshing UI...");
          reloadAppState();
          isSyncingFromCloud = false;
        }
      }
    } else {
      if (remoteUpdatedAt && localLastSync !== remoteUpdatedAt) {
        localStorage.setItem("sorubank:cloud-last-sync", remoteUpdatedAt);
      }
      cloudState.lastSyncAt = remoteUpdatedAt || localLastSync;
      renderCloudStatus();
    }
    // Başarılı bittiğinde loading ekranını gizle
    if (overlay) overlay.setAttribute("hidden", "true");
  } catch (err) {
    console.warn("Background cloud sync check failed:", err.message);
    if (!options.silent) {
      const spinner = document.getElementById("cloudLoadingSpinner");
      const title = document.getElementById("cloudLoadingTitle");
      const desc = document.getElementById("cloudLoadingDesc");
      const errContainer = document.getElementById("cloudLoadingError");
      if (spinner) spinner.style.display = "none";
      if (title) title.textContent = "Bağlantı Hatası";
      if (desc) desc.textContent = "Bulut veritabanına bağlanılamadı.";
      if (errContainer) errContainer.style.display = "block";
      // Overlay'i gizlemiyoruz, kilitli kalıyor ve kullanıcı "Tekrar Dene" butonunu görüyor
    }
  }
}

async function initializeCloud() {
  const config = await loadCloudConfig();
  const isSystemConfig = config.source === "system";
  cloudState.configSource = config.source;

  if (isSystemConfig) {
    if (els.supabaseUrlInput) els.supabaseUrlInput.value = "";
    if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = "";
  } else {
    if (els.supabaseUrlInput) els.supabaseUrlInput.value = config.url;
    if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = config.anonKey;
  }

  const cloudConfigEl = document.querySelector(".cloud-config");
  if (cloudConfigEl) {
    cloudConfigEl.style.setProperty("display", isSystemConfig ? "none" : "", "important");
  }
  if (isSystemConfig) {
    const quickStartBtn = document.querySelector("#quickStartBtn");
    if (quickStartBtn) {
      quickStartBtn.style.setProperty("display", "none", "important");
    }
    const authCopy = document.querySelector(".auth-copy");
    if (authCopy) {
      authCopy.textContent = "Okul Takip Sistemi bulut hesabınızla giriş yapın. Verileriniz otomatik olarak eşitlenecektir.";
    }
    const introTitle = document.querySelector(".auth-intro h1");
    if (introTitle) {
      introTitle.textContent = "Hesabınıza giriş yapın";
    }
    setAuthMode("login");
  }
  if (!config.url || !config.anonKey) {
    cloudState = { ...cloudState, enabled: false, ready: true, client: null, session: null, lastError: "" };
    renderCloudStatus();
    finalizeCloudInitialization();
    return;
  }
  if (!window.supabase?.createClient) {
    cloudState = { ...cloudState, enabled: true, ready: false, client: null, session: null, lastError: "Supabase kütüphanesi yüklenemedi. İnternet bağlantısını veya CDN erişimini kontrol edin." };
    renderCloudStatus();
    finalizeCloudInitialization();
    return;
  }

  const overlay = document.getElementById("cloudLoadingOverlay");
  const hasLocalUser = Boolean(localSession?.name);
  if (hasLocalUser && overlay) {
    overlay.removeAttribute("hidden");
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "block";
    if (title) title.textContent = "Veriler buluttan yükleniyor...";
    if (desc) desc.textContent = "Lütfen bekleyin, güncel veriler alınıyor.";
    if (errContainer) errContainer.style.display = "none";
  }

  try {
    const client = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await withTimeout(client.auth.getSession(), 6000);
    if (error) throw error;
    cloudState = { ...cloudState, client, session: data.session, enabled: true, ready: true, lastError: "" };
    
     if (data.session) {
      const email = normalizeEmail(data.session.user.email);
      const name = data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || email.split("@")[0];
      const localEmail = localSession ? normalizeEmail(localSession.email) : "";
      if (email && localEmail && email !== localEmail) {
        console.warn("Session email mismatch. Syncing local profile to active cloud account:", email);
        saveLocalSession({
          id: data.session.user.id,
          name: name,
          email: email,
          activeModule: localSession?.activeModule || "",
          createdAt: new Date().toISOString()
        });
      }
      syncUserToServer({ id: data.session.user.id, name, email, role: "teacher" });
      await checkAndSyncCloudBackground();
    } else {
      if (overlay) overlay.setAttribute("hidden", "true");
    }

    client.auth.onAuthStateChange((_event, session) => {
      cloudState.session = session;
      if (session) {
        const email = normalizeEmail(session.user.email);
        const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || email.split("@")[0];
        const localEmail = localSession ? normalizeEmail(localSession.email) : "";
        if (email && localEmail && email !== localEmail) {
          saveLocalSession({
            id: session.user.id,
            name: name,
            email: email,
            activeModule: localSession?.activeModule || "",
            createdAt: new Date().toISOString()
          });
        }
        syncUserToServer({ id: session.user.id, name, email, role: "teacher" });
      }
      renderCloudStatus();
    });
    renderCloudStatus();
    finalizeCloudInitialization();
  } catch (error) {
    cloudState = { ...cloudState, enabled: true, ready: false, client: null, session: null, lastError: `Supabase bağlantısı kurulamadı: ${error.message}` };
    renderCloudStatus();
    if (hasLocalUser) {
      const spinner = document.getElementById("cloudLoadingSpinner");
      const title = document.getElementById("cloudLoadingTitle");
      const desc = document.getElementById("cloudLoadingDesc");
      const errContainer = document.getElementById("cloudLoadingError");
      if (spinner) spinner.style.display = "none";
      if (title) title.textContent = "Bağlantı Hatası";
      if (desc) desc.textContent = "Bulut veritabanına bağlanılamadı.";
      if (errContainer) errContainer.style.display = "block";
    } else {
      if (overlay) overlay.setAttribute("hidden", "true");
    }
    finalizeCloudInitialization();
  }
}

async function signInToCloud() {
  const email = els.authEmailInput.value.trim();
  const password = els.authPasswordInput.value;
  if (!email || !password) {
    showToast("E-posta ve şifre girin.", "warning");
    return;
  }

  // Overlay'ı göster
  const overlay = document.getElementById("cloudLoadingOverlay");
  if (overlay) {
    overlay.removeAttribute("hidden");
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "block";
    if (title) title.textContent = "Giriş yapılıyor...";
    if (desc) desc.textContent = "Lütfen bekleyin, hesabınıza bağlanılıyor.";
    if (errContainer) errContainer.style.display = "none";
  }

  try {
    const { data, error } = await withTimeout(
      cloudState.client.auth.signInWithPassword({ email, password }),
      8000
    );
    if (error) throw error;
    cloudState.session = data.session;
    els.authPasswordInput.value = "";

    if (data.session) {
      // Giriş yapıldı, profili ayarla
      const userEmail = normalizeEmail(data.session.user.email);
      const name = data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || userEmail.split("@")[0];
      saveLocalSession({
        id: data.session.user.id,
        name: name,
        email: userEmail,
        activeModule: localSession?.activeModule || "",
        createdAt: new Date().toISOString()
      });
      renderAccessShell();

      // Overlay'ı güncelle - veri indiriliyor
      const titleEl = document.getElementById("cloudLoadingTitle");
      const descEl = document.getElementById("cloudLoadingDesc");
      if (titleEl) titleEl.textContent = "Veriler buluttan yükleniyor...";
      if (descEl) descEl.textContent = "Lütfen bekleyin, güncel veriler alınıyor.";

      // Buluttaki veriyi oku
      const userId = data.session.user.id;
      const { data: remoteStateData, error: readError } = await withTimeout(
        cloudState.client
          .from("sorubank_cloud_states")
          .select("state, updated_at")
          .eq("user_id", userId)
          .maybeSingle(),
        8000
      );
      if (readError) throw readError;

      if (remoteStateData?.state) {
        const isBackupPackage = remoteStateData.state.type === "sorubank-backup" && remoteStateData.state.storage;
        if (isBackupPackage) {
          isSyncingFromCloud = true;
          applyBackupPackage(remoteStateData.state, "replace");
          localStorage.setItem("sorubank:cloud-last-sync", remoteStateData.updated_at || new Date().toISOString());
          localStorage.removeItem("sorubank:cloud-local-write");
          cloudState.lastSyncAt = remoteStateData.updated_at;
          window.location.reload();
          return;
        }
      } else {
        // Bulutta veri yok, yerel veriyi gönder
        await withTimeout(pushCloudState({ silent: true }), 8000);
        finalizeCloudInitialization();
      }

      if (overlay) overlay.setAttribute("hidden", "true");
      renderCloudStatus();
      showToast("Bulut hesabına giriş yapıldı.");
    } else {
      if (overlay) overlay.setAttribute("hidden", "true");
      finalizeCloudInitialization();
    }
  } catch (error) {
    cloudState.lastError = `Giriş yapılamadı: ${error.message}`;
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "none";
    if (title) title.textContent = "Bağlantı Hatası";
    if (desc) desc.textContent = error.message || "Sunucuya bağlanılamadı.";
    if (errContainer) errContainer.style.display = "block";
    finalizeCloudInitialization();
  }
}

async function signUpToCloud() {
  const email = els.authEmailInput.value.trim();
  const password = els.authPasswordInput.value;
  if (!email || !password) {
    showToast("E-posta ve şifre girin.", "warning");
    return;
  }
  cloudState.syncing = true;
  renderCloudStatus();
  try {
    const { data, error } = await cloudState.client.auth.signUp({ email, password });
    if (error) throw error;
    cloudState.session = data.session;
    els.authPasswordInput.value = "";
    renderCloudStatus();
    if (data.session) {
      await pushCloudState();
      showToast("Hesap oluşturuldu ve veriler buluta gönderildi.");
    } else {
      showToast("Hesap oluşturuldu. Supabase e-posta onayı açıksa gelen kutusunu kontrol edin.");
    }
  } catch (error) {
    cloudState.lastError = `Kayıt oluşturulamadı: ${error.message}`;
    showToast(cloudState.lastError, "error");
  } finally {
    cloudState.syncing = false;
    renderCloudStatus();
  }
}

async function signOutFromCloud() {
  if (!cloudState.client) return;
  cloudState.syncing = true;
  renderCloudStatus();
  try {
    await pushCloudState({ silent: true });
    const { error } = await cloudState.client.auth.signOut();
    if (error) throw error;
    cloudState.session = null;
    localStorage.removeItem("sorubank:cloud-last-sync");
    showToast("Bulut hesabından çıkış yapıldı.");
  } catch (error) {
    cloudState.lastError = `Çıkış yapılamadı: ${error.message}`;
    showToast(cloudState.lastError, "error");
  } finally {
    cloudState.syncing = false;
    renderCloudStatus();
  }
}

async function readCloudState() {
  const userId = cloudState.session?.user?.id;
  if (!cloudState.client || !userId) return null;
  const { data, error } = await cloudState.client
    .from("sorubank_cloud_states")
    .select("state, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function pushCloudState(options = {}) {
  const userId = cloudState.session?.user?.id;
  if (!cloudState.client || !userId) return;
  cloudState.syncing = true;
  renderCloudStatus();
  const pushStartedAt = new Date().toISOString();
  try {
    // Ensure latest in-memory skillState is flushed into skillProfileStore before collecting backup storage
    const activeProfile = getActiveSkillProfile();
    if (activeProfile && skillState) {
      activeProfile.state = skillState;
      localStorage.setItem(getSkillProfilesStorageKey(), JSON.stringify(skillProfileStore));
    }
    const payload = {
      user_id: userId,
      state: createBackupPackage(Object.keys(BACKUP_MODULES)),
      updated_at: pushStartedAt
    };
    const { data: upsertedRows, error } = await cloudState.client
      .from("sorubank_cloud_states")
      .upsert(payload, { onConflict: "user_id" })
      .select("updated_at")
      .maybeSingle();
    if (error) throw error;
    const syncedTimestamp = upsertedRows?.updated_at || payload.updated_at;
    cloudState.lastSyncAt = syncedTimestamp;
    localStorage.setItem("sorubank:cloud-last-sync", syncedTimestamp);
    const currentLocalWrite = localStorage.getItem("sorubank:cloud-local-write");
    if (!hasPendingPush && (!currentLocalWrite || Date.parse(currentLocalWrite) <= Date.parse(pushStartedAt))) {
      localStorage.removeItem("sorubank:cloud-local-write");
    }
    cloudState.lastError = "";
    if (!options.silent) showToast("Veriler buluta gönderildi.");
  } catch (error) {
    cloudState.lastError = `Buluta kaydedilemedi: ${error.message}`;
    if (!options.silent) showToast(cloudState.lastError, "error");
    if (options.throwOnError) throw error;
  } finally {
    cloudState.syncing = false;
    renderCloudStatus();
  }
}

async function syncCloudNow() {
  if (!cloudState.client) {
    showToast("Önce Supabase bağlantı ayarını kaydedin.", "warning");
    return;
  }
  if (!cloudState.session) {
    showToast("Eşitleme için önce giriş yapın.", "warning");
    return;
  }

  const overlay = document.getElementById("cloudLoadingOverlay");
  if (overlay) {
    overlay.removeAttribute("hidden");
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "block";
    if (title) title.textContent = "Veriler buluttan yükleniyor...";
    if (desc) desc.textContent = "Lütfen bekleyin, güncel veriler alınıyor.";
    if (errContainer) errContainer.style.display = "none";
  }

  try {
    const userId = cloudState.session.user.id;
    const { data: remote, error } = await withTimeout(
      cloudState.client
        .from("sorubank_cloud_states")
        .select("state, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      8000
    );
    if (error) throw error;

    if (remote?.state) {
      const isBackupPackage = remote.state.type === "sorubank-backup" && remote.state.storage;
      if (isBackupPackage) {
        isSyncingFromCloud = true;
        applyBackupPackage(remote.state, "replace");
        localStorage.setItem("sorubank:cloud-last-sync", remote.updated_at || new Date().toISOString());
        localStorage.removeItem("sorubank:cloud-local-write");
        cloudState.lastSyncAt = remote.updated_at;
        reloadAppState();
        isSyncingFromCloud = false;
      }
    } else {
      // Bulutta veri yok, yereli gönder
      await withTimeout(pushCloudState({ silent: true }), 8000);
    }

    if (overlay) overlay.setAttribute("hidden", "true");
  } catch (error) {
    const spinner = document.getElementById("cloudLoadingSpinner");
    const title = document.getElementById("cloudLoadingTitle");
    const desc = document.getElementById("cloudLoadingDesc");
    const errContainer = document.getElementById("cloudLoadingError");
    if (spinner) spinner.style.display = "none";
    if (title) title.textContent = "Bağlantı Hatası";
    if (desc) desc.textContent = error.message || "Bulut veritabanına bağlanılamadı.";
    if (errContainer) errContainer.style.display = "block";
  }
}

async function saveCloudConfigFromForm() {
  saveStoredCloudConfig({
    url: els.supabaseUrlInput.value,
    anonKey: els.supabaseAnonKeyInput.value
  });
  cloudState = {
    client: null,
    session: null,
    enabled: false,
    ready: false,
    syncing: false,
    lastSyncAt: "",
    lastError: ""
  };
  await initializeCloud();
  showToast("Supabase bağlantı ayarı kaydedildi.");
}
