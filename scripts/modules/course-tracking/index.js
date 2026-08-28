/* ==========================================================================
   KURS TAKİP MODÜLÜ (COURSE SHELL) MANTIĞI VE VERİ YÖNETİMİ
   ========================================================================== */

const courseEls = {
  courseShell: document.querySelector("#courseShell"),
  courseActiveModuleCard: document.querySelector("#courseActiveModuleCard"),
  courseActiveModuleText: document.querySelector("#courseActiveModuleText"),
  coursePageTitle: document.querySelector("#coursePageTitle"),
  coursePageSubtitle: document.querySelector("#coursePageSubtitle"),
  courseModuleSwitchBtn: document.querySelector("#courseModuleSwitchBtn"),
  courseTrackingTabs: document.querySelector("#courseTrackingTabs"),
  courseDataTabs: document.querySelector("#courseDataTabs"),
  courseNavButtons: document.querySelectorAll("[data-course-nav-view]"),
  courseNavMobileSelect: document.querySelector("#courseNavMobileSelect"),
  courseTabButtons: document.querySelectorAll("[data-course-tab]"),
  coursePanels: document.querySelectorAll("[data-course-panel]"),

  // Attendance
  courseAttendanceDate: document.querySelector("#courseAttendanceDate"),
  courseSaveAttendanceBtn: document.querySelector("#courseSaveAttendanceBtn"),
  courseClearAttendanceBtn: document.querySelector("#courseClearAttendanceBtn"),
  courseRefreshAttendanceBtn: document.querySelector("#courseRefreshAttendanceBtn"),
  courseAttendanceTable: document.querySelector("#courseAttendanceTable"),
  courseAttendanceBody: document.querySelector("#courseAttendanceBody"),
  // Grades
  courseExamDate: document.querySelector("#courseExamDate"),
  courseSaveGradesBtn: document.querySelector("#courseSaveGradesBtn"),
  courseClearGradesBtn: document.querySelector("#courseClearGradesBtn"),
  courseRefreshGradesBtn: document.querySelector("#courseRefreshGradesBtn"),
  courseGradesTable: document.querySelector("#courseGradesTable"),
  courseGradesBody: document.querySelector("#courseGradesBody"),

  // Exam prep
  courseSelectAllExamPrepBtn: document.querySelector("#courseSelectAllExamPrepBtn"),
  courseClearAllExamPrepBtn: document.querySelector("#courseClearAllExamPrepBtn"),
  courseExamPrepStudentsTable: document.querySelector("#courseExamPrepStudentsTable"),
  courseExamPrepStudentsBody: document.querySelector("#courseExamPrepStudentsBody"),
  coursePrepActiveModuleText: document.querySelector("#coursePrepActiveModuleText"),
  coursePrepQuestionStatus: document.querySelector("#coursePrepQuestionStatus"),
  courseOpenQuestionBankBtn: document.querySelector("#courseOpenQuestionBankBtn"),
  coursePrepExamDate: document.querySelector("#coursePrepExamDate"),
  coursePrepQuestionCount: document.querySelector("#coursePrepQuestionCount"),
  coursePrepOptionCount: document.querySelector("#coursePrepOptionCount"),
  coursePrepScoringType: document.querySelector("#coursePrepScoringType"),
  courseGenerateExamDocBtn: document.querySelector("#courseGenerateExamDocBtn"),

  // Reports
  courseSelectAllReportStudentsBtn: document.querySelector("#courseSelectAllReportStudentsBtn"),
  courseClearAllReportStudentsBtn: document.querySelector("#courseClearAllReportStudentsBtn"),
  courseReportStudentsTable: document.querySelector("#courseReportStudentsTable"),
  courseReportStudentsBody: document.querySelector("#courseReportStudentsBody"),
  courseGenerateGradeReportBtn: document.querySelector("#courseGenerateGradeReportBtn"),
  courseGenerateAttendanceReportBtn: document.querySelector("#courseGenerateAttendanceReportBtn"),

  // School
  courseSchoolForm: document.querySelector("#courseSchoolForm"),
  courseSchoolId: document.querySelector("#courseSchoolId"),
  courseInstitutionName: document.querySelector("#courseInstitutionName"),
  courseName: document.querySelector("#courseName"),
  courseStartDate: document.querySelector("#courseStartDate"),
  courseEndDate: document.querySelector("#courseEndDate"),
  coursePrincipalName: document.querySelector("#coursePrincipalName"),
  courseVicePrincipalName: document.querySelector("#courseVicePrincipalName"),
  courseTeacherInput: document.querySelector("#courseTeacherInput"),
  courseAddTeacherBtn: document.querySelector("#courseAddTeacherBtn"),
  courseTeacherList: document.querySelector("#courseTeacherList"),
  courseClearSchoolBtn: document.querySelector("#courseClearSchoolBtn"),
  courseDeleteSchoolBtn: document.querySelector("#courseDeleteSchoolBtn"),
  courseSchoolTable: document.querySelector("#courseSchoolTable"),
  courseSchoolBody: document.querySelector("#courseSchoolBody"),

  // Modules
  courseModuleForm: document.querySelector("#courseModuleForm"),
  courseModuleId: document.querySelector("#courseModuleId"),
  courseModuleNameInput: document.querySelector("#courseModuleNameInput"),
  courseModuleSortOrder: document.querySelector("#courseModuleSortOrder"),
  courseClearModuleBtn: document.querySelector("#courseClearModuleBtn"),
  courseDeleteModuleBtn: document.querySelector("#courseDeleteModuleBtn"),
  courseWebSearchInput: document.querySelector("#courseWebSearchInput"),
  courseWebSearchBtn: document.querySelector("#courseWebSearchBtn"),
  courseWebResultLabel: document.querySelector("#courseWebResultLabel"),
  courseWebResultSelect: document.querySelector("#courseWebResultSelect"),
  courseImportWebModulesBtn: document.querySelector("#courseImportWebModulesBtn"),
  courseDeleteAllModulesBtn: document.querySelector("#courseDeleteAllModulesBtn"),
  courseModulesTable: document.querySelector("#courseModulesTable"),
  courseModulesBody: document.querySelector("#courseModulesBody"),

  // Students
  courseStudentForm: document.querySelector("#courseStudentForm"),
  courseStudentId: document.querySelector("#courseStudentId"),
  courseStudentExcelInput: document.querySelector("#courseStudentExcelInput"),
  courseStudentFullNameInput: document.querySelector("#courseStudentFullNameInput"),
  courseStudentPhone: document.querySelector("#courseStudentPhone"),
  courseClearStudentBtn: document.querySelector("#courseClearStudentBtn"),
  courseDeleteStudentBtn: document.querySelector("#courseDeleteStudentBtn"),
  courseDeleteAllStudentsBtn: document.querySelector("#courseDeleteAllStudentsBtn"),
  courseStudentsTable: document.querySelector("#courseStudentsTable"),
  courseStudentsBody: document.querySelector("#courseStudentsBody"),

  // Dialogs
  courseModuleSelectDialog: document.querySelector("#courseModuleSelectDialog"),
  courseDialogModuleList: document.querySelector("#courseDialogModuleList"),
  courseQuestionBankDialog: document.querySelector("#courseQuestionBankDialog"),
  courseDialogQuestionCount: document.querySelector("#courseDialogQuestionCount"),
  courseDialogQuestionsList: document.querySelector("#courseDialogQuestionsList"),
  courseQuestionEditorForm: document.querySelector("#courseQuestionEditorForm"),
  courseQuestionId: document.querySelector("#courseQuestionId"),
  courseQuestionNumber: document.querySelector("#courseQuestionNumber"),
  courseQuestionCorrect: document.querySelector("#courseQuestionCorrect"),
  courseQuestionText: document.querySelector("#courseQuestionText"),
  courseOptionA: document.querySelector("#courseOptionA"),
  courseOptionB: document.querySelector("#courseOptionB"),
  courseOptionC: document.querySelector("#courseOptionC"),
  courseOptionD: document.querySelector("#courseOptionD"),
  courseOptionE: document.querySelector("#courseOptionE"),
  courseQuestionNewBtn: document.querySelector("#courseQuestionNewBtn"),
  courseQuestionDeleteBtn: document.querySelector("#courseQuestionDeleteBtn"),

  // Student Card
  courseStudentCardDialog: document.querySelector("#courseStudentCardDialog"),
  courseCardAvatar: document.querySelector("#courseCardAvatar"),
  courseCardName: document.querySelector("#courseCardName"),
  courseCardPhone: document.querySelector("#courseCardPhone"),
  courseCardPresentCount: document.querySelector("#courseCardPresentCount"),
  courseCardAbsentCount: document.querySelector("#courseCardAbsentCount"),
  courseCardExamsList: document.querySelector("#courseCardExamsList"),
  courseCardAbsencesList: document.querySelector("#courseCardAbsencesList"),

  courseAttendanceSearch: document.querySelector("#courseAttendanceSearch"),
  courseGradesSearch: document.querySelector("#courseGradesSearch"),
  printExamArea: document.querySelector("#printExamArea")
};

let courseState = {
  activeView: "data",
  activeTab: "school",
  selectedModuleId: "",
  schoolInfos: [],
  modules: [],
  students: [],
  attendance: {},      // key: `${studentId}_${moduleId}_${date}`, value: 0 or 1
  examSummaries: {},   // key: `${studentId}_${moduleId}_${date}`, value: { Y1, Y2, Y3, P1, P2, didNotAttend }
  questions: {}        // key: moduleId, value: [ { id, questionNumber, questionText, optionA-E, correctOption } ]
};
let courseCallbacks = {};

function loadCourseState() {
  try {
    const saved = localStorage.getItem(COURSE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      courseState = { ...courseState, ...parsed };
    }
  } catch (e) {
    console.error("Kurs Takip state load failed:", e);
  }
  normalizeCourseState();
}

function saveCourseState() {
  try {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(courseState));
    scheduleAutoBackupSnapshot("course-change");
    if (window.scheduleCloudSave) window.scheduleCloudSave();
  } catch (e) {
    console.error("Kurs Takip state save failed:", e);
  }
}

function normalizeCourseState() {
  if (!Array.isArray(courseState.schoolInfos)) courseState.schoolInfos = [];
  if (!Array.isArray(courseState.modules)) courseState.modules = [];
  if (!Array.isArray(courseState.students)) courseState.students = [];
  if (!courseState.attendance || Array.isArray(courseState.attendance)) courseState.attendance = {};
  if (!courseState.examSummaries || Array.isArray(courseState.examSummaries)) courseState.examSummaries = {};
  if (!courseState.questions || Array.isArray(courseState.questions)) courseState.questions = {};
}

function formatTurkishDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  } catch (e) {}
  return dateStr;
}

function renderCourseModule() {
  loadCourseState();
  if (!courseState.selectedModuleId && courseState.modules.length > 0) {
    courseState.selectedModuleId = courseState.modules[0].id;
    saveCourseState();
  }
  const todayStr = new Date().toISOString().split("T")[0];
  if (courseEls.courseAttendanceDate && !courseEls.courseAttendanceDate.value) {
    courseEls.courseAttendanceDate.value = todayStr;
  }
  if (courseEls.courseExamDate && !courseEls.courseExamDate.value) {
    courseEls.courseExamDate.value = todayStr;
  }
  if (courseEls.coursePrepExamDate && !courseEls.coursePrepExamDate.value) {
    courseEls.coursePrepExamDate.value = todayStr;
  }
  setCourseView(courseState.activeView || "tracking");
}

function updateActiveModuleDisplay() {
  const currentModule = courseState.modules.find(m => String(m.id) === String(courseState.selectedModuleId));
  const text = currentModule ? `${currentModule.sortOrder ? currentModule.sortOrder + '. ' : ''}${currentModule.name}` : "Seçilmedi";
  if (courseEls.courseActiveModuleText) courseEls.courseActiveModuleText.textContent = text;
  if (courseEls.coursePrepActiveModuleText) courseEls.coursePrepActiveModuleText.textContent = text;
  
  const questions = courseState.questions[courseState.selectedModuleId] || [];
  if (courseEls.coursePrepQuestionStatus) {
    courseEls.coursePrepQuestionStatus.textContent = `${questions.length} soru hazır`;
    courseEls.coursePrepQuestionStatus.className = questions.length > 0 ? "settings-status-badge is-ready" : "settings-status-badge is-empty";
  }
}

function openModuleSelectDialog() {
  if (!courseEls.courseDialogModuleList) return;
  if (courseState.modules.length === 0) {
    courseEls.courseDialogModuleList.innerHTML = `<div style="padding:15px;text-align:center;color:var(--muted)">Kayıtlı modül bulunamadı. Lütfen "Veri Yönetimi > Modül Tanımlama" sekmesinden modül ekleyin.</div>`;
  } else {
    courseEls.courseDialogModuleList.innerHTML = courseState.modules.map(m => {
      const displayName = `${m.sortOrder ? m.sortOrder + '. ' : ''}${m.name}`;
      return `<button class="course-dialog-list-item ${String(m.id) === String(courseState.selectedModuleId) ? 'is-active' : ''}" type="button" data-select-module-id="${m.id}">${escapeHtml(displayName)}</button>`;
    }).join("");
  }
  courseEls.courseModuleSelectDialog.showModal();
}

function setCourseView(view) {
  courseState.activeView = view;
  saveCourseState();
  
  courseEls.courseNavButtons.forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.courseNavView === view);
  });
  
  if (courseEls.courseNavMobileSelect) {
    courseEls.courseNavMobileSelect.value = `${courseState.activeView}:${courseState.activeTab}`;
  }
  
  if (view === "tracking") {
    courseEls.courseTrackingTabs.hidden = false;
    courseEls.courseDataTabs.hidden = true;
    setCourseTab(courseState.activeTab || "attendance");
    if (courseEls.coursePageTitle) courseEls.coursePageTitle.textContent = "Modül Takibi";
    if (courseEls.coursePageSubtitle) courseEls.coursePageSubtitle.textContent = "Yoklama, notlar ve sınav evrakı yönetimi";
  } else {
    courseEls.courseTrackingTabs.hidden = true;
    courseEls.courseDataTabs.hidden = false;
    setCourseTab(courseState.activeTab || "school");
    if (courseEls.coursePageTitle) courseEls.coursePageTitle.textContent = "Veri Yönetimi";
    if (courseEls.coursePageSubtitle) courseEls.coursePageSubtitle.textContent = "Kurum, modül ve öğrenci listeleri yönetimi";
  }
}

