function backupSelectedModules() {
  return getAppModule("settings")?.selectedBackupModules(Object.keys(BACKUP_MODULES)) || Object.keys(BACKUP_MODULES);
}

function backupKeysForModules(modules = Object.keys(BACKUP_MODULES)) {
  const keys = new Set();
  modules.forEach((moduleKey) => {
    const module = BACKUP_MODULES[moduleKey];
    if (!module) return;
    (module.keys || []).forEach((key) => keys.add(key));
    (module.prefixes || []).forEach((prefix) => {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (String(key || "").startsWith(prefix)) keys.add(key);
      }
    });
  });
  return [...keys];
}

function collectBackupStorage(modules = Object.keys(BACKUP_MODULES)) {
  return Object.fromEntries(backupKeysForModules(modules).map((key) => [key, localStorage.getItem(key)]));
}

function parseBackupStorageValue(value) {
  if (value == null || value === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function backupSummaryFromStorage(storage = {}) {
  const sorubank = parseBackupStorageValue(storage[STORAGE_KEY]) || {};
  const course = parseBackupStorageValue(storage[COURSE_STORAGE_KEY]) || {};
  const studentTracking = parseBackupStorageValue(storage[STUDENT_TRACKING_STORAGE_KEY]) || {};
  const annualPlan = parseBackupStorageValue(storage[ANNUAL_PLAN_STORAGE_KEY]) || {};
  const skillProfileKeys = Object.keys(storage).filter((key) => key === SKILL_PROFILES_KEY || key.startsWith(`${SKILL_PROFILES_KEY}:`));

  let skillSchools = 0;
  let skillStudents = 0;
  let skillBusinesses = 0;
  skillProfileKeys.forEach((key) => {
    const store = parseBackupStorageValue(storage[key]) || {};
    if (Array.isArray(store.profiles)) {
      store.profiles.forEach((profile) => {
        const stateVal = profile.state || {};
        if (Array.isArray(stateVal.schoolRecords)) skillSchools += stateVal.schoolRecords.length;
        if (Array.isArray(stateVal.students)) skillStudents += stateVal.students.length;
        if (Array.isArray(stateVal.businesses)) skillBusinesses += stateVal.businesses.length;
      });
    }
  });

  return {
    courses: Array.isArray(sorubank.courses) ? sorubank.courses.length : 0,
    questions: Array.isArray(sorubank.questions) ? sorubank.questions.length : 0,
    curriculumItems: Array.isArray(sorubank.curriculumItems) ? sorubank.curriculumItems.length : 0,
    skillSchools,
    skillStudents,
    skillBusinesses,
    courseModules: Array.isArray(course.modules) ? course.modules.length : 0,
    courseStudents: Array.isArray(course.students) ? course.students.length : 0,
    courseQuestions: course.questions && typeof course.questions === "object"
      ? Object.values(course.questions).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0)
      : 0,
    trackingClasses: Array.isArray(studentTracking.classes) ? studentTracking.classes.length : 0,
    trackingLessons: Array.isArray(studentTracking.lessons) ? studentTracking.lessons.length : 0,
    trackingStudents: Array.isArray(studentTracking.students) ? studentTracking.students.length : 0,
    trackingEvaluations: Array.isArray(studentTracking.routine) ? studentTracking.routine.length : 0,
    trackingHomework: Array.isArray(studentTracking.homework) ? studentTracking.homework.length : 0,
    trackingProjects: Array.isArray(studentTracking.projects) ? studentTracking.projects.length : 0,
    annualTemplates: Array.isArray(annualPlan.templates) ? annualPlan.templates.length : 0,
    annualGenerated: Array.isArray(annualPlan.generatedPlans) ? annualPlan.generatedPlans.length : 0,
    skillProfiles: skillProfileKeys.length
  };
}

function createBackupPackage(modules = Object.keys(BACKUP_MODULES), { reason = "manual" } = {}) {
  const uniqueModules = [...new Set(modules)].filter((moduleKey) => BACKUP_MODULES[moduleKey]);
  const storage = collectBackupStorage(uniqueModules);
  const summary = backupSummaryFromStorage(storage);
  return {
    app: "Okul Takip Sistemi",
    type: "sorubank-backup",
    version: BACKUP_PACKAGE_VERSION,
    reason,
    createdAt: new Date().toISOString(),
    modules: uniqueModules,
    moduleLabels: Object.fromEntries(uniqueModules.map((moduleKey) => [moduleKey, BACKUP_MODULES[moduleKey].label])),
    summary,
    storage
  };
}

function backupFileName(prefix = "okul-takip-sistemi-yedek") {
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
  return `${prefix}-${stamp}.json`;
}

function exportBackupPackage(modules = Object.keys(BACKUP_MODULES), prefix = "okul-takip-sistemi-tam-yedek") {
  const backup = createBackupPackage(modules);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  downloadBlob(blob, backupFileName(prefix));
  showToast("Yedek dosyası indirildi.");
}

function exportData() {
  exportBackupPackage(Object.keys(BACKUP_MODULES), "okul-takip-sistemi-tam-yedek");
}

function exportSelectedBackup() {
  exportBackupPackage(backupSelectedModules(), "okul-takip-sistemi-modul-yedek");
}

function normalizeBackupPackage(imported) {
  if ((imported?.type === "sorubank-backup" || imported?.type === "ots-backup") && imported.storage && typeof imported.storage === "object") {
    return imported;
  }
  if (Array.isArray(imported?.courses) && Array.isArray(imported?.questions)) {
    const normalized = normalizeState({ ...structuredClone(initialState), ...imported });
    return {
      app: "Okul Takip Sistemi",
      type: "sorubank-backup",
      version: 0,
      createdAt: new Date().toISOString(),
      modules: ["sorubank"],
      moduleLabels: { sorubank: "Soru Bankası" },
      summary: backupSummaryFromStorage({ [STORAGE_KEY]: JSON.stringify(normalized) }),
      storage: { [STORAGE_KEY]: JSON.stringify(normalized) }
    };
  }
  throw new Error("Geçersiz yedek dosyası");
}

function mergeBackupStorageValue(key, currentRaw, incomingRaw) {
  if (incomingRaw == null) return currentRaw;
  if (key === STORAGE_KEY) {
    const current = parseBackupStorageValue(currentRaw) || structuredClone(initialState);
    const incoming = parseBackupStorageValue(incomingRaw) || {};
    return JSON.stringify(normalizeState({
      ...structuredClone(initialState),
      ...current,
      ...incoming,
      courses: [...(Array.isArray(current.courses) ? current.courses : []), ...(Array.isArray(incoming.courses) ? incoming.courses : [])],
      curriculumItems: [...(Array.isArray(current.curriculumItems) ? current.curriculumItems : []), ...(Array.isArray(incoming.curriculumItems) ? incoming.curriculumItems : [])],
      questions: [...(Array.isArray(current.questions) ? current.questions : []), ...(Array.isArray(incoming.questions) ? incoming.questions : [])],
      archivedExams: [...(Array.isArray(current.archivedExams) ? current.archivedExams : []), ...(Array.isArray(incoming.archivedExams) ? incoming.archivedExams : [])],
      examBaskets: { ...(current.examBaskets || {}), ...(incoming.examBaskets || {}) },
      examAnswerSpaces: { ...(current.examAnswerSpaces || {}), ...(incoming.examAnswerSpaces || {}) }
    }));
  }
  if (key === COURSE_STORAGE_KEY) {
    const current = parseBackupStorageValue(currentRaw) || {};
    const incoming = parseBackupStorageValue(incomingRaw) || {};
    return JSON.stringify({
      ...current,
      ...incoming,
      schoolInfos: [...(Array.isArray(current.schoolInfos) ? current.schoolInfos : []), ...(Array.isArray(incoming.schoolInfos) ? incoming.schoolInfos : [])],
      modules: [...(Array.isArray(current.modules) ? current.modules : []), ...(Array.isArray(incoming.modules) ? incoming.modules : [])],
      students: [...(Array.isArray(current.students) ? current.students : []), ...(Array.isArray(incoming.students) ? incoming.students : [])],
      attendance: { ...(current.attendance || {}), ...(incoming.attendance || {}) },
      examSummaries: { ...(current.examSummaries || {}), ...(incoming.examSummaries || {}) },
      questions: { ...(current.questions || {}), ...(incoming.questions || {}) }
    });
  }
  if (key === SKILL_STORAGE_KEY) {
    const current = parseBackupStorageValue(currentRaw) || {};
    const incoming = parseBackupStorageValue(incomingRaw) || {};
    return JSON.stringify({
      ...current,
      ...incoming,
      schoolRecords: [...(Array.isArray(current.schoolRecords) ? current.schoolRecords : []), ...(Array.isArray(incoming.schoolRecords) ? incoming.schoolRecords : [])],
      teachers: [...(Array.isArray(current.teachers) ? current.teachers : []), ...(Array.isArray(incoming.teachers) ? incoming.teachers : [])],
      businesses: [...(Array.isArray(current.businesses) ? current.businesses : []), ...(Array.isArray(incoming.businesses) ? incoming.businesses : [])],
      students: [...(Array.isArray(current.students) ? current.students : []), ...(Array.isArray(incoming.students) ? incoming.students : [])],
      coordinators: [...(Array.isArray(current.coordinators) ? current.coordinators : []), ...(Array.isArray(incoming.coordinators) ? incoming.coordinators : [])],
      holidays: [...(Array.isArray(current.holidays) ? current.holidays : []), ...(Array.isArray(incoming.holidays) ? incoming.holidays : [])],
      wageManualAbsences: { ...(current.wageManualAbsences || {}), ...(incoming.wageManualAbsences || {}) },
      absenceRecords: { ...(current.absenceRecords || {}), ...(incoming.absenceRecords || {}) },
      reports: [...(Array.isArray(current.reports) ? current.reports : []), ...(Array.isArray(incoming.reports) ? incoming.reports : [])]
    });
  }
  if (key === LOCAL_USERS_KEY) {
    const current = parseBackupStorageValue(currentRaw);
    const incoming = parseBackupStorageValue(incomingRaw);
    if (Array.isArray(current) && Array.isArray(incoming)) {
      const byEmail = new Map(current.map((user) => [normalizeEmail(user.email), user]));
      incoming.forEach((user) => byEmail.set(normalizeEmail(user.email), { ...byEmail.get(normalizeEmail(user.email)), ...user }));
      return JSON.stringify([...byEmail.values()]);
    }
  }
  return incomingRaw;
}

function applyBackupPackage(backup, mode = "replace", modulesToRestore = backup.modules || Object.keys(BACKUP_MODULES)) {
  const storage = backup.storage || {};
  if (mode !== "merge") {
    backupKeysForModules(modulesToRestore).forEach((key) => {
      if (key !== BACKUP_SNAPSHOT_KEY) localStorage.removeItem(key);
    });
  }
  const allowedKeys = new Set();
  const allowedPrefixes = [];
  modulesToRestore.forEach((moduleKey) => {
    const module = BACKUP_MODULES[moduleKey];
    if (!module) return;
    (module.keys || []).forEach((key) => allowedKeys.add(key));
    (module.prefixes || []).forEach((prefix) => allowedPrefixes.push(prefix));
  });

  Object.entries(storage).forEach(([key, incomingRaw]) => {
    const isAllowed = allowedKeys.has(key) || allowedPrefixes.some((prefix) => key.startsWith(prefix));
    if (!isAllowed) return;
    if (incomingRaw == null) {
      localStorage.removeItem(key);
      return;
    }
    if (mode === "merge") {
      localStorage.setItem(key, mergeBackupStorageValue(key, localStorage.getItem(key), incomingRaw));
    } else {
      localStorage.setItem(key, incomingRaw);
    }
  });
}

function backupSummaryHtml(summary = {}, modulesToRestore = [], mode = "replace") {
  const lines = [];
  if (modulesToRestore.includes("sorubank") && (summary.courses || summary.questions || summary.curriculumItems)) {
    lines.push(`<li><strong>Soru Bankası:</strong> ${summary.courses || 0} ders, ${summary.questions || 0} soru, ${summary.curriculumItems || 0} kazanım</li>`);
  }
  if (modulesToRestore.includes("skill") && (summary.skillSchools || summary.skillBusinesses || summary.skillStudents)) {
    lines.push(`<li><strong>İME (Beceri Eğitimi):</strong> ${summary.skillSchools || 0} okul, ${summary.skillBusinesses || 0} işletme, ${summary.skillStudents || 0} öğrenci</li>`);
  }
  if (modulesToRestore.includes("course") && (summary.courseModules || summary.courseStudents || summary.courseQuestions)) {
    lines.push(`<li><strong>Kurs/Ders Takibi:</strong> ${summary.courseModules || 0} modül, ${summary.courseStudents || 0} öğrenci, ${summary.courseQuestions || 0} soru</li>`);
  }
  if (modulesToRestore.includes("student") && (summary.trackingClasses || summary.trackingLessons || summary.trackingStudents || summary.trackingEvaluations || summary.trackingHomework || summary.trackingProjects)) {
    lines.push(`<li><strong>Öğrenci Takibi:</strong> ${summary.trackingClasses || 0} sınıf, ${summary.trackingLessons || 0} ders, ${summary.trackingStudents || 0} öğrenci, ${summary.trackingEvaluations || 0} değerlendirme, ${summary.trackingHomework || 0} ödev, ${summary.trackingProjects || 0} proje</li>`);
  }
  if (modulesToRestore.includes("annualPlan") && (summary.annualTemplates || summary.annualGenerated)) {
    lines.push(`<li><strong>Yıllık Plan:</strong> ${summary.annualTemplates || 0} şablon, ${summary.annualGenerated || 0} üretilen plan</li>`);
  }
  if (modulesToRestore.includes("settings") && summary.skillProfiles) {
    lines.push(`<li><strong>Profil/Ayar:</strong> ${summary.skillProfiles || 0} İME profil kaydı</li>`);
  }

  const moduleText = modulesToRestore.map((moduleKey) => BACKUP_MODULES[moduleKey]?.label || moduleKey).join(", ") || "Hiçbiri";

  const warningText = mode === "merge"
    ? "Bu yedek, seçilen modüllerdeki mevcut verilerinizin üzerine eklenecektir."
    : "Bu yedek, seçilen modüllerdeki mevcut verilerinizin yerine geçecektir. Seçilmeyen diğer modülleriniz korunacaktır.";

  return `
    <div class="confirm-backup-rich" style="display: flex; flex-direction: column; gap: 12px; text-align: left; font-size: 0.85rem; line-height: 1.5; color: rgba(248, 251, 251, 0.85); font-family: sans-serif;">
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
        <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #9de0d6; font-weight: 600; display: flex; align-items: center; gap: 6px;">📦 Geri Yüklenecek Veriler</h4>
        <ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">
          ${lines.length > 0 ? lines.join("") : "<li>Seçilen modüller için yedek dosyasında veri bulunamadı.</li>"}
        </ul>
      </div>
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
        <h4 style="margin: 0 0 4px 0; font-size: 0.9rem; color: #9de0d6; font-weight: 600;">🛠️ İşlenecek Modüller</h4>
        <p style="margin: 0; color: rgba(248, 251, 251, 0.95); font-weight: 500;">${moduleText}</p>
      </div>
      <div style="padding: 10px 12px; background: rgba(235, 94, 85, 0.1); border: 1px solid rgba(235, 94, 85, 0.22); border-radius: 8px;">
        <strong style="color: #ff9f80; font-size: 0.82rem; display: block; text-align: center;">⚠️ ${warningText}</strong>
      </div>
      <p style="margin: 4px 0 0 0; font-weight: 600; text-align: center; color: rgba(248, 251, 251, 0.95);">Geri yükleme işlemine devam etmek istiyor musunuz?</p>
    </div>
  `;
}

async function restoreBackupPackage(backup, mode = "replace") {
  const selectedModules = backupSelectedModules();
  const modulesToRestore = (backup.modules || Object.keys(BACKUP_MODULES)).filter(m => selectedModules.includes(m));

  if (modulesToRestore.length === 0) {
    showToast("Geri yüklenecek hiçbir modül seçilmedi. Lütfen yukarıdan en az bir modül seçin.", "warning");
    return;
  }

  const summary = backup.summary || backupSummaryFromStorage(backup.storage);
  const summaryHtml = backupSummaryHtml(summary, modulesToRestore, mode);

  const confirmed = await appConfirm(summaryHtml, {
    title: "Yedekten geri yükle",
    okText: "Geri yükle",
    html: true
  });
  if (!confirmed) return;
  createAutoBackupSnapshot("before-restore", { silent: true });
  applyBackupPackage(backup, mode, modulesToRestore);
  showToast("Yedek geri yüklendi. Uygulama yenileniyor.");
  setTimeout(() => window.location.reload(), 350);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      const backup = normalizeBackupPackage(imported);
      const settingsModule = getAppModule("settings");
      const mode = settingsModule?.backupRestoreMode("replace") || "replace";
      await restoreBackupPackage(backup, mode);
    } catch {
      showToast("Bu dosya geçerli bir yedek dosyası gibi görünmüyor.", "error");
    } finally {
      settingsModule?.clearImportInput();
    }
  };
  reader.readAsText(file);
}

