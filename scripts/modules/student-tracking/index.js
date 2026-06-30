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
  studentNavMobileSelect: document.querySelector("#studentNavMobileSelect"),
  quickButtons: document.querySelectorAll("[data-student-target]"),
  panels: document.querySelectorAll("[data-student-panel]"),
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
  clearProject: document.querySelector("#studentClearProjectBtn")
};

let studentState = loadStudentState();
let studentCallbacks = {
  returnToModuleHub: typeof returnToModuleHub === "function" ? returnToModuleHub : null
};

function loadStudentState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STUDENT_TRACKING_KEY) || "{}");
    return {
      ...studentDefaults,
      ...parsed,
      classes: Array.isArray(parsed.classes) ? parsed.classes : [],
      lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
      students: Array.isArray(parsed.students) ? parsed.students : [],
      routine: Array.isArray(parsed.routine) ? parsed.routine : [],
      homework: Array.isArray(parsed.homework) ? parsed.homework : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : []
    };
  } catch {
    return { ...studentDefaults };
  }
}

function saveStudentState() {
  localStorage.setItem(STUDENT_TRACKING_KEY, JSON.stringify(studentState));
  if (window.scheduleCloudSave) window.scheduleCloudSave();
}

function studentUid(prefix) {
  if (typeof uid === "function") return uid(prefix);
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function html(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value);
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function toast(message, type = "info") {
  if (typeof showToast === "function") showToast(message, type);
}

function classById(id) {
  return studentState.classes.find((item) => item.id === id);
}

function lessonById(id) {
  return studentState.lessons.find((item) => item.id === id);
}

function studentsForClass(classId) {
  return studentState.students.filter((student) => student.classId === classId);
}

function lessonsForClass(classId) {
  return studentState.lessons.filter((lesson) => lesson.classId === classId);
}

function optionHtml(items, emptyText = "Seçiniz") {
  return `<option value="">${html(emptyText)}</option>${items.map((item) => `<option value="${html(item.id)}">${html(item.name)}</option>`).join("")}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentSchoolYear() {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

function addDays(isoDate, dayCount) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + dayCount);
  return date.toISOString().slice(0, 10);
}

function weekRange(startDate, weekIndex) {
  const start = addDays(startDate, weekIndex * 7);
  return { start, end: addDays(start, 4) };
}

function isDateInWeek(dateIso, week) {
  return dateIso && dateIso >= week.start && dateIso <= week.end;
}

function setStudentView(view) {
  studentState.activeView = view;
  saveStudentState();
  studentEls.navButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.studentView === view));
  if (studentEls.studentNavMobileSelect) {
    studentEls.studentNavMobileSelect.value = view;
  }
  studentEls.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.studentPanel === view));
  const titles = {
    dashboard: ["Ders ve Öğrenci Takibi", "Sınıf, ders, rutin takip, ödev ve proje kayıtları"],
    classes: ["Sınıflar", "Sınıf bilgilerini tanımlayın ve düzenleyin"],
    lessons: ["Dersler", "Her sınıfa işlenecek dersleri atayın"],
    students: ["Öğrenciler", "Manuel kayıt veya e-okuldan kopyalanan liste aktarımı"],
    routine: ["Ders İçi Takip", "Katılım, hazırlık, not alma ve kılık kıyafet değerlendirmesi"],
    homework: ["Ödev Takibi", "Sınıf ve ders bazlı ödev kayıtları"],
    projects: ["Proje Takibi", "Proje görevleri ve teslim tarihleri"],
    reports: ["Raporlar", "Rapor çıktıları sonraki adımda şekillendirilecek"]
  };
  const [title, subtitle] = titles[view] || titles.dashboard;
  if (studentEls.title) studentEls.title.textContent = title;
  if (studentEls.subtitle) studentEls.subtitle.textContent = subtitle;
  renderStudentModule();
}

function renderStudentStats() {
  if (!studentEls.statGrid) return;
  const todayRecords = studentState.routine.filter((item) => item.date === todayIso()).length;
  studentEls.statGrid.innerHTML = [
    ["Sınıf", studentState.classes.length, "Tanımlı sınıf"],
    ["Ders", studentState.lessons.length, "Sınıflara atanmış"],
    ["Öğrenci", studentState.students.length, "Aktif kayıt"],
    ["Bugün takip", todayRecords, "Ders içi kayıt"],
    ["Ödev / Proje", studentState.homework.length + studentState.projects.length, "Açık iş"]
  ].map(([label, value, note]) => `
    <article class="student-stat-card">
      <span>${html(label)}</span>
      <strong>${html(value)}</strong>
      <small>${html(note)}</small>
    </article>
  `).join("");
}

function renderStudentSelects() {
  const classOptions = optionHtml(studentState.classes, "Sınıf seçiniz");
  [studentEls.lessonClass, studentEls.studentClass, studentEls.routineClass, studentEls.homeworkClass, studentEls.projectClass]
    .forEach((select) => {
      if (!select) return;
      const previous = select.value;
      select.innerHTML = classOptions;
      if ([...select.options].some((option) => option.value === previous)) select.value = previous;
    });
  if (studentEls.routineDate && !studentEls.routineDate.value) studentEls.routineDate.value = todayIso();
  syncLessonSelect(studentEls.routineClass, studentEls.routineLesson);
  syncLessonSelect(studentEls.homeworkClass, studentEls.homeworkLesson);
  syncLessonSelect(studentEls.projectClass, studentEls.projectLesson);
}

function syncLessonSelect(classSelect, lessonSelect) {
  if (!lessonSelect) return;
  const classId = classSelect?.value || "";
  const previous = lessonSelect.value;
  lessonSelect.innerHTML = optionHtml(classId ? lessonsForClass(classId) : studentState.lessons, "Ders seçiniz");
  if ([...lessonSelect.options].some((option) => option.value === previous)) lessonSelect.value = previous;
}

function renderClasses() {
  if (!studentEls.classList) return;
  if (!studentState.classes.length) {
    studentEls.classList.innerHTML = `<div class="student-empty">Henüz sınıf eklenmedi.</div>`;
    return;
  }
  studentEls.classList.innerHTML = studentState.classes.map((item) => {
    const lessonCount = lessonsForClass(item.id).length;
    const studentCount = studentsForClass(item.id).length;
    return `
      <article class="student-item-card">
        <div><strong>${html(item.name)}</strong><small>${html(item.note || "Açıklama yok")}</small></div>
        <div class="student-card-meta"><span>${lessonCount} ders</span><span>${studentCount} öğrenci</span></div>
        <div class="student-card-actions">
          <button type="button" data-edit-class="${html(item.id)}">Düzenle</button>
          <button type="button" data-delete-class="${html(item.id)}">Sil</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderLessons() {
  if (!studentEls.lessonList) return;
  if (!studentState.lessons.length) {
    studentEls.lessonList.innerHTML = `<div class="student-empty">Henüz ders atanmadı.</div>`;
    return;
  }
  studentEls.lessonList.innerHTML = studentState.lessons.map((item) => `
    <article class="student-item-card">
      <div><strong>${html(item.name)}</strong><small>${html(classById(item.classId)?.name || "Sınıf yok")} · ${html(item.hours || 0)} saat</small></div>
      <div class="student-card-actions">
        <button type="button" data-edit-lesson="${html(item.id)}">Düzenle</button>
        <button type="button" data-delete-lesson="${html(item.id)}">Sil</button>
      </div>
    </article>
  `).join("");
}

function renderStudents() {
  if (!studentEls.studentList) return;
  if (!studentState.students.length) {
    studentEls.studentList.innerHTML = `<div class="student-empty">Henüz öğrenci eklenmedi.</div>`;
    return;
  }
  studentEls.studentList.innerHTML = studentState.students.map((item) => `
    <article class="student-item-card">
      <div><strong>${html(item.name)}</strong><small>${html(classById(item.classId)?.name || "Sınıf yok")} ${item.no ? `· No: ${html(item.no)}` : ""}</small></div>
      <div class="student-card-actions">
        <button type="button" data-edit-student="${html(item.id)}">Düzenle</button>
        <button type="button" data-delete-student="${html(item.id)}">Sil</button>
      </div>
    </article>
  `).join("");
}

function renderRoutine() {
  if (!studentEls.routineList) return;
  syncLessonSelect(studentEls.routineClass, studentEls.routineLesson);
  const classId = studentEls.routineClass?.value || studentState.classes[0]?.id || "";
  if (studentEls.routineClass && !studentEls.routineClass.value && classId) studentEls.routineClass.value = classId;
  const students = studentsForClass(studentEls.routineClass?.value || classId);
  if (!students.length) {
    studentEls.routineList.innerHTML = `<div class="student-empty">Bu sınıfta öğrenci yok.</div>`;
    return;
  }
  const date = studentEls.routineDate?.value || todayIso();
  const lessonId = studentEls.routineLesson?.value || "";
  studentEls.routineList.innerHTML = students.map((student) => {
    const existing = studentState.routine.find((item) => item.studentId === student.id && item.date === date && item.lessonId === lessonId) || {};
    return `
      <article class="student-routine-row" data-student-routine="${html(student.id)}">
        <div><strong>${html(student.name)}</strong><small>${html(student.no || "")}</small></div>
        ${routineSlider("attendance", existing.attendance)}
        ${routineSlider("prepared", existing.prepared)}
        ${routineSlider("notes", existing.notes)}
        ${routineSlider("dress", existing.dress)}
      </article>
    `;
  }).join("");
}

function routineScore(value) {
  if (value === "ok") return 85;
  if (value === "warn") return 55;
  if (value === "bad") return 20;
  const score = Number(value);
  if (!Number.isFinite(score)) return 85;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function routineSlider(key, value = 85) {
  const labels = {
    attendance: "Katılım",
    prepared: "Hazırlık",
    notes: "Not alma",
    dress: "Kılık kıyafet"
  };
  const score = routineScore(value);
  return `
    <label class="student-routine-score">
      <span class="student-slider-heading">
        <span>${labels[key]}</span>
        <output data-routine-output="${key}">${score}</output>
      </span>
      <input type="range" min="0" max="100" step="1" value="${score}" data-routine-field="${key}">
    </label>
  `;
}

function renderTasks(kind) {
  const isHomework = kind === "homework";
  const list = isHomework ? studentEls.homeworkList : studentEls.projectList;
  const items = isHomework ? studentState.homework : studentState.projects;
  const actionName = isHomework ? "homework" : "project";
  if (!list) return;
  if (!items.length) {
    list.innerHTML = `<div class="student-empty">Henüz kayıt yok.</div>`;
    return;
  }
  list.innerHTML = items.map((item) => `
    <article class="student-item-card">
      <div>
        <strong>${html(item.title)}</strong>
        <small>${html(classById(item.classId)?.name || "Sınıf yok")} · ${html(lessonById(item.lessonId)?.name || "Ders yok")} · ${html(item.due || "Tarih yok")}</small>
      </div>
      <div class="student-card-actions">
        <button type="button" data-edit-${actionName}="${html(item.id)}">Düzenle</button>
        <button type="button" data-delete-${actionName}="${html(item.id)}">Sil</button>
      </div>
    </article>
  `).join("");
}

function renderStudentModule() {
  renderStudentStats();
  renderStudentSelects();
  renderClasses();
  renderLessons();
  renderStudents();
  renderRoutine();
  renderTasks("homework");
  renderTasks("projects");
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
  if (!name) return;
  const id = studentEls.classId.value || studentUid("class");
  const next = { id, name, note: studentEls.classNote.value.trim() };
  studentState.classes = studentState.classes.some((item) => item.id === id)
    ? studentState.classes.map((item) => item.id === id ? next : item)
    : [...studentState.classes, next];
  saveStudentState();
  clearClassForm();
  renderStudentModule();
}

function saveLesson(event) {
  event.preventDefault();
  const name = studentEls.lessonName.value.trim();
  const classId = studentEls.lessonClass.value || studentState.classes[0]?.id || "";
  if (!name || !classId) return toast("Ders için sınıf ve ad girin.", "warning");
  const id = studentEls.lessonId.value || studentUid("lesson");
  const next = { id, classId, name, hours: Number(studentEls.lessonHours.value || 0) };
  studentState.lessons = studentState.lessons.some((item) => item.id === id)
    ? studentState.lessons.map((item) => item.id === id ? next : item)
    : [...studentState.lessons, next];
  saveStudentState();
  clearLessonForm();
  renderStudentModule();
}

function saveStudent(event) {
  event.preventDefault();
  const name = studentEls.studentName.value.trim();
  const classId = studentEls.studentClass.value || studentState.classes[0]?.id || "";
  if (!name || !classId) return toast("Öğrenci için sınıf ve ad soyad girin.", "warning");
  const id = studentEls.studentId.value || studentUid("student");
  const next = { id, classId, name, no: studentEls.studentNo.value.trim() };
  studentState.students = studentState.students.some((item) => item.id === id)
    ? studentState.students.map((item) => item.id === id ? next : item)
    : [...studentState.students, next];
  saveStudentState();
  clearStudentForm();
  renderStudentModule();
}

function importStudents() {
  const classId = studentEls.studentClass.value || studentState.classes[0]?.id || "";
  if (!classId) return toast("Önce sınıf seçin.", "warning");
  const rows = (studentEls.importText.value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const imported = rows.map((line) => {
    const parts = line.split(/\t|;|,/).map((part) => part.trim()).filter(Boolean);
    const raw = parts.length > 1 ? parts : line.split(/\s+/);
    const hasNo = /^\d+$/.test(raw[0] || "");
    return {
      id: studentUid("student"),
      classId,
      no: hasNo ? raw[0] : "",
      name: (hasNo ? raw.slice(1) : raw).join(" ").trim()
    };
  }).filter((item) => item.name);
  const existingKeys = new Set(studentState.students.map((item) => `${item.classId}|${item.no}|${item.name.toLocaleLowerCase("tr-TR")}`));
  const fresh = imported.filter((item) => !existingKeys.has(`${item.classId}|${item.no}|${item.name.toLocaleLowerCase("tr-TR")}`));
  studentState.students = [...studentState.students, ...fresh];
  saveStudentState();
  studentEls.importText.value = "";
  renderStudentModule();
  toast(`${fresh.length} öğrenci aktarıldı.`);
}

function savePlan(event) {
  event.preventDefault();
  const classId = studentEls.planClass.value || "";
  const lessonId = studentEls.planLesson.value || "";
  const lesson = lessonById(lessonId);
  const startDate = studentEls.planStart.value || "";
  const weekCount = Number(studentEls.planWeeks.value || 36);
  const rawTopics = parsePlanTopics(studentEls.planTopics.value);
  if (!classId || !lessonId || !startDate) return toast("Sınıf, ders ve başlangıç tarihi seçin.", "warning");
  if (!rawTopics.length) return toast("Konu ve kazanım listesi girin.", "warning");
  const weeklyHours = Math.max(1, Number(lesson?.hours || 1));
  const topics = rawTopics.map((item) => ({ ...item, hours: item.hours || weeklyHours }));
  const year = studentEls.planYear.value.trim() || currentSchoolYear();
  const plan = {
    id: studentUid("plan"),
    classId,
    lessonId,
    year,
    startDate,
    weekCount: Math.min(44, Math.max(1, weekCount)),
    weeklyHours,
    topics,
    skips: parsePlanSkips(studentEls.planSkips.value),
    createdAt: new Date().toISOString()
  };
  plan.weeks = generatePlanWeeks(plan);
  studentState.plans = studentState.plans.filter((item) => !(item.classId === classId && item.lessonId === lessonId && item.year === year));
  studentState.plans.unshift(plan);
  if (studentEls.planFilterClass) studentEls.planFilterClass.value = classId;
  syncLessonSelect(studentEls.planFilterClass, studentEls.planFilterLesson);
  if (studentEls.planFilterLesson) studentEls.planFilterLesson.value = lessonId;
  saveStudentState();
  renderStudentModule();
  toast("Yıllık plan üretildi.");
}

function saveRoutine() {
  const classId = studentEls.routineClass.value || "";
  const lessonId = studentEls.routineLesson.value || "";
  const date = studentEls.routineDate.value || todayIso();
  if (!classId || !lessonId) return toast("Sınıf ve ders seçin.", "warning");
  const rows = [...studentEls.routineList.querySelectorAll("[data-student-routine]")];
  rows.forEach((row) => {
    const studentId = row.dataset.studentRoutine;
    const values = Object.fromEntries([...row.querySelectorAll("[data-routine-field]")].map((input) => [input.dataset.routineField, routineScore(input.value)]));
    const record = { id: studentUid("routine"), classId, lessonId, studentId, date, ...values };
    studentState.routine = studentState.routine.filter((item) => !(item.studentId === studentId && item.date === date && item.lessonId === lessonId));
    studentState.routine.push(record);
  });
  saveStudentState();
  renderStudentModule();
  toast("Ders içi takip kaydedildi.");
}

function saveTask(kind, event) {
  event.preventDefault();
  const prefix = kind === "homework" ? "homework" : "project";
  const title = studentEls[`${prefix}Title`].value.trim();
  const classId = studentEls[`${prefix}Class`].value || "";
  const lessonId = studentEls[`${prefix}Lesson`].value || "";
  if (!title || !classId || !lessonId) return toast("Sınıf, ders ve başlık girin.", "warning");
  const id = studentEls[`${prefix}Id`].value || studentUid(kind);
  const next = { id, classId, lessonId, title, due: studentEls[`${prefix}Due`].value || "" };
  studentState[kind] = studentState[kind].some((item) => item.id === id)
    ? studentState[kind].map((item) => item.id === id ? next : item)
    : [...studentState[kind], next];
  saveStudentState();
  clearTaskForm(kind);
  renderStudentModule();
}

function handleListClick(event) {
  const editClass = event.target.closest("[data-edit-class]")?.dataset.editClass;
  const deleteClass = event.target.closest("[data-delete-class]")?.dataset.deleteClass;
  const editLesson = event.target.closest("[data-edit-lesson]")?.dataset.editLesson;
  const deleteLesson = event.target.closest("[data-delete-lesson]")?.dataset.deleteLesson;
  const editStudent = event.target.closest("[data-edit-student]")?.dataset.editStudent;
  const deleteStudent = event.target.closest("[data-delete-student]")?.dataset.deleteStudent;
  const editHomework = event.target.closest("[data-edit-homework]")?.dataset.editHomework;
  const deleteHomework = event.target.closest("[data-delete-homework]")?.dataset.deleteHomework;
  const editProject = event.target.closest("[data-edit-project]")?.dataset.editProject;
  const deleteProject = event.target.closest("[data-delete-project]")?.dataset.deleteProject;
  const deletePlan = event.target.closest("[data-delete-plan]")?.dataset.deletePlan;
  if (editClass) {
    const item = classById(editClass);
    studentEls.classId.value = item.id;
    studentEls.className.value = item.name;
    studentEls.classNote.value = item.note || "";
  }
  if (deleteClass) {
    studentState.classes = studentState.classes.filter((item) => item.id !== deleteClass);
    studentState.lessons = studentState.lessons.filter((item) => item.classId !== deleteClass);
    studentState.students = studentState.students.filter((item) => item.classId !== deleteClass);
    studentState.plans = studentState.plans.filter((item) => item.classId !== deleteClass);
  }
  if (editLesson) {
    const item = lessonById(editLesson);
    studentEls.lessonId.value = item.id;
    studentEls.lessonClass.value = item.classId;
    studentEls.lessonName.value = item.name;
    studentEls.lessonHours.value = item.hours || 2;
  }
  if (deleteLesson) {
    studentState.lessons = studentState.lessons.filter((item) => item.id !== deleteLesson);
    studentState.plans = studentState.plans.filter((item) => item.lessonId !== deleteLesson);
  }
  if (editStudent) {
    const item = studentState.students.find((student) => student.id === editStudent);
    studentEls.studentId.value = item.id;
    studentEls.studentClass.value = item.classId;
    studentEls.studentNo.value = item.no || "";
    studentEls.studentName.value = item.name;
  }
  if (deleteStudent) studentState.students = studentState.students.filter((item) => item.id !== deleteStudent);
  if (editHomework) fillTaskForm("homework", editHomework);
  if (deleteHomework) studentState.homework = studentState.homework.filter((item) => item.id !== deleteHomework);
  if (editProject) fillTaskForm("projects", editProject);
  if (deleteProject) studentState.projects = studentState.projects.filter((item) => item.id !== deleteProject);
  if (deletePlan) studentState.plans = studentState.plans.filter((item) => item.id !== deletePlan);
  if (deleteClass || deleteLesson || deleteStudent || deleteHomework || deleteProject || deletePlan) {
    saveStudentState();
    renderStudentModule();
  }
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
}

function bindStudentEvents() {
  studentEls.navButtons.forEach((button) => button.addEventListener("click", () => setStudentView(button.dataset.studentView)));
  if (studentEls.studentNavMobileSelect) {
    studentEls.studentNavMobileSelect.addEventListener("change", (e) => setStudentView(e.target.value));
  }
  studentEls.quickButtons.forEach((button) => button.addEventListener("click", () => setStudentView(button.dataset.studentTarget)));
  studentEls.moduleSwitch?.addEventListener("click", () => studentCallbacks.returnToModuleHub?.());
  studentEls.classForm?.addEventListener("submit", saveClass);
  studentEls.lessonForm?.addEventListener("submit", saveLesson);
  studentEls.studentForm?.addEventListener("submit", saveStudent);
  studentEls.planForm?.addEventListener("submit", savePlan);
  studentEls.homeworkForm?.addEventListener("submit", (event) => saveTask("homework", event));
  studentEls.projectForm?.addEventListener("submit", (event) => saveTask("projects", event));
  studentEls.clearClass?.addEventListener("click", clearClassForm);
  studentEls.clearLesson?.addEventListener("click", clearLessonForm);
  studentEls.clearStudent?.addEventListener("click", clearStudentForm);
  studentEls.clearPlan?.addEventListener("click", clearPlanForm);
  studentEls.clearHomework?.addEventListener("click", () => clearTaskForm("homework"));
  studentEls.clearProject?.addEventListener("click", () => clearTaskForm("projects"));
  studentEls.importBtn?.addEventListener("click", importStudents);
  studentEls.saveRoutine?.addEventListener("click", saveRoutine);
  studentEls.planThisWeek?.addEventListener("click", () => {
    if (studentEls.planWeekDate) studentEls.planWeekDate.value = todayIso();
    renderPlans();
  });
  studentEls.planAll?.addEventListener("click", () => {
    if (studentEls.planWeekDate) studentEls.planWeekDate.value = "";
    renderPlans();
  });
  studentEls.routineList?.addEventListener("input", (event) => {
    const input = event.target.closest("[data-routine-field]");
    if (!input) return;
    const output = input.closest(".student-routine-score")?.querySelector("[data-routine-output]");
    if (output) output.textContent = routineScore(input.value);
  });
  [studentEls.routineClass, studentEls.planClass, studentEls.planFilterClass, studentEls.homeworkClass, studentEls.projectClass].forEach((select) => {
    select?.addEventListener("change", () => renderStudentModule());
  });
  studentEls.routineLesson?.addEventListener("change", renderRoutine);
  studentEls.routineDate?.addEventListener("change", renderRoutine);
  studentEls.planLesson?.addEventListener("change", renderPlans);
  studentEls.planFilterLesson?.addEventListener("change", renderPlans);
  studentEls.planWeekDate?.addEventListener("change", renderPlans);
  [studentEls.classList, studentEls.lessonList, studentEls.studentList, studentEls.planList, studentEls.homeworkList, studentEls.projectList]
    .forEach((list) => list?.addEventListener("click", handleListClick));
}

bindStudentEvents();

window.StudentTrackingModule = {
  callbacks: {},
  init(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    studentCallbacks = this.callbacks;
  },
  get shell() {
    return studentEls.shell;
  },
  get state() {
    return studentState;
  },
  render() {
    return renderStudentModule();
  },
  setView(view) {
    return setStudentView(view);
  }
};
