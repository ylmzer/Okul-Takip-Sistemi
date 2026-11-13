function getSkillBusiness(id) {
  return skillState.businesses.find((business) => business.id === id);
}

function getSkillFieldLabel(field) {
  if (!field) return "";
  const area = String(field.area || "").trim();
  const branch = String(field.branch || "").trim();
  if (!area && !branch) return "";
  if (!branch || branch.toLocaleLowerCase("tr-TR") === "belirtilmedi") return area;
  if (!area || area.toLocaleLowerCase("tr-TR") === "belirtilmedi") return branch;
  return `${area} / ${branch}`;
}

function setSkillStudentDays(value = "") {
  if (els.skillStudentDays) els.skillStudentDays.value = value;
  const selectedDays = String(value).split(",").map((day) => day.trim()).filter(Boolean);
  els.skillStudentDayPicker?.querySelectorAll("[data-skill-student-day]").forEach((button) => {
    button.classList.toggle("is-active", selectedDays.includes(button.dataset.skillStudentDay));
  });
}

function selectedClassDays() {
  return Array.from(els.skillClassDayPicker?.querySelectorAll("[data-skill-class-day].is-active") || [])
    .map((button) => button.dataset.skillClassDay);
}

function normalizeSkillClass(value = "") {
  return String(value).trim().toLocaleLowerCase("tr-TR");
}

function getSkillStudentClassOptions() {
  const classMap = new Map();
  skillState.students.forEach((student) => {
    const className = String(student.className || "").trim();
    if (!className) return;
    const key = normalizeSkillClass(className);
    const current = classMap.get(key) || { name: className, count: 0 };
    current.count += 1;
    classMap.set(key, current);
  });
  return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name, "tr-TR", { numeric: true }));
}

function getStudentCountByClass(className) {
  const normalizedClass = normalizeSkillClass(className);
  if (!normalizedClass) return 0;
  return skillState.students.filter((student) => normalizeSkillClass(student.className) === normalizedClass).length;
}

