const ANNUAL_PLAN_KEY = "annual-plan:state:v1";

const annualSeedTemplates = [];

const annualDefaultMethods = [
  "Anlatım",
  "Soru-cevap",
  "Uygulamalı gösteri",
  "Araştırma",
  "Uygulama",
  "Bireysel öğrenme",
  "Tartışma",
  "Problem çözme",
  "Grup çalışması",
  "Beyin fırtınası"
];

const annualDefaultMaterials = [
  "Akıllı tahta",
  "Ders kitabı",
  "Çalışma kağıtları",
  "Örnek uygulamalar",
  "Bilgisayar",
  "Projeksiyon",
  "EBA içerikleri",
  "Sunu",
  "Mevzuat dokümanları",
  "Hesap makinesi"
];

const annualDefaults = {
  activeView: "wizard",
  selectedType: "mtal",
  selectedAreaId: "bilisim-teknolojileri",
  selectedTemplateId: "",
  license: {
    isLicensed: false,
    licenseKey: "",
    owner: "",
    expiresAt: "",
    plan: ""
  },
  credits: 1,
  unlockedPlans: [],
  pricingPackages: [],
  contactInfo: {},
  isAdmin: false,
  adminPassword: "",
  settings: {
    schoolName: "",
    teacherName: "",
    year: "",
    startDate: "",
    endDate: "",
    zumreName: "",
    araTatil1Start: "",
    araTatil1End: "",
    yariyilStart: "",
    yariyilEnd: "",
    araTatil2Start: "",
    araTatil2End: "",
    etkinlikStart: "",
    etkinlikEnd: "",
    addBelirliGunler: true,
    addAtaturkculuk: true,
    addPageNumbers: true,
    methods: annualDefaultMethods.slice(0, 6),
    materials: annualDefaultMaterials.slice(0, 4),
    exam1_1: "",
    exam1_2: "",
    exam2_1: "",
    exam2_2: ""
  },
  templates: annualSeedTemplates,
  mebCalendars: [],
  generatedPlans: [],
  previewPlanId: ""
};

const annualEls = {
  shell: document.querySelector("#annualPlanShell"),
  title: document.querySelector("#annualPageTitle"),
  subtitle: document.querySelector("#annualPageSubtitle"),
  moduleSwitch: document.querySelector("#annualModuleSwitchBtn"),
  navButtons: document.querySelectorAll("[data-annual-view]"),
  annualNavMobileSelect: document.querySelector("#annualNavMobileSelect"),
  panels: document.querySelectorAll("[data-annual-panel]"),
  stepper: document.querySelector("#annualStepper"),
  templateArea: document.querySelector("#annualTemplateAreaSelect"),
  templateGrade: document.querySelector("#annualTemplateGradeSelect"),
  templateSelect: document.querySelector("#annualTemplateSelect"),
  templateSummary: document.querySelector("#annualTemplateSummary"),
  typeGrid: document.querySelector("#annualPlanTypeGrid"),
  areaSearch: document.querySelector("#annualAreaSearch"),
  areaList: document.querySelector("#annualAreaList"),
  lessonList: document.querySelector("#annualLessonList"),
  schoolName: document.querySelector("#annualSchoolName"),
  teacherName: document.querySelector("#annualTeacherName"),
  mudurName: document.querySelector("#annualMudurName"),
  year: document.querySelector("#annualYear"),
  startDate: document.querySelector("#annualStartDate"),
  weekCount: document.querySelector("#annualWeekCount"),
  weeklyHours: document.querySelector("#annualWeeklyHours"),
  skipWeeks: document.querySelector("#annualSkipWeeks"),
  unitList: document.querySelector("#annualUnitList"),
  methodList: document.querySelector("#annualMethodList"),
  materialList: document.querySelector("#annualMaterialList"),
  generate: document.querySelector("#annualGenerateBtn"),
  print: document.querySelector("#annualPrintBtn"),
  excel: document.querySelector("#annualExcelBtn"),
  clearGenerated: document.querySelector("#annualClearGeneratedBtn"),
  preview: document.querySelector("#annualGeneratedPreview"),
  // Legacy import elements removed
  libraryGrid: document.querySelector("#annualLibraryGrid"),
  generatedList: document.querySelector("#annualGeneratedList"),
  defaultSchool: document.querySelector("#annualDefaultSchool"),
  defaultTeacher: document.querySelector("#annualDefaultTeacher"),
  defaultMudur: document.querySelector("#annualDefaultMudur"),
  defaultYear: document.querySelector("#annualDefaultYear"),
  defaultStart: document.querySelector("#annualDefaultStart"),
  defaultEnd: document.querySelector("#annualDefaultEnd"),
  defaultZumre: document.querySelector("#annualDefaultZumre"),
  zumreTeacherList: document.querySelector("#annualZumreTeacherList"),
  addZumreTeacher: document.querySelector("#annualAddZumreTeacherBtn"),
  removeZumreTeacher: document.querySelector("#annualRemoveZumreTeacherBtn"),
  defaultAraTatil1Start: document.querySelector("#annualDefaultAraTatil1Start"),
  defaultAraTatil1End: document.querySelector("#annualDefaultAraTatil1End"),
  defaultYariyilStart: document.querySelector("#annualDefaultYariyilStart"),
  defaultYariyilEnd: document.querySelector("#annualDefaultYariyilEnd"),
  defaultAraTatil2Start: document.querySelector("#annualDefaultAraTatil2Start"),
  defaultAraTatil2End: document.querySelector("#annualDefaultAraTatil2End"),
  defaultEtkinlikStart: document.querySelector("#annualDefaultEtkinlikStart"),
  defaultEtkinlikEnd: document.querySelector("#annualDefaultEtkinlikEnd"),
  defaultBelirliGunler: document.querySelector("#annualDefaultBelirliGunler"),
  defaultAtaturkculuk: document.querySelector("#annualDefaultAtaturkculuk"),
  defaultPageNumbers: document.querySelector("#annualDefaultPageNumbers"),
  defaultExam1_1: document.querySelector("#annualDefaultExam1_1"),
  defaultExam1_2: document.querySelector("#annualDefaultExam1_2"),
  defaultExam2_1: document.querySelector("#annualDefaultExam2_1"),
  defaultExam2_2: document.querySelector("#annualDefaultExam2_2"),
  fetchMebCalendar: document.querySelector("#annualFetchMebCalendarBtn"),
  mebCalendarStatus: document.querySelector("#annualMebCalendarStatus"),
  saveSettings: document.querySelector("#annualSaveSettingsBtn"),
  // License & Credit & Admin elements
  adminNavSection: document.querySelector("#annualAdminNavSection"),
  adminToggleBtn: document.querySelector("#annualAdminToggleBtn"),
  adminToggleBtnText: document.querySelector("#annualAdminToggleBtnText"),
  adminMobileOptGroup: document.querySelector("#annualNavMobileAdminOptGroup"),
  licenseModal: document.querySelector("#annualCreditModal") || document.querySelector("#annualLicenseModal"),
  licenseCloseBtn: document.querySelector("#annualCreditCloseBtn") || document.querySelector("#annualLicenseCloseBtn"),
  licenseKeyInput: document.querySelector("#annualCreditCodeInput") || document.querySelector("#annualLicenseKeyInput"),
  licenseVerifyBtn: document.querySelector("#annualCreditRedeemBtn") || document.querySelector("#annualLicenseVerifyBtn"),
  licenseStatusMsg: document.querySelector("#annualCreditStatusMsg") || document.querySelector("#annualLicenseStatusMsg"),
  licenseContactMsg: document.querySelector("#annualLicenseContactMsg"),
  licenseWhatsappLink: document.querySelector("#annualCreditWhatsappLink") || document.querySelector("#annualLicenseWhatsappLink"),
  licenseEmailLink: document.querySelector("#annualCreditEmailLink") || document.querySelector("#annualLicenseEmailLink"),
  licenseBadge: document.querySelector("#annualLicenseBadge"),
  licenseBadgeText: document.querySelector("#annualLicenseBadgeText"),
  licenseBadgeIcon: document.querySelector("#annualLicenseBadgeIcon"),
  topbarCreditsContainer: document.querySelector("#annualTopbarCreditsContainer"),
  topbarCreditsBadge: document.querySelector("#annualTopbarCreditsBadge"),
  topbarCreditsCount: document.querySelector("#annualTopbarCreditsCount"),
  topbarTopupBtn: document.querySelector("#annualTopbarTopupBtn"),
  step4CreditNotice: document.querySelector("#annualStep4CreditNotice"),
  step4CreditNoticeText: document.querySelector("#annualStep4CreditNoticeText"),
  step4TopupBtn: document.querySelector("#annualStep4TopupBtn"),
  modalCreditCount: document.querySelector("#annualModalCreditCount"),
  modalUnlockedCount: document.querySelector("#annualModalUnlockedCount"),
  creditTabCodeBtn: document.querySelector("#annualCreditTabCodeBtn"),
  creditTabBuyBtn: document.querySelector("#annualCreditTabBuyBtn"),
  creditTabCodeContent: document.querySelector("#annualCreditTabCodeContent"),
  creditTabBuyContent: document.querySelector("#annualCreditTabBuyContent"),
  pricingPackagesGrid: document.querySelector("#annualPricingPackagesGrid"),
  ibanHolder: document.querySelector("#annualIbanHolder"),
  ibanNumber: document.querySelector("#annualIbanNumber"),
  adminLoginModal: document.querySelector("#annualAdminLoginModal"),
  adminLoginCloseBtn: document.querySelector("#annualAdminLoginCloseBtn"),
  adminPasswordInput: document.querySelector("#annualAdminPasswordInput"),
  adminLoginError: document.querySelector("#annualAdminLoginError"),
  adminLoginSubmitBtn: document.querySelector("#annualAdminLoginSubmitBtn"),
  publishPlatformBtn: document.querySelector("#annualPublishPlatformBtn"),
  adminNewLicenseBtn: document.querySelector("#annualAdminNewLicenseBtn"),
  adminLicensesTableBody: document.querySelector("#annualAdminLicensesTableBody"),
  adminPlatformTemplateCount: document.querySelector("#annualAdminPlatformTemplateCount"),
  adminActiveLicenseCount: document.querySelector("#annualAdminActiveLicenseCount"),
  adminContactWhatsapp: document.querySelector("#annualAdminContactWhatsapp"),
  adminContactEmail: document.querySelector("#annualAdminContactEmail"),
  adminNewCreditBtn: document.querySelector("#annualAdminNewCreditBtn"),
  adminCreditCodesTableBody: document.querySelector("#annualAdminCreditCodesTableBody"),
  adminUsersTableBody: document.querySelector("#annualAdminUsersTableBody"),
  adminCreditCodesCount: document.querySelector("#annualAdminCreditCodesCount"),
  adminActiveCodesCount: document.querySelector("#annualAdminActiveCodesCount"),
  adminUsersCount: document.querySelector("#annualAdminUsersCount"),
  adminUnlockedPlansTotal: document.querySelector("#annualAdminUnlockedPlansTotal"),
  adminNewCreditModal: document.querySelector("#annualAdminNewCreditModal"),
  adminNewCreditCloseBtn: document.querySelector("#annualAdminNewCreditCloseBtn"),
  adminNewCreditCancelBtn: document.querySelector("#annualAdminNewCreditCancelBtn"),
  adminNewCreditForm: document.querySelector("#annualAdminNewCreditForm"),
  adminNewCreditCode: document.querySelector("#annualNewCreditCode"),
  adminNewCreditAmount: document.querySelector("#annualNewCreditAmount"),
  adminNewCreditMaxUses: document.querySelector("#annualNewCreditMaxUses"),
  adminNewCreditNote: document.querySelector("#annualNewCreditNote"),
  adminSetCreditModal: document.querySelector("#annualAdminSetCreditModal"),
  adminSetCreditCloseBtn: document.querySelector("#annualAdminSetCreditCloseBtn"),
  adminSetCreditCancelBtn: document.querySelector("#annualAdminSetCreditCancelBtn"),
  adminSetCreditForm: document.querySelector("#annualAdminSetCreditForm"),
  adminTargetUser: document.querySelector("#annualAdminTargetUser"),
  adminNewCredits: document.querySelector("#annualAdminNewCredits")
};

let annualState = loadAnnualState();
let annualCallbacks = {
  returnToModuleHub: typeof returnToModuleHub === "function" ? returnToModuleHub : null
};

function loadAnnualState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ANNUAL_PLAN_KEY) || "{}");
    const oldSeedIds = [
      "mtal-muhasebe-genel-muhasebe-10",
      "mtal-muhasebe-temel-muhasebe-9",
      "mtal-bilisim-programlama-10",
      "mesem-muhasebe-genel-muhasebe-11",
      "kurs-genel-ofis-uygulamalari"
    ];
    let templates = Array.isArray(parsed.templates) ? parsed.templates : [];
    templates = templates.filter(t => !oldSeedIds.includes(t.id));
    const activeView = (parsed.activeView && parsed.activeView !== "download") ? parsed.activeView : "wizard";
    return {
      ...annualDefaults,
      ...parsed,
      activeView,
      templates,
      license: { ...annualDefaults.license, ...(parsed.license || {}) },
      credits: Number(parsed.credits !== undefined ? parsed.credits : 1),
      unlockedPlans: Array.isArray(parsed.unlockedPlans) ? parsed.unlockedPlans : [],
      pricingPackages: Array.isArray(parsed.pricingPackages) ? parsed.pricingPackages : [],
      contactInfo: parsed.contactInfo || {},
      isAdmin: Boolean(parsed.isAdmin),
      adminPassword: parsed.adminPassword || "",
      mebCalendars: Array.isArray(parsed.mebCalendars) ? parsed.mebCalendars : [],
      generatedPlans: Array.isArray(parsed.generatedPlans) ? parsed.generatedPlans : [],
      importDrafts: [],
      mebCatalog: { ...annualDefaults.mebCatalog, ...(parsed.mebCatalog || {}), loading: false, error: "" },
      mebSelection: { ...annualDefaults.mebSelection, ...(parsed.mebSelection || {}) },
      settings: { ...annualDefaults.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return { ...annualDefaults, templates: annualSeedTemplates };
  }
}

function saveAnnualState() {
  localStorage.setItem(ANNUAL_PLAN_KEY, JSON.stringify(annualState));
  if (window.scheduleCloudSave) window.scheduleCloudSave();
}

function annualUid(prefix) {
  if (typeof uid === "function") return uid(prefix);
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function annualHtml(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value);
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function annualToast(message, type = "info") {
  if (typeof showToast === "function") showToast(message, type);
}

function currentAnnualYear() {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

function cleanLessonName(title) {
  if (!title) return "";
  let name = title;
  name = name.replace(/Ders Bilgi Formu/gi, "");
  name = name.replace(/Ders Kitabı/gi, "");
  name = name.replace(/Öğretim Programı/gi, "");
  name = name.replace(/Bireysel Öğrenme Materyali/gi, "");
  name = name.replace(/Yardımcı Kaynak/gi, "");
  name = name.replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, "");
  return name.trim();
}

function updateCustomTemplateTotalRatio() {
  const badge = document.getElementById("annualCustomTotalRatio");
  if (!badge) return;
  
  let total = 0;
  const inputs = document.querySelectorAll(".custom-unit-ratio");
  inputs.forEach(input => {
    const val = parseFloat(input.value) || 0;
    total += val;
  });
  
  if (total === 100) {
    badge.innerHTML = `(Toplam Ağırlık: <strong style="color: #0f766e;">%100</strong> ✅)`;
  } else {
    badge.innerHTML = `(Toplam Ağırlık: <strong style="color: #e11d48;">%${total}</strong>)`;
  }
}

function splitOutcomesIntoLines(outcomes) {
  if (!outcomes) return "";
  let text = String(outcomes).trim();
  
  // Merge any numbers/bullets that got split onto their own lines (e.g., "1.\nText" -> "1. Text")
  text = text.replace(/(?:^|(\r?\n))(\d+(?:\.\d+)*\.?|[a-zA-ZçğıiöügşÇİÖÜĞŞ]\)|[•▪➢\-*]+)\r?\n\s*/g, (m, p1, p2) => (p1 || "") + p2 + " ");
  
  // 1. If it has numbered objectives like "1. ... 2. ...", split before the numbers
  if (/\d+\./.test(text)) {
    return text.replace(/\s+(?=\d+\.)/g, "\n").trim();
  }
  
  // 2. Otherwise, if it has bullet points or is just sentences, split after periods (excluding digit-dot patterns)
  return text.replace(/([^\d])\.\s+/g, "$1.\n").trim();
}

function addAnnualDays(isoDate, days) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTurkishDateRange(startIso, endIso) {
  if (!startIso || !endIso) return "";
  const parse = (iso) => {
    const parts = iso.split("-");
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10)
    };
  };
  
  const start = parse(startIso);
  const end = parse(endIso);
  
  const TurkishMonths = [
    "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  const startDay = String(start.day).padStart(2, "0");
  const endDay = String(end.day).padStart(2, "0");
  
  if (start.year === end.year) {
    if (start.month === end.month) {
      return `${startDay}-${endDay} ${TurkishMonths[start.month]} ${start.year}`;
    } else {
      return `${startDay} ${TurkishMonths[start.month]} - ${endDay} ${TurkishMonths[end.month]} ${start.year}`;
    }
  } else {
    return `${startDay} ${TurkishMonths[start.month]} ${start.year} - ${endDay} ${TurkishMonths[end.month]} ${end.year}`;
  }
}

function annualWeekRange(startDate, weekIndex) {
  const start = addAnnualDays(startDate, weekIndex * 7);
  return { start, end: addAnnualDays(start, 4) };
}

function annualDateInWeek(dateIso, week) {
  return Boolean(dateIso && dateIso >= week.start && dateIso <= week.end);
}

function calculateWeeksBetween(startIso, endIso) {
  if (!startIso || !endIso) return 36;
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const diffTime = end - start;
  if (diffTime <= 0) return 36;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.round(diffDays / 7);
}

function getSkipsFromSettings(settings, termStartDate, weekCount) {
  const skips = [];
  if (!termStartDate) return skips;
  const holidayRanges = [
    { start: settings.araTatil1Start, end: settings.araTatil1End, note: "1. Ara Tatil" },
    { start: settings.yariyilStart, end: settings.yariyilEnd, note: "Yarıyıl Tatili" },
    { start: settings.araTatil2Start, end: settings.araTatil2End, note: "2. Ara Tatil" },
    { start: settings.etkinlikStart, end: settings.etkinlikEnd, note: "Etkinlik Haftası" }
  ].filter((r) => r.start);

  for (let i = 0; i < weekCount; i++) {
    const range = annualWeekRange(termStartDate, i);
    for (const hr of holidayRanges) {
      const hrStart = hr.start;
      const hrEnd = hr.end || hr.start;
      if (hrStart <= range.end && hrEnd >= range.start) {
        skips.push({ date: range.start, note: hr.note });
        break;
      }
    }
  }
  return skips;
}