function setCourseTab(tab) {
  if (courseState.activeView === "tracking" && !["attendance", "grades", "examprep", "reports"].includes(tab)) {
    tab = "attendance";
  }
  if (courseState.activeView === "data" && !["school", "modules", "students"].includes(tab)) {
    tab = "school";
  }
  
  courseState.activeTab = tab;
  saveCourseState();
  
  courseEls.courseTabButtons.forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.courseTab === tab);
  });
  
  if (courseEls.courseNavMobileSelect) {
    courseEls.courseNavMobileSelect.value = `${courseState.activeView}:${courseState.activeTab}`;
  }
  
  courseEls.coursePanels.forEach(panel => {
    panel.classList.toggle("is-active", panel.dataset.coursePanel === tab);
  });
  
  renderCourseTab(tab);
}

function renderCourseTab(tab) {
  updateActiveModuleDisplay();
  if (tab === "school") renderSchoolInfoTab();
  else if (tab === "modules") renderModulesTab();
  else if (tab === "students") renderStudentsTab();
  else if (tab === "attendance") renderAttendanceTab();
  else if (tab === "grades") renderGradesTab();
  else if (tab === "examprep") renderExamPrepTab();
  else if (tab === "reports") renderReportsTab();
}

// === KURUM BİLGİLERİ CRUD ===
let currentTeachers = [];

function renderTeacherBadges() {
  if (!courseEls.courseTeacherList) return;
  courseEls.courseTeacherList.innerHTML = currentTeachers.map((teacher, index) => `
    <span class="course-teacher-badge">
      ${escapeHtml(teacher)}
      <b class="remove-teacher" data-index="${index}">&times;</b>
    </span>
  `).join("");
}

function addTeacher() {
  const name = courseEls.courseTeacherInput.value.trim();
  if (!name) return;
  if (currentTeachers.includes(name)) {
    showToast("Bu öğretmen zaten ekli.", "warning");
    return;
  }
  currentTeachers.push(name);
  courseEls.courseTeacherInput.value = "";
  renderTeacherBadges();
}

function removeTeacher(index) {
  currentTeachers.splice(index, 1);
  renderTeacherBadges();
}

function renderSchoolInfoTab() {
  if (!courseEls.courseSchoolBody) return;
  
  courseEls.courseSchoolBody.innerHTML = courseState.schoolInfos.map(school => `
    <tr data-school-id="${school.id}">
      <td><strong>${escapeHtml(school.institutionName)}</strong></td>
      <td>${escapeHtml(school.courseName)}</td>
      <td><small>${formatTurkishDate(school.courseStartDate)} - ${formatTurkishDate(school.courseEndDate)}</small></td>
      <td>${escapeHtml(school.institutionPrincipalName)}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${(school.teachers || []).map(t => `<span class="badge badge-light-teal">${escapeHtml(t)}</span>`).join("")}
        </div>
      </td>
    </tr>
  `).join("");
}

function clearSchoolForm() {
  courseEls.courseSchoolForm.reset();
  courseEls.courseSchoolId.value = "";
  currentTeachers = [];
  renderTeacherBadges();
  courseEls.courseDeleteSchoolBtn.disabled = true;
}

function editSchoolInfo(schoolId) {
  const school = courseState.schoolInfos.find(s => String(s.id) === String(schoolId));
  if (!school) return;
  
  courseEls.courseSchoolId.value = school.id;
  courseEls.courseInstitutionName.value = school.institutionName;
  courseEls.courseName.value = school.courseName;
  courseEls.courseStartDate.value = school.courseStartDate;
  courseEls.courseEndDate.value = school.courseEndDate;
  courseEls.coursePrincipalName.value = school.institutionPrincipalName;
  courseEls.courseVicePrincipalName.value = school.vicePrincipalName;
  
  currentTeachers = [...(school.teachers || [])];
  renderTeacherBadges();
  courseEls.courseDeleteSchoolBtn.disabled = false;
}

function saveSchoolInfo(e) {
  e.preventDefault();
  const id = courseEls.courseSchoolId.value;
  const newSchool = {
    id: id || uid("school"),
    institutionName: courseEls.courseInstitutionName.value.trim(),
    courseName: courseEls.courseName.value.trim(),
    courseStartDate: courseEls.courseStartDate.value,
    courseEndDate: courseEls.courseEndDate.value,
    institutionPrincipalName: courseEls.coursePrincipalName.value.trim(),
    vicePrincipalName: courseEls.courseVicePrincipalName.value.trim(),
    teachers: [...currentTeachers]
  };
  
  if (id) {
    const idx = courseState.schoolInfos.findIndex(s => String(s.id) === String(id));
    if (idx >= 0) courseState.schoolInfos[idx] = newSchool;
  } else {
    courseState.schoolInfos.push(newSchool);
  }
  
  saveCourseState();
  showToast("Kurum bilgileri başarıyla kaydedildi.");
  clearSchoolForm();
  renderSchoolInfoTab();
}

async function deleteSchoolInfo() {
  const id = courseEls.courseSchoolId.value;
  if (!id) return;
  if (!await appConfirm("Bu kurum bilgisini silmek istediğinize emin misiniz?", { title: "Kurum bilgisini sil", okText: "Sil" })) return;
  courseState.schoolInfos = courseState.schoolInfos.filter(s => String(s.id) !== String(id));
  saveCourseState();
  showToast("Kurum bilgisi silindi.", "info");
  clearSchoolForm();
  renderSchoolInfoTab();
}

// === MODÜLLER CRUD ===
function renderModulesTab() {
  if (!courseEls.courseModulesBody) return;
  
  const sorted = [...courseState.modules].sort((a, b) => {
    const sa = parseInt(a.sortOrder) || 0;
    const sb = parseInt(b.sortOrder) || 0;
    return sa - sb || a.name.localeCompare(b.name);
  });
  
  courseEls.courseModulesBody.innerHTML = sorted.map(m => {
    const qCount = (courseState.questions[m.id] || []).length;
    const bankStatus = qCount > 0 ? `<span class="badge badge-light-teal">${qCount} soru hazır</span>` : `<span class="badge badge-light-red">Soru bankası boş</span>`;
    return `
      <tr data-module-id="${m.id}">
        <td><strong>${m.sortOrder || 0}</strong></td>
        <td>${escapeHtml(m.name)}</td>
        <td>${bankStatus}</td>
      </tr>
    `;
  }).join("");
}

function clearModuleForm() {
  courseEls.courseModuleForm.reset();
  courseEls.courseModuleId.value = "";
  courseEls.courseDeleteModuleBtn.disabled = true;
}

function editModule(moduleId) {
  const m = courseState.modules.find(item => String(item.id) === String(moduleId));
  if (!m) return;
  
  courseEls.courseModuleId.value = m.id;
  courseEls.courseModuleNameInput.value = m.name;
  courseEls.courseModuleSortOrder.value = m.sortOrder || 0;
  courseEls.courseDeleteModuleBtn.disabled = false;
}

function saveModule(e) {
  e.preventDefault();
  const id = courseEls.courseModuleId.value;
  const name = courseEls.courseModuleNameInput.value.trim();
  const sortOrder = parseInt(courseEls.courseModuleSortOrder.value) || 0;
  
  if (courseState.modules.some(m => String(m.id) !== String(id) && m.name.toLowerCase() === name.toLowerCase())) {
    showToast("Bu isimde bir modül zaten kayıtlı.", "warning");
    return;
  }
  
  const newModule = {
    id: id || uid("module"),
    name,
    sortOrder
  };
  
  if (id) {
    const idx = courseState.modules.findIndex(m => String(m.id) === String(id));
    if (idx >= 0) courseState.modules[idx] = newModule;
  } else {
    courseState.modules.push(newModule);
  }
  
  saveCourseState();
  showToast("Modül başarıyla kaydedildi.");
  clearModuleForm();
  renderModulesTab();
}

async function deleteModule() {
  const id = courseEls.courseModuleId.value;
  if (!id) return;
  if (!await appConfirm("Bu modülü ve bu modüle ait tüm yoklama/not kayıtlarını silmek istediğinize emin misiniz?", { title: "Modülü sil", okText: "Sil" })) return;
  courseState.modules = courseState.modules.filter(m => String(m.id) !== String(id));
    
    Object.keys(courseState.attendance).forEach(key => {
      const parts = key.split("_");
      if (parts[1] === String(id)) delete courseState.attendance[key];
    });
    Object.keys(courseState.examSummaries).forEach(key => {
      const parts = key.split("_");
      if (parts[1] === String(id)) delete courseState.examSummaries[key];
    });
    delete courseState.questions[id];
    
    if (String(courseState.selectedModuleId) === String(id)) {
      courseState.selectedModuleId = courseState.modules[0]?.id || "";
    }
    
    saveCourseState();
    showToast("Modül silindi.", "info");
    clearModuleForm();
    renderModulesTab();
}

async function deleteAllModules() {
  if (!await appConfirm("Tüm modülleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!", { title: "Tüm modülleri sil", okText: "Sil" })) return;
  courseState.modules = [];
  courseState.attendance = {};
  courseState.examSummaries = {};
  courseState.questions = {};
  courseState.selectedModuleId = "";
  saveCourseState();
  showToast("Tüm modüller ve bağlı veriler silindi.", "info");
  clearModuleForm();
  renderModulesTab();
}

async function searchWebCourses() {
  const query = courseEls.courseWebSearchInput.value.trim();
  if (!query) {
    showToast("Lütfen bir arama terimi girin.", "warning");
    return;
  }
  
  courseEls.courseWebSearchBtn.disabled = true;
  courseEls.courseWebSearchBtn.textContent = "Aranıyor...";
  
  try {
    const res = await fetch("/api/meb-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error("Arama isteği başarısız.");
    const data = await res.json();
    
    if (data && data.length > 0) {
      courseEls.courseWebResultSelect.innerHTML = data.map(item => `
        <option value="${item.kurs_id}">${escapeHtml(item.kurs_adi)} (${item.kurs_suresi} Saat)</option>
      `).join("");
      courseEls.courseWebResultLabel.hidden = false;
      courseEls.courseImportWebModulesBtn.disabled = false;
    } else {
      showToast("Aramayla eşleşen kurs bulunamadı.", "info");
      courseEls.courseWebResultLabel.hidden = true;
      courseEls.courseImportWebModulesBtn.disabled = true;
    }
  } catch (err) {
    showToast("Web araması yapılamadı: " + err.message, "error");
  } finally {
    courseEls.courseWebSearchBtn.disabled = false;
    courseEls.courseWebSearchBtn.textContent = "Ara";
  }
}

async function importWebModules() {
  const courseId = courseEls.courseWebResultSelect.value;
  if (!courseId) return;
  
  courseEls.courseImportWebModulesBtn.disabled = true;
  courseEls.courseImportWebModulesBtn.textContent = "Alınıyor...";
  
  try {
    const res = await fetch("/api/meb-modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId })
    });
    if (!res.ok) throw new Error("Modül isteği başarısız.");
    const data = await res.json();
    
    if (data && data.length > 0) {
      let nextSort = courseState.modules.reduce((max, m) => Math.max(max, m.sortOrder || 0), 0) + 1;
      let importedCount = 0;
      
      data.forEach(item => {
        const name = item.modul_adi.trim();
        if (name && !courseState.modules.some(m => m.name.toLowerCase() === name.toLowerCase())) {
          courseState.modules.push({
            id: uid("module"),
            name,
            sortOrder: nextSort++
          });
          importedCount++;
        }
      });
      
      if (importedCount > 0) {
        saveCourseState();
        showToast(`${importedCount} yeni modül başarıyla içe aktarıldı.`);
        renderModulesTab();
      } else {
        showToast("Tüm modüller zaten kayıtlıydı.", "info");
      }
    } else {
      showToast("Bu kursa ait modül bulunamadı.", "info");
    }
  } catch (err) {
    showToast("Modüller alınamadı: " + err.message, "error");
  } finally {
    courseEls.courseImportWebModulesBtn.disabled = false;
    courseEls.courseImportWebModulesBtn.textContent = "Aktar";
  }
}

// === ÖĞRENCİLER CRUD ===
function renderStudentsTab() {
  if (!courseEls.courseStudentsBody) return;
  
  const sorted = [...courseState.students].sort((a, b) => {
    const sa = parseInt(a.sortOrder) || 0;
    const sb = parseInt(b.sortOrder) || 0;
    return sa - sb || a.firstName.localeCompare(b.firstName, "tr") || a.lastName.localeCompare(b.lastName, "tr");
  });
  
  courseEls.courseStudentsBody.innerHTML = sorted.map((s, idx) => `
    <tr data-student-id="${s.id}">
      <td><strong>${s.sortOrder || (idx + 1)}</strong></td>
      <td>${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</td>
      <td>${escapeHtml(s.phoneNumber || '-')}</td>
    </tr>
  `).join("");
}

function clearStudentForm() {
  courseEls.courseStudentForm.reset();
  courseEls.courseStudentId.value = "";
  courseEls.courseDeleteStudentBtn.disabled = true;
}

function editStudent(studentId) {
  const s = courseState.students.find(item => String(item.id) === String(studentId));
  if (!s) return;
  
  courseEls.courseStudentId.value = s.id;
  courseEls.courseStudentFullNameInput.value = `${s.firstName} ${s.lastName}`.trim();
  courseEls.courseStudentPhone.value = s.phoneNumber || "";
  courseEls.courseDeleteStudentBtn.disabled = false;
}

