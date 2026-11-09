/* ==========================================================================
   İŞLETMELERDE BECERİ EĞİTİMİ MODÜLÜ - EKRAN BAĞLARI VE ETKİLEŞİMLER
   ========================================================================== */

let alanDalListesi = null;
let importSchoolType = "existing";
let importSchoolExistingId = "";
let importSchoolNewName = "";


if (els.skillGlobalSearchInput) {
  els.skillGlobalSearchInput.addEventListener("input", renderSkillGlobalSearchResults);
  els.skillGlobalSearchInput.addEventListener("focus", renderSkillGlobalSearchResults);
  els.skillGlobalSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSkillGlobalSearchResults();
    }
    if (event.key === "Enter") {
      const firstResult = els.skillGlobalSearchResults?.querySelector("[data-skill-global-type]");
      if (firstResult) {
        event.preventDefault();
        openSkillGlobalSearchItem(firstResult.dataset.skillGlobalType, firstResult.dataset.skillGlobalId);
      }
    }
  });
}
if (els.skillGlobalSearchClear) {
  els.skillGlobalSearchClear.addEventListener("click", (event) => {
    event.preventDefault();
    clearSkillGlobalSearch();
    els.skillGlobalSearchInput?.focus();
  });
  els.skillGlobalSearchClear.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      clearSkillGlobalSearch();
      els.skillGlobalSearchInput?.focus();
    }
  });
}
if (els.skillGlobalSearchResults) {
  els.skillGlobalSearchResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-skill-global-type]");
    if (!button) return;
    event.preventDefault();
    openSkillGlobalSearchItem(button.dataset.skillGlobalType, button.dataset.skillGlobalId);
  });
}
let parsedImportSqliteData = null;
let activeImportTab = "excel";

function updateImportNextBtnState() {
  const nextBtn = document.getElementById("skillImportNextBtn");
  if (!nextBtn) return;
  
  if (activeImportTab === "excel") {
    const fileInput = document.getElementById("skillImportFileInput");
    nextBtn.disabled = !(fileInput && fileInput.files && fileInput.files.length > 0);
  } else {
    const sqliteSelect = document.getElementById("skillImportSqliteSelect");
    nextBtn.disabled = !(sqliteSelect && sqliteSelect.value);
  }
}

async function handleImportNextStep() {
  const step1 = document.getElementById("skillImportStep1");
  const step2 = document.getElementById("skillImportStep2");
  const tabContainer = document.getElementById("skillImportTabContainer");
  const saveBtn = document.getElementById("skillImportSaveBtn");
  const prevBtn = document.getElementById("skillImportPrevBtn");
  
  if (activeImportTab === "excel") {
    const schoolTypeRadio = document.querySelector('input[name="skillImportSchoolType"]:checked');
    importSchoolType = schoolTypeRadio ? schoolTypeRadio.value : "existing";
    
    if (importSchoolType === "new") {
      const newNameInput = document.getElementById("skillImportSchoolNewInput");
      const newName = newNameInput ? newNameInput.value.trim() : "";
      if (!newName) {
        showToast("Lütfen yeni okul adını giriniz.", "warning");
        return;
      }
      importSchoolNewName = newName;
      importSchoolExistingId = "";
    } else {
      const existingSelect = document.getElementById("skillImportSchoolExistingSelect");
      const existingId = existingSelect ? existingSelect.value : "";
      if (!existingId && skillState.schoolRecords.length > 0) {
        showToast("Lütfen mevcut bir okul seçin veya yeni okul oluşturmayı tercih edin.", "warning");
        return;
      }
      importSchoolExistingId = existingId;
      importSchoolNewName = "";
    }
  }

  if (step1) step1.style.display = "none";
  if (tabContainer) tabContainer.style.display = "none";
  if (step2) step2.style.display = "flex";
  if (els.skillImportPreviewArea) els.skillImportPreviewArea.style.display = "flex";
  if (saveBtn) saveBtn.disabled = true;
  if (prevBtn) prevBtn.disabled = true;
  
  if (activeImportTab === "excel") {
    const fileInput = document.getElementById("skillImportFileInput");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      await analyzeImeImportFile(fileInput.files[0]);
    }
  } else {
    await analyzeSqliteProfile();
  }
}

function handleImportPrevStep() {
  const step1 = document.getElementById("skillImportStep1");
  const step2 = document.getElementById("skillImportStep2");
  const tabContainer = document.getElementById("skillImportTabContainer");
  
  if (step2) step2.style.display = "none";
  if (step1) step1.style.display = "block";
  if (tabContainer) tabContainer.style.display = "flex";
  
  if (els.skillImportPreviewArea) els.skillImportPreviewArea.style.display = "none";
  if (els.skillImportStats) els.skillImportStats.textContent = "";
  if (els.skillImportPreviewTable) els.skillImportPreviewTable.innerHTML = "";
  if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = true;
  
  updateImportNextBtnState();
}

function switchImportTab(tab) {
  activeImportTab = tab;
  const tabExcel = document.getElementById("skillImportTabExcel");
  const tabSqlite = document.getElementById("skillImportTabSqlite");
  const panelExcel = document.getElementById("skillImportExcelPanel");
  const panelSqlite = document.getElementById("skillImportSqlitePanel");
  
  if (tab === "excel") {
    tabExcel?.classList.add("is-active");
    if (tabExcel) {
      tabExcel.style.color = "var(--accent)";
      tabExcel.style.borderBottomColor = "var(--accent)";
    }
    tabSqlite?.classList.remove("is-active");
    if (tabSqlite) {
      tabSqlite.style.color = "var(--muted)";
      tabSqlite.style.borderBottomColor = "transparent";
    }
    if (panelExcel) panelExcel.style.display = "block";
    if (panelSqlite) panelSqlite.style.display = "none";
  } else {
    tabSqlite?.classList.add("is-active");
    if (tabSqlite) {
      tabSqlite.style.color = "var(--accent)";
      tabSqlite.style.borderBottomColor = "var(--accent)";
    }
    tabExcel?.classList.remove("is-active");
    if (tabExcel) {
      tabExcel.style.color = "var(--muted)";
      tabExcel.style.borderBottomColor = "transparent";
    }
    if (panelExcel) panelExcel.style.display = "none";
    if (panelSqlite) panelSqlite.style.display = "block";
  }
  
  if (els.skillImportPreviewArea) els.skillImportPreviewArea.style.display = "none";
  if (els.skillImportStats) els.skillImportStats.textContent = "";
  if (els.skillImportPreviewTable) els.skillImportPreviewTable.innerHTML = "";
  if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = true;
  parsedImportRecords = [];
  parsedImportSqliteData = null;
  
  updateImportNextBtnState();
}

async function loadSqliteProfiles() {
  const select = document.getElementById("skillImportSqliteSelect");
  if (!select) return;
  select.innerHTML = '<option value="">Yükleniyor...</option>';
  try {
    const response = await fetch("/api/list-sqlite-profiles");
    if (!response.ok) throw new Error("Profil listesi alınamadı");
    const result = await response.json();
    if (!result.Profiles || result.Profiles.length === 0) {
      select.innerHTML = '<option value="">Hiçbir profil bulunamadı</option>';
      updateImportNextBtnState();
      return;
    }
    select.innerHTML = result.Profiles.map(p => `
      <option value="${escapeHtml(p.DbFile)}">${escapeHtml(p.Name)} (${escapeHtml(p.InstitutionType)})</option>
    `).join("");
    
    if (result.SelectedProfile) {
      const found = result.Profiles.find(p => p.Name === result.SelectedProfile || p.DbFile === result.SelectedProfile);
      if (found) {
        select.value = found.DbFile;
      }
    }
  } catch (error) {
    select.innerHTML = `<option value="">Hata: ${escapeHtml(error.message)}</option>`;
  }
  updateImportNextBtnState();
}

async function analyzeSqliteProfile() {
  const select = document.getElementById("skillImportSqliteSelect");
  const prevBtn = document.getElementById("skillImportPrevBtn");
  
  if (!select || !select.value) {
    showToast("Lütfen bir profil seçin", "error");
    if (prevBtn) prevBtn.disabled = false;
    return;
  }
  const dbFile = select.value;
  
  if (els.skillImportPreviewArea) els.skillImportPreviewArea.style.display = "flex";
  if (els.skillImportPreviewTable) {
    els.skillImportPreviewTable.innerHTML = `
      <tr>
        <td colspan="7" style="padding: 0; border: none; display: table-cell;">
          <div class="skill-import-loading">
            <div class="skill-import-loading-spinner"></div>
            <span>SQLite veritabanı çözümleniyor, lütfen bekleyin...</span>
          </div>
        </td>
      </tr>
    `;
  }
  if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = true;
  if (els.skillImportStats) els.skillImportStats.textContent = "";
  parsedImportSqliteData = null;
  
  try {
    const response = await fetch("/api/import-sqlite-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dbFile })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Sunucu hatası");
    }
    
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    
    parsedImportSqliteData = result;
    const studentCount = result.students?.length || 0;
    const businessCount = result.businesses?.length || 0;
    const teacherCount = result.teacherPool?.length || 0;
    const holidayCount = result.holidays?.length || 0;
    const absenceCount = Object.keys(result.absenceRecords || {}).length;
    
    if (els.skillImportStats) {
      els.skillImportStats.innerHTML = `
        <div class="skill-import-success-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15); padding: 6px 12px; border-radius: 6px; color: #10b981; font-weight: bold; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>✓</span> SQLite Çözümleme Başarılı!
          </div>
          <div style="font-size: 0.78rem; font-weight: normal; color: var(--muted);">
            Okul: <strong style="color: var(--ink);">${escapeHtml(result.school?.name || "Belirtilmedi")}</strong>
          </div>
        </div>
        <div class="skill-import-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 15px;">
          <div class="skill-import-stat-card" style="padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 0.72rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Öğrenci</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent); margin-top: 4px;">${studentCount}</div>
          </div>
          <div class="skill-import-stat-card" style="padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 0.72rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">İşletme</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent); margin-top: 4px;">${businessCount}</div>
          </div>
          <div class="skill-import-stat-card" style="padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 0.72rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Öğretmen</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent); margin-top: 4px;">${teacherCount}</div>
          </div>
          <div class="skill-import-stat-card" style="padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 0.72rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Resmi Tatil</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent); margin-top: 4px;">${holidayCount}</div>
          </div>
          <div class="skill-import-stat-card" style="padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 0.72rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Devamsızlık</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent); margin-top: 4px;">${absenceCount}</div>
          </div>
        </div>
      `;
    }
    
    if (els.skillImportPreviewTable) {
      if (studentCount === 0) {
        els.skillImportPreviewTable.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 20px; color: var(--muted);">
              Profilde öğrenci kaydı bulunamadı.
            </td>
          </tr>
        `;
      } else {
        const coordMap = {};
        (result.coordinators || []).forEach(c => {
          coordMap[c.businessId] = c.teacher;
        });
        
        els.skillImportPreviewTable.innerHTML = result.students.map(s => {
          const biz = (result.businesses || []).find(b => b.id === s.businessId);
          const teacherName = coordMap[s.businessId] || "Atanmadı";
          return `
            <tr>
              <td>${escapeHtml(s.no || "-")}</td>
              <td><strong>${escapeHtml(s.name || "-")}</strong></td>
              <td>${escapeHtml(s.className || "-")}</td>
              <td>${escapeHtml(s.field || "-")}</td>
              <td>${escapeHtml(biz?.name || "-")}</td>
              <td>${escapeHtml(teacherName)}</td>
            </tr>
          `;
        }).join("");
      }
    }
    
    if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = false;
    
  } catch (error) {
    showToast(`Çözümleme hatası: ${error.message}`, "error");
    if (els.skillImportPreviewTable) {
      els.skillImportPreviewTable.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 20px; color: var(--danger);">
            Hata: ${escapeHtml(error.message)}
          </td>
        </tr>
      `;
    }
  } finally {
    if (prevBtn) prevBtn.disabled = false;
  }
}

function dayToNumber(day) {
  if (day === null || day === undefined || day === "") return "";
  const d = String(day).trim();
  if (["1", "2", "3", "4", "5"].includes(d)) return d;
  const map = {
    "pazartesi": "1", "pzt": "1",
    "salı": "2", "sali": "2", "sal": "2",
    "çarşamba": "3", "carsamba": "3", "çar": "3", "car": "3",
    "perşembe": "4", "persembe": "4", "per": "4",
    "cuma": "5", "cum": "5"
  };
  return map[turkishClean(d)] || "";
}

function dayToName(day) {
  if (day === null || day === undefined || day === "") return "";
  const d = String(day).trim();
  const map = {
    "1": "Pazartesi",
    "2": "Salı",
    "3": "Çarşamba",
    "4": "Perşembe",
    "5": "Cuma"
  };
  if (map[d]) return map[d];
  const num = dayToNumber(d);
  return map[num] || d;
}

window.getSkillDayName = function(day) {
  if (day === null || day === undefined || day === "") return "Gün yok";
  const str = String(day).trim();
  const map = {
    "1": "Pazartesi",
    "2": "Salı",
    "3": "Çarşamba",
    "4": "Perşembe",
    "5": "Cuma"
  };
  if (map[str]) return map[str];
  const nameMap = {
    "pazartesi": "Pazartesi", "pzt": "Pazartesi",
    "salı": "Salı", "sali": "Salı", "sal": "Salı",
    "çarşamba": "Çarşamba", "carsamba": "Çarşamba", "çar": "Çarşamba", "car": "Çarşamba",
    "perşembe": "Perşembe", "persembe": "Perşembe", "per": "Perşembe",
    "cuma": "Cuma", "cum": "Cuma"
  };
  const lower = str.toLowerCase();
  if (nameMap[lower]) return nameMap[lower];
  return str || "Gün yok";
};

function populateImportDatalists() {
  const teacherDatalist = document.getElementById("importTeacherList");
  if (teacherDatalist) {
    const teacherNames = new Set();
    (skillState.teacherPool || []).forEach(t => {
      if (t.name) teacherNames.add(t.name.trim().toUpperCase());
    });
    (parsedImportRecords || []).forEach(r => {
      if (r.coordinator_name && r.coordinator_name !== "Atanmadı" && r.coordinator_name !== "-") {
        teacherNames.add(r.coordinator_name.trim().toUpperCase());
      }
    });
    teacherDatalist.innerHTML = Array.from(teacherNames)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map(name => `<option value="${escapeHtml(name)}"></option>`)
      .join("");
  }

  const deputyDatalist = document.getElementById("skillImportDeputyList");
  if (deputyDatalist) {
    const deputyNames = new Set();
    (skillState.schoolRecords || []).forEach(s => {
      if (s.deputy) deputyNames.add(s.deputy.trim());
    });
    (skillState.coordinators || []).forEach(c => {
      if (c.deputy) deputyNames.add(c.deputy.trim());
    });
    deputyDatalist.innerHTML = Array.from(deputyNames)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map(name => `<option value="${escapeHtml(name)}"></option>`)
      .join("");
  }
}