function syncWizardInputsFromSettings() {
  const settings = annualState.settings || {};
  const weekCount = calculateWeeksBetween(settings.startDate, settings.endDate);
  const skips = getSkipsFromSettings(settings, settings.startDate, weekCount);
  const skipWeeksText = skips.map((s) => `${s.date} ${s.note}`).join("\n");

  if (annualEls.schoolName) annualEls.schoolName.value = settings.schoolName || "";
  let combinedTeacher = settings.zumreName || "";
  if (annualEls.teacherName) annualEls.teacherName.value = combinedTeacher;
  if (annualEls.mudurName) annualEls.mudurName.value = settings.mudurName || "";
  if (annualEls.year) annualEls.year.value = settings.year || currentAnnualYear();
  if (annualEls.startDate) annualEls.startDate.value = settings.startDate || "";
  if (annualEls.weekCount) annualEls.weekCount.value = weekCount;
  if (annualEls.skipWeeks) annualEls.skipWeeks.value = skipWeeksText;

  const summaryEl = document.querySelector("#annualWizardSettingsSummary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="annual-settings-summary-card annual-settings-summary-compact">
        <div class="summary-details annual-summary-pills">
          <span><strong>Okul:</strong> ${annualHtml(settings.schoolName || "Belirtilmemiş")}</span>
          <span><strong>Zümre Öğretmenleri:</strong> ${annualHtml(combinedTeacher || "Belirtilmemiş")}</span>
          <span><strong>Okul Müdürü:</strong> ${annualHtml(settings.mudurName || "Belirtilmemiş")}</span>
          <span><strong>Eğitim Yılı:</strong> ${annualHtml(settings.year || "Belirtilmemiş")}</span>
          <span><strong>Takvim:</strong> ${annualHtml(settings.startDate || "")} / ${annualHtml(settings.endDate || "")} (${weekCount} Hafta)</span>
          <span><strong>Tatil/Ara Günler:</strong> ${skips.length} hafta atlanacak</span>
        </div>
        <button type="button" class="ghost-action" data-annual-go-settings>Ayarları Düzenle ↗</button>
      </div>
    `;
    summaryEl.querySelector("[data-annual-go-settings]")?.addEventListener("click", () => {
      setAnnualView("settings");
    });
  }
}

function updateWizardStepVisibility() {
  const step1 = document.querySelector("#annualWizardStep1");
  const step2 = document.querySelector("#annualWizardStep2");
  const step3 = document.querySelector("#annualWizardStep3");
  const activeTemplateCard = document.querySelector("#annualWizardActiveTemplateCard");
  if (step1) step1.style.display = "none";
  if (step2) step2.style.display = "none";
  if (activeTemplateCard) activeTemplateCard.style.display = "none";
  return;
  const template = selectedTemplate();

  if (template && !annualState.showSteps1And2) {
    if (step1) step1.style.display = "none";
    if (step2) step2.style.display = "none";
    if (activeTemplateCard) {
      activeTemplateCard.style.display = "block";
      activeTemplateCard.innerHTML = `
        <div class="annual-active-template-bar">
          <div>
            <span class="annual-tag">Seçili Şablon</span>
            <h3>${annualHtml(template.lessonName)}</h3>
            <p>${annualHtml(template.areaName)} · ${annualHtml(template.grade)} · ${template.weeklyHours} saat · ${template.units.length} öğrenme birimi</p>
          </div>
          <button type="button" class="secondary-action" id="annualChangeTemplateBtn">Şablon Değiştir / Geri</button>
        </div>
      `;
      activeTemplateCard.querySelector("#annualChangeTemplateBtn")?.addEventListener("click", () => {
        annualState.showSteps1And2 = true;
        saveAnnualState();
        renderAnnualModule();
      });
    }
  } else {
    if (step1) step1.style.display = "";
    if (step2) step2.style.display = "";
    if (activeTemplateCard) activeTemplateCard.style.display = "none";
  }
}



function planTypeMeta(type) {
  return {
    mtal: ["Meslek Lisesi", "Alan ve sınıf dersleri"],
    mesem: ["Mesem", "Koordinatörlük ve beceri eğitimi uyumlu"],
    kurs: ["Kurs Planı", "Halk eğitim / kurs akışı"]
  }[type] || ["Plan", "Yıllık plan"];
}

function selectedTemplate() {
  return annualState.templates.find((item) => item.id === annualState.selectedTemplateId)
    || annualState.templates.find((item) => item.type === annualState.selectedType && item.areaId === annualState.selectedAreaId)
    || annualState.templates[0];
}

function areasForType(type) {
  const map = new Map();
  annualState.templates.filter((item) => item.type === type).forEach((item) => {
    if (!map.has(item.areaId)) {
      map.set(item.areaId, {
        id: item.areaId,
        name: item.areaName,
        count: 0
      });
    }
    map.get(item.areaId).count += 1;
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

function templatesForSelection() {
  return annualState.templates.filter((item) => item.type === annualState.selectedType && item.areaId === annualState.selectedAreaId);
}

function annualSortedTemplates() {
  return [...(annualState.templates || [])].sort((a, b) => {
    const areaCompare = String(a.areaName || "").localeCompare(String(b.areaName || ""), "tr");
    if (areaCompare) return areaCompare;
    const gradeCompare = String(a.grade || "").localeCompare(String(b.grade || ""), "tr", { numeric: true });
    if (gradeCompare) return gradeCompare;
    return String(a.lessonName || "").localeCompare(String(b.lessonName || ""), "tr");
  });
}

function annualUniquePickerItems(items, keyFn, labelFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!key || map.has(key)) return;
    map.set(key, { key, label: labelFn(item) || key });
  });
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "tr", { numeric: true }));
}

function annualTemplatesForPicker(areaId, grade) {
  return annualSortedTemplates().filter((item) => {
    const areaOk = !areaId || item.areaId === areaId;
    const gradeOk = !grade || item.grade === grade;
    return areaOk && gradeOk;
  });
}

function renderAnnualTemplatePicker() {
  if (!annualEls.templateArea || !annualEls.templateGrade || !annualEls.templateSelect) return;
  const allTemplates = annualSortedTemplates();
  if (!allTemplates.length) {
    annualEls.templateArea.innerHTML = `<option value="">Alan yok</option>`;
    annualEls.templateGrade.innerHTML = `<option value="">Sınıf yok</option>`;
    annualEls.templateSelect.innerHTML = `<option value="">Plan yok</option>`;
    if (annualEls.templateSummary) annualEls.templateSummary.innerHTML = `<div class="annual-empty">Kütüphanede kayıtlı yıllık plan yok.</div>`;
    return;
  }

  let currentTemplate = selectedTemplate() || allTemplates[0];
  let areaId = currentTemplate?.areaId || annualState.selectedAreaId || annualEls.templateArea.value || allTemplates[0].areaId;
  const areas = annualUniquePickerItems(allTemplates, (item) => item.areaId, (item) => item.areaName);
  if (!areas.some((item) => item.key === areaId)) areaId = areas[0]?.key || "";
  annualEls.templateArea.innerHTML = areas.map((item) => `<option value="${annualHtml(item.key)}">${annualHtml(item.label)}</option>`).join("");
  annualEls.templateArea.value = areaId;

  const areaTemplates = allTemplates.filter((item) => item.areaId === areaId);
  let grade = (currentTemplate?.areaId === areaId ? currentTemplate.grade : "") || annualEls.templateGrade.value || areaTemplates[0]?.grade || "";
  const grades = annualUniquePickerItems(areaTemplates, (item) => item.grade, (item) => item.grade);
  if (!grades.some((item) => item.key === grade)) grade = grades[0]?.key || "";
  annualEls.templateGrade.innerHTML = grades.map((item) => `<option value="${annualHtml(item.key)}">${annualHtml(item.label)}</option>`).join("");
  annualEls.templateGrade.value = grade;

  const pickerTemplates = annualTemplatesForPicker(areaId, grade);
  let templateId = (currentTemplate?.areaId === areaId && currentTemplate?.grade === grade ? currentTemplate.id : "") || annualEls.templateSelect.value || pickerTemplates[0]?.id || "";
  if (!pickerTemplates.some((item) => item.id === templateId)) templateId = pickerTemplates[0]?.id || "";
  annualEls.templateSelect.innerHTML = pickerTemplates.map((item) => `
    <option value="${annualHtml(item.id)}">${annualHtml(item.areaName)} · ${annualHtml(item.grade)} · ${annualHtml(item.lessonName)}</option>
  `).join("");
  annualEls.templateSelect.innerHTML = pickerTemplates.map((item) => `
    <option value="${annualHtml(item.id)}">${annualHtml(item.lessonName)}</option>
  `).join("");
  annualEls.templateSelect.value = templateId;

  const nextTemplate = annualState.templates.find((item) => item.id === templateId) || pickerTemplates[0] || allTemplates[0];
  if (nextTemplate) {
    annualState.selectedType = nextTemplate.type;
    annualState.selectedAreaId = nextTemplate.areaId;
    annualState.selectedTemplateId = nextTemplate.id;
    currentTemplate = nextTemplate;
  }

  if (annualEls.templateSummary && currentTemplate) {
    const totalHours = (currentTemplate.units || []).reduce((sum, unit) => sum + Number(unit.hours || 0), 0);
    annualEls.templateSummary.innerHTML = `
      <div class="annual-template-summary">
        <strong>${annualHtml(currentTemplate.lessonName)}</strong>
        <span>${annualHtml(currentTemplate.areaName)} · ${annualHtml(currentTemplate.grade)} · ${currentTemplate.units?.length || 0} birim · ${totalHours || currentTemplate.weeklyHours || 0} saat</span>
      </div>
    `;
  }
}

function renderAnnualPlanningOptions() {
  const settings = annualState.settings || {};
  const selectedMethods = new Set((Array.isArray(settings.methods) && settings.methods.length ? settings.methods : annualDefaultMethods.slice(0, 6)));
  const selectedMaterials = new Set((Array.isArray(settings.materials) && settings.materials.length ? settings.materials : annualDefaultMaterials.slice(0, 4)));

  if (annualEls.methodList) {
    annualEls.methodList.innerHTML = annualDefaultMethods.map((item) => `
      <label class="annual-choice-chip">
        <input type="checkbox" data-annual-method-option value="${annualHtml(item)}" ${selectedMethods.has(item) ? "checked" : ""} />
        <span>${annualHtml(item)}</span>
      </label>
    `).join("");
  }

  if (annualEls.materialList) {
    annualEls.materialList.innerHTML = annualDefaultMaterials.map((item) => `
      <label class="annual-choice-chip">
        <input type="checkbox" data-annual-material-option value="${annualHtml(item)}" ${selectedMaterials.has(item) ? "checked" : ""} />
        <span>${annualHtml(item)}</span>
      </label>
    `).join("");
  }
}

function selectedAnnualMethods() {
  const values = [...(annualEls.methodList?.querySelectorAll("[data-annual-method-option]:checked") || [])].map((input) => input.value);
  return values.length ? values : annualDefaultMethods.slice(0, 6);
}

function selectedAnnualMaterials() {
  const values = [...(annualEls.materialList?.querySelectorAll("[data-annual-material-option]:checked") || [])].map((input) => input.value);
  return values.length ? values : annualDefaultMaterials.slice(0, 4);
}

function setAnnualView(view) {
  if (view === "admin-licenses" && !annualState.isAdmin) {
    openAdminLoginModal();
    return;
  }
  annualState.activeView = view;
  saveAnnualState();
  annualEls.navButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.annualView === view));
  if (annualEls.annualNavMobileSelect) {
    annualEls.annualNavMobileSelect.value = view;
  }
  annualEls.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.annualPanel === view));
  const titles = {
    wizard: ["Yıllık Plan Hazırla", "Kütüphanedeki yıllık planı seçerek otomatik rapor oluşturun."],
    download: ["Kaynak Veri İndir", "Seçtiğiniz alana ve sınıfa ait ders bilgi formu ve ders kitaplarını indirin."],
    "plan-template": ["Plan Şablonu Hazırla", "Öğrenme birimlerini, sürelerini, ağırlıklarını, kazanım ve konularını girerek özel bir ders şablonu oluşturun."],
    import: ["Yıllık Plan Veri Aktarımı", "MEB'den alan ve ders bilgi formunu seçerek otomatik şablon üretin veya JSON/CSV aktarımı yapın."],
    library: ["Plan Kütüphanesi", "Kullanılabilir alan ve ders şablonları."],
    generated: ["Üretilen Planlar", "Oluşturulan planları görüntüleyin veya yazdırın."],
    settings: ["Plan Ayarları", "Varsayılan okul, öğretmen ve takvim bilgileri."],
    "admin-licenses": ["Lisans Yönetimi", "Yıllık plan lisans anahtarlarını görüntüleyin ve yönetin."]
  };
  const [title, subtitle] = titles[view] || titles.wizard;
  if (annualEls.title) annualEls.title.textContent = title;
  if (annualEls.subtitle) annualEls.subtitle.textContent = subtitle;
  if (view === "download") initDownloadView();
  if (view === "plan-template") initPlanTemplateView();
  if (view === "admin-licenses") initAdminLicensesView();
  renderAnnualModule();
}

function renderAnnualModule() {
  renderAnnualStepper();
  renderAnnualTemplatePicker();
  renderAnnualTypes();
  renderAnnualAreas();
  renderAnnualLessons();
  renderAnnualPlanningOptions();
  renderAnnualForm();
  renderAnnualUnits();
  renderAnnualPreview();
  // renderAnnualMebCatalog and renderAnnualImportPreview calls removed
  renderAnnualLibrary();
  renderAnnualGeneratedList();
  renderAnnualSettings();
  updateWizardStepVisibility();
  updateLicenseUI();
}

function renderAnnualStepper() {
  if (!annualEls.stepper) return;
  annualEls.stepper.hidden = true;
  annualEls.stepper.innerHTML = "";
  return;
  const template = selectedTemplate();
  const typeLabel = planTypeMeta(annualState.selectedType)[0];
  annualEls.stepper.innerHTML = [
    ["Plan türü", typeLabel],
    ["Alan", template?.areaName || "Seçilmedi"],
    ["Ders", template?.lessonName || "Seçilmedi"],
    ["Çıktı", annualState.previewPlanId ? "Hazır" : "Bekliyor"]
  ].map(([label, value], index) => `
    <article class="annual-step ${index < 3 || annualState.previewPlanId ? "is-complete" : ""}">
      <span>${index + 1}</span>
      <div><strong>${annualHtml(label)}</strong><small>${annualHtml(value)}</small></div>
    </article>
  `).join("");
}

function renderAnnualTypes() {
  if (!annualEls.typeGrid) return;
  annualEls.typeGrid.innerHTML = ["mtal", "mesem", "kurs"].map((type) => {
    const [label, detail] = planTypeMeta(type);
    return `
      <button class="${annualState.selectedType === type ? "is-active" : ""}" type="button" data-annual-type="${type}">
        <strong>${annualHtml(label)}</strong>
        <small>${annualHtml(detail)}</small>
      </button>
    `;
  }).join("");
}

function renderAnnualAreas() {
  if (!annualEls.areaList) return;
  const query = (annualEls.areaSearch?.value || "").toLocaleLowerCase("tr-TR");
  const areas = areasForType(annualState.selectedType).filter((area) => !query || area.name.toLocaleLowerCase("tr-TR").includes(query));
  if (!areas.length) {
    annualEls.areaList.innerHTML = `<div class="annual-empty">Bu tür için alan bulunamadı.</div>`;
    return;
  }
  annualEls.areaList.innerHTML = areas.map((area) => `
    <button class="${annualState.selectedAreaId === area.id ? "is-active" : ""}" type="button" data-annual-area="${annualHtml(area.id)}">
      <span>${annualHtml(area.name)}</span>
      <small>${area.count} ders</small>
    </button>
  `).join("");
}

function renderAnnualLessons() {
  if (!annualEls.lessonList) return;
  const templates = templatesForSelection();
  if (!templates.length) {
    annualEls.lessonList.innerHTML = `<div class="annual-empty">Bu alanda ders şablonu yok.</div>`;
    return;
  }
  annualEls.lessonList.innerHTML = templates.map((item) => `
    <button class="annual-lesson-card ${annualState.selectedTemplateId === item.id ? "is-active" : ""}" type="button" data-annual-template="${annualHtml(item.id)}">
      <div>
        <strong>${annualHtml(item.lessonName)}</strong>
        <small>${annualHtml(item.grade)} · ${annualHtml(item.year)} · ${item.weeklyHours} saat</small>
      </div>
      <span>${item.units.length} birim</span>
    </button>
  `).join("");
}

function renderAnnualForm() {
  const template = selectedTemplate();
  if (annualEls.weeklyHours && template) annualEls.weeklyHours.value = template.weeklyHours || 2;
  syncWizardInputsFromSettings();
}

function renderAnnualUnits() {
  if (!annualEls.unitList) return;
  const template = selectedTemplate();
  if (!template) {
    annualEls.unitList.innerHTML = `<div class="annual-empty">Önce ders seçin.</div>`;
    return;
  }
  const totalDbfHours = template.units.reduce((s, u) => s + (u.hours || 0), 0);
  const hasRatios = template.units.some((u) => {
    const r = parseFloat(String(u.ratio || "").replace(",", "."));
    return r > 0;
  });
  annualEls.unitList.innerHTML = `
    <div class="annual-unit-head">
      <strong>Öğrenme birimleri</strong>
      <small>${annualHtml(template.lessonName)} · ${template.units.length} birim · DBF toplam: ${totalDbfHours} saat${hasRatios ? " (oran bazlı dağıtılacak)" : ""}</small>
    </div>
    <div class="annual-template-unit-table-wrap">
      <table class="annual-template-unit-table">
        <thead>
          <tr>
            <th>Birim</th>
            <th>Saat</th>
            <th>Ağırlık</th>
          </tr>
        </thead>
        <tbody>
          ${template.units.map((unit) => `
            <tr>
              <td>${annualHtml(unit.title)}</td>
              <td>${annualHtml(unit.hours || "")}</td>
              <td>${unit.ratio ? `%${annualHtml(unit.ratio)}` : ""}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAnnualPreview() {
  if (!annualEls.preview) return;
  const plan = annualState.generatedPlans.find((item) => item.id === annualState.previewPlanId);
  annualEls.preview.innerHTML = plan ? planToHtml(plan, { compact: false }) : `<div class="annual-empty">Henüz plan üretilmedi.</div>`;
  updateCreditUI();
}



function renderAnnualLibrary() {
  if (!annualEls.libraryGrid) return;
  annualEls.libraryGrid.innerHTML = annualState.templates.map((item) => `
    <article class="annual-library-card">
      <span>${annualHtml(planTypeMeta(item.type)[0])}</span>
      <strong>${annualHtml(item.lessonName)}</strong>
      <small>${annualHtml(item.areaName)} · ${annualHtml(item.grade)} · ${item.units.length} öğrenme birimi</small>
      <div class="annual-library-actions">
        <button class="secondary-action" type="button" data-use-template="${annualHtml(item.id)}">Seç</button>
        ${annualSeedTemplates.some((seed) => seed.id === item.id) ? "" : `
          <button class="primary-action" type="button" data-edit-template="${annualHtml(item.id)}" style="background-color: #0ea5e9; border-color: #0ea5e9;">Düzenle</button>
          <button class="danger-action" type="button" data-delete-template="${annualHtml(item.id)}">Sil</button>
        `}
      </div>
    </article>
  `).join("");
}

function renderAnnualGeneratedList() {
  if (!annualEls.generatedList) return;
  if (!annualState.generatedPlans.length) {
    annualEls.generatedList.innerHTML = `<div class="annual-empty">Henüz üretilen plan yok.</div>`;
    return;
  }
  annualEls.generatedList.innerHTML = annualState.generatedPlans.map((plan) => `
    <article class="annual-generated-card">
      <div>
        <strong>${annualHtml(plan.lessonName)}</strong>
        <small>${annualHtml(plan.areaName)} · ${annualHtml(plan.grade)} · ${annualHtml(plan.year)} · ${plan.weeks.length} hafta</small>
      </div>
      <div class="annual-generated-actions">
        <button class="secondary-action" type="button" data-open-generated="${annualHtml(plan.id)}">Aç</button>
        <button class="danger-action" type="button" data-delete-generated="${annualHtml(plan.id)}">Sil</button>
      </div>
    </article>
  `).join("");
}

function formatLocalIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function annualDateFromIso(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

function annualWeekStartForDate(dateIso, termStartIso) {
  const date = annualDateFromIso(dateIso);
  const termStart = annualDateFromIso(termStartIso);
  if (!date || !termStart) return "";
  const diffDays = Math.floor((date - termStart) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.max(0, Math.floor(diffDays / 7));
  return addAnnualDays(termStartIso, weekIndex * 7);
}

function annualWeekStartBefore(anchorIso, weeksBefore, termStartIso) {
  const anchor = annualDateFromIso(anchorIso);
  if (!anchor || !termStartIso) return "";
  anchor.setDate(anchor.getDate() - (weeksBefore * 7));
  return annualWeekStartForDate(formatLocalIsoDate(anchor), termStartIso);
}

function annualAcademicWeekOptions(settings = {}) {
  const startDate = settings.startDate || "";
  const endDate = settings.endDate || "";
  const weekCount = calculateWeeksBetween(startDate, endDate);
  if (!startDate || !weekCount) return [];
  return Array.from({ length: Math.min(44, Math.max(1, weekCount)) }, (_, index) => {
    const range = annualWeekRange(startDate, index);
    return {
      value: range.start,
      label: `${index + 1}. hafta (${formatTurkishDateRange(range.start, range.end)})`
    };
  });
}

function populateAnnualExamWeekSelect(select, value, settings) {
  if (!select) return;
  const options = annualAcademicWeekOptions(settings);
  const normalizedValue = value ? (annualWeekStartForDate(value, settings.startDate) || value) : "";
  const optionHtml = [
    `<option value="">Sınav haftası seçilmedi</option>`,
    ...options.map((option) => `<option value="${annualHtml(option.value)}">${annualHtml(option.label)}</option>`)
  ];
  if (normalizedValue && !options.some((option) => option.value === normalizedValue)) {
    optionHtml.push(`<option value="${annualHtml(normalizedValue)}">${annualHtml(normalizedValue)}</option>`);
  }
  select.innerHTML = optionHtml.join("");
  select.value = normalizedValue;
}

function calculateDefaultExamDates(settings) {
  const defaults = { exam1_1: "", exam1_2: "", exam2_1: "", exam2_2: "" };
  if (!settings.startDate || !settings.endDate) return defaults;
  const start = annualDateFromIso(settings.startDate);
  const end = annualDateFromIso(settings.endDate);
  if (!start || !end) return defaults;

  const midpoint = (ratio) => {
    const date = new Date(start.getTime() + (end.getTime() - start.getTime()) * ratio);
    return annualWeekStartForDate(formatLocalIsoDate(date), settings.startDate);
  };

  defaults.exam1_1 = annualWeekStartBefore(settings.araTatil1Start, 1, settings.startDate) || midpoint(0.25);
  defaults.exam1_2 = annualWeekStartBefore(settings.yariyilStart, 2, settings.startDate) || midpoint(0.45);
  defaults.exam2_1 = annualWeekStartBefore(settings.araTatil2Start, 1, settings.startDate) || midpoint(0.68);
  defaults.exam2_2 = annualWeekStartBefore(settings.endDate, 2, settings.startDate) || midpoint(0.9);

  return defaults;
}

function autoCalculateExamsOnSettingsChange() {
  const currentSettings = {
    startDate: annualEls.defaultStart?.value || "",
    endDate: annualEls.defaultEnd?.value || "",
    araTatil1Start: annualEls.defaultAraTatil1Start?.value || "",
    yariyilStart: annualEls.defaultYariyilStart?.value || "",
    yariyilEnd: annualEls.defaultYariyilEnd?.value || "",
    araTatil2Start: annualEls.defaultAraTatil2Start?.value || ""
  };
  const defaults = calculateDefaultExamDates(currentSettings);
  populateAnnualExamWeekSelect(annualEls.defaultExam1_1, defaults.exam1_1, currentSettings);
  populateAnnualExamWeekSelect(annualEls.defaultExam1_2, defaults.exam1_2, currentSettings);
  populateAnnualExamWeekSelect(annualEls.defaultExam2_1, defaults.exam2_1, currentSettings);
  populateAnnualExamWeekSelect(annualEls.defaultExam2_2, defaults.exam2_2, currentSettings);
}

function mergeAnnualMebCalendars(calendars = []) {
  const byYear = new Map();
  [...(annualState.mebCalendars || []), ...calendars].forEach((item) => {
    if (!item?.year || !item.dates) return;
    byYear.set(item.year, item);
  });
  annualState.mebCalendars = [...byYear.values()].sort((a, b) => String(b.year).localeCompare(String(a.year), "tr"));
}

function renderAnnualYearOptions() {
  if (!annualEls.defaultYear) return;
  const currentValue = annualEls.defaultYear.value || annualState.settings?.year || currentAnnualYear();
  const years = new Set([
    currentValue,
    annualState.settings?.year,
    currentAnnualYear(),
    ...(annualState.mebCalendars || []).map((item) => item.year),
    ...[...annualEls.defaultYear.options].map((option) => option.value)
  ].filter(Boolean));
  annualEls.defaultYear.innerHTML = [...years]
    .sort((a, b) => String(b).localeCompare(String(a), "tr"))
    .map((year) => `<option value="${annualHtml(year)}">${annualHtml(year)}</option>`)
    .join("");
  annualEls.defaultYear.value = years.has(currentValue) ? currentValue : currentAnnualYear();
}

function splitAnnualZumreTeachers(value) {
  const teachers = String(value || "")
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return teachers.length ? teachers : [""];
}

function selectedAnnualZumreTeachers() {
  const inputs = annualEls.zumreTeacherList?.querySelectorAll("[data-zumre-teacher]") || [];
  return [...inputs].map((input) => input.value.trim()).filter(Boolean);
}

function allAnnualZumreTeacherValues() {
  const inputs = annualEls.zumreTeacherList?.querySelectorAll("[data-zumre-teacher]") || [];
  return [...inputs].map((input) => input.value.trim());
}

function syncAnnualZumreHidden() {
  if (annualEls.defaultZumre) {
    annualEls.defaultZumre.value = selectedAnnualZumreTeachers().join(", ");
  }
  const fields = annualEls.zumreTeacherList?.querySelectorAll(".annual-zumre-field") || [];
  fields.forEach((field) => {
    const button = field.querySelector("[data-remove-zumre-teacher]");
    if (button) button.disabled = fields.length <= 1;
  });
}

function renderAnnualZumreTeachers(value) {
  if (!annualEls.zumreTeacherList) return;
  const teachers = Array.isArray(value) ? (value.length ? value : [""]) : splitAnnualZumreTeachers(value);
  annualEls.zumreTeacherList.innerHTML = teachers.map((teacher, index) => `
    <div class="annual-zumre-field">
      <label>
        <span>Zümre öğretmeni #${index + 1}${index === 0 ? " (*)" : ""}</span>
        <input data-zumre-teacher type="text" value="${annualHtml(teacher)}" placeholder="Örn: YILMAZ ER" />
      </label>
      <button type="button" class="annual-zumre-remove" data-remove-zumre-teacher="${index}" title="Bu zümre öğretmenini kaldır">×</button>
    </div>
  `).join("");
  syncAnnualZumreHidden();
}

function addAnnualZumreTeacher() {
  const teachers = allAnnualZumreTeacherValues();
  teachers.push("");
  renderAnnualZumreTeachers(teachers);
  const inputs = annualEls.zumreTeacherList?.querySelectorAll("[data-zumre-teacher]") || [];
  inputs[inputs.length - 1]?.focus();
}

function removeAnnualZumreTeacher() {
  const inputs = annualEls.zumreTeacherList?.querySelectorAll("[data-zumre-teacher]") || [];
  if (inputs.length <= 1) return;
  const teachers = [...inputs].slice(0, -1).map((input) => input.value.trim());
  renderAnnualZumreTeachers(teachers);
}

function removeAnnualZumreTeacherAt(index) {
  const inputs = annualEls.zumreTeacherList?.querySelectorAll("[data-zumre-teacher]") || [];
  if (inputs.length <= 1) return;
  const teachers = [...inputs].map((input) => input.value.trim());
  teachers.splice(index, 1);
  renderAnnualZumreTeachers(teachers.length ? teachers : [""]);
}

function renderAnnualSettings() {
  const settings = annualState.settings || {};
  const hasExams = settings.exam1_1 || settings.exam1_2 || settings.exam2_1 || settings.exam2_2;
  const examDefaults = !hasExams ? calculateDefaultExamDates(settings) : {};
  renderAnnualYearOptions();

  if (annualEls.defaultSchool) annualEls.defaultSchool.value = settings.schoolName || "";
  if (annualEls.defaultTeacher) annualEls.defaultTeacher.value = settings.teacherName || "";
  if (annualEls.defaultMudur) annualEls.defaultMudur.value = settings.mudurName || "";
  if (annualEls.defaultYear) annualEls.defaultYear.value = settings.year || currentAnnualYear();
  if (annualEls.defaultStart) annualEls.defaultStart.value = settings.startDate || "";
  if (annualEls.defaultEnd) annualEls.defaultEnd.value = settings.endDate || "";
  if (annualEls.defaultZumre) annualEls.defaultZumre.value = settings.zumreName || "";
  renderAnnualZumreTeachers(settings.zumreName || "");
  if (annualEls.defaultAraTatil1Start) annualEls.defaultAraTatil1Start.value = settings.araTatil1Start || "";
  if (annualEls.defaultAraTatil1End) annualEls.defaultAraTatil1End.value = settings.araTatil1End || "";
  if (annualEls.defaultYariyilStart) annualEls.defaultYariyilStart.value = settings.yariyilStart || "";
  if (annualEls.defaultYariyilEnd) annualEls.defaultYariyilEnd.value = settings.yariyilEnd || "";
  if (annualEls.defaultAraTatil2Start) annualEls.defaultAraTatil2Start.value = settings.araTatil2Start || "";
  if (annualEls.defaultAraTatil2End) annualEls.defaultAraTatil2End.value = settings.araTatil2End || "";
  if (annualEls.defaultEtkinlikStart) annualEls.defaultEtkinlikStart.value = settings.etkinlikStart || "";
  if (annualEls.defaultEtkinlikEnd) annualEls.defaultEtkinlikEnd.value = settings.etkinlikEnd || "";
  if (annualEls.defaultBelirliGunler) annualEls.defaultBelirliGunler.checked = settings.addBelirliGunler !== false;
  if (annualEls.defaultAtaturkculuk) annualEls.defaultAtaturkculuk.checked = settings.addAtaturkculuk !== false;
  if (annualEls.defaultPageNumbers) annualEls.defaultPageNumbers.checked = settings.addPageNumbers !== false;

  const optionSettings = { ...settings, startDate: annualEls.defaultStart?.value || settings.startDate, endDate: annualEls.defaultEnd?.value || settings.endDate };
  populateAnnualExamWeekSelect(annualEls.defaultExam1_1, settings.exam1_1 || examDefaults.exam1_1 || "", optionSettings);
  populateAnnualExamWeekSelect(annualEls.defaultExam1_2, settings.exam1_2 || examDefaults.exam1_2 || "", optionSettings);
  populateAnnualExamWeekSelect(annualEls.defaultExam2_1, settings.exam2_1 || examDefaults.exam2_1 || "", optionSettings);
  populateAnnualExamWeekSelect(annualEls.defaultExam2_2, settings.exam2_2 || examDefaults.exam2_2 || "", optionSettings);
}

function parseAnnualSkips(text) {
  return (text || "").split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const date = line.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
      return { date, note: line.replace(date, "").trim() || "Atlanan hafta" };
    })
    .filter((item) => item.date);
}

function annualSlug(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[ç]/g, "c")
    .replace(/[ğ]/g, "g")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ş]/g, "s")
    .replace(/[ü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "plan";
}

function selectedAnnualUnits(template) {
  const checkedUnits = [...(annualEls.unitList?.querySelectorAll("[data-annual-unit]") || [])]
    .filter((input) => input.checked);
  if (!checkedUnits.length) {
    return (template.units || []).map((unit) => ({
      ...unit,
      hours: Math.max(1, Math.round(Number(unit.hours || 1)))
    }));
  }
  return checkedUnits.map((input) => {
    const index = Number(input.dataset.annualUnit);
    const unit = template.units[index];
    const hoursInput = annualEls.unitList.querySelector(`[data-annual-unit-hours="${index}"]`);
    const hours = Number(hoursInput?.value || unit.hours || 1);
    return { ...unit, hours: Math.max(1, Math.round(hours)) };
  });
}

/**
 * Split a combined outcomes string into individual outcome sentences.
 * DBF outcomes are typically period-separated sentences ending in Turkish verbs.
 */
function splitOutcomeSentences(text) {
  if (!text) return [];
  const numbered = String(text).match(/\d+(?:\.\d+)*\.\s+.*?(?=(?:\s+\d+(?:\.\d+)*\.\s+)|$)/g);
  if (numbered && numbered.length > 1) return numbered.map((s) => s.trim()).filter((s) => s.length > 5);
  // Split on period followed by whitespace (keeps each sentence intact)
  const raw = text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter((s) => s.length > 5);
  if (raw.length > 1) return raw;
  // Fallback: try splitting on numbered items "1. ... 2. ..."
  const fallbackNumbered = text.split(/(?=\d+\.\s)/).map((s) => s.trim()).filter((s) => s.length > 5);
  return fallbackNumbered.length > 1 ? fallbackNumbered : (raw.length ? raw : [text]);
}

/**
 * Given an array of items, return the slice that corresponds to
 * the [startFraction, endFraction) range (0..1).
 * Always returns at least one item when the array is non-empty.
 */
function sliceByFraction(items, startFrac, endFrac) {
  if (!items || !items.length) return [];
  const n = items.length;
  const startIdx = Math.floor(startFrac * n);
  const endIdx = Math.ceil(endFrac * n);
  const result = items.slice(startIdx, Math.max(startIdx + 1, endIdx));
  return result.length ? result : [items[Math.min(startIdx, n - 1)]];
}

function annualTopicKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanAnnualTopicText(value) {
  return String(value || "")
    .replace(/\b(Sa)\s+(?=[yY\?])/g, "$1")
    .replace(/(?<=[\p{Ll}])(?=[\p{Lu}])/gu, " ")
    .replace(/(?<=\?)(?=[\p{Lu}])/gu, " ")
    .replace(/\b([A-Za-zÇĞİÖŞÜçğıöşü])\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,})\b/g, "$1$2")
    .split(/\b(?:Aşağıdaki|Asagidaki|Aşağıda|Asagida|A.{0,8}daki)\b/i)[0]
    .replace(/\s+\d+\s*$/, "")
    .replace(/\b(Sa)\s+(?=[yY\?])/g, "$1")
    .replace(/(?<=[\p{Ll}])(?=[\p{Lu}])/gu, " ")
    .replace(/(?<=\?)(?=[\p{Lu}])/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAnnualTopicExcluded(value) {
  const key = annualTopicKey(value);
  if (!key) return true;
  const excluded = [
    "ders ici etkinlik",
    "ders ici",
    "etkinlik",
    "olcme ve degerlendirme",
    "olcme degerlendirme",
    "cevap anahtari",
    "alistirma",
    "uygulama",
    "sira sizde",
    "asagidaki",
    "asagida",
    "yapiniz",
    "yap n z",
    "cozunuz",
    "coz n z",
    "cevaplayiniz",
    "cevaplay n z",
    "inceleyiniz",
    "inceley n z",
    "ornek soru",
    "ornek uygulama"
  ];
  if (excluded.some((bit) => key.includes(bit))) return true;
  if (/^\d+\s+sa$/.test(key)) return true;
  if (/^\d+\s+[a-z]{1,2}$/.test(key)) return true;
  return false;
}

function cleanAnnualTopicList(items) {
  return (items || [])
    .map(cleanAnnualTopicText)
    .filter((topic) => topic && !isAnnualTopicExcluded(topic));
}

function sliceByFractionWithoutOverlap(items, startFrac, endFrac) {
  if (!items || !items.length) return [];
  const n = items.length;
  let startIdx = Math.round(Math.max(0, startFrac) * n);
  let endIdx = Math.round(Math.min(1, endFrac) * n);
  startIdx = Math.min(n, Math.max(0, startIdx));
  endIdx = Math.min(n, Math.max(0, endIdx));
  if (endIdx <= startIdx) {
    const fallbackIdx = Math.min(n - 1, Math.max(0, Math.floor(startFrac * n)));
    return [items[fallbackIdx]];
  }
  return items.slice(startIdx, endIdx);
}

function normalizeAnnualPairText(value) {
  return annualSlug(String(value || "").replace(/^\d+(?:\.\d+)*\.\s*/, ""));
}

function uniqueAnnualTexts(items) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const text = String(item || "").trim();
    const key = normalizeAnnualPairText(text);
    if (!text || seen.has(key)) return;
    seen.add(key);
    result.push(text);
  });
  return result;
}

function topicOutcomePairsForUnit(unit) {
  const pairs = Array.isArray(unit?.topicOutcomePairs) ? unit.topicOutcomePairs : [];
  const cleanedPairs = pairs
    .map((pair) => ({
      topic: cleanAnnualTopicText(pair?.topic || ""),
      topics: Array.isArray(pair?.topics)
        ? cleanAnnualTopicList(pair.topics)
        : [],
      outcomes: Array.isArray(pair?.outcomes)
        ? pair.outcomes.map((outcome) => String(outcome || "").trim()).filter(Boolean)
        : []
    }))
    .filter((pair) => (pair.topic && !isAnnualTopicExcluded(pair.topic)) || pair.topics.length || pair.outcomes.length);
  if (!cleanedPairs.length) return [];

  const topics = cleanAnnualTopicList(Array.isArray(unit?.topics) ? unit.topics : []).map(normalizeAnnualPairText).filter(Boolean);
  if (!topics.length) return cleanedPairs;
  const pairTopicKeys = new Set(cleanedPairs.flatMap((pair) => {
    const values = pair.topics?.length ? pair.topics : [pair.topic].filter((topic) => !isAnnualTopicExcluded(topic));
    return values.map(normalizeAnnualPairText).filter(Boolean);
  }));
  return topics.some((topic) => pairTopicKeys.has(topic)) ? cleanedPairs : [];
}

function sliceTopicOutcomePairsByFraction(pairs, startFrac, endFrac) {
  if (!pairs || !pairs.length) return [];
  const pairCount = pairs.length;
  const result = [];
  pairs.forEach((pair, index) => {
    const pairStart = index / pairCount;
    const pairEnd = (index + 1) / pairCount;
    const overlapStart = Math.max(startFrac, pairStart);
    const overlapEnd = Math.min(endFrac, pairEnd);
    if (overlapEnd <= overlapStart) return;

    const pairWidth = pairEnd - pairStart || 1;
    const localStart = (overlapStart - pairStart) / pairWidth;
    const localEnd = (overlapEnd - pairStart) / pairWidth;
    const sourceTopics = pair.topics?.length
      ? cleanAnnualTopicList(pair.topics)
      : cleanAnnualTopicList([pair.topic]);
    result.push({
      ...pair,
      topics: sliceByFractionWithoutOverlap(sourceTopics, localStart, localEnd)
    });
  });
  return result;
}

const annualEventsList = [
  { name: "İlköğretim Haftası", type: "week_rule", rule: "first_week" },
  { name: "Gaziler Günü", startMonth: 9, startDay: 19, endMonth: 9, endDay: 19 },
  { name: "Hayvanları Koruma Günü", startMonth: 10, startDay: 4, endMonth: 10, endDay: 4 },
  { name: "Ahilik Kültürü Haftası", startMonth: 10, startDay: 8, endMonth: 10, endDay: 12 },
  { name: "Cumhuriyet Bayramı", startMonth: 10, startDay: 29, endMonth: 10, endDay: 29, ataturk: "Cumhuriyetin ilanı, Atatürk'ün cumhuriyetçilik ilkesi ve çağdaşlaşma hedefi." },
  { name: "Kızılay Haftası", startMonth: 10, startDay: 29, endMonth: 11, endDay: 4 },
  { name: "Atatürk Haftası", startMonth: 11, startDay: 10, endMonth: 11, endDay: 16, ataturk: "Atatürk’ün hayatı, ilkeleri, inkılapları ve Atatürkçü düşünce sistemi." },
  { name: "Öğretmenler Günü", startMonth: 11, startDay: 24, endMonth: 11, endDay: 24, ataturk: "Atatürk'ün Başöğretmenliği, eğitimde çağdaşlaşma ve 'Fikri hür, irfanı hür, vicdanı hür nesiller' yetiştirme ülküsü." },
  { name: "Dünya Engelliler Günü", startMonth: 12, startDay: 3, endMonth: 12, endDay: 3 },
  { name: "İnsan Hakları ve Demokrasi Haftası", startMonth: 12, startDay: 10, endMonth: 12, endDay: 16 },
  { name: "Tutum, Yatırım ve Türk Malları Haftası", startMonth: 12, startDay: 12, endMonth: 12, endDay: 18 },
  { name: "Mehmet Akif Ersoy'u Anma Haftası", startMonth: 12, startDay: 20, endMonth: 12, endDay: 27 },
  { name: "Enerji Tasarrufu Haftası", startMonth: 1, startDay: 8, endMonth: 1, endDay: 14 },
  { name: "Sivil Savunma Günü", startMonth: 2, startDay: 28, endMonth: 2, endDay: 28 },
  { name: "Yeşilay Haftası", startMonth: 3, startDay: 1, endMonth: 3, endDay: 7 },
  { name: "İstiklâl Marşı'nın Kabulü ve M. Akif Ersoy'u Anma Günü", startMonth: 3, startDay: 12, endMonth: 3, endDay: 12, ataturk: "Millî bağımsızlık, millî marşımız ve vatan sevgisi." },
  { name: "Tüketiciyi Koruma Haftası", startMonth: 3, startDay: 15, endMonth: 3, endDay: 21 },
  { name: "Çanakkale Zaferi (Şehitler Günü)", startMonth: 3, startDay: 18, endMonth: 3, endDay: 18, ataturk: "Atatürk'ün askerî dehası, Çanakkale Savaşlarındaki rolü ve vatan sevgisi." },
  { name: "Orman Haftası", startMonth: 3, startDay: 21, endMonth: 3, endDay: 26 },
  { name: "Dünya Tiyatrolar Günü", startMonth: 3, startDay: 27, endMonth: 3, endDay: 27 },
  { name: "Kütüphane Haftası", startMonth: 3, startDay: 25, endMonth: 3, endDay: 31 },
  { name: "Turizm Haftası", startMonth: 4, startDay: 15, endMonth: 4, endDay: 22 },
  { name: "Ulusal Egemenlik ve Çocuk Bayramı", startMonth: 4, startDay: 23, endMonth: 4, endDay: 23, ataturk: "TBMM'nin açılışı, millî egemenlik anlayışı ve Atatürk'ün çocuklara verdiği değer." },
  { name: "Bilişim Haftası", startMonth: 5, startDay: 1, endMonth: 5, endDay: 7 },
  { name: "Trafik ve İlk Yardım Haftası", startMonth: 5, startDay: 1, endMonth: 5, endDay: 7 },
  { name: "Engelliler Haftası", startMonth: 5, startDay: 10, endMonth: 5, endDay: 16 },
  { name: "Müzeler Haftası", startMonth: 5, startDay: 18, endMonth: 5, endDay: 24 },
  { name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", startMonth: 5, startDay: 19, endMonth: 5, endDay: 19, ataturk: "Millî Mücadele’nin başlaması, Atatürk'ün gençliğe verdiği önem ve inkılapçılık ilkesi." },
  { name: "İstanbul'un Fethi", startMonth: 5, startDay: 29, endMonth: 5, endDay: 29 },
  { name: "Çevre ve İklim Değişikliği Haftası", startMonth: 6, startDay: 8, endMonth: 6, endDay: 14 }
];

const annualExamDefinitions = [
  { key: "exam1_1", label: "1. Dönem 1. Sınav" },
  { key: "exam1_2", label: "1. Dönem 2. Sınav" },
  { key: "exam2_1", label: "2. Dönem 1. Sınav" },
  { key: "exam2_2", label: "2. Dönem 2. Sınav" }
];

function getExamLabelsForWeek(startStr, endStr, settings) {
  return annualExamDefinitions
    .filter((exam) => settings[exam.key] && settings[exam.key] >= startStr && settings[exam.key] <= endStr)
    .map((exam) => exam.label);
}

function getEventsForWeek(startStr, endStr, isFirstWeek, settings) {
  const matched = [];
  const addBelirliGunler = settings.addBelirliGunler !== false;
  const addAtaturkculuk = settings.addAtaturkculuk !== false;

  if (!addBelirliGunler && !addAtaturkculuk) {
    return "";
  }

  const t1 = new Date(startStr);
  const t2 = new Date(endStr);
  if (isNaN(t1.getTime()) || isNaN(t2.getTime())) return "";

  t1.setHours(0, 0, 0, 0);
  t2.setHours(23, 59, 59, 999);

  function checkOverlap(event) {
    if (event.type === "week_rule" && event.rule === "first_week") {
      return isFirstWeek;
    }

    const y1 = t1.getFullYear();
    const eventStart1 = new Date(y1, event.startMonth - 1, event.startDay, 0, 0, 0, 0);
    const eventEnd1 = new Date(y1, event.endMonth - 1, event.endDay, 23, 59, 59, 999);
    if (t1 <= eventEnd1 && t2 >= eventStart1) return true;

    const y2 = t2.getFullYear();
    const eventStart2 = new Date(y2, event.startMonth - 1, event.startDay, 0, 0, 0, 0);
    const eventEnd2 = new Date(y2, event.endMonth - 1, event.endDay, 23, 59, 59, 999);
    if (t1 <= eventEnd2 && t2 >= eventStart2) return true;

    return false;
  }

  for (const event of annualEventsList) {
    if (checkOverlap(event)) {
      const parts = [];
      if (addBelirliGunler) {
        parts.push(event.name);
      }
      if (addAtaturkculuk && event.ataturk) {
        parts.push(`Atatürkçülük Konusu: ${event.ataturk}`);
      }
      if (parts.length > 0) {
        matched.push(parts.join("\n"));
      }
    }
  }

  // Check exam dates
  const exams = [
    { key: "exam1_1", label: "1. Dönem 1. Ortak Sınavı" },
    { key: "exam1_2", label: "1. Dönem 2. Ortak Sınavı" },
    { key: "exam2_1", label: "2. Dönem 1. Ortak Sınavı" },
    { key: "exam2_2", label: "2. Dönem 2. Ortak Sınavı" }
  ];

  exams.forEach(ex => {
    const val = settings[ex.key];
    if (val) {
      const exDate = new Date(val);
      if (!isNaN(exDate.getTime())) {
        exDate.setHours(12, 0, 0, 0);
        if (exDate >= t1 && exDate <= t2) {
          matched.push(ex.label);
        }
      }
    }
  });

  return matched.join("\n");
}

function generateAnnualWeeks(plan) {
  const { startDate, weekCount, weeklyHours, units, skips } = plan;
  const settings = { ...(annualState.settings || {}), ...plan };
  const weeks = [];
  let unitIndex = 0;
  let remainingHours = units[0]?.hours || 0;

  // Pre-split outcomes into individual sentences for each unit
  const unitOutcomes = units.map((u) => splitOutcomeSentences(u.outcomes));

  for (let index = 0; index < weekCount; index += 1) {
    const range = annualWeekRange(startDate, index);
    const skip = skips.find((item) => annualDateInWeek(item.date, range));
    
    // Automatically generate weekly note
    const eventsText = getEventsForWeek(range.start, range.end, index === 0, {
      ...settings,
      exam1_1: "",
      exam1_2: "",
      exam2_1: "",
      exam2_2: ""
    });
    const examLabels = getExamLabelsForWeek(range.start, range.end, settings);
    const note = [...examLabels, eventsText].filter(Boolean).join("\n");

    const week = { no: index + 1, start: range.start, end: range.end, skipped: Boolean(skip), skipNote: skip?.note || "", items: [], note, examLabels };
    if (!skip) {
      let capacity = weeklyHours;
      while (capacity > 0 && units[unitIndex]) {
        if (!remainingHours) remainingHours = units[unitIndex].hours;

        const unit = units[unitIndex];
        const totalUnitHours = unit.hours || 1;
        const consumedBefore = totalUnitHours - remainingHours;
        const usedHours = Math.min(capacity, remainingHours);
        const consumedAfter = consumedBefore + usedHours;

        // Calculate which fraction of the unit this week covers
        const startFraction = Math.max(0, consumedBefore / totalUnitHours);
        const endFraction = Math.min(1, consumedAfter / totalUnitHours);

        // Distribute outcomes and topics proportionally to this week's fraction
        const allOutcomes = unitOutcomes[unitIndex] || [];
        const allTopics = cleanAnnualTopicList(unit.topics || []);
        const allPairs = topicOutcomePairsForUnit(unit);

        const weekPairs = sliceTopicOutcomePairsByFraction(allPairs, startFraction, endFraction);
        const weekOutcomes = weekPairs.length
          ? uniqueAnnualTexts(weekPairs.flatMap((pair) => pair.outcomes))
          : sliceByFraction(allOutcomes, startFraction, endFraction);
        const weekTopics = weekPairs.length
          ? uniqueAnnualTexts(cleanAnnualTopicList(weekPairs.flatMap((pair) => pair.topics?.length ? pair.topics : [pair.topic])))
          : sliceByFraction(allTopics, startFraction, endFraction);

        week.items.push({
          title: unit.title,
          outcomes: weekOutcomes.join(" "),
          hours: usedHours,
          topics: weekTopics,
          outcomeCount: unit.outcomeCount || 0,
          ratio: unit.ratio || ""
        });
        capacity -= usedHours;
        remainingHours -= usedHours;
        if (remainingHours <= 0) {
          unitIndex += 1;
          remainingHours = units[unitIndex]?.hours || 0;
        }
      }
    }
    weeks.push(week);
  }
  return weeks;
}

function generateAnnualPlan() {
  const template = selectedTemplate();
  if (!template) return annualToast("Önce ders seçin.", "warning");
  const startDate = annualEls.startDate.value || "";
  if (!startDate) return annualToast("Başlangıç tarihi seçin.", "warning");
  const units = selectedAnnualUnits(template);
  if (!units.length) return annualToast("En az bir öğrenme birimi seçin.", "warning");
  const weeklyHours = Math.max(1, Number(annualEls.weeklyHours.value || template.weeklyHours || 1));
  const weekCount = Math.min(44, Math.max(1, Number(annualEls.weekCount.value || 36)));
  const skips = parseAnnualSkips(annualEls.skipWeeks.value);
  const methods = selectedAnnualMethods();
  const materials = selectedAnnualMaterials();
  annualState.settings = {
    ...(annualState.settings || {}),
    methods,
    materials
  };

  // ── Calculate actual available teaching hours ──
  let skippedWeeks = 0;
  for (let i = 0; i < weekCount; i++) {
    const range = annualWeekRange(startDate, i);
    if (skips.find((s) => annualDateInWeek(s.date, range))) {
      skippedWeeks++;
    }
  }
  const teachingWeeks = weekCount - skippedWeeks;
  const totalAvailableHours = teachingWeeks * weeklyHours;

  // ── Redistribute unit hours using ratio (percentage weights) ──
  const hasRatios = units.some((u) => {
    const r = parseFloat(String(u.ratio || "").replace(",", "."));
    return r > 0;
  });

  let adjustedUnits;
  if (hasRatios) {
    // Parse ratios and normalize to sum to 100
    const ratios = units.map((u) => {
      const r = parseFloat(String(u.ratio || "").replace(",", "."));
      return isFinite(r) && r > 0 ? r : 0;
    });
    const ratioSum = ratios.reduce((a, b) => a + b, 0);

    if (ratioSum > 0) {
      // Distribute totalAvailableHours proportionally
      const rawHours = ratios.map((r) => (r / ratioSum) * totalAvailableHours);
      // Round to whole numbers, ensure at least 1 hour per unit
      const roundedHours = rawHours.map((h) => Math.max(1, Math.round(h)));

      // Adjust rounding error: add or subtract from largest unit
      let diff = totalAvailableHours - roundedHours.reduce((a, b) => a + b, 0);
      if (diff !== 0) {
        // Find the unit with the largest ratio to absorb the rounding diff
        const largestIdx = ratios.indexOf(Math.max(...ratios));
        roundedHours[largestIdx] = Math.max(1, roundedHours[largestIdx] + diff);
      }

      adjustedUnits = units.map((u, i) => ({ ...u, hours: roundedHours[i] }));
    } else {
      adjustedUnits = units;
    }
  } else {
    // No ratio data: scale existing hours proportionally to fill all available time
    const originalTotalHours = units.reduce((sum, u) => sum + (u.hours || 1), 0);
    if (originalTotalHours > 0 && originalTotalHours !== totalAvailableHours) {
      const scale = totalAvailableHours / originalTotalHours;
      const scaledHours = units.map((u) => Math.max(1, Math.round((u.hours || 1) * scale)));
      let diff = totalAvailableHours - scaledHours.reduce((a, b) => a + b, 0);
      if (diff !== 0) {
        const largestIdx = units.reduce((maxIdx, u, i, arr) => u.hours > arr[maxIdx].hours ? i : maxIdx, 0);
        scaledHours[largestIdx] = Math.max(1, scaledHours[largestIdx] + diff);
      }
      adjustedUnits = units.map((u, i) => ({ ...u, hours: scaledHours[i] }));
    } else {
      adjustedUnits = units;
    }
  }

  const plan = {
    id: annualUid("annual-plan"),
    type: template.type,
    areaId: template.areaId,
    areaName: template.areaName,
    grade: template.grade,
    lessonName: template.lessonName,
    schoolName: annualEls.schoolName.value.trim(),
    teacherName: annualEls.teacherName.value.trim(),
    mudurName: annualEls.mudurName?.value.trim() || "",
    year: annualEls.year.value.trim() || template.year || currentAnnualYear(),
    startDate,
    weekCount,
    weeklyHours,
    methods: methods.join(", "),
    materials: materials.join(", "),
    addPageNumbers: (annualState.settings || {}).addPageNumbers !== false,
    units: adjustedUnits,
    skips,
    createdAt: new Date().toISOString()
  };
  const planEndDate = annualWeekRange(startDate, weekCount - 1).end;
  const settingsForPlan = { ...(annualState.settings || {}), startDate, endDate: (annualState.settings || {}).endDate || planEndDate };
  const examDefaults = calculateDefaultExamDates(settingsForPlan);
  plan.endDate = settingsForPlan.endDate;
  plan.exam1_1 = settingsForPlan.exam1_1 || examDefaults.exam1_1 || "";
  plan.exam1_2 = settingsForPlan.exam1_2 || examDefaults.exam1_2 || "";
  plan.exam2_1 = settingsForPlan.exam2_1 || examDefaults.exam2_1 || "";
  plan.exam2_2 = settingsForPlan.exam2_2 || examDefaults.exam2_2 || "";
  plan.weeks = generateAnnualWeeks(plan);
  annualState.generatedPlans = [plan, ...annualState.generatedPlans.filter((item) => item.id !== plan.id)].slice(0, 50);
  annualState.previewPlanId = plan.id;
  saveAnnualState();
  renderAnnualModule();
  annualToast(`Yıllık plan üretildi. (${teachingWeeks} öğretim haftası × ${weeklyHours} saat = ${totalAvailableHours} saat dağıtıldı.)`);
}

function formatTurkishDateSimple(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
}

function annualNoteHtml(week) {
  const fallback = "İşleniş, uygulama ve ölçme değerlendirme";
  const text = String(week?.note || fallback);
  const examLabels = new Set(Array.isArray(week?.examLabels) ? week.examLabels : []);
  return text.split(/\r?\n/).map((line) => {
    const escaped = annualHtml(line);
    return examLabels.has(line) ? `<strong>${escaped}</strong>` : escaped;
  }).join("<br>");
}

function annualWeekDateHtml(week) {
  return `<strong>${annualHtml(`${week.no}. hafta`)}</strong><br><span>${annualHtml(formatTurkishDateRange(week.start, week.end))}</span>`;
}

function annualUpper(value) {
  return String(value || "").toLocaleUpperCase("tr-TR");
}

function annualLineHtml(value) {
  return annualHtml(value || "").replace(/\r?\n/g, "<br>");
}

function annualPlanTitleHtml(plan) {
  let area = plan.areaName || "";
  if (area && !annualUpper(area).endsWith("ALANI")) area += " ALANI";
  const firstLine = `${plan.year || currentAnnualYear()} EĞİTİM-ÖĞRETİM YILI ${annualUpper(plan.schoolName || "")}`.trim();
  const secondLine = `${annualUpper(area)} ${annualUpper(plan.grade || "")} ${annualUpper(plan.lessonName || "")} DERSİ ÜNİTELENDİRİLMİŞ YILLIK DERS PLANI`.trim();
  return `${annualHtml(firstLine)}<br>${annualHtml(secondLine)}`;
}

function annualWeekTopicHtml(week) {
  let lastTitle = "";
  const lines = [];
  (week.items || []).forEach((item) => {
    const title = String(item.title || "").trim();
    if (title && title !== lastTitle) {
      lines.push(`<strong>${annualHtml(`ÖĞRENME BİRİMİ: ${annualUpper(title)}`)}</strong>`);
      lastTitle = title;
    }
    const topics = cleanAnnualTopicList(item.topics || []);
    topics.forEach((topic, index) => {
      const cleanTopic = String(topic || "").trim();
      if (!cleanTopic) return;
      const hasMarker = /^((?:\d+(?:\.\d+)*|[A-Za-zÇĞİÖŞÜçğıöşü]|[IVXLCDMivxlcdm]+)\b\.?\s*|^[•\-*])/.test(cleanTopic);
      lines.push(annualHtml(hasMarker ? cleanTopic : `${index + 1}. ${cleanTopic}`));
    });
  });
  return lines.join("<br>");
}

function annualWeekOutcomesHtml(week) {
  const outcomes = uniqueAnnualTexts((week.items || []).map((item) => item.outcomes).filter(Boolean));
  return annualLineHtml(outcomes.join("\n"));
}

function annualWeekHours(week, plan) {
  const sum = (week.items || []).reduce((total, item) => total + Number(item.hours || 0), 0);
  return sum || Number(plan.weeklyHours || 0) || "";
}

function planToHtml(plan, { compact = false } = {}) {
  const rawTeachers = plan.teacherName ? plan.teacherName.split(/[,/]/) : [];
  const teachersList = rawTeachers.map((t) => t.trim()).filter(Boolean);
  const methods = plan.methods || "Anlatım, soru-cevap, uygulamalı gösteri, araştırma, uygulama, bireysel öğrenme, tartışma";
  const materials = plan.materials || "Akıllı tahta, ders kitabı, çalışma kağıtları, örnek uygulamalar";
  return `
    <article class="annual-plan-output annual-plan-output-excel ${compact ? "is-compact" : ""}">
      <div class="annual-output-table-wrap">
        <table class="annual-output-table">
          <colgroup>
            <col class="annual-col-week">
            <col class="annual-col-hour">
            <col class="annual-col-outcome">
            <col class="annual-col-topic">
            <col class="annual-col-method">
            <col class="annual-col-material">
            <col class="annual-col-note">
          </colgroup>
          <thead>
            <tr>
              <th class="annual-output-title" colspan="7">${annualPlanTitleHtml(plan)}</th>
            </tr>
            <tr>
              <th>Hafta / Tarih</th>
              <th>Saat</th>
              <th>Kazanım</th>
              <th>Konu</th>
              <th>Öğretim Teknikleri</th>
              <th>Araç - Gereç</th>
              <th>Açıklama</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              return plan.weeks.map((week) => {
                if (week.skipped) {
                  const skipRange = formatTurkishDateRange(week.start, week.end);
                  const breakText = `${week.skipNote || "Ara / tatil"}${skipRange ? ` (${skipRange})` : ""}`;
                  return `
                    <tr class="annual-break-row">
                      <td colspan="7">${annualHtml(annualUpper(breakText))}</td>
                    </tr>
                  `;
                }
                if (!week.items.length) {
                  return `
                    <tr>
                      <td>${annualWeekDateHtml(week)}</td>
                      <td colspan="6">Planlanacak öğrenme birimi kalmadı.</td>
                    </tr>
                  `;
                }
                return `
                  <tr>
                    <td>${annualWeekDateHtml(week)}</td>
                    <td class="annual-output-hour">${annualWeekHours(week, plan)}</td>
                    <td>${annualWeekOutcomesHtml(week)}</td>
                    <td>${annualWeekTopicHtml(week)}</td>
                    <td>${annualHtml(methods)}</td>
                    <td>${annualHtml(materials)}</td>
                    <td>${annualNoteHtml(week)}</td>
                  </tr>
                `;
              }).join("");
            })()}
          </tbody>
        </table>
      </div>
      
      <div class="annual-plan-footer" style="margin-top: 30px; page-break-inside: avoid; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 20px;">
        <div class="annual-plan-descriptions" style="margin-bottom: 25px; font-style: italic; font-size: 0.9rem; line-height: 1.6; text-align: left; opacity: 0.85;">
          <p style="margin: 0 0 8px;">Bu plan Mesleki ve Teknik Eğitim Genel Müdürlüğü ile Talim Terbiye Kurulunun yayınladığı Çerçeve Öğretim Programı ve Ders Bilgi Formlarına göre hazırlanmıştır.</p>
          <p style="margin: 0;">Atatürkçülük konuları ile ilgili olarak Talim ve Terbiye Kurulu Başkanlığının 2104 ve 2488 sayılı Tebliğler Dergisinden yararlanılmıştır.</p>
        </div>
        
        <div class="annual-plan-signatures" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: center; margin-top: 60px;">
          ${teachersList.map((t) => `
            <div class="sig-block" style="padding: 12px;">
              <strong style="display: block; font-size: 0.95rem;">${annualHtml(t)}</strong>
              <span style="font-size: 0.85rem; display: block; margin-top: 4px; opacity: 0.8;">Zümre Öğretmeni</span>
            </div>
          `).join("")}
        </div>
        
        <div class="annual-plan-approval" style="text-align: center; margin-top: 80px; padding-top: 20px;">
          <p style="font-size: 0.85rem; margin: 0 0 4px; opacity: 0.8;">${plan.startDate ? formatTurkishDateSimple(plan.startDate) : ""}</p>
          <p style="font-weight: bold; margin: 0 0 4px; font-size: 0.95rem;">Uygundur</p>
          <strong style="display: block; font-size: 0.95rem;">${annualHtml(plan.mudurName || "")}</strong>
          <span style="font-size: 0.85rem; display: block; margin-top: 4px; opacity: 0.8;">Okul Müdürü</span>
        </div>
      </div>
    </article>
  `;
}

function getUserId() {
  let uid = localStorage.getItem("sorubank:user-id");
  if (!uid) {
    uid = "usr-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem("sorubank:user-id", uid);
  }
  return uid;
}

function getUserEmail() {
  try {
    const session = JSON.parse(localStorage.getItem("sorubank:local-session") || "{}");
    return session.email || "";
  } catch {
    return "";
  }
}

function getPlanFingerprint(plan) {
  if (!plan) return "";
  const name = annualSlug(plan.lessonName || "ders");
  const grade = annualSlug(plan.grade || "tum");
  const year = annualSlug(plan.year || "2026");
  return `${name}_${grade}_${year}`.toLowerCase();
}

function isPlanUnlocked(plan) {
  if (annualState.isAdmin || (annualState.license && annualState.license.isLicensed)) return true;
  const fp = getPlanFingerprint(plan);
  return Array.isArray(annualState.unlockedPlans) && annualState.unlockedPlans.includes(fp);
}

function isPlanLicensedOrAdmin() {
  return Boolean(annualState.isAdmin || annualState.license?.isLicensed);
}

function openCreditModal(defaultTab = "code") {
  if (!annualEls.licenseModal) return;
  setCreditTab(defaultTab);
  updateCreditUI();
  if (annualEls.licenseStatusMsg) {
    annualEls.licenseStatusMsg.style.display = "none";
    annualEls.licenseStatusMsg.textContent = "";
  }
  if (annualEls.licenseKeyInput) annualEls.licenseKeyInput.value = "";
  if (typeof annualEls.licenseModal.showModal === "function") {
    annualEls.licenseModal.showModal();
  } else {
    annualEls.licenseModal.style.display = "block";
  }
}

function closeCreditModal() {
  if (annualEls.licenseModal) {
    if (typeof annualEls.licenseModal.close === "function") annualEls.licenseModal.close();
    else annualEls.licenseModal.style.display = "none";
  }
}

const openLicenseModal = openCreditModal;
const closeLicenseModal = closeCreditModal;

function setCreditTab(tab = "code") {
  if (annualEls.creditTabCodeBtn && annualEls.creditTabBuyBtn) {
    const isCode = tab === "code";
    annualEls.creditTabCodeBtn.classList.toggle("is-active", isCode);
    annualEls.creditTabBuyBtn.classList.toggle("is-active", !isCode);
    annualEls.creditTabCodeBtn.style.color = "";
    annualEls.creditTabCodeBtn.style.borderBottom = "";
    annualEls.creditTabBuyBtn.style.color = "";
    annualEls.creditTabBuyBtn.style.borderBottom = "";
    if (annualEls.creditTabCodeContent) annualEls.creditTabCodeContent.style.display = isCode ? "flex" : "none";
    if (annualEls.creditTabBuyContent) annualEls.creditTabBuyContent.style.display = isCode ? "none" : "flex";
    if (!isCode) renderPricingPackages();
  }
}

function setCreditStatus(msg, type = "info") {
  if (!annualEls.licenseStatusMsg) return;
  annualEls.licenseStatusMsg.textContent = msg;
  annualEls.licenseStatusMsg.style.display = "block";
  annualEls.licenseStatusMsg.className = `annual-credit-status-msg is-${type}`;
  annualEls.licenseStatusMsg.style.color = "";
}

const showLicenseStatus = setCreditStatus;

async function redeemCreditCode(code = "") {
  const rawKey = String(code || annualEls.licenseKeyInput?.value || "").trim().toUpperCase();
  if (!rawKey) {
    setCreditStatus("Lütfen bir kredi kodu veya lisans anahtarı girin.", "error");
    return;
  }
  if (annualEls.licenseVerifyBtn) annualEls.licenseVerifyBtn.disabled = true;
  setCreditStatus("Kod kontrol ediliyor...", "info");

  try {
    if (rawKey.startsWith("OTS-")) {
      const res = await fetch("/api/annual-verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: rawKey })
      });
      const data = await res.json();
      if (data.valid) {
        annualState.license = {
          isLicensed: true,
          licenseKey: rawKey,
          owner: data.owner || "Lisanslı Kullanıcı",
          expiresAt: data.expiresAt || "",
          plan: data.plan || "full"
        };
        if (data.isAdmin) annualState.isAdmin = true;
        saveAnnualState();
        updateCreditUI();
        setCreditStatus(`✅ Kurumsal Lisans aktifleştirildi: ${data.owner}`, "success");
        annualToast(`Kurumsal lisans aktifleştirildi: ${data.owner}`);
        return;
      }
    }

    const res = await fetch("/api/annual-redeem-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: rawKey,
        userId: getUserId(),
        email: getUserEmail()
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Geçersiz veya süresi dolmuş kredi kodu.");
    }
    setCreditStatus(`🎉 ${data.message}`, "success");
    annualToast(data.message || "Kredi başarıyla yüklendi!");
    if (annualEls.licenseKeyInput) annualEls.licenseKeyInput.value = "";
    await syncUserCredits();
  } catch (e) {
    setCreditStatus(e.message, "error");
  } finally {
    if (annualEls.licenseVerifyBtn) annualEls.licenseVerifyBtn.disabled = false;
  }
}

const verifyLicenseKey = redeemCreditCode;

function openAdminLoginModal() {
  if (annualState.isAdmin) {
    if (confirm("Yönetici modundan çıkmak istiyor musunuz?")) {
      handleAdminLogout();
    }
    return;
  }
  if (annualEls.adminLoginModal) {
    if (annualEls.adminLoginError) annualEls.adminLoginError.style.display = "none";
    if (annualEls.adminPasswordInput) {
      annualEls.adminPasswordInput.value = "";
      setTimeout(() => annualEls.adminPasswordInput?.focus(), 100);
    }
    if (typeof annualEls.adminLoginModal.showModal === "function") annualEls.adminLoginModal.showModal();
    else annualEls.adminLoginModal.style.display = "block";
  }
}

function closeAdminLoginModal() {
  if (annualEls.adminLoginModal) {
    if (typeof annualEls.adminLoginModal.close === "function") annualEls.adminLoginModal.close();
    else annualEls.adminLoginModal.style.display = "none";
  }
}

async function handleAdminLogin() {
  const password = annualEls.adminPasswordInput?.value || "";
  if (!password) {
    if (annualEls.adminLoginError) {
      annualEls.adminLoginError.textContent = "Lütfen yönetici şifresini girin.";
      annualEls.adminLoginError.style.display = "block";
    }
    return;
  }
  if (annualEls.adminLoginSubmitBtn) annualEls.adminLoginSubmitBtn.disabled = true;
  try {
    const res = await fetch("/api/annual-verify-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: password })
    });
    const data = await res.json();
    if (data.valid && data.isAdmin) {
      annualState.isAdmin = true;
      annualState.adminPassword = password;
      saveAnnualState();
      updateLicenseUI();
      closeAdminLoginModal();
      annualToast("Yönetici girişi başarılı. Yönetici araçları açıldı.");
    } else {
      if (annualEls.adminLoginError) {
        annualEls.adminLoginError.textContent = "Geçersiz yönetici şifresi!";
        annualEls.adminLoginError.style.display = "block";
      }
    }
  } catch (e) {
    if (annualEls.adminLoginError) {
      annualEls.adminLoginError.textContent = `Giriş hatası: ${e.message}`;
      annualEls.adminLoginError.style.display = "block";
    }
  } finally {
    if (annualEls.adminLoginSubmitBtn) annualEls.adminLoginSubmitBtn.disabled = false;
  }
}

function handleAdminLogout() {
  annualState.isAdmin = false;
  annualState.adminPassword = "";
  saveAnnualState();
  updateLicenseUI();
  if (["download", "plan-template", "admin-licenses"].includes(annualState.activeView)) {
    setAnnualView("wizard");
  }
  annualToast("Yönetici oturumu kapatıldı.");
}

function updateCreditUI() {
  const currentPlan = annualState.generatedPlans.find(item => item.id === annualState.previewPlanId);
  const planUnlocked = currentPlan ? isPlanUnlocked(currentPlan) : false;

  // 1. Topbar Credits Badge
  if (annualEls.topbarCreditsCount) {
    if (annualState.isAdmin) {
      annualEls.topbarCreditsCount.textContent = "Sınırsız (Admin)";
    } else if (annualState.license?.isLicensed) {
      annualEls.topbarCreditsCount.textContent = "Sınırsız Lisans";
    } else {
      annualEls.topbarCreditsCount.textContent = `${annualState.credits || 0} Kredi`;
    }
  }

  // 2. Step 4 Plan Status Badge & Notice
  if (annualEls.licenseBadge) {
    annualEls.licenseBadge.style.background = "";
    annualEls.licenseBadge.style.color = "";
    if (annualState.isAdmin) {
      annualEls.licenseBadge.dataset.badgeType = "admin";
      if (annualEls.licenseBadgeIcon) annualEls.licenseBadgeIcon.textContent = "👑";
      if (annualEls.licenseBadgeText) annualEls.licenseBadgeText.textContent = "Yönetici (Sınırsız)";
      if (annualEls.step4CreditNoticeText) {
        annualEls.step4CreditNoticeText.innerHTML = "Yönetici modundasınız. Tüm planları sınırsız indirebilir ve yazdırabilirsiniz.";
      }
    } else if (annualState.license?.isLicensed) {
      annualEls.licenseBadge.dataset.badgeType = "licensed";
      if (annualEls.licenseBadgeIcon) annualEls.licenseBadgeIcon.textContent = "🔑";
      if (annualEls.licenseBadgeText) annualEls.licenseBadgeText.textContent = `Lisanslı (${annualState.license.owner || "Okul"})`;
      if (annualEls.step4CreditNoticeText) {
        annualEls.step4CreditNoticeText.innerHTML = "Kurumsal lisans aktif. Tüm planları sınırsız indirebilir ve yazdırabilirsiniz.";
      }
    } else if (planUnlocked) {
      annualEls.licenseBadge.dataset.badgeType = "unlocked";
      if (annualEls.licenseBadgeIcon) annualEls.licenseBadgeIcon.textContent = "✅";
      if (annualEls.licenseBadgeText) annualEls.licenseBadgeText.textContent = "Satın Alındı (Ücretsiz)";
      if (annualEls.step4CreditNoticeText) {
        annualEls.step4CreditNoticeText.innerHTML = "Bu plan hesabınızda açıktır. Tekrar indirmek ve yazdırmak <strong>ücretsizdir</strong>.";
      }
    } else {
      annualEls.licenseBadge.dataset.badgeType = "credit";
      if (annualEls.licenseBadgeIcon) annualEls.licenseBadgeIcon.textContent = "🪙";
      if (annualEls.licenseBadgeText) annualEls.licenseBadgeText.textContent = `1 Kredi Gerekir (Kalan: ${annualState.credits || 0})`;
      if (annualEls.step4CreditNoticeText) {
        annualEls.step4CreditNoticeText.innerHTML = `Bu planı indirmek veya yazdırmak <strong>1 Kredi</strong> düşer. Mevcut krediniz: <strong>${annualState.credits || 0}</strong>.`;
      }
    }
  }

  // 3. Modal Information
  if (annualEls.modalCreditCount) {
    if (annualState.isAdmin || annualState.license?.isLicensed) {
      annualEls.modalCreditCount.textContent = "Sınırsız";
    } else {
      annualEls.modalCreditCount.textContent = `${annualState.credits || 0} Plan`;
    }
  }
  if (annualEls.modalUnlockedCount) {
    const unlockedCount = (annualState.unlockedPlans || []).length;
    annualEls.modalUnlockedCount.textContent = `${unlockedCount} Plan Açıldı`;
  }

  // 4. Contact & IBAN in Modal
  if (annualState.contactInfo) {
    if (annualEls.ibanHolder && annualState.contactInfo.accountHolder) {
      annualEls.ibanHolder.textContent = annualState.contactInfo.accountHolder;
    }
    if (annualEls.ibanNumber && annualState.contactInfo.iban) {
      annualEls.ibanNumber.textContent = annualState.contactInfo.iban;
    }
    if (annualEls.licenseWhatsappLink && annualState.contactInfo.whatsapp) {
      const cleanPhone = annualState.contactInfo.whatsapp.replace(/[^0-9]/g, "");
      annualEls.licenseWhatsappLink.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Merhaba, Yıllık Plan Modülü için kredi satın almak istiyorum.")}`;
    }
    if (annualEls.licenseEmailLink && annualState.contactInfo.email) {
      annualEls.licenseEmailLink.href = `mailto:${annualState.contactInfo.email}?subject=${encodeURIComponent("Yıllık Plan Kredi Talebi")}`;
    }
  }

  // Admin UI toggling
  if (annualEls.adminNavSection) {
    annualEls.adminNavSection.style.display = annualState.isAdmin ? "block" : "none";
  }
  if (annualEls.adminMobileOptGroup) {
    annualEls.adminMobileOptGroup.style.display = annualState.isAdmin ? "" : "none";
  }
  if (annualEls.publishPlatformBtn) {
    annualEls.publishPlatformBtn.style.display = annualState.isAdmin ? "inline-flex" : "none";
  }
  if (annualEls.adminToggleBtnText) {
    annualEls.adminToggleBtnText.textContent = annualState.isAdmin ? "🔓 Yönetici (Çıkış Yap)" : "🔐 Yönetici Girişi";
  }
}

