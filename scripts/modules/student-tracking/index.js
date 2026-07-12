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

const studentEls = {
  shell: document.querySelector("#studentShell"),
  title: document.querySelector("#studentPageTitle"),
  subtitle: document.querySelector("#studentPageSubtitle"),
  moduleSwitch: document.querySelector("#studentModuleSwitchBtn"),
  navButtons: document.querySelectorAll("[data-student-view]"),
  mobileNav: document.querySelector("#studentNavMobileSelect"),
  quickButtons: document.querySelectorAll("[data-student-target]"),
  panels: document.querySelectorAll("[data-student-panel]"),
  flowCard: document.querySelector("#studentFlowCard"),
  statGrid: document.querySelector("#studentStatGrid"),
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
  studentList: document.querySelector("#studentStudentList"),
  clearStudent: document.querySelector("#studentClearStudentBtn"),
  importText: document.querySelector("#studentImportText"),
  importBtn: document.querySelector("#studentImportBtn"),
  routineDate: document.querySelector("#studentRoutineDate"),
  routineClass: document.querySelector("#studentRoutineClass"),
  routineLesson: document.querySelector("#studentRoutineLesson"),
  routineList: document.querySelector("#studentRoutineList"),
  saveRoutine: document.querySelector("#studentSaveRoutineBtn"),
  homeworkForm: document.querySelector("#studentHomeworkForm"),
  homeworkId: document.querySelector("#studentHomeworkId"),
  homeworkClass: document.querySelector("#studentHomeworkClass"),
  homeworkLesson: document.querySelector("#studentHomeworkLesson"),
  homeworkTitle: document.querySelector("#studentHomeworkTitle"),
  homeworkDue: document.querySelector("#studentHomeworkDue"),
  homeworkList: document.querySelector("#studentHomeworkList"),
  clearHomework: document.querySelector("#studentClearHomeworkBtn"),
  projectForm: document.querySelector("#studentProjectForm"),
  projectId: document.querySelector("#studentProjectId"),
  projectClass: document.querySelector("#studentProjectClass"),
  projectLesson: document.querySelector("#studentProjectLesson"),
  projectTitle: document.querySelector("#studentProjectTitle"),
  projectDue: document.querySelector("#studentProjectDue"),
  projectList: document.querySelector("#studentProjectList"),
  clearProject: document.querySelector("#studentClearProjectBtn"),
  reportClass: document.querySelector("#studentReportClass"),
  reportLesson: document.querySelector("#studentReportLesson"),
  reportType: document.querySelector("#studentReportType"),
  reportStart: document.querySelector("#studentReportStart"),
  reportEnd: document.querySelector("#studentReportEnd"),
  reportTask: document.querySelector("#studentReportTask"),
  reportPrint: document.querySelector("#studentReportPrintBtn"),
  reportContent: document.querySelector("#studentReportContent")
};

let studentState = loadStudentState();
let studentCallbacks = { returnToModuleHub: typeof returnToModuleHub === "function" ? returnToModuleHub : null };

function loadStudentState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDENT_TRACKING_KEY) || "{}");
    const validViews = ["dashboard", "classes", "students", "lessons", "routine", "homework", "projects", "reports"];
    return {
      ...studentDefaults,
      ...saved,
      activeView: validViews.includes(saved.activeView) ? saved.activeView : "dashboard",
      classes: Array.isArray(saved.classes) ? saved.classes : [],
      lessons: Array.isArray(saved.lessons) ? saved.lessons : [],
      students: Array.isArray(saved.students) ? saved.students : [],
      routine: Array.isArray(saved.routine) ? saved.routine : [],
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

function studentUid(prefix) {
  if (typeof uid === "function") return uid(prefix);
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function classById(id) {
  return studentState.classes.find((item) => item.id === id);
}

function lessonById(id) {
  return studentState.lessons.find((item) => item.id === id);
}

function studentsForClass(classId) {
  return studentState.students
    .filter((item) => item.classId === classId)
    .sort((a, b) => String(a.no || "").localeCompare(String(b.no || ""), "tr", { numeric: true }) || a.name.localeCompare(b.name, "tr"));
}

function lessonsForClass(classId) {
  return studentState.lessons.filter((item) => item.classId === classId).sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

function optionHtml(items, emptyText) {
  return `<option value="">${html(emptyText)}</option>${items.map((item) => `<option value="${html(item.id)}">${html(item.name)}</option>`).join("")}`;
}

function fillSelect(select, items, emptyText, chooseFirst = false) {
  if (!select) return;
  const previous = select.value;
  select.innerHTML = optionHtml(items, emptyText);
  if (items.some((item) => item.id === previous)) select.value = previous;
  else if (chooseFirst && items[0]) select.value = items[0].id;
}

function syncLessonSelect(classSelect, lessonSelect, chooseFirst = false) {
  const classId = classSelect?.value || "";
  fillSelect(lessonSelect, classId ? lessonsForClass(classId) : [], classId ? "Ders seçiniz" : "Önce sınıf seçiniz", chooseFirst);
}

function reportTaskItems() {
  const classId = studentEls.reportClass?.value || "";
  const lessonId = studentEls.reportLesson?.value || "";
  const type = studentEls.reportType?.value || "all";
  const groups = [];
  if (type === "all" || type === "homework") groups.push(...studentState.homework.map((item) => ({ ...item, kind: "homework" })));
  if (type === "all" || type === "projects") groups.push(...studentState.projects.map((item) => ({ ...item, kind: "projects" })));
  return groups
    .filter((item) => (!classId || item.classId === classId) && (!lessonId || item.lessonId === lessonId))
    .map((item) => ({ id: `${item.kind}:${item.id}`, name: `${item.kind === "homework" ? "Ödev" : "Proje"} · ${item.title}` }));
}

function syncReportTaskSelect() {
  const isDaily = studentEls.reportType?.value === "daily";
  const usesDaily = !studentEls.reportType?.value || studentEls.reportType.value === "all" || isDaily;
  fillSelect(studentEls.reportTask, isDaily ? [] : reportTaskItems(), isDaily ? "Günlük raporda kullanılmaz" : "Tüm ödev / proje konuları");
  if (studentEls.reportTask) studentEls.reportTask.disabled = isDaily;
  if (studentEls.reportStart) studentEls.reportStart.disabled = !usesDaily;
  if (studentEls.reportEnd) studentEls.reportEnd.disabled = !usesDaily;
}

function renderSelects() {
  [studentEls.lessonClass, studentEls.studentClass, studentEls.routineClass, studentEls.homeworkClass, studentEls.projectClass]
    .forEach((select) => fillSelect(select, studentState.classes, "Sınıf seçiniz", select === studentEls.routineClass));
  if (studentEls.routineDate && !studentEls.routineDate.value) studentEls.routineDate.value = todayIso();
  syncLessonSelect(studentEls.routineClass, studentEls.routineLesson, true);
  syncLessonSelect(studentEls.homeworkClass, studentEls.homeworkLesson);
  syncLessonSelect(studentEls.projectClass, studentEls.projectLesson);
  fillSelect(studentEls.reportClass, studentState.classes, "Tüm sınıflar");
  const reportLessons = studentEls.reportClass?.value ? lessonsForClass(studentEls.reportClass.value) : studentState.lessons;
  fillSelect(studentEls.reportLesson, reportLessons, "Tüm dersler");
  syncReportTaskSelect();
}

function setStudentView(view) {
  studentState.activeView = view;
  saveStudentState();
  studentEls.navButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.studentView === view));
  if (studentEls.mobileNav) studentEls.mobileNav.value = view;
  studentEls.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.studentPanel === view));
  const titles = {
    dashboard: ["Bugün", "Günün sınıfları, değerlendirmeleri ve yaklaşan çalışmaları"],
    classes: ["Sınıflarım", "Önce sınıfı oluşturun; öğrenci ve dersler bu sınıfa bağlansın"],
    students: ["Öğrenciler", "Bir sınıf seçin, öğrencileri tek tek veya liste halinde ekleyin"],
    lessons: ["Dersler", "Dersleri ilgili sınıfa atayın"],
    routine: ["Günlük Değerlendirme", "Tarih, sınıf ve dersi seçerek öğrencileri hızlıca değerlendirin"],
    homework: ["Ödevler", "Ödev verin ve her öğrencinin teslim durumunu izleyin"],
    projects: ["Projeler", "Projeleri tanımlayın ve öğrenci ilerlemesini izleyin"],
    reports: ["Raporlar", "Sınıf ve ders bazında gelişimi istatistiklerle inceleyin"]
  };
  const [title, subtitle] = titles[view] || titles.dashboard;
  if (studentEls.title) studentEls.title.textContent = title;
  if (studentEls.subtitle) studentEls.subtitle.textContent = subtitle;
  renderStudentModule();
}