function openSkillImportDialog() {
  const step1 = document.getElementById("skillImportStep1");
  const step2 = document.getElementById("skillImportStep2");
  const tabContainer = document.getElementById("skillImportTabContainer");
  const nextBtn = document.getElementById("skillImportNextBtn");
  
  if (step1) step1.style.display = "block";
  if (step2) step2.style.display = "none";
  if (tabContainer) tabContainer.style.display = "flex";
  if (nextBtn) nextBtn.disabled = true;

  if (els.skillImportFileInput) els.skillImportFileInput.value = "";
  if (els.skillImportPreviewArea) els.skillImportPreviewArea.style.display = "none";
  if (els.skillImportStats) els.skillImportStats.textContent = "";
  if (els.skillImportPreviewTable) els.skillImportPreviewTable.innerHTML = "";
  if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = true;
  parsedImportRecords = [];
  parsedImportSqliteData = null;
  switchImportTab("excel");
  loadSqliteProfiles();

  // Populate school targets
  const schoolSelect = document.getElementById("skillImportSchoolExistingSelect");
  const newInput = document.getElementById("skillImportSchoolNewInput");
  if (newInput) newInput.value = "";

  if (schoolSelect) {
    schoolSelect.innerHTML = skillState.schoolRecords.map(s => 
      `<option value="${s.id}">${escapeHtml(s.name)}</option>`
    ).join("");
    
    if (skillState.schoolRecords.length === 0) {
      const radioNew = document.getElementById("skillImportSchoolTypeNew");
      if (radioNew) radioNew.checked = true;
      const radioExisting = document.getElementById("skillImportSchoolTypeExisting");
      if (radioExisting) radioExisting.disabled = true;
      document.getElementById("skillImportSchoolExistingContainer").style.display = "none";
      document.getElementById("skillImportSchoolNewContainer").style.display = "block";
    } else {
      const radioExisting = document.getElementById("skillImportSchoolTypeExisting");
      if (radioExisting) {
        radioExisting.disabled = false;
        radioExisting.checked = true;
      }
      document.getElementById("skillImportSchoolExistingContainer").style.display = "block";
      document.getElementById("skillImportSchoolNewContainer").style.display = "none";
    }
  }

  // Pre-fill Coordinator Deputy from selected school
  const currentSchoolId = schoolSelect ? schoolSelect.value : "";
  const targetSchool = skillState.schoolRecords.find(s => s.id === currentSchoolId) || skillState.schoolRecords[0] || skillState.school;
  const deputyInput = document.getElementById("skillImportDeputyInput");
  if (deputyInput) {
    deputyInput.value = targetSchool?.deputy || "";
  }
  const allTeacherInput = document.getElementById("skillImportAllTeacherInput");
  if (allTeacherInput) allTeacherInput.value = "";

  populateImportDatalists();
  els.skillImportDialog?.showModal();
}

async function loadAlanDalListesi() {
  if (alanDalListesi) return alanDalListesi;
  try {
    const response = await fetch("scripts/modules/skill-training/alan_dal_listesi.json");
    if (!response.ok) throw new Error("JSON listesi yüklenemedi");
    alanDalListesi = await response.json();
    return alanDalListesi;
  } catch (error) {
    console.error("Alan/Dal listesi yüklenemedi:", error);
    alanDalListesi = { mtal: {}, mesem: {} };
    return alanDalListesi;
  }
}

function turkishClean(val) {
  if (!val) return "";
  let s = String(val).trim().toLowerCase();
  s = s.replace(/\u0307/g, '');
  s = s.replace(/ı/g, 'i')
       .replace(/i̇/g, 'i')
       .replace(/ö/g, 'o')
       .replace(/ü/g, 'u')
       .replace(/ş/g, 's')
       .replace(/ç/g, 'c')
       .replace(/ğ/g, 'g');
  return s;
}

function findClosestMatch(importedField, listType) {
  if (!importedField || importedField === "Belirtilmedi") return "";
  if (!alanDalListesi || !alanDalListesi[listType]) return "";
  
  const cleanedImport = turkishClean(importedField);
  const typeList = alanDalListesi[listType];
  
  for (const alan of Object.keys(typeList)) {
    for (const dal of typeList[alan]) {
      const optionValue = `${alan} / ${dal}`;
      if (turkishClean(optionValue) === cleanedImport) {
        return optionValue;
      }
    }
  }
  
  const importParts = cleanedImport.split("/");
  const importDalClean = (importParts[1] || importParts[0]).trim();
  
  for (const alan of Object.keys(typeList)) {
    for (const dal of typeList[alan]) {
      const dalClean = turkishClean(dal);
      if (dalClean === importDalClean || dalClean.includes(importDalClean) || importDalClean.includes(dalClean)) {
        return `${alan} / ${dal}`;
      }
    }
  }
  
  const importAlanClean = importParts[0].trim();
  for (const alan of Object.keys(typeList)) {
    const alanClean = turkishClean(alan);
    if (alanClean === importAlanClean || alanClean.includes(importAlanClean) || importAlanClean.includes(alanClean)) {
      if (typeList[alan].length > 0) {
        return `${alan} / ${typeList[alan][0]}`;
      }
    }
  }
  
  return "";
}

function updateBulkActionsBar() {
  const bulkBar = document.getElementById("skillImportBulkActions");
  const selectedCountSpan = document.getElementById("skillImportSelectedCount");
  const selectAllCheckbox = document.getElementById("skillImportSelectAll");
  
  if (!bulkBar) return;
  
  const checkedCount = parsedImportRecords.filter(r => r.selected).length;
  const hasRecords = parsedImportRecords.length > 0;
  
  if (hasRecords && checkedCount > 0) {
    bulkBar.style.display = "flex";
    const bulkText = document.getElementById("skillImportBulkText");
    if (bulkText) {
      bulkText.textContent = "seçildi:";
      if (selectedCountSpan) {
        selectedCountSpan.textContent = checkedCount;
        selectedCountSpan.style.display = "inline-flex";
      }
    }
    
    const elementsToEnable = [
      document.getElementById("skillImportBulkFieldInput"),
      document.getElementById("skillImportBulkTeacherInput"),
      document.getElementById("skillImportBulkDaySelect"),
      document.getElementById("skillImportBulkApplyBtn"),
      document.getElementById("skillImportBulkDayBtn"),
      document.getElementById("skillImportBulkClearBtn")
    ];
    
    elementsToEnable.forEach(el => {
      if (el) {
        el.disabled = false;
        el.style.opacity = "1";
        el.style.cursor = "";
      }
    });
  } else {
    bulkBar.style.display = "none";
  }
  
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = checkedCount === parsedImportRecords.length && parsedImportRecords.length > 0;
  }
}

function renderImportPreviewTable() {
  const tableBody = document.getElementById("skillImportPreviewTable");
  if (!tableBody) return;
  
  const sort = window.skillTableSort?.importPreview;
  if (sort && sort.key) {
    parsedImportRecords.sort((a, b) => {
      let vA, vB;
      if (sort.key === "coord_day") {
        vA = dayToName(a.coord_day) || "";
        vB = dayToName(b.coord_day) || "";
      } else {
        vA = a[sort.key];
        vB = b[sort.key];
      }
      return (window.compareSkillValues || ((x, y, d) => String(x||'').localeCompare(String(y||''), 'tr-TR', {numeric:true}) * (d === 'asc' ? 1 : -1)))(vA, vB, sort.dir);
    });
  }
  if (typeof window.updateSkillTableHeadIcons === "function") {
    window.updateSkillTableHeadIcons("importPreview");
  }
  
  const schoolTypeSelect = document.getElementById("skillImportSchoolType");
  const schoolType = schoolTypeSelect ? schoolTypeSelect.value : "mesem";
  
  const typeList = alanDalListesi ? (alanDalListesi[schoolType] || {}) : {};
  
  const datalist = document.getElementById("importAlanDalList");
  if (datalist) {
    let datalistHtml = "";
    for (const alan of Object.keys(typeList)) {
      for (const dal of typeList[alan]) {
        datalistHtml += `<option value="${escapeHtml(alan)} / ${escapeHtml(dal)}"></option>`;
      }
    }
    datalist.innerHTML = datalistHtml;
  }
  populateImportDatalists();
  
  let html = "";
  parsedImportRecords.forEach((r, idx) => {
    if (!r.originalField) {
      r.originalField = r.field;
    }
    if (!r.field || r.field === "Belirtilmedi") {
      const matchedField = findClosestMatch(r.originalField, schoolType);
      if (matchedField) r.field = matchedField;
    }
    
    let fieldInputHtml = `
      <input class="import-field-input" type="text" list="importAlanDalList" data-index="${idx}" value="${escapeHtml(r.field || '')}" placeholder="Alan/Dal ara..." style="padding: 2px 6px !important; border-radius: 4px !important; border: 1px solid var(--line) !important; background: var(--surface) !important; color: var(--ink) !important; width: 100% !important; font-size: 0.78rem !important; height: 24px !important; outline: none !important; box-sizing: border-box !important; margin: 0 !important;" />
    `;
    
    let teacherInputHtml = `
      <input class="import-teacher-input" type="text" list="importTeacherList" data-index="${idx}" value="${escapeHtml(r.coordinator_name || '')}" placeholder="Öğretmen ata..." style="padding: 2px 6px !important; border-radius: 4px !important; border: 1px solid var(--line) !important; background: var(--surface) !important; color: var(--ink) !important; width: 100% !important; font-size: 0.76rem !important; height: 24px !important; outline: none !important; font-weight: 600 !important; box-sizing: border-box !important; margin: 0 !important;" />
    `;

    const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
    let daySelectHtml = `<select class="import-coord-day-select" data-index="${idx}" style="padding: 2px 4px !important; font-size: 0.75rem !important; border-radius: 4px !important; border: 1px solid var(--line) !important; background: var(--surface) !important; color: var(--ink) !important; margin: 0 !important; height: 24px !important; outline: none !important; cursor: pointer !important; width: 100% !important; box-sizing: border-box !important;">`;
    daySelectHtml += `<option value="">Gün Seçin</option>`;
    for (const d of days) {
      const isSelected = dayToName(r.coord_day) === d;
      daySelectHtml += `<option value="${d}" ${isSelected ? "selected" : ""}>${d}</option>`;
    }
    daySelectHtml += `</select>`;

    let stuDaysInputHtml = `
      <input class="import-days-input" type="text" data-index="${idx}" value="${escapeHtml(r.days || '')}" placeholder="-" title="Öğrencinin Okul / Teorik Eğitim Günleri" style="padding: 2px 6px !important; border-radius: 4px !important; border: 1px solid var(--line) !important; background: var(--surface) !important; color: var(--ink) !important; width: 100% !important; font-size: 0.75rem !important; height: 24px !important; outline: none !important; box-sizing: border-box !important; margin: 0 !important;" />
    `;

    const statusBadge = r.isExistingStudent
      ? `<span style="display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: bold; background: rgba(16,185,129,0.15); color: #059669; white-space: nowrap;" title="Sistemdeki mevcut öğrenci verileri getirildi">✓ Kayıtlı</span>`
      : `<span style="display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: bold; background: rgba(59,130,246,0.15); color: #2563eb; white-space: nowrap;" title="Sisteme yeni eklenecek">Yeni</span>`;
    
    const isChecked = r.selected ? "checked" : "";
    
    html += `
      <tr style="height: 32px !important;">
        <td style="text-align: center !important; padding: 2px 4px !important; vertical-align: middle !important;">
          <input type="checkbox" class="import-row-checkbox" data-index="${idx}" ${isChecked} style="cursor: pointer; width: 15px; height: 15px; margin: 0; vertical-align: middle;" />
        </td>
        <td style="text-align: center !important; padding: 2px 4px !important; vertical-align: middle !important;">${statusBadge}</td>
        <td style="padding: 2px 6px !important; vertical-align: middle !important;">${escapeHtml(r.student_no || "-")}</td>
        <td style="padding: 2px 6px !important; vertical-align: middle !important;"><strong>${escapeHtml(r.student_name || "-")}</strong></td>
        <td style="padding: 2px 6px !important; vertical-align: middle !important;">${escapeHtml(r.class_name || "-")}</td>
        <td style="padding: 2px 6px !important; vertical-align: middle !important;">${fieldInputHtml}</td>
        <td style="padding: 2px 6px !important; vertical-align: middle !important; font-size: 0.78rem !important; max-width: 200px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;" title="${escapeHtml(r.business_name || "")}">
          <strong>${escapeHtml(r.business_name || "-")}</strong>
        </td>
        <td style="padding: 2px 6px !important; vertical-align: middle !important;">${teacherInputHtml}</td>
        <td style="padding: 2px 4px !important; vertical-align: middle !important;">${daySelectHtml}</td>
        <td style="padding: 2px 4px !important; vertical-align: middle !important;">${stuDaysInputHtml}</td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = html;
  
  const selectAllCheckbox = document.getElementById("skillImportSelectAll");
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
  updateBulkActionsBar();
}
window.renderImportPreviewTable = renderImportPreviewTable;

async function analyzeImeImportFile(file) {
  if (!file) return;
  const prevBtn = document.getElementById("skillImportPrevBtn");
  
  if (els.skillImportPreviewArea) els.skillImportPreviewArea.style.display = "flex";
  if (els.skillImportPreviewTable) {
    els.skillImportPreviewTable.innerHTML = `
      <tr>
        <td colspan="10" style="padding: 0; border: none; display: table-cell;">
          <div class="skill-import-loading">
            <div class="skill-import-loading-spinner"></div>
            <span>Dosya analiz ediliyor ve mevcut sistem kayıtları taranıyor, lütfen bekleyin...</span>
          </div>
        </td>
      </tr>
    `;
  }
  if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = true;
  if (els.skillImportStats) els.skillImportStats.textContent = "";
  
  try {
    await loadAlanDalListesi();

    const formData = new FormData();
    formData.append("file", file);
    
    const knownTeachers = skillState.teacherPool.map(t => t.name);
    formData.append("knownTeachers", JSON.stringify(knownTeachers));
    
    const response = await fetch("/api/import-ime-data", {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Sunucu hatası");
    }
    
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    
    parsedImportRecords = result.records || [];
    
    if (parsedImportRecords.length === 0) {
      if (els.skillImportPreviewTable) {
        els.skillImportPreviewTable.innerHTML = `
          <tr>
            <td colspan="10" style="text-align: center; padding: 20px; color: var(--danger);">
              Seçilen dosyada geçerli öğrenci veya işletme verisi bulunamadı.
            </td>
          </tr>
        `;
      }
      if (els.skillImportStats) els.skillImportStats.textContent = "Sonuç: 0 kayıt bulundu.";
      return;
    }

    const currentSchoolId = (importSchoolType === "existing" ? importSchoolExistingId : "") || (skillState.schoolRecords[0] ? skillState.schoolRecords[0].id : "");
    const targetSchool = skillState.schoolRecords.find(s => s.id === currentSchoolId) || skillState.schoolRecords[0] || skillState.school;
    
    const fileDeputy = parsedImportRecords.find(r => r.deputy)?.deputy || "";
    const fileTeacher = parsedImportRecords.find(r => r.coordinator_name)?.coordinator_name || "";
    
    const defaultDeputy = fileDeputy || document.getElementById("skillImportDeputyInput")?.value?.trim() || targetSchool?.deputy || "";
    const deputyInput = document.getElementById("skillImportDeputyInput");
    if (deputyInput && defaultDeputy) {
      deputyInput.value = defaultDeputy;
    }

    if (fileTeacher) {
      const allTeacherInput = document.getElementById("skillImportAllTeacherInput");
      if (allTeacherInput) allTeacherInput.value = fileTeacher;
    }

    let existingStudentMatches = 0;
    let existingBusinessMatches = 0;

    // Scan existing state and match records
    parsedImportRecords.forEach(r => {
      const stuNo = (r.student_no || "").trim();
      const stuName = (r.student_name || "").trim().toLowerCase();
      
      let existingStu = null;
      if (stuNo) {
        existingStu = skillState.students.find(s => String(s.no || "").trim() === stuNo);
      }
      if (!existingStu && stuName) {
        existingStu = skillState.students.find(s => (s.name || "").trim().toLowerCase() === stuName);
      }
      
      if (existingStu) {
        r.isExistingStudent = true;
        r.existingStudentId = existingStu.id;
        existingStudentMatches++;
        
        // Read existing student data
        if (!r.field || r.field === "Belirtilmedi") {
          r.field = existingStu.field || "";
        }
        // PRESERVE existing student days!
        r.days = existingStu.days || r.days || "";
        if (!r.class_name && existingStu.className) {
          r.class_name = existingStu.className;
        }
      } else {
        r.isExistingStudent = false;
        r.days = r.days || "";
      }

      // Check existing business (match by normalized name OR phone number, ignoring address differences)
      if (typeof window.deduplicateSkillBusinesses === "function") {
        window.deduplicateSkillBusinesses(skillState);
      }
      const bizName = (r.business_name || "").trim();
      const bizPhone = (r.business_phone || "").trim();
      if (r.business_address && typeof window.cleanSkillBusinessAddress === "function") {
        r.business_address = window.cleanSkillBusinessAddress(r.business_address);
      }
      let existingBiz = null;
      if (bizName || bizPhone) {
        existingBiz = typeof window.findMatchingSkillBusiness === "function"
          ? window.findMatchingSkillBusiness(skillState.businesses, bizName, bizPhone)
          : skillState.businesses.find(b => (b.name || "").trim().toLowerCase() === bizName.toLowerCase());
      }
      if (!existingBiz && existingStu?.businessId) {
        existingBiz = skillState.businesses.find(b => b.id === existingStu.businessId);
        if (existingBiz && !bizName) {
          r.business_name = existingBiz.name;
        }
      }

      if (existingBiz) {
        r.isExistingBusiness = true;
        r.existingBusinessId = existingBiz.id;
        r.business_name = existingBiz.name || r.business_name;
        r.business_phone = existingBiz.phone || r.business_phone;
        existingBusinessMatches++;

        // Coordinator for this business
        const existingCoord = skillState.coordinators.find(c => c.businessId === existingBiz.id);
        if (existingCoord) {
          if (!r.coordinator_name || r.coordinator_name === "Atanmadı" || r.coordinator_name === "-") {
            r.coordinator_name = existingCoord.teacher || "";
          }
          if (!r.coord_day && existingCoord.day) {
            r.coord_day = dayToName(existingCoord.day);
          }
          if (!r.deputy && existingCoord.deputy) {
            r.deputy = existingCoord.deputy;
          }
        }
      } else {
        r.isExistingBusiness = false;
      }

      if (!r.deputy) {
        r.deputy = defaultDeputy;
      }
    });

    const uniqueStudents = new Set(parsedImportRecords.map(r => r.student_name).filter(Boolean));
    const uniqueBusinesses = new Set(parsedImportRecords.map(r => r.business_name).filter(Boolean));
    const uniqueTeachers = new Set(parsedImportRecords.map(r => r.coordinator_name).filter(Boolean));
    
    if (els.skillImportStats) {
      els.skillImportStats.innerHTML = `
        <span>Toplam: <strong style="color:var(--accent);">${parsedImportRecords.length}</strong></span>
        <span style="color: var(--line);">|</span>
        <span>Kayıtlı: <strong style="color:#10b981;">${existingStudentMatches}</strong></span>
        <span style="color: var(--line);">|</span>
        <span>Yeni: <strong style="color:#3b82f6;">${parsedImportRecords.length - existingStudentMatches}</strong></span>
        <span style="color: var(--line);">|</span>
        <span>İşletme: <strong style="color:var(--accent);">${uniqueBusinesses.size}</strong></span>
        <span style="color: var(--line);">|</span>
        <span>Öğretmen: <strong style="color:var(--accent);">${uniqueTeachers.size}</strong></span>
      `;
    }
    
    renderImportPreviewTable();
    if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = false;
    
  } catch (error) {
    showToast(`Analiz hatası: ${error.message}`, "error");
    if (els.skillImportPreviewTable) {
      els.skillImportPreviewTable.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 20px; color: var(--danger);">
            Hata: ${escapeHtml(error.message)}
          </td>
        </tr>
      `;
    }
  } finally {
    if (prevBtn) prevBtn.disabled = false;
  }
}