const updateLicenseUI = updateCreditUI;

function renderPricingPackages() {
  if (!annualEls.pricingPackagesGrid) return;
  const packages = annualState.pricingPackages && annualState.pricingPackages.length ? annualState.pricingPackages : [
    { id: "p1", name: "1 Plan Kredisi", credits: 1, price: "100 TL", description: "1 adet plan indirme hakkı" },
    { id: "p5", name: "5 Plan (Zümre)", credits: 5, price: "400 TL", description: "5 adet plan indirme hakkı" },
    { id: "p10", name: "10 Plan (Bölüm)", credits: 10, price: "700 TL", description: "10 adet plan indirme hakkı" },
    { id: "p25", name: "25 Plan (Okul)", credits: 25, price: "1500 TL", description: "25 adet plan indirme hakkı" }
  ];

  const cleanPhone = (annualState.contactInfo?.whatsapp || "905551234567").replace(/[^0-9]/g, "");

  annualEls.pricingPackagesGrid.innerHTML = packages.map(pkg => {
    const waText = encodeURIComponent(`Merhaba, Yıllık Plan için "${pkg.name}" (${pkg.price}) satın almak istiyorum.`);
    return `
      <div class="annual-pricing-card">
        <div>
          <div class="annual-pricing-name">${annualHtml(pkg.name)}</div>
          <div class="annual-pricing-desc">${annualHtml(pkg.description || "")}</div>
        </div>
        <div class="annual-pricing-footer">
          <strong class="annual-pricing-price">${annualHtml(pkg.price)}</strong>
          <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" rel="noopener" class="annual-pricing-buy-btn">
            Satın Al 💬
          </a>
        </div>
      </div>
    `;
  }).join("");
}