function saveStudent(e) {
  e.preventDefault();
  const id = courseEls.courseStudentId.value;
  const fullName = courseEls.courseStudentFullNameInput.value.trim();
  const parts = fullName.split(" ").filter(Boolean);
  let firstName = "";
  let lastName = "";
  if (parts.length > 0) {
    if (parts.length === 1) {
      firstName = parts[0];
    } else {
      lastName = parts[parts.length - 1].toUpperCase();
      firstName = parts.slice(0, -1).join(" ");
    }
  }
  const phoneNumber = courseEls.courseStudentPhone.value.trim();
  
  function toTitleCase(str) {
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  
  const cFirst = toTitleCase(firstName);
  
  const newStudent = {
    id: id || uid("student"),
    firstName: cFirst,
    lastName,
    phoneNumber,
    sortOrder: id ? (courseState.students.find(s => String(s.id) === String(id))?.sortOrder || courseState.students.length + 1) : courseState.students.length + 1
  };
  
  if (id) {
    const idx = courseState.students.findIndex(s => String(s.id) === String(id));
    if (idx >= 0) courseState.students[idx] = newStudent;
  } else {
    courseState.students.push(newStudent);
  }
  
  saveCourseState();
  showToast("Öğrenci başarıyla kaydedildi.");
  clearStudentForm();
  renderStudentsTab();
}

async function deleteStudent() {
  const id = courseEls.courseStudentId.value;
  if (!id) return;
  if (!await appConfirm("Bu öğrenciyi ve bu öğrenciye ait tüm yoklama/not kayıtlarını silmek istediğinize emin misiniz?", { title: "Öğrenciyi sil", okText: "Sil" })) return;
  courseState.students = courseState.students.filter(s => String(s.id) !== String(id));
  
  Object.keys(courseState.attendance).forEach(key => {
    const parts = key.split("_");
    if (parts[0] === String(id)) delete courseState.attendance[key];
  });
  Object.keys(courseState.examSummaries).forEach(key => {
    const parts = key.split("_");
    if (parts[0] === String(id)) delete courseState.examSummaries[key];
  });
  
  saveCourseState();
  showToast("Öğrenci silindi.", "info");
  clearStudentForm();
  renderStudentsTab();
}

async function deleteAllStudents() {
  if (!await appConfirm("Tüm öğrencileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!", { title: "Tüm öğrencileri sil", okText: "Sil" })) return;
  courseState.students = [];
  courseState.attendance = {};
  courseState.examSummaries = {};
  saveCourseState();
  showToast("Tüm öğrenciler silindi.", "info");
  clearStudentForm();
  renderStudentsTab();
}

async function handleExcelImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append("file", file);
  
  showToast("Öğrenci listesi içe aktarılıyor...", "info");
  
  try {
    const res = await fetch("/api/import-course-students", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("İçe aktarma hatası.");
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);
    
    if (data.records && data.records.length > 0) {
      let importedCount = 0;
      let nextSort = courseState.students.reduce((max, s) => Math.max(max, s.sortOrder || 0), 0) + 1;
      
      data.records.forEach(rec => {
        const fn = rec.firstName.trim();
        const ln = rec.lastName.trim();
        const ph = (rec.phoneNumber || "").trim();
        
        const exists = courseState.students.some(s => 
          s.firstName.toLowerCase() === fn.toLowerCase() && 
          s.lastName.toLowerCase() === ln.toLowerCase()
        );
        
        if (!exists) {
          courseState.students.push({
            id: uid("student"),
            firstName: fn,
            lastName: ln,
            phoneNumber: ph,
            sortOrder: nextSort++
          });
          importedCount++;
        }
      });
      
      saveCourseState();
      showToast(`${importedCount} yeni öğrenci başarıyla içe aktarıldı.`);
      renderStudentsTab();
    } else {
      showToast("İçe aktarılacak öğrenci bulunamadı veya tümü zaten ekliydi.", "info");
    }
  } catch (err) {
    showToast("Excel içe aktarılamadı: " + err.message, "error");
  } finally {
    e.target.value = "";
  }
}

// === YOKLAMA (ATTENDANCE) ===
function getStudentAttendanceStats(studentId) {
  let present = 0;
  let absent = 0;
  const modId = courseState.selectedModuleId;
  
  Object.entries(courseState.attendance).forEach(([key, val]) => {
    const parts = key.split("_");
    if (parts[0] === String(studentId) && parts[1] === String(modId)) {
      if (val === 1) present++;
      else absent++;
    }
  });
  
  return { present, absent };
}

function renderAttendanceTab() {
  if (!courseEls.courseAttendanceBody) return;
  if (!courseState.selectedModuleId) {
    courseEls.courseAttendanceBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Lütfen sol alt taraftan aktif modül seçin.</td></tr>`;
    return;
  }
  
  let dateStr = courseEls.courseAttendanceDate.value;
  if (!dateStr) {
    dateStr = new Date().toISOString().split("T")[0];
    courseEls.courseAttendanceDate.value = dateStr;
  }
  
  const sorted = [...courseState.students].sort((a, b) => a.firstName.localeCompare(b.firstName, "tr") || a.lastName.localeCompare(b.lastName, "tr"));
  if (sorted.length === 0) {
    courseEls.courseAttendanceBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Kayıtlı öğrenci bulunamadı.</td></tr>`;
    return;
  }
  
  courseEls.courseAttendanceBody.innerHTML = sorted.map((s, idx) => {
    const key = `${s.id}_${courseState.selectedModuleId}_${dateStr}`;
    const isAbsentToday = courseState.attendance[key] === 0;
    const { present, absent } = getStudentAttendanceStats(s.id);
    
    const totalDays = present + absent;
    const absentPercent = totalDays > 0 ? (absent / totalDays) * 100 : 0;
    
    let statusBadge = `<span class="badge badge-light-teal">Aktif</span>`;
    if (absent > 5) {
      statusBadge = `<span class="badge badge-light-red">Devamsız</span>`;
    } else if (absent > 3) {
      statusBadge = `<span class="badge badge-light-orange">Riskli</span>`;
    }
    
    return `
      <tr data-student-id="${s.id}">
        <td><strong>${idx + 1}</strong></td>
        <td><strong>${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</strong></td>
        <td>
          <label class="compact-checkbox-container" style="justify-content:center;margin:0;">
            <input type="checkbox" class="course-attendance-checkbox" data-student-id="${s.id}" ${isAbsentToday ? 'checked' : ''} />
            <span class="checkmark"></span>
          </label>
        </td>
        <td>
          <div style="display:flex;align-items:center;width:100%;">
            <div style="display:flex;flex:1;height:18px;background:#e2e8f0;border-radius:6px;overflow:hidden;position:relative;align-items:center;border:1px solid var(--line);box-shadow:inset 0 1px 2px rgba(0,0,0,0.1);">
              ${totalDays > 0 ? `
                <div style="width:${(present/totalDays)*100}%;height:100%;background:#10b981;box-shadow:inset 0 -1px 0 rgba(0,0,0,0.15);" title="Geldi: ${present} gün"></div>
                <div style="width:${(absent/totalDays)*100}%;height:100%;background:#f43f5e;box-shadow:inset 0 -1px 0 rgba(0,0,0,0.15);" title="Gelmedi: ${absent} gün"></div>
              ` : `
                <div style="width:100%;height:100%;background:#e2e8f0;"></div>
              `}
              <span style="position:absolute;width:100%;text-align:center;font-size:10px;font-weight:700;${totalDays > 0 ? 'color:#ffffff;text-shadow:0 1px 3px rgba(0,0,0,0.9);' : 'color:#475569;'}pointer-events:none;letter-spacing:0.3px;">
                ${present} Geldi / ${absent} Gelmedi
              </span>
            </div>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <button class="ghost-action student-card-btn" type="button" data-student-id="${s.id}" style="padding:4px 8px;font-size:0.8rem;">Kartı</button>
        </td>
      </tr>
    `;
  }).join("");
  filterAttendanceRows();
}

