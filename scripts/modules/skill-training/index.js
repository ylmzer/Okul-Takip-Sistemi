/* ==========================================================================
   İŞLETMELERDE BECERİ EĞİTİMİ MODÜLÜ - EKRAN BAĞLARI VE ETKİLEŞİMLER
   ========================================================================== */

let alanDalListesi = null;
let importSchoolType = "existing";
let importSchoolExistingId = "";
let importSchoolNewName = "";

els.skillModuleSwitchBtn?.addEventListener("click", returnToModuleHub);

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
  
  if (hasRecords) {
    bulkBar.style.display = "flex";
    const bulkText = document.getElementById("skillImportBulkText");
    if (bulkText) {
      if (checkedCount > 0) {
        bulkText.textContent = " öğrenci seçildi. Seçililere uygulanacak işlemler:";
        if (selectedCountSpan) {
          selectedCountSpan.textContent = checkedCount;
          selectedCountSpan.style.display = "inline-flex";
        }
      } else {
        bulkText.textContent = "Toplu İşlemler (Lütfen listeden öğrenci seçin):";
        if (selectedCountSpan) {
          selectedCountSpan.style.display = "none";
        }
      }
    }
    
    // Enable/disable actions
    const hasSelection = checkedCount > 0;
    const elementsToDisable = [
      document.getElementById("skillImportBulkFieldInput"),
      document.getElementById("skillImportBulkDaySelect"),
      document.getElementById("skillImportBulkApplyBtn"),
      document.getElementById("skillImportBulkClearBtn")
    ];
    
    elementsToDisable.forEach(el => {
      if (el) {
        el.disabled = !hasSelection;
        if (!hasSelection) {
          el.style.opacity = "0.5";
          el.style.cursor = "not-allowed";
        } else {
          el.style.opacity = "1";
          el.style.cursor = "";
        }
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
  
  const schoolTypeSelect = document.getElementById("skillImportSchoolType");
  const schoolType = schoolTypeSelect ? schoolTypeSelect.value : "mesem";
  
  const typeList = alanDalListesi[schoolType] || {};
  
  // Update the datalist options
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
  
  let html = "";
  parsedImportRecords.forEach((r, idx) => {
    if (!r.originalField) {
      r.originalField = r.field;
    }
    const matchedField = findClosestMatch(r.originalField, schoolType);
    r.field = matchedField;
    
    // Autocomplete datalist input instead of dropdown select
    let fieldInputHtml = `
      <input class="import-field-input" type="text" list="importAlanDalList" data-index="${idx}" value="${escapeHtml(r.field)}" placeholder="Alan/Dal ara..." style="padding: 2px 6px !important; border-radius: 6px !important; border: 1px solid var(--line) !important; background: var(--surface) !important; color: var(--ink) !important; width: 100% !important; max-width: 360px !important; font-size: 0.78rem !important; height: 26px !important; outline: none !important; box-sizing: border-box !important; margin: 0 !important;" />
    `;
    
    const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
    let daySelectHtml = `<select class="import-coord-day-select" data-index="${idx}" style="padding: 2px 4px !important; font-size: 0.75rem !important; border-radius: 4px !important; border: 1px solid var(--line) !important; background: var(--surface) !important; color: var(--ink) !important; margin: 0 !important; height: 24px !important; outline: none !important; cursor: pointer !important; max-width: 120px !important; flex-shrink: 0 !important;">`;
    daySelectHtml += `<option value="">Gün Seçin</option>`;
    for (const d of days) {
      const isSelected = r.coord_day === d;
      daySelectHtml += `<option value="${d}" ${isSelected ? "selected" : ""}>${d}</option>`;
    }
    daySelectHtml += `</select>`;
    
    const isChecked = r.selected ? "checked" : "";
    
    html += `
      <tr style="height: 34px !important;">
        <td style="text-align: center !important; padding: 3px 4px !important; vertical-align: middle !important;">
          <input type="checkbox" class="import-row-checkbox" data-index="${idx}" ${isChecked} style="cursor: pointer; width: 15px; height: 15px; margin: 0; vertical-align: middle;" />
        </td>
        <td style="padding: 3px 6px !important; vertical-align: middle !important;">${escapeHtml(r.student_no || "-")}</td>
        <td style="padding: 3px 6px !important; vertical-align: middle !important;"><strong>${escapeHtml(r.student_name || "-")}</strong></td>
        <td style="padding: 3px 6px !important; vertical-align: middle !important;">${escapeHtml(r.class_name || "-")}</td>
        <td style="padding: 3px 6px !important; vertical-align: middle !important;">${fieldInputHtml}</td>
        <td style="padding: 3px 6px !important; vertical-align: middle !important; font-size: 0.78rem !important; max-width: 250px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;" title="${escapeHtml(r.business_name || "")}">${escapeHtml(r.business_name || "-")}</td>
        <td style="padding: 3px 6px !important; vertical-align: middle !important;">
          <div style="display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 8px !important; width: 100% !important;">
            <span style="font-weight: 700; white-space: nowrap !important; font-size: 0.8rem !important;">${escapeHtml(r.coordinator_name || "-")}</span>
            ${daySelectHtml}
          </div>
        </td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = html;
  
  // Uncheck select all checkbox and reset bulk bar state
  const selectAllCheckbox = document.getElementById("skillImportSelectAll");
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
  updateBulkActionsBar();
}

async function analyzeImeImportFile(file) {
  if (!file) return;
  const prevBtn = document.getElementById("skillImportPrevBtn");
  
  if (els.skillImportPreviewArea) els.skillImportPreviewArea.style.display = "flex";
  if (els.skillImportPreviewTable) {
    els.skillImportPreviewTable.innerHTML = `
      <tr>
        <td colspan="7" style="padding: 0; border: none; display: table-cell;">
          <div class="skill-import-loading">
            <div class="skill-import-loading-spinner"></div>
            <span>Dosya analiz ediliyor, lütfen bekleyin...</span>
          </div>
        </td>
      </tr>
    `;
  }
  if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = true;
  if (els.skillImportStats) els.skillImportStats.textContent = "";
  
  try {
    // Load Alan/Dal list from JSON before rendering preview
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
            <td colspan="6" style="text-align: center; padding: 20px; color: var(--danger);">
              Seçilen dosyada geçerli öğrenci veya işletme verisi bulunamadı.
            </td>
          </tr>
        `;
      }
      if (els.skillImportStats) els.skillImportStats.textContent = "Sonuç: 0 kayıt bulundu.";
      return;
    }
    
    const uniqueStudents = new Set(parsedImportRecords.map(r => r.student_name).filter(Boolean));
    const uniqueBusinesses = new Set(parsedImportRecords.map(r => r.business_name).filter(Boolean));
    const uniqueTeachers = new Set(parsedImportRecords.map(r => r.coordinator_name).filter(Boolean));
    
    if (els.skillImportStats) {
      els.skillImportStats.innerHTML = `
        <span>Öğrenci: <strong style="color:var(--accent); font-size: 0.9rem;">${uniqueStudents.size}</strong></span>
        <span style="color: var(--line);">|</span>
        <span>İşletme: <strong style="color:var(--accent); font-size: 0.9rem;">${uniqueBusinesses.size}</strong></span>
        <span style="color: var(--line);">|</span>
        <span>Öğretmen: <strong style="color:var(--accent); font-size: 0.9rem;">${uniqueTeachers.size}</strong></span>
      `;
    }
    
    // Render the interactive preview table using loaded lists and selections
    renderImportPreviewTable();
    
    if (els.skillImportSaveBtn) els.skillImportSaveBtn.disabled = false;
    
  } catch (error) {
    showToast(`Analiz hatası: ${error.message}`, "error");
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

function saveImeImportedData(event) {
  event.preventDefault();
  
  if (activeImportTab === "sqlite") {
    if (!parsedImportSqliteData) return;
    
    // Replace active profile state collections
    skillState.school = parsedImportSqliteData.school || skillState.school;
    skillState.schoolRecords = parsedImportSqliteData.schoolRecords || [];
    skillState.teacherPool = parsedImportSqliteData.teacherPool || [];
    skillState.fields = parsedImportSqliteData.fields || [];
    skillState.businesses = parsedImportSqliteData.businesses || [];
    skillState.students = parsedImportSqliteData.students || [];
    skillState.coordinators = parsedImportSqliteData.coordinators || [];
    skillState.holidays = parsedImportSqliteData.holidays || [];
    skillState.absenceRecords = parsedImportSqliteData.absenceRecords || {};
    
    saveSkillProfileStore();
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
    const schoolTypeSelect = document.getElementById("skillImportTypeSelect");
    const isLise = schoolTypeSelect ? schoolTypeSelect.value === "lise" : false;
    const newSchool = {
      id: activeSchoolId,
      name: importSchoolNewName,
      type: isLise ? "MTAL" : "MESEM",
      principal: "",
      deputy: ""
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
        deputy: ""
      };
      skillState.schoolRecords.push(newSchool);
      skillState.school = newSchool;
    }
  }

  let addedCount = 0;
  
  parsedImportRecords.forEach(rec => {
    let bizName = (rec.business_name || "Belirtilmedi").trim();
    let biz = skillState.businesses.find(b => b.name.toLowerCase() === bizName.toLowerCase());
    if (!biz) {
      biz = {
        id: uid("biz"),
        name: bizName,
        phone: rec.business_phone || "",
        address: rec.business_address || "",
        group: "1"
      };
      skillState.businesses.push(biz);
    } else {
      biz.phone = biz.phone || rec.business_phone || "";
      biz.address = biz.address || rec.business_address || "";
    }
    
    let teacherName = (rec.coordinator_name || "").trim().toUpperCase();
    if (teacherName) {
      let teacher = skillState.teacherPool.find(t => t.name.toLowerCase() === teacherName.toLowerCase());
      if (!teacher) {
        teacher = {
          id: uid("teacher"),
          name: teacherName
        };
        skillState.teacherPool.push(teacher);
      }
    }
    
    // Add selected Alan/Dal field to state fields list if not already present
    let fieldVal = (rec.field || "Belirtilmedi").trim();
    if (fieldVal && fieldVal !== "Belirtilmedi") {
      const parts = fieldVal.split("/");
      const area = parts[0]?.trim() || "Belirtilmedi";
      const branch = parts[1]?.trim() || "Belirtilmedi";
      
      if (!skillState.fields) skillState.fields = [];
      const fieldExists = skillState.fields.some(f => 
        f.area.toLowerCase() === area.toLowerCase() && 
        f.branch.toLowerCase() === branch.toLowerCase()
      );
      if (!fieldExists) {
        skillState.fields.push({
          id: uid("field"),
          area: area,
          branch: branch
        });
      }
    }

    let stuNo = (rec.student_no || "").trim();
    let stuName = (rec.student_name || "").trim();
    let student = skillState.students.find(s => 
      (stuNo && s.no === stuNo) || 
      (s.name.toLowerCase() === stuName.toLowerCase())
    );
    
    let days = rec.days || "Pzt, Sal";
    if (!student) {
      student = {
        id: uid("stu"),
        no: stuNo,
        name: stuName,
        className: rec.class_name || "12/A",
        field: fieldVal,
        businessId: biz.id,
        days: days,
        active: true
      };
      skillState.students.push(student);
      addedCount++;
    } else {
      student.no = stuNo || student.no;
      student.name = stuName || student.name;
      student.className = rec.class_name || student.className;
      student.field = fieldVal;
      student.businessId = biz.id;
      student.days = days;
    }
    
    if (teacherName) {
      let coord = skillState.coordinators.find(c => 
        c.teacher.toLowerCase() === teacherName.toLowerCase() && 
        c.businessId === biz.id &&
        c.schoolId === activeSchoolId
      );
      if (!coord) {
        coord = {
          id: uid("coord"),
          schoolId: activeSchoolId,
          teacher: teacherName,
          businessId: biz.id,
          day: rec.coord_day || ""
        };
        skillState.coordinators.push(coord);
      } else {
        coord.day = rec.coord_day || coord.day || "";
      }
    }
  });
  
  saveSkillProfileStore();
  saveState({ sync: true });
  renderSkillModule();
  
  showToast(`${addedCount} yeni öğrenci ve eşleştirmeleri sisteme aktarıldı.`, "success");
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

document.getElementById("skillImportBulkApplyBtn")?.addEventListener("click", () => {
  const bulkInput = document.getElementById("skillImportBulkFieldInput");
  const bulkDaySelect = document.getElementById("skillImportBulkDaySelect");
  
  const bulkField = bulkInput ? bulkInput.value.trim() : "";
  const bulkDay = bulkDaySelect ? bulkDaySelect.value : "";
  
  if (!bulkField && !bulkDay) {
    showToast("Lütfen toplu atanacak alan/dal veya ziyaret günü seçin.", "warning");
    return;
  }
  
  let appliedFieldCount = 0;
  let appliedDayCount = 0;
  
  parsedImportRecords.forEach((r, idx) => {
    if (r.selected) {
      if (bulkField) {
        r.field = bulkField;
        const inputEl = document.querySelector(`.import-field-input[data-index="${idx}"]`);
        if (inputEl) {
          inputEl.value = bulkField;
        }
        appliedFieldCount++;
      }
      
      if (bulkDay) {
        r.coord_day = bulkDay;
        const selectEl = document.querySelector(`.import-coord-day-select[data-index="${idx}"]`);
        if (selectEl) {
          selectEl.value = bulkDay;
        }
        appliedDayCount++;
        
        // Also sync day with other students of the same business (even if they are not selected)
        parsedImportRecords.forEach((rec, rIdx) => {
          if (rec.business_name === r.business_name) {
            rec.coord_day = bulkDay;
            const subSelectEl = document.querySelector(`.import-coord-day-select[data-index="${rIdx}"]`);
            if (subSelectEl) {
              subSelectEl.value = bulkDay;
            }
          }
        });
      }
    }
  });
  
  let msg = [];
  if (appliedFieldCount > 0) msg.push(`${appliedFieldCount} öğrenciye Alan/Dal`);
  if (appliedDayCount > 0) msg.push(`${appliedDayCount} öğrenciye Ziyaret Günü`);
  showToast(`${msg.join(" ve ")} toplu atandı.`, "success");
  
  parsedImportRecords.forEach(r => r.selected = false);
  if (bulkInput) bulkInput.value = "";
  if (bulkDaySelect) bulkDaySelect.value = "";
  document.querySelectorAll(".import-row-checkbox").forEach(cb => cb.checked = false);
  const selectAllCheckbox = document.getElementById("skillImportSelectAll");
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
  
  updateBulkActionsBar();
});

document.getElementById("skillImportBulkClearBtn")?.addEventListener("click", () => {
  parsedImportRecords.forEach(r => r.selected = false);
  const bulkInput = document.getElementById("skillImportBulkFieldInput");
  const bulkDaySelect = document.getElementById("skillImportBulkDaySelect");
  if (bulkInput) bulkInput.value = "";
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
          if (selectEl) {
            selectEl.value = selectedDay;
          }
        }
      });
    }
  }
});