async function syncUserCredits() {
  try {
    const res = await fetch("/api/annual-get-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: getUserId(),
        email: getUserEmail(),
        adminPassword: annualState.adminPassword || ""
      })
    });
    if (res.ok) {
      const data = await res.json();
      annualState.credits = Number(data.credits !== undefined ? data.credits : 0);
      annualState.isUnlimited = Boolean(data.isUnlimited);
      if (Array.isArray(data.unlockedPlans)) {
        annualState.unlockedPlans = data.unlockedPlans;
      }
      if (Array.isArray(data.pricingPackages)) {
        annualState.pricingPackages = data.pricingPackages;
      }
      if (data.contactInfo) {
        annualState.contactInfo = data.contactInfo;
      }
      saveAnnualState();
      updateCreditUI();
    }
  } catch (e) {
    console.warn("Credit sync failed:", e);
  }
}

async function loadPlatformTemplates() {
  try {
    const res = await fetch("/api/annual-platform-templates");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.templates) && data.templates.length) {
        const customTemplates = (annualState.templates || []).filter(t => !t.isPlatform);
        annualState.templates = [...data.templates, ...customTemplates];
        if (!annualState.selectedTemplateId && data.templates[0]) {
          annualState.selectedTemplateId = data.templates[0].id;
          annualState.selectedType = data.templates[0].type;
          annualState.selectedAreaId = data.templates[0].areaId;
        }
        saveAnnualState();
        renderAnnualTemplatePicker();
        renderAnnualLibrary();
      }
    }
  } catch (e) {
    console.warn("Could not load platform templates:", e);
  }
}