function filterAttendanceRows() {
  const query = (courseEls.courseAttendanceSearch?.value || "").trim().toLowerCase();
  const rows = courseEls.courseAttendanceBody ? courseEls.courseAttendanceBody.querySelectorAll("tr[data-student-id]") : [];
  rows.forEach(row => {
    const name = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
    if (name.includes(query)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function saveAttendance() {
  const dateStr = courseEls.courseAttendanceDate.value;
  if (!dateStr || !courseState.selectedModuleId) return;
  
  const checkboxes = courseEls.courseAttendanceBody.querySelectorAll(".course-attendance-checkbox");
  checkboxes.forEach(cb => {
    const sid = cb.dataset.studentId;
    const isAbsent = cb.checked;
    const key = `${sid}_${courseState.selectedModuleId}_${dateStr}`;
    
    courseState.attendance[key] = isAbsent ? 0 : 1;
  });
  
  saveCourseState();
  showToast("Yoklama başarıyla kaydedildi.");
  renderAttendanceTab();
}

function clearAttendanceMarks() {
  const checkboxes = courseEls.courseAttendanceBody.querySelectorAll(".course-attendance-checkbox");
  checkboxes.forEach(cb => cb.checked = false);
  showToast("İşaretler temizlendi. Değişikliklerin kaydedilmesi için 'Kaydet' butonuna basmalısınız.", "info");
}

// === SINAV NOTU GİRİŞİ ===
function getStudentGratesForDate(studentId, moduleId, dateStr) {
  const specificKey = `${studentId}_${moduleId}_${dateStr}`;
  if (courseState.examSummaries[specificKey]) {
    return { ...courseState.examSummaries[specificKey], isDated: true };
  }
  
  const keys = Object.keys(courseState.examSummaries).filter(k => k.startsWith(`${studentId}_${moduleId}_`));
  if (keys.length > 0) {
    keys.sort((a, b) => {
      const da = a.split("_")[2];
      const db = b.split("_")[2];
      return db.localeCompare(da);
    });
    return { ...courseState.examSummaries[keys[0]], isDated: false };
  }
  
  return { Y1: "", Y2: "", Y3: "", P1: "", P2: "", didNotAttend: false, isDated: false };
}

function renderGradesTab() {
  if (!courseEls.courseGradesBody) return;
  if (!courseState.selectedModuleId) {
    courseEls.courseGradesBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--muted)">Lütfen sol alt taraftan aktif modül seçin.</td></tr>`;
    return;
  }
  
  let dateStr = courseEls.courseExamDate.value;
  if (!dateStr) {
    dateStr = new Date().toISOString().split("T")[0];
    courseEls.courseExamDate.value = dateStr;
  }
  
  const sorted = [...courseState.students].sort((a, b) => a.firstName.localeCompare(b.firstName, "tr") || a.lastName.localeCompare(b.lastName, "tr"));
  if (sorted.length === 0) {
    courseEls.courseGradesBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--muted)">Kayıtlı öğrenci bulunamadı.</td></tr>`;
    return;
  }
  
  courseEls.courseGradesBody.innerHTML = sorted.map((s, idx) => {
    const grades = getStudentGratesForDate(s.id, courseState.selectedModuleId, dateStr);
    
    return `
      <tr data-student-id="${s.id}">
        <td><strong>${idx + 1}</strong></td>
        <td><strong>${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</strong></td>
        <td><input type="text" class="course-grade-input" data-student-id="${s.id}" data-field="Y1" value="${escapeHtml(grades.Y1 || '')}" style="width:60px;text-align:center;" ${grades.didNotAttend ? 'disabled' : ''} /></td>
        <td><input type="text" class="course-grade-input" data-student-id="${s.id}" data-field="Y2" value="${escapeHtml(grades.Y2 || '')}" style="width:60px;text-align:center;" ${grades.didNotAttend ? 'disabled' : ''} /></td>
        <td><input type="text" class="course-grade-input" data-student-id="${s.id}" data-field="Y3" value="${escapeHtml(grades.Y3 || '')}" style="width:60px;text-align:center;" ${grades.didNotAttend ? 'disabled' : ''} /></td>
        <td><input type="text" class="course-grade-input" data-student-id="${s.id}" data-field="P1" value="${escapeHtml(grades.P1 || '')}" style="width:60px;text-align:center;" ${grades.didNotAttend ? 'disabled' : ''} /></td>
        <td><input type="text" class="course-grade-input" data-student-id="${s.id}" data-field="P2" value="${escapeHtml(grades.P2 || '')}" style="width:60px;text-align:center;" ${grades.didNotAttend ? 'disabled' : ''} /></td>
        <td>
          <label class="compact-checkbox-container" style="justify-content:center;margin:0;">
            <input type="checkbox" class="course-grade-dna-checkbox" data-student-id="${s.id}" ${grades.didNotAttend ? 'checked' : ''} />
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="course-grade-result-cell" data-student-id="${s.id}"></td>
        <td>
          <button class="ghost-action student-card-btn" type="button" data-student-id="${s.id}" style="padding:4px 8px;font-size:0.8rem;">Kartı</button>
        </td>
      </tr>
    `;
  }).join("");
  
  sorted.forEach(s => {
    updateStudentGradeRowResult(s.id);
  });
  filterGradesRows();
}

function filterGradesRows() {
  const query = (courseEls.courseGradesSearch?.value || "").trim().toLowerCase();
  const rows = courseEls.courseGradesBody ? courseEls.courseGradesBody.querySelectorAll("tr[data-student-id]") : [];
  rows.forEach(row => {
    const name = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
    if (name.includes(query)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function updateStudentGradeRowResult(studentId) {
  const row = courseEls.courseGradesBody.querySelector(`tr[data-student-id="${studentId}"]`);
  if (!row) return;
  
  const dnaCheckbox = row.querySelector(".course-grade-dna-checkbox");
  const resultCell = row.querySelector(".course-grade-result-cell");
  
  if (dnaCheckbox.checked) {
    resultCell.innerHTML = `<span class="badge badge-light-red">Girmedi</span>`;
    return;
  }
  
  const inputs = row.querySelectorAll(".course-grade-input");
  const scores = [];
  inputs.forEach(input => {
    const val = input.value.trim().replace(",", ".");
    if (val !== "") {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        scores.push(parsed);
      }
    }
  });
  
  if (scores.length === 0) {
    resultCell.innerHTML = "-";
  } else {
    const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
    if (avg >= 50) {
      resultCell.innerHTML = `<span class="badge badge-light-teal">Geçti (${avg.toFixed(1)})</span>`;
    } else {
      resultCell.innerHTML = `<span class="badge badge-light-red">Kaldı (${avg.toFixed(1)})</span>`;
    }
  }
}

function saveGrades() {
  const dateStr = courseEls.courseExamDate.value;
  if (!dateStr || !courseState.selectedModuleId) return;
  
  const rows = courseEls.courseGradesBody.querySelectorAll("tr[data-student-id]");
  rows.forEach(row => {
    const sid = row.dataset.studentId;
    const dna = row.querySelector(".course-grade-dna-checkbox").checked;
    
    const record = {
      Y1: "", Y2: "", Y3: "", P1: "", P2: "",
      didNotAttend: dna
    };
    
    const inputs = row.querySelectorAll(".course-grade-input");
    inputs.forEach(input => {
      const field = input.dataset.field;
      record[field] = input.value.trim();
    });
    
    const key = `${sid}_${courseState.selectedModuleId}_${dateStr}`;
    courseState.examSummaries[key] = record;
  });
  
  saveCourseState();
  showToast("Sınav notları başarıyla kaydedildi.");
  renderGradesTab();
}

function clearGradesFields() {
  const inputs = courseEls.courseGradesBody.querySelectorAll(".course-grade-input");
  inputs.forEach(input => input.value = "");
  const checkboxes = courseEls.courseGradesBody.querySelectorAll(".course-grade-dna-checkbox");
  checkboxes.forEach(cb => {
    cb.checked = false;
    const row = cb.closest("tr");
    row.querySelectorAll(".course-grade-input").forEach(input => input.disabled = false);
  });
  
  const rows = courseEls.courseGradesBody.querySelectorAll("tr[data-student-id]");
  rows.forEach(row => {
    const sid = row.dataset.studentId;
    updateStudentGradeRowResult(sid);
  });
  
  showToast("Giriş alanları temizlendi. Değişikliklerin kaydedilmesi için 'Kaydet' butonuna basmalısınız.", "info");
}

// === YAZILI SINAV HAZIRLAMA (EXAM PREP) ===
let activeEditingQuestionId = null;

function renderExamPrepTab() {
  if (!courseEls.courseExamPrepStudentsBody) return;
  
  const sorted = [...courseState.students].sort((a, b) => a.firstName.localeCompare(b.firstName, "tr") || a.lastName.localeCompare(b.lastName, "tr"));
  if (sorted.length === 0) {
    courseEls.courseExamPrepStudentsBody.innerHTML = `<tr><td colspan="2" style="text-align:center;padding:15px;color:var(--muted)">Kayıtlı öğrenci bulunamadı.</td></tr>`;
    return;
  }
  
  courseEls.courseExamPrepStudentsBody.innerHTML = sorted.map(s => `
    <tr>
      <td>
        <label class="compact-checkbox-container" style="justify-content:center;margin:0;">
          <input type="checkbox" class="course-examprep-student-checkbox" data-student-id="${s.id}" data-student-name="${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}" checked />
          <span class="checkmark"></span>
        </label>
      </td>
      <td><strong>${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</strong></td>
    </tr>
  `).join("");
}

function selectAllExamPrepStudents() {
  const checkboxes = courseEls.courseExamPrepStudentsBody.querySelectorAll(".course-examprep-student-checkbox");
  checkboxes.forEach(cb => cb.checked = true);
}

function clearAllExamPrepStudents() {
  const checkboxes = courseEls.courseExamPrepStudentsBody.querySelectorAll(".course-examprep-student-checkbox");
  checkboxes.forEach(cb => cb.checked = false);
}

function renderQuestionListInDialog() {
  const listEl = courseEls.courseDialogQuestionsList;
  if (!listEl) return;
  const modId = courseState.selectedModuleId;
  const questions = courseState.questions[modId] || [];
  
  questions.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
  
  if (questions.length === 0) {
    listEl.innerHTML = `<div style="padding:15px;text-align:center;color:var(--muted)">Soru bankası boş.</div>`;
    if (courseEls.courseDialogQuestionCount) courseEls.courseDialogQuestionCount.textContent = "0 soru";
    return;
  }
  
  if (courseEls.courseDialogQuestionCount) courseEls.courseDialogQuestionCount.textContent = `${questions.length} soru`;
  
  const showAnswers = document.querySelector("#courseShowAnswersToggle")?.checked || false;
  
  if (showAnswers) {
    listEl.innerHTML = questions.map(q => `
      <div class="course-dialog-list-item-expanded ${String(q.id) === String(activeEditingQuestionId) ? 'is-active' : ''}" data-question-id="${q.id}">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size:0.82rem;">
          <span>Soru ${q.questionNumber || 0}</span>
          <span style="color:var(--accent); background:rgba(15, 118, 110, 0.1); padding:1px 6px; border-radius:4px; font-size:0.75rem;">Doğru: ${q.correctOption}</span>
        </div>
        <div style="font-size:0.82rem; margin-bottom:6px; font-weight:550; color:#1e293b; line-height:1.2; word-break:break-word;">${escapeHtml(q.questionText)}</div>
        <div style="font-size:0.74rem; color:#64748b; display:grid; grid-template-columns:1fr 1fr; gap:4px; border-top:1px dashed #e2e8f0; padding-top:4px; margin-bottom:4px;">
          <div class="${q.correctOption === 'A' ? 'correct-option-highlight' : ''}"><strong>A)</strong> ${escapeHtml(q.optionA || '')}</div>
          <div class="${q.correctOption === 'B' ? 'correct-option-highlight' : ''}"><strong>B)</strong> ${escapeHtml(q.optionB || '')}</div>
          <div class="${q.correctOption === 'C' ? 'correct-option-highlight' : ''}"><strong>C)</strong> ${escapeHtml(q.optionC || '')}</div>
          <div class="${q.correctOption === 'D' ? 'correct-option-highlight' : ''}"><strong>D)</strong> ${escapeHtml(q.optionD || '')}</div>
          ${q.optionE ? `<div class="${q.correctOption === 'E' ? 'correct-option-highlight' : ''}" style="grid-column: span 2;"><strong>E)</strong> ${escapeHtml(q.optionE)}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <button style="background:var(--accent); color:#fff; border:0; padding:2px 6px; border-radius:4px; font-size:0.7rem; cursor:pointer;" type="button">Seç / Düzenle</button>
        </div>
      </div>
    `).join("");
  } else {
    function truncateString(str, num) {
      if (str.length <= num) return str;
      return str.slice(0, num) + "...";
    }
    listEl.innerHTML = questions.map(q => `
      <button class="course-dialog-list-item ${String(q.id) === String(activeEditingQuestionId) ? 'is-active' : ''}" type="button" data-question-id="${q.id}">
        <strong>Soru ${q.questionNumber || 0}:</strong> ${escapeHtml(truncateString(q.questionText, 65))}
      </button>
    `).join("");
  }
}

function clearQuestionForm() {
  courseEls.courseQuestionEditorForm.reset();
  courseEls.courseQuestionId.value = "";
  activeEditingQuestionId = null;
  courseEls.courseQuestionDeleteBtn.disabled = true;
  
  const modId = courseState.selectedModuleId;
  const questions = courseState.questions[modId] || [];
  courseEls.courseQuestionNumber.value = questions.length + 1;
}

function editCourseQuestion(qId) {
  const modId = courseState.selectedModuleId;
  const questions = courseState.questions[modId] || [];
  const q = questions.find(item => String(item.id) === String(qId));
  if (!q) return;
  
  activeEditingQuestionId = q.id;
  courseEls.courseQuestionId.value = q.id;
  courseEls.courseQuestionNumber.value = q.questionNumber;
  courseEls.courseQuestionCorrect.value = q.correctOption || "A";
  courseEls.courseQuestionText.value = q.questionText;
  courseEls.courseOptionA.value = q.optionA || "";
  courseEls.courseOptionB.value = q.optionB || "";
  courseEls.courseOptionC.value = q.optionC || "";
  courseEls.courseOptionD.value = q.optionD || "";
  courseEls.courseOptionE.value = q.optionE || "";
  
  courseEls.courseQuestionDeleteBtn.disabled = false;
  renderQuestionListInDialog();
}

function saveCourseQuestion(e) {
  e.preventDefault();
  const modId = courseState.selectedModuleId;
  if (!modId) return;
  
  if (!courseState.questions[modId]) courseState.questions[modId] = [];
  
  const id = courseEls.courseQuestionId.value;
  const questionNumber = parseInt(courseEls.courseQuestionNumber.value) || 1;
  const correctOption = courseEls.courseQuestionCorrect.value;
  const questionText = courseEls.courseQuestionText.value.trim();
  const optionA = courseEls.courseOptionA.value.trim();
  const optionB = courseEls.courseOptionB.value.trim();
  const optionC = courseEls.courseOptionC.value.trim();
  const optionD = courseEls.courseOptionD.value.trim();
  const optionE = courseEls.courseOptionE.value.trim();
  
  const newQ = {
    id: id || uid("question"),
    questionNumber,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    optionE,
    correctOption
  };
  
  const questions = courseState.questions[modId];
  
  if (id) {
    const idx = questions.findIndex(q => String(q.id) === String(id));
    if (idx >= 0) questions[idx] = newQ;
  } else {
    if (questions.some(q => q.questionNumber === questionNumber)) {
      showToast(`Soru sayısı ${questionNumber} zaten mevcut. Lütfen başka bir numara seçin.`, "warning");
      return;
    }
    questions.push(newQ);
  }
  
  saveCourseState();
  showToast("Soru başarıyla kaydedildi.");
  clearQuestionForm();
  renderQuestionListInDialog();
  updateActiveModuleDisplay();
}

async function deleteQuestion() {
  const modId = courseState.selectedModuleId;
  const id = courseEls.courseQuestionId.value;
  if (!modId || !id) return;
  
  if (!await appConfirm("Bu soruyu silmek istediğinize emin misiniz?", { title: "Soruyu sil", okText: "Sil" })) return;
  courseState.questions[modId] = (courseState.questions[modId] || []).filter(q => String(q.id) !== String(id));
  saveCourseState();
  showToast("Soru silindi.", "info");
  clearQuestionForm();
  renderQuestionListInDialog();
  updateActiveModuleDisplay();
}

// ═══════════════════════ SORU AKTARMA SİHİRBAZI ═══════════════════════
const importWizardState = { currentStep: 1, selectedFile: null, parsedQuestions: [] };

function openImportWizard() {
  const modId = courseState.selectedModuleId;
  if (!modId) { showToast("Lütfen önce bir modül seçin.", "warning"); return; }
  const dialog = document.getElementById("courseImportWizardDialog");
  if (!dialog) return;
  importWizardState.currentStep = 1;
  importWizardState.selectedFile = null;
  importWizardState.parsedQuestions = [];
  const fi = document.getElementById("importWizardFileInput");
  if (fi) fi.value = "";
  const selectedBox = document.getElementById("importDropZoneSelected");
  if (selectedBox) selectedBox.style.display = "none";
  const nextBtn = document.getElementById("wizardStep1NextBtn");
  if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = "0.5"; nextBtn.textContent = "Devam →"; }
  wizardGoToStep(1);
  dialog.showModal();
}

function wizardGoToStep(step) {
  importWizardState.currentStep = step;
  const labels = ["Ad\u0131m 1 / 3 \u2014 Dosya Se\u00e7", "Ad\u0131m 2 / 3 \u2014 \u00d6nizleme", "Ad\u0131m 3 / 3 \u2014 Aktar\u0131m Se\u00e7enekleri"];
  const labelEl = document.getElementById("importWizardStepLabel");
  if (labelEl) labelEl.textContent = labels[step - 1] || "";
  document.querySelectorAll(".wizard-step-dot").forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.remove("active", "done");
    if (s === step) dot.classList.add("active");
    else if (s < step) dot.classList.add("done");
  });
  [1, 2, 3].forEach(s => {
    const el = document.getElementById("wizardStep" + s);
    if (el) el.style.display = (s === step) ? "" : "none";
  });
  if (step === 2) wizardRenderPreview();
  if (step === 3) wizardUpdateSummary();
}

function wizardSetFile(file) {
  if (!file) return;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!["docx", "pdf", "txt"].includes(ext)) {
    showToast("Desteklenmeyen dosya t\u00fcr\u00fc. L\u00fctfen .docx, .pdf veya .txt se\u00e7in.", "warning");
    return;
  }
  importWizardState.selectedFile = file;
  const nameEl = document.getElementById("importSelectedFileName");
  const sizeEl = document.getElementById("importSelectedFileSize");
  const selectedBox = document.getElementById("importDropZoneSelected");
  const nextBtn = document.getElementById("wizardStep1NextBtn");
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = (file.size / 1024).toFixed(1) + " KB";
  if (selectedBox) selectedBox.style.display = "flex";
  if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = "1"; }
}

function wizardClearFile() {
  importWizardState.selectedFile = null;
  const selectedBox = document.getElementById("importDropZoneSelected");
  const nextBtn = document.getElementById("wizardStep1NextBtn");
  const fi = document.getElementById("importWizardFileInput");
  if (selectedBox) selectedBox.style.display = "none";
  if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = "0.5"; }
  if (fi) fi.value = "";
}

async function wizardParseFile() {
  const file = importWizardState.selectedFile;
  if (!file) return false;
  const dialog = document.getElementById("courseImportWizardDialog");
  const overlay = document.createElement("div");
  overlay.id = "wizardLoadingOverlay";
  overlay.innerHTML = '<div class="wizard-spinner"></div><span>Dosya i\u015fleniyor\u2026</span>';
  if (dialog) dialog.appendChild(overlay);
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import-course-questions", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Sunucu hatas\u0131: " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.questions || data.questions.length === 0) {
      showToast(data.warning || "Dosyadan soru ayr\u0131\u015ft\u0131r\u0131lamad\u0131.", "warning");
      return false;
    }
    importWizardState.parsedQuestions = data.questions;
    return true;
  } catch (err) {
    showToast("Dosya i\u015fleme hatas\u0131: " + err.message, "error");
    return false;
  } finally {
    overlay.remove();
  }
}

function wizardRenderPreview() {
  const list = document.getElementById("wizardPreviewList");
  const countEl = document.getElementById("wizardPreviewCount");
  const qs = importWizardState.parsedQuestions;
  if (!list) return;
  if (countEl) countEl.textContent = qs.length + " soru";
  const showAnswers = document.getElementById("wizardShowAnswers")?.checked || false;
  const opts = ["A", "B", "C", "D", "E"];
  list.innerHTML = qs.map((q, idx) => {
    const optsHtml = opts.map(letter => {
      const txt = q["option" + letter] || "";
      if (!txt) return "";
      const isCorrect = (q.correctOption || "A").toUpperCase() === letter;
      return '<div class="wizard-q-opt ' + (showAnswers && isCorrect ? "correct" : "") + '"><strong>' + letter + ')</strong> ' + escapeHtml(txt) + '</div>';
    }).filter(Boolean).join("");
    const selOpts = opts.map(l => '<option value="' + l + '"' + ((q.correctOption || "A").toUpperCase() === l ? " selected" : "") + '>' + l + '</option>').join("");
    return '<div class="wizard-q-card">'
      + '<div class="wizard-q-header"><span class="wizard-q-num">Soru ' + (idx + 1) + '</span>'
      + '<label style="font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:4px;">Do\u011fru \u015e\u0131k: <select class="wizard-answer-select" data-q-idx="' + idx + '">' + selOpts + '</select></label></div>'
      + '<div class="wizard-q-body">' + escapeHtml(q.text || "") + (showAnswers && optsHtml ? '<div class="wizard-q-options">' + optsHtml + '</div>' : '') + '</div>'
      + '</div>';
  }).join("");
  list.querySelectorAll(".wizard-answer-select").forEach(sel => {
    sel.addEventListener("change", e => {
      const i = parseInt(e.target.dataset.qIdx);
      if (importWizardState.parsedQuestions[i]) {
        importWizardState.parsedQuestions[i].correctOption = e.target.value;
        if (document.getElementById("wizardShowAnswers")?.checked) wizardRenderPreview();
      }
    });
  });
}

function wizardUpdateSummary() {
  const qs = importWizardState.parsedQuestions;
  const cEl = document.getElementById("wizardSummaryCount");
  const aEl = document.getElementById("wizardSummaryWithAnswers");
  if (cEl) cEl.textContent = qs.length;
  if (aEl) aEl.textContent = qs.filter(q => q.correctOption && q.correctOption !== "").length;
}

function wizardDoFinalImport() {
  const modId = courseState.selectedModuleId;
  if (!modId) return;
  const mode = document.querySelector("input[name='wizardImportMode']:checked")?.value || "add";
  const qs = importWizardState.parsedQuestions;
  if (!courseState.questions) courseState.questions = {};
  if (!courseState.questions[modId]) courseState.questions[modId] = [];
  if (mode === "replace") courseState.questions[modId] = [];
  let nextNum = courseState.questions[modId].reduce((max, q) => Math.max(max, q.questionNumber || 0), 0) + 1;
  qs.forEach(q => {
    courseState.questions[modId].push({
      id: uid("question"),
      questionNumber: nextNum++,
      questionText: q.text,
      optionA: q.optionA || "",
      optionB: q.optionB || "",
      optionC: q.optionC || "",
      optionD: q.optionD || "",
      optionE: q.optionE || "",
      correctOption: q.correctOption || "A"
    });
  });
  saveCourseState();
  document.getElementById("courseImportWizardDialog")?.close();
  showToast("\u2705 " + qs.length + " soru ba\u015far\u0131yla aktar\u0131ld\u0131!");
  renderQuestionListInDialog();
  updateActiveModuleDisplay();
}

// ═══════════════════════ BANKA IMPORT WIZARD (MAIN) ═══════════════════════
const bankImportWizardState = { currentStep: 1, selectedFile: null, parsedQuestions: [] };

function openBankImportWizard() {
  const dialog = document.getElementById("bankImportWizardDialog");
  if (!dialog) return;
  bankImportWizardState.currentStep = 1;
  bankImportWizardState.selectedFile = null;
  bankImportWizardState.parsedQuestions = [];
  const fi = document.getElementById("bankImportWizardFileInput");
  if (fi) fi.value = "";
  const selectedBox = document.getElementById("bankImportDropZoneSelected");
  if (selectedBox) selectedBox.style.display = "none";
  const nextBtn = document.getElementById("bankWizardStep1NextBtn");
  if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = "0.5"; }
  
  // Populate unit/topic selector dropdown
  const topicSelect = document.getElementById("bankWizardTopicSelect");
  if (topicSelect) {
    const course = currentCourse();
    const topics = Array.from(new Set(state.curriculumItems
      .filter(item => item.courseName === course.name)
      .map(item => item.topic)))
      .filter(Boolean);
    topicSelect.innerHTML = topics.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("") || '<option value="">Birim Yok</option>';
    updateBankWizardOutcomes();
  }

  // Populate grade dropdown
  const gradeSelect = document.getElementById("bankWizardGradeSelect");
  if (gradeSelect) {
    const course = currentCourse();
    const grades = ["9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf"];
    const currentGrade = course.grade || "11. sınıf";
    gradeSelect.innerHTML = grades.map(g => `<option value="${escapeHtml(g)}"${g.toLowerCase() === currentGrade.toLowerCase() ? " selected" : ""}>${escapeHtml(g)}</option>`).join("");
  }

  bankWizardGoToStep(1);
  dialog.showModal();
}

function updateBankWizardOutcomes() {
  const topicSelect = document.getElementById("bankWizardTopicSelect");
  const outcomeSelect = document.getElementById("bankWizardOutcomeSelect");
  if (!topicSelect || !outcomeSelect) return;
  
  const course = currentCourse();
  const selectedTopic = topicSelect.value;
  const outcomes = state.curriculumItems
    .filter(item => item.courseName === course.name && item.topic === selectedTopic)
    .map(item => item.outcome)
    .filter(Boolean);
    
  outcomeSelect.innerHTML = outcomes.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("") || '<option value="">Kazanım Yok</option>';
}

function bankWizardGoToStep(step) {
  bankImportWizardState.currentStep = step;
  const labels = ["Adım 1 / 3 — Dosya Seç", "Adım 2 / 3 — Önizleme ve Düzenleme", "Adım 3 / 3 — Aktarım Seçenekleri"];
  const labelEl = document.getElementById("bankImportWizardStepLabel");
  if (labelEl) labelEl.textContent = labels[step - 1] || "";
  
  [1, 2, 3].forEach(s => {
    const dot = document.getElementById("bankWizardDot" + s);
    if (dot) {
      dot.classList.remove("active", "done");
      if (s === step) dot.classList.add("active");
      else if (s < step) dot.classList.add("done");
    }
  });

  [1, 2, 3].forEach(s => {
    const el = document.getElementById("bankWizardStep" + s);
    if (el) el.style.display = (s === step) ? "" : "none";
  });
  
  if (step === 2) bankWizardRenderPreview();
  if (step === 3) bankWizardUpdateSummary();
}

function bankWizardSetFile(file) {
  if (!file) return;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!["docx", "pdf", "txt"].includes(ext)) {
    showToast("Desteklenmeyen dosya türü. Lütfen .docx, .pdf veya .txt seçin.", "warning");
    return;
  }
  bankImportWizardState.selectedFile = file;
  const nameEl = document.getElementById("bankImportSelectedFileName");
  const sizeEl = document.getElementById("bankImportSelectedFileSize");
  const selectedBox = document.getElementById("bankImportDropZoneSelected");
  const nextBtn = document.getElementById("bankWizardStep1NextBtn");
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = (file.size / 1024).toFixed(1) + " KB";
  if (selectedBox) selectedBox.style.display = "flex";
  if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = "1"; }
}

function bankWizardClearFile() {
  bankImportWizardState.selectedFile = null;
  const selectedBox = document.getElementById("bankImportDropZoneSelected");
  const nextBtn = document.getElementById("bankWizardStep1NextBtn");
  const fi = document.getElementById("bankImportWizardFileInput");
  if (selectedBox) selectedBox.style.display = "none";
  if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = "0.5"; }
  if (fi) fi.value = "";
}

async function bankWizardParseFile() {
  const file = bankImportWizardState.selectedFile;
  if (!file) return false;
  const dialog = document.getElementById("bankImportWizardDialog");
  const overlay = document.createElement("div");
  overlay.id = "bankWizardLoadingOverlay";
  overlay.style.cssText = "position:absolute; inset:0; background:rgba(255,255,255,0.7); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; z-index:100; border-radius:12px;";
  overlay.innerHTML = '<div class="wizard-spinner" style="width:36px; height:36px; border:4px solid var(--line); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite;"></div><span style="font-weight:600; color:#153f46;">Dosya işleniyor…</span>';
  
  if (!document.getElementById("wizardSpinStyle")) {
    const style = document.createElement("style");
    style.id = "wizardSpinStyle";
    style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(style);
  }
  
  if (dialog) dialog.appendChild(overlay);
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import-main-questions", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Sunucu hatası: " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.questions || data.questions.length === 0) {
      showToast("Dosyadan soru ayrıştırılamadı.", "warning");
      return false;
    }
    bankImportWizardState.parsedQuestions = data.questions;
    if (data.meta) {
      bankImportWizardState.meta = data.meta;
    }
    return true;
  } catch (err) {
    showToast("Dosya işleme hatası: " + err.message, "error");
    return false;
  } finally {
    overlay.remove();
  }
}

function bankWizardRenderPreview() {
  const list = document.getElementById("bankWizardPreviewList");
  const countEl = document.getElementById("bankWizardPreviewCount");
  const qs = bankImportWizardState.parsedQuestions;
  if (!list) return;
  if (countEl) countEl.textContent = qs.length + " soru";
  
  const course = currentCourse();
  const curriculum = state.curriculumItems.filter(item => item.courseName === course.name);
  const topics = Array.from(new Set(curriculum.map(item => item.topic))).filter(Boolean);
  
  // Set default topic/outcome for all questions if not set
  qs.forEach(q => {
    if (!q.topic) {
      q.topic = topics[0] || "";
    }
    const outcomes = curriculum.filter(item => item.topic === q.topic).map(item => item.outcome).filter(Boolean);
    if (!q.outcome) {
      q.outcome = outcomes[0] || "";
    }
  });
  
  list.innerHTML = qs.map((q, idx) => {
    const isMultiple = q.type === "multipleChoice";
    const isTrueFalse = q.type === "trueFalse";
    const isOpen = q.type === "open";
    const outcomes = curriculum.filter(item => item.topic === q.topic).map(item => item.outcome).filter(Boolean);
    
    let choicesHtml = "";
    if (isMultiple) {
      choicesHtml = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px;">
          ${["A", "B", "C", "D", "E"].map(l => {
            const val = q["option" + l] || "";
            return `
              <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; color:var(--ink);">
                <span style="font-weight:700; width:16px; color:#153f46;">${l}:</span>
                <input type="text" class="wizard-q-choice-input" data-q-idx="${idx}" data-choice="${l}" value="${escapeHtml(val)}" style="flex:1; padding:4px 8px; border:1px solid var(--line); border-radius:4px; font-size:0.8rem; height:28px; min-height:28px;" />
              </label>
            `;
          }).join("")}
        </div>
      `;
    } else if (isTrueFalse) {
      choicesHtml = `
        <div style="margin-top:6px; display:flex; align-items:center; gap:8px; font-size:0.82rem; color:var(--ink);">
          <strong>Doğru Cevap:</strong>
          <select class="wizard-q-boolean-select" data-q-idx="${idx}" style="padding:4px 8px; border:1px solid var(--line); border-radius:4px; background:#fff; height:28px; min-height:28px; width:auto;">
            <option value="true"${q.correctBoolean !== false ? " selected" : ""}>Doğru</option>
            <option value="false"${q.correctBoolean === false ? " selected" : ""}>Yanlış</option>
          </select>
        </div>
      `;
    } else {
      choicesHtml = `
        <div style="margin-top:6px;">
          <label style="display:block; font-size:0.82rem; font-weight:600; color:#153f46; margin-bottom:4px;">Beklenen Cevap / Çözüm Anahtarı:</label>
          <textarea class="wizard-q-answer-textarea" data-q-idx="${idx}" rows="2" style="width:100%; padding:6px 10px; border:1px solid var(--line); border-radius:6px; font-size:0.82rem; font-family:inherit; resize:vertical; min-height:48px;" placeholder="Çözüm veya beklenen cevabı buraya yazın">${escapeHtml(q.answer || "")}</textarea>
        </div>
      `;
    }
    
    return `
      <div class="wizard-q-card">
        <div class="wizard-q-header">
          <span class="wizard-q-num">Soru ${idx + 1}</span>
          <div style="display:flex; align-items:center; gap:12px;">
            <label style="font-size:0.78rem; color:var(--muted); display:flex; align-items:center; gap:4px;">
              Puan:
              <input type="number" class="wizard-q-points-input" data-q-idx="${idx}" value="${q.points || 10}" min="1" max="100" style="width:50px; padding:2px 4px; border:1px solid var(--line); border-radius:4px; text-align:center; height:24px; min-height:24px;" />
            </label>
            <label style="font-size:0.78rem; color:var(--muted); display:flex; align-items:center; gap:4px;">
              Tür:
              <select class="wizard-q-type-select" data-q-idx="${idx}" style="padding:2px 4px; border:1px solid var(--line); border-radius:4px; background:#fff; height:24px; min-height:24px;">
                <option value="open"${isOpen ? " selected" : ""}>Klasik</option>
                <option value="multipleChoice"${isMultiple ? " selected" : ""}>Çoktan Seçmeli</option>
                <option value="trueFalse"${isTrueFalse ? " selected" : ""}>Doğru/Yanlış</option>
              </select>
            </label>
            ${isMultiple ? `
              <label style="font-size:0.78rem; color:var(--muted); display:flex; align-items:center; gap:4px; font-weight:600;">
                Doğru:
                <select class="wizard-q-correct-select" data-q-idx="${idx}" style="padding:2px 4px; border:1px solid var(--line); border-radius:4px; background:#fff; height:24px; min-height:24px;">
                  ${["A", "B", "C", "D", "E"].map(l => `<option value="${l}"${q.correctOption === l ? " selected" : ""}>${l}</option>`).join("")}
                </select>
              </label>
            ` : ""}
          </div>
        </div>
        <div class="wizard-q-body" style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; border-bottom:1px solid #f1f5f9; padding-bottom:8px; margin-bottom:4px;">
            <label style="font-size:0.8rem; display:flex; flex-direction:column; gap:4px; color:var(--muted);">
              <span style="font-weight:600; color:#153f46;">Öğrenme Birimi (Ünite)</span>
              <select class="wizard-q-topic-select" data-q-idx="${idx}" style="width:100%; padding:4px 8px; border:1px solid var(--line); border-radius:6px; background:#fff; height:32px; min-height:32px; font-size:0.82rem;">
                ${topics.map(t => `<option value="${escapeHtml(t)}"${q.topic === t ? " selected" : ""}>${escapeHtml(t)}</option>`).join("") || '<option value="">Birim Yok</option>'}
              </select>
            </label>
            <label style="font-size:0.8rem; display:flex; flex-direction:column; gap:4px; color:var(--muted);">
              <span style="font-weight:600; color:#153f46;">Kazanım</span>
              <select class="wizard-q-outcome-select" data-q-idx="${idx}" style="width:100%; padding:4px 8px; border:1px solid var(--line); border-radius:6px; background:#fff; height:32px; min-height:32px; font-size:0.82rem;">
                ${outcomes.map(o => `<option value="${escapeHtml(o)}"${q.outcome === o ? " selected" : ""}>${escapeHtml(o)}</option>`).join("") || '<option value="">Kazanım Yok</option>'}
              </select>
            </label>
          </div>
          <div>
            <textarea class="wizard-q-text-textarea" data-q-idx="${idx}" rows="2" style="width:100%; padding:8px 12px; border:1px solid var(--line); border-radius:6px; font-size:0.85rem; font-family:inherit; resize:vertical; min-height:50px;" placeholder="Soru metni">${escapeHtml(q.text || "")}</textarea>
          </div>
          ${choicesHtml}
        </div>
      </div>
    `;
  }).join("");
  
  list.querySelectorAll(".wizard-q-topic-select").forEach(sel => {
    sel.addEventListener("change", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) {
        qs[idx].topic = e.target.value;
        const topicOutcomes = curriculum.filter(item => item.topic === qs[idx].topic).map(item => item.outcome).filter(Boolean);
        qs[idx].outcome = topicOutcomes[0] || "";
        bankWizardRenderPreview();
      }
    });
  });
  
  list.querySelectorAll(".wizard-q-outcome-select").forEach(sel => {
    sel.addEventListener("change", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) {
        qs[idx].outcome = e.target.value;
      }
    });
  });
  
  list.querySelectorAll(".wizard-q-type-select").forEach(sel => {
    sel.addEventListener("change", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) {
        qs[idx].type = e.target.value;
        bankWizardRenderPreview();
      }
    });
  });
  
  list.querySelectorAll(".wizard-q-text-textarea").forEach(ta => {
    ta.addEventListener("input", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) qs[idx].text = e.target.value;
    });
  });
  
  list.querySelectorAll(".wizard-q-answer-textarea").forEach(ta => {
    ta.addEventListener("input", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) qs[idx].answer = e.target.value;
    });
  });
  
  list.querySelectorAll(".wizard-q-points-input").forEach(inp => {
    inp.addEventListener("input", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) qs[idx].points = parseInt(e.target.value) || 10;
    });
  });
  
  list.querySelectorAll(".wizard-q-correct-select").forEach(sel => {
    sel.addEventListener("change", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) qs[idx].correctOption = e.target.value;
    });
  });
  
  list.querySelectorAll(".wizard-q-boolean-select").forEach(sel => {
    sel.addEventListener("change", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      if (qs[idx]) qs[idx].correctBoolean = e.target.value === "true";
    });
  });
  
  list.querySelectorAll(".wizard-q-choice-input").forEach(inp => {
    inp.addEventListener("input", e => {
      const idx = parseInt(e.target.dataset.qIdx);
      const choice = e.target.dataset.choice;
      if (qs[idx]) qs[idx]["option" + choice] = e.target.value;
    });
  });
}

