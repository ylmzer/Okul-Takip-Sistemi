function selectedSkillIds(container, selector) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(`${selector}:checked`)).map((input) => input.value);
}

function syncTeacherSchoolOptions() {
  const filterSelect = document.getElementById("skillTeacherSchoolFilter");
  const drawerSelect = document.getElementById("skillTeacherSchool");
  const optionsHtml = [
    `<option value="">Tüm Okullar</option>`,
    ...skillState.schoolRecords.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
  ].join("");

  if (filterSelect) {
    const curVal = filterSelect.value;
    filterSelect.innerHTML = optionsHtml;
    if (window.activeSchoolId && skillState.schoolRecords.some((s) => s.id === window.activeSchoolId)) {
      filterSelect.value = curVal !== undefined && curVal !== "" ? curVal : window.activeSchoolId;
    } else {
      filterSelect.value = curVal || "";
    }
  }

  if (drawerSelect) {
    drawerSelect.innerHTML = [
      `<option value="">Genel / Okul Belirtilmedi</option>`,
      ...skillState.schoolRecords.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
    ].join("");
  }
}

function renderSkillSchools() {
  if (!els.skillSchoolTable) return;
  ensureSkillCollections();

  if (!window.activeSchoolId && skillState.schoolRecords.length > 0) {
    window.activeSchoolId = skillState.schoolRecords[0].id;
  }

  syncTeacherSchoolOptions();

  const sort = window.skillTableSort?.schools;
  const searchQuery = (document.getElementById("skillSchoolSearch")?.value || "").trim().toLocaleLowerCase("tr-TR");
  const typeFilter = document.getElementById("skillSchoolTypeFilter")?.value || "";
  let records = skillState.schoolRecords.filter((school) => {
    if (typeFilter && (school.schoolType || "mesem") !== typeFilter) return false;
    if (searchQuery) {
      const hay = [school.name, school.city, school.principal, school.deputy].join(" ").toLocaleLowerCase("tr-TR");
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });
  if (sort && sort.key) {
    records.sort((a, b) => {
      let vA, vB;
      if (sort.key === "index") {
        vA = skillState.schoolRecords.indexOf(a);
        vB = skillState.schoolRecords.indexOf(b);
      } else if (sort.key === "name") {
        vA = a.name; vB = b.name;
      } else if (sort.key === "city") {
        vA = a.city; vB = b.city;
      } else if (sort.key === "schoolType") {
        vA = a.schoolType; vB = b.schoolType;
      } else if (sort.key === "summerStartDate") {
        vA = a.summerStartDate; vB = b.summerStartDate;
      } else if (sort.key === "summerEndDate") {
        vA = a.summerEndDate; vB = b.summerEndDate;
      } else if (sort.key === "principal") {
        vA = a.principal; vB = b.principal;
      } else if (sort.key === "deputy") {
        vA = a.deputy; vB = b.deputy;
      }
      return compareSkillValues(vA, vB, sort.dir);
    });
  }
  updateSkillTableHeadIcons("schools");
  els.skillSchoolTable.innerHTML = records.map((school, index) => {
    const typeLabel = school.schoolType === "lise" ? "MTAL" : "MESEM";
    const startDateText = school.summerStartDate ? formatSkillDate(school.summerStartDate) : "-";
    const endDateText = school.summerEndDate ? formatSkillDate(school.summerEndDate) : "-";
    const isActive = school.id === window.activeSchoolId;
    return `
      <tr data-skill-edit-school="${school.id}" class="${isActive ? "is-active-school" : ""}" title="Bu okulun öğretmenlerini altta listelemek için tıklayın">
        <td style="text-align: center;"><input type="checkbox" value="${school.id}" data-skill-select-school /></td>
        <td style="text-align: center;">${index + 1}</td>
        <td>
          <strong>${escapeHtml(school.name || "Okul adı yok")}</strong>
          ${isActive ? '<span style="margin-left: 6px; font-size: 0.72rem; padding: 1px 5px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700;">Aktif</span>' : ''}
        </td>
        <td>${escapeHtml(school.city || "-")}</td>
        <td><span class="skill-badge-soft" style="padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; background: rgba(56, 189, 248, 0.12); color: #38bdf8;">${typeLabel}</span></td>
        <td>${startDateText}</td>
        <td>${endDateText}</td>
        <td>${escapeHtml(school.principal || "-")}</td>
        <td>${escapeHtml(school.deputy || "-")}</td>
        <td style="text-align: center;">
          <span class="skill-row-actions" style="justify-content: center; gap: 6px;">
            <button type="button" class="skill-row-btn skill-btn-edit" data-skill-edit-school-btn="${school.id}" title="Okulu Düzenle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button type="button" class="skill-row-btn skill-btn-delete" data-skill-delete-school-btn="${school.id}" title="Okulu Sil">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </span>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="10" class="empty-state">Okul kaydı bulunamadı.</td></tr>`;
  updateSkillSchoolActionState();
}

function renderSkillTeachers() {
  if (!els.skillTeacherTable) return;
  ensureSkillCollections();
  const sort = window.skillTableSort?.teachers;
  const searchQuery = (document.getElementById("skillTeacherSearch")?.value || "").trim().toLocaleLowerCase("tr-TR");
  const schoolFilter = document.getElementById("skillTeacherSchoolFilter")?.value || "";

  // Update section title based on school filter
  const activeSchool = skillState.schoolRecords.find((s) => s.id === schoolFilter);
  const sectionTitle = document.getElementById("skillTeacherSectionTitle");
  if (sectionTitle) {
    sectionTitle.textContent = activeSchool ? `${activeSchool.name} - Koordinatör Öğretmenleri` : "Koordinatör Öğretmenler";
  }

  let teachers = skillState.teacherPool.filter((teacher) => {
    if (schoolFilter) {
      if (teacher.schoolId && teacher.schoolId !== schoolFilter) return false;
      // If teacher has no schoolId assigned yet, but there is only 1 school in schoolRecords:
      if (!teacher.schoolId && skillState.schoolRecords.length > 1 && schoolFilter !== skillState.schoolRecords[0].id) {
        return false;
      }
    }
    if (searchQuery) {
      const hay = (teacher.name || "").toLocaleLowerCase("tr-TR");
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });
  if (sort && sort.key) {
    teachers.sort((a, b) => {
      let vA, vB;
      if (sort.key === "index") {
        vA = skillState.teacherPool.indexOf(a);
        vB = skillState.teacherPool.indexOf(b);
      } else if (sort.key === "name") {
        vA = a.name; vB = b.name;
      } else if (sort.key === "school") {
        const sA = skillState.schoolRecords.find((s) => s.id === a.schoolId)?.name || "";
        const sB = skillState.schoolRecords.find((s) => s.id === b.schoolId)?.name || "";
        vA = sA; vB = sB;
      }
      return compareSkillValues(vA, vB, sort.dir);
    });
  }
  updateSkillTableHeadIcons("teachers");
  els.skillTeacherTable.innerHTML = teachers.map((teacher, index) => {
    const teacherSchool = skillState.schoolRecords.find((s) => s.id === teacher.schoolId) || (skillState.schoolRecords.length === 1 ? skillState.schoolRecords[0] : null);
    const schoolLabel = teacherSchool ? escapeHtml(teacherSchool.name) : `<span style="opacity: 0.6; color: #94a3b8;">Genel / Belirtilmedi</span>`;
    return `
      <tr data-skill-edit-teacher="${teacher.id}">
        <td style="text-align: center;"><input type="checkbox" value="${teacher.id}" data-skill-select-teacher /></td>
        <td style="text-align: center;">${index + 1}</td>
        <td><strong>${escapeHtml(teacher.name || "Öğretmen adı yok")}</strong></td>
        <td>${schoolLabel}</td>
        <td style="text-align: center;">
          <span class="skill-row-actions" style="justify-content: center; gap: 6px;">
            <button type="button" class="skill-row-btn skill-btn-edit" data-skill-edit-teacher-btn="${teacher.id}" title="Öğretmeni Düzenle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button type="button" class="skill-row-btn skill-btn-delete" data-skill-delete-teacher-btn="${teacher.id}" title="Öğretmeni Sil">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </span>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5" class="empty-state">Bu okul için kayıtlı koordinatör öğretmen bulunamadı.</td></tr>`;
  updateSkillTeacherActionState();
}

function openSkillSchoolDrawer(schoolOrId = null) {
  const drawer = document.getElementById("skillSchoolDrawer");
  const backdrop = document.getElementById("skillSchoolDrawerBackdrop");
  const title = document.getElementById("skillSchoolDrawerTitle");
  if (!drawer) return;
  const school = typeof schoolOrId === "string"
    ? skillState.schoolRecords.find((s) => s.id === schoolOrId)
    : schoolOrId;

  if (school) {
    if (title) title.textContent = "Okul Kaydını Düzenle";
    if (els.skillSchoolId) els.skillSchoolId.value = school.id;
    if (els.skillSchoolName) els.skillSchoolName.value = school.name || "";
    if (els.skillSchoolCity) els.skillSchoolCity.value = school.city || "";
    if (els.skillSchoolPrincipal) els.skillSchoolPrincipal.value = school.principal || "";
    if (els.skillSchoolDeputy) els.skillSchoolDeputy.value = school.deputy || "";
    if (els.skillSchoolType) els.skillSchoolType.value = school.schoolType || "mesem";
    if (els.skillSchoolSummerStart) els.skillSchoolSummerStart.value = school.summerStartDate || "";
    if (els.skillSchoolSummerEnd) els.skillSchoolSummerEnd.value = school.summerEndDate || "";
  } else {
    if (title) title.textContent = "Yeni Okul Kaydı";
    clearSkillSchoolForm();
  }
  drawer.classList.add("is-open");
  if (backdrop) backdrop.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeSkillSchoolDrawer() {
  const drawer = document.getElementById("skillSchoolDrawer");
  const backdrop = document.getElementById("skillSchoolDrawerBackdrop");
  if (drawer) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (backdrop) {
    backdrop.classList.remove("is-open");
  }
}
window.openSkillSchoolDrawer = openSkillSchoolDrawer;
window.closeSkillSchoolDrawer = closeSkillSchoolDrawer;

function updateSkillSchoolActionState() {
  const ids = selectedSkillIds(els.skillSchoolTable, "[data-skill-select-school]");
  const bulkBar = document.getElementById("skillSchoolBulkBar");
  const countBadge = document.getElementById("skillSchoolSelectedCount");
  const totalBadge = document.getElementById("skillSchoolCountBadge");

  if (totalBadge) {
    totalBadge.textContent = `${skillState.schoolRecords.length} Okul`;
  }

  if (bulkBar) {
    if (ids.length > 0) {
      bulkBar.classList.add("is-visible");
      if (countBadge) countBadge.textContent = ids.length;
    } else {
      bulkBar.classList.remove("is-visible");
    }
  }

  if (els.skillSchoolTable) {
    els.skillSchoolTable.querySelectorAll("tr").forEach((row) => {
      const cb = row.querySelector("input[type='checkbox']");
      row.classList.toggle("is-selected", !!cb?.checked);
    });
  }
}
window.updateSkillSchoolActionState = updateSkillSchoolActionState;

function openSkillTeacherDrawer(teacherOrId = null) {
  const drawer = document.getElementById("skillTeacherDrawer");
  const backdrop = document.getElementById("skillTeacherDrawerBackdrop");
  const title = document.getElementById("skillTeacherDrawerTitle");
  const schoolSelect = document.getElementById("skillTeacherSchool");
  if (!drawer) return;
  const teacher = typeof teacherOrId === "string"
    ? skillState.teacherPool.find((t) => t.id === teacherOrId)
    : teacherOrId;

  if (teacher) {
    if (title) title.textContent = "Öğretmeni Düzenle";
    if (els.skillTeacherId) els.skillTeacherId.value = teacher.id;
    if (els.skillTeacherName) els.skillTeacherName.value = teacher.name || "";
    if (schoolSelect) schoolSelect.value = teacher.schoolId || "";
  } else {
    if (title) title.textContent = "Yeni Öğretmen Kaydı";
    clearSkillTeacherForm();
    const activeFilter = document.getElementById("skillTeacherSchoolFilter")?.value || window.activeSchoolId || "";
    if (schoolSelect && activeFilter) {
      schoolSelect.value = activeFilter;
    }
  }
  drawer.classList.add("is-open");
  if (backdrop) backdrop.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeSkillTeacherDrawer() {
  const drawer = document.getElementById("skillTeacherDrawer");
  const backdrop = document.getElementById("skillTeacherDrawerBackdrop");
  if (drawer) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (backdrop) {
    backdrop.classList.remove("is-open");
  }
}
window.openSkillTeacherDrawer = openSkillTeacherDrawer;
window.closeSkillTeacherDrawer = closeSkillTeacherDrawer;

function updateSkillTeacherActionState() {
  const ids = selectedSkillIds(els.skillTeacherTable, "[data-skill-select-teacher]");
  const bulkBar = document.getElementById("skillTeacherBulkBar");
  const countBadge = document.getElementById("skillTeacherSelectedCount");
  const totalBadge = document.getElementById("skillTeacherCountBadge");

  if (totalBadge) {
    const schoolFilter = document.getElementById("skillTeacherSchoolFilter")?.value || "";
    const activeCount = schoolFilter 
      ? skillState.teacherPool.filter(t => !t.schoolId || t.schoolId === schoolFilter).length
      : skillState.teacherPool.length;
    totalBadge.textContent = `${activeCount} Öğretmen`;
  }

  if (bulkBar) {
    if (ids.length > 0) {
      bulkBar.classList.add("is-visible");
      if (countBadge) countBadge.textContent = ids.length;
    } else {
      bulkBar.classList.remove("is-visible");
    }
  }

  if (els.skillTeacherTable) {
    els.skillTeacherTable.querySelectorAll("tr").forEach((row) => {
      const cb = row.querySelector("input[type='checkbox']");
      row.classList.toggle("is-selected", !!cb?.checked);
    });
  }
}
window.updateSkillTeacherActionState = updateSkillTeacherActionState;

function renderSkillFields() {
  if (!els.skillFieldTable) return;
  ensureSkillCollections();
  const sort = window.skillTableSort?.fields;
  let fields = [...skillState.fields];
  if (sort && sort.key) {
    fields.sort((a, b) => {
      let vA, vB;
      if (sort.key === "index") {
        vA = skillState.fields.indexOf(a);
        vB = skillState.fields.indexOf(b);
      } else if (sort.key === "area") {
        vA = a.area; vB = b.area;
      } else if (sort.key === "branch") {
        vA = a.branch; vB = b.branch;
      }
      return compareSkillValues(vA, vB, sort.dir);
    });
  }
  updateSkillTableHeadIcons("fields");
  els.skillFieldTable.innerHTML = fields.map((field, index) => `
    <tr data-skill-edit-field="${field.id}">
      <td><input type="checkbox" value="${field.id}" data-skill-select-field /></td>
      <td>${index + 1}</td>
      <td>${escapeHtml(field.area || "Belirtilmedi")}</td>
      <td>${escapeHtml(field.branch || "Belirtilmedi")}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">Alan / dal kaydı yok.</td></tr>`;
}

function clearSkillSchoolForm() {
  if (!els.skillSchoolId) return;
  els.skillSchoolId.value = "";
  els.skillSchoolName.value = "";
  els.skillSchoolCity.value = "";
  els.skillSchoolPrincipal.value = "";
  els.skillSchoolDeputy.value = "";
  if (els.skillSchoolType) els.skillSchoolType.value = "mesem";
  if (els.skillSchoolSummerStart) els.skillSchoolSummerStart.value = "";
  if (els.skillSchoolSummerEnd) els.skillSchoolSummerEnd.value = "";
}

function clearSkillTeacherForm() {
  if (!els.skillTeacherId) return;
  els.skillTeacherId.value = "";
  els.skillTeacherName.value = "";
  const schoolSelect = document.getElementById("skillTeacherSchool");
  if (schoolSelect) {
    const activeFilter = document.getElementById("skillTeacherSchoolFilter")?.value || window.activeSchoolId || "";
    schoolSelect.value = activeFilter;
  }
}

function clearSkillFieldForm() {
  if (!els.skillFieldId) return;
  els.skillFieldId.value = "";
  els.skillFieldArea.value = "";
  els.skillFieldBranch.value = "";
}

function saveSkillSchool(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  ensureSkillCollections();
  const name = els.skillSchoolName.value.trim();
  if (!name) return showToast("Okul adı girin.");
  const id = els.skillSchoolId.value || uid("school");
  const nextSchool = {
    id,
    name,
    city: els.skillSchoolCity.value.trim(),
    principal: els.skillSchoolPrincipal.value.trim(),
    deputy: els.skillSchoolDeputy.value.trim(),
    schoolType: els.skillSchoolType ? els.skillSchoolType.value : "mesem",
    summerStartDate: els.skillSchoolSummerStart ? els.skillSchoolSummerStart.value : "",
    summerEndDate: els.skillSchoolSummerEnd ? els.skillSchoolSummerEnd.value : ""
  };
  const index = skillState.schoolRecords.findIndex((school) => school.id === id);
  if (index >= 0) skillState.schoolRecords[index] = nextSchool;
  else skillState.schoolRecords.push(nextSchool);
  skillState.school.name = name;
  saveSkillState();
  clearSkillSchoolForm();
  closeSkillSchoolDrawer();
  renderSkillModule();
  showToast("Okul kaydedildi.");
}

function saveSkillTeacher(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  ensureSkillCollections();
  const name = els.skillTeacherName.value.trim();
  if (!name) return showToast("Koordinatör öğretmen adı girin.");
  const id = els.skillTeacherId.value || uid("teacher");
  const schoolId = document.getElementById("skillTeacherSchool")?.value || "";
  const previousTeacher = skillState.teacherPool.find((teacher) => teacher.id === id);
  const nextTeacher = { id, name, ...(schoolId ? { schoolId } : {}) };
  const index = skillState.teacherPool.findIndex((teacher) => teacher.id === id);
  if (index >= 0) skillState.teacherPool[index] = nextTeacher;
  else skillState.teacherPool.push(nextTeacher);
  if (previousTeacher?.name && previousTeacher.name !== name) {
    skillState.coordinators = skillState.coordinators.map((coordinator) => (
      coordinator.teacher === previousTeacher.name ? { ...coordinator, teacher: name } : coordinator
    ));
  }
  saveSkillState();
  clearSkillTeacherForm();
  closeSkillTeacherDrawer();
  renderSkillModule();
  showToast("Koordinatör öğretmen kaydedildi.");
}

function saveSkillField() {
  ensureSkillCollections();
  const area = els.skillFieldArea.value.trim();
  const branch = els.skillFieldBranch.value.trim();
  if (!area && !branch) return showToast("Alan veya dal bilgisi girin.");
  const id = els.skillFieldId.value || uid("field");
  const nextField = { id, area: area || "Belirtilmedi", branch: branch || "Belirtilmedi" };
  const index = skillState.fields.findIndex((field) => field.id === id);
  if (index >= 0) skillState.fields[index] = nextField;
  else skillState.fields.push(nextField);
  saveSkillState();
  clearSkillFieldForm();
  renderSkillModule();
  showToast("Alan / dal kaydedildi.");
}

function deleteSelectedSkillSchools() {
  const ids = selectedSkillIds(els.skillSchoolTable, "[data-skill-select-school]");
  if (!ids.length) return showToast("Silmek için okul seçin.");
  skillState.schoolRecords = skillState.schoolRecords.filter((school) => !ids.includes(school.id));
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !ids.includes(coordinator.schoolId));
  if (!skillState.schoolRecords.length) skillState.school.name = "Okul bilgisi girilmedi";
  saveSkillState();
  clearSkillSchoolForm();
  renderSkillModule();
}

function deleteSelectedSkillTeachers() {
  const ids = selectedSkillIds(els.skillTeacherTable, "[data-skill-select-teacher]");
  if (!ids.length) return showToast("Silmek için öğretmen seçin.");
  const teacherNames = skillState.teacherPool.filter((teacher) => ids.includes(teacher.id)).map((teacher) => teacher.name);
  skillState.teacherPool = skillState.teacherPool.filter((teacher) => !ids.includes(teacher.id));
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !teacherNames.includes(coordinator.teacher));
  saveSkillState();
  clearSkillTeacherForm();
  renderSkillModule();
}

function deleteSelectedSkillFields() {
  const ids = selectedSkillIds(els.skillFieldTable, "[data-skill-select-field]");
  if (!ids.length) return showToast("Silmek için alan / dal seçin.");
  skillState.fields = skillState.fields.filter((field) => !ids.includes(field.id));
  saveSkillState();
  clearSkillFieldForm();
  renderSkillModule();
}

function deleteAllSkillFields() {
  skillState.fields = [];
  saveSkillState();
  clearSkillFieldForm();
  renderSkillModule();
}

function handleSkillManagedTables(event) {
  const checkbox = event.target.closest("input[type='checkbox']");
  if (checkbox) return;

  const deleteSchoolBtn = event.target.closest("[data-skill-delete-school-btn]");
  if (deleteSchoolBtn) {
    const id = deleteSchoolBtn.dataset.skillDeleteSchoolBtn;
    if (confirm("Bu okulu silmek istediğinize emin misiniz?")) {
      skillState.schoolRecords = skillState.schoolRecords.filter((s) => s.id !== id);
      skillState.coordinators = skillState.coordinators.filter((c) => c.schoolId !== id);
      if (window.activeSchoolId === id) {
        window.activeSchoolId = skillState.schoolRecords[0]?.id || "";
      }
      if (!skillState.schoolRecords.length) skillState.school.name = "Okul bilgisi girilmedi";
      saveSkillState();
      renderSkillSchools();
      renderSkillTeachers();
      showToast("Okul silindi.");
    }
    return;
  }

  const editSchoolBtn = event.target.closest("[data-skill-edit-school-btn]");
  if (editSchoolBtn) {
    const id = editSchoolBtn.dataset.skillEditSchoolBtn;
    openSkillSchoolDrawer(id);
    return;
  }

  const schoolRow = event.target.closest("[data-skill-edit-school]");
  if (schoolRow) {
    const id = schoolRow.dataset.skillEditSchool;
    window.activeSchoolId = id;
    const filterSelect = document.getElementById("skillTeacherSchoolFilter");
    if (filterSelect) {
      filterSelect.value = id;
    }
    renderSkillSchools();
    renderSkillTeachers();
    return;
  }

  const deleteTeacherBtn = event.target.closest("[data-skill-delete-teacher-btn]");
  if (deleteTeacherBtn) {
    const id = deleteTeacherBtn.dataset.skillDeleteTeacherBtn;
    const teacher = skillState.teacherPool.find((t) => t.id === id);
    if (confirm(`"${teacher?.name || 'Bu öğretmeni'}" silmek istediğinize emin misiniz?`)) {
      skillState.teacherPool = skillState.teacherPool.filter((t) => t.id !== id);
      if (teacher?.name) {
        skillState.coordinators = skillState.coordinators.filter((c) => c.teacher !== teacher.name);
      }
      saveSkillState();
      renderSkillTeachers();
      showToast("Öğretmen silindi.");
    }
    return;
  }

  const editTeacherBtn = event.target.closest("[data-skill-edit-teacher-btn]");
  const teacherRow = event.target.closest("[data-skill-edit-teacher]");
  if (editTeacherBtn || teacherRow) {
    const id = editTeacherBtn?.dataset.skillEditTeacherBtn || teacherRow?.dataset.skillEditTeacher;
    openSkillTeacherDrawer(id);
    return;
  }

  const fieldRow = event.target.closest("[data-skill-edit-field]");
  if (fieldRow) {
    const field = skillState.fields.find((item) => item.id === fieldRow.dataset.skillEditField);
    if (!field) return;
    if (els.skillFieldId) els.skillFieldId.value = field.id;
    if (els.skillFieldArea) els.skillFieldArea.value = field.area || "";
    if (els.skillFieldBranch) els.skillFieldBranch.value = field.branch || "";
  }
}

function renderSkillSelects() {
  ensureSkillCollections();
  const businessOptions = [
    `<option value="">İşletme seçiniz</option>`,
    ...skillState.businesses.map((business) => `<option value="${business.id}">${escapeHtml(business.name)}</option>`)
  ].join("");
  if (els.skillStudentBusiness) els.skillStudentBusiness.innerHTML = businessOptions;
  if (els.skillStudentBusinessFilter) {
    els.skillStudentBusinessFilter.innerHTML = [
      `<option value="">Tüm işletmeler</option>`,
      ...skillState.businesses.map((business) => `<option value="${business.id}">${escapeHtml(business.name)}</option>`)
    ].join("");
  }
  if (els.skillStudentClassFilter) {
    const currentClassFilter = els.skillStudentClassFilter.value || "";
    const classOptions = getSkillStudentClassOptions();
    els.skillStudentClassFilter.innerHTML = [
      `<option value="">Tüm şubeler</option>`,
      ...classOptions.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)} (${item.count})</option>`)
    ].join("");
    els.skillStudentClassFilter.value = classOptions.some((item) => item.name === currentClassFilter) ? currentClassFilter : "";
  }
  // els.skillStudentField is now a datalist-based input, so we don't populate options here.
  if (els.skillCoordinatorBusiness) els.skillCoordinatorBusiness.innerHTML = businessOptions;
  const teacherOptions = [
    `<option value="">Öğretmen seçiniz</option>`,
    ...skillState.teacherPool.map((teacher) => `<option value="${escapeHtml(teacher.name)}">${escapeHtml(teacher.name)}</option>`)
  ].join("");
  if (els.skillCoordinatorTeacher) els.skillCoordinatorTeacher.innerHTML = teacherOptions;
  const schoolOptions = [
    `<option value="">Okul seçiniz</option>`,
    ...skillState.schoolRecords.map((school) => `<option value="${school.id}">${escapeHtml(school.name)}</option>`)
  ].join("");
  if (els.skillCoordinatorSchool) {
    els.skillCoordinatorSchool.innerHTML = schoolOptions;
    if (skillState.schoolRecords.length > 0) {
      els.skillCoordinatorSchool.value = skillState.schoolRecords[0].id;
    }
  }
  const deputies = skillState.schoolRecords.map((school) => school.deputy).filter(Boolean);
  const deputyOptions = [`<option value="">Müdür yardımcısı seçiniz</option>`, ...[...new Set(deputies)].map((deputy) => `<option value="${escapeHtml(deputy)}">${escapeHtml(deputy)}</option>`)].join("");
  if (els.skillCoordinatorDeputy) {
    els.skillCoordinatorDeputy.innerHTML = deputyOptions;
  }
  if (els.skillCoordinatorSchool && skillState.schoolRecords.length > 0) {
    els.skillCoordinatorSchool.dispatchEvent(new Event("change"));
  }
}

// Universal Table Sorting for Skill Module (Beceri Eğitimi)
const skillTableSort = {
  businesses: { key: "", dir: "asc" },
  students: { key: "", dir: "asc" },
  coordinators: { key: "", dir: "asc" },
  schools: { key: "", dir: "asc" },
  teachers: { key: "", dir: "asc" },
  fields: { key: "", dir: "asc" },
  holidays: { key: "", dir: "asc" },
  importPreview: { key: "", dir: "asc" }
};
window.skillTableSort = skillTableSort;

function compareSkillValues(valA, valB, dir = "asc") {
  if (valA === undefined || valA === null) valA = "";
  if (valB === undefined || valB === null) valB = "";
  
  if (typeof valA === "boolean" || typeof valB === "boolean") {
    const numA = valA ? 1 : 0;
    const numB = valB ? 1 : 0;
    return dir === "asc" ? numA - numB : numB - numA;
  }
  
  const numA = Number(valA);
  const numB = Number(valB);
  if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "" && typeof valA !== "boolean" && typeof valB !== "boolean") {
    return dir === "asc" ? numA - numB : numB - numA;
  }
  
  const strA = String(valA).trim();
  const strB = String(valB).trim();
  const res = strA.localeCompare(strB, "tr-TR", { numeric: true, sensitivity: "base" });
  return dir === "asc" ? res : -res;
}
window.compareSkillValues = compareSkillValues;

function getSkillSortIcon(tableKey, columnKey) {
  const current = window.skillTableSort?.[tableKey];
  const isActive = current && current.key === columnKey;
  if (!isActive) {
    return `<span class="skill-sort-indicator">⇅</span>`;
  }
  const arrow = current.dir === "asc" ? "▲" : "▼";
  return `<span class="skill-sort-indicator is-active">${arrow}</span>`;
}
window.getSkillSortIcon = getSkillSortIcon;

function toggleSkillTableSort(tableKey, columnKey) {
  const current = window.skillTableSort?.[tableKey];
  if (!current) return;
  if (current.key === columnKey) {
    current.dir = current.dir === "asc" ? "desc" : "asc";
  } else {
    current.key = columnKey;
    current.dir = "asc";
  }
  
  switch (tableKey) {
    case "businesses":
      renderSkillBusinesses();
      break;
    case "students":
      renderSkillStudents();
      break;
    case "coordinators":
      renderSkillCoordinators();
      break;
    case "schools":
      renderSkillSchools();
      break;
    case "teachers":
      renderSkillTeachers();
      break;
    case "fields":
      renderSkillFields();
      break;
    case "holidays":
      renderSkillHolidays();
      break;
    case "importPreview":
      if (typeof window.renderImportPreviewTable === "function") {
        window.renderImportPreviewTable();
      }
      break;
  }
}
window.toggleSkillTableSort = toggleSkillTableSort;

function updateSkillTableHeadIcons(tableKey) {
  const sort = window.skillTableSort?.[tableKey];
  if (!sort) return;
  document.querySelectorAll(`.skill-sort-col[data-sort-table="${tableKey}"]`).forEach(th => {
    const key = th.dataset.sortKey;
    const indicator = th.querySelector(".skill-sort-indicator");
    if (key === sort.key) {
      th.classList.add("is-active");
      if (indicator) {
        indicator.textContent = sort.dir === "asc" ? "▲" : "▼";
        indicator.classList.add("is-active");
      }
    } else {
      th.classList.remove("is-active");
      if (indicator) {
        indicator.textContent = "⇅";
        indicator.classList.remove("is-active");
      }
    }
  });
}
window.updateSkillTableHeadIcons = updateSkillTableHeadIcons;

// Global Delegated Click Listener for Table Headers
document.addEventListener("click", (e) => {
  if (e.target.closest("input[type='checkbox']")) return;
  const sortCol = e.target.closest(".skill-sort-col");
  if (!sortCol) return;
  const tableKey = sortCol.dataset.sortTable;
  const colKey = sortCol.dataset.sortKey;
  if (tableKey && colKey) {
    toggleSkillTableSort(tableKey, colKey);
  }
});

function formatSkillDayPills(daysStr) {
  if (!daysStr || !daysStr.trim() || daysStr.trim() === "-") {
    return `<span class="skill-day-empty">—</span>`;
  }
  const parts = daysStr.split(",").map(d => d.trim()).filter(Boolean);
  if (!parts.length) return `<span class="skill-day-empty">—</span>`;

  return parts.map(day => {
    const dLower = day.toLocaleLowerCase("tr-TR");
    let colorClass = "day-default";
    if (dLower.includes("pzt") || dLower.includes("pazartesi")) colorClass = "day-pzt";
    else if (dLower.includes("sal")) colorClass = "day-sal";
    else if (dLower.includes("çar") || dLower.includes("car") || dLower.includes("carsamba")) colorClass = "day-car";
    else if (dLower.includes("per") || dLower.includes("persembe")) colorClass = "day-per";
    else if (dLower.includes("cum") || dLower.includes("cuma")) colorClass = "day-cum";
    return `<span class="skill-day-pill ${colorClass}">${escapeHtml(day)}</span>`;
  }).join(" ");
}

function renderSkillStudents() {
  if (!els.skillStudentTable) return;
  const query = (els.skillStudentSearch?.value || "").toLocaleLowerCase("tr-TR");
  const classFilter = normalizeSkillClass(els.skillStudentClassFilter?.value || "");
  const businessFilter = els.skillStudentBusinessFilter?.value || "";
  const statusFilter = els.skillStudentStatusFilter?.value || "";
  const rows = skillState.students.filter((student) => {
    const business = getSkillBusiness(student.businessId);
    const matchesSearch = [student.no, student.name, student.className, student.field, business?.name]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query);
    const matchesClass = !classFilter || normalizeSkillClass(student.className) === classFilter;
    const matchesBusiness = !businessFilter || student.businessId === businessFilter;
    const matchesStatus = !statusFilter || (statusFilter === "active" ? student.active !== false : student.active === false);
    return matchesSearch && matchesClass && matchesBusiness && matchesStatus;
  });

  const sort = window.skillTableSort?.students;
  if (sort && sort.key) {
    rows.sort((a, b) => {
      let vA, vB;
      if (sort.key === "index") {
        vA = skillState.students.indexOf(a);
        vB = skillState.students.indexOf(b);
      } else if (sort.key === "active") {
        vA = a.active !== false; vB = b.active !== false;
      } else if (sort.key === "no") {
        vA = a.no; vB = b.no;
      } else if (sort.key === "name") {
        vA = a.name; vB = b.name;
      } else if (sort.key === "business") {
        vA = getSkillBusiness(a.businessId)?.name || "";
        vB = getSkillBusiness(b.businessId)?.name || "";
      } else if (sort.key === "field") {
        vA = a.field || ""; vB = b.field || "";
      } else if (sort.key === "className") {
        vA = a.className || ""; vB = b.className || "";
      } else if (sort.key === "days") {
        vA = a.days || ""; vB = b.days || "";
      }
      return compareSkillValues(vA, vB, sort.dir);
    });
  }

  const studentRows = rows.length ? rows.map((student, index) => {
    const business = getSkillBusiness(student.businessId);
    return `
      <div class="skill-row skill-grid-row skill-student-grid-row" data-skill-edit-student="${student.id}">
        <span><input type="checkbox" value="${student.id}" data-skill-select-student /></span>
        <span>${index + 1}</span>
        <span><span class="skill-status-dot ${student.active === false ? "is-passive" : ""}" title="${student.active === false ? "Pasif" : "Aktif"}"></span></span>
        <span>${escapeHtml(student.no || "-")}</span>
        <strong>${escapeHtml(student.name)}</strong>
        <span>${escapeHtml(business?.name || "İşletme yok")}</span>
        <span>${escapeHtml(student.field || "Alan / dal yok")}</span>
        <span>${escapeHtml(student.className || "-")}</span>
        <span class="skill-td-day">${formatSkillDayPills(student.days)}</span>
        <span class="skill-row-actions" style="justify-content: center; gap: 6px;">
          <button type="button" class="skill-row-btn skill-btn-edit" data-skill-edit-student="${student.id}" title="Öğrenciyi Düzenle">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="skill-row-btn skill-btn-delete" data-skill-delete-student="${student.id}" title="Öğrenciyi Sil">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </span>
      </div>
    `;
  }).join("") : `<div class="empty-state">Öğrenci kaydı bulunamadı.</div>`;
  els.skillStudentTable.innerHTML = `
    <div class="skill-grid-row skill-grid-head skill-student-grid-row">
      <span><input type="checkbox" id="skillStudentSelectAll" style="cursor: pointer;" /></span>
      <span class="skill-sort-col ${sort?.key === 'index' ? 'is-active' : ''}" data-sort-table="students" data-sort-key="index" title="Sıralamak için tıklayın">No ${getSkillSortIcon("students", "index")}</span>
      <span class="skill-sort-col ${sort?.key === 'active' ? 'is-active' : ''}" data-sort-table="students" data-sort-key="active" title="Sıralamak için tıklayın">Durum ${getSkillSortIcon("students", "active")}</span>
      <span class="skill-sort-col ${sort?.key === 'no' ? 'is-active' : ''}" data-sort-table="students" data-sort-key="no" title="Sıralamak için tıklayın">Okul no ${getSkillSortIcon("students", "no")}</span>
      <span class="skill-sort-col ${sort?.key === 'name' ? 'is-active' : ''}" data-sort-table="students" data-sort-key="name" title="Sıralamak için tıklayın">Ad soyad ${getSkillSortIcon("students", "name")}</span>
      <span class="skill-sort-col ${sort?.key === 'business' ? 'is-active' : ''}" data-sort-table="students" data-sort-key="business" title="Sıralamak için tıklayın">İşletme ${getSkillSortIcon("students", "business")}</span>
      <span class="skill-sort-col ${sort?.key === 'field' ? 'is-active' : ''}" data-sort-table="students" data-sort-key="field" title="Sıralamak için tıklayın">Alan / dal ${getSkillSortIcon("students", "field")}</span>
      <span class="skill-sort-col ${sort?.key === 'className' ? 'is-active' : ''}" data-sort-table="students" data-sort-key="className" title="Sıralamak için tıklayın">Sınıf ${getSkillSortIcon("students", "className")}</span>
      <span class="skill-sort-col ${sort?.key === 'days' ? 'is-active' : ''}" style="justify-content: center; text-align: center;" data-sort-table="students" data-sort-key="days" title="Sıralamak için tıklayın">Gün ${getSkillSortIcon("students", "days")}</span>
      <span class="skill-th-actions" style="justify-content: center; text-align: center;">İşlem</span>
    </div>
    ${studentRows}
  `;
  updateSkillStudentActionState();
}

function renderSkillBusinesses() {
  if (!els.skillBusinessTable) return;
  const sort = window.skillTableSort?.businesses;
  const searchQuery = (document.getElementById("skillBusinessSearch")?.value || "").trim().toLocaleLowerCase("tr-TR");
  const groupFilter = document.getElementById("skillBusinessGroupFilter")?.value || "";
  let businesses = skillState.businesses.filter((business) => {
    if (groupFilter && String(business.group || "1") !== groupFilter) return false;
    if (searchQuery) {
      const hay = [business.name, business.phone, business.address].join(" ").toLocaleLowerCase("tr-TR");
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });
  if (sort && sort.key) {
    businesses.sort((a, b) => {
      let vA, vB;
      if (sort.key === "index") {
        vA = skillState.businesses.indexOf(a);
        vB = skillState.businesses.indexOf(b);
      } else if (sort.key === "name") {
        vA = a.name; vB = b.name;
      } else if (sort.key === "phone") {
        vA = a.phone; vB = b.phone;
      } else if (sort.key === "group") {
        vA = a.group === "2" ? "20 ve üzeri" : "20'den az";
        vB = b.group === "2" ? "20 ve üzeri" : "20'den az";
      } else if (sort.key === "address") {
        vA = a.address; vB = b.address;
      }
      return compareSkillValues(vA, vB, sort.dir);
    });
  }

  const businessRows = businesses.length ? businesses.map((business, index) => `
    <div class="skill-row skill-grid-row skill-business-grid-row" data-skill-edit-business="${business.id}">
      <span><input type="checkbox" value="${business.id}" data-skill-select-business /></span>
      <span>${index + 1}</span>
      <strong>${escapeHtml(business.name)}</strong>
      <span>${escapeHtml(business.phone || "-")}</span>
      <span>${business.group === "2" ? "20 ve üzeri" : "20'den az"}</span>
      <small>${escapeHtml(business.address || "Adres belirtilmedi")}</small>
      <span class="skill-row-actions" style="justify-content: center; gap: 6px;">
        <button type="button" class="skill-row-btn skill-btn-edit" data-skill-edit-business="${business.id}" title="İşletmeyi Düzenle">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button type="button" class="skill-row-btn skill-btn-delete" data-skill-delete-business="${business.id}" title="İşletmeyi Sil">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      </span>
    </div>
  `).join("") : `<div class="empty-state">İşletme kaydı bulunamadı.</div>`;
  els.skillBusinessTable.innerHTML = `
    <div class="skill-grid-row skill-grid-head skill-business-grid-row">
      <span><input type="checkbox" id="skillBusinessSelectAll" style="cursor: pointer;" /></span>
      <span class="skill-sort-col ${sort?.key === 'index' ? 'is-active' : ''}" data-sort-table="businesses" data-sort-key="index" title="Sıralamak için tıklayın">No ${getSkillSortIcon("businesses", "index")}</span>
      <span class="skill-sort-col ${sort?.key === 'name' ? 'is-active' : ''}" data-sort-table="businesses" data-sort-key="name" title="Sıralamak için tıklayın">İşletme Adı ${getSkillSortIcon("businesses", "name")}</span>
      <span class="skill-sort-col ${sort?.key === 'phone' ? 'is-active' : ''}" data-sort-table="businesses" data-sort-key="phone" title="Sıralamak için tıklayın">Telefon ${getSkillSortIcon("businesses", "phone")}</span>
      <span class="skill-sort-col ${sort?.key === 'group' ? 'is-active' : ''}" data-sort-table="businesses" data-sort-key="group" title="Sıralamak için tıklayın">Çalışan ${getSkillSortIcon("businesses", "group")}</span>
      <span class="skill-sort-col ${sort?.key === 'address' ? 'is-active' : ''}" data-sort-table="businesses" data-sort-key="address" title="Sıralamak için tıklayın">Adres ${getSkillSortIcon("businesses", "address")}</span>
      <span class="skill-th-actions" style="justify-content: center; text-align: center;">İşlem</span>
    </div>
    ${businessRows}
  `;
  updateSkillBusinessActionState();
}

function renderSkillCoordinators() {
  if (!els.skillCoordinatorTable) return;
  ensureSkillCollections();
  const sort = window.skillTableSort?.coordinators;
  const searchQuery = (document.getElementById("skillCoordinatorSearch")?.value || "").trim().toLocaleLowerCase("tr-TR");
  const dayFilter = document.getElementById("skillCoordinatorDayFilter")?.value || "";
  let coordinators = skillState.coordinators.filter((coordinator) => {
    if (dayFilter === "none" && coordinator.day) return false;
    if (dayFilter && dayFilter !== "none" && String(coordinator.day || "") !== dayFilter) return false;
    if (searchQuery) {
      const business = getSkillBusiness(coordinator.businessId);
      const hay = [business?.name, business?.address, coordinator.teacher, coordinator.deputy, getSkillDayName(coordinator.day)].join(" ").toLocaleLowerCase("tr-TR");
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });
  if (sort && sort.key) {
    coordinators.sort((a, b) => {
      let vA, vB;
      if (sort.key === "index") {
        vA = skillState.coordinators.indexOf(a);
        vB = skillState.coordinators.indexOf(b);
      } else if (sort.key === "business") {
        vA = getSkillBusiness(a.businessId)?.name || "";
        vB = getSkillBusiness(b.businessId)?.name || "";
      } else if (sort.key === "address") {
        vA = getSkillBusiness(a.businessId)?.address || "";
        vB = getSkillBusiness(b.businessId)?.address || "";
      } else if (sort.key === "teacher") {
        vA = a.teacher || ""; vB = b.teacher || "";
      } else if (sort.key === "deputy") {
        vA = a.deputy || ""; vB = b.deputy || "";
      } else if (sort.key === "day") {
        vA = a.day || ""; vB = b.day || "";
      }
      return compareSkillValues(vA, vB, sort.dir);
    });
  }

  const coordinatorRows = coordinators.length ? coordinators.map((coordinator, index) => {
    const business = getSkillBusiness(coordinator.businessId);
    return `
      <div class="skill-row skill-grid-row coordinator-grid-row" data-skill-edit-coordinator="${coordinator.id}">
        <span><input type="checkbox" value="${coordinator.id}" data-skill-select-coordinator /></span>
        <span>${index + 1}</span>
        <strong>${escapeHtml(business?.name || "İşletme yok")}</strong>
        <small>${escapeHtml(business?.address || "Adres belirtilmedi")}</small>
        <span>${escapeHtml(coordinator.teacher || "-")}</span>
        <span>${escapeHtml(coordinator.deputy || "-")}</span>
        <span class="skill-td-day">${formatSkillDayPills(getSkillDayName(coordinator.day))}</span>
        <span class="skill-row-actions" style="justify-content: center; gap: 6px;">
          <button type="button" class="skill-row-btn skill-btn-edit" data-skill-edit-coordinator="${coordinator.id}" title="Görevi Düzenle">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="skill-row-btn skill-btn-delete" data-skill-delete-coordinator="${coordinator.id}" title="Görevi Sil">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </span>
      </div>
    `;
  }).join("") : `<div class="empty-state">Koordinatör görevi bulunamadı.</div>`;
  els.skillCoordinatorTable.innerHTML = `
    <div class="skill-grid-row coordinator-grid-row skill-grid-head">
      <span><input type="checkbox" id="skillCoordinatorSelectAll" style="cursor: pointer;" /></span>
      <span class="skill-sort-col ${sort?.key === 'index' ? 'is-active' : ''}" data-sort-table="coordinators" data-sort-key="index" title="Sıralamak için tıklayın">No ${getSkillSortIcon("coordinators", "index")}</span>
      <span class="skill-sort-col ${sort?.key === 'business' ? 'is-active' : ''}" data-sort-table="coordinators" data-sort-key="business" title="Sıralamak için tıklayın">İşletme ${getSkillSortIcon("coordinators", "business")}</span>
      <span class="skill-sort-col ${sort?.key === 'address' ? 'is-active' : ''}" data-sort-table="coordinators" data-sort-key="address" title="Sıralamak için tıklayın">İşletme Adresi ${getSkillSortIcon("coordinators", "address")}</span>
      <span class="skill-sort-col ${sort?.key === 'teacher' ? 'is-active' : ''}" data-sort-table="coordinators" data-sort-key="teacher" title="Sıralamak için tıklayın">Öğretmen ${getSkillSortIcon("coordinators", "teacher")}</span>
      <span class="skill-sort-col ${sort?.key === 'deputy' ? 'is-active' : ''}" data-sort-table="coordinators" data-sort-key="deputy" title="Sıralamak için tıklayın">Müdür Yrd. ${getSkillSortIcon("coordinators", "deputy")}</span>
      <span class="skill-sort-col ${sort?.key === 'day' ? 'is-active' : ''}" style="justify-content: center; text-align: center;" data-sort-table="coordinators" data-sort-key="day" title="Sıralamak için tıklayın">Gün ${getSkillSortIcon("coordinators", "day")}</span>
      <span class="skill-th-actions" style="justify-content: center; text-align: center;">İşlem</span>
    </div>
    ${coordinatorRows}
  `;
  updateSkillCoordinatorActionState();
}

function openSkillStudentDrawer(student = null) {
  const drawer = document.getElementById("skillStudentDrawer");
  const backdrop = document.getElementById("skillStudentDrawerBackdrop");
  const title = document.getElementById("skillStudentDrawerTitle");
  if (!drawer) return;
  if (student) {
    if (title) title.textContent = "Öğrenciyi Düzenle";
    if (els.skillStudentId) els.skillStudentId.value = student.id;
    if (els.skillStudentNo) els.skillStudentNo.value = student.no || "";
    if (els.skillStudentName) els.skillStudentName.value = student.name || "";
    if (els.skillStudentClass) els.skillStudentClass.value = student.className || "";
    if (els.skillStudentField) els.skillStudentField.value = student.field || "";
    if (els.skillStudentBusiness) els.skillStudentBusiness.value = student.businessId || "";
    setSkillStudentDays(student.days || "");
  } else {
    if (title) title.textContent = "Yeni Öğrenci Ekle";
    clearSkillStudentForm();
  }
  drawer.classList.add("is-open");
  if (backdrop) backdrop.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeSkillStudentDrawer() {
  const drawer = document.getElementById("skillStudentDrawer");
  const backdrop = document.getElementById("skillStudentDrawerBackdrop");
  if (drawer) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (backdrop) {
    backdrop.classList.remove("is-open");
  }
}
window.openSkillStudentDrawer = openSkillStudentDrawer;
window.closeSkillStudentDrawer = closeSkillStudentDrawer;

function clearSkillStudentForm() {
  if (els.skillStudentId) els.skillStudentId.value = "";
  if (els.skillStudentNo) els.skillStudentNo.value = "";
  if (els.skillStudentName) els.skillStudentName.value = "";
  if (els.skillStudentClass) els.skillStudentClass.value = "";
  if (els.skillStudentField) els.skillStudentField.value = "";
  if (els.skillStudentBusiness) els.skillStudentBusiness.value = "";
  setSkillStudentDays("");
}

function clearSkillBusinessForm() {
  if (els.skillBusinessId) els.skillBusinessId.value = "";
  if (els.skillBusinessName) els.skillBusinessName.value = "";
  if (els.skillBusinessPhone) els.skillBusinessPhone.value = "";
  if (els.skillBusinessGroup) els.skillBusinessGroup.value = "1";
  if (els.skillBusinessAddress) els.skillBusinessAddress.value = "";
}

function openSkillBusinessDrawer(business = null) {
  const drawer = document.getElementById("skillBusinessDrawer");
  const backdrop = document.getElementById("skillBusinessDrawerBackdrop");
  const title = document.getElementById("skillBusinessDrawerTitle");
  if (!drawer) return;
  if (business) {
    if (title) title.textContent = "İşletmeyi Düzenle";
    if (els.skillBusinessId) els.skillBusinessId.value = business.id;
    if (els.skillBusinessName) els.skillBusinessName.value = business.name || "";
    if (els.skillBusinessPhone) els.skillBusinessPhone.value = business.phone || "";
    if (els.skillBusinessGroup) els.skillBusinessGroup.value = business.group || "1";
    if (els.skillBusinessAddress) els.skillBusinessAddress.value = business.address || "";
  } else {
    if (title) title.textContent = "Yeni İşletme Ekle";
    clearSkillBusinessForm();
  }
  drawer.classList.add("is-open");
  if (backdrop) backdrop.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeSkillBusinessDrawer() {
  const drawer = document.getElementById("skillBusinessDrawer");
  const backdrop = document.getElementById("skillBusinessDrawerBackdrop");
  if (drawer) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (backdrop) {
    backdrop.classList.remove("is-open");
  }
}
window.openSkillBusinessDrawer = openSkillBusinessDrawer;
window.closeSkillBusinessDrawer = closeSkillBusinessDrawer;

function updateSkillBusinessActionState() {
  const ids = selectedSkillIds(els.skillBusinessTable, "[data-skill-select-business]");
  const bulkBar = document.getElementById("skillBusinessBulkBar");
  const countBadge = document.getElementById("skillBusinessSelectedCount");
  const totalBadge = document.getElementById("skillBusinessCountBadge");

  if (totalBadge) {
    totalBadge.textContent = `${skillState.businesses.length} Kayıt`;
  }

  if (bulkBar) {
    if (ids.length > 0) {
      bulkBar.classList.add("is-visible");
      if (countBadge) countBadge.textContent = ids.length;
    } else {
      bulkBar.classList.remove("is-visible");
    }
  }

  if (els.skillBusinessTable) {
    els.skillBusinessTable.querySelectorAll(".skill-business-grid-row.skill-row").forEach((row) => {
      const cb = row.querySelector("input[type='checkbox']");
      row.classList.toggle("is-selected", !!cb?.checked);
    });
  }
}
window.updateSkillBusinessActionState = updateSkillBusinessActionState;

function openSkillCoordinatorDrawer(coordinator = null) {
  const drawer = document.getElementById("skillCoordinatorDrawer");
  const backdrop = document.getElementById("skillCoordinatorDrawerBackdrop");
  const title = document.getElementById("skillCoordinatorDrawerTitle");
  if (!drawer) return;
  if (coordinator) {
    if (title) title.textContent = "Koordinatör Görevini Düzenle";
    if (els.skillCoordinatorId) els.skillCoordinatorId.value = coordinator.id;
    if (els.skillCoordinatorSchool) els.skillCoordinatorSchool.value = coordinator.schoolId || (skillState.schoolRecords?.[0]?.id || "");
    if (els.skillCoordinatorTeacher) els.skillCoordinatorTeacher.value = coordinator.teacher || "";
    if (els.skillCoordinatorDeputy) els.skillCoordinatorDeputy.value = coordinator.deputy || "";
    if (els.skillCoordinatorBusiness) els.skillCoordinatorBusiness.value = coordinator.businessId || "";
    if (els.skillCoordinatorDay) els.skillCoordinatorDay.value = coordinator.day || "";
  } else {
    if (title) title.textContent = "Yeni Koordinatör Görevi Ekle";
    clearSkillCoordinatorForm();
  }
  drawer.classList.add("is-open");
  if (backdrop) backdrop.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeSkillCoordinatorDrawer() {
  const drawer = document.getElementById("skillCoordinatorDrawer");
  const backdrop = document.getElementById("skillCoordinatorDrawerBackdrop");
  if (drawer) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (backdrop) {
    backdrop.classList.remove("is-open");
  }
}
window.openSkillCoordinatorDrawer = openSkillCoordinatorDrawer;
window.closeSkillCoordinatorDrawer = closeSkillCoordinatorDrawer;

function updateSkillCoordinatorActionState() {
  const ids = selectedSkillIds(els.skillCoordinatorTable, "[data-skill-select-coordinator]");
  const bulkBar = document.getElementById("skillCoordinatorBulkBar");
  const countBadge = document.getElementById("skillCoordinatorSelectedCount");
  const totalBadge = document.getElementById("skillCoordinatorCountBadge");
  const applyBtn = document.getElementById("skillCoordinatorBulkApplyBtn");

  if (totalBadge) {
    totalBadge.textContent = `${skillState.coordinators.length} Görev`;
  }

  if (bulkBar) {
    if (ids.length > 0) {
      bulkBar.classList.add("is-visible");
      if (countBadge) countBadge.textContent = ids.length;
    } else {
      bulkBar.classList.remove("is-visible");
    }
  }

  if (applyBtn) {
    applyBtn.style.display = ids.length > 0 ? "inline-flex" : "none";
    if (ids.length > 0) {
      applyBtn.textContent = `Seçilenlere Uygula (${ids.length})`;
    }
  }

  if (els.skillCoordinatorTable) {
    els.skillCoordinatorTable.querySelectorAll(".coordinator-grid-row.skill-row").forEach((row) => {
      const cb = row.querySelector("input[type='checkbox']");
      row.classList.toggle("is-selected", !!cb?.checked);
    });
  }
}
window.updateSkillCoordinatorActionState = updateSkillCoordinatorActionState;

function saveSkillStudent(event) {
  event.preventDefault();
  const id = els.skillStudentId.value || uid("stu");
  const fieldVal = els.skillStudentField.value.trim();
  
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

  const nextStudent = {
    id,
    no: els.skillStudentNo.value.trim(),
    name: els.skillStudentName.value.trim(),
    className: els.skillStudentClass.value.trim(),
    field: fieldVal,
    active: skillState.students.find((student) => student.id === id)?.active !== false,
    businessId: els.skillStudentBusiness.value,
    days: els.skillStudentDays.value.trim()
  };
  if (!nextStudent.name) {
    showToast("Öğrenci adı boş bırakılamaz.", "warning");
    return;
  }
  const index = skillState.students.findIndex((student) => student.id === id);
  if (index >= 0) skillState.students[index] = nextStudent;
  else skillState.students.push(nextStudent);
  saveSkillState();
  clearSkillStudentForm();
  closeSkillStudentDrawer();
  renderSkillModule();
  showToast("Öğrenci kaydı güncellendi.");
}

function saveSkillBusiness(event) {
  event.preventDefault();
  const explicitId = els.skillBusinessId.value.trim();
  const nameVal = els.skillBusinessName.value.trim();
  const phoneVal = els.skillBusinessPhone.value.trim();
  const addressVal = cleanSkillBusinessAddress(els.skillBusinessAddress.value.trim());
  if (!nameVal) {
    showToast("İşletme adı boş bırakılamaz.", "warning");
    return;
  }
  const matchedExisting = !explicitId
    ? findMatchingSkillBusiness(skillState.businesses, nameVal, phoneVal)
    : null;
  const id = explicitId || matchedExisting?.id || uid("biz");
  const nextBusiness = {
    id,
    name: nameVal,
    phone: phoneVal || matchedExisting?.phone || "",
    group: els.skillBusinessGroup.value,
    address: addressVal || matchedExisting?.address || ""
  };
  const index = skillState.businesses.findIndex((business) => business.id === id);
  if (index >= 0) skillState.businesses[index] = nextBusiness;
  else skillState.businesses.push(nextBusiness);
  deduplicateSkillBusinesses(skillState);
  saveSkillState();
  clearSkillBusinessForm();
  closeSkillBusinessDrawer();
  renderSkillModule();
  showToast("İşletme kaydı güncellendi.");
}

function saveSkillCoordinator(event) {
  event.preventDefault();
  const nextTeacher = els.skillCoordinatorTeacher.value.trim();
  const nextBusinessId = els.skillCoordinatorBusiness.value;
  if (!nextTeacher || !nextBusinessId) {
    showToast("Öğretmen ve işletme seçimi gerekli.", "warning");
    return;
  }
  const nextId = els.skillCoordinatorId?.value || uid("coord");
  const nextCoordinator = {
    id: nextId,
    schoolId: els.skillCoordinatorSchool?.value || skillState.schoolRecords?.[0]?.id || "",
    teacher: nextTeacher,
    businessId: nextBusinessId,
    deputy: els.skillCoordinatorDeputy?.value || "",
    day: els.skillCoordinatorDay.value
  };
  const nextIndex = skillState.coordinators.findIndex((coordinator) => coordinator.id === nextId);
  if (nextIndex >= 0) skillState.coordinators[nextIndex] = nextCoordinator;
  else skillState.coordinators.push(nextCoordinator);
  clearSkillCoordinatorForm();
  closeSkillCoordinatorDrawer();
  saveSkillState();
  renderSkillModule();
  showToast("Koordinatör görevi kaydedildi.");
}

function clearSkillCoordinatorForm() {
  if (els.skillCoordinatorId) els.skillCoordinatorId.value = "";
  if (els.skillCoordinatorSchool) {
    if (skillState.schoolRecords.length > 0) {
      els.skillCoordinatorSchool.value = skillState.schoolRecords[0].id;
      els.skillCoordinatorSchool.dispatchEvent(new Event("change"));
    } else {
      els.skillCoordinatorSchool.value = "";
    }
  }
  if (els.skillCoordinatorTeacher) els.skillCoordinatorTeacher.value = "";
  if (els.skillCoordinatorDeputy) {
    if (skillState.schoolRecords.length > 0 && skillState.schoolRecords[0].deputy) {
      els.skillCoordinatorDeputy.value = skillState.schoolRecords[0].deputy;
    } else {
      els.skillCoordinatorDeputy.value = "";
    }
  }
  if (els.skillCoordinatorBusiness) els.skillCoordinatorBusiness.value = "";
  if (els.skillCoordinatorDay) els.skillCoordinatorDay.value = "";
}

function deleteSelectedSkillBusinesses() {
  const ids = selectedSkillIds(els.skillBusinessTable, "[data-skill-select-business]");
  if (!ids.length) return showToast("Silmek için işletme seçin.", "warning");
  skillState.students.forEach((student) => {
    if (ids.includes(student.businessId)) {
      student.businessId = "";
    }
  });
  skillState.businesses = skillState.businesses.filter((business) => !ids.includes(business.id));
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !ids.includes(coordinator.businessId));
  saveSkillState();
  clearSkillBusinessForm();
  renderSkillModule();
  showToast("Seçili işletme kayıtları silindi.");
}

function deleteAllSkillBusinesses() {
  if (!skillState.businesses.length) return showToast("Silinecek işletme kaydı yok.", "warning");
  skillState.students.forEach((student) => {
    student.businessId = "";
  });
  skillState.businesses = [];
  skillState.coordinators = [];
  saveSkillState();
  clearSkillBusinessForm();
  renderSkillModule();
  showToast("Tüm işletme kayıtları silindi.");
}

function deleteSelectedSkillStudents() {
  const ids = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  if (!ids.length) return showToast("Silmek için öğrenci seçin.", "warning");
  skillState.students = skillState.students.filter((student) => !ids.includes(student.id));
  saveSkillState();
  clearSkillStudentForm();
  renderSkillModule();
  showToast("Seçili öğrenci kayıtları silindi.");
}

function deleteAllSkillStudents() {
  skillState.students = [];
  saveSkillState();
  clearSkillStudentForm();
  renderSkillModule();
  showToast("Tüm öğrenci kayıtları silindi.");
}

function getStudentStatusTargetIds() {
  const ids = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  if (ids.length) return ids;
  return els.skillStudentId?.value ? [els.skillStudentId.value] : [];
}

function updateSkillStudentActionState() {
  const ids = selectedSkillIds(els.skillStudentTable, "[data-skill-select-student]");
  const bulkBar = document.getElementById("skillStudentBulkBar");
  const countBadge = document.getElementById("skillStudentSelectedCount");
  const totalBadge = document.getElementById("skillStudentCountBadge");

  if (totalBadge) {
    totalBadge.textContent = `${skillState.students.length} Kayıt`;
  }

  if (bulkBar) {
    if (ids.length > 0) {
      bulkBar.classList.add("is-visible");
      if (countBadge) countBadge.textContent = ids.length;
    } else {
      bulkBar.classList.remove("is-visible");
    }
  }

  if (els.skillStudentTable) {
    els.skillStudentTable.querySelectorAll(".skill-student-grid-row.skill-row").forEach((row) => {
      const cb = row.querySelector("input[type='checkbox']");
      row.classList.toggle("is-selected", !!cb?.checked);
    });
  }

  if (!els.skillActivateStudentBtn) return;
  const hasPassive = ids.some((id) => skillState.students.find((student) => student.id === id)?.active === false);
  els.skillActivateStudentBtn.disabled = !hasPassive;
  els.skillActivateStudentBtn.classList.toggle("is-disabled", !hasPassive);
}

function setPendingStatusStudents(ids = []) {
  pendingStudentStatusIds = ids;
  if (els.skillStatusStudentSelect) els.skillStatusStudentSelect.value = ids[0] || "";
}

function renderSkillStatusStudentSelect(selectedId = "") {
  if (!els.skillStatusStudentSelect) return;
  els.skillStatusStudentSelect.innerHTML = [
    `<option value="">Öğrenci seçiniz</option>`,
    ...skillState.students.map((student) => {
      const business = getSkillBusiness(student.businessId);
      const parts = [
        student.no || "-",
        student.name || "Adsız öğrenci",
        student.className || "Şube yok",
        business?.name || "İşletme yok"
      ];
      return `<option value="${escapeHtml(student.id)}">${escapeHtml(parts.join(" · "))}</option>`;
    })
  ].join("");
  els.skillStatusStudentSelect.value = skillState.students.some((student) => student.id === selectedId) ? selectedId : "";
}

function updatePendingStatusStudentFromSelect() {
  const studentId = els.skillStatusStudentSelect?.value || "";
  setPendingStatusStudents(studentId ? [studentId] : []);
}

function getSkillStatusStudentSearchResults() {
  const query = (els.skillStatusStudentSearch?.value || "").trim().toLocaleLowerCase("tr-TR");
  if (!query) return [];
  return skillState.students.filter((student) => {
    const business = getSkillBusiness(student.businessId);
    return [student.no, student.name, student.className, student.field, business?.name]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query);
  });
}

function renderSkillStatusStudentResults() {
  if (!els.skillStatusStudentResults) return;
  const rows = getSkillStatusStudentSearchResults();
  const query = (els.skillStatusStudentSearch?.value || "").trim();
  if (!query) {
    els.skillStatusStudentResults.innerHTML = "";
    els.skillStatusStudentResults.hidden = true;
    return;
  }
  els.skillStatusStudentResults.hidden = false;
  els.skillStatusStudentResults.innerHTML = rows.length ? rows.slice(0, 8).map((student) => {
    const business = getSkillBusiness(student.businessId);
    return `
      <button type="button" data-skill-status-search-student="${student.id}">
        <strong>${escapeHtml(student.name || "Adsız öğrenci")}</strong>
        <small>${escapeHtml(student.no || "-")} · ${escapeHtml(student.className || "Şube yok")} · ${escapeHtml(business?.name || "İşletme yok")}</small>
      </button>
    `;
  }).join("") : `<div class="skill-status-search-empty">Eşleşen öğrenci yok</div>`;
}

function selectSkillStatusStudent(studentId) {
  setPendingStatusStudents(studentId ? [studentId] : []);
  if (els.skillStatusStudentSearch) els.skillStatusStudentSearch.value = "";
  if (els.skillStatusStudentResults) {
    els.skillStatusStudentResults.innerHTML = "";
    els.skillStatusStudentResults.hidden = true;
  }
}

function openSkillStudentStatusDialog(active = false) {
  const ids = getStudentStatusTargetIds();
  const selectedId = ids[0] || "";
  if (els.skillStatusStudentSearch) els.skillStatusStudentSearch.value = "";
  if (els.skillStatusStudentResults) els.skillStatusStudentResults.hidden = true;
  renderSkillStatusStudentSelect(selectedId);
  setPendingStatusStudents(selectedId ? [selectedId] : []);
  if (els.skillStatusDate) els.skillStatusDate.value = new Date().toISOString().slice(0, 10);
  if (els.skillStatusValue) els.skillStatusValue.value = active ? "active" : "passive";
  if (els.skillStatusReason) els.skillStatusReason.value = "";
  if (els.skillStatusNote) els.skillStatusNote.value = "";
  els.skillStudentStatusDialog?.showModal();
}

function closeSkillStudentStatusDialog() {
  pendingStudentStatusIds = [];
  if (els.skillStatusStudentSearch) els.skillStatusStudentSearch.value = "";
  if (els.skillStatusStudentResults) {
    els.skillStatusStudentResults.innerHTML = "";
    els.skillStatusStudentResults.hidden = true;
  }
  if (els.skillStatusStudentSelect) els.skillStatusStudentSelect.value = "";
  if (els.skillStudentStatusDialog?.open) els.skillStudentStatusDialog.close();
}

function saveSkillStudentStatus(event) {
  event.preventDefault();
  if (!pendingStudentStatusIds.length) {
    showToast("Durum işlemi için öğrenci seçin.", "warning");
    return;
  }
  const active = els.skillStatusValue?.value === "active";
  const statusRecord = {
    active,
    date: els.skillStatusDate?.value || new Date().toISOString().slice(0, 10),
    reason: els.skillStatusReason?.value || "",
    note: els.skillStatusNote?.value || "",
    updatedAt: new Date().toISOString()
  };
  skillState.students = skillState.students.map((student) => (
    pendingStudentStatusIds.includes(student.id)
      ? { ...student, active, statusRecord, statusHistory: [...(student.statusHistory || []), statusRecord] }
      : student
  ));
  saveSkillState();
  closeSkillStudentStatusDialog();
  renderSkillModule();
  showToast("Öğrenci durumu güncellendi.");
}

function setSelectedSkillStudentStatus(active) {
  openSkillStudentStatusDialog(active);
}

function toggleSelectedSkillStudentStatus() {
  openSkillStudentStatusDialog(false);
}

function deleteSelectedSkillCoordinators() {
  const ids = selectedSkillIds(els.skillCoordinatorTable, "[data-skill-select-coordinator]");
  if (!ids.length) return showToast("Silmek için koordinatör görevi seçin.");
  skillState.coordinators = skillState.coordinators.filter((coordinator) => !ids.includes(coordinator.id));
  saveSkillState();
  clearSkillCoordinatorForm();
  renderSkillModule();
}

function deleteAllSkillCoordinators() {
  skillState.coordinators = [];
  saveSkillState();
  clearSkillCoordinatorForm();
  renderSkillModule();
}

function handleSkillTableClick(event) {
  if (event.target.closest("input[type='checkbox']")) return;
  const studentRow = event.target.closest("[data-skill-edit-student]");
  const businessRow = event.target.closest("[data-skill-edit-business]");
  const coordinatorRow = event.target.closest("[data-skill-edit-coordinator]");

  const deleteStudentBtn = event.target.closest("[data-skill-delete-student]");
  const deleteStudentId = deleteStudentBtn?.dataset.skillDeleteStudent;
  const editStudentBtn = event.target.closest("[data-skill-edit-student]");
  const editStudentId = editStudentBtn?.dataset.skillEditStudent || studentRow?.dataset.skillEditStudent;

  const deleteBusinessBtn = event.target.closest("[data-skill-delete-business]");
  const deleteBusinessId = deleteBusinessBtn?.dataset.skillDeleteBusiness;
  const editBusinessBtn = event.target.closest("[data-skill-edit-business]");
  const editBusinessId = editBusinessBtn?.dataset.skillEditBusiness || businessRow?.dataset.skillEditBusiness;

  const deleteCoordinatorBtn = event.target.closest("[data-skill-delete-coordinator]");
  const deleteCoordinatorId = deleteCoordinatorBtn?.dataset.skillDeleteCoordinator;
  const editCoordinatorBtn = event.target.closest("[data-skill-edit-coordinator]");
  const editCoordinatorId = editCoordinatorBtn?.dataset.skillEditCoordinator || coordinatorRow?.dataset.skillEditCoordinator;

  if (deleteStudentId) {
    if (confirm("Bu öğrenci kaydını silmek istediğinize emin misiniz?")) {
      skillState.students = skillState.students.filter((student) => student.id !== deleteStudentId);
      saveSkillState();
      renderSkillModule();
      showToast("Öğrenci silindi.");
    }
    return;
  }

  if (deleteBusinessId) {
    if (confirm("Bu işletme kaydını silmek istediğinize emin misiniz?")) {
      skillState.students.forEach((student) => {
        if (student.businessId === deleteBusinessId) {
          student.businessId = "";
        }
      });
      skillState.businesses = skillState.businesses.filter((business) => business.id !== deleteBusinessId);
      skillState.coordinators = skillState.coordinators.filter((coordinator) => coordinator.businessId !== deleteBusinessId);
      saveSkillState();
      renderSkillModule();
      showToast("İşletme silindi.");
    }
    return;
  }

  if (deleteCoordinatorId) {
    if (confirm("Bu koordinatör görevini silmek istediğinize emin misiniz?")) {
      skillState.coordinators = skillState.coordinators.filter((coordinator) => coordinator.id !== deleteCoordinatorId);
      saveSkillState();
      renderSkillModule();
      showToast("Koordinatör görevi silindi.");
    }
    return;
  }

  if (editStudentId) {
    const student = skillState.students.find((item) => item.id === editStudentId);
    if (!student) return;
    setSkillView("students");
    openSkillStudentDrawer(student);
    return;
  }

  if (editBusinessId) {
    const business = skillState.businesses.find((item) => item.id === editBusinessId);
    if (!business) return;
    setSkillView("businesses");
    openSkillBusinessDrawer(business);
    return;
  }

  if (editCoordinatorId) {
    const coordinator = skillState.coordinators.find((item) => item.id === editCoordinatorId);
    if (!coordinator) return;
    setSkillView("coordinators");
    openSkillCoordinatorDrawer(coordinator);
    return;
  }
}

function fillSkillStudentForm(studentId) {
  const student = skillState.students.find((item) => item.id === studentId);
  if (!student) return false;
  setSkillView("students");
  els.skillStudentId.value = student.id;
  els.skillStudentNo.value = student.no || "";
  els.skillStudentName.value = student.name || "";
  els.skillStudentClass.value = student.className || "";
  els.skillStudentField.value = student.field || "";
  els.skillStudentBusiness.value = student.businessId || "";
  setSkillStudentDays(student.days || "");
  return true;
}

function fillSkillBusinessForm(businessId) {
  const business = skillState.businesses.find((item) => item.id === businessId);
  if (!business) return false;
  setSkillView("businesses");
  els.skillBusinessId.value = business.id;
  els.skillBusinessName.value = business.name || "";
  els.skillBusinessPhone.value = business.phone || "";
  els.skillBusinessGroup.value = business.group || "1";
  els.skillBusinessAddress.value = business.address || "";
  return true;
}

function fillSkillCoordinatorForm(coordinatorId) {
  const coordinator = skillState.coordinators.find((item) => item.id === coordinatorId);
  if (!coordinator) return false;
  setSkillView("coordinators");
  if (els.skillCoordinatorId) els.skillCoordinatorId.value = coordinator.id;
  if (els.skillCoordinatorSchool) els.skillCoordinatorSchool.value = coordinator.schoolId || "";
  if (els.skillCoordinatorTeacher) els.skillCoordinatorTeacher.value = coordinator.teacher || "";
  if (els.skillCoordinatorDeputy) els.skillCoordinatorDeputy.value = coordinator.deputy || "";
  if (els.skillCoordinatorBusiness) els.skillCoordinatorBusiness.value = coordinator.businessId || "";
  if (els.skillCoordinatorDay) els.skillCoordinatorDay.value = coordinator.day || "";
  return true;
}

function fillSkillSchoolForm(schoolId) {
  const school = skillState.schoolRecords.find((item) => item.id === schoolId);
  if (!school) return false;
  setSkillView("school");
  if (els.skillSchoolId) els.skillSchoolId.value = school.id;
  if (els.skillSchoolName) els.skillSchoolName.value = school.name || "";
  if (els.skillSchoolCity) els.skillSchoolCity.value = school.city || "";
  if (els.skillSchoolPrincipal) els.skillSchoolPrincipal.value = school.principal || "";
  if (els.skillSchoolDeputy) els.skillSchoolDeputy.value = school.deputy || "";
  if (els.skillSchoolType) els.skillSchoolType.value = school.schoolType || "mesem";
  if (els.skillSchoolSummerStart) els.skillSchoolSummerStart.value = school.summerStartDate || "";
  if (els.skillSchoolSummerEnd) els.skillSchoolSummerEnd.value = school.summerEndDate || "";
  return true;
}

function fillSkillTeacherForm(teacherId) {
  const teacher = skillState.teacherPool.find((item) => item.id === teacherId);
  if (!teacher) return false;
  setSkillView("school");
  if (els.skillTeacherId) els.skillTeacherId.value = teacher.id;
  if (els.skillTeacherName) els.skillTeacherName.value = teacher.name || "";
  return true;
}

function fillSkillFieldForm(fieldId) {
  const field = skillState.fields.find((item) => item.id === fieldId);
  if (!field) return false;
  setSkillView("fields");
  if (els.skillFieldId) els.skillFieldId.value = field.id;
  if (els.skillFieldArea) els.skillFieldArea.value = field.area || "";
  if (els.skillFieldBranch) els.skillFieldBranch.value = field.branch || "";
  return true;
}

function getSkillGlobalSearchItems() {
  ensureSkillCollections();
  const items = [];
  skillState.students.forEach((student) => {
    const business = getSkillBusiness(student.businessId);
    items.push({
      type: "student",
      id: student.id,
      badge: "Öğrenci",
      title: `${student.no || "-"} - ${student.name || "Öğrenci"}`,
      detail: `${student.className || "Sınıf yok"} · ${business?.name || "İşletme yok"} · ${student.field || "Alan / dal yok"}`,
      search: [student.no, student.name, student.className, student.field, student.days, business?.name].join(" ")
    });
  });
  skillState.businesses.forEach((business) => {
    const students = skillState.students.filter((student) => student.businessId === business.id);
    const coordinator = skillState.coordinators.find((item) => item.businessId === business.id);
    items.push({
      type: "business",
      id: business.id,
      badge: "İşletme",
      title: business.name || "İşletme",
      detail: `${students.length} öğrenci · Koordinatör: ${coordinator?.teacher || "Atanmadı"} · ${business.address || "Adres yok"}`,
      search: [business.name, business.phone, business.address, coordinator?.teacher, ...students.map((student) => student.name)].join(" ")
    });
  });
  skillState.coordinators.forEach((coordinator) => {
    const business = getSkillBusiness(coordinator.businessId);
    const school = skillState.schoolRecords.find((item) => item.id === coordinator.schoolId) || skillState.schoolRecords[0];
    items.push({
      type: "coordinator",
      id: coordinator.id,
      badge: "Koordinatör",
      title: coordinator.teacher || "Koordinatör",
      detail: `${business?.name || "İşletme yok"} · ${getSkillDayName(coordinator.day)} · ${school?.name || "Okul yok"}`,
      search: [coordinator.teacher, coordinator.deputy, business?.name, school?.name, getSkillDayName(coordinator.day)].join(" ")
    });
  });
  skillState.schoolRecords.forEach((school) => {
    items.push({
      type: "school",
      id: school.id,
      badge: "Okul",
      title: school.name || "Okul",
      detail: `${school.city || "İl yok"} · Müdür: ${school.principal || "-"} · Müdür yrd.: ${school.deputy || "-"}`,
      search: [school.name, school.city, school.principal, school.deputy].join(" ")
    });
  });
  skillState.teacherPool.forEach((teacher) => {
    items.push({
      type: "teacher",
      id: teacher.id,
      badge: "Öğretmen",
      title: teacher.name || "Öğretmen",
      detail: "Koordinatör öğretmen kaydı",
      search: teacher.name || ""
    });
  });
  skillState.fields.forEach((field) => {
    const label = getSkillFieldLabel(field);
    items.push({
      type: "field",
      id: field.id,
      badge: "Alan / Dal",
      title: label,
      detail: `${field.area || "-"} · ${field.branch || "-"}`,
      search: [field.area, field.branch, label].join(" ")
    });
  });
  return items;
}

function renderSkillGlobalSearchResults() {
  if (!els.skillGlobalSearchInput || !els.skillGlobalSearchResults) return;
  const query = normalizeText(els.skillGlobalSearchInput.value);
  if (!query) {
    closeSkillGlobalSearchResults();
    return;
  }
  const words = query.split(/\s+/).filter(Boolean);
  const results = getSkillGlobalSearchItems()
    .map((item) => ({
      ...item,
      haystack: normalizeText([item.title, item.detail, item.search].join(" "))
    }))
    .filter((item) => words.every((word) => item.haystack.includes(word)))
    .slice(0, 12);
  els.skillGlobalSearchResults.hidden = false;
  els.skillGlobalSearchResults.innerHTML = results.length ? results.map((item) => `
    <button type="button" data-skill-global-type="${escapeHtml(item.type)}" data-skill-global-id="${escapeHtml(item.id)}">
      <em>${escapeHtml(item.badge)}</em>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </button>
  `).join("") : `<div class="skill-search-empty">Eşleşen kayıt bulunamadı.</div>`;
}

function closeSkillGlobalSearchResults() {
  if (!els.skillGlobalSearchResults) return;
  els.skillGlobalSearchResults.hidden = true;
  els.skillGlobalSearchResults.innerHTML = "";
}

function clearSkillGlobalSearch() {
  if (els.skillGlobalSearchInput) els.skillGlobalSearchInput.value = "";
  closeSkillGlobalSearchResults();
}

function openSkillGlobalSearchItem(type, id) {
  const handlers = {
    student: fillSkillStudentForm,
    business: fillSkillBusinessForm,
    coordinator: fillSkillCoordinatorForm,
    school: fillSkillSchoolForm,
    teacher: fillSkillTeacherForm,
    field: fillSkillFieldForm,
    course: (courseId) => {
      state.selectedCourseId = courseId;
      openModule("sorubank");
      render();
      return true;
    },
    question: (questionId) => {
      const question = state.questions.find((item) => item.id === questionId);
      if (!question) return false;
      state.selectedCourseId = question.courseId;
      openModule("sorubank");
      setView("bank");
      if (els.searchInput) els.searchInput.value = question.topic || stripHtml(question.content || "").slice(0, 40);
      render();
      return true;
    }
  };
  const opened = handlers[type]?.(id);
  if (opened) clearSkillGlobalSearch();
}