async function verifyCurrentLicense() {
  if (!annualState.license?.licenseKey && !annualState.adminPassword) return;
  try {
    const res = await fetch("/api/annual-verify-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: annualState.license?.licenseKey || "",
        adminPassword: annualState.adminPassword || ""
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        annualState.license = {
          isLicensed: true,
          licenseKey: annualState.license?.licenseKey || "",
          owner: data.owner || "",
          expiresAt: data.expiresAt || "",
          plan: data.plan || "full"
        };
        if (data.isAdmin) {
          annualState.isAdmin = true;
        }
      } else {
        if (!annualState.isAdmin) {
          annualState.license.isLicensed = false;
        }
      }
      saveAnnualState();
      updateCreditUI();
    }
  } catch (e) {
    console.warn("License check failed:", e);
  }
}

async function initAdminLicensesView() {
  if (!annualState.isAdmin) return;
  await loadAdminLicenses();
}

async function loadAdminLicenses() {
  if (!annualState.adminPassword) return;
  try {
    const credRes = await fetch("/api/annual-admin-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "list"
      })
    });
    if (credRes.ok) {
      const credData = await credRes.json();
      const codes = credData.creditCodes || [];
      const users = credData.users || {};
      renderAdminCreditCodesTable(codes);
      renderAdminUsersTable(users);
      if (annualEls.adminCreditCodesCount) {
        annualEls.adminCreditCodesCount.textContent = `${codes.length} Adet`;
      }
      if (annualEls.adminActiveCodesCount) {
        const activeCount = codes.filter(c => c.isActive !== false).length;
        annualEls.adminActiveCodesCount.textContent = `${activeCount} Aktif`;
      }
      if (annualEls.adminUsersCount) {
        annualEls.adminUsersCount.textContent = `${Object.keys(users).length} Kullanıcı`;
      }
      if (annualEls.adminUnlockedPlansTotal) {
        let totalPlans = 0;
        Object.values(users).forEach(u => {
          totalPlans += (u.unlockedPlans || []).length;
        });
        annualEls.adminUnlockedPlansTotal.textContent = `${totalPlans} Plan`;
      }
      if (credData.contactInfo) {
        if (annualEls.adminContactWhatsapp) annualEls.adminContactWhatsapp.textContent = credData.contactInfo.whatsapp || "-";
        if (annualEls.adminContactEmail) annualEls.adminContactEmail.textContent = credData.contactInfo.email || "-";
      }
    }

    const licRes = await fetch("/api/annual-admin-licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "list"
      })
    });
    if (licRes.ok) {
      const licData = await licRes.json();
      renderAdminLicensesTable(licData.licenses || []);
      if (annualEls.adminPlatformTemplateCount) {
        const pCount = annualState.templates?.filter(t => t.isPlatform)?.length || 0;
        annualEls.adminPlatformTemplateCount.textContent = `${pCount} Ders`;
      }
      if (annualEls.adminActiveLicenseCount) {
        const activeCount = (licData.licenses || []).filter(l => l.isActive !== false).length;
        annualEls.adminActiveLicenseCount.textContent = `${activeCount} / ${(licData.licenses || []).length} Lisans`;
      }
    }
  } catch (err) {
    annualToast(`Yönetici listesi hatası: ${err.message}`, "error");
  }
}

function renderAdminCreditCodesTable(codes = []) {
  if (!annualEls.adminCreditCodesTableBody) return;
  if (!codes.length) {
    annualEls.adminCreditCodesTableBody.innerHTML = `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b;">Henüz kayıtlı kredi kodu bulunmuyor.</td></tr>`;
    return;
  }
  annualEls.adminCreditCodesTableBody.innerHTML = codes.map(c => {
    const isExhausted = c.maxUses && (c.usedCount || 0) >= c.maxUses;
    const statusBadge = !c.isActive 
      ? `<span class="annual-admin-badge badge-danger">Pasif</span>`
      : isExhausted
      ? `<span class="annual-admin-badge badge-warning">Tükendi</span>`
      : `<span class="annual-admin-badge badge-success">Aktif</span>`;

    return `
      <tr class="annual-admin-table-row">
        <td class="annual-admin-code-cell">
          <span class="annual-copyable-code" data-code="${annualHtml(c.code)}" title="Kopyalamak için tıklayın">${annualHtml(c.code)}</span>
        </td>
        <td class="annual-admin-credits-cell">${c.credits || 1} Kredi</td>
        <td>${c.usedCount || 0} / ${c.maxUses || "Sınırsız"}</td>
        <td class="annual-admin-desc-cell">${annualHtml(c.note || "-")}</td>
        <td>${statusBadge}</td>
        <td class="annual-admin-actions-cell">
          <button type="button" class="annual-toggle-code-btn" data-code="${annualHtml(c.code)}">
            ${c.isActive ? "Durdur" : "Aktifleştir"}
          </button>
          <button type="button" class="annual-delete-code-btn" data-code="${annualHtml(c.code)}">
            Sil
          </button>
        </td>
      </tr>
    `;
  }).join("");

  annualEls.adminCreditCodesTableBody.querySelectorAll(".annual-copyable-code").forEach(el => {
    el.addEventListener("click", () => {
      navigator.clipboard?.writeText(el.dataset.code);
      annualToast(`Kredi kodu kopyalandı: ${el.dataset.code}`);
    });
  });
  annualEls.adminCreditCodesTableBody.querySelectorAll(".annual-toggle-code-btn").forEach(el => {
    el.addEventListener("click", () => toggleAdminCreditCode(el.dataset.code));
  });
  annualEls.adminCreditCodesTableBody.querySelectorAll(".annual-delete-code-btn").forEach(el => {
    el.addEventListener("click", () => deleteAdminCreditCode(el.dataset.code));
  });
}

function renderAdminUsersTable(users = {}) {
  if (!annualEls.adminUsersTableBody) return;
  const userEntries = Object.entries(users);
  if (!userEntries.length) {
    annualEls.adminUsersTableBody.innerHTML = `<tr><td colspan="5" class="annual-table-empty">Henüz kayıtlı kullanıcı hesabı bulunmuyor.</td></tr>`;
    return;
  }
  annualEls.adminUsersTableBody.innerHTML = userEntries.map(([userKey, u]) => {
    const plansCount = (u.unlockedPlans || []).length;
    const historyCount = (u.history || []).length;
    return `
      <tr class="annual-admin-table-row">
        <td class="annual-admin-user-cell">${annualHtml(userKey)}</td>
        <td class="annual-admin-credits-cell">${u.credits || 0} Kredi</td>
        <td>${plansCount} Plan</td>
        <td class="annual-admin-muted-cell">${historyCount} İşlem</td>
        <td class="annual-admin-actions-cell">
          <button type="button" class="annual-set-user-credit-btn" data-user="${annualHtml(userKey)}" data-credits="${u.credits || 0}">
            ✏️ Kredi Düzenle
          </button>
        </td>
      </tr>
    `;
  }).join("");

  annualEls.adminUsersTableBody.querySelectorAll(".annual-set-user-credit-btn").forEach(el => {
    el.addEventListener("click", () => {
      openAdminSetCreditModal(el.dataset.user, el.dataset.credits);
    });
  });
}

function renderAdminLicensesTable(licenses = []) {
  if (!annualEls.adminLicensesTableBody) return;
  if (!licenses.length) {
    annualEls.adminLicensesTableBody.innerHTML = `<tr><td colspan="6" class="annual-table-empty">Henüz kayıtlı lisans anahtarı bulunmuyor.</td></tr>`;
    return;
  }
  annualEls.adminLicensesTableBody.innerHTML = licenses.map(lic => {
    const isExpired = lic.expiresAt && new Date(lic.expiresAt) < new Date();
    const statusBadge = !lic.isActive 
      ? `<span class="annual-admin-badge badge-danger">Pasif</span>`
      : isExpired
      ? `<span class="annual-admin-badge badge-warning">Süresi Dolmuş</span>`
      : `<span class="annual-admin-badge badge-success">Aktif</span>`;
    
    const expiresStr = lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString("tr-TR") : "Süresiz";

    return `
      <tr class="annual-admin-table-row">
        <td class="annual-admin-key-cell">
          <span class="annual-copyable-key" data-key="${annualHtml(lic.key)}" title="Kopyalamak için tıklayın">${annualHtml(lic.key)}</span>
        </td>
        <td class="annual-admin-owner-cell">${annualHtml(lic.owner || "-")}</td>
        <td class="annual-admin-plan-cell">${annualHtml(lic.plan || "full")}</td>
        <td>${expiresStr}</td>
        <td>${statusBadge}</td>
        <td class="annual-admin-actions-cell">
          <button type="button" class="annual-toggle-lic-btn" data-key="${annualHtml(lic.key)}">
            ${lic.isActive ? "Durdur" : "Aktifleştir"}
          </button>
          <button type="button" class="annual-delete-lic-btn" data-key="${annualHtml(lic.key)}">
            Sil
          </button>
        </td>
      </tr>
    `;
  }).join("");

  annualEls.adminLicensesTableBody.querySelectorAll(".annual-copyable-key").forEach(el => {
    el.addEventListener("click", () => {
      const k = el.dataset.key;
      navigator.clipboard?.writeText(k);
      annualToast(`Lisans anahtarı kopyalandı: ${k}`);
    });
  });

  annualEls.adminLicensesTableBody.querySelectorAll(".annual-toggle-lic-btn").forEach(el => {
    el.addEventListener("click", () => toggleAdminLicense(el.dataset.key));
  });

  annualEls.adminLicensesTableBody.querySelectorAll(".annual-delete-lic-btn").forEach(el => {
    el.addEventListener("click", () => deleteAdminLicense(el.dataset.key));
  });
}