function bankWizardUpdateSummary() {
  const qs = bankImportWizardState.parsedQuestions;
  const countEl = document.getElementById("bankWizardSummaryCount");
  if (countEl) countEl.textContent = qs.length;
}

function bankWizardDoFinalImport() {
  const course = currentCourse();
  if (!course) return;
  
  const topic = document.getElementById("bankWizardTopicSelect")?.value || "";
  const outcome = document.getElementById("bankWizardOutcomeSelect")?.value || "";
  const grade = document.getElementById("bankWizardGradeSelect")?.value || "";
  const difficulty = document.getElementById("bankWizardDifficultySelect")?.value || "Orta";
  const mode = document.querySelector("input[name='bankWizardImportMode']:checked")?.value || "add";
  const qs = bankImportWizardState.parsedQuestions;
  
  const now = new Date().toISOString();
  const importedQuestions = qs.map(q => {
    const isMultiple = q.type === "multipleChoice";
    const isTrueFalse = q.type === "trueFalse";
    
    return {
      id: uid("q"),
      type: q.type || "open",
      courseId: course.id,
      topic: q.topic || topic,
      outcome: q.outcome || outcome,
      grade: grade,
      difficulty: difficulty,
      examTerm: bankImportWizardState.meta?.term || state.examMeta.term || "1",
      examNumber: bankImportWizardState.meta?.examNumber || state.examMeta.examNumber || "1",
      points: q.points || 10,
      tags: ["Word aktarım"],
      note: `Kaynak dosya: ${bankImportWizardState.selectedFile?.name || "Dosya"}`,
      content: q.text || "",
      answer: q.answer || "",
      choices: [
        { id: "A", label: "A", text: q.optionA || "" },
        { id: "B", label: "B", text: q.optionB || "" },
        { id: "C", label: "C", text: q.optionC || "" },
        { id: "D", label: "D", text: q.optionD || "" },
        { id: "E", label: "E", text: q.optionE || "" }
      ],
      correctChoiceId: q.correctOption || "A",
      correctBoolean: q.correctBoolean !== false,
      acceptedAnswers: [],
      createdAt: now,
      updatedAt: now
    };
  });
  
  if (mode === "replace") {
    state.questions = state.questions.filter(q => q.courseId !== course.id);
  }
  
  state.questions = [...importedQuestions, ...state.questions];
  saveState();
  
  document.getElementById("bankImportWizardDialog")?.close();
  showToast("✅ " + importedQuestions.length + " soru soru havuzuna aktarıldı!");
  render();
  setView("bank");
}