function saveImeImportedData(event) {
  event.preventDefault();
  
  if (activeImportTab === "sqlite") {
    if (!parsedImportSqliteData) return;
    
    skillState.school = parsedImportSqliteData.school || skillState.school;
    skillState.schoolRecords = parsedImportSqliteData.schoolRecords || [];
    skillState.teacherPool = parsedImportSqliteData.teacherPool || [];
    skillState.fields = parsedImportSqliteData.fields || [];
    skillState.businesses = parsedImportSqliteData.businesses || [];
    skillState.students = parsedImportSqliteData.students || [];
    skillState.coordinators = parsedImportSqliteData.coordinators || [];
    skillState.holidays = parsedImportSqliteData.holidays || [];
    skillState.absenceRecords = parsedImportSqliteData.absenceRecords || {};
    if (typeof window.deduplicateSkillBusinesses === "function") {
      window.deduplicateSkillBusinesses(skillState);
    }
    
    saveSkillState();
    saveState({ sync: true });
    renderSkillModule();
    
    showToast("Masaüstü SQLite veritabanı başarıyla içe aktarıldı.", "success");
    els.skillImportDialog?.close();
    return;
  }

  if (parsedImportRecords.length === 0) return;
  
  let activeSchoolId = "";
  if (importSchoolType === "new") {
    activeSchoolId = uid("school");
    const schoolTypeSelect = document.getElementById("skillImportSchoolType");
    const isLise = schoolTypeSelect ? schoolTypeSelect.value === "mtal" : false;
    const newSchool = {
      id: activeSchoolId,
      name: importSchoolNewName,
      type: isLise ? "MTAL" : "MESEM",
      principal: "",
      deputy: document.getElementById("skillImportDeputyInput")?.value?.trim() || ""
    };
    skillState.schoolRecords.push(newSchool);
    if (!skillState.school || !skillState.school.id) {
      skillState.school = newSchool;
    }
  } else {
    activeSchoolId = importSchoolExistingId || (skillState.schoolRecords[0] ? skillState.schoolRecords[0].id : "");
    if (!activeSchoolId) {
      activeSchoolId = uid("school");
      const newSchool = {
        id: activeSchoolId,
        name: "Yeni Okul",
        type: "MESEM",
        principal: "",
        deputy: document.getElementById("skillImportDeputyInput")?.value?.trim() || ""
      };
      skillState.schoolRecords.push(newSchool);
      skillState.school = newSchool;
    }
  }

  const deputyInput = document.getElementById("skillImportDeputyInput");
  const currentDeputy = (deputyInput ? deputyInput.value.trim() : "") || (skillState.schoolRecords.find(s => s.id === activeSchoolId)?.deputy) || "";
  
  const currentSchool = skillState.schoolRecords.find(s => s.id === activeSchoolId);
  if (currentSchool && currentDeputy) {
    currentSchool.deputy = currentDeputy;
  }
  if (skillState.school && currentDeputy) {
    skillState.school.deputy = currentDeputy;
  }

  let addedStudentCount = 0;
  let updatedStudentCount = 0;
  let addedBizCount = 0;
  let addedCoordCount = 0;
  let updatedCoordCount = 0;
  
  parsedImportRecords.forEach(rec => {
    // 1. Business (match by normalized name OR phone number; never duplicate due to address differences)
    let bizName = (rec.business_name || "Belirtilmedi").trim();
    let bizPhone = (rec.business_phone || "").trim();
    let bizAddr = typeof window.cleanSkillBusinessAddress === "function"
      ? window.cleanSkillBusinessAddress(rec.business_address || "")
      : (rec.business_address || "").trim();

    let biz = (rec.existingBusinessId && skillState.businesses.find(b => b.id === rec.existingBusinessId))
      || (typeof window.findMatchingSkillBusiness === "function"
        ? window.findMatchingSkillBusiness(skillState.businesses, bizName, bizPhone)
        : skillState.businesses.find(b => b.name.toLowerCase() === bizName.toLowerCase()));

    if (!biz) {
      biz = {
        id: uid("biz"),
        name: bizName,
        phone: bizPhone,
        address: bizAddr,
        group: "1"
      };
      skillState.businesses.push(biz);
      addedBizCount++;
    } else {
      biz.phone = biz.phone || bizPhone || "";
      biz.address = typeof window.chooseBetterSkillAddress === "function"
        ? window.chooseBetterSkillAddress(biz.address, bizAddr)
        : (biz.address || bizAddr || "");
    }
    
    // 2. Teacher in Pool
    let teacherName = (rec.coordinator_name || "").trim().toUpperCase();
    if (teacherName && teacherName !== "ATANMADI" && teacherName !== "-") {
      let teacher = skillState.teacherPool.find(t => t.name.toLowerCase() === teacherName.toLowerCase());
      if (!teacher) {
        teacher = {
          id: uid("teacher"),
          name: teacherName
        };
        skillState.teacherPool.push(teacher);
      }
    }
    
    // 3. Field / Dal
    let fieldVal = (rec.field || "Belirtilmedi").trim();
    if (fieldVal && fieldVal !== "Belirtilmedi") {
      const parts = fieldVal.split("/");
      const area = parts[0]?.trim() || "Belirtilmedi";
      const branch = parts[1]?.trim() || "";
      
      if (!skillState.fields) skillState.fields = [];
      const fieldExists = skillState.fields.some(f => 
        f.area.toLowerCase() === area.toLowerCase() && 
        (branch ? f.branch.toLowerCase() === branch.toLowerCase() : true)
      );
      if (!fieldExists) {
        skillState.fields.push({
          id: uid("field"),
          area: area,
          branch: branch
        });
      }
    }

    // 4. Student (PRESERVE DAYS AND DATA)
    let stuNo = (rec.student_no || "").trim();
    let stuName = (rec.student_name || "").trim();
    let student = skillState.students.find(s => 
      (stuNo && String(s.no || "").trim() === stuNo) || 
      (stuName && s.name.toLowerCase() === stuName.toLowerCase())
    );
    
    if (!student) {
      student = {
        id: uid("stu"),
        no: stuNo,
        name: stuName,
        className: rec.class_name || "12/A",
        field: fieldVal,
        businessId: biz.id,
        days: rec.days || "",
        active: true
      };
      skillState.students.push(student);
      addedStudentCount++;
    } else {
      student.no = stuNo || student.no;
      student.name = stuName || student.name;
      student.className = rec.class_name || student.className;
      student.field = fieldVal || student.field;
      student.businessId = biz.id;
      // Preserve existing days: update from import preview value if defined
      if (rec.days !== undefined) {
        student.days = rec.days;
      }
      updatedStudentCount++;
    }
    
    // 5. Coordinator - Business - Teacher - Day - Deputy Match
    if (teacherName && teacherName !== "ATANMADI" && teacherName !== "-") {
      let coord = skillState.coordinators.find(c => c.businessId === biz.id);
      const dayNum = dayToNumber(rec.coord_day);
      const coordDeputy = rec.deputy || currentDeputy || "";

      if (!coord) {
        coord = {
          id: uid("coord"),
          schoolId: activeSchoolId,
          teacher: teacherName,
          businessId: biz.id,
          deputy: coordDeputy,
          day: dayNum || ""
        };
        skillState.coordinators.push(coord);
        addedCoordCount++;
      } else {
        coord.teacher = teacherName;
        coord.schoolId = activeSchoolId;
        if (dayNum) coord.day = dayNum;
        if (coordDeputy) coord.deputy = coordDeputy;
        updatedCoordCount++;
      }
    }
  });
  
  if (typeof window.deduplicateSkillBusinesses === "function") {
    window.deduplicateSkillBusinesses(skillState);
  }
  saveSkillState();
  saveState({ sync: true });
  renderSkillModule();
  
  showToast(`${addedStudentCount} yeni öğrenci eklendi, ${updatedStudentCount} öğrenci ve koordinatör eşleştirmeleri güncellendi.`, "success");
  els.skillImportDialog?.close();
}

if (els.skillImportDataBtn) els.skillImportDataBtn.addEventListener("click", openSkillImportDialog);
if (els.skillImportCloseBtn) els.skillImportCloseBtn.addEventListener("click", () => els.skillImportDialog?.close());
if (els.skillImportCancelBtn) els.skillImportCancelBtn.addEventListener("click", () => els.skillImportDialog?.close());
if (els.skillImportFileInput) els.skillImportFileInput.addEventListener("change", updateImportNextBtnState);
if (els.skillImportForm) els.skillImportForm.addEventListener("submit", saveImeImportedData);

document.getElementById("skillImportTabExcel")?.addEventListener("click", () => switchImportTab("excel"));
document.getElementById("skillImportTabSqlite")?.addEventListener("click", () => switchImportTab("sqlite"));
document.getElementById("skillImportSqliteSelect")?.addEventListener("change", updateImportNextBtnState);
document.getElementById("skillImportNextBtn")?.addEventListener("click", handleImportNextStep);
document.getElementById("skillImportPrevBtn")?.addEventListener("click", handleImportPrevStep);

document.addEventListener("change", (e) => {
  if (e.target && e.target.name === "skillImportSchoolType") {
    const isNew = e.target.value === "new";
    const existingContainer = document.getElementById("skillImportSchoolExistingContainer");
    const newContainer = document.getElementById("skillImportSchoolNewContainer");
    if (existingContainer) existingContainer.style.display = isNew ? "none" : "block";
    if (newContainer) newContainer.style.display = isNew ? "block" : "none";
  }
});

document.getElementById("skillImportSchoolExistingSelect")?.addEventListener("change", (e) => {
  const schoolId = e.target.value;
  const selSchool = skillState.schoolRecords.find(s => s.id === schoolId);
  const deputyInput = document.getElementById("skillImportDeputyInput");
  if (deputyInput && selSchool && selSchool.deputy) {
    deputyInput.value = selSchool.deputy;
  }
});

document.getElementById("skillImportSchoolType")?.addEventListener("change", () => {
  renderImportPreviewTable();
});

document.getElementById("skillImportSelectAll")?.addEventListener("change", (e) => {
  const isChecked = e.target.checked;
  parsedImportRecords.forEach(r => r.selected = isChecked);
  
  document.querySelectorAll(".import-row-checkbox").forEach(cb => {
    cb.checked = isChecked;
  });
  
  updateBulkActionsBar();
});

// Single-button Coordinator Deputy assignment to everyone
document.getElementById("skillImportApplyDeputyAllBtn")?.addEventListener("click", () => {
  const depVal = document.getElementById("skillImportDeputyInput")?.value?.trim();
  if (!depVal) {
    showToast("Lütfen atanacak müdür yardımcısı adını girin.", "warning");
    return;
  }
  parsedImportRecords.forEach(r => r.deputy = depVal);
  showToast(`Tüm kayıtlara "${depVal}" koordinatör müdür yardımcısı olarak atandı.`, "success");
});

// Single-button Coordinator Teacher assignment to all businesses
document.getElementById("skillImportApplyTeacherAllBtn")?.addEventListener("click", () => {
  const teacherVal = document.getElementById("skillImportAllTeacherInput")?.value?.trim().toUpperCase();
  if (!teacherVal) {
    showToast("Lütfen atanacak koordinatör öğretmeni seçin veya yazın.", "warning");
    return;
  }
  parsedImportRecords.forEach(r => r.coordinator_name = teacherVal);
  document.querySelectorAll(".import-teacher-input").forEach(inp => inp.value = teacherVal);
  showToast(`Tüm işletmelere "${teacherVal}" koordinatör öğretmen olarak atandı.`, "success");
});

// Bulk apply to selected records
document.getElementById("skillImportBulkApplyBtn")?.addEventListener("click", () => {
  const bulkFieldInput = document.getElementById("skillImportBulkFieldInput");
  const bulkTeacherInput = document.getElementById("skillImportBulkTeacherInput");
  const bulkDaySelect = document.getElementById("skillImportBulkDaySelect");
  
  const bulkField = bulkFieldInput ? bulkFieldInput.value.trim() : "";
  const bulkTeacher = bulkTeacherInput ? bulkTeacherInput.value.trim().toUpperCase() : "";
  const bulkDay = bulkDaySelect ? bulkDaySelect.value : "";
  
  if (!bulkField && !bulkTeacher && !bulkDay) {
    showToast("Lütfen uygulanacak en az bir alan/dal, öğretmen veya ziyaret günü belirleyin.", "warning");
    return;
  }
  
  let appliedCount = 0;
  parsedImportRecords.forEach((r, idx) => {
    if (r.selected) {
      appliedCount++;
      if (bulkField) {
        r.field = bulkField;
        const fieldEl = document.querySelector(`.import-field-input[data-index="${idx}"]`);
        if (fieldEl) fieldEl.value = bulkField;
      }
      if (bulkTeacher) {
        r.coordinator_name = bulkTeacher;
        parsedImportRecords.forEach((rec, rIdx) => {
          if (rec.business_name === r.business_name) {
            rec.coordinator_name = bulkTeacher;
            const tEl = document.querySelector(`.import-teacher-input[data-index="${rIdx}"]`);
            if (tEl) tEl.value = bulkTeacher;
          }
        });
      }
      if (bulkDay) {
        r.coord_day = bulkDay;
        parsedImportRecords.forEach((rec, rIdx) => {
          if (rec.business_name === r.business_name) {
            rec.coord_day = bulkDay;
            const dEl = document.querySelector(`.import-coord-day-select[data-index="${rIdx}"]`);
            if (dEl) dEl.value = bulkDay;
          }
        });
      }
    }
  });

  showToast(`${appliedCount} seçili kayda ve işletmelerine bilgiler uygulandı.`, "success");
  parsedImportRecords.forEach(r => r.selected = false);
  if (bulkFieldInput) bulkFieldInput.value = "";
  if (bulkTeacherInput) bulkTeacherInput.value = "";
  if (bulkDaySelect) bulkDaySelect.value = "";
  document.querySelectorAll(".import-row-checkbox").forEach(cb => cb.checked = false);
  const selectAllCheckbox = document.getElementById("skillImportSelectAll");
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
  updateBulkActionsBar();
});