async function createAdminCreditCode(newCode) {
  if (!annualState.adminPassword) return;
  try {
    const res = await fetch("/api/annual-admin-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "create_code",
        newCode
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Kod üretilemedi.");
    annualToast(`Yeni kredi kodu oluşturuldu: ${data.created?.code}`);
    await loadAdminLicenses();
  } catch (err) {
    annualToast(`Hata: ${err.message}`, "error");
  }
}

async function toggleAdminCreditCode(targetCode) {
  if (!annualState.adminPassword || !targetCode) return;
  try {
    const res = await fetch("/api/annual-admin-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "toggle_code",
        targetCode
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "İşlem başarısız.");
    annualToast("Kredi kodu durumu güncellendi.");
    renderAdminCreditCodesTable(data.creditCodes || []);
  } catch (err) {
    annualToast(`Hata: ${err.message}`, "error");
  }
}

async function deleteAdminCreditCode(targetCode) {
  if (!annualState.adminPassword || !targetCode) return;
  if (!confirm(`"${targetCode}" kredi kodunu silmek istediğinize emin misiniz?`)) return;
  try {
    const res = await fetch("/api/annual-admin-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "delete_code",
        targetCode
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Silinemedi.");
    annualToast("Kredi kodu silindi.");
    renderAdminCreditCodesTable(data.creditCodes || []);
  } catch (err) {
    annualToast(`Hata: ${err.message}`, "error");
  }
}

function openAdminSetCreditModal(userKey, currentCredits = 0) {
  if (annualEls.adminTargetUser) annualEls.adminTargetUser.value = userKey;
  if (annualEls.adminNewCredits) annualEls.adminNewCredits.value = currentCredits;
  if (annualEls.adminSetCreditModal) annualEls.adminSetCreditModal.showModal();
}

async function handleAdminSetCreditSubmit(e) {
  e.preventDefault();
  const targetUser = annualEls.adminTargetUser?.value;
  const credits = Number(annualEls.adminNewCredits?.value || 0);
  if (!targetUser || !annualState.adminPassword) return;
  try {
    const res = await fetch("/api/annual-admin-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "set_user_credits",
        targetUser,
        credits
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Kredi güncellenemedi.");
    annualToast(`${targetUser} kullanıcısının kredisi ${credits} olarak güncellendi.`);
    if (annualEls.adminSetCreditModal) annualEls.adminSetCreditModal.close();
    await loadAdminLicenses();
    if (targetUser === getUserId() || targetUser === getUserEmail()) {
      await syncUserCredits();
    }
  } catch (err) {
    annualToast(`Hata: ${err.message}`, "error");
  }
}

async function createAdminLicense() {
  if (!annualState.adminPassword) return;
  const owner = prompt("Lisans verilecek kurum veya öğretmen adı:", "Kadıköy MTAL / Bilişim Zümresi");
  if (!owner) return;
  try {
    const res = await fetch("/api/annual-admin-licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "create",
        newLicense: { owner }
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Lisans üretilemedi.");
    annualToast(`Yeni lisans üretildi: ${data.created?.key}`);
    await loadAdminLicenses();
  } catch (err) {
    annualToast(`Lisans üretim hatası: ${err.message}`, "error");
  }
}

async function toggleAdminLicense(targetKey) {
  if (!annualState.adminPassword || !targetKey) return;
  try {
    const res = await fetch("/api/annual-admin-licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "toggle",
        targetKey
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "İşlem başarısız.");
    annualToast("Lisans durumu güncellendi.");
    renderAdminLicensesTable(data.licenses || []);
  } catch (err) {
    annualToast(`Hata: ${err.message}`, "error");
  }
}

async function deleteAdminLicense(targetKey) {
  if (!annualState.adminPassword || !targetKey) return;
  if (!confirm(`"${targetKey}" lisans anahtarını silmek istediğinize emin misiniz?`)) return;
  try {
    const res = await fetch("/api/annual-admin-licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        action: "delete",
        targetKey
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Silinemedi.");
    annualToast("Lisans anahtarı silindi.");
    renderAdminLicensesTable(data.licenses || []);
  } catch (err) {
    annualToast(`Hata: ${err.message}`, "error");
  }
}

async function printAnnualPlan() {
  const plan = annualState.generatedPlans.find((item) => item.id === annualState.previewPlanId);
  if (!plan) return annualToast("Yazdırılacak plan yok.", "warning");

  if (!isPlanUnlocked(plan)) {
    if ((annualState.credits || 0) < 1) {
      annualToast("Bu planı yazdırmak için 1 krediye ihtiyacınız var. Mevcut krediniz: 0", "warning");
      openCreditModal();
      return;
    }
    const ok = window.confirm(`Bu planı yazdırmak / PDF olarak almak için 1 Kredi kullanılacaktır.\n\nMevcut Krediniz: ${annualState.credits}\n\nOnaylıyor musunuz? (Açılan planı daha sonra tekrar ücretsiz yazdırabilirsiniz)`);
    if (!ok) return;

    try {
      const res = await fetch("/api/annual-unlock-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          email: getUserEmail(),
          adminPassword: annualState.adminPassword || "",
          licenseKey: annualState.license?.licenseKey || "",
          planId: getPlanFingerprint(plan),
          planName: plan.lessonName
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Plan kilidi açılamadı.");
      annualState.credits = data.credits;
      if (Array.isArray(data.unlockedPlans)) annualState.unlockedPlans = data.unlockedPlans;
      saveAnnualState();
      updateCreditUI();
      annualToast(data.message || "Plan kilidi açıldı!");
    } catch (e) {
      annualToast(`İşlem başarısız: ${e.message}`, "error");
      return;
    }
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) return annualToast("Tarayıcı açılır pencereyi engelledi.", "warning");
  const annualReportDate = (function() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}_${String(d.getMonth() + 1).padStart(2, "0")}_${d.getFullYear()}`;
  })();
  printWindow.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>${annualSlug(plan.lessonName)}_Yillik_Plan_${annualReportDate}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          th, td { border: 1px solid #111827; padding: 6px; vertical-align: top; }
          th { background: #ffffff; }
          header { text-align: center; margin-bottom: 16px; }
          header h2 { margin: 4px 0; }
          header div { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; font-size: 10pt; }
        </style>
      </head>
      <body>${planToHtml(plan, { compact: true })}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

async function exportAnnualPlanExcel() {
  const plan = annualState.generatedPlans.find((item) => item.id === annualState.previewPlanId);
  if (!plan) return annualToast("Excel'e aktarılacak plan yok.", "warning");

  const unlocked = isPlanUnlocked(plan);
  if (!unlocked) {
    if ((annualState.credits || 0) < 1) {
      annualToast("Bu planı Excel olarak indirmek için 1 krediye ihtiyacınız var. Mevcut krediniz: 0", "warning");
      openCreditModal();
      return;
    }
    const ok = window.confirm(`Bu planı Excel olarak indirmek için 1 Kredi kullanılacaktır.\n\nMevcut Krediniz: ${annualState.credits}\n\nOnaylıyor musunuz? (Açılan planı daha sonra tekrar ücretsiz indirebilirsiniz)`);
    if (!ok) return;
  }

  if (annualEls.excel) annualEls.excel.disabled = true;
  try {
    const response = await fetch("/api/annual-plan-xlsx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        userId: getUserId(),
        email: getUserEmail(),
        licenseKey: annualState.license?.licenseKey || "",
        adminPassword: annualState.adminPassword || ""
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 403 || error.requiresCredit || error.requiresLicense) {
        openCreditModal();
      }
      throw new Error(error.error || "Excel dosyası üretilemedi.");
    }

    const remainingHeader = response.headers.get("X-Remaining-Credits");
    if (remainingHeader !== null && !isNaN(Number(remainingHeader))) {
      annualState.credits = Number(remainingHeader);
    } else if (!unlocked && annualState.credits > 0) {
      annualState.credits -= 1;
    }
    const fp = getPlanFingerprint(plan);
    annualState.unlockedPlans = annualState.unlockedPlans || [];
    if (!annualState.unlockedPlans.includes(fp)) {
      annualState.unlockedPlans.push(fp);
    }
    saveAnnualState();
    updateCreditUI();

    const blob = await response.blob();
    const annualReportDate = (function() {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, "0")}_${String(d.getMonth() + 1).padStart(2, "0")}_${d.getFullYear()}`;
    })();
    const disposition = response.headers.get("Content-Disposition") || "";
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `${annualSlug(plan.lessonName)}_Yillik_Plan_${annualReportDate}.xlsx`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    annualToast("Yıllık plan Excel dosyası hazırlandı.");
  } catch (error) {
    annualToast(`Excel aktarımı tamamlanamadı: ${error.message}`, "error");
  } finally {
    if (annualEls.excel) annualEls.excel.disabled = false;
  }
}

function setAnnualMebCalendarStatus(message, type = "info") {
  if (!annualEls.mebCalendarStatus) return;
  annualEls.mebCalendarStatus.hidden = !message;
  annualEls.mebCalendarStatus.textContent = message || "";
  annualEls.mebCalendarStatus.dataset.type = type;
}

function applyMebCalendarToSettings(payload) {
  mergeAnnualMebCalendars(payload?.calendars || []);
  const dates = payload?.dates || {};
  const nextSettings = {
    ...(annualState.settings || {}),
    year: payload.year || annualEls.defaultYear?.value || currentAnnualYear(),
    startDate: dates.startDate || annualState.settings?.startDate || "",
    endDate: dates.endDate || annualState.settings?.endDate || "",
    araTatil1Start: dates.araTatil1Start || "",
    araTatil1End: dates.araTatil1End || "",
    yariyilStart: dates.yariyilStart || "",
    yariyilEnd: dates.yariyilEnd || "",
    araTatil2Start: dates.araTatil2Start || "",
    araTatil2End: dates.araTatil2End || "",
    etkinlikStart: dates.etkinlikStart || "",
    etkinlikEnd: dates.etkinlikEnd || ""
  };
  const examDefaults = calculateDefaultExamDates(nextSettings);
  annualState.settings = {
    ...nextSettings,
    exam1_1: examDefaults.exam1_1 || "",
    exam1_2: examDefaults.exam1_2 || "",
    exam2_1: examDefaults.exam2_1 || "",
    exam2_2: examDefaults.exam2_2 || ""
  };
  saveAnnualState();
  syncWizardInputsFromSettings();
  renderAnnualModule();
}

async function fetchAnnualMebCalendar() {
  const year = annualEls.defaultYear?.value.trim() || (annualState.settings || {}).year || currentAnnualYear();
  if (!/^\d{4}-\d{4}$/.test(year)) {
    annualToast("MEB takvimi için eğitim yılını 2025-2026 biçiminde yazın.", "warning");
    return;
  }

  if (annualEls.fetchMebCalendar) {
    annualEls.fetchMebCalendar.disabled = true;
    annualEls.fetchMebCalendar.textContent = "Alınıyor...";
  }
  setAnnualMebCalendarStatus("MEB çalışma takvimi alınıyor...", "info");

  try {
    const response = await fetch("/api/annual-meb-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "MEB takvimi alınamadı.");

    applyMebCalendarToSettings(data);
    setAnnualMebCalendarStatus(`Takvim aktarıldı: ${data.sourceTitle || "MEB çalışma takvimi"}`, "success");
    annualToast("MEB takvimi ayarlara aktarıldı.");
  } catch (error) {
    setAnnualMebCalendarStatus(error.message, "error");
    annualToast(`MEB takvimi alınamadı: ${error.message}`, "error");
  } finally {
    if (annualEls.fetchMebCalendar) {
      annualEls.fetchMebCalendar.disabled = false;
      annualEls.fetchMebCalendar.textContent = "MEB Takvimini Al";
    }
  }
}

function saveAnnualSettings(silent = false) {
  const zumreName = selectedAnnualZumreTeachers().join(", ");
  if (annualEls.defaultZumre) annualEls.defaultZumre.value = zumreName;
  annualState.settings = {
    schoolName: annualEls.defaultSchool.value.trim(),
    teacherName: annualEls.defaultTeacher?.value.trim() || "",
    mudurName: annualEls.defaultMudur?.value.trim() || "",
    year: annualEls.defaultYear.value.trim() || currentAnnualYear(),
    startDate: annualEls.defaultStart.value || "",
    endDate: annualEls.defaultEnd.value || "",
    zumreName,
    araTatil1Start: annualEls.defaultAraTatil1Start.value || "",
    araTatil1End: annualEls.defaultAraTatil1End.value || "",
    yariyilStart: annualEls.defaultYariyilStart.value || "",
    yariyilEnd: annualEls.defaultYariyilEnd.value || "",
    araTatil2Start: annualEls.defaultAraTatil2Start.value || "",
    araTatil2End: annualEls.defaultAraTatil2End.value || "",
    etkinlikStart: annualEls.defaultEtkinlikStart.value || "",
    etkinlikEnd: annualEls.defaultEtkinlikEnd.value || "",
    addBelirliGunler: annualEls.defaultBelirliGunler ? annualEls.defaultBelirliGunler.checked : true,
    addAtaturkculuk: annualEls.defaultAtaturkculuk ? annualEls.defaultAtaturkculuk.checked : true,
    addPageNumbers: annualEls.defaultPageNumbers ? annualEls.defaultPageNumbers.checked : true,
    exam1_1: annualEls.defaultExam1_1?.value || "",
    exam1_2: annualEls.defaultExam1_2?.value || "",
    exam2_1: annualEls.defaultExam2_1?.value || "",
    exam2_2: annualEls.defaultExam2_2?.value || ""
  };
  saveAnnualState();
  syncWizardInputsFromSettings();
  renderAnnualModule();
  if (!silent) {
    annualToast("Plan ayarları kaydedildi.");
  }
}

function selectAnnualType(type) {
  annualState.selectedType = type;
  const firstArea = areasForType(type)[0];
  annualState.selectedAreaId = firstArea?.id || "";
  annualState.selectedTemplateId = templatesForSelection()[0]?.id || "";
  saveAnnualState();
  renderAnnualModule();
}

function selectAnnualArea(areaId) {
  annualState.selectedAreaId = areaId;
  annualState.selectedTemplateId = templatesForSelection()[0]?.id || "";
  saveAnnualState();
  renderAnnualModule();
}

function selectAnnualTemplate(templateId) {
  const template = annualState.templates.find((item) => item.id === templateId);
  if (!template) return;
  annualState.selectedType = template.type;
  annualState.selectedAreaId = template.areaId;
  annualState.selectedTemplateId = template.id;
  annualState.showSteps1And2 = false;
  if (annualEls.weeklyHours) annualEls.weeklyHours.value = template.weeklyHours || 2;
  if (annualEls.year) annualEls.year.value = template.year || annualEls.year.value || currentAnnualYear();
  saveAnnualState();
  renderAnnualModule();
}

function bindAnnualEvents() {
  annualEls.navButtons.forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.annualView === "plan-template") {
      resetCustomTemplateForm();
      setAnnualView("plan-template");
    } else {
      setAnnualView(button.dataset.annualView);
    }
  }));
  if (annualEls.annualNavMobileSelect) {
    annualEls.annualNavMobileSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "plan-template") {
        resetCustomTemplateForm();
      }
      setAnnualView(val);
    });
  }
  annualEls.templateArea?.addEventListener("change", () => {
    const areaId = annualEls.templateArea.value || "";
    const grade = annualTemplatesForPicker(areaId, "")[0]?.grade || "";
    const template = annualTemplatesForPicker(areaId, grade)[0] || annualTemplatesForPicker(areaId, "")[0];
    if (template) {
      annualState.selectedType = template.type;
      annualState.selectedAreaId = template.areaId;
      annualState.selectedTemplateId = template.id;
      if (annualEls.weeklyHours) annualEls.weeklyHours.value = template.weeklyHours || 2;
    }
    saveAnnualState();
    renderAnnualModule();
  });
  annualEls.templateGrade?.addEventListener("change", () => {
    const areaId = annualEls.templateArea?.value || annualState.selectedAreaId || "";
    const grade = annualEls.templateGrade.value || "";
    const template = annualTemplatesForPicker(areaId, grade)[0] || annualTemplatesForPicker(areaId, "")[0];
    if (template) {
      annualState.selectedType = template.type;
      annualState.selectedAreaId = template.areaId;
      annualState.selectedTemplateId = template.id;
      if (annualEls.weeklyHours) annualEls.weeklyHours.value = template.weeklyHours || 2;
    }
    saveAnnualState();
    renderAnnualModule();
  });
  annualEls.templateSelect?.addEventListener("change", () => {
    selectAnnualTemplate(annualEls.templateSelect.value);
  });
  annualEls.methodList?.addEventListener("change", () => {
    annualState.settings = { ...(annualState.settings || {}), methods: selectedAnnualMethods() };
    saveAnnualState();
  });
  annualEls.materialList?.addEventListener("change", () => {
    annualState.settings = { ...(annualState.settings || {}), materials: selectedAnnualMaterials() };
    saveAnnualState();
  });
  annualEls.typeGrid?.addEventListener("click", (event) => {
    const type = event.target.closest("[data-annual-type]")?.dataset.annualType;
    if (type) selectAnnualType(type);
  });
  annualEls.areaList?.addEventListener("click", (event) => {
    const areaId = event.target.closest("[data-annual-area]")?.dataset.annualArea;
    if (areaId) selectAnnualArea(areaId);
  });
  annualEls.lessonList?.addEventListener("click", (event) => {
    const templateId = event.target.closest("[data-annual-template]")?.dataset.annualTemplate;
    if (templateId) selectAnnualTemplate(templateId);
  });
  annualEls.areaSearch?.addEventListener("input", renderAnnualAreas);
  annualEls.generate?.addEventListener("click", generateAnnualPlan);
  annualEls.print?.addEventListener("click", printAnnualPlan);
  annualEls.excel?.addEventListener("click", exportAnnualPlanExcel);
  annualEls.fetchMebCalendar?.addEventListener("click", fetchAnnualMebCalendar);
  annualEls.zumreTeacherList?.addEventListener("input", syncAnnualZumreHidden);
  annualEls.zumreTeacherList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-zumre-teacher]");
    if (!button) return;
    removeAnnualZumreTeacherAt(Number(button.dataset.removeZumreTeacher));
  });
  annualEls.addZumreTeacher?.addEventListener("click", addAnnualZumreTeacher);
  annualEls.removeZumreTeacher?.addEventListener("click", removeAnnualZumreTeacher);
  // Legacy import and MEB Wizard events removed
  annualEls.clearGenerated?.addEventListener("click", () => {
    annualState.previewPlanId = "";
    saveAnnualState();
    renderAnnualModule();
  });
  annualEls.libraryGrid?.addEventListener("click", (event) => {
    const templateId = event.target.closest("[data-use-template]")?.dataset.useTemplate;
    const deleteTemplateId = event.target.closest("[data-delete-template]")?.dataset.deleteTemplate;
    const editTemplateId = event.target.closest("[data-edit-template]")?.dataset.editTemplate;
    if (templateId) {
      selectAnnualTemplate(templateId);
      setAnnualView("wizard");
    }
    if (editTemplateId) {
      editCustomTemplate(editTemplateId);
    }
    if (deleteTemplateId) {
      annualState.templates = annualState.templates.filter((item) => item.id !== deleteTemplateId);
      annualState.generatedPlans = annualState.generatedPlans.filter((item) => item.templateId !== deleteTemplateId);
      if (annualState.selectedTemplateId === deleteTemplateId) {
        const next = annualState.templates[0] || annualSeedTemplates[0];
        annualState.selectedTemplateId = next?.id || "";
        annualState.selectedType = next?.type || "mtal";
        annualState.selectedAreaId = next?.areaId || "";
      }
      saveAnnualState();
      renderAnnualModule();
    }
  });
  annualEls.generatedList?.addEventListener("click", (event) => {
    const openId = event.target.closest("[data-open-generated]")?.dataset.openGenerated;
    const deleteId = event.target.closest("[data-delete-generated]")?.dataset.deleteGenerated;
    if (openId) {
      annualState.previewPlanId = openId;
      saveAnnualState();
      setAnnualView("wizard");
    }
    if (deleteId) {
      annualState.generatedPlans = annualState.generatedPlans.filter((item) => item.id !== deleteId);
      if (annualState.previewPlanId === deleteId) annualState.previewPlanId = "";
      saveAnnualState();
      renderAnnualModule();
    }
  });
  annualEls.saveSettings?.addEventListener("click", () => saveAnnualSettings());
  annualEls.defaultYear?.addEventListener("change", async () => {
    saveAnnualSettings(true);
    await fetchAnnualMebCalendar();
  });
  annualEls.defaultStart?.addEventListener("change", autoCalculateExamsOnSettingsChange);
  annualEls.defaultEnd?.addEventListener("change", autoCalculateExamsOnSettingsChange);
  annualEls.defaultAraTatil1Start?.addEventListener("change", autoCalculateExamsOnSettingsChange);
  annualEls.defaultYariyilStart?.addEventListener("change", autoCalculateExamsOnSettingsChange);
  annualEls.defaultYariyilEnd?.addEventListener("change", autoCalculateExamsOnSettingsChange);
  annualEls.defaultAraTatil2Start?.addEventListener("change", autoCalculateExamsOnSettingsChange);
  
  // Admin & License & Credit bindings
  annualEls.adminToggleBtn?.addEventListener("click", openAdminLoginModal);
  annualEls.licenseBadge?.addEventListener("click", () => openCreditModal());
  annualEls.licenseCloseBtn?.addEventListener("click", closeCreditModal);
  annualEls.licenseVerifyBtn?.addEventListener("click", () => redeemCreditCode());
  annualEls.licenseKeyInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") redeemCreditCode();
  });

  // Credit topbar & step4 bindings
  annualEls.topbarCreditsBadge?.addEventListener("click", () => openCreditModal());
  annualEls.topbarTopupBtn?.addEventListener("click", () => openCreditModal("buy"));
  annualEls.step4TopupBtn?.addEventListener("click", () => openCreditModal("buy"));
  annualEls.creditTabCodeBtn?.addEventListener("click", () => setCreditTab("code"));
  annualEls.creditTabBuyBtn?.addEventListener("click", () => setCreditTab("buy"));

  // Admin login bindings
  annualEls.adminLoginCloseBtn?.addEventListener("click", closeAdminLoginModal);
  annualEls.adminLoginSubmitBtn?.addEventListener("click", handleAdminLogin);
  annualEls.adminPasswordInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAdminLogin();
  });
  annualEls.publishPlatformBtn?.addEventListener("click", publishCurrentTemplateToPlatform);
  annualEls.adminNewLicenseBtn?.addEventListener("click", createAdminLicense);

  // Admin Credit Code & User Credit Modals
  annualEls.adminNewCreditBtn?.addEventListener("click", () => {
    if (annualEls.adminNewCreditModal) annualEls.adminNewCreditModal.showModal();
  });
  annualEls.adminNewCreditCloseBtn?.addEventListener("click", () => {
    if (annualEls.adminNewCreditModal) annualEls.adminNewCreditModal.close();
  });
  annualEls.adminNewCreditCancelBtn?.addEventListener("click", () => {
    if (annualEls.adminNewCreditModal) annualEls.adminNewCreditModal.close();
  });
  annualEls.adminNewCreditForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = annualEls.adminNewCreditCode?.value;
    const credits = Number(annualEls.adminNewCreditAmount?.value || 5);
    const maxUses = Number(annualEls.adminNewCreditMaxUses?.value || 1);
    const note = annualEls.adminNewCreditNote?.value || "";
    await createAdminCreditCode({ code, credits, maxUses, note });
    if (annualEls.adminNewCreditModal) annualEls.adminNewCreditModal.close();
    if (annualEls.adminNewCreditForm) annualEls.adminNewCreditForm.reset();
  });

  annualEls.adminSetCreditCloseBtn?.addEventListener("click", () => {
    if (annualEls.adminSetCreditModal) annualEls.adminSetCreditModal.close();
  });
  annualEls.adminSetCreditCancelBtn?.addEventListener("click", () => {
    if (annualEls.adminSetCreditModal) annualEls.adminSetCreditModal.close();
  });
  annualEls.adminSetCreditForm?.addEventListener("submit", handleAdminSetCreditSubmit);
  
  // Custom bindings for download and plan-template views
  document.getElementById("annualDownloadListBtn")?.addEventListener("click", fetchDownloadResources);
  
  const onDownloadFilterChanged = async () => {
    const select = document.getElementById("annualDownloadAreaCode");
    const schoolType = document.getElementById("annualDownloadSchoolType")?.value || "mtal";
    const grade = document.getElementById("annualDownloadGrade")?.value || "11";
    if (select) {
      delete select.dataset.loadedKey;
      await loadAnnualMebAreaOptions(select, "-- Alan seçin --", schoolType, grade);
    }
    const dbfList = document.getElementById("annualDownloadDbfList");
    const matList = document.getElementById("annualDownloadMatList");
    if (dbfList) dbfList.innerHTML = "";
    if (matList) matList.innerHTML = "";
    const dbfStatus = document.getElementById("annualDownloadDbfStatus");
    const matStatus = document.getElementById("annualDownloadMatStatus");
    const dbfBadge = document.getElementById("annualDownloadDbfCountBadge");
    const matBadge = document.getElementById("annualDownloadMatCountBadge");
    if (dbfStatus) {
      dbfStatus.style.display = "block";
      dbfStatus.textContent = "Filtre değişti. Alan seçip Listele butonuna basın.";
    }
    if (matStatus) {
      matStatus.style.display = "block";
      matStatus.textContent = "Filtre değişti. Alan seçip Listele butonuna basın.";
    }
    if (dbfBadge) dbfBadge.style.display = "none";
    if (matBadge) matBadge.style.display = "none";
  };

  document.getElementById("annualDownloadSchoolType")?.addEventListener("change", onDownloadFilterChanged);
  document.getElementById("annualDownloadGrade")?.addEventListener("change", onDownloadFilterChanged);

  document.getElementById("annualDownloadAreaCode")?.addEventListener("change", () => {
    const dbfList = document.getElementById("annualDownloadDbfList");
    const matList = document.getElementById("annualDownloadMatList");
    if (dbfList) dbfList.innerHTML = "";
    if (matList) matList.innerHTML = "";
    const dbfStatus = document.getElementById("annualDownloadDbfStatus");
    const matStatus = document.getElementById("annualDownloadMatStatus");
    const dbfBadge = document.getElementById("annualDownloadDbfCountBadge");
    const matBadge = document.getElementById("annualDownloadMatCountBadge");
    if (dbfStatus) {
      dbfStatus.style.display = "block";
      dbfStatus.textContent = "Alan seçildi. Listele butonuna basın.";
    }
    if (matStatus) {
      matStatus.style.display = "block";
      matStatus.textContent = "Alan seçildi. Listele butonuna basın.";
    }
    if (dbfBadge) dbfBadge.style.display = "none";
    if (matBadge) matBadge.style.display = "none";
  });

  // Global click delegate for "Plan Şablonuna Aktar" buttons in Download view
  document.addEventListener("click", (e) => {
    const transferBtn = e.target.closest(".annual-resource-transfer-btn");
    if (transferBtn) {
      e.preventDefault();
      handleQuickTransferToPlanTemplate(transferBtn);
    }
  });
}

// VERİ İNDİR (DOWNLOAD VIEW) İŞLEMLERİ

async function loadAnnualMebAreaOptions(select, placeholder = "-- Alan seçin --", schoolType = "", grade = "") {
  if (!select) return false;

  const currentSchoolType = schoolType || document.getElementById("annualDownloadSchoolType")?.value || "mtal";
  const currentGrade = grade || document.getElementById("annualDownloadGrade")?.value || "11";
  const requestedKey = `${currentSchoolType}-${currentGrade}`;

  if (select.dataset.loadedKey === requestedKey && select.options.length > 1) return true;

  const currentValue = select.value || "00";
  try {
    select.disabled = true;
    select.innerHTML = `<option value="00">Alanlar yükleniyor...</option>`;
    const response = await fetch(`/api/meb-areas?schoolType=${encodeURIComponent(currentSchoolType)}&grade=${encodeURIComponent(currentGrade)}`);
    if (!response.ok) throw new Error("Alan listesi alınamadı.");
    const data = await response.json();
    const areas = Array.isArray(data.areas) ? data.areas : [];
    select.innerHTML = `<option value="00">${annualHtml(placeholder)}</option>` +
      areas.map((area) => `<option value="${annualHtml(area.code)}">${annualHtml(area.name)}</option>`).join("");
    if ([...select.options].some((option) => option.value === currentValue)) {
      select.value = currentValue;
    }
    select.dataset.loadedKey = requestedKey;
    select.dataset.areasLoaded = select.options.length > 1 ? "true" : "false";
    return select.dataset.areasLoaded === "true";
  } catch (error) {
    select.innerHTML = `<option value="00">${annualHtml(placeholder)}</option>`;
    select.dataset.areasLoaded = "false";
    throw error;
  } finally {
    select.disabled = false;
  }
}

async function initDownloadView() {
  const select = document.getElementById("annualDownloadAreaCode");
  const schoolTypeSelect = document.getElementById("annualDownloadSchoolType");
  const gradeSelect = document.getElementById("annualDownloadGrade");
  if (!select) return;

  try {
    await loadAnnualMebAreaOptions(select, "-- Alan seçin --", schoolTypeSelect?.value, gradeSelect?.value);
  } catch (error) {
    annualToast(`Alan listesi yüklenemedi: ${error.message}`, "error");
  }
}

async function handleQuickTransferToPlanTemplate(btn) {
  if (!btn) return;
  const url = btn.dataset.url;
  const title = btn.dataset.title || "";
  const grade = btn.dataset.grade || "";
  const area = btn.dataset.area || "";
  const schoolType = document.getElementById("annualDownloadSchoolType")?.value || "mtal";

  const originalContent = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span>⏳ Aktarılıyor...</span>`;

  try {
    const res = await fetch("/api/annual-import-meb-dbf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        meta: {
          title,
          lessonName: title,
          grade,
          schoolType,
          areaName: area
        }
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "DBF içeriği alınamadı.");
    }

    if (!data.units || data.units.length === 0) {
      throw new Error("Bu belgede öğrenme birimi bulunamadı.");
    }

    // Switch to Plan Template view
    setAnnualView("plan-template");

    // Populate metadata inputs
    const lessonInput = document.getElementById("annualCustomLessonName");
    if (lessonInput && (data.lessonName || title)) {
      lessonInput.value = data.lessonName || title;
      lessonInput.style.display = "block";
    }
    const customLessonSelect = document.getElementById("annualCustomLessonSelect");
    if (customLessonSelect) {
      customLessonSelect.style.display = "none";
    }
    const customTypeSelect = document.getElementById("annualCustomType");
    if (customTypeSelect && schoolType) {
      customTypeSelect.value = schoolType;
    }
    const customGradeSelect = document.getElementById("annualCustomGrade");
    if (customGradeSelect) {
      const gClean = (data.grade || grade).replace(/[^0-9]/g, "");
      if (gClean && [...customGradeSelect.options].some(o => o.value.includes(gClean))) {
        const matchingOpt = [...customGradeSelect.options].find(o => o.value.includes(gClean));
        if (matchingOpt) customGradeSelect.value = matchingOpt.value;
      }
    }
    const weeklyHoursInput = document.getElementById("annualCustomWeeklyHours");
    if (weeklyHoursInput && data.weeklyHours) {
      weeklyHoursInput.value = data.weeklyHours;
    }

    // Load curriculum units into editor
    populateImportedCurriculum(data.units, false);
    annualToast(`"${title}" başarıyla Plan Şablonu alanına aktarıldı! (${data.units.length} ünite)`, "success");
  } catch (err) {
    annualToast(`Plan şablonuna aktarılamadı: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalContent;
  }
}

async function fetchDownloadResources() {
  const schoolType = document.getElementById("annualDownloadSchoolType")?.value || "mtal";
  const grade = document.getElementById("annualDownloadGrade")?.value || "11";
  const areaCode = document.getElementById("annualDownloadAreaCode")?.value || "00";
  
  if (areaCode === "00") {
    return annualToast("Lütfen bir alan seçin.", "warning");
  }
  
  const dbfStatus = document.getElementById("annualDownloadDbfStatus");
  const matStatus = document.getElementById("annualDownloadMatStatus");
  const dbfList = document.getElementById("annualDownloadDbfList");
  const matList = document.getElementById("annualDownloadMatList");
  const listBtn = document.getElementById("annualDownloadListBtn");
  const dbfBadge = document.getElementById("annualDownloadDbfCountBadge");
  const matBadge = document.getElementById("annualDownloadMatCountBadge");
  
  if (dbfStatus) {
    dbfStatus.style.display = "block";
    dbfStatus.textContent = "Ders bilgi formları alınıyor...";
  }
  if (matStatus) {
    matStatus.style.display = "block";
    matStatus.textContent = "Kitaplar ve materyaller alınıyor...";
  }
  if (dbfBadge) dbfBadge.style.display = "none";
  if (matBadge) matBadge.style.display = "none";
  if (dbfList) dbfList.innerHTML = "";
  if (matList) matList.innerHTML = "";
  if (listBtn) listBtn.disabled = true;
  
  try {
    // 1. Fetch DBFs
    const resDbf = await fetch("/api/annual-meb-catalog-by-area", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "dbf", schoolType, grade, areaCode })
    });
    const dataDbf = await resDbf.json();
    if (!resDbf.ok || dataDbf.error) throw new Error(dataDbf.error || "DBF listesi alınamadı.");
    
    // 2. Fetch Books
    const resMat = await fetch("/api/annual-meb-catalog-by-area", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "material", schoolType, grade, areaCode })
    });
    const dataMat = await resMat.json();
    if (!resMat.ok || dataMat.error) throw new Error(dataMat.error || "Kitap listesi alınamadı.");
    
    renderDownloadList(dbfList, dataDbf.entries || [], "dbf");
    renderDownloadList(matList, dataMat.entries || [], "material");
    
    if (dbfStatus) {
      if ((dataDbf.entries || []).length > 0) {
        dbfStatus.style.display = "none";
      } else {
        dbfStatus.textContent = "Kaynak bulunamadı.";
      }
    }
    if (matStatus) {
      if ((dataMat.entries || []).length > 0) {
        matStatus.style.display = "none";
      } else {
        matStatus.textContent = "Kaynak bulunamadı.";
      }
    }
    
    if (dbfBadge) {
      dbfBadge.textContent = `${(dataDbf.entries || []).length}`;
      dbfBadge.style.display = "inline-block";
    }
    if (matBadge) {
      matBadge.textContent = `${(dataMat.entries || []).length}`;
      matBadge.style.display = "inline-block";
    }
    
    annualToast("Kaynaklar başarıyla listelendi.");
  } catch (error) {
    if (dbfStatus) {
      dbfStatus.style.display = "block";
      dbfStatus.textContent = "Hata oluştu.";
    }
    if (matStatus) {
      matStatus.style.display = "block";
      matStatus.textContent = "Hata oluştu.";
    }
    annualToast(`Hata: ${error.message}`, "error");
  } finally {
    if (listBtn) listBtn.disabled = false;
  }
}

function renderDownloadList(container, entries, kind) {
  if (!container) return;
  if (!entries || !entries.length) {
    container.innerHTML = `<div class="annual-download-status-info">Kaynak bulunamadı.</div>`;
    return;
  }
  
  const iconEmoji = kind === "dbf" ? "📄" : "📖";
  const iconClass = kind === "dbf" ? "dbf-kind" : "material-kind";

  container.innerHTML = entries.map((entry) => {
    const title = entry.title || "";
    const grade = entry.grade || "";
    const date = entry.date || "";
    const isTransferable = kind === "dbf" || (entry.kind && (entry.kind.includes("Ders Bilgi") || entry.kind.includes("Çerçeve"))) || /\.(docx?|pdf)$/i.test(entry.fileName || entry.url);
    
    return `
      <div class="annual-resource-card">
        <div class="annual-resource-icon-wrapper ${iconClass}">
          ${iconEmoji}
        </div>
        <div class="annual-resource-details">
          <strong class="annual-resource-title" title="${annualHtml(title)}">${annualHtml(title)}</strong>
          <span class="annual-resource-meta">
            <span>${annualHtml(grade)}</span>
            ${entry.kind ? `<span class="annual-resource-meta-separator">·</span><span>${annualHtml(entry.kind)}</span>` : ""}
            ${date ? `<span class="annual-resource-meta-separator">·</span><span>${annualHtml(date)}</span>` : ""}
          </span>
        </div>
        <div class="annual-resource-actions">
          ${isTransferable ? `
            <button type="button" class="annual-resource-transfer-btn" 
              data-url="${annualHtml(entry.url)}" 
              data-title="${annualHtml(title)}" 
              data-grade="${annualHtml(grade)}" 
              data-area="${annualHtml(entry.area || "")}"
              title="Bu dersi doğrudan Plan Şablonu alanına aktarır">
              ✨ Plan Şablonuna Aktar
            </button>
          ` : ""}
          <a href="${annualHtml(entry.url)}" target="_blank" class="annual-resource-download-btn" download>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            İndir
          </a>
        </div>
      </div>
    `;
  }).join("");
}