function renderFlow() {
  if (!studentEls.flowCard) return;
  const steps = [
    { done: studentState.classes.length > 0, title: "Sınıf oluştur", target: "classes" },
    { done: studentState.students.length > 0, title: "Öğrencileri ekle", target: "students" },
    { done: studentState.lessons.length > 0, title: "Dersleri ata", target: "lessons" },
    { done: studentState.routine.length > 0, title: "Günlük değerlendirmeye başla", target: "routine" }
  ];
  const completed = steps.filter((step) => step.done).length;
  studentEls.flowCard.innerHTML = `
    <div class="student-flow-head">
      <div><span>Kurulum akışı</span><strong>${completed === steps.length ? "Her şey hazır" : `${completed} / ${steps.length} tamamlandı`}</strong></div>
      <small>Sınıf → öğrenci → ders → günlük değerlendirme</small>
    </div>
    <div class="student-flow-steps">
      ${steps.map((step, index) => `<button type="button" class="${step.done ? "is-done" : ""}" data-student-target="${step.target}"><span>${step.done ? "✓" : index + 1}</span><strong>${step.title}</strong></button>`).join("")}
    </div>`;
}

function renderStats() {
  if (!studentEls.statGrid) return;
  const today = todayIso();
  const todayStudentIds = new Set(studentState.routine.filter((item) => item.date === today).map((item) => item.studentId));
  const openWork = [...studentState.homework, ...studentState.projects].filter((item) => !item.due || item.due >= today).length;
  const stats = [
    [studentState.classes.length, "Sınıf"],
    [studentState.students.length, "Öğrenci"],
    [studentState.lessons.length, "Atanmış ders"],
    [todayStudentIds.size, "Bugün değerlendirilen"],
    [openWork, "Açık ödev / proje"]
  ];
  studentEls.statGrid.innerHTML = stats.map(([value, label]) => `<article class="student-stat-card"><strong>${value}</strong><span>${label}</span></article>`).join("");
}

function renderClasses() {
  if (!studentEls.classList) return;
  if (!studentState.classes.length) {
    studentEls.classList.innerHTML = `<div class="student-empty"><strong>İlk sınıfınızı oluşturun</strong><span>Öğrenci ve ders ekleme işlemleri sınıf üzerinden ilerler.</span></div>`;
    return;
  }
  studentEls.classList.innerHTML = studentState.classes.map((item) => `
    <article class="student-class-card">
      <div class="student-class-card-head"><span>${html(item.name.slice(0, 2).toLocaleUpperCase("tr-TR"))}</span><div><strong>${html(item.name)}</strong><small>${html(item.note || "Açıklama eklenmedi")}</small></div></div>
      <div class="student-class-counts"><span><strong>${studentsForClass(item.id).length}</strong> öğrenci</span><span><strong>${lessonsForClass(item.id).length}</strong> ders</span></div>
      <div class="student-class-actions">
        <button type="button" data-open-class-view="students" data-class-id="${html(item.id)}">Öğrenciler</button>
        <button type="button" data-open-class-view="lessons" data-class-id="${html(item.id)}">Dersler</button>
        <button type="button" data-open-class-view="routine" data-class-id="${html(item.id)}">Değerlendir</button>
      </div>
      <div class="student-card-actions"><button type="button" data-edit-class="${html(item.id)}">Düzenle</button><button type="button" data-delete-class="${html(item.id)}">Sil</button></div>
    </article>`).join("");
}

function renderLessons() {
  if (!studentEls.lessonList) return;
  const classId = studentEls.lessonClass?.value || "";
  if (!classId) {
    studentEls.lessonList.innerHTML = `<div class="student-empty">Dersleri görmek için sınıf seçin.</div>`;
    return;
  }
  const items = lessonsForClass(classId);
  studentEls.lessonList.innerHTML = items.length ? items.map((item) => `
    <article class="student-item-card"><div><strong>${html(item.name)}</strong><small>${html(item.hours || 0)} saat / hafta</small></div><div class="student-card-actions"><button type="button" data-edit-lesson="${html(item.id)}">Düzenle</button><button type="button" data-delete-lesson="${html(item.id)}">Sil</button></div></article>`).join("")
    : `<div class="student-empty"><strong>Bu sınıfa ders atanmadı</strong><span>Soldaki kısa formu kullanarak ilk dersi ekleyin.</span></div>`;
}