// Single-button Day assignment to selected businesses
document.getElementById("skillImportBulkDayBtn")?.addEventListener("click", () => {
  const bulkDaySelect = document.getElementById("skillImportBulkDaySelect");
  const bulkDay = bulkDaySelect ? bulkDaySelect.value : "";
  if (!bulkDay) {
    showToast("Lütfen atanacak ziyaret gününü seçin.", "warning");
    return;
  }
  let appliedCount = 0;
  parsedImportRecords.forEach((r, idx) => {
    if (r.selected) {
      appliedCount++;
      r.coord_day = bulkDay;
      parsedImportRecords.forEach((rec, rIdx) => {
        if (rec.business_name === r.business_name) {
          rec.coord_day = bulkDay;
          const dEl = document.querySelector(`.import-coord-day-select[data-index="${rIdx}"]`);
          if (dEl) dEl.value = bulkDay;
        }
      });
    }
  });
  showToast(`Seçilen işletmelere "${bulkDay}" ziyaret günü atandı.`, "success");
  parsedImportRecords.forEach(r => r.selected = false);
  if (bulkDaySelect) bulkDaySelect.value = "";
  document.querySelectorAll(".import-row-checkbox").forEach(cb => cb.checked = false);
  const selectAllCheckbox = document.getElementById("skillImportSelectAll");
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
  updateBulkActionsBar();
});

document.getElementById("skillImportBulkClearBtn")?.addEventListener("click", () => {
  parsedImportRecords.forEach(r => r.selected = false);
  const bulkFieldInput = document.getElementById("skillImportBulkFieldInput");
  const bulkTeacherInput = document.getElementById("skillImportBulkTeacherInput");
  const bulkDaySelect = document.getElementById("skillImportBulkDaySelect");
  if (bulkFieldInput) bulkFieldInput.value = "";
  if (bulkTeacherInput) bulkTeacherInput.value = "";
  if (bulkDaySelect) bulkDaySelect.value = "";
  document.querySelectorAll(".import-row-checkbox").forEach(cb => cb.checked = false);
  const selectAllCheckbox = document.getElementById("skillImportSelectAll");
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
  updateBulkActionsBar();
});

document.getElementById("skillImportPreviewTable")?.addEventListener("change", (e) => {
  if (e.target.classList.contains("import-row-checkbox")) {
    const idx = parseInt(e.target.dataset.index);
    if (parsedImportRecords[idx]) {
      parsedImportRecords[idx].selected = e.target.checked;
    }
    updateBulkActionsBar();
  }
  
  if (e.target.classList.contains("import-field-input")) {
    const idx = parseInt(e.target.dataset.index);
    if (parsedImportRecords[idx]) {
      parsedImportRecords[idx].field = e.target.value;
    }
  }

  if (e.target.classList.contains("import-days-input")) {
    const idx = parseInt(e.target.dataset.index);
    if (parsedImportRecords[idx]) {
      parsedImportRecords[idx].days = e.target.value;
    }
  }
  
  if (e.target.classList.contains("import-teacher-input")) {
    const idx = parseInt(e.target.dataset.index);
    const selectedTeacher = e.target.value.trim().toUpperCase();
    const currentRec = parsedImportRecords[idx];
    if (currentRec) {
      currentRec.coordinator_name = selectedTeacher;
      parsedImportRecords.forEach((rec, rIdx) => {
        if (rec.business_name === currentRec.business_name) {
          rec.coordinator_name = selectedTeacher;
          const tEl = document.querySelector(`.import-teacher-input[data-index="${rIdx}"]`);
          if (tEl && tEl !== e.target) tEl.value = selectedTeacher;
        }
      });
    }
  }
  
  if (e.target.classList.contains("import-coord-day-select")) {
    const idx = parseInt(e.target.dataset.index);
    const selectedDay = e.target.value;
    const currentRec = parsedImportRecords[idx];
    if (currentRec) {
      currentRec.coord_day = selectedDay;
      parsedImportRecords.forEach((rec, rIdx) => {
        if (rec.business_name === currentRec.business_name) {
          rec.coord_day = selectedDay;
          const selectEl = document.querySelector(`.import-coord-day-select[data-index="${rIdx}"]`);
          if (selectEl && selectEl !== e.target) selectEl.value = selectedDay;
        }
      });
    }
  }
});

document.getElementById("skillImportPreviewTable")?.addEventListener("input", (e) => {
  if (e.target.classList.contains("import-field-input")) {
    const idx = parseInt(e.target.dataset.index);
    if (parsedImportRecords[idx]) parsedImportRecords[idx].field = e.target.value;
  }
  if (e.target.classList.contains("import-days-input")) {
    const idx = parseInt(e.target.dataset.index);
    if (parsedImportRecords[idx]) parsedImportRecords[idx].days = e.target.value;
  }
  if (e.target.classList.contains("import-teacher-input")) {
    const idx = parseInt(e.target.dataset.index);
    const val = e.target.value.trim().toUpperCase();
    if (parsedImportRecords[idx]) {
      parsedImportRecords[idx].coordinator_name = val;
      parsedImportRecords.forEach((rec, rIdx) => {
        if (rec.business_name === parsedImportRecords[idx].business_name) {
          rec.coordinator_name = val;
          const tEl = document.querySelector(`.import-teacher-input[data-index="${rIdx}"]`);
          if (tEl && tEl !== e.target) tEl.value = val;
        }
      });
    }
  }
});

document.getElementById("skillImportPreviewTable")?.addEventListener("focusin", (e) => {
  if (e.target.classList.contains("import-field-input")) {
    e.target.select();
  }
});

document.getElementById("skillImportPreviewTable")?.addEventListener("click", (e) => {
  if (e.target.classList.contains("import-field-input")) {
    e.target.select();
  }
});

document.getElementById("skillImportBulkFieldInput")?.addEventListener("focus", (e) => {
  e.target.select();
});

document.getElementById("skillImportBulkFieldInput")?.addEventListener("click", (e) => {
  e.target.select();
});


if (els.skillImeProfileBtn) els.skillImeProfileBtn.addEventListener("click", openSkillImeProfileDialog);
if (els.skillImeProfileCloseBtn) els.skillImeProfileCloseBtn.addEventListener("click", () => els.skillImeProfileDialog?.close());
if (els.skillImeProfileNewBtn) els.skillImeProfileNewBtn.addEventListener("click", clearSkillImeProfileForm);
if (els.skillImeProfileDeleteBtn) els.skillImeProfileDeleteBtn.addEventListener("click", deleteSkillImeProfile);
if (els.skillImeProfileForm) els.skillImeProfileForm.addEventListener("submit", saveSkillImeProfile);
if (els.skillImeProfileList) {
  els.skillImeProfileList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-skill-ime-profile]");
    if (!button) return;
    switchSkillImeProfile(button.dataset.skillImeProfile);
  });
}
document.addEventListener("mousedown", (event) => {
  if (event.target.closest("#skillGlobalSearchBox")) return;
  closeSkillGlobalSearchResults();
});