function initBankImportWizard() {
  const openBtn = document.getElementById("bankOpenImportWizardBtn");
  if (openBtn) openBtn.addEventListener("click", openBankImportWizard);
  
  const dialog = document.getElementById("bankImportWizardDialog");
  if (!dialog) return;
  
  document.getElementById("bankWizardCloseBtn")?.addEventListener("click", () => dialog.close());
  document.getElementById("bankWizardCancelBtn")?.addEventListener("click", () => dialog.close());
  
  const fileInput = document.getElementById("bankImportWizardFileInput");
  if (fileInput) fileInput.addEventListener("change", e => bankWizardSetFile(e.target.files?.[0]));
  const clearBtn = document.getElementById("bankImportClearFileBtn");
  if (clearBtn) clearBtn.addEventListener("click", bankWizardClearFile);
  const dropZone = document.getElementById("bankImportDropZone");
  if (dropZone) {
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.style.background = "#e6fffa"; });
    dropZone.addEventListener("dragleave", () => dropZone.style.background = "#f0fdf9");
    dropZone.addEventListener("drop", e => { 
      e.preventDefault(); 
      dropZone.style.background = "#f0fdf9"; 
      bankWizardSetFile(e.dataTransfer?.files?.[0]); 
    });
  }
  
  const step1Next = document.getElementById("bankWizardStep1NextBtn");
  if (step1Next) {
    step1Next.addEventListener("click", async () => {
      const orig = step1Next.textContent;
      step1Next.disabled = true;
      step1Next.textContent = "İşleniyor…";
      const ok = await bankWizardParseFile();
      step1Next.textContent = orig;
      step1Next.disabled = !bankImportWizardState.selectedFile;
      if (ok) bankWizardGoToStep(2);
    });
  }
  
  document.getElementById("bankWizardStep2BackBtn")?.addEventListener("click", () => bankWizardGoToStep(1));
  document.getElementById("bankWizardStep2NextBtn")?.addEventListener("click", () => bankWizardGoToStep(3));
  document.getElementById("bankWizardStep3BackBtn")?.addEventListener("click", () => bankWizardGoToStep(2));
  
  document.getElementById("bankWizardTopicSelect")?.addEventListener("change", updateBankWizardOutcomes);
  document.getElementById("bankWizardFinalImportBtn")?.addEventListener("click", bankWizardDoFinalImport);
  
  document.querySelectorAll("input[name='bankWizardImportMode']").forEach(radio => {
    radio.addEventListener("change", e => {
      document.getElementById("bankWizardOptAdd")?.classList.toggle("active", e.target.value === "add");
      document.getElementById("bankWizardOptReplace")?.classList.toggle("active", e.target.value === "replace");
      
      document.getElementById("bankWizardOptAdd").style.background = e.target.value === "add" ? "rgba(21,63,70,0.04)" : "none";
      document.getElementById("bankWizardOptAdd").style.borderColor = e.target.value === "add" ? "var(--accent)" : "var(--line)";
      document.getElementById("bankWizardOptReplace").style.background = e.target.value === "replace" ? "rgba(21,63,70,0.04)" : "none";
      document.getElementById("bankWizardOptReplace").style.borderColor = e.target.value === "replace" ? "var(--accent)" : "var(--line)";
    });
  });
}

function initImportWizard() {
  const openBtn = document.getElementById("courseOpenImportWizardBtn");
  if (openBtn) openBtn.addEventListener("click", openImportWizard);
  const dialog = document.getElementById("courseImportWizardDialog");
  if (!dialog) return;
  dialog.querySelectorAll(".course-dialog-close-btn, #courseImportWizardCancelBtn").forEach(btn => btn.addEventListener("click", () => dialog.close()));
  const fileInput = document.getElementById("importWizardFileInput");
  if (fileInput) fileInput.addEventListener("change", e => wizardSetFile(e.target.files?.[0]));
  const clearBtn = document.getElementById("importClearFileBtn");
  if (clearBtn) clearBtn.addEventListener("click", wizardClearFile);
  const dropZone = document.getElementById("importDropZone");
  if (dropZone) {
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", e => { e.preventDefault(); dropZone.classList.remove("drag-over"); wizardSetFile(e.dataTransfer?.files?.[0]); });
  }
  const step1Next = document.getElementById("wizardStep1NextBtn");
  if (step1Next) {
    step1Next.addEventListener("click", async () => {
      const orig = step1Next.textContent;
      step1Next.disabled = true;
      step1Next.textContent = "\u0130\u015fleniyor\u2026";
      const ok = await wizardParseFile();
      step1Next.textContent = orig;
      step1Next.disabled = !importWizardState.selectedFile;
      if (ok) wizardGoToStep(2);
    });
  }
  document.getElementById("wizardStep2BackBtn")?.addEventListener("click", () => wizardGoToStep(1));
  document.getElementById("wizardStep2NextBtn")?.addEventListener("click", () => wizardGoToStep(3));
  document.getElementById("wizardShowAnswers")?.addEventListener("change", wizardRenderPreview);
  document.getElementById("wizardStep3BackBtn")?.addEventListener("click", () => wizardGoToStep(2));
  document.getElementById("wizardFinalImportBtn")?.addEventListener("click", wizardDoFinalImport);
  document.querySelectorAll("input[name='wizardImportMode']").forEach(radio => {
    radio.addEventListener("change", e => {
      document.getElementById("wizardOptAdd")?.classList.toggle("selected", e.target.value === "add");
      document.getElementById("wizardOptReplace")?.classList.toggle("selected", e.target.value === "replace");
    });
  });
}

async function handleQuestionImport(e) {
  const modId = courseState.selectedModuleId;
  if (!modId) return;
  
  const file = e.target.files?.[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append("file", file);
  
  showToast("Sorular içe aktarılıyor...", "info");
  
  try {
    const res = await fetch("/api/import-course-questions", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Ayrıştırma hatası.");
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);
    
    if (data.questions && data.questions.length > 0) {
      if (!courseState.questions[modId]) courseState.questions[modId] = [];
      
      let nextNum = courseState.questions[modId].reduce((max, q) => Math.max(max, q.questionNumber || 0), 0) + 1;
      let importedCount = 0;
      
      data.questions.forEach(q => {
        courseState.questions[modId].push({
          id: uid("question"),
          questionNumber: nextNum++,
          questionText: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE || "",
          correctOption: q.correctOption || "A"
        });
        importedCount++;
      });
      
      saveCourseState();
      showToast(`${importedCount} yeni soru başarıyla içe aktarıldı.`);
      renderQuestionListInDialog();
      updateActiveModuleDisplay();
    } else {
      showToast("Dosyadan soru ayrıştırılamadı.", "warning");
    }
  } catch (err) {
    showToast("Soru aktarma hatası: " + err.message, "error");
  } finally {
    e.target.value = "";
  }
}

function generateWrittenExamDoc() {
  const modId = courseState.selectedModuleId;
  const currentModule = courseState.modules.find(m => String(m.id) === String(modId));
  if (!currentModule) {
    showToast("Lütfen aktif bir modül seçin.", "warning");
    return;
  }
  
  const questions = courseState.questions[modId] || [];
  if (questions.length === 0) {
    showToast("Bu modülün soru bankasında kayıtlı soru bulunmuyor.", "warning");
    return;
  }
  
  const studentCbs = courseEls.courseExamPrepStudentsBody.querySelectorAll(".course-examprep-student-checkbox:checked");
  if (studentCbs.length === 0) {
    showToast("Lütfen sınav evrakı oluşturmak için en az bir öğrenci seçin.", "warning");
    return;
  }
  
  const targetCount = parseInt(courseEls.coursePrepQuestionCount.value) || 10;
  if (targetCount <= 0) {
    showToast("Lütfen geçerli bir soru sayısı girin.", "warning");
    return;
  }
  
  const optionCount = parseInt(courseEls.coursePrepOptionCount.value) || 4;
  const scoringType = courseEls.coursePrepScoringType.value;
  const examDateStr = courseEls.coursePrepExamDate.value;
  
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, Math.min(targetCount, questions.length));
  
  selectedQuestions.forEach((q, idx) => {
    q.tempIndex = idx + 1;
  });
  
  const pointsPerQuestion = (100 / selectedQuestions.length).toFixed(1).replace(".0", "");
  
  const school = courseState.schoolInfos[0] || {
    institutionName: "KURUM ADI GİRİLMEDİ",
    courseName: "KURS ADI GİRİLMEDİ",
    courseStartDate: "",
    courseEndDate: "",
    teachers: []
  };
  
  let html = "";
  
  studentCbs.forEach(cb => {
    const studentName = cb.dataset.studentName;
    
    html += `
      <div class="print-document" style="page-break-after:always;padding:20px;background:#fff;color:#000;font-family:'Times New Roman', Times, serif;font-size:12pt;line-height:1.4;">
        <div style="text-align:center;font-weight:bold;font-size:12pt;margin-bottom:2px;text-transform:uppercase;">
          ${escapeHtml(school.institutionName)}
        </div>
        <div style="text-align:center;font-weight:bold;font-size:12pt;margin-bottom:2px;text-transform:uppercase;">
          ${escapeHtml(school.courseName)} KURSU
        </div>
        <div style="text-align:center;font-weight:bold;font-size:12pt;margin-bottom:15px;text-transform:uppercase;">
          ${escapeHtml(currentModule.name)} MODÜLÜ YAZILI SINAVI
        </div>
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="border:1px solid #000;padding:6px;width:50%;font-weight:bold;">Öğrenci Adı Soyadı: ${escapeHtml(studentName)}</td>
            <td style="border:1px solid #000;padding:6px;width:50%;font-weight:bold;">Sınav Tarihi: ${formatTurkishDate(examDateStr)}</td>
          </tr>
          <tr>
            <td style="border:1px solid #000;padding:6px;font-weight:bold;">Kurs Tarihi: ${formatTurkishDate(school.courseStartDate)} - ${formatTurkishDate(school.courseEndDate)}</td>
            <td style="border:1px solid #000;padding:6px;font-weight:bold;">İmza:</td>
          </tr>
        </table>
        
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:30px;">
          ${selectedQuestions.map(q => {
            const scoreText = scoringType === "equal" ? ` (${pointsPerQuestion} P)` : "";
            
            return `
              <div style="page-break-inside:avoid;">
                <div style="font-weight:bold;margin-bottom:4px;">${q.tempIndex}. ${escapeHtml(q.questionText)}${scoreText}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;column-gap:20px;row-gap:4px;padding-left:15px;">
                  <div>A) ${escapeHtml(q.optionA)}</div>
                  <div>B) ${escapeHtml(q.optionB)}</div>
                  <div>C) ${escapeHtml(q.optionC)}</div>
                  <div>D) ${escapeHtml(q.optionD)}</div>
                  ${optionCount >= 5 ? `<div style="grid-column:span 2;">E) ${escapeHtml(q.optionE || '-')}</div>` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
        
        <table style="width:100%;border-collapse:collapse;margin-top:30px;page-break-inside:avoid;">
          <tr>
            ${(school.teachers.length > 0 ? school.teachers : ["Kurs Öğretmeni"]).map(teacher => `
              <td style="border:1px solid #000;padding:10px;text-align:center;width:${100 / Math.max(1, school.teachers.length)}%;">
                <div style="font-size:10pt;">Kurs Öğretmeni</div>
                <div style="font-weight:bold;margin-top:5px;">${escapeHtml(teacher)}</div>
                <div style="margin-top:40px;font-weight:bold;">İmza</div>
              </td>
            `).join("")}
          </tr>
        </table>
      </div>
    `;
  });
  
  html += `
    <div class="print-document" style="page-break-before:always;padding:20px;background:#fff;color:#000;font-family:'Times New Roman', Times, serif;font-size:12pt;line-height:1.4;">
      <div style="text-align:center;font-weight:bold;font-size:14pt;margin-bottom:20px;text-transform:uppercase;">
        ${escapeHtml(currentModule.name)} CEVAP ANAHTARI
      </div>
      <div style="display:flex;justify-content:center;">
        <table style="width:240px;border-collapse:collapse;text-align:center;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th style="border:1px solid #000;padding:6px;font-weight:bold;">Soru No</th>
              <th style="border:1px solid #000;padding:6px;font-weight:bold;">Doğru Cevap</th>
            </tr>
          </thead>
          <tbody>
            ${selectedQuestions.map(q => `
              <tr>
                <td style="border:1px solid #000;padding:6px;font-weight:bold;">${q.tempIndex}</td>
                <td style="border:1px solid #000;padding:6px;">${escapeHtml(q.correctOption)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  const previousTitle = document.title;
  const courseReportDate = (function() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}_${String(d.getMonth() + 1).padStart(2, "0")}_${d.getFullYear()}`;
  })();
  document.title = `${currentModule.name.replace(/\s+/g, '_')}_Sinav_${courseReportDate}`;
  window.addEventListener("afterprint", () => {
    document.title = previousTitle;
    courseEls.printExamArea.innerHTML = "";
  }, { once: true });
  
  courseEls.printExamArea.innerHTML = html;
  window.print();
}