// ÖZEL PLAN ŞABLONU (PLAN TEMPLATE VIEW) İŞLEMLERİ

let customUnitCounter = 0;
let customTemplateBound = false;
let editingTemplateId = null;

function renderCustomTemplateQuickPicker() {
  const oldPicker = document.getElementById("annualCustomTemplateQuickPicker");
  if (oldPicker) {
    oldPicker.remove();
  }

  const select = document.getElementById("annualSavedTemplateSelect");
  if (!select) return;

  const currentVal = select.value;
  const templates = (annualState.templates || []).slice().sort((a, b) => {
    const left = [a.areaName, a.grade, a.lessonName].join(" ");
    const right = [b.areaName, b.grade, b.lessonName].join(" ");
    return left.localeCompare(right, "tr");
  });

  select.innerHTML = `
    <option value="">-- Kayıtlı şablon seç (${templates.length} adet mevcut) --</option>
    ${templates.map((template) => `
      <option value="${annualHtml(template.id)}">
        ${annualHtml(template.areaName || "-")} · ${annualHtml(template.grade || "-")} · ${annualHtml(template.lessonName || "-")}
      </option>
    `).join("")}
  `;

  if (currentVal && templates.some(t => t.id === currentVal)) {
    select.value = currentVal;
  }
}

const annualFrontendCatalogCache = new Map();

async function fetchCatalogLessons(schoolType, grade, areaCode) {
  const cacheKey = `${schoolType}-${grade}-${areaCode}`;
  if (annualFrontendCatalogCache.has(cacheKey)) {
    return annualFrontendCatalogCache.get(cacheKey);
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch("/api/annual-meb-catalog-by-area", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "dbf", schoolType, grade, areaCode }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data.entries || [];
    annualFrontendCatalogCache.set(cacheKey, entries);
    return entries;
  } catch (e) {
    console.warn("fetchCatalogLessons hatası:", e.message);
    return [];
  }
}

async function loadCustomTemplateAreas() {
  const select = document.getElementById("annualCustomAreaCode");
  if (!select) return;
  const schoolType = document.getElementById("annualCustomType")?.value || "mtal";
  const gradeVal = document.getElementById("annualCustomGrade")?.value || "11. sınıf";
  const gradeNum = gradeVal.match(/\d+/)?.[0] || "11";
  try {
    delete select.dataset.loadedKey;
    await loadAnnualMebAreaOptions(select, "-- Alan seçin --", schoolType, gradeNum);
  } catch (error) {
    console.error("Custom template alan listesi yüklenemedi:", error);
  }
}

async function loadCustomTemplateLessons() {
  const selectArea = document.getElementById("annualCustomAreaCode");
  const lessonInput = document.getElementById("annualCustomLessonName");
  const datalist = document.getElementById("annualCustomLessonDatalist");
  const type = document.getElementById("annualCustomType")?.value || "mtal";
  const gradeVal = document.getElementById("annualCustomGrade")?.value || "11. sınıf";
  const gradeNum = gradeVal.match(/\d+/)?.[0] || "11";

  if (!selectArea) return;
  const areaCode = selectArea.value;
  const areaName = areaCode !== "00" ? selectArea.options[selectArea.selectedIndex]?.text || "" : "";

  // Always keep input accessible
  if (lessonInput) {
    lessonInput.style.display = "block";
  }

  // Collect lessons from local templates
  const localLessons = new Set();
  const areaSlug = annualSlug(areaName);
  (annualState.templates || []).forEach(t => {
    if (t.type === type && (annualSlug(t.areaName || t.areaId || "") === areaSlug) && t.grade === gradeVal) {
      if (t.lessonName) localLessons.add(t.lessonName.trim());
    }
  });

  const apiLessons = new Set();
  if (areaCode && areaCode !== "00") {
    const entries = await fetchCatalogLessons(type, gradeNum, areaCode);
    entries.forEach(entry => {
      if (entry.title) {
        const cleaned = cleanLessonName(entry.title);
        if (cleaned) apiLessons.add(cleaned);
      }
    });
  }

  const allLessons = new Set([...localLessons, ...apiLessons]);
  const sortedLessons = Array.from(allLessons).sort((a, b) => a.localeCompare(b, "tr"));

  if (datalist) {
    datalist.innerHTML = sortedLessons.map(lesson => `<option value="${annualHtml(lesson)}"></option>`).join("");
  }
}

function resetCustomTemplateForm() {
  editingTemplateId = null;
  const titleEl = document.getElementById("annualCustomTemplateTitle");
  if (titleEl) {
    titleEl.textContent = "Plan Şablonu Oluştur";
  }
  const saveBtn = document.getElementById("annualSaveCustomTemplateBtn");
  if (saveBtn) {
    saveBtn.textContent = "Şablonu Kütüphaneye Kaydet";
  }
  
  const customType = document.getElementById("annualCustomType");
  if (customType) customType.value = "mtal";
  const selectArea = document.getElementById("annualCustomAreaCode");
  if (selectArea) selectArea.value = "00";
  const customGrade = document.getElementById("annualCustomGrade");
  if (customGrade) customGrade.value = "11. sınıf";
  const customLesson = document.getElementById("annualCustomLessonName");
  if (customLesson) customLesson.value = "";
  const customHours = document.getElementById("annualCustomWeeklyHours");
  if (customHours) customHours.value = "2";
  const customYear = document.getElementById("annualCustomYear");
  if (customYear) customYear.value = "2025-2026";
  
  const container = document.getElementById("annualCustomUnitContainer");
  if (container) {
    container.innerHTML = "";
    customUnitCounter = 0;
  }
  addCustomUnitCard();
  
  const savedSelect = document.getElementById("annualSavedTemplateSelect");
  if (savedSelect) savedSelect.value = "";

  // Reset lesson dropdown and inputs
  loadCustomTemplateLessons();
  updateCustomTemplateTotalRatio();
}

async function editCustomTemplate(templateId) {
  const template = annualState.templates.find(t => t.id === templateId);
  if (!template) return;
  
  editingTemplateId = templateId;
  
  // Set view to plan-template
  setAnnualView("plan-template");
  setTemplateMode("saved");
  const savedSelect = document.getElementById("annualSavedTemplateSelect");
  if (savedSelect) savedSelect.value = templateId;
  
  // Update Title
  const titleEl = document.getElementById("annualCustomTemplateTitle");
  if (titleEl) titleEl.textContent = "Plan Şablonunu Düzenle";
  
  // Update Button Text
  const saveBtn = document.getElementById("annualSaveCustomTemplateBtn");
  if (saveBtn) saveBtn.textContent = "Şablonu Güncelle";
  
  // Make sure areas are loaded
  await loadCustomTemplateAreas();
  
  // Set fields
  const customType = document.getElementById("annualCustomType");
  if (customType) customType.value = template.type;
  
  const selectArea = document.getElementById("annualCustomAreaCode");
  if (selectArea) {
    let matchedValue = "00";
    const targetSlug = annualSlug(template.areaName || template.areaId || "");
    for (const option of selectArea.options) {
      if (annualSlug(option.text) === targetSlug || option.text.toLowerCase() === (template.areaName || "").toLowerCase()) {
        matchedValue = option.value;
        break;
      }
    }
    selectArea.value = matchedValue;
  }
  
  const customGrade = document.getElementById("annualCustomGrade");
  if (customGrade) customGrade.value = template.grade || "11. sınıf";
  const customLesson = document.getElementById("annualCustomLessonName");
  if (customLesson) customLesson.value = template.lessonName || "";
  
  // Load lessons dynamically and select/match
  await loadCustomTemplateLessons();

  const customHours = document.getElementById("annualCustomWeeklyHours");
  if (customHours) customHours.value = template.weeklyHours || 2;
  const customYear = document.getElementById("annualCustomYear");
  if (customYear) customYear.value = template.year || "2025-2026";
  
  // Clear and populate unit cards
  const container = document.getElementById("annualCustomUnitContainer");
  if (container) {
    container.innerHTML = "";
    customUnitCounter = 0;
  }
  
  if (template.units && template.units.length > 0) {
    template.units.forEach(unit => {
      const outcomesLines = splitOutcomesIntoLines(unit.outcomes);
      const topicsLines = Array.isArray(unit.topics) ? unit.topics.join("\n") : (unit.topics || "");
      addCustomUnitCard(
        unit.title || "",
        unit.hours || 10,
        unit.ratio || "",
        outcomesLines,
        topicsLines
      );
    });
  } else {
    addCustomUnitCard();
  }
  updateCustomTemplateTotalRatio();
}

function populateImportedCurriculum(parsedUnits, skipTopics = false) {
  if (!parsedUnits || parsedUnits.length === 0) {
    return annualToast("Aktarılan belgede geçerli ünite/öğrenme birimi bulunamadı.", "warning");
  }
  
  const container = document.getElementById("annualCustomUnitContainer");
  const cards = document.querySelectorAll(".annual-custom-unit-card");
  
  // Check if the editor is in default empty state (only 1 card, and all fields are empty)
  const isEmptyEditor = cards.length === 1 && 
    !cards[0].querySelector(".custom-unit-title").value.trim() &&
    !cards[0].querySelector(".custom-unit-outcomes").value.trim() &&
    !cards[0].querySelector(".custom-unit-topics").value.trim();
    
  if (isEmptyEditor) {
    // Overwrite completely
    if (container) {
      container.innerHTML = "";
      customUnitCounter = 0;
    }
    parsedUnits.forEach(unit => {
      const topicsText = skipTopics ? "" : (Array.isArray(unit.topics) ? unit.topics.join("\n") : (unit.topics || ""));
      const outcomesLines = splitOutcomesIntoLines(unit.outcomes);
      addCustomUnitCard(
        unit.title || "",
        unit.hours || 10,
        unit.ratio || "",
        outcomesLines,
        topicsText
      );
    });
    annualToast(`${parsedUnits.length} öğrenme birimi başarıyla aktarıldı.`, "success");
  } else {
    // Smart Merge logic
    const existingCardsData = [];
    cards.forEach(card => {
      existingCardsData.push({
        title: card.querySelector(".custom-unit-title").value.trim(),
        element: card
      });
    });
    
    let mergedCount = 0;
    let addedCount = 0;
    
    parsedUnits.forEach((parsedUnit, index) => {
      let match = null;
      if (parsedUnit.title) {
        const parsedSlug = annualSlug(parsedUnit.title);
        match = existingCardsData.find(c => c.title && annualSlug(c.title) === parsedSlug);
      }
      
      if (!match && index < existingCardsData.length) {
        match = existingCardsData[index];
      }
      
      if (match) {
        const cardEl = match.element;
        const titleInput = cardEl.querySelector(".custom-unit-title");
        const hoursInput = cardEl.querySelector(".custom-unit-hours");
        const ratioInput = cardEl.querySelector(".custom-unit-ratio");
        const outcomesTextarea = cardEl.querySelector(".custom-unit-outcomes");
        const topicsTextarea = cardEl.querySelector(".custom-unit-topics");
        
        if (parsedUnit.title && (!titleInput.value.trim() || titleInput.value.trim().length < 3)) {
          titleInput.value = parsedUnit.title;
        }
        if (parsedUnit.hours && parsedUnit.hours !== 10) {
          hoursInput.value = parsedUnit.hours;
        }
        if (parsedUnit.ratio) {
          ratioInput.value = parsedUnit.ratio;
        }
        if (parsedUnit.outcomes) {
          outcomesTextarea.value = splitOutcomesIntoLines(parsedUnit.outcomes);
        }
        const topicsText = skipTopics ? "" : (Array.isArray(parsedUnit.topics) ? parsedUnit.topics.join("\n") : (parsedUnit.topics || ""));
        if (topicsText) {
          topicsTextarea.value = topicsText;
        }
        mergedCount++;
      } else {
        const topicsText = skipTopics ? "" : (Array.isArray(parsedUnit.topics) ? parsedUnit.topics.join("\n") : (parsedUnit.topics || ""));
        const outcomesLines = splitOutcomesIntoLines(parsedUnit.outcomes);
        addCustomUnitCard(
          parsedUnit.title || "",
          parsedUnit.hours || 10,
          parsedUnit.ratio || "",
          outcomesLines,
          topicsText
        );
        addedCount++;
      }
    });
    
    let msg = "";
    if (mergedCount > 0 && addedCount > 0) {
      msg = `${mergedCount} ünite güncellendi, ${addedCount} yeni ünite eklendi.`;
    } else if (mergedCount > 0) {
      msg = `${mergedCount} mevcut üniteye veriler başarıyla aktarıldı.`;
    } else {
      msg = `${addedCount} yeni öğrenme birimi eklendi.`;
    }
    annualToast(msg, "success");
  }
  updateCustomTemplateTotalRatio();
}

let importDialogAreasLoaded = false;
async function loadImportDialogMebAreas(force = false) {
  const select = document.getElementById("annualImportMebAreaCode");
  if (!select) return;
  const schoolType = document.getElementById("annualImportMebSchoolType")?.value || "mtal";
  const grade = document.getElementById("annualImportMebGrade")?.value || "11";
  const key = `${schoolType}-${grade}`;
  if (!force && select.dataset.loadedKey === key && select.options.length > 1) return;
  try {
    select.disabled = true;
    select.innerHTML = `<option value="00">Alanlar yükleniyor...</option>`;
    const response = await fetch(`/api/meb-areas?schoolType=${encodeURIComponent(schoolType)}&grade=${encodeURIComponent(grade)}`);
    if (!response.ok) throw new Error("Alan listesi alınamadı.");
    const data = await response.json();
    const areas = Array.isArray(data.areas) ? data.areas : [];
    select.innerHTML = `<option value="00">-- Alan seçin --</option>` +
      areas.map((area) => `<option value="${annualHtml(area.code)}">${annualHtml(area.name)}</option>`).join("");
    select.dataset.loadedKey = key;
    importDialogAreasLoaded = true;
  } catch (error) {
    console.error("Import dialog alan listesi yüklenemedi:", error);
  } finally {
    select.disabled = false;
  }
}

async function loadImportDialogMebLessons(selectedLessonName = "") {
  if (typeof selectedLessonName !== "string") {
    selectedLessonName = "";
  }
  const type = document.getElementById("annualImportMebSchoolType")?.value || "mtal";
  const selectArea = document.getElementById("annualImportMebAreaCode");
  const gradeVal = document.getElementById("annualImportMebGrade")?.value || "11";
  const selectLesson = document.getElementById("annualImportMebLessonSelect");

  if (!selectLesson || !selectArea) return;

  const areaCode = selectArea.value;
  if (areaCode === "00") {
    selectLesson.innerHTML = `<option value="">-- Önce Alan Seçin --</option>`;
    return;
  }

  selectLesson.innerHTML = `<option value="">Yükleniyor...</option>`;

  try {
    const response = await fetch("/api/annual-meb-catalog-by-area", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "dbf", schoolType: type, grade: gradeVal, areaCode })
    });
    if (!response.ok) throw new Error("Katalog listesi alınamadı.");
    const data = await response.json();
    const entries = data.entries || [];

    if (entries.length > 0) {
      selectLesson.innerHTML = `<option value="">-- Ders Seçin --</option>` +
        entries.map(entry => `<option value="${annualHtml(entry.url)}">${annualHtml(entry.title)}</option>`).join("");
      
      // Try to preselect the option matching parent's selected lesson name
      if (selectedLessonName) {
        const cleanTarget = cleanLessonName(selectedLessonName).toLowerCase();
        for (let i = 0; i < selectLesson.options.length; i++) {
          const optionText = selectLesson.options[i].text;
          if (cleanLessonName(optionText).toLowerCase() === cleanTarget) {
            selectLesson.selectedIndex = i;
            break;
          }
        }
      } else if (entries.length === 1) {
        selectLesson.selectedIndex = 1;
      }
    } else {
      selectLesson.innerHTML = `<option value="" disabled>Katalogda ders bilgi formu bulunamadı</option>`;
    }
  } catch (error) {
    console.error("Import kataloğundan dersler yüklenemedi:", error);
    selectLesson.innerHTML = `<option value="" disabled>Yükleme hatası</option>`;
  }
}

let currentTemplateMode = "meb";

async function loadCatalogBoxAreas() {
  const select = document.getElementById("annualCatalogAreaCode");
  if (!select) return;
  const schoolType = document.getElementById("annualCatalogSchoolType")?.value || "mtal";
  const gradeVal = document.getElementById("annualCatalogGrade")?.value || "11";
  try {
    delete select.dataset.loadedKey;
    await loadAnnualMebAreaOptions(select, "-- Alan Seçin --", schoolType, gradeVal);
  } catch (error) {
    console.error("Katalog box alan listesi yüklenemedi:", error);
  }
}

async function loadCatalogBoxLessons() {
  const selectArea = document.getElementById("annualCatalogAreaCode");
  const selectLesson = document.getElementById("annualCatalogLessonSelect");
  const statusEl = document.getElementById("annualMebCatalogStatus");
  if (!selectArea || !selectLesson) return;

  const areaCode = selectArea.value;
  if (!areaCode || areaCode === "00") {
    selectLesson.innerHTML = `<option value="">-- Önce Alan Seçin --</option>`;
    if (statusEl) statusEl.textContent = "";
    return;
  }

  const schoolType = document.getElementById("annualCatalogSchoolType")?.value || "mtal";
  const gradeVal = document.getElementById("annualCatalogGrade")?.value || "11";

  selectLesson.innerHTML = `<option value="">Dersler yükleniyor...</option>`;
  if (statusEl) statusEl.textContent = "⏳ MEB kataloğu taranıyor...";

  const entries = await fetchCatalogLessons(schoolType, gradeVal, areaCode);
  if (statusEl) statusEl.textContent = "";

  if (entries.length > 0) {
    selectLesson.innerHTML = `<option value="">-- Ders Seçin (${entries.length} ders listelendi) --</option>` +
      entries.map(e => `<option value="${annualHtml(e.url)}">${annualHtml(e.title)}</option>`).join("");
    if (selectLesson.options.length > 1) {
      selectLesson.selectedIndex = 1;
    }
  } else {
    selectLesson.innerHTML = `<option value="" disabled>Katalogda ders bulunamadı</option>`;
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: #b45309; font-weight: 600;">⚠️ Ders listesi alınamadı. Üstten "2. Manuel Giriş" seçeneğini kullanabilirsiniz.</span>`;
    }
  }
}

function setTemplateMode(mode) {
  currentTemplateMode = mode;
  const mebCard = document.getElementById("annualModeMebCard");
  const manualCard = document.getElementById("annualModeManualCard");
  const savedCard = document.getElementById("annualModeSavedCard");
  const mebBox = document.getElementById("annualMebCatalogActionBox");
  const savedBox = document.getElementById("annualSavedTemplateActionBox");
  const lessonInput = document.getElementById("annualCustomLessonName");

  // Reset all cards styling
  [mebCard, manualCard, savedCard].forEach(card => {
    if (!card) return;
    card.classList.remove("is-active");
    card.style.borderColor = "#cbd5e1";
    card.style.background = "#ffffff";
  });

  // Hide both action panels by default
  if (mebBox) mebBox.style.display = "none";
  if (savedBox) savedBox.style.display = "none";

  if (mode === "meb") {
    if (mebCard) {
      mebCard.classList.add("is-active");
      mebCard.style.borderColor = "var(--accent)";
      mebCard.style.background = "#f0fdf4";
    }
    if (mebBox) mebBox.style.display = "block";
    loadCatalogBoxAreas();
  } else if (mode === "saved") {
    if (savedCard) {
      savedCard.classList.add("is-active");
      savedCard.style.borderColor = "var(--accent)";
      savedCard.style.background = "#f0fdf4";
    }
    if (savedBox) savedBox.style.display = "block";
    renderCustomTemplateQuickPicker();
  } else {
    // manual mode
    if (manualCard) {
      manualCard.classList.add("is-active");
      manualCard.style.borderColor = "var(--accent)";
      manualCard.style.background = "#f0fdf4";
    }
    if (lessonInput) {
      lessonInput.focus();
    }
  }
}