els.skillNavButtons.forEach((button) => {
  button.addEventListener("click", () => setSkillView(button.dataset.skillView));
});
if (els.skillNavMobileSelect) {
  els.skillNavMobileSelect.addEventListener("change", (e) => setSkillView(e.target.value));
}
const skillDataMenuToggle = document.querySelector(".skill-nav-parent");
const skillDataSubnav = document.querySelector(".skill-subnav");
if (skillDataMenuToggle && skillDataSubnav) {
  skillDataMenuToggle.setAttribute("aria-expanded", skillDataSubnav.hidden ? "false" : "true");
  skillDataMenuToggle.addEventListener("click", () => {
    const willOpen = skillDataSubnav.hidden;
    skillDataSubnav.hidden = !willOpen;
    skillDataMenuToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
}
els.skillQuickButtons.forEach((button) => {
  button.addEventListener("click", () => setSkillView(button.dataset.skillViewTarget));
});
/* Devamsızlık İşleme Paneli Logic */
let tempAbsenceRecords = {};
let isAbsenceDragging = false;
let absenceSelectedCells = [];

function refreshAbsenceEntryDialogDatesAndGrid() {
  const { startDate, endDate } = getReportDateRange();
  const monthText = new Date(`${startDate}T00:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  
  if (els.skillAbsenceEntryMonthText) els.skillAbsenceEntryMonthText.textContent = monthText;
  if (els.skillAbsenceEntryRangeText) els.skillAbsenceEntryRangeText.textContent = `${formatSkillDate(startDate)} - ${formatSkillDate(endDate)}`;

  renderAbsenceEntryGrid();
}

function openSkillAbsenceEntryDialog() {
  const selectedBusinessIds = getSelectedReportBusinessIds() || [];
  let activeStudents = [];
  if (selectedBusinessIds.length > 0) {
    activeStudents = skillState.students.filter(student => selectedBusinessIds.includes(student.businessId));
  } else {
    activeStudents = skillState.students || [];
  }
  if (!activeStudents.length) {
    showToast("Kayıtlı öğrenci bulunamadı.", "warning");
    return;
  }

  // Load state
  tempAbsenceRecords = structuredClone(skillState.absenceRecords || {});

  // Populate students dropdown selector
  if (els.skillAbsenceEntryStudentSelect) {
    els.skillAbsenceEntryStudentSelect.innerHTML = `<option value="all">Tüm Öğrenciler</option>`;
    activeStudents.forEach(student => {
      const biz = getSkillBusiness(student.businessId);
      const label = `${student.no || "-"} - ${student.name} (${biz?.name || "İşletmesiz"})`;
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = label;
      els.skillAbsenceEntryStudentSelect.appendChild(option);
    });
  }

  if (els.skillAbsenceSearchInput) {
    els.skillAbsenceSearchInput.value = "";
  }

  // Draw the grid
  refreshAbsenceEntryDialogDatesAndGrid();

  // Reset status bar
  if (els.skillAbsenceStatusStudentName) els.skillAbsenceStatusStudentName.textContent = "-";
  if (els.skillAbsenceStatusCellCount) els.skillAbsenceStatusCellCount.textContent = "0";

  // Bind dropdown filter
  els.skillAbsenceEntryStudentSelect.onchange = renderAbsenceEntryGrid;

  // Show dialog
  if (els.skillAbsenceEntryDialog) els.skillAbsenceEntryDialog.showModal();
}

function renderAbsenceEntryGrid() {
  const selectedBusinessIds = getSelectedReportBusinessIds() || [];
  let activeStudents = [];
  if (selectedBusinessIds.length > 0) {
    activeStudents = skillState.students.filter(student => selectedBusinessIds.includes(student.businessId));
  } else {
    activeStudents = skillState.students || [];
  }
  const studentFilter = els.skillAbsenceEntryStudentSelect?.value || "all";
  
  let studentsToRender = studentFilter === "all"
    ? activeStudents
    : activeStudents.filter(s => s.id === studentFilter);

  const query = (els.skillAbsenceSearchInput?.value || "").toLocaleLowerCase("tr-TR").trim();
  if (query) {
    studentsToRender = studentsToRender.filter(s => {
      const name = (s.name || "").toLocaleLowerCase("tr-TR");
      const no = (s.no || "").toLocaleLowerCase("tr-TR");
      return name.includes(query) || no.includes(query);
    });
  }

  const { startDate, endDate } = getReportDateRange();
  const dates = getDatesBetween(startDate, endDate);

  // 1. Day names header row
  const dayNamesRow = els.skillAbsenceGridDayNames;
  if (dayNamesRow) {
    let html = `<th rowspan="2" style="width: 180px; text-align: left; padding-left: 10px;">Öğrenci</th><th rowspan="2" style="width: 50px;">Satır</th>`;
    const dayNamesShort = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    dates.forEach(date => {
      const isWE = date.getDay() === 0 || date.getDay() === 6;
      const isHol = isReportHoliday(date);
      const label = dayNamesShort[date.getDay()];
      html += `<th class="${isWE ? "is-weekend" : ""} ${isHol ? "is-holiday" : ""}">${label}</th>`;
    });
    dayNamesRow.innerHTML = html;
  }

  // 2. Day numbers header row
  const dayNumsRow = els.skillAbsenceGridDayNumbers;
  if (dayNumsRow) {
    let html = "";
    dates.forEach(date => {
      const isWE = date.getDay() === 0 || date.getDay() === 6;
      const isHol = isReportHoliday(date);
      html += `<th class="${isWE ? "is-weekend" : ""} ${isHol ? "is-holiday" : ""}">${date.getDate()}</th>`;
    });
    dayNumsRow.innerHTML = html;
  }

  // 3. Grid body rows
  const gridBody = els.skillAbsenceGridBody;
  if (gridBody) {
    let html = "";
    studentsToRender.forEach(student => {
      const schoolDays = String(student.days || "").split(",").map((day) => day.trim()).filter(Boolean);
      
      // Row S (AM)
      let sHtml = `<tr>
        <td class="student-col" rowspan="2">${escapeHtml(student.name)}<br><small style="font-weight: normal; color: var(--muted);">${escapeHtml(student.no || "-")}</small></td>
        <td class="row-type-col">S</td>`;
      dates.forEach(date => {
        const isWE = date.getDay() === 0 || date.getDay() === 6;
        const isHol = isReportHolidayForStudent(date, student);
        const dateStr = toSkillIsoDate(date);
        const { schoolType, summerStartDate, summerEndDate } = getStudentSchoolConfig(student);
        const isSummer = (summerStartDate && summerEndDate && dateStr >= summerStartDate && dateStr <= summerEndDate);
        const isSch = !isWE && !isHol && (!isSummer || schoolType !== "mesem") && schoolDays.includes(getShortSkillDay(date));
        const cellVal = getGridSymbolForEntry(student, date, "am");
        sHtml += `<td class="absence-cell ${isWE ? "is-weekend" : ""} ${isHol ? "is-holiday" : ""} ${isSch ? "is-school-day" : ""}" 
                      data-student-id="${student.id}" 
                      data-student-name="${escapeHtml(student.name)}" 
                      data-date="${dateStr}" 
                      data-session="am">${cellVal}</td>`;
      });
      sHtml += `</tr>`;

      // Row Ö (PM)
      let oHtml = `<tr>
        <td class="row-type-col">Ö</td>`;
      dates.forEach(date => {
        const isWE = date.getDay() === 0 || date.getDay() === 6;
        const isHol = isReportHolidayForStudent(date, student);
        const dateStr = toSkillIsoDate(date);
        const { schoolType, summerStartDate, summerEndDate } = getStudentSchoolConfig(student);
        const isSummer = (summerStartDate && summerEndDate && dateStr >= summerStartDate && dateStr <= summerEndDate);
        const isSch = !isWE && !isHol && (!isSummer || schoolType !== "mesem") && schoolDays.includes(getShortSkillDay(date));
        const cellVal = getGridSymbolForEntry(student, date, "pm");
        oHtml += `<td class="absence-cell ${isWE ? "is-weekend" : ""} ${isHol ? "is-holiday" : ""} ${isSch ? "is-school-day" : ""}" 
                      data-student-id="${student.id}" 
                      data-student-name="${escapeHtml(student.name)}" 
                      data-date="${dateStr}" 
                      data-session="pm">${cellVal}</td>`;
      });
      oHtml += `</tr>`;

      html += sHtml + oHtml;
    });
    gridBody.innerHTML = html;

    // Bind drag select events
    setupGridDragSelect();
  }
}

function getGridSymbolForEntry(student, date, session) {
  const dateStr = toSkillIsoDate(date);
  const dateValue = dateStr;
  
  const { schoolType, summerStartDate, summerEndDate } = getStudentSchoolConfig(student);
  
  if (summerStartDate && summerEndDate) {
    const isSummer = (dateValue >= summerStartDate && dateValue <= summerEndDate);
    if (schoolType === "lise") {
      if (isSummer) {
        return "";
      }
    } else if (schoolType === "mesem") {
      if (isSummer) {
        if (tempAbsenceRecords[student.id]?.[dateStr]?.[session] !== undefined) {
          return tempAbsenceRecords[student.id][dateStr][session];
        }
        const matchingHolidays = skillState.holidays.filter((holiday) => dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate));
        const sessionHolidays = matchingHolidays.filter((holiday) => isHolidaySession(holiday, dateValue, session));
        if (sessionHolidays.some((holiday) => !holiday.isSchoolBreak)) return "T";
        if (date.getDay() === 0 || date.getDay() === 6) return "";
        return els.skillAbsenceAutoFillX?.checked === false ? "" : "X";
      }
    }
  }

  if (date.getDay() === 0 || date.getDay() === 6) return "";

  const matchingHolidays = skillState.holidays.filter((holiday) => dateStr >= holiday.startDate && dateStr <= (holiday.endDate || holiday.startDate));
  const sessionHolidays = matchingHolidays.filter((holiday) => isHolidaySession(holiday, dateStr, session));
  if (sessionHolidays.some((holiday) => !isSkillSchoolBreakForMesem(holiday, student))) return "T";
  if (sessionHolidays.some((holiday) => isSkillSchoolBreakForMesem(holiday, student))) return getSkillMesemBreakSymbol(date);

  const schoolDays = String(student.days || "").split(",").map((day) => day.trim()).filter(Boolean);
  const isSchoolDay = schoolDays.includes(getShortSkillDay(date));
  if (isSchoolDay) return els.skillAbsenceAutoFillO?.checked === false ? "" : "O";

  if (tempAbsenceRecords[student.id]?.[dateStr]?.[session] !== undefined) {
    return tempAbsenceRecords[student.id][dateStr][session];
  }

  return els.skillAbsenceAutoFillX?.checked === false ? "" : "X";
}

function isReportHoliday(date) {
  const dateValue = toSkillIsoDate(date);
  return skillState.holidays.some((holiday) => (
    dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate) && !isSkillSchoolBreakForMesem(holiday)
  ));
}

function isReportHolidayForStudent(date, student) {
  const dateValue = toSkillIsoDate(date);
  const { schoolType, summerStartDate, summerEndDate } = getStudentSchoolConfig(student);
  
  if (summerStartDate && summerEndDate) {
    const isSummer = (dateValue >= summerStartDate && dateValue <= summerEndDate);
    if (schoolType === "lise") {
      if (isSummer) {
        return true;
      }
    }
  }
  
  return skillState.holidays.some((holiday) => (
    dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate) && !isSkillSchoolBreakForMesem(holiday, student)
  ));
}

function setupGridDragSelect() {
  const cells = els.skillAbsenceGridBody.querySelectorAll("td.absence-cell");
  
  cells.forEach(cell => {
    if (
      cell.classList.contains("is-weekend") ||
      cell.classList.contains("is-holiday") ||
      cell.classList.contains("is-school-day")
    ) {
      return;
    }

    cell.addEventListener("mousedown", (e) => {
      isAbsenceDragging = true;
      clearAbsenceSelection();
      absenceSelectedCells.push(cell);
      cell.classList.add("is-selected");
      
      if (els.skillAbsenceStatusStudentName) els.skillAbsenceStatusStudentName.textContent = cell.dataset.studentName;
      if (els.skillAbsenceStatusCellCount) els.skillAbsenceStatusCellCount.textContent = "1";
      
      e.preventDefault();
    });

    cell.addEventListener("mouseenter", () => {
      if (isAbsenceDragging) {
        if (!absenceSelectedCells.includes(cell)) {
          absenceSelectedCells.push(cell);
          cell.classList.add("is-selected");
          if (els.skillAbsenceStatusCellCount) els.skillAbsenceStatusCellCount.textContent = String(absenceSelectedCells.length);
        }
      }
    });
  });
}

function clearAbsenceSelection() {
  absenceSelectedCells.forEach(cell => cell.classList.remove("is-selected"));
  absenceSelectedCells = [];
}

// Global mouse up to handle drag release
document.addEventListener("mouseup", (e) => {
  if (isAbsenceDragging) {
    isAbsenceDragging = false;
    const lastCell = absenceSelectedCells[absenceSelectedCells.length - 1];
    if (lastCell && els.skillAbsenceOverlayMenu && els.skillAbsenceEntryDialog) {
      const rect = lastCell.getBoundingClientRect();
      const bodyEl = els.skillAbsenceEntryDialog.querySelector(".skill-absence-body");
      if (bodyEl) {
        const bodyRect = bodyEl.getBoundingClientRect();
        els.skillAbsenceOverlayMenu.style.left = `${rect.left - bodyRect.left}px`;
        els.skillAbsenceOverlayMenu.style.top = `${rect.bottom - bodyRect.top + 5}px`;
        els.skillAbsenceOverlayMenu.hidden = false;
        
        // Prevent the immediate click event from hiding it
        els.skillAbsenceOverlayMenu.dataset.justShown = "true";
        setTimeout(() => {
          if (els.skillAbsenceOverlayMenu) {
            delete els.skillAbsenceOverlayMenu.dataset.justShown;
          }
        }, 50);
      }
    }
  }
});

// Hide overlay click handler
document.addEventListener("click", (e) => {
  if (els.skillAbsenceOverlayMenu && !els.skillAbsenceOverlayMenu.hidden) {
    if (els.skillAbsenceOverlayMenu.dataset.justShown === "true") {
      return;
    }
    if (!e.target.closest("td.absence-cell") && !e.target.closest(".skill-absence-overlay-menu")) {
      els.skillAbsenceOverlayMenu.hidden = true;
      clearAbsenceSelection();
    }
  }
});

function initAbsenceEntryEventBindings() {
  if (els.skillAbsenceOverlayMenu) {
    els.skillAbsenceOverlayMenu.addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;
      const val = btn.dataset.absenceValue;
      const symbol = val === "clear" ? "" : val;

      absenceSelectedCells.forEach(cell => {
        const studentId = cell.dataset.studentId;
        const dateStr = cell.dataset.date;
        const session = cell.dataset.session;

        if (!tempAbsenceRecords[studentId]) tempAbsenceRecords[studentId] = {};
        if (!tempAbsenceRecords[studentId][dateStr]) tempAbsenceRecords[studentId][dateStr] = {};
        tempAbsenceRecords[studentId][dateStr][session] = symbol;
        cell.textContent = symbol;
      });

      clearAbsenceSelection();
      els.skillAbsenceOverlayMenu.hidden = true;
    });
  }

  if (els.skillAbsenceSearchInput) {
    els.skillAbsenceSearchInput.addEventListener("input", () => {
      renderAbsenceEntryGrid();
    });
  }

  if (els.skillAbsenceClearBtn) {
    els.skillAbsenceClearBtn.addEventListener("click", () => {
      const val = els.skillAbsenceEntryStudentSelect?.value || "all";
      if (val === "all") {
        const selectedBusinessIds = getSelectedReportBusinessIds() || [];
        let activeStudents = [];
        if (selectedBusinessIds.length > 0) {
          activeStudents = skillState.students.filter(student => selectedBusinessIds.includes(student.businessId));
        } else {
          activeStudents = skillState.students || [];
        }
        activeStudents.forEach(student => {
          delete tempAbsenceRecords[student.id];
        });
      } else {
        delete tempAbsenceRecords[val];
      }
      renderAbsenceEntryGrid();
      showToast("Seçilen öğrenci(ler) için elle girilen değerler sıfırlandı.", "info");
    });
  }

  if (els.skillAbsenceClearAllBtn) {
    els.skillAbsenceClearAllBtn.addEventListener("click", async () => {
      if (!await appConfirm("Bu aya ait tüm manuel devamsızlık girişlerini temizlemek istediğinize emin misiniz?", { title: "Devamsızlıkları temizle", okText: "Temizle" })) return;
      tempAbsenceRecords = {};
      renderAbsenceEntryGrid();
      showToast("Tüm devamsızlık girişleri temizlendi.", "info");
    });
  }

  if (els.skillAbsenceSaveBtn) {
    els.skillAbsenceSaveBtn.addEventListener("click", () => {
      skillState.absenceRecords = tempAbsenceRecords;
      saveSkillState();
      showToast("Devamsızlık girişleri başarıyla kaydedildi.");
      els.skillAbsenceEntryDialog?.close();
      
      // Force preview redraw
      previewSkillAbsenceReport();
    });
  }

  if (els.skillAbsencePrevMonthBtn) {
    els.skillAbsencePrevMonthBtn.addEventListener("click", () => {
      moveSkillReportMonth(-1);
      refreshAbsenceEntryDialogDatesAndGrid();
    });
  }

  if (els.skillAbsenceNextMonthBtn) {
    els.skillAbsenceNextMonthBtn.addEventListener("click", () => {
      moveSkillReportMonth(1);
      refreshAbsenceEntryDialogDatesAndGrid();
    });
  }

  if (els.skillAbsenceAutoFillX) {
    els.skillAbsenceAutoFillX.addEventListener("change", () => {
      renderAbsenceEntryGrid();
    });
  }

  if (els.skillAbsenceAutoFillO) {
    els.skillAbsenceAutoFillO.addEventListener("change", () => {
      renderAbsenceEntryGrid();
    });
  }

  const closeBtns = [els.skillAbsenceCancelBtn, els.skillAbsenceEntryCloseBtn];
  closeBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        els.skillAbsenceEntryDialog?.close();
      });
    }
  });
}

if (els.skillNewStudentBtn) els.skillNewStudentBtn.addEventListener("click", () => setSkillView("students"));
if (els.skillAlertList) {
  els.skillAlertList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-skill-view-target]");
    if (target) setSkillView(target.dataset.skillViewTarget);
  });
}
if (els.skillNewSchoolBtn) els.skillNewSchoolBtn.addEventListener("click", clearSkillSchoolForm);
if (els.skillSaveSchoolBtn) els.skillSaveSchoolBtn.addEventListener("click", saveSkillSchool);
if (els.skillDeleteSchoolBtn) els.skillDeleteSchoolBtn.addEventListener("click", deleteSelectedSkillSchools);
if (els.skillSchoolTable) els.skillSchoolTable.addEventListener("click", handleSkillManagedTables);
if (els.skillNewTeacherBtn) els.skillNewTeacherBtn.addEventListener("click", clearSkillTeacherForm);
if (els.skillSaveTeacherBtn) els.skillSaveTeacherBtn.addEventListener("click", saveSkillTeacher);
if (els.skillDeleteTeacherBtn) els.skillDeleteTeacherBtn.addEventListener("click", deleteSelectedSkillTeachers);
if (els.skillTeacherTable) els.skillTeacherTable.addEventListener("click", handleSkillManagedTables);
if (els.skillNewFieldBtn) els.skillNewFieldBtn.addEventListener("click", clearSkillFieldForm);
if (els.skillSaveFieldBtn) els.skillSaveFieldBtn.addEventListener("click", saveSkillField);
if (els.skillDeleteFieldBtn) els.skillDeleteFieldBtn.addEventListener("click", deleteSelectedSkillFields);
if (els.skillDeleteAllFieldsBtn) els.skillDeleteAllFieldsBtn.addEventListener("click", deleteAllSkillFields);
if (els.skillFieldTable) els.skillFieldTable.addEventListener("click", handleSkillManagedTables);
if (els.skillHolidayForm) els.skillHolidayForm.addEventListener("submit", saveSkillHoliday);
if (els.skillHolidayYear) els.skillHolidayYear.addEventListener("change", () => {
  clearSkillHolidayForm();
  renderSkillHolidays();
});
if (els.skillAutoHolidayBtn) els.skillAutoHolidayBtn.addEventListener("click", fillAutomaticSkillHolidays);
if (els.skillClearHolidayBtn) els.skillClearHolidayBtn.addEventListener("click", clearSkillHolidayForm);
if (els.skillDeleteSelectedHolidayBtn) els.skillDeleteSelectedHolidayBtn.addEventListener("click", deleteSelectedSkillHolidays);
if (els.skillDeleteAllHolidayBtn) els.skillDeleteAllHolidayBtn.addEventListener("click", deleteAllSkillHolidays);
if (els.skillHolidayTable) els.skillHolidayTable.addEventListener("click", handleSkillHolidayTableClick);
if (els.skillReportCoordinatorFilter) els.skillReportCoordinatorFilter.addEventListener("change", renderSkillReportAssignments);
const schoolReportFilter = document.getElementById("skillReportSchoolFilter");
if (schoolReportFilter) {
  schoolReportFilter.addEventListener("change", () => {
    renderSkillReportControls();
    renderSkillReportAssignments();
  });
}
document.getElementById("skillReportSearchClearBtn")?.addEventListener("click", () => {
  if (els.skillReportSearch) els.skillReportSearch.value = "";
  renderSkillReportAssignments();
});
document.getElementById("skillReportSelectWithStudentsBtn")?.addEventListener("click", () => {
  els.skillReportAssignmentList?.querySelectorAll(".skill-assignment-card, .skill-assignment-row").forEach((row) => {
    const cb = row.querySelector("input[type='checkbox']");
    const hasBadge = row.querySelector(".has-students");
    if (cb) {
      cb.checked = Boolean(hasBadge);
      row.classList.toggle("is-selected", Boolean(hasBadge));
    }
  });
  if (els.skillReportSelectAll) els.skillReportSelectAll.checked = false;
  runSkillReportPrecheck();
});
document.getElementById("skillReportClearSelectionBtn")?.addEventListener("click", () => {
  els.skillReportAssignmentList?.querySelectorAll(".skill-assignment-card, .skill-assignment-row").forEach((row) => {
    const cb = row.querySelector("input[type='checkbox']");
    if (cb) {
      cb.checked = false;
      row.classList.remove("is-selected");
    }
  });
  if (els.skillReportSelectAll) els.skillReportSelectAll.checked = false;
  runSkillReportPrecheck();
});
if (els.skillReportSearch) els.skillReportSearch.addEventListener("input", renderSkillReportAssignments);
if (els.skillReportIncludeEmpty) els.skillReportIncludeEmpty.addEventListener("change", renderSkillReportAssignments);
if (els.skillReportSelectAll) {
  els.skillReportSelectAll.addEventListener("change", () => {
    els.skillReportAssignmentList?.querySelectorAll("[data-skill-report-business]").forEach((checkbox) => {
      checkbox.checked = els.skillReportSelectAll.checked;
    });
    runSkillReportPrecheck();
  });
}
if (els.skillReportAssignmentList) {
  els.skillReportAssignmentList.addEventListener("change", runSkillReportPrecheck);
  els.skillReportAssignmentList.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-skill-toggle-students]");
    if (!toggleBtn) return;
    if (e.__skillHandled) return;
    const businessId = toggleBtn.getAttribute("data-skill-toggle-students");
    if (typeof window.toggleSkillBusinessStudents === "function") {
      window.toggleSkillBusinessStudents(businessId, e);
    }
  });
}
document.getElementById("skillReportDirectPrintBtn")?.addEventListener("click", () => {
  previewSkillAbsenceReport();
  setTimeout(() => {
    printSkillAbsenceReport();
  }, 400);
});
els.skillReportTabs?.forEach((button) => {
  button.addEventListener("click", () => setSkillReportType(button.dataset.skillReportTab));
});
if (els.skillReportMobileSelect) {
  els.skillReportMobileSelect.addEventListener("change", (e) => setSkillReportType(e.target.value));
}
if (els.skillReportMonthSelect) {
  els.skillReportMonthSelect.addEventListener("change", () => {
    skillReportMonth = els.skillReportMonthSelect.value;
    const currentRange = getCheckedSkillReportRange();
    if (currentRange === "week") {
      syncSkillReportRange();
    } else if (currentRange === "month") {
      syncSkillReportMonthDates();
      setSkillReportDateInputsEnabled(false);
      runSkillReportPrecheck();
    } else {
      runSkillReportPrecheck();
    }
  });
}
if (els.skillReportPrevMonthBtn) els.skillReportPrevMonthBtn.addEventListener("click", () => moveSkillReportMonth(-1));
if (els.skillReportNextMonthBtn) els.skillReportNextMonthBtn.addEventListener("click", () => moveSkillReportMonth(1));
document.querySelectorAll('input[name="skillReportRange"]').forEach((input) => {
  input.addEventListener("change", syncSkillReportRange);
});
if (els.skillReportStartDate) {
  els.skillReportStartDate.addEventListener("change", () => {
    const customRadio = document.querySelector('input[name="skillReportRange"][value="custom"]');
    if (customRadio && !customRadio.checked) customRadio.checked = true;
    runSkillReportPrecheck();
  });
}
if (els.skillReportEndDate) {
  els.skillReportEndDate.addEventListener("change", () => {
    const customRadio = document.querySelector('input[name="skillReportRange"][value="custom"]');
    if (customRadio && !customRadio.checked) customRadio.checked = true;
    runSkillReportPrecheck();
  });
}
if (els.skillReportBusinessSymbolEnabled) {
  els.skillReportBusinessSymbolEnabled.addEventListener("change", runSkillReportPrecheck);
}
if (els.skillReportSchoolSymbolEnabled) {
  els.skillReportSchoolSymbolEnabled.addEventListener("change", runSkillReportPrecheck);
}
if (els.skillReportPerPage) els.skillReportPerPage.addEventListener("change", runSkillReportPrecheck);
if (els.skillMonthlyAutoFill) els.skillMonthlyAutoFill.addEventListener("change", runSkillReportPrecheck);
if (els.skillMonthlyMasterCert) els.skillMonthlyMasterCert.addEventListener("change", runSkillReportPrecheck);
if (els.skillTerminationBlank) els.skillTerminationBlank.addEventListener("change", () => {
  syncTerminationOptionState();
  runSkillReportPrecheck();
});
if (els.skillTerminationTemplate) els.skillTerminationTemplate.addEventListener("change", () => {
  syncTerminationOptionState();
  runSkillReportPrecheck();
});
if (els.skillTerminationStudent) els.skillTerminationStudent.addEventListener("change", runSkillReportPrecheck);
if (els.skillTerminationContractDate) els.skillTerminationContractDate.addEventListener("change", runSkillReportPrecheck);
if (els.skillTerminationCancelDate) els.skillTerminationCancelDate.addEventListener("change", runSkillReportPrecheck);
if (els.skillTerminationReasons) els.skillTerminationReasons.addEventListener("input", runSkillReportPrecheck);
if (els.skillTerminationStudentTc) els.skillTerminationStudentTc.addEventListener("input", runSkillReportPrecheck);
if (els.skillTerminationVeliName) els.skillTerminationVeliName.addEventListener("input", runSkillReportPrecheck);
if (els.skillTerminationVeliPhone) els.skillTerminationVeliPhone.addEventListener("input", runSkillReportPrecheck);
if (els.skillTerminationVeliAddress) els.skillTerminationVeliAddress.addEventListener("input", runSkillReportPrecheck);
if (els.skillTerminationReasonCode) els.skillTerminationReasonCode.addEventListener("change", runSkillReportPrecheck);
if (els.skillGradeType) els.skillGradeType.addEventListener("change", () => {
  updateGradeLayoutOptions();
  runSkillReportPrecheck();
});
if (els.skillGradeLayout) els.skillGradeLayout.addEventListener("change", runSkillReportPrecheck);
if (els.skillGradeTerm) els.skillGradeTerm.addEventListener("change", runSkillReportPrecheck);
if (els.skillWageMinimumNet) els.skillWageMinimumNet.addEventListener("input", runSkillReportPrecheck);
if (els.skillWageStudentType) els.skillWageStudentType.addEventListener("change", runSkillReportPrecheck);
if (els.skillWageManualAbsence) els.skillWageManualAbsence.addEventListener("change", runSkillReportPrecheck);
if (els.skillWageManualBtn) els.skillWageManualBtn.addEventListener("click", openWageManualDialog);
if (els.skillWageManualForm) els.skillWageManualForm.addEventListener("submit", saveWageManualAbsences);
if (els.skillWageManualCloseBtn) els.skillWageManualCloseBtn.addEventListener("click", closeWageManualDialog);
if (els.skillWageManualCancelBtn) els.skillWageManualCancelBtn.addEventListener("click", closeWageManualDialog);
if (els.skillWageManualClearBtn) els.skillWageManualClearBtn.addEventListener("click", clearWageManualInputs);
if (els.skillWageManualTable) els.skillWageManualTable.addEventListener("input", updateWageManualSummary);
if (els.skillReportPrecheckBtn) els.skillReportPrecheckBtn.addEventListener("click", runSkillReportPrecheck);
if (els.skillReportPreviewBtn) els.skillReportPreviewBtn.addEventListener("click", previewSkillAbsenceReport);
if (els.skillReportPreviewCloseBtn) els.skillReportPreviewCloseBtn.addEventListener("click", closeSkillReportPreview);
if (els.skillReportPdfBtn) els.skillReportPdfBtn.addEventListener("click", downloadSkillReportPdf);
if (els.skillReportPrintBtn) els.skillReportPrintBtn.addEventListener("click", printSkillAbsenceReport);
if (els.skillReportShareBtn) els.skillReportShareBtn.addEventListener("click", shareSkillReport);
if (els.skillReportZoomInBtn) els.skillReportZoomInBtn.addEventListener("click", () => zoomSkillReport(0.1));
if (els.skillReportZoomOutBtn) els.skillReportZoomOutBtn.addEventListener("click", () => zoomSkillReport(-0.1));

els.skillStudentForm.addEventListener("submit", saveSkillStudent);
els.skillBusinessForm.addEventListener("submit", saveSkillBusiness);
els.skillCoordinatorForm.addEventListener("submit", saveSkillCoordinator);
els.skillClearStudentBtn.addEventListener("click", clearSkillStudentForm);

// --- Slide-over Drawer & Selection Bar Event Listeners ---
// 1. Öğrenci Drawer & Seçim
const openStudentDrawerBtn = document.getElementById("skillOpenStudentDrawerBtn");
const closeStudentDrawerBtn = document.getElementById("skillCloseStudentDrawerBtn");
const cancelStudentDrawerBtn = document.getElementById("skillCancelStudentDrawerBtn");
const studentDrawerBackdrop = document.getElementById("skillStudentDrawerBackdrop");
const clearStudentSelectionBtn = document.getElementById("skillStudentClearSelectionBtn");

if (openStudentDrawerBtn) openStudentDrawerBtn.addEventListener("click", () => window.openSkillStudentDrawer?.(null));
if (closeStudentDrawerBtn) closeStudentDrawerBtn.addEventListener("click", () => window.closeSkillStudentDrawer?.());
if (cancelStudentDrawerBtn) cancelStudentDrawerBtn.addEventListener("click", () => window.closeSkillStudentDrawer?.());
if (studentDrawerBackdrop) studentDrawerBackdrop.addEventListener("click", () => window.closeSkillStudentDrawer?.());
if (clearStudentSelectionBtn) {
  clearStudentSelectionBtn.addEventListener("click", () => {
    if (els.skillStudentTable) {
      const selectAll = els.skillStudentTable.querySelector("#skillStudentSelectAll");
      if (selectAll) selectAll.checked = false;
      els.skillStudentTable.querySelectorAll("[data-skill-select-student]").forEach((cb) => cb.checked = false);
    }
    updateSkillStudentActionState?.();
  });
}

// 2. İşletme Drawer & Seçim
const openBusinessDrawerBtn = document.getElementById("skillOpenBusinessDrawerBtn");
const closeBusinessDrawerBtn = document.getElementById("skillCloseBusinessDrawerBtn");
const cancelBusinessDrawerBtn = document.getElementById("skillCancelBusinessDrawerBtn");
const businessDrawerBackdrop = document.getElementById("skillBusinessDrawerBackdrop");
const clearBusinessSelectionBtn = document.getElementById("skillBusinessClearSelectionBtn");

if (openBusinessDrawerBtn) openBusinessDrawerBtn.addEventListener("click", () => window.openSkillBusinessDrawer?.(null));
if (closeBusinessDrawerBtn) closeBusinessDrawerBtn.addEventListener("click", () => window.closeSkillBusinessDrawer?.());
if (cancelBusinessDrawerBtn) cancelBusinessDrawerBtn.addEventListener("click", () => window.closeSkillBusinessDrawer?.());
if (businessDrawerBackdrop) businessDrawerBackdrop.addEventListener("click", () => window.closeSkillBusinessDrawer?.());
if (clearBusinessSelectionBtn) {
  clearBusinessSelectionBtn.addEventListener("click", () => {
    if (els.skillBusinessTable) {
      const selectAll = els.skillBusinessTable.querySelector("#skillBusinessSelectAll");
      if (selectAll) selectAll.checked = false;
      els.skillBusinessTable.querySelectorAll("[data-skill-select-business]").forEach((cb) => cb.checked = false);
    }
    updateSkillBusinessActionState?.();
  });
}

// 3. Koordinatör Drawer & Seçim
const openCoordinatorDrawerBtn = document.getElementById("skillOpenCoordinatorDrawerBtn");
const closeCoordinatorDrawerBtn = document.getElementById("skillCloseCoordinatorDrawerBtn");
const cancelCoordinatorDrawerBtn = document.getElementById("skillCancelCoordinatorDrawerBtn");
const coordinatorDrawerBackdrop = document.getElementById("skillCoordinatorDrawerBackdrop");
const clearCoordinatorSelectionBtn = document.getElementById("skillCoordinatorClearSelectionBtn");

if (openCoordinatorDrawerBtn) openCoordinatorDrawerBtn.addEventListener("click", () => window.openSkillCoordinatorDrawer?.(null));
if (closeCoordinatorDrawerBtn) closeCoordinatorDrawerBtn.addEventListener("click", () => window.closeSkillCoordinatorDrawer?.());
if (cancelCoordinatorDrawerBtn) cancelCoordinatorDrawerBtn.addEventListener("click", () => window.closeSkillCoordinatorDrawer?.());
if (coordinatorDrawerBackdrop) coordinatorDrawerBackdrop.addEventListener("click", () => window.closeSkillCoordinatorDrawer?.());
if (clearCoordinatorSelectionBtn) {
  clearCoordinatorSelectionBtn.addEventListener("click", () => {
    if (els.skillCoordinatorTable) {
      const selectAll = els.skillCoordinatorTable.querySelector("#skillCoordinatorSelectAll");
      if (selectAll) selectAll.checked = false;
      els.skillCoordinatorTable.querySelectorAll("[data-skill-select-coordinator]").forEach((cb) => cb.checked = false);
    }
    updateSkillCoordinatorActionState?.();
  });
}

// 4. Tatil Drawer & Seçim
const openHolidayDrawerBtn = document.getElementById("skillOpenHolidayDrawerBtn");
const closeHolidayDrawerBtn = document.getElementById("skillCloseHolidayDrawerBtn");
const cancelHolidayDrawerBtn = document.getElementById("skillCancelHolidayDrawerBtn");
const holidayDrawerBackdrop = document.getElementById("skillHolidayDrawerBackdrop");
const clearHolidaySelectionBtn = document.getElementById("skillHolidayClearSelectionBtn");

if (openHolidayDrawerBtn) openHolidayDrawerBtn.addEventListener("click", () => window.openSkillHolidayDrawer?.(null));
if (closeHolidayDrawerBtn) closeHolidayDrawerBtn.addEventListener("click", () => window.closeSkillHolidayDrawer?.());
if (cancelHolidayDrawerBtn) cancelHolidayDrawerBtn.addEventListener("click", () => window.closeSkillHolidayDrawer?.());
if (holidayDrawerBackdrop) holidayDrawerBackdrop.addEventListener("click", () => window.closeSkillHolidayDrawer?.());
if (clearHolidaySelectionBtn) {
  clearHolidaySelectionBtn.addEventListener("click", () => {
    if (els.skillHolidayTable) {
      const selectAll = els.skillHolidayTable.querySelector("#skillHolidaySelectAll");
      if (selectAll) selectAll.checked = false;
      els.skillHolidayTable.querySelectorAll("[data-skill-select-holiday]").forEach((cb) => cb.checked = false);
    }
    updateSkillHolidayActionState?.();
  });
}

// 5. Okul Drawer & Seçim
const openSchoolDrawerBtn = document.getElementById("skillOpenSchoolDrawerBtn");
const closeSchoolDrawerBtn = document.getElementById("skillCloseSchoolDrawerBtn");
const cancelSchoolDrawerBtn = document.getElementById("skillCancelSchoolDrawerBtn");
const schoolDrawerBackdrop = document.getElementById("skillSchoolDrawerBackdrop");
const clearSchoolSelectionBtn = document.getElementById("skillSchoolClearSelectionBtn");

if (openSchoolDrawerBtn) openSchoolDrawerBtn.addEventListener("click", () => window.openSkillSchoolDrawer?.(null));
if (closeSchoolDrawerBtn) closeSchoolDrawerBtn.addEventListener("click", () => window.closeSkillSchoolDrawer?.());
if (cancelSchoolDrawerBtn) cancelSchoolDrawerBtn.addEventListener("click", () => window.closeSkillSchoolDrawer?.());
if (schoolDrawerBackdrop) schoolDrawerBackdrop.addEventListener("click", () => window.closeSkillSchoolDrawer?.());
if (clearSchoolSelectionBtn) {
  clearSchoolSelectionBtn.addEventListener("click", () => {
    if (els.skillSchoolTable) {
      const selectAll = document.getElementById("skillSchoolSelectAll");
      if (selectAll) selectAll.checked = false;
      els.skillSchoolTable.querySelectorAll("[data-skill-select-school]").forEach((cb) => cb.checked = false);
    }
    updateSkillSchoolActionState?.();
  });
}
document.getElementById("skillSchoolForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  saveSkillSchool?.(e);
});

// 6. Öğretmen Drawer & Seçim
const openTeacherDrawerBtn = document.getElementById("skillOpenTeacherDrawerBtn");
const closeTeacherDrawerBtn = document.getElementById("skillCloseTeacherDrawerBtn");
const cancelTeacherDrawerBtn = document.getElementById("skillCancelTeacherDrawerBtn");
const teacherDrawerBackdrop = document.getElementById("skillTeacherDrawerBackdrop");
const clearTeacherSelectionBtn = document.getElementById("skillTeacherClearSelectionBtn");

if (openTeacherDrawerBtn) openTeacherDrawerBtn.addEventListener("click", () => window.openSkillTeacherDrawer?.(null));
if (closeTeacherDrawerBtn) closeTeacherDrawerBtn.addEventListener("click", () => window.closeSkillTeacherDrawer?.());
if (cancelTeacherDrawerBtn) cancelTeacherDrawerBtn.addEventListener("click", () => window.closeSkillTeacherDrawer?.());
if (teacherDrawerBackdrop) teacherDrawerBackdrop.addEventListener("click", () => window.closeSkillTeacherDrawer?.());
if (clearTeacherSelectionBtn) {
  clearTeacherSelectionBtn.addEventListener("click", () => {
    if (els.skillTeacherTable) {
      const selectAll = document.getElementById("skillTeacherSelectAll");
      if (selectAll) selectAll.checked = false;
      els.skillTeacherTable.querySelectorAll("[data-skill-select-teacher]").forEach((cb) => cb.checked = false);
    }
    updateSkillTeacherActionState?.();
  });
}
document.getElementById("skillTeacherForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  saveSkillTeacher?.(e);
});

// ESC tuşuyla açık olan drawer'ı kapat
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.closeSkillStudentDrawer?.();
    window.closeSkillBusinessDrawer?.();
    window.closeSkillCoordinatorDrawer?.();
    window.closeSkillHolidayDrawer?.();
    window.closeSkillSchoolDrawer?.();
    window.closeSkillTeacherDrawer?.();
  }
});
if (els.skillToggleStudentStatusBtn) els.skillToggleStudentStatusBtn.addEventListener("click", toggleSelectedSkillStudentStatus);
if (els.skillActivateStudentBtn) els.skillActivateStudentBtn.addEventListener("click", () => setSelectedSkillStudentStatus(true));
if (els.skillDeleteSelectedStudentBtn) els.skillDeleteSelectedStudentBtn.addEventListener("click", deleteSelectedSkillStudents);
if (els.skillDeleteAllStudentBtn) els.skillDeleteAllStudentBtn.addEventListener("click", deleteAllSkillStudents);
els.skillClearBusinessBtn.addEventListener("click", clearSkillBusinessForm);
if (els.skillDeleteSelectedBusinessBtn) els.skillDeleteSelectedBusinessBtn.addEventListener("click", deleteSelectedSkillBusinesses);
if (els.skillDeleteAllBusinessBtn) els.skillDeleteAllBusinessBtn.addEventListener("click", deleteAllSkillBusinesses);
if (els.skillClearCoordinatorBtn) els.skillClearCoordinatorBtn.addEventListener("click", clearSkillCoordinatorForm);
if (els.skillDeleteSelectedCoordinatorBtn) els.skillDeleteSelectedCoordinatorBtn.addEventListener("click", deleteSelectedSkillCoordinators);
if (els.skillDeleteAllCoordinatorBtn) els.skillDeleteAllCoordinatorBtn.addEventListener("click", deleteAllSkillCoordinators);
els.skillStudentSearch.addEventListener("input", renderSkillStudents);
if (els.skillStudentClassFilter) els.skillStudentClassFilter.addEventListener("change", renderSkillStudents);
if (els.skillStudentBusinessFilter) els.skillStudentBusinessFilter.addEventListener("change", renderSkillStudents);
if (els.skillStudentStatusFilter) els.skillStudentStatusFilter.addEventListener("change", renderSkillStudents);
if (els.skillStudentDayPicker) {
  els.skillStudentDayPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-skill-student-day]");
    if (!button) return;
    const days = (els.skillStudentDays.value || "").split(",").map((day) => day.trim()).filter(Boolean);
    const nextDays = days.includes(button.dataset.skillStudentDay)
      ? days.filter((day) => day !== button.dataset.skillStudentDay)
      : [...days, button.dataset.skillStudentDay];
    setSkillStudentDays(nextDays.join(", "));
  });
}
if (els.skillClassDayPicker) {
  els.skillClassDayPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-skill-class-day]");
    if (!button) return;
    button.classList.toggle("is-active");
  });
}
if (els.skillClassDaySelect) {
  els.skillClassDaySelect.addEventListener("change", () => {
    setSkillClassDayPickerDays(getClassDaysFromStudents(els.skillClassDaySelect.value));
    updateSkillClassDaySummary();
  });
}

document.getElementById("skillClassDayTarget")?.addEventListener("change", (e) => {
  const selectContainer = document.getElementById("skillClassDaySelectContainer");
  if (selectContainer) {
    selectContainer.style.display = e.target.value === "class" ? "block" : "none";
  }
  
  if (e.target.value === "class") {
    setSkillClassDayPickerDays(getClassDaysFromStudents(els.skillClassDaySelect?.value));
  } else {
    setSkillClassDayPickerDays([]);
  }
  updateSkillClassDaySummary();
});

if (els.skillAssignClassDaysBtn) els.skillAssignClassDaysBtn.addEventListener("click", openSkillClassDayDialog);
if (els.skillClassDayForm) els.skillClassDayForm.addEventListener("submit", assignDaysToClass);
if (els.skillClassDayCloseBtn) els.skillClassDayCloseBtn.addEventListener("click", closeSkillClassDayDialog);
if (els.skillClassDayCancelBtn) els.skillClassDayCancelBtn.addEventListener("click", closeSkillClassDayDialog);
if (els.skillStudentStatusForm) els.skillStudentStatusForm.addEventListener("submit", saveSkillStudentStatus);
if (els.skillStatusStudentSearch) els.skillStatusStudentSearch.addEventListener("input", renderSkillStatusStudentResults);
if (els.skillStatusStudentResults) {
  els.skillStatusStudentResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-skill-status-search-student]");
    if (!button) return;
    selectSkillStatusStudent(button.dataset.skillStatusSearchStudent);
  });
}
if (els.skillStatusStudentSelect) els.skillStatusStudentSelect.addEventListener("change", updatePendingStatusStudentFromSelect);
if (els.skillStatusCloseBtn) els.skillStatusCloseBtn.addEventListener("click", closeSkillStudentStatusDialog);
if (els.skillStatusCancelBtn) els.skillStatusCancelBtn.addEventListener("click", closeSkillStudentStatusDialog);
els.skillStudentTable.addEventListener("click", handleSkillTableClick);
els.skillStudentTable.addEventListener("change", (e) => {
  if (e.target.id === "skillStudentSelectAll") {
    const isChecked = e.target.checked;
    els.skillStudentTable.querySelectorAll("[data-skill-select-student]").forEach((cb) => {
      cb.checked = isChecked;
    });
  }
  updateSkillStudentActionState();
});
els.skillBusinessTable.addEventListener("click", handleSkillTableClick);
els.skillCoordinatorTable.addEventListener("click", handleSkillTableClick);
els.skillCoordinatorTable.addEventListener("change", (e) => {
  if (e.target.hasAttribute("data-skill-select-coordinator") || e.target.id === "skillCoordinatorSelectAll") {
    updateSkillCoordinatorActionState();
  }
});
initCoordinatorBulkActions();

// Initialize Devamsızlık Girişi panel bindings
if (els.skillAbsenceEntryBtn) els.skillAbsenceEntryBtn.addEventListener("click", openSkillAbsenceEntryDialog);
initAbsenceEntryEventBindings();
if (els.skillCoordinatorSchool) {
  els.skillCoordinatorSchool.addEventListener("change", () => {
    const schoolId = els.skillCoordinatorSchool.value;
    const school = skillState.schoolRecords.find((s) => s.id === schoolId);
    if (school && school.deputy && els.skillCoordinatorDeputy) {
      els.skillCoordinatorDeputy.value = school.deputy;
    }
  });
}

let allAlanDalSuggestions = [];

function populateStudentAlanDalDatalist() {
  if (!alanDalListesi) return;
  
  const uniqueOptions = new Set();
  ["mesem", "mtal"].forEach(type => {
    const list = alanDalListesi[type];
    if (!list) return;
    for (const alan of Object.keys(list)) {
      for (const dal of list[alan]) {
        uniqueOptions.add(`${alan} / ${dal}`);
      }
    }
  });
  allAlanDalSuggestions = Array.from(uniqueOptions).sort();
  
  // Initialize the custom dialog elements
  initStudentAlanDalDialog();
}

function initStudentAlanDalDialog() {
  const input = document.getElementById("skillStudentField");
  const dialog = document.getElementById("skillFieldSelectorDialog");
  const searchInput = document.getElementById("skillFieldSelectorSearch");
  const listContainer = document.getElementById("skillFieldSelectorList");
  const newAreaInput = document.getElementById("skillFieldSelectorNewArea");
  const newBranchInput = document.getElementById("skillFieldSelectorNewBranch");
  const addBtn = document.getElementById("skillFieldSelectorAddBtn");

  if (!input || !dialog || !listContainer) return;

  // Click on the student field opens the dialog
  input.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (newAreaInput) newAreaInput.value = "";
    if (newBranchInput) newBranchInput.value = "";
    renderFieldSelectorList();
    dialog.showModal();
  });

  // Keep track of which item is being edited
  let editingId = null;

  function renderFieldSelectorList() {
    const filterText = searchInput ? searchInput.value.trim().toLocaleLowerCase("tr-TR") : "";
    const localFields = Array.isArray(skillState.fields) ? skillState.fields : [];
    
    // Project/School specific fields
    const localItems = localFields.map(f => {
      const label = getSkillFieldLabel(f);
      return {
        type: "project",
        id: f.id,
        area: f.area,
        branch: f.branch,
        label: label
      };
    });

    // If search is empty, show ONLY school fields
    if (filterText === "") {
      if (localItems.length === 0) {
        listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--muted); font-size: 0.85rem;">Okulunuza tanımlı alan/dal bulunmamaktadır.<br>Yukarıdaki formdan yeni alan ekleyebilir veya arama yaparak standart MEB listesinden seçebilirsiniz.</div>`;
        return;
      }

      listContainer.innerHTML = localItems.map(item => {
        const isEditing = item.id === editingId;
        if (isEditing) {
          return `
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); background: rgba(45, 212, 191, 0.06); box-sizing: border-box;">
              <div style="display: flex; gap: 8px; flex: 1; align-items: center; padding-right: 10px; min-width: 0;">
                <input type="text" class="edit-input" id="editArea_${item.id}" value="${escapeHtml(item.area)}" placeholder="Alan" style="flex: 1; padding: 6px 10px; font-size: 0.78rem; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--ink); outline: none; box-sizing: border-box;" />
                <input type="text" class="edit-input" id="editBranch_${item.id}" value="${escapeHtml(item.branch)}" placeholder="Dal" style="flex: 1; padding: 6px 10px; font-size: 0.78rem; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--ink); outline: none; box-sizing: border-box;" />
              </div>
              <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                <button class="primary-action save-edit-btn" data-id="${item.id}" style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; min-height: 28px;" title="Kaydet">✓</button>
                <button class="danger-action cancel-edit-btn" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; min-height: 28px;" title="İptal">✗</button>
              </div>
            </div>
          `;
        }

        return `
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); background: var(--surface); box-sizing: border-box;">
            <div class="select-field-trigger" data-label="${escapeHtml(item.label)}" data-type="${item.type}" data-id="${item.id}" style="cursor: pointer; text-align: left; min-width: 0;">
              <strong style="font-size: 0.85rem; display: block; color: var(--ink); line-height: 1.3; font-weight: bold; word-break: break-word;">${escapeHtml(item.area)}</strong>
              <span style="font-size: 0.76rem; color: var(--muted); display: block; margin-top: 3px; line-height: 1.3; word-break: break-word;">${escapeHtml(item.branch || "Dal belirtilmedi")}</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
              <button class="ghost-action edit-field-btn" data-id="${item.id}" style="min-height: 28px; padding: 4px 8px; font-size: 0.76rem; color: var(--accent); border: 1px solid var(--line); border-radius: 6px; cursor: pointer; background: transparent;" title="Düzenle">✏</button>
              <button class="danger-action delete-field-btn" data-id="${item.id}" style="min-height: 28px; padding: 4px 8px; font-size: 0.76rem; font-weight: bold; color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; cursor: pointer;" title="Sil">×</button>
            </div>
          </div>
        `;
      }).join("");
      return;
    }

    // If search has text, show filtered school fields, AND matching MEB suggestions below
    const filteredSchool = localItems.filter(item => 
      item.label.toLocaleLowerCase("tr-TR").includes(filterText)
    );

    const labelsInProject = new Set(localItems.map(item => item.label.toLowerCase()));
    const matchingMeb = allAlanDalSuggestions
      .filter(str => str.toLocaleLowerCase("tr-TR").includes(filterText) && !labelsInProject.has(str.toLowerCase()))
      .slice(0, 40) // Limit suggestions to keep search fast
      .map(str => {
        const parts = str.split("/");
        const area = parts[0]?.trim() || "";
        const branch = parts[1]?.trim() || "";
        return {
          type: "meb",
          id: "meb_" + str,
          area: area,
          branch: branch,
          label: str
        };
      });

    let html = "";

    // 1. Okul Alanları (School fields matching)
    if (filteredSchool.length > 0) {
      html += `<div style="padding: 6px 14px; background: rgba(var(--accent-rgb), 0.02); font-size: 0.75rem; font-weight: bold; color: var(--muted); border-bottom: 1px solid var(--line);">Okula Tanımlı Alanlar</div>`;
      html += filteredSchool.map(item => {
        const isEditing = item.id === editingId;
        if (isEditing) {
          return `
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); background: rgba(45, 212, 191, 0.06); box-sizing: border-box;">
              <div style="display: flex; gap: 8px; flex: 1; align-items: center; padding-right: 10px; min-width: 0;">
                <input type="text" class="edit-input" id="editArea_${item.id}" value="${escapeHtml(item.area)}" placeholder="Alan" style="flex: 1; padding: 6px 10px; font-size: 0.78rem; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--ink); outline: none; box-sizing: border-box;" />
                <input type="text" class="edit-input" id="editBranch_${item.id}" value="${escapeHtml(item.branch)}" placeholder="Dal" style="flex: 1; padding: 6px 10px; font-size: 0.78rem; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--ink); outline: none; box-sizing: border-box;" />
              </div>
              <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                <button class="primary-action save-edit-btn" data-id="${item.id}" style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; min-height: 28px;" title="Kaydet">✓</button>
                <button class="danger-action cancel-edit-btn" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; min-height: 28px;" title="İptal">✗</button>
              </div>
            </div>
          `;
        }

        return `
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); background: var(--surface); box-sizing: border-box;">
            <div class="select-field-trigger" data-label="${escapeHtml(item.label)}" data-type="${item.type}" data-id="${item.id}" style="cursor: pointer; text-align: left; min-width: 0;">
              <strong style="font-size: 0.85rem; display: block; color: var(--ink); line-height: 1.3; font-weight: bold; word-break: break-word;">${escapeHtml(item.area)}</strong>
              <span style="font-size: 0.76rem; color: var(--muted); display: block; margin-top: 3px; line-height: 1.3; word-break: break-word;">${escapeHtml(item.branch || "Dal belirtilmedi")}</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
              <button class="ghost-action edit-field-btn" data-id="${item.id}" style="min-height: 28px; padding: 4px 8px; font-size: 0.76rem; color: var(--accent); border: 1px solid var(--line); border-radius: 6px; cursor: pointer; background: transparent;" title="Düzenle">✏</button>
              <button class="danger-action delete-field-btn" data-id="${item.id}" style="min-height: 28px; padding: 4px 8px; font-size: 0.76rem; font-weight: bold; color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; cursor: pointer;" title="Sil">×</button>
            </div>
          </div>
        `;
      }).join("");
    }

    // 2. Standart MEB Alanları (Matching MEB Suggestions)
    if (matchingMeb.length > 0) {
      html += `<div style="padding: 6px 14px; background: rgba(16, 185, 129, 0.05); font-size: 0.75rem; font-weight: bold; color: #10b981; border-bottom: 1px solid var(--line); border-top: 1px solid var(--line);">Standart MEB Listesinden Ekle</div>`;
      html += matchingMeb.map(item => {
        return `
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); background: var(--surface); box-sizing: border-box;">
            <div class="select-field-trigger" data-label="${escapeHtml(item.label)}" data-type="${item.type}" data-id="${item.id}" style="cursor: pointer; text-align: left; min-width: 0;">
              <strong style="font-size: 0.85rem; display: block; color: var(--ink); line-height: 1.3; font-weight: bold; word-break: break-word;">${escapeHtml(item.area)}</strong>
              <span style="font-size: 0.76rem; color: var(--muted); display: block; margin-top: 3px; line-height: 1.3; word-break: break-word;">${escapeHtml(item.branch || "Dal belirtilmedi")}</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
              <button class="select-field-btn" data-label="${escapeHtml(item.label)}" data-type="${item.type}" data-id="${item.id}" style="min-height: 28px; padding: 4px 10px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; cursor: pointer; background: #10b981; color: white; border: none; display: inline-flex; align-items: center; justify-content: center;">+ Ekle</button>
            </div>
          </div>
        `;
      }).join("");
    }

    if (html === "") {
      listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--muted); font-size: 0.85rem;">Eşleşen alan/dal bulunamadı.</div>`;
      return;
    }

    listContainer.innerHTML = html;
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderFieldSelectorList);
  }

  listContainer.addEventListener("click", (e) => {
    const selectBtn = e.target.closest(".select-field-btn");
    const selectTrigger = e.target.closest(".select-field-trigger");
    if (selectBtn || selectTrigger) {
      const target = selectBtn || selectTrigger;
      const label = target.dataset.label;
      const type = target.dataset.type;
      const id = target.dataset.id;

      if (type === "meb") {
        const parts = label.split("/");
        const area = parts[0]?.trim() || "Belirtilmedi";
        const branch = parts[1]?.trim() || "";
        
        if (!skillState.fields) skillState.fields = [];
        const exists = skillState.fields.some(f => 
          f.area.toLowerCase() === area.toLowerCase() && 
          (branch ? f.branch.toLowerCase() === branch.toLowerCase() : true)
        );
        if (!exists) {
          skillState.fields.push({
            id: "field_" + Math.random().toString(36).substr(2, 9),
            area: area,
            branch: branch
          });
          saveSkillState();
        }
      }

      input.value = label;
      dialog.close();
      return;
    }

    const editBtn = e.target.closest(".edit-field-btn");
    if (editBtn) {
      editingId = editBtn.dataset.id;
      renderFieldSelectorList();
      return;
    }

    const cancelBtn = e.target.closest(".cancel-edit-btn");
    if (cancelBtn) {
      editingId = null;
      renderFieldSelectorList();
      return;
    }

    const saveBtn = e.target.closest(".save-edit-btn");
    if (saveBtn) {
      const id = saveBtn.dataset.id;
      const editAreaInput = document.getElementById(`editArea_${id}`);
      const editBranchInput = document.getElementById(`editBranch_${id}`);
      if (!editAreaInput) return;

      const newArea = editAreaInput.value.trim();
      const newBranch = editBranchInput.value.trim();

      if (!newArea) {
        showToast("Alan adı boş bırakılamaz.", "warning");
        return;
      }

      const field = skillState.fields.find(f => f.id === id);
      if (field) {
        const oldLabel = getSkillFieldLabel(field);
        field.area = newArea;
        field.branch = newBranch;
        const newLabel = getSkillFieldLabel(field);

        saveSkillState();

        if (oldLabel !== newLabel) {
          let updatedCount = 0;
          skillState.students.forEach(student => {
            if (student.field === oldLabel) {
              student.field = newLabel;
              updatedCount++;
            }
          });
          skillState.coordinators.forEach(coord => {
            if (coord.field === oldLabel) {
              coord.field = newLabel;
              updatedCount++;
            }
          });
          
          if (updatedCount > 0) {
            saveSkillState();
            renderSkillModule();
          }
          showToast(`Alan/Dal güncellendi ve ${updatedCount} kayda uygulandı.`);
        } else {
          showToast("Alan/Dal güncellendi.");
        }
      }

      editingId = null;
      renderFieldSelectorList();
      return;
    }

    const deleteBtn = e.target.closest(".delete-field-btn");
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const field = skillState.fields.find(f => f.id === id);
      if (!field) return;

      const label = getSkillFieldLabel(field);

      if (confirm(`"${label}" alanını silmek istediğinize emin misiniz?\nBu alana atanmış tüm öğrencilerin ve koordinatörlerin alan bilgisi temizlenecektir.`)) {
        skillState.fields = skillState.fields.filter(f => f.id !== id);
        
        let clearedCount = 0;
        skillState.students.forEach(student => {
          if (student.field === label) {
            student.field = "";
            clearedCount++;
          }
        });
        skillState.coordinators.forEach(coord => {
          if (coord.field === label) {
            coord.field = "";
            clearedCount++;
          }
        });

        saveSkillState();
        if (clearedCount > 0) {
          renderSkillModule();
        }

        if (input.value === label) {
          input.value = "";
        }

        showToast(`Alan/Dal silindi ve ${clearedCount} kaydın ataması kaldırıldı.`);
        renderFieldSelectorList();
      }
      return;
    }
  });

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const areaVal = newAreaInput ? newAreaInput.value.trim() : "";
      const branchVal = newBranchInput ? newBranchInput.value.trim() : "";

      if (!areaVal) {
        showToast("Alan adı boş bırakılamaz.", "warning");
        return;
      }

      if (!skillState.fields) skillState.fields = [];
      const exists = skillState.fields.some(f => 
        f.area.toLowerCase() === areaVal.toLowerCase() && 
        (branchVal ? f.branch.toLowerCase() === branchVal.toLowerCase() : true)
      );

      if (exists) {
        showToast("Bu alan/dal zaten kayıtlı.", "warning");
        return;
      }

      skillState.fields.push({
        id: "field_" + Math.random().toString(36).substr(2, 9),
        area: areaVal,
        branch: branchVal
      });

      saveSkillState();
      
      if (newAreaInput) newAreaInput.value = "";
      if (newBranchInput) newBranchInput.value = "";

      showToast("Yeni alan/dal başarıyla eklendi.");
      renderFieldSelectorList();
    });
  }
}