function renderStudents() {
  if (!studentEls.studentList) return;
  const classId = studentEls.studentClass?.value || "";
  if (!classId) {
    studentEls.studentList.innerHTML = `<div class="student-empty">Öğrencileri görmek için sınıf seçin.</div>`;
    return;
  }
  const items = studentsForClass(classId);
  studentEls.studentList.innerHTML = items.length ? items.map((item) => `
    <article class="student-item-card"><div class="student-person"><span>${html((item.name || "?").slice(0, 1).toLocaleUpperCase("tr-TR"))}</span><div><strong>${html(item.name)}</strong><small>${item.no ? `No: ${html(item.no)}` : "Numara yok"}</small></div></div><div class="student-card-actions"><button type="button" data-edit-student="${html(item.id)}">Düzenle</button><button type="button" data-delete-student="${html(item.id)}">Sil</button></div></article>`).join("")
    : `<div class="student-empty"><strong>Bu sınıfta öğrenci yok</strong><span>Tek öğrenci ekleyebilir veya e-okul listesini yapıştırabilirsiniz.</span></div>`;
}

function evaluationScore(value) {
  if (value === "ok") return 85;
  if (value === "warn") return 55;
  if (value === "bad") return 20;
  const score = Number(value);
  return Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 100;
}

function evaluationSlider(field, value) {
  const score = evaluationScore(value);
  return `<label class="student-evaluation-field">
    <span class="student-evaluation-head"><span>${field.label}</span><output data-routine-output="${field.key}">${score}</output></span>
    <input type="range" min="0" max="100" step="1" value="${score}" data-routine-field="${field.key}" style="--score: ${score}%">
  </label>`;
}

function renderRoutine() {
  if (!studentEls.routineList) return;
  const classId = studentEls.routineClass?.value || "";
  syncLessonSelect(studentEls.routineClass, studentEls.routineLesson, true);
  const lessonId = studentEls.routineLesson?.value || "";
  const date = studentEls.routineDate?.value || todayIso();
  if (!classId || !lessonId) {
    studentEls.routineList.innerHTML = `<div class="student-empty"><strong>Sınıf ve ders seçin</strong><span>Değerlendirme listesi otomatik olarak hazırlanır.</span></div>`;
    return;
  }
  const students = studentsForClass(classId);
  const fields = [
    { key: "attendance", label: "Katılım" },
    { key: "prepared", label: "Hazırlık" },
    { key: "notes", label: "Not Alma" },
    { key: "dress", label: "Davranış" }
  ];
  studentEls.routineList.innerHTML = students.length ? students.map((student) => {
    const record = studentState.routine.find((item) => item.studentId === student.id && item.date === date && item.lessonId === lessonId) || {};
    return `<article class="student-routine-row" data-student-routine="${html(student.id)}"><div class="student-routine-person"><strong>${html(student.name)}</strong><small>${html(student.no || "Numara yok")}</small></div><div class="student-evaluation-grid">${fields.map((field) => evaluationSlider(field, record[field.key])).join("")}</div></article>`;
  }).join("") : `<div class="student-empty"><strong>Bu sınıfta öğrenci yok</strong><span>Önce sınıfa öğrenci ekleyin.</span></div>`;
}

function legacyTaskScore(status) {
  if (status === "done") return 100;
  if (status === "progress") return 50;
  return 0;
}

function normalizeTaskRecords(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const scores = { ...(item.scores || {}) };
    Object.entries(item.statuses || {}).forEach(([studentId, status]) => {
      if (!Number.isFinite(Number(scores[studentId]))) scores[studentId] = legacyTaskScore(status);
    });
    const record = { ...item };
    delete record.statuses;
    return { ...record, scores };
  });
}

function taskScore(item, studentId) {
  if (Number.isFinite(Number(item.scores?.[studentId]))) return evaluationScore(item.scores[studentId]);
  return 0;
}

function taskScoreLabel(score) {
  if (score === 0) return "Yapmadı";
  if (score < 50) return "Başlangıç";
  if (score < 80) return "Kısmen yaptı";
  if (score < 100) return "Tamamladı";
  return "Eksiksiz";
}

function taskStudentSlider(kind, item, student) {
  const score = taskScore(item, student.id);
  return `<label class="student-task-student">
    <span class="student-task-student-name">${html(student.name)}</span>
    <span class="student-task-score-head"><small data-task-score-label>${taskScoreLabel(score)}</small><output data-task-score-output>${score}</output></span>
    <input type="range" min="0" max="100" step="1" value="${score}" data-task-score data-kind="${kind}" data-task-id="${html(item.id)}" data-student-id="${html(student.id)}" style="--score: ${score}%">
  </label>`;
}

