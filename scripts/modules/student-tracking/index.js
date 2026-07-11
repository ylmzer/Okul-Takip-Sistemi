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
  clearProject: document.querySelector("#studentClearProjectBtn")
};

let studentState = loadStudentState();
let studentCallbacks = { returnToModuleHub: typeof returnToModuleHub === "function" ? returnToModuleHub : null };

function loadStudentState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDENT_TRACKING_KEY) || "{}");
    const validViews = ["dashboard", "classes", "students", "lessons", "routine", "homework", "projects"];
    return {
      ...studentDefaults,
      ...saved,
      activeView: validViews.includes(saved.activeView) ? saved.activeView : "dashboard",
      classes: Array.isArray(saved.classes) ? saved.classes : [],
      lessons: Array.isArray(saved.lessons) ? saved.lessons : [],
      students: Array.isArray(saved.students) ? saved.students : [],
      routine: Array.isArray(saved.routine) ? saved.routine : [],
      homework: Array.isArray(saved.homework) ? saved.homework : [],
      projects: Array.isArray(saved.projects) ? saved.projects : []
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

function renderSelects() {
  [studentEls.lessonClass, studentEls.studentClass, studentEls.routineClass, studentEls.homeworkClass, studentEls.projectClass]
    .forEach((select) => fillSelect(select, studentState.classes, "Sınıf seçiniz", select === studentEls.routineClass));
  if (studentEls.routineDate && !studentEls.routineDate.value) studentEls.routineDate.value = todayIso();
  syncLessonSelect(studentEls.routineClass, studentEls.routineLesson, true);
  syncLessonSelect(studentEls.homeworkClass, studentEls.homeworkLesson);
  syncLessonSelect(studentEls.projectClass, studentEls.projectLesson);
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
    projects: ["Projeler", "Projeleri tanımlayın ve öğrenci ilerlemesini izleyin"]
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

function evaluationSelect(field, value) {
  const score = Number.isFinite(Number(value)) ? Number(value) : 100;
  return `<label class="student-evaluation-field"><span>${field.label}</span><select data-routine-field="${field.key}">
    <option value="100" ${score >= 85 ? "selected" : ""}>İyi</option>
    <option value="65" ${score >= 50 && score < 85 ? "selected" : ""}>Orta</option>
    <option value="30" ${score < 50 ? "selected" : ""}>Geliştirilmeli</option>
  </select></label>`;
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
    { key: "notes", label: "Sorumluluk" },
    { key: "dress", label: "Davranış" }
  ];
  studentEls.routineList.innerHTML = students.length ? students.map((student) => {
    const record = studentState.routine.find((item) => item.studentId === student.id && item.date === date && item.lessonId === lessonId) || {};
    return `<article class="student-routine-row" data-student-routine="${html(student.id)}"><div class="student-routine-person"><strong>${html(student.name)}</strong><small>${html(student.no || "Numara yok")}</small></div><div class="student-evaluation-grid">${fields.map((field) => evaluationSelect(field, record[field.key])).join("")}</div></article>`;
  }).join("") : `<div class="student-empty"><strong>Bu sınıfta öğrenci yok</strong><span>Önce sınıfa öğrenci ekleyin.</span></div>`;
}

function taskStatusOptions(kind, selected) {
  const options = kind === "homework"
    ? [["pending", "Bekliyor"], ["done", "Teslim edildi"], ["missing", "Eksik"]]
    : [["pending", "Başlamadı"], ["progress", "Devam ediyor"], ["done", "Tamamlandı"]];
  return options.map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
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
    const statuses = item.statuses || {};
    const doneCount = students.filter((student) => statuses[student.id] === "done").length;
    return `<article class="student-task-card">
      <div class="student-task-head"><div><span class="student-task-kind">${isHomework ? "ÖDEV" : "PROJE"}</span><strong>${html(item.title)}</strong><small>${html(classById(item.classId)?.name || "Sınıf yok")} · ${html(lessonById(item.lessonId)?.name || "Ders yok")} · ${item.due ? `Son gün ${html(item.due)}` : "Tarih yok"}</small></div><span class="student-task-progress">${doneCount}/${students.length}</span></div>
      <details><summary>Öğrenci durumlarını aç</summary><div class="student-task-students">${students.length ? students.map((student) => `<label><span>${html(student.name)}</span><select data-task-status data-kind="${kind}" data-task-id="${html(item.id)}" data-student-id="${html(student.id)}">${taskStatusOptions(kind, statuses[student.id] || "pending")}</select></label>`).join("") : `<p>Bu sınıfta öğrenci yok.</p>`}</div></details>
      <div class="student-card-actions"><button type="button" data-edit-${isHomework ? "homework" : "project"}="${html(item.id)}">Düzenle</button><button type="button" data-delete-${isHomework ? "homework" : "project"}="${html(item.id)}">Sil</button></div>
    </article>`;
  }).join("");
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
    statuses: old?.statuses || {}
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
      } else studentState[action === "project" ? "projects" : "homework"] = studentState[action === "project" ? "projects" : "homework"].filter((item) => item.id !== deleteId);
      saveStudentState(); renderStudentModule(); toast("Kayıt silindi."); return;
    }
  }
}

function handleTaskStatus(event) {
  const select = event.target.closest("[data-task-status]");
  if (!select) return;
  const item = studentState[select.dataset.kind]?.find((entry) => entry.id === select.dataset.taskId);
  if (!item) return;
  item.statuses = { ...(item.statuses || {}), [select.dataset.studentId]: select.value };
  saveStudentState();
  renderStats();
  const card = select.closest(".student-task-card");
  if (card) {
    const students = studentsForClass(item.classId);
    const done = students.filter((student) => item.statuses[student.id] === "done").length;
    const progress = card.querySelector(".student-task-progress");
    if (progress) progress.textContent = `${done}/${students.length}`;
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
  studentEls.studentClass?.addEventListener("change", renderStudents);
  studentEls.lessonClass?.addEventListener("change", renderLessons);
  [studentEls.routineClass, studentEls.routineLesson, studentEls.routineDate].forEach((select) => select?.addEventListener("change", renderRoutine));
  [studentEls.homeworkClass, studentEls.projectClass].forEach((select) => select?.addEventListener("change", () => {
    syncLessonSelect(select, select === studentEls.homeworkClass ? studentEls.homeworkLesson : studentEls.projectLesson);
  }));
  [studentEls.classList, studentEls.lessonList, studentEls.studentList, studentEls.homeworkList, studentEls.projectList].forEach((list) => list?.addEventListener("click", handleListClick));
  studentEls.homeworkList?.addEventListener("change", handleTaskStatus);
  studentEls.projectList?.addEventListener("change", handleTaskStatus);
}

bindStudentEvents();

window.StudentTrackingModule = {
  callbacks: {},
  init(callbacks = {}) { this.callbacks = { ...this.callbacks, ...callbacks }; studentCallbacks = this.callbacks; },
  loadState() { studentState = loadStudentState(); },
  get shell() { return studentEls.shell; },
  get state() { return studentState; },
  render() { renderStudentModule(); setStudentView(studentState.activeView); },
  setView(view) { setStudentView(view); }
};