// Populate the student form field list on load
loadAlanDalListesi().then(populateStudentAlanDalDatalist);

// Universal select-all togglers for all tables/grids
document.addEventListener("change", (e) => {
  if (!e.target) return;
  if (e.target.id === "skillSchoolSelectAll") {
    const isChecked = e.target.checked;
    document.getElementById("skillSchoolTable")?.querySelectorAll("[data-skill-select-school]").forEach(cb => cb.checked = isChecked);
    updateSkillSchoolActionState?.();
  }
  else if (e.target.id === "skillTeacherSelectAll") {
    const isChecked = e.target.checked;
    document.getElementById("skillTeacherTable")?.querySelectorAll("[data-skill-select-teacher]").forEach(cb => cb.checked = isChecked);
    updateSkillTeacherActionState?.();
  }
  else if (e.target.id === "skillFieldSelectAll") {
    const isChecked = e.target.checked;
    document.getElementById("skillFieldTable")?.querySelectorAll("[data-skill-select-field]").forEach(cb => cb.checked = isChecked);
    updateSkillFieldActionState?.();
  }
  else if (e.target.id === "skillBusinessSelectAll") {
    const isChecked = e.target.checked;
    els.skillBusinessTable?.querySelectorAll("[data-skill-select-business]").forEach(cb => cb.checked = isChecked);
    updateSkillBusinessActionState?.();
  }
  else if (e.target.id === "skillCoordinatorSelectAll") {
    const isChecked = e.target.checked;
    els.skillCoordinatorTable?.querySelectorAll("[data-skill-select-coordinator]").forEach(cb => cb.checked = isChecked);
    updateSkillCoordinatorActionState?.();
  }
  else if (e.target.id === "skillHolidaySelectAll") {
    const isChecked = e.target.checked;
    document.getElementById("skillHolidayTable")?.querySelectorAll("[data-skill-select-holiday]").forEach(cb => cb.checked = isChecked);
    updateSkillHolidayActionState?.();
  }
});