// === RAPORLAR (REPORTS) ===
function renderReportsTab() {
  if (!courseEls.courseReportStudentsBody) return;
  
  const sorted = [...courseState.students].sort((a, b) => a.firstName.localeCompare(b.firstName, "tr") || a.lastName.localeCompare(b.lastName, "tr"));
  if (sorted.length === 0) {
    courseEls.courseReportStudentsBody.innerHTML = `<tr><td colspan="2" style="text-align:center;padding:15px;color:var(--muted)">Kayıtlı öğrenci bulunamadı.</td></tr>`;
    return;
  }
  
  courseEls.courseReportStudentsBody.innerHTML = sorted.map(s => `
    <tr>
      <td>
        <label class="compact-checkbox-container" style="justify-content:center;margin:0;">
          <input type="checkbox" class="course-report-student-checkbox" data-student-id="${s.id}" data-student-name="${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}" checked />
          <span class="checkmark"></span>
        </label>
      </td>
      <td><strong>${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</strong></td>
    </tr>
  `).join("");
}

function selectAllReportStudents() {
  const checkboxes = courseEls.courseReportStudentsBody.querySelectorAll(".course-report-student-checkbox");
  checkboxes.forEach(cb => cb.checked = true);
}

function clearAllReportStudents() {
  const checkboxes = courseEls.courseReportStudentsBody.querySelectorAll(".course-report-student-checkbox");
  checkboxes.forEach(cb => cb.checked = false);
}