function renderTasks(kind) {
  const isHomework = kind === "homework";
  const list = isHomework ? studentEls.homeworkList : studentEls.projectList;
  if (!list) return;
  const items = studentState[kind].slice().sort((a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999")));
  if (!items.length) {
    list.innerHTML = `<div class="student-empty"><strong>Henüz ${isHomework ? "ödev" : "proje"} yok</strong><span>Yeni bir kayıt oluşturduğunuzda öğrenci durumları burada görünür.</span></div>`;
    return;
  }
  list.innerHTML = items.map((item) => {
    const students = studentsForClass(item.classId);
    const average = students.length ? Math.round(students.reduce((sum, student) => sum + taskScore(item, student.id), 0) / students.length) : 0;
    return `<article class="student-task-card">
      <div class="student-task-head"><div><span class="student-task-kind">${isHomework ? "ÖDEV" : "PROJE"}</span><strong>${html(item.title)}</strong><small>${html(classById(item.classId)?.name || "Sınıf yok")} · ${html(lessonById(item.lessonId)?.name || "Ders yok")} · ${item.due ? `Son gün ${html(item.due)}` : "Tarih yok"}</small></div><span class="student-task-progress">${average}%</span></div>
      <details><summary>Öğrenci değerlendirmelerini aç</summary><div class="student-task-students">${students.length ? students.map((student) => taskStudentSlider(kind, item, student)).join("") : `<p>Bu sınıfta öğrenci yok.</p>`}</div></details>
      <div class="student-card-actions"><button type="button" data-edit-${isHomework ? "homework" : "project"}="${html(item.id)}">Düzenle</button><button type="button" data-delete-${isHomework ? "homework" : "project"}="${html(item.id)}">Sil</button></div>
    </article>`;
  }).join("");
}

function averageOf(values) {
  const valid = values.filter((value) => value !== null && value !== undefined && value !== "").map(Number).filter(Number.isFinite);
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null;
}

function routineAverage(record) {
  return averageOf([record.attendance, record.prepared, record.notes, record.dress].map(evaluationScore));
}

function reportBar(label, score, note = "") {
  const value = score ?? 0;
  return `<div class="student-report-bar"><div><span>${html(label)}</span>${note ? `<small>${html(note)}</small>` : ""}<strong>${score == null ? "—" : `${value}%`}</strong></div><span class="student-report-meter"><i style="width:${value}%"></i></span></div>`;
}

function renderReports() {
  if (!studentEls.reportContent) return;
  const classId = studentEls.reportClass?.value || "";
  const lessonId = studentEls.reportLesson?.value || "";
  const type = studentEls.reportType?.value || "all";
  const startDate = type === "all" || type === "daily" ? studentEls.reportStart?.value || "" : "";
  const endDate = type === "all" || type === "daily" ? studentEls.reportEnd?.value || "" : "";
  const taskKey = studentEls.reportTask?.value || "";
  const [taskKind, taskId] = taskKey ? taskKey.split(":") : ["", ""];
  const students = studentState.students.filter((student) => !classId || student.classId === classId);
  const studentIds = new Set(students.map((student) => student.id));
  const routine = studentState.routine.filter((item) => studentIds.has(item.studentId) && (!classId || item.classId === classId) && (!lessonId || item.lessonId === lessonId) && (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate));
  const homework = studentState.homework.filter((item) => (!classId || item.classId === classId) && (!lessonId || item.lessonId === lessonId) && (!taskKey || (taskKind === "homework" && item.id === taskId)));
  const projects = studentState.projects.filter((item) => (!classId || item.classId === classId) && (!lessonId || item.lessonId === lessonId) && (!taskKey || (taskKind === "projects" && item.id === taskId)));
  const dailyScore = averageOf(routine.map(routineAverage));
  const homeworkScores = homework.flatMap((item) => studentsForClass(item.classId).map((student) => taskScore(item, student.id)));
  const projectScores = projects.flatMap((item) => studentsForClass(item.classId).map((student) => taskScore(item, student.id)));
  const homeworkScore = averageOf(homeworkScores);
  const projectScore = averageOf(projectScores);
  const selectedScores = [
    ...(type === "all" || type === "daily" ? routine.map(routineAverage) : []),
    ...(type === "all" || type === "homework" ? homeworkScores : []),
    ...(type === "all" || type === "projects" ? projectScores : [])
  ];
  const overall = averageOf(selectedScores);
  const evaluatedIds = new Set(routine.map((item) => item.studentId));

  const dimensions = [
    ["Katılım", averageOf(routine.map((item) => evaluationScore(item.attendance)))],
    ["Hazırlık", averageOf(routine.map((item) => evaluationScore(item.prepared)))],
    ["Not Alma", averageOf(routine.map((item) => evaluationScore(item.notes)))],
    ["Davranış", averageOf(routine.map((item) => evaluationScore(item.dress)))]
  ];

  const trendMap = new Map();
  routine.forEach((item) => {
    if (!trendMap.has(item.date)) trendMap.set(item.date, []);
    trendMap.get(item.date).push(routineAverage(item));
  });
  const trend = [...trendMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([date, values]) => [date, averageOf(values) || 0]);

  const studentRows = students.map((student) => {
    const daily = routine.filter((item) => item.studentId === student.id).map(routineAverage);
    const hw = homework.filter((item) => item.classId === student.classId).map((item) => taskScore(item, student.id));
    const pr = projects.filter((item) => item.classId === student.classId).map((item) => taskScore(item, student.id));
    const scores = [
      ...(type === "all" || type === "daily" ? daily : []),
      ...(type === "all" || type === "homework" ? hw : []),
      ...(type === "all" || type === "projects" ? pr : [])
    ];
    return { student, score: averageOf(scores), daily: averageOf(daily), homework: averageOf(hw), project: averageOf(pr) };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const metricCards = type === "daily" ? [
    ["Günlük ortalama", dailyScore, `${routine.length} değerlendirme`],
    ["Değerlendirilen", evaluatedIds.size, `${students.length} öğrenciden`],
    ["Katılım", dimensions[0][1], "Ölçüt ortalaması"],
    ["Davranış", dimensions[3][1], "Ölçüt ortalaması"]
  ] : type === "homework" ? [
    ["Ödev ortalaması", homeworkScore, `${homework.length} ödev`],
    ["Ödev sayısı", homework.length, "Seçili kapsamda"],
    ["Tamamlayan", homeworkScores.filter((score) => score >= 80).length, `${homeworkScores.length} değerlendirmeden`],
    ["Yapılmayan", homeworkScores.filter((score) => score === 0).length, `${homeworkScores.length} değerlendirmeden`]
  ] : type === "projects" ? [
    ["Proje ortalaması", projectScore, `${projects.length} proje`],
    ["Proje sayısı", projects.length, "Seçili kapsamda"],
    ["Tamamlayan", projectScores.filter((score) => score >= 80).length, `${projectScores.length} değerlendirmeden`],
    ["Yapılmayan", projectScores.filter((score) => score === 0).length, `${projectScores.length} değerlendirmeden`]
  ] : [
    ["Genel ortalama", overall, "Tüm değerlendirmeler"],
    ["Günlük değerlendirme", dailyScore, `${evaluatedIds.size} öğrenci`],
    ["Ödev ortalaması", homeworkScore, `${homework.length} ödev`],
    ["Proje ortalaması", projectScore, `${projects.length} proje`]
  ];
  const overviewBars = type === "daily" ? [["Günlük değerlendirme", dailyScore]]
    : type === "homework" ? [["Ödevler", homeworkScore]]
    : type === "projects" ? [["Projeler", projectScore]]
    : [["Günlük değerlendirme", dailyScore], ["Ödevler", homeworkScore], ["Projeler", projectScore]];

  studentEls.reportContent.innerHTML = `
    <div class="student-report-kpis">${metricCards.map(([label, value, note]) => `<article><span>${label}</span><strong>${value == null ? "—" : value}</strong><small>${note}</small></article>`).join("")}</div>
    <div class="student-report-grid">
      <article class="student-report-card student-report-overview"><div class="student-report-card-head"><div><span>BAŞARI ÖZETİ</span><h2>Genel performans</h2></div><div class="student-report-donut" style="--value:${overall || 0}"><strong>${overall == null ? "—" : overall}</strong><small>/ 100</small></div></div>${overviewBars.map(([label, score]) => reportBar(label, score)).join("")}</article>
      ${(type === "all" || type === "daily") ? `<article class="student-report-card"><div class="student-report-card-head"><div><span>GÜNLÜK DEĞERLENDİRME</span><h2>Ölçüt ortalamaları</h2></div></div><div class="student-report-bars">${dimensions.map(([label, score]) => reportBar(label, score)).join("")}</div></article>` : ""}
      ${(type === "all" || type === "daily") ? `<article class="student-report-card student-report-trend"><div class="student-report-card-head"><div><span>ZAMAN EĞİLİMİ</span><h2>Son değerlendirmeler</h2></div></div>${trend.length ? `<div class="student-report-columns">${trend.map(([date, value]) => `<div><span style="height:${Math.max(4, value)}%"><i>${value}</i></span><small>${html(date.slice(5).split("-").reverse().join("."))}</small></div>`).join("")}</div>` : `<div class="student-report-empty">Henüz günlük değerlendirme yok.</div>`}</article>` : ""}
      <article class="student-report-card student-report-ranking"><div class="student-report-card-head"><div><span>ÖĞRENCİ ANALİZİ</span><h2>Başarı sıralaması</h2></div><small>${studentRows.length} öğrenci</small></div>${studentRows.length ? `<div class="student-report-table"><div class="student-report-table-head"><span>Öğrenci</span><span>Günlük</span><span>Ödev</span><span>Proje</span><span>Genel</span></div>${studentRows.map(({ student, score, daily, homework: hw, project: pr }, index) => `<div class="student-report-table-row"><span><i>${index + 1}</i><strong>${html(student.name)}</strong><small>${html(classById(student.classId)?.name || "")}</small></span><span>${daily ?? "—"}</span><span>${hw ?? "—"}</span><span>${pr ?? "—"}</span><span class="is-score">${score ?? "—"}</span></div>`).join("")}</div>` : `<div class="student-report-empty">Seçili kapsamda öğrenci bulunamadı.</div>`}</article>
    </div>`;
}

function printDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function buildPrintableStudentReport() {
  const classId = studentEls.reportClass?.value || "";
  const lessonId = studentEls.reportLesson?.value || "";
  const type = studentEls.reportType?.value || "all";
  const startDate = type === "all" || type === "daily" ? studentEls.reportStart?.value || "" : "";
  const endDate = type === "all" || type === "daily" ? studentEls.reportEnd?.value || "" : "";
  const taskKey = studentEls.reportTask?.value || "";
  const [taskKind, taskId] = taskKey ? taskKey.split(":") : ["", ""];
  const students = studentState.students.filter((student) => !classId || student.classId === classId);
  const studentIds = new Set(students.map((student) => student.id));
  const routine = studentState.routine.filter((item) => studentIds.has(item.studentId) && (!classId || item.classId === classId) && (!lessonId || item.lessonId === lessonId) && (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate));
  const homework = studentState.homework.filter((item) => (!classId || item.classId === classId) && (!lessonId || item.lessonId === lessonId) && (!taskKey || (taskKind === "homework" && item.id === taskId)));
  const projects = studentState.projects.filter((item) => (!classId || item.classId === classId) && (!lessonId || item.lessonId === lessonId) && (!taskKey || (taskKind === "projects" && item.id === taskId)));
  const typeLabels = { all: "Tüm Değerlendirmeler", daily: "Günlük Değerlendirme", homework: "Ödev Değerlendirmesi", projects: "Proje Değerlendirmesi" };
  const selectedTask = taskKey ? [...studentState.homework.map((item) => ({ ...item, kind: "homework" })), ...studentState.projects.map((item) => ({ ...item, kind: "projects" }))].find((item) => item.kind === taskKind && item.id === taskId) : null;
  const reportMeta = [
    ["Sınıf", classById(classId)?.name || "Tüm sınıflar"],
    ["Ders", lessonById(lessonId)?.name || "Tüm dersler"],
    ["Rapor", typeLabels[type]],
    ["Tarih aralığı", startDate || endDate ? `${printDate(startDate)} – ${printDate(endDate)}` : "Tüm tarihler"],
    ["Konu", selectedTask?.title || "Tüm ödev / proje konuları"]
  ];

  const dailyRows = students.map((student) => {
    const records = routine.filter((item) => item.studentId === student.id);
    const attendance = averageOf(records.map((item) => evaluationScore(item.attendance)));
    const prepared = averageOf(records.map((item) => evaluationScore(item.prepared)));
    const notes = averageOf(records.map((item) => evaluationScore(item.notes)));
    const dress = averageOf(records.map((item) => evaluationScore(item.dress)));
    return { student, count: records.length, attendance, prepared, notes, dress, overall: averageOf([attendance, prepared, notes, dress]) };
  }).filter((row) => row.count > 0);
  const dailySection = (type === "all" || type === "daily") ? `<section class="report-section"><h2>Günlük Değerlendirme</h2><p class="section-note">${routine.length} kayıt · ${dailyRows.length} öğrenci · Genel ortalama: ${averageOf(routine.map(routineAverage)) ?? "—"}</p><table><thead><tr><th>No</th><th>Öğrenci</th><th>Sınıf</th><th>Kayıt</th><th>Katılım</th><th>Hazırlık</th><th>Not Alma</th><th>Davranış</th><th>Ortalama</th></tr></thead><tbody>${dailyRows.length ? dailyRows.map(({ student, count, attendance, prepared, notes, dress, overall }) => `<tr><td>${html(student.no || "—")}</td><td class="name">${html(student.name)}</td><td>${html(classById(student.classId)?.name || "—")}</td><td>${count}</td><td>${attendance ?? "—"}</td><td>${prepared ?? "—"}</td><td>${notes ?? "—"}</td><td>${dress ?? "—"}</td><td class="score">${overall ?? "—"}</td></tr>`).join("") : `<tr><td colspan="9">Seçili tarih aralığında değerlendirme bulunamadı.</td></tr>`}</tbody></table></section>` : "";

  function taskPrintSection(kind, items, heading) {
    if (!items.length) return `<section class="report-section"><h2>${heading}</h2><p class="empty-print">Seçili kapsamda kayıt bulunamadı.</p></section>`;
    return `<section class="report-section"><h2>${heading}</h2>${items.map((item) => {
      const rows = studentsForClass(item.classId).map((student) => ({ student, score: taskScore(item, student.id) }));
      const average = averageOf(rows.map((row) => row.score));
      return `<article class="task-block"><div class="task-heading"><div><strong>${html(item.title)}</strong><small>${html(classById(item.classId)?.name || "—")} · ${html(lessonById(item.lessonId)?.name || "—")} · Teslim: ${printDate(item.due)}</small></div><span>Ortalama ${average ?? "—"}</span></div><table><thead><tr><th>No</th><th>Öğrenci</th><th>Puan</th><th>Yapılma derecesi</th></tr></thead><tbody>${rows.map(({ student, score }) => `<tr><td>${html(student.no || "—")}</td><td class="name">${html(student.name)}</td><td class="score">${score}</td><td>${html(taskScoreLabel(score))}</td></tr>`).join("")}</tbody></table></article>`;
    }).join("")}</section>`;
  }

  const homeworkSection = (type === "all" || type === "homework") ? taskPrintSection("homework", homework, "Ödev Değerlendirmesi") : "";
  const projectSection = (type === "all" || type === "projects") ? taskPrintSection("projects", projects, "Proje Değerlendirmesi") : "";
  const now = new Date().toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" });
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${html(typeLabels[type])} Raporu</title><style>
    @page { size: A4 landscape; margin: 11mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #172b29; background: #eef2f1; font: 11px/1.35 "Segoe UI", Arial, sans-serif; }
    .toolbar { position: sticky; top: 0; z-index: 5; display: flex; justify-content: flex-end; gap: 8px; padding: 10px 18px; background: #132f2c; }
    .toolbar button { min-height: 36px; padding: 0 18px; color: #fff; background: #168879; border: 0; border-radius: 8px; font-weight: 800; cursor: pointer; }
    .toolbar button:last-child { background: rgba(255,255,255,.12); }
    .sheet { width: 275mm; min-height: 188mm; margin: 10mm auto; padding: 10mm; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.12); }
    .report-head { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 6mm; border-bottom: 2px solid #183f3a; }
    h1 { margin: 0 0 4px; font-size: 20px; } .report-head p { margin: 0; color: #61736f; }
    .date { color: #61736f; text-align: right; }
    .meta { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 7px; margin: 5mm 0; }
    .meta div { padding: 8px; background: #f3f7f6; border: 1px solid #dce7e4; border-radius: 6px; }
    .meta span,.meta strong { display: block; } .meta span { margin-bottom: 3px; color: #687b77; font-size: 9px; } .meta strong { font-size: 10px; }
    .report-section { margin-top: 6mm; break-inside: auto; } h2 { margin: 0 0 2mm; color: #176258; font-size: 14px; }
    .section-note { margin: 0 0 3mm; color: #61736f; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: auto; } tr { break-inside: avoid; }
    th,td { padding: 5px 6px; text-align: center; border: 1px solid #cedbd8; } th { color: #173b38; background: #e7f2ef; font-size: 9px; } td { font-size: 9px; }
    td.name { text-align: left; font-weight: 700; } td.score { color: #176258; font-weight: 900; }
    .task-block { margin: 0 0 5mm; break-inside: avoid; } .task-heading { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 7px 9px; background: #f3f7f6; border: 1px solid #dce7e4; border-bottom: 0; }
    .task-heading strong,.task-heading small { display: block; } .task-heading small { margin-top: 2px; color: #6b7c78; } .task-heading > span { color: #176258; font-weight: 900; }
    .empty-print { padding: 10px; color: #687b77; background: #f3f7f6; }
    @media print { body { background: #fff; } .toolbar { display: none; } .sheet { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; } }
  </style></head><body><div class="toolbar"><button onclick="window.print()">Yazdır / PDF Kaydet</button><button onclick="window.close()">Kapat</button></div><main class="sheet"><header class="report-head"><div><h1>${html(typeLabels[type])} Raporu</h1><p>Öğrenci Takip Modülü</p></div><div class="date">Oluşturulma tarihi<br><strong>${html(now)}</strong></div></header><section class="meta">${reportMeta.map(([label, value]) => `<div><span>${html(label)}</span><strong>${html(value)}</strong></div>`).join("")}</section>${dailySection}${homeworkSection}${projectSection}</main></body></html>`;
}

function openPrintableStudentReport() {
  if (studentEls.reportStart?.value && studentEls.reportEnd?.value && studentEls.reportStart.value > studentEls.reportEnd.value) {
    return toast("Başlangıç tarihi bitiş tarihinden sonra olamaz.", "warning");
  }
  const reportWindow = window.open("", "_blank", "width=1280,height=860");
  if (!reportWindow) return toast("Rapor önizlemesi için açılır pencereye izin verin.", "warning");
  reportWindow.document.open();
  reportWindow.document.write(buildPrintableStudentReport());
  reportWindow.document.close();
  reportWindow.focus();
}

function renderStudentModule() {
  renderSelects();
  renderFlow();
  renderStats();
  renderClasses();
  renderLessons();
  renderStudents();
  renderRoutine();
  renderTasks("homework");
  renderTasks("projects");
  renderReports();
}

function clearClassForm() {
  studentEls.classId.value = "";
  studentEls.className.value = "";
  studentEls.classNote.value = "";
}

function clearLessonForm() {
  studentEls.lessonId.value = "";
  studentEls.lessonName.value = "";
  studentEls.lessonHours.value = "2";
}

function clearStudentForm() {
  studentEls.studentId.value = "";
  studentEls.studentNo.value = "";
  studentEls.studentName.value = "";
}

function clearTaskForm(kind) {
  const prefix = kind === "homework" ? "homework" : "project";
  studentEls[`${prefix}Id`].value = "";
  studentEls[`${prefix}Title`].value = "";
  studentEls[`${prefix}Due`].value = "";
}

function saveClass(event) {
  event.preventDefault();
  const name = studentEls.className.value.trim();
  if (!name) return toast("Sınıf adı girin.", "warning");
  const id = studentEls.classId.value || studentUid("class");
  const record = { id, name, note: studentEls.classNote.value.trim() };
  studentState.classes = studentState.classes.some((item) => item.id === id) ? studentState.classes.map((item) => item.id === id ? record : item) : [...studentState.classes, record];
  saveStudentState();
  clearClassForm();
  renderStudentModule();
  toast("Sınıf kaydedildi.");
}

function saveLesson(event) {
  event.preventDefault();
  const classId = studentEls.lessonClass.value;
  const name = studentEls.lessonName.value.trim();
  if (!classId || !name) return toast("Sınıf ve ders adı girin.", "warning");
  const id = studentEls.lessonId.value || studentUid("lesson");
  const record = { id, classId, name, hours: Math.max(1, Number(studentEls.lessonHours.value || 1)) };
  studentState.lessons = studentState.lessons.some((item) => item.id === id) ? studentState.lessons.map((item) => item.id === id ? record : item) : [...studentState.lessons, record];
  saveStudentState();
  clearLessonForm();
  renderStudentModule();
  toast("Ders sınıfa atandı.");
}

function saveStudent(event) {
  event.preventDefault();
  const classId = studentEls.studentClass.value;
  const name = studentEls.studentName.value.trim();
  if (!classId || !name) return toast("Sınıf ve öğrenci adı girin.", "warning");
  const id = studentEls.studentId.value || studentUid("student");
  const record = { id, classId, name, no: studentEls.studentNo.value.trim() };
  studentState.students = studentState.students.some((item) => item.id === id) ? studentState.students.map((item) => item.id === id ? record : item) : [...studentState.students, record];
  saveStudentState();
  clearStudentForm();
  renderStudentModule();
  toast("Öğrenci kaydedildi.");
}

function importStudents() {
  const classId = studentEls.studentClass.value;
  if (!classId) return toast("Önce sınıf seçin.", "warning");
  const rows = (studentEls.importText.value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed = rows.map((line) => {
    const parts = line.split(/\t|;|,/).map((part) => part.trim()).filter(Boolean);
    const tokens = parts.length > 1 ? parts : line.split(/\s+/);
    const hasNo = /^\d+$/.test(tokens[0] || "");
    return { id: studentUid("student"), classId, no: hasNo ? tokens[0] : "", name: (hasNo ? tokens.slice(1) : tokens).join(" ").trim() };
  }).filter((item) => item.name);
  const keys = new Set(studentState.students.map((item) => `${item.classId}|${item.no}|${item.name.toLocaleLowerCase("tr-TR")}`));
  const fresh = parsed.filter((item) => !keys.has(`${item.classId}|${item.no}|${item.name.toLocaleLowerCase("tr-TR")}`));
  studentState.students.push(...fresh);
  studentEls.importText.value = "";
  saveStudentState();
  renderStudentModule();
  toast(`${fresh.length} öğrenci aktarıldı.`);
}

function saveRoutine() {
  const classId = studentEls.routineClass.value;
  const lessonId = studentEls.routineLesson.value;
  const date = studentEls.routineDate.value || todayIso();
  if (!classId || !lessonId) return toast("Sınıf ve ders seçin.", "warning");
  const rows = [...studentEls.routineList.querySelectorAll("[data-student-routine]")];
  if (!rows.length) return toast("Değerlendirilecek öğrenci bulunamadı.", "warning");
  rows.forEach((row) => {
    const studentId = row.dataset.studentRoutine;
    const values = Object.fromEntries([...row.querySelectorAll("[data-routine-field]")].map((select) => [select.dataset.routineField, Number(select.value)]));
    const old = studentState.routine.find((item) => item.studentId === studentId && item.date === date && item.lessonId === lessonId);
    const record = { id: old?.id || studentUid("routine"), classId, lessonId, studentId, date, ...values };
    studentState.routine = studentState.routine.filter((item) => !(item.studentId === studentId && item.date === date && item.lessonId === lessonId));
    studentState.routine.push(record);
  });
  saveStudentState();
  renderStudentModule();
  toast(`${rows.length} öğrenci için değerlendirme kaydedildi.`);
}

function saveTask(kind, event) {
  event.preventDefault();
  const prefix = kind === "homework" ? "homework" : "project";
  const id = studentEls[`${prefix}Id`].value || studentUid(kind);
  const old = studentState[kind].find((item) => item.id === id);
  const record = {
    id,
    classId: studentEls[`${prefix}Class`].value,
    lessonId: studentEls[`${prefix}Lesson`].value,
    title: studentEls[`${prefix}Title`].value.trim(),
    due: studentEls[`${prefix}Due`].value,
    scores: old?.scores || {}
  };
  if (!record.classId || !record.lessonId || !record.title) return toast("Sınıf, ders ve başlık girin.", "warning");
  studentState[kind] = studentState[kind].some((item) => item.id === id) ? studentState[kind].map((item) => item.id === id ? record : item) : [record, ...studentState[kind]];
  saveStudentState();
  clearTaskForm(kind);
  renderStudentModule();
  toast(`${kind === "homework" ? "Ödev" : "Proje"} kaydedildi.`);
}

function fillTaskForm(kind, id) {
  const prefix = kind === "homework" ? "homework" : "project";
  const item = studentState[kind].find((entry) => entry.id === id);
  if (!item) return;
  studentEls[`${prefix}Id`].value = item.id;
  studentEls[`${prefix}Class`].value = item.classId;
  syncLessonSelect(studentEls[`${prefix}Class`], studentEls[`${prefix}Lesson`]);
  studentEls[`${prefix}Lesson`].value = item.lessonId;
  studentEls[`${prefix}Title`].value = item.title;
  studentEls[`${prefix}Due`].value = item.due || "";
  studentEls[`${prefix}Title`].focus();
}

function handleListClick(event) {
  const open = event.target.closest("[data-open-class-view]");
  if (open) {
    const target = open.dataset.openClassView;
    const classId = open.dataset.classId;
    const select = target === "students" ? studentEls.studentClass : target === "lessons" ? studentEls.lessonClass : studentEls.routineClass;
    if (select) select.value = classId;
    setStudentView(target);
    return;
  }
  const actions = ["class", "lesson", "student", "homework", "project"];
  for (const action of actions) {
    const editId = event.target.closest(`[data-edit-${action}]`)?.dataset[`edit${action[0].toUpperCase()}${action.slice(1)}`];
    const deleteId = event.target.closest(`[data-delete-${action}]`)?.dataset[`delete${action[0].toUpperCase()}${action.slice(1)}`];
    if (editId) {
      if (action === "class") {
        const item = classById(editId); studentEls.classId.value = item.id; studentEls.className.value = item.name; studentEls.classNote.value = item.note || ""; studentEls.className.focus();
      } else if (action === "lesson") {
        const item = lessonById(editId); studentEls.lessonId.value = item.id; studentEls.lessonClass.value = item.classId; studentEls.lessonName.value = item.name; studentEls.lessonHours.value = item.hours || 2; studentEls.lessonName.focus();
      } else if (action === "student") {
        const item = studentState.students.find((entry) => entry.id === editId); studentEls.studentId.value = item.id; studentEls.studentClass.value = item.classId; studentEls.studentNo.value = item.no || ""; studentEls.studentName.value = item.name; studentEls.studentName.focus();
      } else fillTaskForm(action === "project" ? "projects" : "homework", editId);
      return;
    }
    if (deleteId) {
      if (action === "class") {
        studentState.classes = studentState.classes.filter((item) => item.id !== deleteId);
        studentState.lessons = studentState.lessons.filter((item) => item.classId !== deleteId);
        studentState.students = studentState.students.filter((item) => item.classId !== deleteId);
        studentState.routine = studentState.routine.filter((item) => item.classId !== deleteId);
        studentState.homework = studentState.homework.filter((item) => item.classId !== deleteId);
        studentState.projects = studentState.projects.filter((item) => item.classId !== deleteId);
      } else if (action === "lesson") {
        studentState.lessons = studentState.lessons.filter((item) => item.id !== deleteId);
        studentState.routine = studentState.routine.filter((item) => item.lessonId !== deleteId);
        studentState.homework = studentState.homework.filter((item) => item.lessonId !== deleteId);
        studentState.projects = studentState.projects.filter((item) => item.lessonId !== deleteId);
      } else if (action === "student") {
        studentState.students = studentState.students.filter((item) => item.id !== deleteId);
        studentState.routine = studentState.routine.filter((item) => item.studentId !== deleteId);
        ["homework", "projects"].forEach((kind) => {
          studentState[kind] = studentState[kind].map((item) => {
            if (!Object.prototype.hasOwnProperty.call(item.scores || {}, deleteId)) return item;
            const scores = { ...item.scores };
            delete scores[deleteId];
            return { ...item, scores };
          });
        });
      } else studentState[action === "project" ? "projects" : "homework"] = studentState[action === "project" ? "projects" : "homework"].filter((item) => item.id !== deleteId);
      saveStudentState(); renderStudentModule(); toast("Kayıt silindi."); return;
    }
  }
}

function handleTaskScore(event, persist = false) {
  const slider = event.target.closest("[data-task-score]");
  if (!slider) return;
  const item = studentState[slider.dataset.kind]?.find((entry) => entry.id === slider.dataset.taskId);
  if (!item) return;
  const score = evaluationScore(slider.value);
  item.scores = { ...(item.scores || {}), [slider.dataset.studentId]: score };
  slider.style.setProperty("--score", `${score}%`);
  const row = slider.closest(".student-task-student");
  const output = row?.querySelector("[data-task-score-output]");
  const label = row?.querySelector("[data-task-score-label]");
  if (output) output.textContent = score;
  if (label) label.textContent = taskScoreLabel(score);
  const card = slider.closest(".student-task-card");
  if (card) {
    const students = studentsForClass(item.classId);
    const average = students.length ? Math.round(students.reduce((sum, student) => sum + taskScore(item, student.id), 0) / students.length) : 0;
    const progress = card.querySelector(".student-task-progress");
    if (progress) progress.textContent = `${average}%`;
  }
  if (persist) {
    saveStudentState();
    renderStats();
    renderReports();
  }
}

function bindStudentEvents() {
  studentEls.navButtons.forEach((button) => button.addEventListener("click", () => setStudentView(button.dataset.studentView)));
  studentEls.mobileNav?.addEventListener("change", (event) => setStudentView(event.target.value));
  studentEls.quickButtons.forEach((button) => button.addEventListener("click", () => setStudentView(button.dataset.studentTarget)));
  studentEls.flowCard?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-student-target]");
    if (button) setStudentView(button.dataset.studentTarget);
  });
  studentEls.moduleSwitch?.addEventListener("click", () => studentCallbacks.returnToModuleHub?.());
  studentEls.classForm?.addEventListener("submit", saveClass);
  studentEls.lessonForm?.addEventListener("submit", saveLesson);
  studentEls.studentForm?.addEventListener("submit", saveStudent);
  studentEls.homeworkForm?.addEventListener("submit", (event) => saveTask("homework", event));
  studentEls.projectForm?.addEventListener("submit", (event) => saveTask("projects", event));
  studentEls.clearClass?.addEventListener("click", clearClassForm);
  studentEls.clearLesson?.addEventListener("click", clearLessonForm);
  studentEls.clearStudent?.addEventListener("click", clearStudentForm);
  studentEls.clearHomework?.addEventListener("click", () => clearTaskForm("homework"));
  studentEls.clearProject?.addEventListener("click", () => clearTaskForm("projects"));
  studentEls.importBtn?.addEventListener("click", importStudents);
  studentEls.saveRoutine?.addEventListener("click", saveRoutine);
  studentEls.routineList?.addEventListener("input", (event) => {
    const slider = event.target.closest("[data-routine-field]");
    if (!slider) return;
    const value = evaluationScore(slider.value);
    slider.style.setProperty("--score", `${value}%`);
    const output = slider.closest(".student-evaluation-field")?.querySelector(`[data-routine-output="${slider.dataset.routineField}"]`);
    if (output) output.textContent = value;
  });
  studentEls.studentClass?.addEventListener("change", renderStudents);
  studentEls.lessonClass?.addEventListener("change", renderLessons);
  [studentEls.routineClass, studentEls.routineLesson, studentEls.routineDate].forEach((select) => select?.addEventListener("change", renderRoutine));
  [studentEls.homeworkClass, studentEls.projectClass].forEach((select) => select?.addEventListener("change", () => {
    syncLessonSelect(select, select === studentEls.homeworkClass ? studentEls.homeworkLesson : studentEls.projectLesson);
  }));
  studentEls.reportClass?.addEventListener("change", () => {
    const lessons = studentEls.reportClass.value ? lessonsForClass(studentEls.reportClass.value) : studentState.lessons;
    fillSelect(studentEls.reportLesson, lessons, "Tüm dersler");
    syncReportTaskSelect();
    renderReports();
  });
  studentEls.reportLesson?.addEventListener("change", () => { syncReportTaskSelect(); renderReports(); });
  studentEls.reportType?.addEventListener("change", () => { syncReportTaskSelect(); renderReports(); });
  studentEls.reportTask?.addEventListener("change", renderReports);
  studentEls.reportStart?.addEventListener("change", renderReports);
  studentEls.reportEnd?.addEventListener("change", renderReports);
  studentEls.reportPrint?.addEventListener("click", openPrintableStudentReport);
  [studentEls.classList, studentEls.lessonList, studentEls.studentList, studentEls.homeworkList, studentEls.projectList].forEach((list) => list?.addEventListener("click", handleListClick));
  [studentEls.homeworkList, studentEls.projectList].forEach((list) => {
    list?.addEventListener("input", (event) => handleTaskScore(event));
    list?.addEventListener("change", (event) => handleTaskScore(event, true));
  });
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