document.getElementById("skillImportPreviewTable")?.addEventListener("input", (e) => {
  if (e.target.classList.contains("import-field-input")) {
    const idx = parseInt(e.target.dataset.index);
    if (parsedImportRecords[idx]) {
      parsedImportRecords[idx].field = e.target.value;
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
if (els.skillReportAssignmentList) els.skillReportAssignmentList.addEventListener("change", runSkillReportPrecheck);
els.skillReportTabs?.forEach((button) => {
  button.addEventListener("click", () => setSkillReportType(button.dataset.skillReportTab));
});
if (els.skillReportMobileSelect) {
  els.skillReportMobileSelect.addEventListener("change", (e) => setSkillReportType(e.target.value));
}
if (els.skillReportMonthSelect) {
  els.skillReportMonthSelect.addEventListener("change", () => {
    setCheckedSkillReportRange("month");
    syncSkillReportMonthDates();
    setSkillReportDateInputsEnabled(false);
    runSkillReportPrecheck();
  });
}
if (els.skillReportPrevMonthBtn) els.skillReportPrevMonthBtn.addEventListener("click", () => moveSkillReportMonth(-1));
if (els.skillReportNextMonthBtn) els.skillReportNextMonthBtn.addEventListener("click", () => moveSkillReportMonth(1));
document.querySelectorAll('input[name="skillReportRange"]').forEach((input) => {
  input.addEventListener("change", syncSkillReportRange);
});
if (els.skillReportStartDate) els.skillReportStartDate.addEventListener("change", runSkillReportPrecheck);
if (els.skillReportEndDate) els.skillReportEndDate.addEventListener("change", runSkillReportPrecheck);
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
if (els.skillReportPrintBtn) els.skillReportPrintBtn.addEventListener("click", printSkillAbsenceReport);
if (els.skillReportShareBtn) els.skillReportShareBtn.addEventListener("click", shareSkillReport);
if (els.skillReportZoomInBtn) els.skillReportZoomInBtn.addEventListener("click", () => zoomSkillReport(0.1));
if (els.skillReportZoomOutBtn) els.skillReportZoomOutBtn.addEventListener("click", () => zoomSkillReport(-0.1));

els.skillStudentForm.addEventListener("submit", saveSkillStudent);
els.skillBusinessForm.addEventListener("submit", saveSkillBusiness);
els.skillCoordinatorForm.addEventListener("submit", saveSkillCoordinator);
els.skillClearStudentBtn.addEventListener("click", clearSkillStudentForm);
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
  
  // Initialize the custom autocomplete element
  initStudentAlanDalAutocomplete();
}

function initStudentAlanDalAutocomplete() {
  const input = document.getElementById("skillStudentField");
  const dropdown = document.getElementById("skillStudentFieldDropdown");
  if (!input || !dropdown) return;

  let activeIndex = -1;
  let visibleSuggestions = [];

  function getCombinedFields() {
    const localFields = Array.isArray(skillState.fields) ? skillState.fields : [];
    const union = new Set([...localFields, ...allAlanDalSuggestions]);
    return Array.from(union);
  }

  function renderSuggestions(filterText = "") {
    const term = filterText.trim().toLocaleLowerCase("tr-TR");
    const combined = getCombinedFields();
    
    // Filter matches
    let matches = [];
    if (term === "") {
      matches = combined.slice(0, 150);
    } else {
      matches = combined.filter(opt => opt.toLocaleLowerCase("tr-TR").includes(term));
    }
    
    // Sort and limit to 40 items
    matches = matches.slice(0, 40);
    
    visibleSuggestions = matches.map(text => ({ type: "suggestion", value: text }));
    
    // Add custom "add-new" action if typed value doesn't exactly match and isn't empty
    const typedOriginal = filterText.trim();
    if (typedOriginal && !combined.some(opt => opt.toLocaleLowerCase("tr-TR") === term)) {
      visibleSuggestions.push({
        type: "add-new",
        value: typedOriginal,
        label: `+ "${typedOriginal}" Alanını Yeni Ekle`
      });
    }
    
    // Add manage redirect action
    visibleSuggestions.push({
      type: "manage",
      value: "",
      label: "⚙ Alan/Dalları Yönet"
    });
    
    if (visibleSuggestions.length === 0) {
      dropdown.style.display = "none";
      return;
    }
    
    // Render list
    dropdown.innerHTML = visibleSuggestions.map((item, idx) => {
      let cssClass = "autocomplete-item";
      let content = "";
      
      if (item.type === "add-new") {
        cssClass += " autocomplete-action-item add-new";
        content = `<span>${escapeHtml(item.label)}</span>`;
      } else if (item.type === "manage") {
        cssClass += " autocomplete-action-item manage";
        content = `<span>${escapeHtml(item.label)}</span>`;
      } else {
        if (term !== "") {
          const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi");
          const highlighted = escapeHtml(item.value).replace(regex, "<strong>$1</strong>");
          content = `<span>${highlighted}</span>`;
        } else {
          content = `<span>${escapeHtml(item.value)}</span>`;
        }
      }
      
      const isActive = idx === activeIndex ? " is-active" : "";
      return `<div class="${cssClass}${isActive}" data-index="${idx}">${content}</div>`;
    }).join("");
    
    dropdown.style.display = "block";
  }

  function selectItem(idx) {
    const item = visibleSuggestions[idx];
    if (!item) return;
    
    if (item.type === "add-new") {
      const val = item.value;
      if (!skillState.fields.includes(val)) {
        skillState.fields.push(val);
        saveSkillProfileStore();
      }
      input.value = val;
      showToast("Yeni alan/dal listeye eklendi.");
    } else if (item.type === "manage") {
      setSkillView("fields");
    } else {
      input.value = item.value;
    }
    
    dropdown.style.display = "none";
    activeIndex = -1;
  }

  // Input & Focus
  input.addEventListener("input", (e) => {
    activeIndex = -1;
    renderSuggestions(e.target.value);
  });

  input.addEventListener("focus", (e) => {
    e.target.select();
    renderSuggestions(e.target.value);
  });

  input.addEventListener("click", (e) => {
    e.target.select();
    renderSuggestions(e.target.value);
  });

  // Keyboard navigation
  input.addEventListener("keydown", (e) => {
    if (dropdown.style.display === "none" || visibleSuggestions.length === 0) {
      return;
    }
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % visibleSuggestions.length;
      renderSuggestions(input.value);
      
      const activeEl = dropdown.querySelector(".autocomplete-item.is-active");
      if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + visibleSuggestions.length) % visibleSuggestions.length;
      renderSuggestions(input.value);
      
      const activeEl = dropdown.querySelector(".autocomplete-item.is-active");
      if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < visibleSuggestions.length) {
        e.preventDefault();
        selectItem(activeIndex);
      }
    } else if (e.key === "Escape") {
      dropdown.style.display = "none";
      activeIndex = -1;
    }
  });

  // Click selection
  dropdown.addEventListener("click", (e) => {
    const itemEl = e.target.closest(".autocomplete-item");
    if (itemEl) {
      const idx = parseInt(itemEl.dataset.index, 10);
      selectItem(idx);
    }
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
      activeIndex = -1;
    }
  });
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

window.SkillTrainingModule = {
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