function initCoordinatorBulkActions() {
  const applyBtn = document.getElementById("skillCoordinatorBulkApplyBtn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const selectedCheckboxes = els.skillCoordinatorTable ? els.skillCoordinatorTable.querySelectorAll("[data-skill-select-coordinator]:checked") : [];
      const count = selectedCheckboxes.length;
      if (count === 0) return;

      const targetTeacher = els.skillCoordinatorTeacher?.value;
      const targetDay = els.skillCoordinatorDay?.value;
      const targetVice = els.skillCoordinatorDeputy?.value;

      if (!targetTeacher && !targetDay && !targetVice) {
        showToast("Lütfen yukarıdaki form alanlarından atanacak en az bir seçenek belirleyin (Öğretmen, Gün veya Müdür Yrd.).", "warning");
        return;
      }

      const ids = Array.from(selectedCheckboxes).map(cb => cb.value);

      let updatedCount = 0;
      skillState.coordinators.forEach(coord => {
        if (ids.includes(coord.id)) {
          if (targetTeacher) coord.teacher = targetTeacher;
          if (targetDay !== "") coord.day = parseInt(targetDay, 10);
          if (targetVice) coord.deputy = targetVice;
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        saveSkillState();
        renderSkillModule();
        showToast(`${updatedCount} koordinatör görevi seçilen bilgilerle toplu olarak güncellendi.`);
      }

      const selectAllCb = document.getElementById("skillCoordinatorSelectAll");
      if (selectAllCb) selectAllCb.checked = false;
      
      updateSkillCoordinatorActionState();
    });
  }
}