function getClassDaysFromStudents(className) {
  const normalizedClass = normalizeSkillClass(className);
  const dayCounts = new Map();
  skillState.students.forEach((student) => {
    if (normalizeSkillClass(student.className) !== normalizedClass) return;
    const days = String(student.days || "").trim();
    if (!days) return;
    dayCounts.set(days, (dayCounts.get(days) || 0) + 1);
  });
  return Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function setSkillClassDayPickerDays(value = "") {
  const selectedDays = String(value).split(",").map((day) => day.trim()).filter(Boolean);
  els.skillClassDayPicker?.querySelectorAll("[data-skill-class-day]").forEach((button) => {
    button.classList.toggle("is-active", selectedDays.includes(button.dataset.skillClassDay));
  });
}

function updateSkillClassDaySummary() {
  if (!els.skillClassDayStudentCount || !els.skillClassDaySelect) return;
  const className = els.skillClassDaySelect.value;
  const count = getStudentCountByClass(className);
  els.skillClassDayStudentCount.textContent = className
    ? `${className} sınıfında ${count} öğrenci`
    : "Sınıf seçilmedi";
}

function getPreferredClassForDayDialog() {
  const selectedIds = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  const selectedClasses = selectedIds
    .map((id) => skillState.students.find((student) => student.id === id)?.className)
    .map((className) => String(className || "").trim())
    .filter(Boolean);
  const uniqueSelectedClasses = [...new Set(selectedClasses.map((className) => normalizeSkillClass(className)))];
  if (uniqueSelectedClasses.length === 1) return selectedClasses[0];
  return (els.skillStudentClass?.value || els.skillStudentClassFilter?.value || "").trim();
}

function renderSkillClassDayOptions(preferredClass = "") {
  if (!els.skillClassDaySelect) return;
  const classes = getSkillStudentClassOptions();
  els.skillClassDaySelect.innerHTML = [
    `<option value="">Sınıf seçiniz</option>`,
    ...classes.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)} (${item.count})</option>`)
  ].join("");
  const preferredKey = normalizeSkillClass(preferredClass);
  const matchedClass = classes.find((item) => normalizeSkillClass(item.name) === preferredKey)?.name || classes[0]?.name || "";
  els.skillClassDaySelect.value = matchedClass;
  els.skillClassDaySelect.disabled = !classes.length;
}

function openSkillClassDayDialog() {
  const classes = getSkillStudentClassOptions();
  if (!skillState.students.length) return showToast("Okul günü atamak için önce öğrenci ekleyin.", "warning");
  renderSkillClassDayOptions(getPreferredClassForDayDialog());
  
  const selectedIds = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  const targetSelect = document.getElementById("skillClassDayTarget");
  const selectedCountSpan = document.getElementById("skillClassDaySelectedCount");
  const selectContainer = document.getElementById("skillClassDaySelectContainer");
  
  if (selectedCountSpan) {
    selectedCountSpan.textContent = selectedIds.length;
  }
  
  if (targetSelect) {
    const selectedOption = targetSelect.querySelector('option[value="selected"]');
    if (selectedOption) {
      if (selectedIds.length > 0) {
        selectedOption.disabled = false;
        selectedOption.textContent = `Seçili Öğrencilere (${selectedIds.length} öğrenci)`;
        targetSelect.value = "selected";
        if (selectContainer) selectContainer.style.display = "none";
      } else {
        selectedOption.disabled = true;
        selectedOption.textContent = `Seçili Öğrencilere (Hiç öğrenci seçilmedi)`;
        targetSelect.value = "class";
        if (selectContainer) selectContainer.style.display = "block";
      }
    }
  }
  
  if (targetSelect && targetSelect.value === "class") {
    setSkillClassDayPickerDays(getClassDaysFromStudents(els.skillClassDaySelect?.value));
  } else {
    setSkillClassDayPickerDays([]);
  }
  updateSkillClassDaySummary();
  els.skillClassDayDialog?.showModal();
}

function closeSkillClassDayDialog() {
  if (els.skillClassDayDialog?.open) els.skillClassDayDialog.close();
}

function assignDaysToClass(event) {
  event.preventDefault();
  const targetSelect = document.getElementById("skillClassDayTarget");
  const target = targetSelect ? targetSelect.value : "class";
  const days = selectedClassDays();
  const daysStr = days.join(", ");
  
  if (target === "selected") {
    const selectedIds = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
    if (!selectedIds.length) return showToast("Okul günü atamak için öğrenci seçin.", "warning");
    
    skillState.students = skillState.students.map((student) => {
      if (selectedIds.includes(student.id)) {
        return { ...student, days: daysStr };
      }
      return student;
    });
    
    saveSkillState();
    closeSkillClassDayDialog();
    renderSkillModule();
    showToast(`Seçilen ${selectedIds.length} öğrenciye okul günü atandı.`);
  } else {
    const className = (els.skillClassDaySelect?.value || "").trim();
    if (!className) return showToast("Gün atamak için şube / sınıf seçin.", "warning");
    
    const normalizedClass = normalizeSkillClass(className);
    let updatedCount = 0;
    skillState.students = skillState.students.map((student) => {
      if (normalizeSkillClass(student.className) !== normalizedClass) return student;
      updatedCount += 1;
      return { ...student, days: daysStr };
    });
    
    if (!updatedCount) return showToast(`${className} şubesinde öğrenci bulunamadı.`, "warning");
    saveSkillState();
    closeSkillClassDayDialog();
    renderSkillModule();
    showToast(`${className} şubesindeki ${updatedCount} öğrenciye okul günü atandı.`);
  }
}

function getCurrentSkillHolidayYear() {
  return new Date().getFullYear();
}

function getSkillHolidayYear() {
  return Number(els.skillHolidayYear?.value) || getCurrentSkillHolidayYear();
}

function getSkillHolidayYears() {
  const currentYear = getCurrentSkillHolidayYear();
  const years = new Set([currentYear - 1, currentYear, currentYear + 1]);
  skillState.holidays.forEach((holiday) => {
    const year = Number(String(holiday.startDate || "").slice(0, 4));
    if (year) years.add(year);
  });
  return Array.from(years).sort((a, b) => a - b);
}

function getSkillHolidayPartLabel(part = "full") {
  return {
    full: "Tam gün",
    am: "Öğleden önce",
    pm: "Öğleden sonra"
  }[part] || "Tam gün";
}

function formatSkillDate(value = "") {
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return "";
  return `${day}.${month}.${year}`;
}

function getSkillHolidayDisplayDate(holiday) {
  const start = formatSkillDate(holiday.startDate);
  const end = formatSkillDate(holiday.endDate || holiday.startDate);
  return start === end ? start : `${start} - ${end}`;
}

function sortSkillHolidays(holidays) {
  return [...holidays].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
}

function getNextSkillHoliday() {
  const today = new Date().toISOString().slice(0, 10);
  return sortSkillHolidays(skillState.holidays || []).find((holiday) => String(holiday.endDate || holiday.startDate || "") >= today);
}

function getAutomaticSkillHolidays(year) {
  const fixedHolidays = [
    { startDate: `${year}-01-01`, endDate: `${year}-01-01`, name: "Yılbaşı" },
    { startDate: `${year}-04-23`, endDate: `${year}-04-23`, name: "Ulusal Egemenlik ve Çocuk Bayramı" },
    { startDate: `${year}-05-01`, endDate: `${year}-05-01`, name: "Emek ve Dayanışma Günü" },
    { startDate: `${year}-05-19`, endDate: `${year}-05-19`, name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
    { startDate: `${year}-07-15`, endDate: `${year}-07-15`, name: "Demokrasi ve Milli Birlik Günü" },
    { startDate: `${year}-08-30`, endDate: `${year}-08-30`, name: "Zafer Bayramı" },
    { startDate: `${year}-10-28`, endDate: `${year}-10-29`, startPart: "pm", endPart: "full", name: "Cumhuriyet Bayramı" }
  ];
  const yearSpecific = {
    2024: [
      { startDate: "2024-01-22", endDate: "2024-02-02", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2024-04-08", endDate: "2024-04-12", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2024-04-09", endDate: "2024-04-12", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2024-06-15", endDate: "2024-06-19", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" },
      { startDate: "2024-11-11", endDate: "2024-11-15", name: "MEB 1. dönem ara tatili", isSchoolBreak: true }
    ],
    2025: [
      { startDate: "2025-01-20", endDate: "2025-01-31", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2025-03-29", endDate: "2025-04-01", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2025-04-07", endDate: "2025-04-11", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2025-06-05", endDate: "2025-06-09", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" },
      { startDate: "2025-11-10", endDate: "2025-11-14", name: "MEB 1. dönem ara tatili", isSchoolBreak: true }
    ],
    2026: [
      { startDate: "2026-01-19", endDate: "2026-01-30", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2026-03-16", endDate: "2026-03-20", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2026-03-19", endDate: "2026-03-22", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2026-05-26", endDate: "2026-05-30", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" },
      { startDate: "2026-11-16", endDate: "2026-11-20", name: "MEB 1. dönem ara tatili", isSchoolBreak: true }
    ],
    2027: [
      { startDate: "2027-01-25", endDate: "2027-02-05", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2027-03-08", endDate: "2027-03-11", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2027-03-08", endDate: "2027-03-12", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2027-05-15", endDate: "2027-05-19", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" },
      { startDate: "2027-11-15", endDate: "2027-11-19", name: "MEB 1. dönem ara tatili", isSchoolBreak: true }
    ],
    2028: [
      { startDate: "2028-01-24", endDate: "2028-02-04", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2028-02-26", endDate: "2028-02-29", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2028-04-17", endDate: "2028-04-21", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2028-05-04", endDate: "2028-05-08", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" },
      { startDate: "2028-11-13", endDate: "2028-11-17", name: "MEB 1. dönem ara tatili", isSchoolBreak: true }
    ],
    2029: [
      { startDate: "2029-01-22", endDate: "2029-02-02", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2029-02-14", endDate: "2029-02-17", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2029-04-09", endDate: "2029-04-13", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2029-04-23", endDate: "2029-04-27", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" },
      { startDate: "2029-11-12", endDate: "2029-11-16", name: "MEB 1. dönem ara tatili", isSchoolBreak: true }
    ],
    2030: [
      { startDate: "2030-01-21", endDate: "2030-02-01", name: "MEB yarıyıl tatili", isSchoolBreak: true },
      { startDate: "2030-02-04", endDate: "2030-02-07", startPart: "pm", endPart: "full", name: "Ramazan Bayramı Tatili" },
      { startDate: "2030-04-08", endDate: "2030-04-12", name: "MEB 2. dönem ara tatili", isSchoolBreak: true },
      { startDate: "2030-04-13", endDate: "2030-04-17", startPart: "pm", endPart: "full", name: "Kurban Bayramı Tatili" },
      { startDate: "2030-11-11", endDate: "2030-11-15", name: "MEB 1. dönem ara tatili", isSchoolBreak: true }
    ]
  };
  const list = [...fixedHolidays, ...(yearSpecific[year] || [])].map((holiday) => ({
    id: uid("hol"),
    startPart: "full",
    endPart: "full",
    isSchoolBreak: false,
    ...holiday
  }));
  return list.sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
}

function renderSkillHolidayYears() {
  if (!els.skillHolidayYear) return;
  const currentValue = els.skillHolidayYear.value || String(getCurrentSkillHolidayYear());
  els.skillHolidayYear.innerHTML = getSkillHolidayYears().map((year) => `<option value="${year}">${year}</option>`).join("");
  els.skillHolidayYear.value = getSkillHolidayYears().includes(Number(currentValue)) ? currentValue : String(getCurrentSkillHolidayYear());
}

function clearSkillHolidayForm() {
  const year = getSkillHolidayYear();
  if (els.skillHolidayId) els.skillHolidayId.value = "";
  if (els.skillHolidayStartDate) els.skillHolidayStartDate.value = `${year}-01-01`;
  if (els.skillHolidayEndDate) els.skillHolidayEndDate.value = `${year}-01-01`;
  if (els.skillHolidayStartPart) els.skillHolidayStartPart.value = "full";
  if (els.skillHolidayEndPart) els.skillHolidayEndPart.value = "full";
  if (els.skillHolidayName) els.skillHolidayName.value = "";
  if (els.skillHolidaySchoolBreak) els.skillHolidaySchoolBreak.checked = false;
}

function renderSkillHolidays() {
  if (!els.skillHolidayTable) return;
  ensureSkillCollections();
  renderSkillHolidayYears();
  const year = getSkillHolidayYear();
  if (!els.skillHolidayStartDate?.value && !els.skillHolidayId?.value) clearSkillHolidayForm();
  const searchQuery = (document.getElementById("skillHolidaySearch")?.value || "").trim().toLocaleLowerCase("tr-TR");
  let rows = sortSkillHolidays(skillState.holidays.filter((holiday) => {
    if (!String(holiday.startDate || "").startsWith(`${year}-`)) return false;
    if (searchQuery) {
      const hay = [holiday.name, formatSkillDate(holiday.startDate), formatSkillDate(holiday.endDate)].join(" ").toLocaleLowerCase("tr-TR");
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  }));
  const sort = window.skillTableSort?.holidays;
  if (sort && sort.key) {
    rows.sort((a, b) => {
      let vA, vB;
      if (sort.key === "index") {
        vA = skillState.holidays.indexOf(a);
        vB = skillState.holidays.indexOf(b);
      } else if (sort.key === "startDate") {
        vA = a.startDate; vB = b.startDate;
      } else if (sort.key === "endDate") {
        vA = a.endDate || a.startDate; vB = b.endDate || b.startDate;
      } else if (sort.key === "isSchoolBreak") {
        vA = Boolean(a.isSchoolBreak); vB = Boolean(b.isSchoolBreak);
      } else if (sort.key === "startPart") {
        vA = a.startPart; vB = b.startPart;
      } else if (sort.key === "endPart") {
        vA = a.endPart; vB = b.endPart;
      } else if (sort.key === "name") {
        vA = a.name; vB = b.name;
      }
      return compareSkillValues(vA, vB, sort.dir);
    });
  }
  els.skillHolidayTable.innerHTML = rows.length ? `
    <table class="skill-data-table skill-holiday-table">
      <thead>
        <tr>
          <th style="width: 38px;"><input type="checkbox" id="skillHolidaySelectAll" style="cursor: pointer;" title="Tümünü Seç" /></th>
          <th style="width: 48px;" class="skill-sort-col ${sort?.key === 'index' ? 'is-active' : ''}" data-sort-table="holidays" data-sort-key="index" title="Sıralamak için tıklayın">No ${getSkillSortIcon("holidays", "index")}</th>
          <th class="skill-sort-col ${sort?.key === 'startDate' ? 'is-active' : ''}" data-sort-table="holidays" data-sort-key="startDate" title="Sıralamak için tıklayın">Başlangıç ${getSkillSortIcon("holidays", "startDate")}</th>
          <th class="skill-sort-col ${sort?.key === 'endDate' ? 'is-active' : ''}" data-sort-table="holidays" data-sort-key="endDate" title="Sıralamak için tıklayın">Bitiş ${getSkillSortIcon("holidays", "endDate")}</th>
          <th class="skill-sort-col ${sort?.key === 'isSchoolBreak' ? 'is-active' : ''}" data-sort-table="holidays" data-sort-key="isSchoolBreak" title="Sıralamak için tıklayın">Ara Tatil / Yarıyıl ${getSkillSortIcon("holidays", "isSchoolBreak")}</th>
          <th class="skill-sort-col ${sort?.key === 'startPart' ? 'is-active' : ''}" data-sort-table="holidays" data-sort-key="startPart" title="Sıralamak için tıklayın">Başlangıç Dilimi ${getSkillSortIcon("holidays", "startPart")}</th>
          <th class="skill-sort-col ${sort?.key === 'endPart' ? 'is-active' : ''}" data-sort-table="holidays" data-sort-key="endPart" title="Sıralamak için tıklayın">Bitiş Dilimi ${getSkillSortIcon("holidays", "endPart")}</th>
          <th class="skill-sort-col ${sort?.key === 'name' ? 'is-active' : ''}" data-sort-table="holidays" data-sort-key="name" title="Sıralamak için tıklayın">Açıklama ${getSkillSortIcon("holidays", "name")}</th>
          <th class="skill-th-actions" style="width: 72px; text-align: center;">İşlem</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((holiday, index) => `
          <tr data-skill-edit-holiday="${holiday.id}">
            <td style="text-align: center;"><input type="checkbox" value="${holiday.id}" data-skill-select-holiday /></td>
            <td style="text-align: center;">${index + 1}</td>
            <td>${escapeHtml(formatSkillDate(holiday.startDate))}</td>
            <td>${escapeHtml(formatSkillDate(holiday.endDate || holiday.startDate))}</td>
            <td style="text-align: center;"><input type="checkbox" ${holiday.isSchoolBreak ? "checked" : ""} disabled /></td>
            <td>${escapeHtml(getSkillHolidayPartLabel(holiday.startPart))}</td>
            <td>${escapeHtml(getSkillHolidayPartLabel(holiday.endPart))}</td>
            <td>${escapeHtml(holiday.name || "-")}</td>
            <td style="text-align: center;">
              <span class="skill-row-actions" style="justify-content: center; gap: 6px;">
                <button type="button" class="skill-row-btn skill-btn-edit" data-skill-edit-holiday-btn="${holiday.id}" title="Tatili Düzenle">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button type="button" class="skill-row-btn skill-btn-delete" data-skill-delete-holiday-btn="${holiday.id}" title="Tatili Sil">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : `<div class="empty-state">Bu yıl için tatil kaydı yok. Otomatik çekebilir veya manuel ekleyebilirsiniz.</div>`;
  updateSkillHolidayActionState();
}

function openSkillHolidayDrawer(holidayOrId = null) {
  const drawer = document.getElementById("skillHolidayDrawer");
  const backdrop = document.getElementById("skillHolidayDrawerBackdrop");
  const title = document.getElementById("skillHolidayDrawerTitle");
  if (!drawer) return;
  const holiday = typeof holidayOrId === "string"
    ? skillState.holidays.find((item) => item.id === holidayOrId)
    : holidayOrId;

  if (holiday) {
    if (title) title.textContent = "Tatil Kaydını Düzenle";
    editSkillHoliday(holiday.id);
  } else {
    if (title) title.textContent = "Yeni Tatil Kaydı";
    clearSkillHolidayForm();
  }
  drawer.classList.add("is-open");
  if (backdrop) backdrop.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeSkillHolidayDrawer() {
  const drawer = document.getElementById("skillHolidayDrawer");
  const backdrop = document.getElementById("skillHolidayDrawerBackdrop");
  if (drawer) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (backdrop) {
    backdrop.classList.remove("is-open");
  }
}
window.openSkillHolidayDrawer = openSkillHolidayDrawer;
window.closeSkillHolidayDrawer = closeSkillHolidayDrawer;

function updateSkillHolidayActionState() {
  const ids = selectedSkillIds(els.skillHolidayTable, "[data-skill-select-holiday]");
  const bulkBar = document.getElementById("skillHolidayBulkBar");
  const countBadge = document.getElementById("skillHolidaySelectedCount");
  const totalBadge = document.getElementById("skillHolidayCountBadge");

  if (totalBadge) {
    const year = getSkillHolidayYear();
    const curYearCount = skillState.holidays.filter((h) => String(h.startDate || "").startsWith(`${year}-`)).length;
    totalBadge.textContent = `${curYearCount} Tatil`;
  }

  if (bulkBar) {
    if (ids.length > 0) {
      bulkBar.classList.add("is-visible");
      if (countBadge) countBadge.textContent = ids.length;
    } else {
      bulkBar.classList.remove("is-visible");
    }
  }

  if (els.skillHolidayTable) {
    els.skillHolidayTable.querySelectorAll("tbody tr").forEach((row) => {
      const cb = row.querySelector("input[type='checkbox']");
      row.classList.toggle("is-selected", !!cb?.checked);
    });
  }
}
window.updateSkillHolidayActionState = updateSkillHolidayActionState;

function saveSkillHoliday(event) {
  event.preventDefault();
  const startDate = els.skillHolidayStartDate?.value || "";
  const endDate = els.skillHolidayEndDate?.value || startDate;
  const name = (els.skillHolidayName?.value || "").trim();
  if (!startDate || !endDate || !name) return showToast("Tatil için tarih ve açıklama girin.", "warning");
  if (endDate < startDate) return showToast("Bitiş tarihi başlangıçtan önce olamaz.", "warning");
  const id = els.skillHolidayId?.value || uid("hol");
  const nextHoliday = {
    id,
    startDate,
    endDate,
    startPart: els.skillHolidayStartPart?.value || "full",
    endPart: els.skillHolidayEndPart?.value || "full",
    name,
    isSchoolBreak: Boolean(els.skillHolidaySchoolBreak?.checked)
  };
  const index = skillState.holidays.findIndex((holiday) => holiday.id === id);
  if (index >= 0) skillState.holidays[index] = nextHoliday;
  else skillState.holidays.push(nextHoliday);
  saveSkillState();
  clearSkillHolidayForm();
  closeSkillHolidayDrawer();
  renderSkillModule();
  showToast("Tatil kaydı kaydedildi.");
}

function fillAutomaticSkillHolidays() {
  const year = getSkillHolidayYear();
  const automaticHolidays = getAutomaticSkillHolidays(year);
  skillState.holidays = [
    ...skillState.holidays.filter((holiday) => !String(holiday.startDate || "").startsWith(`${year}-`)),
    ...automaticHolidays
  ];
  saveSkillState();
  clearSkillHolidayForm();
  renderSkillModule();
  showToast(`${year} yılı tatil kayıtları otomatik eklendi.`);
}

function editSkillHoliday(id) {
  const holiday = skillState.holidays.find((item) => item.id === id);
  if (!holiday) return;
  if (els.skillHolidayId) els.skillHolidayId.value = holiday.id;
  if (els.skillHolidayStartDate) els.skillHolidayStartDate.value = holiday.startDate || "";
  if (els.skillHolidayEndDate) els.skillHolidayEndDate.value = holiday.endDate || holiday.startDate || "";
  if (els.skillHolidayStartPart) els.skillHolidayStartPart.value = holiday.startPart || "full";
  if (els.skillHolidayEndPart) els.skillHolidayEndPart.value = holiday.endPart || "full";
  if (els.skillHolidayName) els.skillHolidayName.value = holiday.name || "";
  if (els.skillHolidaySchoolBreak) els.skillHolidaySchoolBreak.checked = Boolean(holiday.isSchoolBreak);
}

function handleSkillHolidayTableClick(event) {
  if (event.target.closest("input[type='checkbox']")) return;
  const editBtn = event.target.closest("[data-skill-edit-holiday-btn]");
  if (editBtn) {
    openSkillHolidayDrawer(editBtn.dataset.skillEditHolidayBtn);
    return;
  }
  const deleteBtn = event.target.closest("[data-skill-delete-holiday-btn]");
  if (deleteBtn) {
    const id = deleteBtn.dataset.skillDeleteHolidayBtn;
    if (confirm("Bu tatil kaydını silmek istediğinize emin misiniz?")) {
      skillState.holidays = skillState.holidays.filter((holiday) => holiday.id !== id);
      saveSkillState();
      renderSkillHolidays();
      showToast("Tatil kaydı silindi.");
    }
    return;
  }
  const row = event.target.closest("[data-skill-edit-holiday]");
  if (row) {
    openSkillHolidayDrawer(row.dataset.skillEditHoliday);
  }
}

function deleteSelectedSkillHolidays() {
  const ids = selectedSkillIds(els.skillHolidayTable, "[data-skill-select-holiday]");
  if (!ids.length) return showToast("Silmek için tatil kaydı seçin.", "warning");
  skillState.holidays = skillState.holidays.filter((holiday) => !ids.includes(holiday.id));
  saveSkillState();
  clearSkillHolidayForm();
  renderSkillModule();
  showToast("Seçili tatil kayıtları silindi.");
}

function deleteAllSkillHolidays() {
  skillState.holidays = [];
  saveSkillState();
  clearSkillHolidayForm();
  renderSkillModule();
  showToast("Tüm tatil kayıtları silindi.");
}

function getSkillDayName(day) {
  if (day === undefined || day === null || day === "") return "";
  const str = String(day).trim();
  const map = {
    "1": "Pazartesi",
    "2": "Salı",
    "3": "Çarşamba",
    "4": "Perşembe",
    "5": "Cuma",
    "6": "Cumartesi",
    "7": "Pazar",
    "0": "Pazar"
  };
  if (map[str]) return map[str];
  const trLower = str.toLocaleLowerCase("tr-TR");
  if (trLower.includes("pazar") && !trLower.includes("pazartesi")) return "Pazar";
  if (trLower.includes("pazartesi")) return "Pazartesi";
  if (trLower.includes("salı") || trLower.includes("sali")) return "Salı";
  if (trLower.includes("çarşamba") || trLower.includes("carsamba")) return "Çarşamba";
  if (trLower.includes("perşembe") || trLower.includes("persembe")) return "Perşembe";
  if (trLower.includes("cuma")) return "Cuma";
  if (trLower.includes("cumartesi")) return "Cumartesi";
  return str;
}

function setSkillView(view) {
  skillState.activeView = view;
  saveSkillState();
  els.skillNavButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.skillView === view);
  });
  if (els.skillNavMobileSelect) {
    els.skillNavMobileSelect.value = view;
  }
  const dataViews = ["school", "businesses", "fields", "coordinators", "students", "holidays"];
  const dataMenuButton = document.querySelector(".skill-nav-parent");
  if (dataMenuButton) dataMenuButton.classList.toggle("is-active", dataViews.includes(view));
  els.skillViewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.skillPanel === view);
  });
  const titles = {
    dashboard: `Hoş geldin, ${(localSession?.name || "Kullanıcı").split(" ")[0].toLocaleUpperCase("tr-TR")}`,
    students: "Öğrenciler",
    businesses: "İşletmeler",
    coordinators: "Koordinatör Tanımlama",
    reports: "Raporlar",
    school: "Okul & Koordinatörler",
    fields: "Alan / Dal",
    holidays: "Resmi Tatiller"
  };
  if (els.skillPageTitle) els.skillPageTitle.textContent = titles[view] || "İme Evrak";
}

