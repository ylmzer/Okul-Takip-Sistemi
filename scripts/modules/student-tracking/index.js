/* Ders ve Öğrenci Takibi Modülü — Yenilenmiş Sade, Hızlı ve Kapsamlı Sürüm */

const STUDENT_TRACKING_KEY = "student-tracking:state:v1";

const studentDefaults = {
  activeView: "dashboard",
  classes: [],
  lessons: [],
  students: [],
  routine: [],
  homework: [],
  projects: []
};

const VIEW_META = {
  dashboard: { title: "Genel Bakış", subtitle: "Sınıflar, günlük değerlendirme, ödev ve proje takibi" },
  routine: { title: "Günlük Değerlendirme", subtitle: "Sınıf içi hızlı katılım, davranış ve hazırlık puanlaması" },
  homework: { title: "Ödevler", subtitle: "Öğrenciye veya tüm sınıfa ödev atama ve değerlendirme" },
  projects: { title: "Projeler", subtitle: "Öğrenciye veya tüm sınıfa proje atama ve değerlendirme" },
  classes: { title: "Sınıflar", subtitle: "Sınıf tanımlama ve hızlı yönetim" },
  students: { title: "Öğrenciler", subtitle: "Sınıfa öğrenci ekleme ve E-Okul toplu liste aktarımı" },
  lessons: { title: "Dersler", subtitle: "Sınıflara ders ve haftalık saat atama" },
  reports: { title: "Raporlar", subtitle: "Sınıf, ders ve öğrenci bazlı performans raporlaması" }
};

const studentEls = {
  shell: document.querySelector("#studentShell"),
  title: document.querySelector("#studentPageTitle"),
  subtitle: document.querySelector("#studentPageSubtitle"),
  navButtons: document.querySelectorAll("[data-student-view]"),
  mobileNav: document.querySelector("#studentNavMobileSelect"),
  panels: document.querySelectorAll("[data-student-panel]"),
  flowCard: document.querySelector("#studentFlowCard"),
  statGrid: document.querySelector("#studentStatGrid"),
  dashboardExtras: document.querySelector("#studentDashboardExtras"),
  classForm: document.querySelector("#studentClassForm"),
  classId: document.querySelector("#studentClassId"),
  className: document.querySelector("#studentClassName"),
  classNote: document.querySelector("#studentClassNote"),
  classList: document.querySelector("#studentClassList"),
  clearClass: document.querySelector("#studentClearClassBtn"),
  lessonForm: document.querySelector("#studentLessonForm"),
  lessonId: document.querySelector("#studentLessonId"),
  lessonClass: document.querySelector("#studentLessonClass"),
  lessonName: document.querySelector("#studentLessonName"),
  lessonHours: document.querySelector("#studentLessonHours"),
  lessonList: document.querySelector("#studentLessonList"),
  clearLesson: document.querySelector("#studentClearLessonBtn"),
  studentForm: document.querySelector("#studentStudentForm"),
  studentId: document.querySelector("#studentStudentId"),
  studentClass: document.querySelector("#studentStudentClass"),
  studentNo: document.querySelector("#studentNo"),
  studentName: document.querySelector("#studentName"),
  studentSearch: document.querySelector("#studentSearchInput"),
  studentList: document.querySelector("#studentStudentList"),
  clearStudent: document.querySelector("#studentClearStudentBtn"),
  importText: document.querySelector("#studentImportText"),
  importBtn: document.querySelector("#studentImportBtn"),
  routineDate: document.querySelector("#studentRoutineDate"),
  routinePrevDay: document.querySelector("#studentRoutinePrevDayBtn"),
  routineNextDay: document.querySelector("#studentRoutineNextDayBtn"),
  routineToday: document.querySelector("#studentRoutineTodayBtn"),
  routineClass: document.querySelector("#studentRoutineClass"),
  routineLesson: document.querySelector("#studentRoutineLesson"),
  routineSummary: document.querySelector("#studentRoutineSummary"),
  routineList: document.querySelector("#studentRoutineList"),
  routineAllFull: document.querySelector("#studentRoutineAllFullBtn"),
  routineClear: document.querySelector("#studentRoutineClearBtn"),
  saveRoutine: document.querySelector("#studentSaveRoutineBtn"),
  homeworkForm: document.querySelector("#studentHomeworkForm"),
  homeworkId: document.querySelector("#studentHomeworkId"),
  homeworkClass: document.querySelector("#studentHomeworkClass"),
  homeworkLesson: document.querySelector("#studentHomeworkLesson"),
  homeworkTitle: document.querySelector("#studentHomeworkTitle"),
  homeworkDue: document.querySelector("#studentHomeworkDue"),
  homeworkDesc: document.querySelector("#studentHomeworkDesc"),
  homeworkPicker: document.querySelector("#studentHomeworkPicker"),
  homeworkPickerCount: document.querySelector("#studentHomeworkPickerCount"),
  homeworkPickerList: document.querySelector("#studentHomeworkPickerList"),
  homeworkList: document.querySelector("#studentHomeworkList"),
  clearHomework: document.querySelector("#studentClearHomeworkBtn"),
  projectForm: document.querySelector("#studentProjectForm"),
  projectId: document.querySelector("#studentProjectId"),
  projectClass: document.querySelector("#studentProjectClass"),
  projectLesson: document.querySelector("#studentProjectLesson"),
  projectTitle: document.querySelector("#studentProjectTitle"),
  projectDue: document.querySelector("#studentProjectDue"),
  projectDesc: document.querySelector("#studentProjectDesc"),
  projectPicker: document.querySelector("#studentProjectPicker"),
  projectPickerCount: document.querySelector("#studentProjectPickerCount"),
  projectPickerList: document.querySelector("#studentProjectPickerList"),
  projectList: document.querySelector("#studentProjectList"),
  clearProject: document.querySelector("#studentClearProjectBtn"),
  reportClass: document.querySelector("#studentReportClass"),
  reportLesson: document.querySelector("#studentReportLesson"),
  reportStudent: document.querySelector("#studentReportStudent"),
  reportType: document.querySelector("#studentReportType"),
  reportStart: document.querySelector("#studentReportStart"),
  reportEnd: document.querySelector("#studentReportEnd"),
  reportTask: document.querySelector("#studentReportTask"),
  reportCsv: document.querySelector("#studentReportCsvBtn"),
  reportPrint: document.querySelector("#studentReportPrintBtn"),
  reportContent: document.querySelector("#studentReportContent")
};