const skillTrainingModule = {
  get shell() {
    return els.skillShell;
  },
  get state() {
    return skillState;
  },
  render() {
    return renderSkillModule();
  },
  setView(view) {
    return setSkillView(view);
  },
  renderProfileButton() {
    return renderSkillProfileButton();
  }
};
window.AppModules.register("skill-training", skillTrainingModule);


// Student filter reset button & visibility sync
function syncSkillStudentFilterResetBtn() {
  const resetBtn = document.getElementById("skillStudentFilterResetBtn");
  if (!resetBtn) return;
  const hasFilter = Boolean(
    els.skillStudentSearch?.value?.trim() ||
    els.skillStudentClassFilter?.value ||
    els.skillStudentBusinessFilter?.value ||
    els.skillStudentStatusFilter?.value
  );
  resetBtn.style.display = hasFilter ? "inline-flex" : "none";
}

["input", "change"].forEach(evt => {
  els.skillStudentSearch?.addEventListener(evt, syncSkillStudentFilterResetBtn);
  els.skillStudentClassFilter?.addEventListener(evt, syncSkillStudentFilterResetBtn);
  els.skillStudentBusinessFilter?.addEventListener(evt, syncSkillStudentFilterResetBtn);
  els.skillStudentStatusFilter?.addEventListener(evt, syncSkillStudentFilterResetBtn);
});

document.getElementById("skillStudentFilterResetBtn")?.addEventListener("click", () => {
  if (els.skillStudentSearch) els.skillStudentSearch.value = "";
  if (els.skillStudentClassFilter) els.skillStudentClassFilter.value = "";
  if (els.skillStudentBusinessFilter) els.skillStudentBusinessFilter.value = "";
  if (els.skillStudentStatusFilter) els.skillStudentStatusFilter.value = "";
  syncSkillStudentFilterResetBtn();
  renderSkillStudents();
});

// Business, Coordinator, Holiday, School & Teacher filter bar events & reset buttons
function syncSkillMgmtFilterBars() {
  const bizReset = document.getElementById("skillBusinessFilterResetBtn");
  if (bizReset) {
    const hasBiz = Boolean(
      document.getElementById("skillBusinessSearch")?.value?.trim() ||
      document.getElementById("skillBusinessGroupFilter")?.value
    );
    bizReset.style.display = hasBiz ? "inline-flex" : "none";
  }

  const coordReset = document.getElementById("skillCoordinatorFilterResetBtn");
  if (coordReset) {
    const hasCoord = Boolean(
      document.getElementById("skillCoordinatorSearch")?.value?.trim() ||
      document.getElementById("skillCoordinatorDayFilter")?.value
    );
    coordReset.style.display = hasCoord ? "inline-flex" : "none";
  }

  const holReset = document.getElementById("skillHolidayFilterResetBtn");
  if (holReset) {
    const hasHol = Boolean(document.getElementById("skillHolidaySearch")?.value?.trim());
    holReset.style.display = hasHol ? "inline-flex" : "none";
  }

  const schoolReset = document.getElementById("skillSchoolFilterResetBtn");
  if (schoolReset) {
    const hasSchool = Boolean(
      document.getElementById("skillSchoolSearch")?.value?.trim() ||
      document.getElementById("skillSchoolTypeFilter")?.value
    );
    schoolReset.style.display = hasSchool ? "inline-flex" : "none";
  }

  const teacherReset = document.getElementById("skillTeacherFilterResetBtn");
  if (teacherReset) {
    const hasTeacher = Boolean(
      document.getElementById("skillTeacherSearch")?.value?.trim() ||
      document.getElementById("skillTeacherSchoolFilter")?.value
    );
    teacherReset.style.display = hasTeacher ? "inline-flex" : "none";
  }
}

["input", "change"].forEach((evt) => {
  document.getElementById("skillBusinessSearch")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillBusinesses?.();
  });
  document.getElementById("skillBusinessGroupFilter")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillBusinesses?.();
  });
  document.getElementById("skillCoordinatorSearch")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillCoordinators?.();
  });
  document.getElementById("skillCoordinatorDayFilter")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillCoordinators?.();
  });
  document.getElementById("skillHolidaySearch")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillHolidays?.();
  });
  document.getElementById("skillSchoolSearch")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillSchools?.();
  });
  document.getElementById("skillSchoolTypeFilter")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillSchools?.();
  });
  document.getElementById("skillTeacherSearch")?.addEventListener(evt, () => {
    syncSkillMgmtFilterBars();
    renderSkillTeachers?.();
  });
  document.getElementById("skillTeacherSchoolFilter")?.addEventListener(evt, () => {
    window.activeSchoolId = document.getElementById("skillTeacherSchoolFilter")?.value || "";
    syncSkillMgmtFilterBars();
    renderSkillSchools?.();
    renderSkillTeachers?.();
  });
});

document.getElementById("skillBusinessFilterResetBtn")?.addEventListener("click", () => {
  const s = document.getElementById("skillBusinessSearch");
  const g = document.getElementById("skillBusinessGroupFilter");
  if (s) s.value = "";
  if (g) g.value = "";
  syncSkillMgmtFilterBars();
  renderSkillBusinesses?.();
});

document.getElementById("skillCoordinatorFilterResetBtn")?.addEventListener("click", () => {
  const s = document.getElementById("skillCoordinatorSearch");
  const d = document.getElementById("skillCoordinatorDayFilter");
  if (s) s.value = "";
  if (d) d.value = "";
  syncSkillMgmtFilterBars();
  renderSkillCoordinators?.();
});

document.getElementById("skillHolidayFilterResetBtn")?.addEventListener("click", () => {
  const s = document.getElementById("skillHolidaySearch");
  if (s) s.value = "";
  syncSkillMgmtFilterBars();
  renderSkillHolidays?.();
});

document.getElementById("skillSchoolFilterResetBtn")?.addEventListener("click", () => {
  const s = document.getElementById("skillSchoolSearch");
  const t = document.getElementById("skillSchoolTypeFilter");
  if (s) s.value = "";
  if (t) t.value = "";
  syncSkillMgmtFilterBars();
  renderSkillSchools?.();
});

document.getElementById("skillTeacherFilterResetBtn")?.addEventListener("click", () => {
  const s = document.getElementById("skillTeacherSearch");
  const f = document.getElementById("skillTeacherSchoolFilter");
  if (s) s.value = "";
  if (f) f.value = "";
  window.activeSchoolId = "";
  syncSkillMgmtFilterBars();
  renderSkillSchools?.();
  renderSkillTeachers?.();
});


// Dashboard Hızlı İşlemler & Aksiyonlu Metrik Kartları Delegated Handler
window.openSkillImportDialog = openSkillImportDialog;
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".stat-action-btn, .skill-quick-grid button");
  if (!btn) return;
  e.stopPropagation();
  const action = btn.dataset.skillAction;
  const target = btn.dataset.skillViewTarget;

  if (action === "add-student") {
    setSkillView("students");
    setTimeout(() => { if (typeof openSkillStudentDrawer === "function") openSkillStudentDrawer(); }, 120);
  } else if (action === "add-business") {
    setSkillView("businesses");
    setTimeout(() => { if (typeof openSkillBusinessDrawer === "function") openSkillBusinessDrawer(); }, 120);
  } else if (action === "add-coordinator") {
    setSkillView("coordinators");
    setTimeout(() => { if (typeof openSkillCoordinatorDrawer === "function") openSkillCoordinatorDrawer(); }, 120);
  } else if (action === "import-data") {
    if (typeof openSkillImportDialog === "function") openSkillImportDialog();
  } else if (target) {
    setSkillView(target);
  }
});