function generateGradeReport() {
  const studentCbs = courseEls.courseReportStudentsBody.querySelectorAll(".course-report-student-checkbox:checked");
  if (studentCbs.length === 0) {
    showToast("Lütfen rapor oluşturmak için en az bir öğrenci seçin.", "warning");
    return;
  }
  
  if (courseState.modules.length === 0) {
    showToast("Kayıtlı modül bulunmuyor.", "warning");
    return;
  }
  
  const selectedStudentIds = Array.from(studentCbs).map(cb => cb.dataset.studentId);
  const school = courseState.schoolInfos[0] || {
    institutionName: "KURUM ADI GİRİLMEDİ",
    courseName: "KURS ADI GİRİLMEDİ",
    teachers: []
  };
  
  const reportStudents = courseState.students
    .filter(s => selectedStudentIds.includes(String(s.id)))
    .sort((a, b) => a.firstName.localeCompare(b.firstName, "tr") || a.lastName.localeCompare(b.lastName, "tr"));
    
  const sortedModules = [...courseState.modules].sort((a, b) => {
    const sa = parseInt(a.sortOrder) || 0;
    const sb = parseInt(b.sortOrder) || 0;
    return sa - sb || a.name.localeCompare(b.name);
  });
  
  let rowsHtml = "";
  reportStudents.forEach((student, idx) => {
    let scoresSum = 0;
    let scoresCount = 0;
    
    const modulesCells = sortedModules.map(m => {
      let y1Val = "-";
      const keys = Object.keys(courseState.examSummaries).filter(k => k.startsWith(`${student.id}_${m.id}_`));
      
      if (keys.length > 0) {
        keys.sort((a, b) => {
          const da = a.split("_")[2];
          const db = b.split("_")[2];
          return db.localeCompare(da);
        });
        
        const summary = courseState.examSummaries[keys[0]];
        if (summary && summary.Y1 && !summary.didNotAttend) {
          const parsed = parseFloat(summary.Y1.replace(",", "."));
          if (!isNaN(parsed)) {
            y1Val = parsed.toString();
            scoresSum += parsed;
            scoresCount++;
          }
        }
      }
      return `<td class="module-score-cell">${y1Val}</td>`;
    }).join("");
    
    const avgVal = scoresCount > 0 ? (scoresSum / scoresCount).toFixed(1) : "-";
    let statusText = "-";
    let statusColor = "#000";
    if (avgVal !== "-") {
      const isPass = parseFloat(avgVal) >= 50;
      statusText = isPass ? "Başarılı" : "Başarısız";
      statusColor = isPass ? "#156634" : "#cc2222";
    }
    
    rowsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td class="student-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</td>
        ${modulesCells}
        <td><strong>${avgVal}</strong></td>
        <td style="color:${statusColor};font-weight:bold;">${statusText}</td>
      </tr>
    `;
  });
  
  const today = new Date();
  const createdDateStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()} ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
  
  const html = `
    <style>
      @page {
        size: A4 landscape;
        margin: 8mm 10mm;
      }
    </style>
    <div class="print-report-sheet" style="padding:20px;background:#fff;color:#000;">
      <div class="print-report-header">
        <h2>${escapeHtml(school.institutionName.toUpperCase())}</h2>
        <p>${escapeHtml(school.courseName)}</p>
        <h3 style="margin-top:10px;font-size:11pt;font-weight:bold;text-align:center;">GENEL NOT ÇİZELGESİ</h3>
      </div>
      
      <table class="print-report-table grade-report-table">
        <thead>
          <tr>
            <th style="width:30px;">No</th>
            <th>Öğrenci Adı Soyadı</th>
            ${sortedModules.map(m => `<th class="module-header-cell"><div class="vertical-text-cell">${escapeHtml(m.name)}</div></th>`).join("")}
            <th style="width:60px;">Sınav Ort.</th>
            <th style="width:70px;">Başarı Durumu</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      
      <div style="display:flex;justify-content:space-between;font-size:7.5pt;color:#555;margin-top:15px;border-top:1px solid #eee;padding-top:5px;">
        <span>Oluşturulma: ${createdDateStr}</span>
        <span>Toplam ${reportStudents.length} öğrenci</span>
      </div>
      
      <div class="print-report-signatures" style="margin-top:40px;display:flex;justify-content:space-between;page-break-inside:avoid;">
        ${(school.teachers.length > 0 ? school.teachers : ["Kurs Öğretmeni"]).map(teacher => `
          <div class="signature-block" style="text-align:center;width:200px;">
            <div>Kurs Öğretmeni</div>
            <div style="font-weight:bold;margin-top:5px;">${escapeHtml(teacher)}</div>
            <div class="signature-space" style="margin-top:50px;font-weight:bold;">İmza</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  
  const previousTitle = document.title;
  const gradeReportDate = (function() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}_${String(d.getMonth() + 1).padStart(2, "0")}_${d.getFullYear()}`;
  })();
  document.title = `Genel_Not_Cizelgesi_${gradeReportDate}`;
  window.addEventListener("afterprint", () => {
    document.title = previousTitle;
    courseEls.printExamArea.innerHTML = "";
  }, { once: true });
  
  courseEls.printExamArea.innerHTML = html;
  window.print();
}

function generateAttendanceReport() {
  const studentCbs = courseEls.courseReportStudentsBody.querySelectorAll(".course-report-student-checkbox:checked");
  if (studentCbs.length === 0) {
    showToast("Lütfen rapor oluşturmak için en az bir öğrenci seçin.", "warning");
    return;
  }
  
  const selectedStudentIds = Array.from(studentCbs).map(cb => cb.dataset.studentId);
  const school = courseState.schoolInfos[0] || {
    institutionName: "KURUM ADI GİRİLMEDİ",
    courseName: "KURS ADI GİRİLMEDİ",
    teachers: []
  };
  
  const reportStudents = courseState.students
    .filter(s => selectedStudentIds.includes(String(s.id)))
    .sort((a, b) => a.firstName.localeCompare(b.firstName, "tr") || a.lastName.localeCompare(b.lastName, "tr"));
    
  let rowsHtml = "";
  reportStudents.forEach((student, idx) => {
    let presentCount = 0;
    let absentCount = 0;
    const absentDates = [];
    
    Object.entries(courseState.attendance).forEach(([key, val]) => {
      const parts = key.split("_");
      if (parts[0] === String(student.id)) {
        if (val === 1) {
          presentCount++;
        } else {
          absentCount++;
          absentDates.push(parts[2]);
        }
      }
    });
    
    absentDates.sort();
    const formattedAbsentDates = absentDates.map(d => formatTurkishDate(d)).join(", ") || "-";
    const totalDays = presentCount + absentCount;
    
    rowsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td class="student-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</td>
        <td>${totalDays}</td>
        <td style="color:#156634;font-weight:bold;">${presentCount}</td>
        <td style="color:${absentCount > 0 ? '#cc2222' : '#156634'};font-weight:bold;">${absentCount}</td>
        <td style="text-align:left;font-size:8pt;">${formattedAbsentDates}</td>
      </tr>
    `;
  });
  
  const today = new Date();
  const createdDateStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()} ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
  
  const html = `
    <div class="print-report-sheet" style="padding:20px;background:#fff;color:#000;">
      <div class="print-report-header">
        <h2>${escapeHtml(school.institutionName.toUpperCase())}</h2>
        <p>${escapeHtml(school.courseName)}</p>
        <h3 style="margin-top:10px;font-size:11pt;font-weight:bold;text-align:center;">DEVAMSIZLIK ÇİZELGESİ</h3>
      </div>
      
      <table class="print-report-table">
        <thead>
          <tr>
            <th style="width:30px;">No</th>
            <th>Öğrenci Adı Soyadı</th>
            <th style="width:50px;">Toplam Gün</th>
            <th style="width:50px;">Geldiği Gün</th>
            <th style="width:50px;">Gelmediği Gün</th>
            <th>Devamsızlık Tarihleri</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      
      <div style="display:flex;justify-content:space-between;font-size:7.5pt;color:#555;margin-top:15px;border-top:1px solid #eee;padding-top:5px;">
        <span>Oluşturulma: ${createdDateStr}</span>
        <span>Toplam ${reportStudents.length} öğrenci</span>
      </div>
      
      <div class="print-report-signatures" style="margin-top:40px;display:flex;justify-content:space-between;page-break-inside:avoid;">
        ${(school.teachers.length > 0 ? school.teachers : ["Kurs Öğretmeni"]).map(teacher => `
          <div class="signature-block" style="text-align:center;width:200px;">
            <div>Kurs Öğretmeni</div>
            <div style="font-weight:bold;margin-top:5px;">${escapeHtml(teacher)}</div>
            <div class="signature-space" style="margin-top:50px;font-weight:bold;">İmza</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  
  const previousTitle = document.title;
  const attendanceReportDate = (function() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}_${String(d.getMonth() + 1).padStart(2, "0")}_${d.getFullYear()}`;
  })();
  document.title = `Devamsizlik_Cizelgesi_${attendanceReportDate}`;
  window.addEventListener("afterprint", () => {
    document.title = previousTitle;
    courseEls.printExamArea.innerHTML = "";
  }, { once: true });
  
  courseEls.printExamArea.innerHTML = html;
  window.print();
}

// === ÖĞRENCİ KARTI MODALI ===
function renderStudentCard(studentId) {
  const student = courseState.students.find(s => String(s.id) === String(studentId));
  if (!student) return;
  
  if (courseEls.courseCardName) courseEls.courseCardName.textContent = `${student.firstName} ${student.lastName}`;
  if (courseEls.courseCardPhone) courseEls.courseCardPhone.textContent = `Telefon: ${student.phoneNumber || '-'}`;
  
  const initials = userInitials(`${student.firstName} ${student.lastName}`);
  if (courseEls.courseCardAvatar) courseEls.courseCardAvatar.textContent = initials;
  
  let presentCount = 0;
  let absentCount = 0;
  const absences = [];
  
  Object.entries(courseState.attendance).forEach(([key, val]) => {
    const parts = key.split("_");
    if (parts[0] === String(studentId)) {
      const modId = parts[1];
      const dateStr = parts[2];
      const m = courseState.modules.find(item => String(item.id) === String(modId));
      const modName = m ? m.name : "Bilinmeyen Modül";
      
      if (val === 1) {
        presentCount++;
      } else {
        absentCount++;
        absences.push({ date: dateStr, module: modName });
      }
    }
  });
  
  if (courseEls.courseCardPresentCount) courseEls.courseCardPresentCount.textContent = presentCount;
  if (courseEls.courseCardAbsentCount) courseEls.courseCardAbsentCount.textContent = absentCount;
  
  absences.sort((a, b) => b.date.localeCompare(a.date));
  
  const moduleExamScores = {};
  Object.entries(courseState.examSummaries).forEach(([key, val]) => {
    const parts = key.split("_");
    if (parts[0] === String(studentId)) {
      const modId = parts[1];
      const m = courseState.modules.find(item => String(item.id) === String(modId));
      const modName = m ? m.name : "Bilinmeyen Modül";
      
      if (!moduleExamScores[modId]) {
        moduleExamScores[modId] = { name: modName, scores: [], didNotAttend: false };
      }

      if (val.didNotAttend) {
        moduleExamScores[modId].didNotAttend = true;
      } else {
        ["Y1", "Y2", "Y3", "P1", "P2"].forEach(field => {
          const scoreStr = val[field];
          if (scoreStr) {
            const parsed = parseFloat(scoreStr.replace(",", "."));
            if (!isNaN(parsed)) {
              moduleExamScores[modId].scores.push(parsed);
            }
          }
        });
      }
    }
  });
  
  let examsHtml = "";
  const averagesList = Object.values(moduleExamScores);
  if (averagesList.length === 0) {
    examsHtml += `<div style="color:var(--muted);padding:8px 0;">Sınav notu bulunmuyor.</div>`;
  } else {
    averagesList.forEach(item => {
      if (item.didNotAttend) {
        examsHtml += `
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#fef2f2;border-radius:4px;margin-bottom:4px;border:1px solid #fecaca;">
            <span>${escapeHtml(item.name)}</span>
            <span class="badge badge-light-red">Sınava Girmedi</span>
          </div>
        `;
      } else if (item.scores.length === 0) {
        examsHtml += `
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f8fafc;border-radius:4px;margin-bottom:4px;border:1px solid var(--line);">
            <span>${escapeHtml(item.name)}</span>
            <span style="color:var(--muted);">-</span>
          </div>
        `;
      } else {
        const avg = item.scores.reduce((sum, v) => sum + v, 0) / item.scores.length;
        examsHtml += `
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f8fafc;border-radius:4px;margin-bottom:4px;border:1px solid var(--line);">
            <span>${escapeHtml(item.name)}</span>
            <strong>${avg.toFixed(2)} (${item.scores.length} Not)</strong>
          </div>
        `;
      }
    });
  }
  
  let absencesHtml = "";
  if (absences.length === 0) {
    absencesHtml += `<div style="color:var(--muted);padding:8px 0;">Devamsızlık kaydı bulunmuyor.</div>`;
  } else {
    absences.forEach(item => {
      absencesHtml += `
        <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#fef2f2;border-radius:4px;margin-bottom:4px;color:#991b1b;border:1px solid #fecaca;">
          <span>${formatTurkishDate(item.date)}</span>
          <span style="font-size:0.8rem;opacity:0.8;">${escapeHtml(item.module)}</span>
        </div>
      `;
    });
  }
  
  if (courseEls.courseCardExamsList) courseEls.courseCardExamsList.innerHTML = examsHtml;
  if (courseEls.courseCardAbsencesList) courseEls.courseCardAbsencesList.innerHTML = absencesHtml;
  courseEls.courseStudentCardDialog.showModal();
}

// === EVENT BINDINGS FOR KURS TAKİP ===
function initCourseEventBindings() {
  // Navigation switchers
  courseEls.courseNavButtons.forEach(btn => {
    btn.addEventListener("click", () => setCourseView(btn.dataset.courseNavView));
  });
  
  if (courseEls.courseNavMobileSelect) {
    courseEls.courseNavMobileSelect.addEventListener("change", (e) => {
      const parts = e.target.value.split(":");
      const view = parts[0];
      const tab = parts[1];
      if (courseState.activeView !== view) {
        setCourseView(view);
      }
      setCourseTab(tab);
    });
  }
  
  courseEls.courseTabButtons.forEach(btn => {
    btn.addEventListener("click", () => setCourseTab(btn.dataset.courseTab));
  });
  
  // Active module card selection
  if (courseEls.courseActiveModuleCard) {
    courseEls.courseActiveModuleCard.addEventListener("click", openModuleSelectDialog);
  }
  if (courseEls.courseDialogModuleList) {
    courseEls.courseDialogModuleList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-select-module-id]");
      if (btn) {
        courseState.selectedModuleId = btn.dataset.selectModuleId;
        saveCourseState();
        updateActiveModuleDisplay();
        renderCourseTab(courseState.activeTab);
        courseEls.courseModuleSelectDialog.close();
      }
    });
  }
  
  // Close dialog buttons
  document.querySelectorAll(".course-dialog").forEach(dialog => {
    const closeBtn = dialog.querySelector(".course-dialog-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => dialog.close());
    }
  });
  
  // Table row edit clicks
  if (courseEls.courseSchoolTable) {
    courseEls.courseSchoolTable.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-school-id]");
      if (row) editSchoolInfo(row.dataset.schoolId);
    });
  }
  if (courseEls.courseModulesTable) {
    courseEls.courseModulesTable.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-module-id]");
      if (row) editModule(row.dataset.moduleId);
    });
  }
  if (courseEls.courseStudentsTable) {
    courseEls.courseStudentsTable.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-student-id]");
      if (row) editStudent(row.dataset.studentId);
    });
  }
  
  // Student Card popups from lists
  if (courseEls.courseAttendanceTable) {
    courseEls.courseAttendanceTable.addEventListener("click", (e) => {
      const btn = e.target.closest(".student-card-btn");
      if (btn) {
        e.stopPropagation();
        renderStudentCard(btn.dataset.studentId);
      }
    });
  }
  if (courseEls.courseGradesTable) {
    courseEls.courseGradesTable.addEventListener("click", (e) => {
      const btn = e.target.closest(".student-card-btn");
      if (btn) {
        e.stopPropagation();
        renderStudentCard(btn.dataset.studentId);
      }
    });
  }
  
  // Attendance page handlers
  if (courseEls.courseAttendanceDate) {
    courseEls.courseAttendanceDate.addEventListener("change", renderAttendanceTab);
  }
  if (courseEls.courseSaveAttendanceBtn) {
    courseEls.courseSaveAttendanceBtn.addEventListener("click", saveAttendance);
  }
  if (courseEls.courseClearAttendanceBtn) {
    courseEls.courseClearAttendanceBtn.addEventListener("click", clearAttendanceMarks);
  }
  if (courseEls.courseRefreshAttendanceBtn) {
    courseEls.courseRefreshAttendanceBtn.addEventListener("click", renderAttendanceTab);
  }
  
  // Grades page handlers
  if (courseEls.courseExamDate) {
    courseEls.courseExamDate.addEventListener("change", renderGradesTab);
  }
  if (courseEls.courseSaveGradesBtn) {
    courseEls.courseSaveGradesBtn.addEventListener("click", saveGrades);
  }
  if (courseEls.courseClearGradesBtn) {
    courseEls.courseClearGradesBtn.addEventListener("click", clearGradesFields);
  }
  if (courseEls.courseRefreshGradesBtn) {
    courseEls.courseRefreshGradesBtn.addEventListener("click", renderGradesTab);
  }
  
  if (courseEls.courseAttendanceSearch) {
    courseEls.courseAttendanceSearch.addEventListener("input", filterAttendanceRows);
  }
  if (courseEls.courseGradesSearch) {
    courseEls.courseGradesSearch.addEventListener("input", filterGradesRows);
  }
  
  if (courseEls.courseGradesBody) {
    courseEls.courseGradesBody.addEventListener("input", (e) => {
      if (e.target.classList.contains("course-grade-input")) {
        // Clamp to max 100
        const rawVal = e.target.value.replace(",", ".");
        const numVal = parseFloat(rawVal);
        if (!isNaN(numVal) && numVal > 100) {
          e.target.value = "100";
        } else if (!isNaN(numVal) && numVal < 0) {
          e.target.value = "0";
        }
        const sid = e.target.dataset.studentId;
        updateStudentGradeRowResult(sid);
      }
    });
    courseEls.courseGradesBody.addEventListener("change", (e) => {
      if (e.target.classList.contains("course-grade-dna-checkbox")) {
        const sid = e.target.dataset.studentId;
        const checked = e.target.checked;
        const row = e.target.closest("tr");
        row.querySelectorAll(".course-grade-input").forEach(input => {
          input.disabled = checked;
          if (checked) input.value = "";
        });
        updateStudentGradeRowResult(sid);
      }
    });
  }
  
  // School form handlers
  if (courseEls.courseSchoolForm) {
    courseEls.courseSchoolForm.addEventListener("submit", saveSchoolInfo);
  }
  if (courseEls.courseAddTeacherBtn) {
    courseEls.courseAddTeacherBtn.addEventListener("click", addTeacher);
  }
  if (courseEls.courseTeacherList) {
    courseEls.courseTeacherList.addEventListener("click", (e) => {
      const btn = e.target.closest(".remove-teacher");
      if (btn) {
        const idx = parseInt(btn.dataset.index);
        removeTeacher(idx);
      }
    });
  }
  if (courseEls.courseClearSchoolBtn) {
    courseEls.courseClearSchoolBtn.addEventListener("click", clearSchoolForm);
  }
  if (courseEls.courseDeleteSchoolBtn) {
    courseEls.courseDeleteSchoolBtn.addEventListener("click", deleteSchoolInfo);
  }
  
  // Module form handlers
  if (courseEls.courseModuleForm) {
    courseEls.courseModuleForm.addEventListener("submit", saveModule);
  }
  if (courseEls.courseClearModuleBtn) {
    courseEls.courseClearModuleBtn.addEventListener("click", clearModuleForm);
  }
  if (courseEls.courseDeleteModuleBtn) {
    courseEls.courseDeleteModuleBtn.addEventListener("click", deleteModule);
  }
  if (courseEls.courseDeleteAllModulesBtn) {
    courseEls.courseDeleteAllModulesBtn.addEventListener("click", deleteAllModules);
  }
  if (courseEls.courseWebSearchBtn) {
    courseEls.courseWebSearchBtn.addEventListener("click", searchWebCourses);
  }
  if (courseEls.courseImportWebModulesBtn) {
    courseEls.courseImportWebModulesBtn.addEventListener("click", importWebModules);
  }
  
  // Student form handlers
  if (courseEls.courseStudentForm) {
    courseEls.courseStudentForm.addEventListener("submit", saveStudent);
  }
  if (courseEls.courseClearStudentBtn) {
    courseEls.courseClearStudentBtn.addEventListener("click", clearStudentForm);
  }
  if (courseEls.courseDeleteStudentBtn) {
    courseEls.courseDeleteStudentBtn.addEventListener("click", deleteStudent);
  }
  if (courseEls.courseDeleteAllStudentsBtn) {
    courseEls.courseDeleteAllStudentsBtn.addEventListener("click", deleteAllStudents);
  }
  if (courseEls.courseStudentExcelInput) {
    courseEls.courseStudentExcelInput.addEventListener("change", handleExcelImport);
  }
  
  // Exam prep handlers
  if (courseEls.courseSelectAllExamPrepBtn) {
    courseEls.courseSelectAllExamPrepBtn.addEventListener("click", selectAllExamPrepStudents);
  }
  if (courseEls.courseClearAllExamPrepBtn) {
    courseEls.courseClearAllExamPrepBtn.addEventListener("click", clearAllExamPrepStudents);
  }
  if (courseEls.courseOpenQuestionBankBtn) {
    courseEls.courseOpenQuestionBankBtn.addEventListener("click", () => {
      clearQuestionForm();
      renderQuestionListInDialog();
      courseEls.courseQuestionBankDialog.showModal();
    });
  }
  if (courseEls.courseGenerateExamDocBtn) {
    courseEls.courseGenerateExamDocBtn.addEventListener("click", generateWrittenExamDoc);
  }
  
  // Question Bank Dialog - Import Wizard
  initImportWizard();
  if (courseEls.courseDialogQuestionsList) {
    courseEls.courseDialogQuestionsList.addEventListener("click", (e) => {
      const item = e.target.closest("[data-question-id]");
      if (item) editCourseQuestion(item.dataset.questionId);
    });
  }
  const answersToggle = document.querySelector("#courseShowAnswersToggle");
  const answersLabel = document.querySelector("#courseShowAnswersLabel");
  if (answersToggle) {
    answersToggle.addEventListener("change", () => {
      if (answersLabel) {
        answersLabel.classList.toggle("is-active", answersToggle.checked);
      }
      renderQuestionListInDialog();
    });
  }
  if (courseEls.courseQuestionNewBtn) {
    courseEls.courseQuestionNewBtn.addEventListener("click", clearQuestionForm);
  }
  if (courseEls.courseQuestionDeleteBtn) {
    courseEls.courseQuestionDeleteBtn.addEventListener("click", deleteQuestion);
  }
  if (courseEls.courseQuestionEditorForm) {
    courseEls.courseQuestionEditorForm.addEventListener("submit", saveCourseQuestion);
  }
  
  // Reports page handlers
  if (courseEls.courseSelectAllReportStudentsBtn) {
    courseEls.courseSelectAllReportStudentsBtn.addEventListener("click", selectAllReportStudents);
  }
  if (courseEls.courseClearAllReportStudentsBtn) {
    courseEls.courseClearAllReportStudentsBtn.addEventListener("click", clearAllReportStudents);
  }
  if (courseEls.courseGenerateGradeReportBtn) {
    courseEls.courseGenerateGradeReportBtn.addEventListener("click", generateGradeReport);
  }
  if (courseEls.courseGenerateAttendanceReportBtn) {
    courseEls.courseGenerateAttendanceReportBtn.addEventListener("click", generateAttendanceReport);
  }
  
  // Soru Bankası Import Wizard
  initBankImportWizard();
}

initCourseEventBindings();


const courseTrackingModule = {
  init(callbacks = {}) {
    courseCallbacks = { ...courseCallbacks, ...callbacks };
  },
  loadState() {
    loadCourseState();
  },
  get shell() {
    return courseEls.courseShell;
  },
  get state() {
    return courseState;
  },
  render() {
    return renderCourseModule();
  },
  setView(view) {
    return setCourseView(view);
  }
};
window.AppModules.register("course-tracking", courseTrackingModule);