let studentState = loadStudentState();
let studentCallbacks = { returnToModuleHub: typeof returnToModuleHub === "function" ? returnToModuleHub : null };
let expandedTaskIds = new Set();
let taskAssignScope = { homework: "class", projects: "class" };

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftIsoDate(iso, days) {
  const base = iso ? new Date(`${iso}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return todayIso();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function studentUid(prefix) {
  if (typeof uid === "function") return uid(prefix);
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function html(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value);
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function toast(message, type = "info") {
  if (typeof showToast === "function") showToast(message, type);
}

function clampScore(value, fallback = 100) {
  if (value === "" || value === null || value === undefined) return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeTaskRecords(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const evaluations = {};
    if (item?.evaluations && typeof item.evaluations === "object") {
      Object.entries(item.evaluations).forEach(([sid, rec]) => {
        evaluations[sid] = {
          status: rec?.status || "pending",
          score: rec?.score === null || rec?.score === undefined || rec?.score === "" ? null : clampScore(rec.score, 0),
          note: String(rec?.note || "")
        };
      });
    } else if (item?.scores || item?.statuses || item?.notes) {
      const ids = new Set([
        ...Object.keys(item.scores || {}),
        ...Object.keys(item.statuses || {}),
        ...Object.keys(item.notes || {})
      ]);
      ids.forEach((sid) => {
        const rawScore = item.scores?.[sid];
        evaluations[sid] = {
          status: item.statuses?.[sid] || (rawScore !== undefined && rawScore !== "" ? "done" : "pending"),
          score: rawScore === undefined || rawScore === "" ? null : clampScore(rawScore, 0),
          note: String(item.notes?.[sid] || "")
        };
      });
    }
    const scope = item?.scope === "students" ? "students" : "class";
    const assignedStudentIds = Array.isArray(item?.assignedStudentIds) ? item.assignedStudentIds : [];
    return {
      id: item?.id || studentUid("task"),
      classId: item?.classId || "",
      lessonId: item?.lessonId || "",
      title: String(item?.title || "Başlıksız"),
      description: String(item?.description || ""),
      dueDate: item?.dueDate || "",
      scope,
      assignedStudentIds,
      evaluations,
      createdAt: item?.createdAt || todayIso()
    };
  });
}

function normalizeRoutineRecords(list) {
  if (!Array.isArray(list)) return [];
  return list.map((entry) => {
    const records = {};
    if (entry?.records && typeof entry.records === "object") {
      Object.entries(entry.records).forEach(([sid, rec]) => {
        records[sid] = {
          absent: Boolean(rec?.absent),
          participation: clampScore(rec?.participation ?? rec?.score, 100),
          behavior: clampScore(rec?.behavior, 100),
          readiness: clampScore(rec?.readiness, 100),
          note: String(rec?.note || "")
        };
      });
    }
    return {
      id: entry?.id || studentUid("rt"),
      date: entry?.date || todayIso(),
      classId: entry?.classId || "",
      lessonId: entry?.lessonId || "",
      records
    };
  });
}

function loadStudentState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDENT_TRACKING_KEY) || "{}");
    const validViews = Object.keys(VIEW_META);
    return {
      ...studentDefaults,
      ...saved,
      activeView: validViews.includes(saved.activeView) ? saved.activeView : "dashboard",
      classes: Array.isArray(saved.classes) ? saved.classes : [],
      lessons: Array.isArray(saved.lessons) ? saved.lessons : [],
      students: Array.isArray(saved.students) ? saved.students : [],
      routine: normalizeRoutineRecords(saved.routine),
      homework: normalizeTaskRecords(saved.homework),
      projects: normalizeTaskRecords(saved.projects)
    };
  } catch {
    return { ...studentDefaults };
  }
}

function saveStudentState() {
  localStorage.setItem(STUDENT_TRACKING_KEY, JSON.stringify(studentState));
  window.scheduleCloudSave?.();
}

function classNameById(id) {
  return studentState.classes.find((c) => c.id === id)?.name || "Sınıf yok";
}

function lessonNameById(id) {
  return studentState.lessons.find((l) => l.id === id)?.name || "Ders yok";
}

function studentsInClass(classId) {
  return studentState.students
    .filter((s) => !classId || s.classId === classId)
    .sort((a, b) => (Number(a.no) || 999999) - (Number(b.no) || 999999) || String(a.name).localeCompare(String(b.name), "tr"));
}

function lessonsForClass(classId) {
  return studentState.lessons.filter((l) => !classId || l.classId === classId);
}

function fillSelect(select, items, emptyLabel, preserve = true) {
  if (!select) return;
  const current = preserve ? select.value : "";
  const options = [];
  if (emptyLabel !== null) options.push(`<option value="">${html(emptyLabel)}</option>`);
  items.forEach((item) => {
    options.push(`<option value="${html(item.id)}">${html(item.label || item.name)}</option>`);
  });
  select.innerHTML = options.join("");
  if (current && items.some((item) => item.id === current)) {
    select.value = current;
  } else if (emptyLabel === null && items.length) {
    select.value = items[0].id;
  }
}

function syncAllClassAndLessonSelects() {
  const classes = studentState.classes;
  fillSelect(studentEls.lessonClass, classes, classes.length ? null : "Önce sınıf ekleyin");
  fillSelect(studentEls.studentClass, classes, classes.length ? null : "Önce sınıf ekleyin");
  fillSelect(studentEls.routineClass, classes, classes.length ? null : "Sınıf yok");
  fillSelect(studentEls.homeworkClass, classes, classes.length ? null : "Sınıf yok");
  fillSelect(studentEls.projectClass, classes, classes.length ? null : "Sınıf yok");
  fillSelect(studentEls.reportClass, classes, "Tüm sınıflar");

  syncLessonSelect(studentEls.routineClass, studentEls.routineLesson, "Ders seçin");
  syncLessonSelect(studentEls.homeworkClass, studentEls.homeworkLesson, "Ders seçin");
  syncLessonSelect(studentEls.projectClass, studentEls.projectLesson, "Ders seçin");

  const rClass = studentEls.reportClass?.value;
  fillSelect(studentEls.reportLesson, rClass ? lessonsForClass(rClass) : studentState.lessons, "Tüm dersler");
  fillSelect(studentEls.reportStudent, (rClass ? studentsInClass(rClass) : studentState.students).map((s) => ({
    id: s.id,
    label: `${s.no ? `${s.no} - ` : ""}${s.name}`
  })), "Tüm öğrenciler");
  syncReportTaskSelect();
}

function syncLessonSelect(classSelect, lessonSelect, emptyLabel = "Ders yok") {
  if (!classSelect || !lessonSelect) return;
  const lessons = lessonsForClass(classSelect.value);
  fillSelect(lessonSelect, lessons, lessons.length ? null : emptyLabel);
}

function syncTaskPicker(kind) {
  const isHw = kind === "homework";
  const classEl = isHw ? studentEls.homeworkClass : studentEls.projectClass;
  const pickerEl = isHw ? studentEls.homeworkPicker : studentEls.projectPicker;
  const listEl = isHw ? studentEls.homeworkPickerList : studentEls.projectPickerList;
  const countEl = isHw ? studentEls.homeworkPickerCount : studentEls.projectPickerCount;
  if (!pickerEl || !listEl) return;

  const scope = taskAssignScope[kind] || "class";
  pickerEl.hidden = scope !== "students";
  document.querySelectorAll(`[data-assign-scope="${kind}"]`).forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.scopeVal === scope);
  });

  const existingChecked = new Set(
    Array.from(listEl.querySelectorAll("input:checked")).map((i) => i.value)
  );
  const classStudents = studentsInClass(classEl?.value || "");
  if (!classStudents.length) {
    listEl.innerHTML = `<div class="student-empty" style="padding:10px;">Bu sınıfta öğrenci yok.</div>`;
  } else {
    listEl.innerHTML = classStudents.map((st) => `
      <label class="student-picker-item">
        <input type="checkbox" value="${html(st.id)}" ${existingChecked.has(st.id) ? "checked" : ""} />
        <span>${st.no ? `<b>${html(st.no)}</b> · ` : ""}${html(st.name)}</span>
      </label>
    `).join("");
  }
  if (countEl) {
    const checkedCount = listEl.querySelectorAll("input:checked").length;
    countEl.textContent = `${checkedCount} öğrenci seçili`;
  }
}

function setStudentView(view) {
  const targetView = VIEW_META[view] ? view : "dashboard";
  studentState.activeView = targetView;
  saveStudentState();

  studentEls.navButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.studentView === targetView));
  if (studentEls.mobileNav) studentEls.mobileNav.value = targetView;
  studentEls.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.studentPanel === targetView));

  const meta = VIEW_META[targetView];
  if (studentEls.title) studentEls.title.textContent = meta.title;
  if (studentEls.subtitle) studentEls.subtitle.textContent = meta.subtitle;

  if (targetView === "routine") renderRoutine();
  if (targetView === "reports") renderReports();
}

function renderDashboard() {
  const hasClasses = studentState.classes.length > 0;
  const hasStudents = studentState.students.length > 0;
  const hasLessons = studentState.lessons.length > 0;
  const hasRoutine = studentState.routine.length > 0;
  const completedSteps = [hasClasses, hasStudents, hasLessons, hasRoutine].filter(Boolean).length;

  if (studentEls.flowCard) {
    studentEls.flowCard.innerHTML = `
      <div class="student-flow-head">
        <div>
          <p class="eyebrow" style="margin:0;">Kurulum &amp; Kullanım Akışı</p>
          <strong>${completedSteps} / 4 adım hazır</strong>
        </div>
        <span style="font-size:0.78rem;color:#94a3b8;">Sınıf → Öğrenci → Ders → Günlük Değerlendirme</span>
      </div>
      <div class="student-flow-steps">
        <button type="button" class="student-flow-step ${hasClasses ? "is-done" : ""}" data-student-target="classes">
          <span class="student-flow-badge">${hasClasses ? "✓" : "1"}</span><span>Sınıf oluştur</span>
        </button>
        <button type="button" class="student-flow-step ${hasStudents ? "is-done" : ""}" data-student-target="students">
          <span class="student-flow-badge">${hasStudents ? "✓" : "2"}</span><span>Öğrencileri ata</span>
        </button>
        <button type="button" class="student-flow-step ${hasLessons ? "is-done" : ""}" data-student-target="lessons">
          <span class="student-flow-badge">${hasLessons ? "✓" : "3"}</span><span>Dersleri ata</span>
        </button>
        <button type="button" class="student-flow-step ${hasRoutine ? "is-done" : ""}" data-student-target="routine">
          <span class="student-flow-badge">${hasRoutine ? "✓" : "4"}</span><span>Günlük değerlendir</span>
        </button>
      </div>
    `;
  }

  const today = todayIso();
  const todayEvalCount = studentState.routine
    .filter((r) => r.date === today)
    .reduce((acc, r) => acc + Object.keys(r.records || {}).length, 0);
  const openTasks = [...studentState.homework, ...studentState.projects]
    .filter((t) => !t.dueDate || t.dueDate >= today).length;

  if (studentEls.statGrid) {
    studentEls.statGrid.innerHTML = `
      <div class="student-stat-card"><strong>${studentState.classes.length}</strong><span>Sınıf</span></div>
      <div class="student-stat-card"><strong>${studentState.students.length}</strong><span>Öğrenci</span></div>
      <div class="student-stat-card"><strong>${studentState.lessons.length}</strong><span>Atanmış Ders</span></div>
      <div class="student-stat-card"><strong>${todayEvalCount}</strong><span>Bugün Değerlendirilen</span></div>
      <div class="student-stat-card"><strong>${openTasks}</strong><span>Aktif Ödev / Proje</span></div>
    `;
  }

  if (studentEls.dashboardExtras) {
    const upcoming = [
      ...studentState.homework.map((h) => ({ ...h, kindLabel: "Ödev" })),
      ...studentState.projects.map((p) => ({ ...p, kindLabel: "Proje" }))
    ]
      .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"))
      .slice(0, 5);

    const upcomingHtml = upcoming.length
      ? upcoming.map((item) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(148,163,184,0.1);">
            <div>
              <strong style="font-size:0.86rem;">${html(item.title)}</strong>
              <small style="display:block;color:#94a3b8;font-size:0.76rem;">${html(item.kindLabel)} · ${html(classNameById(item.classId))} · ${html(lessonNameById(item.lessonId))}</small>
            </div>
            <span class="student-pill">${item.dueDate ? html(item.dueDate) : "Tarihsiz"}</span>
          </div>
        `).join("")
      : `<div class="student-empty">Yaklaşan ödev veya proje bulunmuyor.</div>`;

    const classSummaryHtml = studentState.classes.length
      ? studentState.classes.map((cls) => {
          const sCount = studentsInClass(cls.id).length;
          const lCount = lessonsForClass(cls.id).length;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(148,163,184,0.1);">
              <div>
                <strong style="font-size:0.88rem;">${html(cls.name)}</strong>
                <small style="display:block;color:#94a3b8;font-size:0.76rem;">${sCount} öğrenci · ${lCount} ders</small>
              </div>
              <button type="button" class="secondary-action" data-quick-routine-class="${html(cls.id)}" style="min-height:28px;padding:0 10px;font-size:0.76rem;">Değerlendir</button>
            </div>
          `;
        }).join("")
      : `<div class="student-empty">Henüz sınıf eklenmedi.</div>`;

    studentEls.dashboardExtras.innerHTML = `
      <div class="student-panel">
        <div class="student-panel-title"><h2>Sınıf Özeti</h2></div>
        <div>${classSummaryHtml}</div>
      </div>
      <div class="student-panel">
        <div class="student-panel-title"><h2>Yaklaşan Ödev &amp; Projeler</h2></div>
        <div>${upcomingHtml}</div>
      </div>
    `;
  }
}

function renderClasses() {
  if (!studentEls.classList) return;
  if (!studentState.classes.length) {
    studentEls.classList.innerHTML = `<div class="student-empty">Henüz sınıf tanımlanmadı. Soldaki formdan ilk sınıfınızı oluşturun.</div>`;
    return;
  }
  studentEls.classList.innerHTML = studentState.classes.map((cls) => {
    const sCount = studentsInClass(cls.id).length;
    const lCount = lessonsForClass(cls.id).length;
    return `
      <article class="student-item-card">
        <div class="student-item-head">
          <div>
            <strong>${html(cls.name)}</strong>
            <small>${html(cls.note || "Açıklama girilmedi")} · ${sCount} öğrenci · ${lCount} ders</small>
          </div>
          <div class="student-item-actions">
            <button type="button" class="secondary-action" data-quick-routine-class="${html(cls.id)}">Değerlendir</button>
            <button type="button" class="ghost-action" data-edit-class="${html(cls.id)}">Düzenle</button>
            <button type="button" class="danger-action" data-delete-class="${html(cls.id)}">Sil</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderLessons() {
  if (!studentEls.lessonList) return;
  const filterClass = studentEls.lessonClass?.value || "";
  const list = lessonsForClass(filterClass);
  if (!list.length) {
    studentEls.lessonList.innerHTML = `<div class="student-empty">Bu sınıfa atanmış ders bulunmuyor.</div>`;
    return;
  }
  studentEls.lessonList.innerHTML = list.map((lesson) => `
    <article class="student-item-card">
      <div class="student-item-head">
        <div>
          <strong>${html(lesson.name)}</strong>
          <small>${html(classNameById(lesson.classId))} · Haftalık ${html(lesson.hours || 2)} saat</small>
        </div>
        <div class="student-item-actions">
          <button type="button" class="ghost-action" data-edit-lesson="${html(lesson.id)}">Düzenle</button>
          <button type="button" class="danger-action" data-delete-lesson="${html(lesson.id)}">Sil</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderStudents() {
  if (!studentEls.studentList) return;
  const classId = studentEls.studentClass?.value || "";
  const query = (studentEls.studentSearch?.value || "").trim().toLocaleLowerCase("tr");
  const list = studentsInClass(classId).filter((s) => {
    if (!query) return true;
    return String(s.name).toLocaleLowerCase("tr").includes(query) || String(s.no || "").toLocaleLowerCase("tr").includes(query);
  });
  if (!list.length) {
    studentEls.studentList.innerHTML = `<div class="student-empty">Bu sınıfta eşleşen öğrenci yok.</div>`;
    return;
  }
  studentEls.studentList.innerHTML = list.map((st) => `
    <article class="student-item-card">
      <div class="student-item-head">
        <div>
          <strong>${st.no ? `${html(st.no)} · ` : ""}${html(st.name)}</strong>
          <small>${html(classNameById(st.classId))}</small>
        </div>
        <div class="student-item-actions">
          <button type="button" class="ghost-action" data-edit-student="${html(st.id)}">Düzenle</button>
          <button type="button" class="danger-action" data-delete-student="${html(st.id)}">Sil</button>
        </div>
      </div>
    </article>
  `).join("");
}

function getOrCreateRoutineEntry(date, classId, lessonId) {
  let entry = studentState.routine.find((r) => r.date === date && r.classId === classId && r.lessonId === lessonId);
  if (!entry) {
    entry = { id: studentUid("rt"), date, classId, lessonId, records: {} };
    studentState.routine.push(entry);
  }
  return entry;
}

function renderRoutine() {
  if (!studentEls.routineList) return;
  if (studentEls.routineDate && !studentEls.routineDate.value) {
    studentEls.routineDate.value = todayIso();
  }
  const date = studentEls.routineDate?.value || todayIso();
  const classId = studentEls.routineClass?.value || "";
  const lessonId = studentEls.routineLesson?.value || "";

  if (!classId || !lessonId) {
    if (studentEls.routineSummary) studentEls.routineSummary.innerHTML = "";
    studentEls.routineList.innerHTML = `<div class="student-empty">Günlük değerlendirme için önce sınıf ve ders seçin.</div>`;
    return;
  }

  const classStudents = studentsInClass(classId);
  if (!classStudents.length) {
    if (studentEls.routineSummary) studentEls.routineSummary.innerHTML = "";
    studentEls.routineList.innerHTML = `<div class="student-empty">Seçili sınıfta öğrenci bulunmuyor. Öğrenciler sekmesinden öğrenci ekleyin.</div>`;
    return;
  }

  const entry = studentState.routine.find((r) => r.date === date && r.classId === classId && r.lessonId === lessonId);
  const records = entry?.records || {};

  let evaluatedCount = 0;
  let absentCount = 0;
  let totalAvg = 0;
  classStudents.forEach((st) => {
    const rec = records[st.id];
    if (rec) {
      if (rec.absent) {
        absentCount += 1;
      } else {
        evaluatedCount += 1;
        totalAvg += (clampScore(rec.participation, 100) + clampScore(rec.behavior, 100) + clampScore(rec.readiness, 100)) / 3;
      }
    }
  });
  const classAvg = evaluatedCount ? Math.round(totalAvg / evaluatedCount) : 0;

  if (studentEls.routineSummary) {
    studentEls.routineSummary.innerHTML = `
      <span class="student-pill is-teal">Toplam: ${classStudents.length} öğrenci</span>
      <span class="student-pill">Değerlendirilen: ${evaluatedCount}</span>
      <span class="student-pill is-amber">Ortalama: ${evaluatedCount ? `${classAvg} puan` : "-"}</span>
      ${absentCount ? `<span class="student-pill is-red">Gelmedi: ${absentCount}</span>` : ""}
    `;
  }

  const presets = [100, 85, 70, 50];
  const readinessPresets = [
    { label: "Tam", val: 100 },
    { label: "Eksik", val: 50 },
    { label: "Yok", val: 0 }
  ];

  studentEls.routineList.innerHTML = classStudents.map((st) => {
    const rec = records[st.id] || { absent: false, participation: 100, behavior: 100, readiness: 100, note: "" };
    const avg = rec.absent ? 0 : Math.round((rec.participation + rec.behavior + rec.readiness) / 3);
    return `
      <div class="student-routine-row ${rec.absent ? "is-absent" : ""}" data-routine-student="${html(st.id)}">
        <div class="student-routine-student">
          <strong>${st.no ? `${html(st.no)} · ` : ""}${html(st.name)}</strong>
          <small>${rec.absent ? "Devamsız işaretli" : `Günlük Ort: ${avg} puan`}</small>
        </div>

        <div class="student-metric-cell">
          <div class="student-metric-head"><span>Katılım</span><b data-routine-val="participation">${rec.participation}</b></div>
          <div class="student-preset-row">
            ${presets.map((p) => `<button type="button" class="student-preset-btn ${rec.participation === p ? "is-active" : ""}" data-routine-preset="participation" data-val="${p}">${p}</button>`).join("")}
            <input type="number" min="0" max="100" class="student-score-mini" data-routine-input="participation" value="${rec.participation}" />
          </div>
        </div>

        <div class="student-metric-cell">
          <div class="student-metric-head"><span>Davranış</span><b data-routine-val="behavior">${rec.behavior}</b></div>
          <div class="student-preset-row">
            ${presets.map((p) => `<button type="button" class="student-preset-btn ${rec.behavior === p ? "is-active" : ""}" data-routine-preset="behavior" data-val="${p}">${p}</button>`).join("")}
            <input type="number" min="0" max="100" class="student-score-mini" data-routine-input="behavior" value="${rec.behavior}" />
          </div>
        </div>

        <div class="student-metric-cell">
          <div class="student-metric-head"><span>Hazırlık</span><b data-routine-val="readiness">${rec.readiness}</b></div>
          <div class="student-preset-row">
            ${readinessPresets.map((rp) => `<button type="button" class="student-preset-btn ${rec.readiness === rp.val ? "is-active" : ""}" data-routine-preset="readiness" data-val="${rp.val}">${rp.label}</button>`).join("")}
          </div>
        </div>

        <div>
          <input type="text" data-routine-note placeholder="Kısa not..." value="${html(rec.note || "")}" />
        </div>

        <div>
          <button type="button" class="student-absent-btn ${rec.absent ? "is-absent" : ""}" data-routine-absent>
            ${rec.absent ? "Gelmedi" : "Geldi"}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function targetStudentsForTask(task) {
  const classStudents = studentsInClass(task.classId);
  if (task.scope === "students" && Array.isArray(task.assignedStudentIds) && task.assignedStudentIds.length) {
    const idSet = new Set(task.assignedStudentIds);
    return classStudents.filter((s) => idSet.has(s.id));
  }
  return classStudents;
}

function renderTaskList(kind) {
  const listEl = kind === "homework" ? studentEls.homeworkList : studentEls.projectList;
  if (!listEl) return;
  const tasks = studentState[kind] || [];
  const label = kind === "homework" ? "ödev" : "proje";
  if (!tasks.length) {
    listEl.innerHTML = `<div class="student-empty">Henüz ${label} tanımlanmadı. Soldaki formdan ${label} oluşturup öğrenciye veya tüm sınıfa atayabilirsiniz.</div>`;
    return;
  }

  listEl.innerHTML = tasks.map((task) => {
    const targets = targetStudentsForTask(task);
    const isExpanded = expandedTaskIds.has(task.id);
    const doneCount = targets.filter((st) => task.evaluations?.[st.id]?.status === "done").length;
    const scored = targets
      .map((st) => task.evaluations?.[st.id]?.score)
      .filter((sc) => sc !== null && sc !== undefined);
    const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
    const scopeLabel = task.scope === "students" ? `${targets.length} Seçili Öğrenci` : `Tüm Sınıf (${targets.length})`;

    const evalHtml = isExpanded ? `
      <div class="student-eval-table">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.78rem;color:#94a3b8;">Atanan öğrencilerin teslim durumu ve puanı anında kaydedilir.</span>
          <button type="button" class="secondary-action" data-task-all-full="${kind}:${html(task.id)}" style="min-height:28px;padding:0 10px;font-size:0.75rem;">Tümüne Teslim + 100 Ver</button>
        </div>
        ${targets.length ? targets.map((st) => {
          const ev = task.evaluations?.[st.id] || { status: "pending", score: null, note: "" };
          return `
            <div class="student-eval-row" data-task-eval="${kind}:${html(task.id)}:${html(st.id)}">
              <div>
                <strong style="font-size:0.86rem;">${st.no ? `${html(st.no)} · ` : ""}${html(st.name)}</strong>
              </div>
              <div class="student-status-pills">
                <button type="button" class="student-status-pill is-done ${ev.status === "done" ? "is-active" : ""}" data-task-status="done">Teslim</button>
                <button type="button" class="student-status-pill is-partial ${ev.status === "partial" ? "is-active" : ""}" data-task-status="partial">Eksik</button>
                <button type="button" class="student-status-pill is-missing ${ev.status === "missing" ? "is-active" : ""}" data-task-status="missing">Yapmadı</button>
                <button type="button" class="student-status-pill is-pending ${ev.status === "pending" ? "is-active" : ""}" data-task-status="pending">Bekliyor</button>
              </div>
              <input type="number" min="0" max="100" placeholder="Puan" data-task-score value="${ev.score ?? ""}" style="min-height:30px;height:30px;padding:4px 6px;text-align:center;" />
              <input type="text" placeholder="Not..." data-task-note value="${html(ev.note || "")}" style="min-height:30px;height:30px;padding:4px 8px;" />
            </div>
          `;
        }).join("") : `<div class="student-empty" style="padding:12px;">Atanan öğrenci bulunamadı.</div>`}
      </div>
    ` : "";

    return `
      <article class="student-item-card">
        <div class="student-item-head">
          <div>
            <strong>${html(task.title)}</strong>
            <small>${html(classNameById(task.classId))} · ${html(lessonNameById(task.lessonId))}${task.dueDate ? ` · Son: ${html(task.dueDate)}` : ""}</small>
            ${task.description ? `<small style="color:#cbd5e1;margin-top:4px;">${html(task.description)}</small>` : ""}
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
              <span class="student-pill is-teal">${html(scopeLabel)}</span>
              <span class="student-pill">${doneCount}/${targets.length} Teslim</span>
              ${avg !== null ? `<span class="student-pill is-amber">Ort: ${avg}</span>` : ""}
            </div>
          </div>
          <div class="student-item-actions">
            <button type="button" class="primary-action" data-toggle-task="${html(task.id)}">${isExpanded ? "Kapat" : "Değerlendir"}</button>
            <button type="button" class="ghost-action" data-edit-task="${kind}:${html(task.id)}">Düzenle</button>
            <button type="button" class="danger-action" data-delete-task="${kind}:${html(task.id)}">Sil</button>
          </div>
        </div>
        ${evalHtml}
      </article>
    `;
  }).join("");
}

function syncReportTaskSelect() {
  if (!studentEls.reportTask) return;
  const classId = studentEls.reportClass?.value || "";
  const lessonId = studentEls.reportLesson?.value || "";
  const type = studentEls.reportType?.value || "all";
  let tasks = [];
  if (type === "all" || type === "homework") {
    tasks = tasks.concat(studentState.homework.map((h) => ({ ...h, label: `[Ödev] ${h.title}` })));
  }
  if (type === "all" || type === "projects") {
    tasks = tasks.concat(studentState.projects.map((p) => ({ ...p, label: `[Proje] ${p.title}` })));
  }
  tasks = tasks.filter((t) => (!classId || t.classId === classId) && (!lessonId || t.lessonId === lessonId));
  fillSelect(studentEls.reportTask, tasks, "Tüm ödev ve projeler");
}

function buildReportRows() {
  const classId = studentEls.reportClass?.value || "";
  const lessonId = studentEls.reportLesson?.value || "";
  const studentId = studentEls.reportStudent?.value || "";
  const type = studentEls.reportType?.value || "all";
  const start = studentEls.reportStart?.value || "";
  const end = studentEls.reportEnd?.value || "";
  const taskId = studentEls.reportTask?.value || "";

  let students = classId ? studentsInClass(classId) : studentsInClass("");
  if (studentId) students = students.filter((s) => s.id === studentId);

  const routineList = studentState.routine.filter((r) => {
    if (classId && r.classId !== classId) return false;
    if (lessonId && r.lessonId !== lessonId) return false;
    if (start && r.date < start) return false;
    if (end && r.date > end) return false;
    return true;
  });

  const filterTasks = (arr) => arr.filter((t) => {
    if (classId && t.classId !== classId) return false;
    if (lessonId && t.lessonId !== lessonId) return false;
    if (taskId && t.id !== taskId) return false;
    if (start && t.dueDate && t.dueDate < start) return false;
    if (end && t.dueDate && t.dueDate > end) return false;
    return true;
  });

  const hwList = (type === "all" || type === "homework") ? filterTasks(studentState.homework) : [];
  const prjList = (type === "all" || type === "projects") ? filterTasks(studentState.projects) : [];

  return students.map((st) => {
    let dailyScores = [];
    let absentDays = 0;
    if (type === "all" || type === "daily") {
      routineList.forEach((r) => {
        const rec = r.records?.[st.id];
        if (!rec) return;
        if (rec.absent) {
          absentDays += 1;
        } else {
          dailyScores.push((rec.participation + rec.behavior + rec.readiness) / 3);
        }
      });
    }

    const collectTaskStats = (list) => {
      let scores = [];
      let done = 0;
      let assigned = 0;
      list.forEach((t) => {
        if (t.classId !== st.classId) return;
        if (t.scope === "students" && !(t.assignedStudentIds || []).includes(st.id)) return;
        assigned += 1;
        const ev = t.evaluations?.[st.id];
        if (ev?.status === "done") done += 1;
        if (ev?.score !== null && ev?.score !== undefined) scores.push(ev.score);
      });
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return { assigned, done, avg };
    };

    const hw = collectTaskStats(hwList);
    const prj = collectTaskStats(prjList);
    const dailyAvg = dailyScores.length ? Math.round(dailyScores.reduce((a, b) => a + b, 0) / dailyScores.length) : null;

    const parts = [dailyAvg, hw.avg, prj.avg].filter((v) => v !== null);
    const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;

    return {
      student: st,
      className: classNameById(st.classId),
      dailyAvg,
      dailyCount: dailyScores.length,
      absentDays,
      hw,
      prj,
      overall
    };
  });
}

function renderReports() {
  if (!studentEls.reportContent) return;
  const rows = buildReportRows();
  if (!rows.length) {
    studentEls.reportContent.innerHTML = `<div class="student-empty">Seçili filtrelere uygun öğrenci kaydı bulunamadı.</div>`;
    return;
  }

  const withOverall = rows.filter((r) => r.overall !== null);
  const overallAvg = withOverall.length ? Math.round(withOverall.reduce((a, b) => a + b.overall, 0) / withOverall.length) : "-";
  const totalDaily = rows.reduce((a, b) => a + b.dailyCount, 0);
  const hwAssigned = rows.reduce((a, b) => a + b.hw.assigned, 0);
  const hwDone = rows.reduce((a, b) => a + b.hw.done, 0);
  const hwRate = hwAssigned ? `%${Math.round((hwDone / hwAssigned) * 100)}` : "-";

  studentEls.reportContent.innerHTML = `
    <div class="student-stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));">
      <div class="student-stat-card"><strong>${rows.length}</strong><span>Listelenen Öğrenci</span></div>
      <div class="student-stat-card"><strong>${overallAvg}</strong><span>Genel Puan Ortalaması</span></div>
      <div class="student-stat-card"><strong>${totalDaily}</strong><span>Günlük Değerlendirme</span></div>
      <div class="student-stat-card"><strong>${hwRate}</strong><span>Ödev Teslim Oranı</span></div>
    </div>
    <div class="student-report-table-wrap">
      <table class="student-report-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Öğrenci</th>
            <th>Sınıf</th>
            <th>Günlük Ort.</th>
            <th>Ödev (Teslim / Ort.)</th>
            <th>Proje (Teslim / Ort.)</th>
            <th>Devamsızlık</th>
            <th>Genel Ort.</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => `
            <tr>
              <td>${html(r.student.no || "-")}</td>
              <td><strong>${html(r.student.name)}</strong></td>
              <td>${html(r.className)}</td>
              <td>${r.dailyAvg !== null ? `${r.dailyAvg} (${r.dailyCount})` : "-"}</td>
              <td>${r.hw.assigned ? `${r.hw.done}/${r.hw.assigned} · ${r.hw.avg ?? "-"}` : "-"}</td>
              <td>${r.prj.assigned ? `${r.prj.done}/${r.prj.assigned} · ${r.prj.avg ?? "-"}` : "-"}</td>
              <td>${r.absentDays ? `${r.absentDays} gün` : "0"}</td>
              <td><span class="student-pill ${r.overall !== null ? (r.overall >= 70 ? "is-teal" : r.overall >= 50 ? "is-amber" : "is-red") : ""}">${r.overall ?? "-"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function exportReportCsv() {
  const rows = buildReportRows();
  if (!rows.length) {
    toast("Dışa aktarılacak veri bulunamadı.", "warning");
    return;
  }
  const header = ["No", "Ad Soyad", "Sinif", "Gunluk Ortalama", "Odev Teslim", "Odev Ort", "Proje Teslim", "Proje Ort", "Devamsizlik", "Genel Ortalama"];
  const lines = [header.join(";")];
  rows.forEach((r) => {
    lines.push([
      r.student.no || "",
      `"${String(r.student.name || "").replace(/"/g, '""')}"`,
      `"${String(r.className || "").replace(/"/g, '""')}"`,
      r.dailyAvg ?? "",
      r.hw.assigned ? `${r.hw.done}/${r.hw.assigned}` : "",
      r.hw.avg ?? "",
      r.prj.assigned ? `${r.prj.done}/${r.prj.assigned}` : "",
      r.prj.avg ?? "",
      r.absentDays,
      r.overall ?? ""
    ].join(";"));
  });
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ders-takibi-rapor-${todayIso()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function openPrintableStudentReport() {
  const rows = buildReportRows();
  if (!rows.length) {
    toast("Yazdırılacak rapor verisi bulunamadı.", "warning");
    return;
  }
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Ders Takibi Raporu</title>
    <style>
      body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#0f172a}
      h1{margin:0 0 6px;font-size:20px} p{margin:0 0 16px;color:#475569;font-size:13px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #cbd5e1;padding:7px 9px;text-align:left}
      th{background:#f1f5f9}
    </style></head><body>
    <h1>Ders ve Öğrenci Takibi Raporu</h1>
    <p>Oluşturma tarihi: ${todayIso()}</p>
    <table><thead><tr><th>No</th><th>Öğrenci</th><th>Sınıf</th><th>Günlük Ort.</th><th>Ödev</th><th>Proje</th><th>Devamsız</th><th>Genel Ort.</th></tr></thead>
    <tbody>${rows.map((r) => `
      <tr>
        <td>${html(r.student.no || "-")}</td>
        <td>${html(r.student.name)}</td>
        <td>${html(r.className)}</td>
        <td>${r.dailyAvg ?? "-"}</td>
        <td>${r.hw.assigned ? `${r.hw.done}/${r.hw.assigned} (${r.hw.avg ?? "-"})` : "-"}</td>
        <td>${r.prj.assigned ? `${r.prj.done}/${r.prj.assigned} (${r.prj.avg ?? "-"})` : "-"}</td>
        <td>${r.absentDays}</td>
        <td><strong>${r.overall ?? "-"}</strong></td>
      </tr>`).join("")}
    </tbody></table>
    <script>window.onload=()=>window.print();</script></body></html>
  `);
  win.document.close();
}

function renderStudentModule() {
  syncAllClassAndLessonSelects();
  renderDashboard();
  renderClasses();
  renderLessons();
  renderStudents();
  syncTaskPicker("homework");
  syncTaskPicker("projects");
  renderTaskList("homework");
  renderTaskList("projects");
  renderRoutine();
  renderReports();
}

function clearClassForm() {
  if (studentEls.classId) studentEls.classId.value = "";
  if (studentEls.className) studentEls.className.value = "";
  if (studentEls.classNote) studentEls.classNote.value = "";
}

function clearLessonForm() {
  if (studentEls.lessonId) studentEls.lessonId.value = "";
  if (studentEls.lessonName) studentEls.lessonName.value = "";
  if (studentEls.lessonHours) studentEls.lessonHours.value = "2";
}

function clearStudentForm() {
  if (studentEls.studentId) studentEls.studentId.value = "";
  if (studentEls.studentNo) studentEls.studentNo.value = "";
  if (studentEls.studentName) studentEls.studentName.value = "";
}

function clearTaskForm(kind) {
  const isHw = kind === "homework";
  (isHw ? studentEls.homeworkId : studentEls.projectId).value = "";
  (isHw ? studentEls.homeworkTitle : studentEls.projectTitle).value = "";
  (isHw ? studentEls.homeworkDue : studentEls.projectDue).value = "";
  (isHw ? studentEls.homeworkDesc : studentEls.projectDesc).value = "";
  taskAssignScope[kind] = "class";
  const pickerList = isHw ? studentEls.homeworkPickerList : studentEls.projectPickerList;
  pickerList?.querySelectorAll("input[type='checkbox']").forEach((cb) => { cb.checked = false; });
  syncTaskPicker(kind);
}

function importStudents() {
  const classId = studentEls.studentClass?.value || "";
  if (!classId) { toast("Önce sınıf seçin.", "warning"); return; }
  const raw = (studentEls.importText?.value || "").trim();
  if (!raw) { toast("Aktarılacak liste boş.", "warning"); return; }

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let added = 0;
  lines.forEach((line) => {
    const clean = line.replace(/\t+/g, " ").replace(/\s+/g, " ").trim();
    const match = clean.match(/^(\d{1,6})\s*[-.;:\s]+(.+)$/);
    const no = match ? match[1].trim() : "";
    const name = match ? match[2].trim() : clean;
    if (!name || name.length < 2) return;
    const exists = studentState.students.some((s) => s.classId === classId && s.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"));
    if (!exists) {
      studentState.students.push({ id: studentUid("st"), classId, no, name });
      added += 1;
    }
  });

  if (added) {
    if (studentEls.importText) studentEls.importText.value = "";
    saveStudentState();
    renderStudentModule();
    toast(`${added} öğrenci sınıfa aktarıldı.`, "success");
  } else {
    toast("Yeni öğrenci eklenemedi (liste boş veya zaten kayıtlı).", "info");
  }
}

function updateRoutineRowRecord(rowEl, mutator) {
  const sid = rowEl?.dataset.routineStudent;
  const date = studentEls.routineDate?.value || todayIso();
  const classId = studentEls.routineClass?.value || "";
  const lessonId = studentEls.routineLesson?.value || "";
  if (!sid || !classId || !lessonId) return;

  const entry = getOrCreateRoutineEntry(date, classId, lessonId);
  const current = entry.records[sid] || { absent: false, participation: 100, behavior: 100, readiness: 100, note: "" };
  mutator(current);
  entry.records[sid] = current;
  saveStudentState();
  renderRoutine();
  renderDashboard();
}

function bindStudentEvents() {
  studentEls.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => setStudentView(btn.dataset.studentView));
  });
  studentEls.mobileNav?.addEventListener("change", () => setStudentView(studentEls.mobileNav.value));

  studentEls.shell?.addEventListener("click", (event) => {
    const targetBtn = event.target.closest("[data-student-target]");
    if (targetBtn) {
      setStudentView(targetBtn.dataset.studentTarget);
      return;
    }
    const quickRoutineBtn = event.target.closest("[data-quick-routine-class]");
    if (quickRoutineBtn) {
      const cid = quickRoutineBtn.dataset.quickRoutineClass;
      if (studentEls.routineClass) {
        studentEls.routineClass.value = cid;
        syncLessonSelect(studentEls.routineClass, studentEls.routineLesson, "Ders seçin");
      }
      setStudentView("routine");
      return;
    }
    const scopeBtn = event.target.closest("[data-assign-scope]");
    if (scopeBtn) {
      const kind = scopeBtn.dataset.assignScope;
      taskAssignScope[kind] = scopeBtn.dataset.scopeVal;
      syncTaskPicker(kind);
      return;
    }
    const pickAll = event.target.closest("[data-picker-all]");
    if (pickAll) {
      const kind = pickAll.dataset.pickerAll;
      const list = kind === "homework" ? studentEls.homeworkPickerList : studentEls.projectPickerList;
      list?.querySelectorAll("input[type='checkbox']").forEach((c) => { c.checked = true; });
      syncTaskPicker(kind);
      return;
    }
    const pickNone = event.target.closest("[data-picker-none]");
    if (pickNone) {
      const kind = pickNone.dataset.pickerNone;
      const list = kind === "homework" ? studentEls.homeworkPickerList : studentEls.projectPickerList;
      list?.querySelectorAll("input[type='checkbox']").forEach((c) => { c.checked = false; });
      syncTaskPicker(kind);
      return;
    }
  });

  studentEls.classForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = studentEls.className.value.trim();
    if (!name) return;
    const id = studentEls.classId.value;
    const note = studentEls.classNote.value.trim();
    if (id) {
      const cls = studentState.classes.find((c) => c.id === id);
      if (cls) { cls.name = name; cls.note = note; }
    } else {
      studentState.classes.push({ id: studentUid("cls"), name, note });
    }
    clearClassForm();
    saveStudentState();
    renderStudentModule();
    toast("Sınıf kaydedildi.", "success");
  });
  studentEls.clearClass?.addEventListener("click", clearClassForm);

  studentEls.lessonForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const classId = studentEls.lessonClass.value;
    const name = studentEls.lessonName.value.trim();
    const hours = Number(studentEls.lessonHours.value) || 2;
    if (!classId || !name) { toast("Sınıf ve ders adı zorunludur.", "warning"); return; }
    const id = studentEls.lessonId.value;
    if (id) {
      const lesson = studentState.lessons.find((l) => l.id === id);
      if (lesson) { lesson.classId = classId; lesson.name = name; lesson.hours = hours; }
    } else {
      studentState.lessons.push({ id: studentUid("ls"), classId, name, hours });
    }
    clearLessonForm();
    saveStudentState();
    renderStudentModule();
    toast("Ders kaydedildi.", "success");
  });
  studentEls.clearLesson?.addEventListener("click", clearLessonForm);

  studentEls.studentForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const classId = studentEls.studentClass.value;
    const no = studentEls.studentNo.value.trim();
    const name = studentEls.studentName.value.trim();
    if (!classId || !name) { toast("Sınıf ve ad soyad zorunludur.", "warning"); return; }
    const id = studentEls.studentId.value;
    if (id) {
      const st = studentState.students.find((s) => s.id === id);
      if (st) { st.classId = classId; st.no = no; st.name = name; }
    } else {
      studentState.students.push({ id: studentUid("st"), classId, no, name });
    }
    clearStudentForm();
    saveStudentState();
    renderStudentModule();
    toast("Öğrenci kaydedildi.", "success");
  });
  studentEls.clearStudent?.addEventListener("click", clearStudentForm);
  studentEls.importBtn?.addEventListener("click", importStudents);
  studentEls.studentSearch?.addEventListener("input", renderStudents);
  studentEls.studentClass?.addEventListener("change", renderStudents);
  studentEls.lessonClass?.addEventListener("change", renderLessons);

  const handleTaskSubmit = (kind, e) => {
    e.preventDefault();
    const isHw = kind === "homework";
    const id = (isHw ? studentEls.homeworkId : studentEls.projectId).value;
    const classId = (isHw ? studentEls.homeworkClass : studentEls.projectClass).value;
    const lessonId = (isHw ? studentEls.homeworkLesson : studentEls.projectLesson).value;
    const title = (isHw ? studentEls.homeworkTitle : studentEls.projectTitle).value.trim();
    const dueDate = (isHw ? studentEls.homeworkDue : studentEls.projectDue).value;
    const description = (isHw ? studentEls.homeworkDesc : studentEls.projectDesc).value.trim();
    const scope = taskAssignScope[kind] || "class";
    const pickerList = isHw ? studentEls.homeworkPickerList : studentEls.projectPickerList;
    const assignedStudentIds = scope === "students"
      ? Array.from(pickerList?.querySelectorAll("input:checked") || []).map((c) => c.value)
      : [];

    if (!classId || !lessonId || !title) {
      toast("Sınıf, ders ve başlık zorunludur.", "warning");
      return;
    }
    if (scope === "students" && !assignedStudentIds.length) {
      toast("En az bir öğrenci seçin veya Tüm Sınıf olarak atayın.", "warning");
      return;
    }

    if (id) {
      const task = studentState[kind].find((t) => t.id === id);
      if (task) {
        Object.assign(task, { classId, lessonId, title, dueDate, description, scope, assignedStudentIds });
      }
    } else {
      const newTask = {
        id: studentUid(isHw ? "hw" : "prj"),
        classId, lessonId, title, dueDate, description, scope, assignedStudentIds,
        evaluations: {},
        createdAt: todayIso()
      };
      studentState[kind].unshift(newTask);
      expandedTaskIds.add(newTask.id);
    }

    clearTaskForm(kind);
    saveStudentState();
    renderStudentModule();
    toast(isHw ? "Ödev kaydedildi." : "Proje kaydedildi.", "success");
  };

  studentEls.homeworkForm?.addEventListener("submit", (e) => handleTaskSubmit("homework", e));
  studentEls.projectForm?.addEventListener("submit", (e) => handleTaskSubmit("projects", e));
  studentEls.clearHomework?.addEventListener("click", () => clearTaskForm("homework"));
  studentEls.clearProject?.addEventListener("click", () => clearTaskForm("projects"));

  studentEls.homeworkClass?.addEventListener("change", () => {
    syncLessonSelect(studentEls.homeworkClass, studentEls.homeworkLesson, "Ders seçin");
    syncTaskPicker("homework");
  });
  studentEls.projectClass?.addEventListener("change", () => {
    syncLessonSelect(studentEls.projectClass, studentEls.projectLesson, "Ders seçin");
    syncTaskPicker("projects");
  });
  [studentEls.homeworkPickerList, studentEls.projectPickerList].forEach((list) => {
    list?.addEventListener("change", () => {
      syncTaskPicker(list === studentEls.homeworkPickerList ? "homework" : "projects");
    });
  });

  // Günlük değerlendirme olayları
  studentEls.routinePrevDay?.addEventListener("click", () => {
    studentEls.routineDate.value = shiftIsoDate(studentEls.routineDate.value, -1);
    renderRoutine();
  });
  studentEls.routineNextDay?.addEventListener("click", () => {
    studentEls.routineDate.value = shiftIsoDate(studentEls.routineDate.value, 1);
    renderRoutine();
  });
  studentEls.routineToday?.addEventListener("click", () => {
    studentEls.routineDate.value = todayIso();
    renderRoutine();
  });
  studentEls.routineClass?.addEventListener("change", () => {
    syncLessonSelect(studentEls.routineClass, studentEls.routineLesson, "Ders seçin");
    renderRoutine();
  });
  studentEls.routineLesson?.addEventListener("change", renderRoutine);
  studentEls.routineDate?.addEventListener("change", renderRoutine);

  studentEls.routineAllFull?.addEventListener("click", () => {
    const date = studentEls.routineDate?.value || todayIso();
    const classId = studentEls.routineClass?.value || "";
    const lessonId = studentEls.routineLesson?.value || "";
    const classStudents = studentsInClass(classId);
    if (!classId || !lessonId || !classStudents.length) return;
    const entry = getOrCreateRoutineEntry(date, classId, lessonId);
    classStudents.forEach((st) => {
      entry.records[st.id] = { absent: false, participation: 100, behavior: 100, readiness: 100, note: entry.records[st.id]?.note || "" };
    });
    saveStudentState();
    renderRoutine();
    renderDashboard();
    toast("Tüm öğrencilere 100 tam puan verildi.", "success");
  });

  studentEls.routineClear?.addEventListener("click", () => {
    const date = studentEls.routineDate?.value || todayIso();
    const classId = studentEls.routineClass?.value || "";
    const lessonId = studentEls.routineLesson?.value || "";
    studentState.routine = studentState.routine.filter((r) => !(r.date === date && r.classId === classId && r.lessonId === lessonId));
    saveStudentState();
    renderRoutine();
    renderDashboard();
    toast("Seçili gün temizlendi.", "info");
  });

  studentEls.saveRoutine?.addEventListener("click", () => {
    saveStudentState();
    toast("Günlük değerlendirme kaydedildi.", "success");
  });

  studentEls.routineList?.addEventListener("click", (e) => {
    const row = e.target.closest("[data-routine-student]");
    if (!row) return;
    const presetBtn = e.target.closest("[data-routine-preset]");
    if (presetBtn) {
      const field = presetBtn.dataset.routinePreset;
      const val = clampScore(presetBtn.dataset.val, 100);
      updateRoutineRowRecord(row, (rec) => {
        rec.absent = false;
        rec[field] = val;
      });
      return;
    }
    if (e.target.closest("[data-routine-absent]")) {
      updateRoutineRowRecord(row, (rec) => {
        rec.absent = !rec.absent;
      });
    }
  });

  studentEls.routineList?.addEventListener("change", (e) => {
    const row = e.target.closest("[data-routine-student]");
    if (!row) return;
    const numInput = e.target.closest("[data-routine-input]");
    if (numInput) {
      const field = numInput.dataset.routineInput;
      updateRoutineRowRecord(row, (rec) => {
        rec.absent = false;
        rec[field] = clampScore(numInput.value, 100);
      });
      return;
    }
    if (e.target.matches("[data-routine-note]")) {
      updateRoutineRowRecord(row, (rec) => {
        rec.note = e.target.value;
      });
    }
  });

  // Liste düzenleme / silme / değerlendirme
  [studentEls.classList, studentEls.lessonList, studentEls.studentList, studentEls.homeworkList, studentEls.projectList].forEach((list) => {
    list?.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      if (btn.dataset.editClass) {
        const cls = studentState.classes.find((c) => c.id === btn.dataset.editClass);
        if (!cls) return;
        studentEls.classId.value = cls.id;
        studentEls.className.value = cls.name;
        studentEls.classNote.value = cls.note || "";
      } else if (btn.dataset.deleteClass) {
        const cid = btn.dataset.deleteClass;
        studentState.classes = studentState.classes.filter((c) => c.id !== cid);
        studentState.lessons = studentState.lessons.filter((l) => l.classId !== cid);
        studentState.students = studentState.students.filter((s) => s.classId !== cid);
        saveStudentState();
        renderStudentModule();
      } else if (btn.dataset.editLesson) {
        const ls = studentState.lessons.find((l) => l.id === btn.dataset.editLesson);
        if (!ls) return;
        studentEls.lessonId.value = ls.id;
        studentEls.lessonClass.value = ls.classId;
        studentEls.lessonName.value = ls.name;
        studentEls.lessonHours.value = ls.hours || 2;
      } else if (btn.dataset.deleteLesson) {
        const lid = btn.dataset.deleteLesson;
        studentState.lessons = studentState.lessons.filter((l) => l.id !== lid);
        saveStudentState();
        renderStudentModule();
      } else if (btn.dataset.editStudent) {
        const st = studentState.students.find((s) => s.id === btn.dataset.editStudent);
        if (!st) return;
        studentEls.studentId.value = st.id;
        studentEls.studentClass.value = st.classId;
        studentEls.studentNo.value = st.no || "";
        studentEls.studentName.value = st.name;
      } else if (btn.dataset.deleteStudent) {
        const sid = btn.dataset.deleteStudent;
        studentState.students = studentState.students.filter((s) => s.id !== sid);
        saveStudentState();
        renderStudentModule();
      } else if (btn.dataset.toggleTask) {
        const tid = btn.dataset.toggleTask;
        if (expandedTaskIds.has(tid)) expandedTaskIds.delete(tid);
        else expandedTaskIds.add(tid);
        renderTaskList("homework");
        renderTaskList("projects");
      } else if (btn.dataset.editTask) {
        const [kind, tid] = btn.dataset.editTask.split(":");
        const task = studentState[kind]?.find((t) => t.id === tid);
        if (!task) return;
        const isHw = kind === "homework";
        (isHw ? studentEls.homeworkId : studentEls.projectId).value = task.id;
        (isHw ? studentEls.homeworkClass : studentEls.projectClass).value = task.classId;
        syncLessonSelect(isHw ? studentEls.homeworkClass : studentEls.projectClass, isHw ? studentEls.homeworkLesson : studentEls.projectLesson, "Ders seçin");
        (isHw ? studentEls.homeworkLesson : studentEls.projectLesson).value = task.lessonId;
        (isHw ? studentEls.homeworkTitle : studentEls.projectTitle).value = task.title;
        (isHw ? studentEls.homeworkDue : studentEls.projectDue).value = task.dueDate || "";
        (isHw ? studentEls.homeworkDesc : studentEls.projectDesc).value = task.description || "";
        taskAssignScope[kind] = task.scope || "class";
        syncTaskPicker(kind);
        const listEl = isHw ? studentEls.homeworkPickerList : studentEls.projectPickerList;
        const idSet = new Set(task.assignedStudentIds || []);
        listEl?.querySelectorAll("input[type='checkbox']").forEach((cb) => { cb.checked = idSet.has(cb.value); });
        syncTaskPicker(kind);
      } else if (btn.dataset.deleteTask) {
        const [kind, tid] = btn.dataset.deleteTask.split(":");
        studentState[kind] = studentState[kind].filter((t) => t.id !== tid);
        saveStudentState();
        renderStudentModule();
      } else if (btn.dataset.taskAllFull) {
        const [kind, tid] = btn.dataset.taskAllFull.split(":");
        const task = studentState[kind]?.find((t) => t.id === tid);
        if (!task) return;
        targetStudentsForTask(task).forEach((st) => {
          task.evaluations[st.id] = { status: "done", score: 100, note: task.evaluations[st.id]?.note || "" };
        });
        saveStudentState();
        renderTaskList(kind);
        renderDashboard();
        toast("Atanan tüm öğrencilere Teslim + 100 puan verildi.", "success");
      } else if (btn.dataset.taskStatus) {
        const row = btn.closest("[data-task-eval]");
        if (!row) return;
        const [kind, tid, sid] = row.dataset.taskEval.split(":");
        const task = studentState[kind]?.find((t) => t.id === tid);
        if (!task) return;
        const prev = task.evaluations[sid] || { status: "pending", score: null, note: "" };
        prev.status = btn.dataset.taskStatus;
        if (prev.status === "done" && prev.score === null) prev.score = 100;
        if (prev.status === "missing" && prev.score === null) prev.score = 0;
        task.evaluations[sid] = prev;
        saveStudentState();
        renderTaskList(kind);
        renderDashboard();
      }
    });
  });

  [studentEls.homeworkList, studentEls.projectList].forEach((list) => {
    list?.addEventListener("change", (e) => {
      const row = e.target.closest("[data-task-eval]");
      if (!row) return;
      const [kind, tid, sid] = row.dataset.taskEval.split(":");
      const task = studentState[kind]?.find((t) => t.id === tid);
      if (!task) return;
      const prev = task.evaluations[sid] || { status: "pending", score: null, note: "" };
      if (e.target.matches("[data-task-score]")) {
        prev.score = e.target.value === "" ? null : clampScore(e.target.value, 0);
        if (prev.score !== null && prev.status === "pending") prev.status = "done";
      } else if (e.target.matches("[data-task-note]")) {
        prev.note = e.target.value;
      }
      task.evaluations[sid] = prev;
      saveStudentState();
      renderTaskList(kind);
    });
  });

  // Rapor filtreleri
  studentEls.reportClass?.addEventListener("change", () => {
    syncAllClassAndLessonSelects();
    renderReports();
  });
  [studentEls.reportLesson, studentEls.reportType].forEach((el) => el?.addEventListener("change", () => {
    syncReportTaskSelect();
    renderReports();
  }));
  [studentEls.reportStudent, studentEls.reportStart, studentEls.reportEnd, studentEls.reportTask].forEach((el) => {
    el?.addEventListener("change", renderReports);
  });
  studentEls.reportCsv?.addEventListener("click", exportReportCsv);
  studentEls.reportPrint?.addEventListener("click", openPrintableStudentReport);
}

bindStudentEvents();

const studentTrackingModule = {
  callbacks: {},
  init(callbacks = {}) { this.callbacks = { ...this.callbacks, ...callbacks }; studentCallbacks = this.callbacks; },
  loadState() { studentState = loadStudentState(); },
  get shell() { return studentEls.shell; },
  get state() { return studentState; },
  render() { renderStudentModule(); setStudentView(studentState.activeView); },
  setView(view) { setStudentView(view); }
};
window.AppModules.register("student-tracking", studentTrackingModule);