async function handleCatalogQuickTransfer() {
  const lessonSelect = document.getElementById("annualCatalogLessonSelect");
  const dbfUrl = lessonSelect?.value;
  if (!dbfUrl) {
    return annualToast("Lütfen aktarmak için bir ders seçin.", "warning");
  }

  const selectedOptionText = lessonSelect.options[lessonSelect.selectedIndex].text;
  const schoolType = document.getElementById("annualCatalogSchoolType")?.value || "mtal";
  const gradeVal = document.getElementById("annualCatalogGrade")?.value || "11";
  const selectArea = document.getElementById("annualCatalogAreaCode");
  const areaName = selectArea && selectArea.value !== "00" ? selectArea.options[selectArea.selectedIndex].text : "";
  const gradeText = `${gradeVal}. sınıf`;

  try {
    annualToast(`"${selectedOptionText}" dersinin müfredatı aktarılıyor...`, "info");
    const response = await fetch("/api/annual-import-meb-dbf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: dbfUrl,
        meta: {
          schoolType,
          areaName,
          grade: gradeText,
          lessonName: selectedOptionText.trim()
        }
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Sunucu hatası: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const lessonInput = document.getElementById("annualCustomLessonName");
    if (lessonInput) lessonInput.value = data.lessonName || selectedOptionText;
    const customType = document.getElementById("annualCustomType");
    if (customType) customType.value = schoolType;
    const customGrade = document.getElementById("annualCustomGrade");
    if (customGrade) customGrade.value = gradeText;
    const customHours = document.getElementById("annualCustomWeeklyHours");
    if (customHours && data.weeklyHours) customHours.value = data.weeklyHours;

    const customArea = document.getElementById("annualCustomAreaCode");
    if (customArea && selectArea.value !== "00") {
      customArea.value = selectArea.value;
    }

    populateImportedCurriculum(data.units || [], false);
    annualToast(`"${data.lessonName || selectedOptionText}" dersinin ${data.units?.length || 0} ünitesi ve kazanımları başarıyla aktarıldı!`, "success");
  } catch (error) {
    annualToast(`Katalogdan aktarım başarısız: ${error.message}`, "error");
  }
}

function initPlanTemplateView() {
  const container = document.getElementById("annualCustomUnitContainer");
  if (!container) return;
  
  renderCustomTemplateQuickPicker();
  setTemplateMode(currentTemplateMode || "meb");
  loadCatalogBoxAreas();
  loadCustomTemplateAreas();
  loadCustomTemplateLessons();
  
  if (!customTemplateBound) {
    customTemplateBound = true;
    
    // Mode switcher buttons
    document.getElementById("annualModeMebCard")?.addEventListener("click", () => setTemplateMode("meb"));
    document.getElementById("annualModeManualCard")?.addEventListener("click", () => setTemplateMode("manual"));
    document.getElementById("annualModeSavedCard")?.addEventListener("click", () => setTemplateMode("saved"));

    // Saved Template Action Box events
    document.getElementById("annualOpenSavedTemplateBtn")?.addEventListener("click", () => {
      const select = document.getElementById("annualSavedTemplateSelect");
      const templateId = select?.value || "";
      if (!templateId) return annualToast("Düzenlemek için kayıtlı bir şablon seçin.", "warning");
      editCustomTemplate(templateId);
    });

    document.getElementById("annualNewTemplateBtn")?.addEventListener("click", () => {
      resetCustomTemplateForm();
      annualToast("Yeni şablon formu hazırlandı.");
    });

    document.getElementById("annualSavedTemplateSelect")?.addEventListener("change", (e) => {
      const templateId = e.target?.value;
      if (templateId) {
        editCustomTemplate(templateId);
      }
    });

    // MEB Catalog Action Box events
    const onCatalogBoxFilterChanged = async () => {
      await loadCatalogBoxAreas();
      await loadCatalogBoxLessons();
    };
    document.getElementById("annualCatalogSchoolType")?.addEventListener("change", onCatalogBoxFilterChanged);
    document.getElementById("annualCatalogGrade")?.addEventListener("change", onCatalogBoxFilterChanged);
    document.getElementById("annualCatalogAreaCode")?.addEventListener("change", loadCatalogBoxLessons);
    document.getElementById("annualCatalogQuickTransferBtn")?.addEventListener("click", handleCatalogQuickTransfer);

    // Bind reload events for lesson selection
    document.getElementById("annualCustomType")?.addEventListener("change", async () => {
      await loadCustomTemplateAreas();
      await loadCustomTemplateLessons();
    });
    document.getElementById("annualCustomAreaCode")?.addEventListener("change", loadCustomTemplateLessons);
    document.getElementById("annualCustomGrade")?.addEventListener("change", async () => {
      await loadCustomTemplateAreas();
      await loadCustomTemplateLessons();
    });
    
    // Lesson selection change events
    const selectLesson = document.getElementById("annualCustomLessonSelect");
    const lessonInput = document.getElementById("annualCustomLessonName");
    const cancelBtn = document.getElementById("annualCustomLessonCancelBtn");
    
    selectLesson?.addEventListener("change", () => {
      if (selectLesson.value === "__custom__") {
        selectLesson.style.display = "none";
        if (lessonInput) {
          lessonInput.style.display = "block";
          lessonInput.value = "";
          lessonInput.focus();
        }
        if (cancelBtn) cancelBtn.style.display = "block";
      } else {
        if (lessonInput) {
          lessonInput.value = selectLesson.value;
        }
      }
    });
    
    cancelBtn?.addEventListener("click", () => {
      if (selectLesson) {
        selectLesson.value = "";
        selectLesson.style.display = "block";
      }
      if (lessonInput) {
        lessonInput.style.display = "none";
        lessonInput.value = "";
      }
      cancelBtn.style.display = "none";
    });
    
    // Auto Book TOC extraction buttons
    const autoBookTOCBtn = document.getElementById("annualAutoBookTOCBtn");
    const autoBookTOCInput = document.getElementById("annualAutoBookTOCFileInput");

    autoBookTOCBtn?.addEventListener("click", () => {
      const cards = document.querySelectorAll(".annual-custom-unit-card");
      if (cards.length === 0) {
        return annualToast("Lütfen önce üniteleri oluşturun veya aktarın.", "warning");
      }
      
      let hasEmptyTitle = false;
      cards.forEach(card => {
        const title = card.querySelector(".custom-unit-title").value.trim();
        if (!title) hasEmptyTitle = true;
      });
      
      if (hasEmptyTitle) {
        return annualToast("Lütfen önce tüm ünite isimlerini doldurun.", "warning");
      }

      autoBookTOCInput?.click();
    });

    autoBookTOCInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const cards = document.querySelectorAll(".annual-custom-unit-card");
      const unitsData = [];
      cards.forEach(card => {
        const title = card.querySelector(".custom-unit-title").value.trim();
        unitsData.push({ title });
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("units", JSON.stringify(unitsData));

      annualToast("Kitap PDF'i yükleniyor ve içindekiler tablosu çözümleniyor...", "info");

      try {
        const response = await fetch("/api/annual-extract-book-toc", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Sunucu hatası: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const returnedUnits = data.units || [];
        let matchCount = 0;

        cards.forEach(card => {
          const title = card.querySelector(".custom-unit-title").value.trim();
          const slug = annualSlug(title);

          const matched = returnedUnits.find(u => annualSlug(u.title) === slug);
          if (matched && matched.topics && matched.topics.length > 0) {
            const topicsTextarea = card.querySelector(".custom-unit-topics");
            if (topicsTextarea) {
              topicsTextarea.value = matched.topics.join("\n");
              matchCount++;
            }
          }
        });

        if (matchCount > 0) {
          annualToast(`${matchCount} ünitenin kitaptaki içindekiler konuları otomatik eşleştirildi!`, "success");
        } else {
          annualToast("Kitap içindekilerinden mevcut ünitelerle eşleşen konu bulunamadı. Lütfen ünite isimlerinin kitapla uyuştuğundan emin olun.", "warning");
        }
      } catch (error) {
        annualToast(`İçindekiler aktarımı başarısız: ${error.message}`, "error");
      } finally {
        if (autoBookTOCInput) autoBookTOCInput.value = "";
      }
    });
    
    // Show Word / Meb Import Dialog button
    document.getElementById("annualShowWordImportDialogBtn")?.addEventListener("click", async () => {
      const dialog = document.getElementById("annualWordImportDialog");
      if (dialog) {
        dialog.showModal();
        
        // Just load areas list for the dialog without overriding any selections
        await loadImportDialogMebAreas();
        const importAreaCode = document.getElementById("annualImportMebAreaCode")?.value;
        if (importAreaCode && importAreaCode !== "00") {
          await loadImportDialogMebLessons();
        }
      }
    });

    // Dialog close button
    document.getElementById("annualWordImportCloseBtn")?.addEventListener("click", () => {
      document.getElementById("annualWordImportDialog")?.close();
    });

    // Tab switching bindings
    const tabMeb = document.getElementById("annualImportTabMeb");
    const tabLocal = document.getElementById("annualImportTabLocal");
    const panelMeb = document.getElementById("annualImportPanelMeb");
    const panelLocal = document.getElementById("annualImportPanelLocal");

    tabMeb?.addEventListener("click", () => {
      tabMeb.classList.add("is-active");
      tabMeb.style.color = "#153f46";
      tabMeb.style.borderBottomColor = "#153f46";
      tabLocal.classList.remove("is-active");
      tabLocal.style.color = "#64748b";
      tabLocal.style.borderBottomColor = "transparent";
      if (panelMeb) panelMeb.style.display = "flex";
      if (panelLocal) panelLocal.style.display = "none";
    });

    tabLocal?.addEventListener("click", () => {
      tabLocal.classList.add("is-active");
      tabLocal.style.color = "#153f46";
      tabLocal.style.borderBottomColor = "#153f46";
      tabMeb.classList.remove("is-active");
      tabMeb.style.color = "#64748b";
      tabMeb.style.borderBottomColor = "transparent";
      if (panelLocal) panelLocal.style.display = "flex";
      if (panelMeb) panelMeb.style.display = "none";
    });

    // Dynamic catalog lists in dialog
    const onImportFilterChanged = async () => {
      await loadImportDialogMebAreas(true);
      await loadImportDialogMebLessons();
    };
    document.getElementById("annualImportMebSchoolType")?.addEventListener("change", onImportFilterChanged);
    document.getElementById("annualImportMebAreaCode")?.addEventListener("change", () => loadImportDialogMebLessons());
    document.getElementById("annualImportMebGrade")?.addEventListener("change", onImportFilterChanged);

    // Local file selectors
    const localFileInput = document.getElementById("annualImportWordFileInput");
    const localFileInfo = document.getElementById("annualImportLocalFileName");
    const localFileNameText = document.getElementById("annualImportLocalFileNameText");
    const localFileSubmitBtn = document.getElementById("annualImportLocalSubmitBtn");
    const localFileRemoveBtn = document.getElementById("annualImportLocalRemoveFileBtn");

    localFileInput?.addEventListener("change", () => {
      if (localFileInput.files && localFileInput.files.length > 0) {
        if (localFileNameText) localFileNameText.textContent = localFileInput.files[0].name;
        if (localFileInfo) localFileInfo.style.display = "flex";
        if (localFileSubmitBtn) localFileSubmitBtn.disabled = false;
      }
    });

    localFileRemoveBtn?.addEventListener("click", () => {
      if (localFileInput) localFileInput.value = "";
      if (localFileInfo) localFileInfo.style.display = "none";
      if (localFileSubmitBtn) localFileSubmitBtn.disabled = true;
    });

    // Local file upload submit
    localFileSubmitBtn?.addEventListener("click", async () => {
      if (!localFileInput.files || localFileInput.files.length === 0) return;
      const file = localFileInput.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        annualToast("Word belgesi çözümleniyor, lütfen bekleyin...", "info");
        const response = await fetch("/api/import-template-docx", {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Sunucu hatası: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        populateImportedCurriculum(data.units || [], false);
        if (data.lessonName) {
          const customLessonInput = document.getElementById("annualCustomLessonName");
          if (customLessonInput) customLessonInput.value = data.lessonName;
        }
        if (data.weeklyHours) {
          const customHours = document.getElementById("annualCustomWeeklyHours");
          if (customHours) customHours.value = data.weeklyHours;
        }
        if (data.grade) {
          const customGrade = document.getElementById("annualCustomGrade");
          if (customGrade) customGrade.value = data.grade;
        }

        document.getElementById("annualWordImportDialog")?.close();
        localFileInput.value = "";
        if (localFileInfo) localFileInfo.style.display = "none";
        if (localFileSubmitBtn) localFileSubmitBtn.disabled = true;
      } catch (error) {
        annualToast(`Aktarım başarısız: ${error.message}`, "error");
      }
    });

    // MEB Catalog download submit
    const mebSubmitBtn = document.getElementById("annualImportMebSubmitBtn");
    const mebLessonSelect = document.getElementById("annualImportMebLessonSelect");

    mebSubmitBtn?.addEventListener("click", async () => {
      const dbfUrl = mebLessonSelect?.value;
      if (!dbfUrl) {
        return annualToast("Lütfen önce bir ders seçin.", "warning");
      }

      const selectedOptionText = mebLessonSelect.options[mebLessonSelect.selectedIndex].text;

      // Retrieve metadata directly from the MODAL dialog inputs
      const importSchoolType = document.getElementById("annualImportMebSchoolType")?.value || "mtal";
      const selectImportArea = document.getElementById("annualImportMebAreaCode");
      const importAreaName = selectImportArea && selectImportArea.value !== "00" ? selectImportArea.options[selectImportArea.selectedIndex].text : "";
      const importGradeVal = document.getElementById("annualImportMebGrade")?.value || "11";
      
      const gradeText = importGradeVal === "Genel" ? "Genel" : `${importGradeVal}. sınıf`;
      const lessonName = selectedOptionText;

      try {
        annualToast("MEB Kataloğundan DBF belgesi çekiliyor ve çözümleniyor...", "info");
        const response = await fetch("/api/annual-import-meb-dbf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            url: dbfUrl,
            meta: {
              schoolType: importSchoolType,
              areaName: importAreaName,
              grade: gradeText,
              lessonName: lessonName.trim()
            }
          })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Sunucu hatası: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        populateImportedCurriculum(data.units || [], false);

        const customLessonInput = document.getElementById("annualCustomLessonName");
        if (customLessonInput) customLessonInput.value = data.lessonName || lessonName;
        const customType = document.getElementById("annualCustomType");
        if (customType) customType.value = importSchoolType;
        const customGrade = document.getElementById("annualCustomGrade");
        if (customGrade) customGrade.value = gradeText;
        const customHours = document.getElementById("annualCustomWeeklyHours");
        if (customHours && data.weeklyHours) customHours.value = data.weeklyHours;
        const customArea = document.getElementById("annualCustomAreaCode");
        if (customArea && selectImportArea && selectImportArea.value !== "00") customArea.value = selectImportArea.value;

        document.getElementById("annualWordImportDialog")?.close();
      } catch (error) {
        annualToast(`Katalogdan aktarım başarısız: ${error.message}`, "error");
      }
    });

    document.getElementById("annualAddCustomUnitBtn")?.addEventListener("click", () => {
      addCustomUnitCard();
    });
    document.getElementById("annualSaveCustomTemplateBtn")?.addEventListener("click", saveCustomTemplate);
    document.getElementById("annualPublishPlatformBtn")?.addEventListener("click", publishCurrentTemplateToPlatform);
  }
  
  // If container is empty, add one initial unit card
  if (container.children.length === 0) {
    customUnitCounter = 0;
    addCustomUnitCard();
  }
}

function addCustomUnitCard(title = "", hours = 10, ratio = "", outcomes = "", topics = "") {
  const container = document.getElementById("annualCustomUnitContainer");
  if (!container) return;
  
  const index = customUnitCounter++;
  const wrapper = document.createElement("div");
  wrapper.className = "annual-custom-unit-card-wrapper";
  wrapper.innerHTML = `
    <div class="annual-custom-unit-card" data-unit-index="${index}" style="border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04); text-align: left; transition: border-color 0.2s, box-shadow 0.2s;">
      
      <div class="annual-form-grid" style="grid-template-columns: 3fr 1fr 1fr auto; gap: 16px; margin-bottom: 20px; align-items: flex-end;">
        <label style="display:flex; flex-direction:column; align-items:stretch; text-align:left; margin: 0;">
          <span style="font-size: 0.85rem; font-weight: bold; color: #475569; margin-bottom:6px;">Ünite / Öğrenme Birimi Adı</span>
          <input type="text" class="custom-unit-title" placeholder="Öğrenme Birimi başlığını yazın" value="${annualHtml(title)}" required style="width:100%; min-height:38px; border: 1px solid #cbd5e1; border-radius:8px; padding: 0 12px; box-sizing: border-box; font-size: 0.9rem;" />
        </label>
        <label style="display:flex; flex-direction:column; align-items:stretch; text-align:left; margin: 0;">
          <span style="font-size: 0.85rem; font-weight: bold; color: #475569; margin-bottom:6px;">Süre (Saat)</span>
          <input type="number" class="custom-unit-hours" min="1" value="${hours}" required style="width:100%; min-height:38px; border: 1px solid #cbd5e1; border-radius:8px; padding: 0 12px; box-sizing: border-box; font-size: 0.9rem;" />
        </label>
        <label style="display:flex; flex-direction:column; align-items:stretch; text-align:left; margin: 0;">
          <span style="font-size: 0.85rem; font-weight: bold; color: #475569; margin-bottom:6px;">Yüzdesel Ağırlık (%)</span>
          <input type="number" class="custom-unit-ratio" min="0" max="100" placeholder="Örn: 25" value="${annualHtml(ratio)}" style="width:100%; min-height:38px; border: 1px solid #cbd5e1; border-radius:8px; padding: 0 12px; box-sizing: border-box; font-size: 0.9rem;" />
        </label>
        <div style="display: flex; align-items: flex-end; height: 100%;">
          <button class="danger-action" data-remove-unit="${index}" type="button" style="padding: 0 16px; font-size: 0.85rem; border-radius: 8px; cursor: pointer; height: 38px; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin: 0; font-weight: bold; transition: all 0.15s ease;">
            🗑️ Sil
          </button>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <label style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
          <span style="font-weight: bold; font-size: 0.85rem; color: #475569;">🎯 Kazanımlar (Her bir kazanımı ayrı satıra yazın)</span>
          <textarea class="custom-unit-outcomes" rows="6" placeholder="Örn:&#10;Kelime işlemci programını çalıştırır.&#10;Belge üzerinde temel biçimlendirme işlemlerini yapar." style="width:100%; font-family: inherit; font-size: 0.9rem; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; resize: vertical; box-sizing: border-box; line-height: 1.5;">${annualHtml(outcomes)}</textarea>
        </label>
        <label style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
          <span style="font-weight: bold; font-size: 0.85rem; color: #475569;">📖 Kitaptaki İçindekiler Bölümü (Her bir alt konuyu yeni satıra yazın)</span>
          <textarea class="custom-unit-topics" rows="6" placeholder="Örn:&#10;1.1. Kelime İşlemci Arayüzü&#10;1.1.1. Hızlı Erişim Araç Çubuğu&#10;1.2. Metin Düzenleme İşlemleri" style="width:100%; font-family: inherit; font-size: 0.9rem; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; resize: vertical; box-sizing: border-box; line-height: 1.5;">${annualHtml(topics)}</textarea>
        </label>
      </div>
    </div>
  `;
  
  wrapper.querySelector(`[data-remove-unit="${index}"]`)?.addEventListener("click", () => {
    wrapper.remove();
    // If container becomes empty, add a card
    if (container.children.length === 0) {
      addCustomUnitCard();
    }
    updateCustomTemplateTotalRatio();
  });
  
  wrapper.querySelector(".custom-unit-ratio")?.addEventListener("input", updateCustomTemplateTotalRatio);
  
  container.appendChild(wrapper);
  updateCustomTemplateTotalRatio();
}

function getCustomTemplateLessonName() {
  const selectLesson = document.getElementById("annualCustomLessonSelect");
  const lessonInput = document.getElementById("annualCustomLessonName");
  if (selectLesson && selectLesson.style.display !== "none" && selectLesson.value && selectLesson.value !== "__custom__") {
    return selectLesson.value.trim();
  }
  return (lessonInput?.value || "").trim();
}

async function saveCustomTemplate() {
  const type = document.getElementById("annualCustomType").value;
  const selectArea = document.getElementById("annualCustomAreaCode");
  const areaName = selectArea && selectArea.value !== "00" ? selectArea.options[selectArea.selectedIndex].text : "";
  const grade = document.getElementById("annualCustomGrade").value;
  const lessonName = getCustomTemplateLessonName();
  const weeklyHours = parseInt(document.getElementById("annualCustomWeeklyHours").value, 10) || 2;
  const year = (annualState.settings && annualState.settings.year) ? annualState.settings.year : (document.getElementById("annualCustomYear").value.trim() || "2025-2026");
  
  if (!areaName || !lessonName) {
    return annualToast("Lütfen Alan Adı ve Ders Adı alanlarını doldurun.", "warning");
  }
  
  const units = [];
  const cards = document.querySelectorAll(".annual-custom-unit-card");
  
  cards.forEach(card => {
    const title = card.querySelector(".custom-unit-title").value.trim();
    const hours = parseInt(card.querySelector(".custom-unit-hours").value, 10) || 10;
    const ratio = card.querySelector(".custom-unit-ratio").value.trim();
    const outcomesRaw = card.querySelector(".custom-unit-outcomes").value.trim();
    const topicsRaw = card.querySelector(".custom-unit-topics").value.trim();
    
    if (!title) return;
    
    // Split topics by newline and clean
    const topics = topicsRaw.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
    
    // Outcomes split by newline and append periods
    const outcomesList = outcomesRaw.split(/\r?\n/)
      .map(o => o.trim())
      .filter(Boolean)
      .map(o => o.endsWith(".") ? o : o + ".");
    
    const outcomes = outcomesList.join(" ");
    
    units.push({
      title,
      hours,
      ratio,
      outcomes,
      topics,
      topicOutcomePairs: [] // Simple proportional flow
    });
  });
  
  if (units.length === 0) {
    return annualToast("Lütfen en az bir adet geçerli öğrenme birimi (ünite adı girilmiş) ekleyin.", "warning");
  }
  
  if (editingTemplateId) {
    const existingIndex = annualState.templates.findIndex(t => t.id === editingTemplateId);
    if (existingIndex >= 0) {
      annualState.templates[existingIndex] = {
        ...annualState.templates[existingIndex],
        type,
        areaId: annualSlug(areaName),
        areaName: areaName,
        grade,
        lessonName,
        year,
        weeklyHours,
        units
      };
      
      // Select this template as active
      annualState.selectedType = type;
      annualState.selectedAreaId = annualSlug(areaName);
      annualState.selectedTemplateId = editingTemplateId;
      annualState.showSteps1And2 = false; // direct to step 3 in wizard
      
      saveAnnualState();
      
      resetCustomTemplateForm();
      renderAnnualModule();
      annualToast(`"${lessonName}" şablonu güncellendi ve seçildi.`);
      
      // Redirect to Wizard to distribute plan!
      setAnnualView("wizard");
      return;
    }
  }
  
  const newTemplate = {
    id: `custom-${type}-${annualSlug(areaName)}-${annualSlug(lessonName)}-${annualSlug(grade)}-${Date.now()}`,
    type,
    areaId: annualSlug(areaName),
    areaName: areaName,
    grade,
    lessonName,
    year,
    weeklyHours,
    units
  };
  
  // Check if duplicate exists (same type, area, grade, lessonName)
  const existingIndex = annualState.templates.findIndex(t => 
    t.type === type && 
    t.areaId === newTemplate.areaId && 
    t.grade === grade && 
    t.lessonName.toLowerCase() === lessonName.toLowerCase()
  );
  
  if (existingIndex >= 0) {
    const confirmText = `"${lessonName}" dersi için kütüphanede zaten bir şablon bulunuyor. Mevcut şablonun üzerine yazmak istiyor musunuz?`;
    const proceed = confirm(confirmText);
    if (!proceed) return;
    // Replace existing
    annualState.templates[existingIndex] = {
      ...newTemplate,
      id: annualState.templates[existingIndex].id // keep original ID
    };
  } else {
    // Add new
    annualState.templates.push(newTemplate);
  }
  
  // Select this template as active
  annualState.selectedType = type;
  annualState.selectedAreaId = newTemplate.areaId;
  const savedTemplate = existingIndex >= 0 ? annualState.templates[existingIndex] : newTemplate;
  annualState.selectedTemplateId = savedTemplate.id;
  annualState.showSteps1And2 = false; // direct to step 3 in wizard
  
  saveAnnualState();
  
  // Clear the fields
  resetCustomTemplateForm();
  
  renderAnnualModule();
  annualToast(`"${lessonName}" şablonu kütüphaneye kaydedildi ve seçildi.`);
  
  // Redirect to Wizard to distribute plan!
  setAnnualView("wizard");
}

async function publishCurrentTemplateToPlatform() {
  if (!annualState.isAdmin || !annualState.adminPassword) {
    openAdminLoginModal();
    return;
  }
  const type = document.getElementById("annualCustomType")?.value || "mtal";
  const selectArea = document.getElementById("annualCustomAreaCode");
  const areaName = selectArea && selectArea.value !== "00" ? selectArea.options[selectArea.selectedIndex].text : "";
  const grade = document.getElementById("annualCustomGrade")?.value || "";
  const lessonName = getCustomTemplateLessonName();
  const weeklyHours = parseInt(document.getElementById("annualCustomWeeklyHours")?.value, 10) || 2;
  const year = (annualState.settings && annualState.settings.year) ? annualState.settings.year : (document.getElementById("annualCustomYear")?.value.trim() || "2026-2027");

  if (!areaName || !lessonName) {
    return annualToast("Lütfen Alan Adı ve Ders Adı alanlarını doldurun.", "warning");
  }

  const units = [];
  const cards = document.querySelectorAll(".annual-custom-unit-card");
  cards.forEach(card => {
    const title = card.querySelector(".custom-unit-title")?.value.trim();
    const hours = parseInt(card.querySelector(".custom-unit-hours")?.value, 10) || 10;
    const ratio = card.querySelector(".custom-unit-ratio")?.value.trim() || "";
    const outcomesRaw = card.querySelector(".custom-unit-outcomes")?.value.trim() || "";
    const topicsRaw = card.querySelector(".custom-unit-topics")?.value.trim() || "";
    if (!title) return;
    const topics = topicsRaw.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
    const outcomesList = outcomesRaw.split(/\r?\n/)
      .map(o => o.trim())
      .filter(Boolean)
      .map(o => o.endsWith(".") ? o : o + ".");
    const outcomes = outcomesList.join(" ");
    units.push({ title, hours, ratio, outcomes, topics, topicOutcomePairs: [] });
  });

  if (units.length === 0) {
    return annualToast("Lütfen en az bir adet geçerli öğrenme birimi ekleyin.", "warning");
  }

  const template = {
    type,
    areaId: annualSlug(areaName),
    areaName,
    grade,
    lessonName,
    year,
    weeklyHours,
    units
  };

  try {
    if (annualEls.publishPlatformBtn) annualEls.publishPlatformBtn.disabled = true;
    const res = await fetch("/api/annual-admin-save-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: annualState.adminPassword,
        template
      })
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Şablon yayınlanamadı.");
    }
    annualToast(`"${lessonName}" başarıyla platforma resmi şablon olarak yayınlandı! (Toplam: ${result.totalTemplates} ders)`);
    await loadPlatformTemplates();
  } catch (err) {
    annualToast(`Yayınlama hatası: ${err.message}`, "error");
  } finally {
    if (annualEls.publishPlatformBtn) annualEls.publishPlatformBtn.disabled = false;
  }
}

bindAnnualEvents();
renderAnnualModule();
loadPlatformTemplates();
verifyCurrentLicense();
syncUserCredits();

const annualPlanModule = {
  callbacks: {},
  init(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    annualCallbacks = this.callbacks;
    loadPlatformTemplates();
    verifyCurrentLicense();
    syncUserCredits();
  },
  loadState() {
    annualState = loadAnnualState();
    loadPlatformTemplates();
    verifyCurrentLicense();
    syncUserCredits();
  },
  get shell() {
    return annualEls.shell;
  },
  get state() {
    return annualState;
  },
  render() {
    return renderAnnualModule();
  },
  setView(view) {
    return setAnnualView(view);
  }
};
window.AppModules.register("annual-plan", annualPlanModule);