function loadBackupSnapshots() {
  try {
    const value = JSON.parse(localStorage.getItem(BACKUP_SNAPSHOT_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveBackupSnapshots(snapshots) {
  let limit = 20;
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    if (globalSettings.autoBackupLimit) {
      limit = Number(globalSettings.autoBackupLimit) || 20;
    }
  } catch (e) {}
  localStorage.setItem(BACKUP_SNAPSHOT_KEY, JSON.stringify(snapshots.slice(0, limit)));
}

function createAutoBackupSnapshot(reason = "auto", { silent = false } = {}) {
  try {
    const backup = createBackupPackage(Object.keys(BACKUP_MODULES), { reason });
    const snapshots = loadBackupSnapshots();
    snapshots.unshift({
      id: uid("backup"),
      createdAt: backup.createdAt,
      reason,
      summary: backup.summary,
      backup
    });
    saveBackupSnapshots(snapshots);
    updateBackupSnapshotStatus();
    if (!silent) showToast("Anlık otomatik yedek alındı.");
    return true;
  } catch (error) {
    try {
      const snapshots = loadBackupSnapshots();
      saveBackupSnapshots(snapshots.slice(0, 8));
    } catch {}
    if (!silent) showToast("Otomatik yedek alanı doldu. Lütfen tam yedek indirip saklayın.", "warning");
    return false;
  }
}

function scheduleAutoBackupSnapshot(reason = "change") {
  try {
    const globalSettings = JSON.parse(localStorage.getItem("sorubank:global-settings:v1") || "{}");
    if (globalSettings.autoBackupEnabled === false) return;
  } catch (e) {}
  clearTimeout(backupSnapshotTimer);
  backupSnapshotTimer = setTimeout(() => {
    createAutoBackupSnapshot(reason, { silent: true });
  }, 1500);
}

function formatBackupSnapshotDate(value) {
  if (!value) return "Henüz otomatik yedek yok";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function updateBackupSnapshotStatus() {
  const status = document.querySelector("#backupSnapshotStatus");
  if (!status) return;
  const latest = loadBackupSnapshots()[0];
  status.textContent = latest
    ? `Son otomatik yedek: ${formatBackupSnapshotDate(latest.createdAt)}`
    : "Henüz otomatik yedek yok";
}

async function restoreLatestSnapshot() {
  const latest = loadBackupSnapshots()[0];
  if (!latest?.backup) {
    showToast("Henüz otomatik yedek yok.", "warning");
    return;
  }
  await restoreBackupPackage(latest.backup, "replace");
}
