function renderSkillModule() {
  if (!els.skillShell) return;
  const selectAlls = ["skillSchoolSelectAll", "skillTeacherSelectAll", "skillFieldSelectAll", "skillBusinessSelectAll", "skillCoordinatorSelectAll", "skillHolidaySelectAll", "skillStudentSelectAll"];
  selectAlls.forEach(id => { const cb = document.getElementById(id); if (cb) cb.checked = false; });
  ensureSkillCollections();
  renderSkillProfileButton();
  renderSkillStats();
  renderSkillSelects();
  renderSkillSchools();
  renderSkillTeachers();
  renderSkillFields();
  renderSkillStudents();
  renderSkillBusinesses();
  renderSkillCoordinators();
  renderSkillHolidays();
  renderSkillAlerts();
  renderSkillWeeklySchedule();
  renderSkillReportAssignments();
  setSkillView(skillState.activeView || "dashboard");
}

function handleSkillQuickAction(action, event) {
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }
  if (action === "add-student") {
    setSkillView("students");
    setTimeout(() => {
      if (typeof openSkillStudentDrawer === "function") {
        openSkillStudentDrawer(null);
      } else if (typeof window.openSkillStudentDrawer === "function") {
        window.openSkillStudentDrawer(null);
      }
    }, 100);
  } else if (action === "add-business") {
    setSkillView("businesses");
    setTimeout(() => {
      if (typeof openSkillBusinessDrawer === "function") {
        openSkillBusinessDrawer(null);
      } else if (typeof window.openSkillBusinessDrawer === "function") {
        window.openSkillBusinessDrawer(null);
      }
    }, 100);
  } else if (action === "add-coordinator") {
    setSkillView("coordinators");
    setTimeout(() => {
      if (typeof openSkillCoordinatorDrawer === "function") {
        openSkillCoordinatorDrawer(null);
      } else if (typeof window.openSkillCoordinatorDrawer === "function") {
        window.openSkillCoordinatorDrawer(null);
      }
    }, 100);
  } else if (action === "reports") {
    setSkillView("reports");
  } else if (action === "fields") {
    setSkillView("fields");
  } else if (action === "holidays") {
    setSkillView("holidays");
  } else if (action === "school") {
    setSkillView("school");
  } else if (action === "import-data") {
    if (typeof window.openSkillImportDialog === "function") {
      window.openSkillImportDialog();
    } else {
      const dialog = document.getElementById("skillImportDialog");
      if (dialog && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
    }
  }
}
window.handleSkillQuickAction = handleSkillQuickAction;

function renderSkillStats() {
  if (!els.skillStatGrid) return;
  const activeStudents = skillState.students.filter((student) => student.active !== false).length;
  const businessCount = skillState.businesses.length;
  const coordinatorCount = skillState.teacherPool?.length || skillState.coordinators.length;
  const fieldCount = skillState.fields?.length || new Set(skillState.students.map((student) => student.field).filter(Boolean)).size;
  const passiveStudents = skillState.students.filter((student) => student.active === false).length;
  const nextHoliday = getNextSkillHoliday();

  let holidaySub = "Tarih girilmedi";
  if (nextHoliday && nextHoliday.startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hDate = new Date(nextHoliday.startDate + "T00:00:00");
    const diffDays = Math.ceil((hDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let daysBadge = "";
    if (diffDays === 0) daysBadge = "Bugün";
    else if (diffDays === 1) daysBadge = "Yarın";
    else if (diffDays > 1) daysBadge = `${diffDays} gün kaldı`;
    holidaySub = `${formatSkillDate(nextHoliday.startDate)}${daysBadge ? ` · ${daysBadge}` : ""}`;
  }

  els.skillStatGrid.innerHTML = `
    <div class="skill-stat-card stat-student" onclick="setSkillView('students')" title="Öğrenciler listesine git">
      <div class="stat-card-top">
        <span class="stat-label">Toplam Öğrenci</span>
        <span class="stat-icon-pill icon-student">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </span>
      </div>
      <div class="stat-card-mid">
        <strong class="stat-value">${activeStudents}</strong>
        <div class="stat-dot-row">
          <small class="stat-dot">${activeStudents} aktif</small>
          ${passiveStudents > 0 ? `<small class="stat-dot is-passive">${passiveStudents} pasif</small>` : `<small class="stat-dot is-good">0 pasif</small>`}
        </div>
      </div>
      <button type="button" class="stat-action-btn action-student" onclick="handleSkillQuickAction('add-student', event)" title="Yeni öğrenci kaydı oluştur">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Öğrenci Ekle</span>
      </button>
    </div>

    <div class="skill-stat-card stat-business" onclick="setSkillView('businesses')" title="İşletmeler listesine git">
      <div class="stat-card-top">
        <span class="stat-label">Toplam İşletme</span>
        <span class="stat-icon-pill icon-business">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="12" x2="15" y2="22"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
        </span>
      </div>
      <div class="stat-card-mid">
        <strong class="stat-value">${businessCount}</strong>
        <small class="stat-sub">Kayıtlı aktif işletme</small>
      </div>
      <button type="button" class="stat-action-btn action-business" onclick="handleSkillQuickAction('add-business', event)" title="Yeni işletme kaydı oluştur">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>İşletme Ekle</span>
      </button>
    </div>

    <div class="skill-stat-card stat-coord" onclick="setSkillView('coordinators')" title="Koordinatör görevlerine git">
      <div class="stat-card-top">
        <span class="stat-label">Koordinatör</span>
        <span class="stat-icon-pill icon-coord">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </span>
      </div>
      <div class="stat-card-mid">
        <strong class="stat-value">${coordinatorCount}</strong>
        <small class="stat-sub">Görevli öğretmen</small>
      </div>
      <button type="button" class="stat-action-btn action-coord" onclick="handleSkillQuickAction('add-coordinator', event)" title="İşletmeye koordinatör öğretmen ve gün ata">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        <span>Koordinatör Ata</span>
      </button>
    </div>

    <div class="skill-stat-card stat-field" onclick="setSkillView('fields')" title="Alan / Dal listesine git">
      <div class="stat-card-top">
        <span class="stat-label">Alan / Dal</span>
        <span class="stat-icon-pill icon-field">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </span>
      </div>
      <div class="stat-card-mid">
        <strong class="stat-value">${fieldCount}</strong>
        <small class="stat-sub">Tanımlı alan / dal</small>
      </div>
      <button type="button" class="stat-action-btn action-report" onclick="handleSkillQuickAction('fields', event)" title="Alan ve dal tanımlarını yönet">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        <span>Alan / Dal Yönet</span>
      </button>
    </div>

    <div class="skill-stat-card stat-holiday" onclick="setSkillView('holidays')" title="Resmi Tatiller takvimine git">
      <div class="stat-card-top">
        <span class="stat-label">Yaklaşan Resmi Tatil</span>
        <span class="stat-icon-pill icon-holiday">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </span>
      </div>
      <div class="stat-card-mid stat-mid-holiday">
        <h3 class="stat-holiday-title" title="${escapeHtml(nextHoliday?.name || "Tatil kaydı yok")}">${escapeHtml(nextHoliday?.name || "Tatil kaydı yok")}</h3>
        <small class="stat-sub">${holidaySub}</small>
      </div>
      <button type="button" class="stat-action-btn action-import" onclick="handleSkillQuickAction('holidays', event)" title="Resmi tatil takvimini aç">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Tatil Takvimi</span>
      </button>
    </div>
  `;
  if (els.skillYearBadge) els.skillYearBadge.textContent = skillState.school.year || "2025-2026";
  if (els.skillSchoolBadge) els.skillSchoolBadge.textContent = skillState.school.name || "Okul bilgisi girilmedi";
}

function renderSkillAlerts() {
  if (!els.skillAlertList) return;
  const alerts = [];
  const studentsWithoutBusiness = skillState.students.filter((student) => !student.businessId).length;
  const coordinatorsWithoutDay = skillState.coordinators.filter((item) => !item.day).length;
  const nextHoliday = getNextSkillHoliday();

  if (studentsWithoutBusiness) {
    alerts.push({
      title: "Öğrenci Eşleştirme Eksik",
      text: `${studentsWithoutBusiness} öğrenci henüz bir işletmeye atanmamış.`,
      buttonText: "Öğrenciler",
      target: "students"
    });
  }
  if (coordinatorsWithoutDay) {
    alerts.push({
      title: "Rehberlik Günü Eksik",
      text: `${coordinatorsWithoutDay} koordinatör görevinde gün seçimi yapılmamış.`,
      buttonText: "Koordinatörler",
      target: "coordinators"
    });
  }
  if (!skillState.businesses.length) {
    alerts.push({
      title: "İşletme Listesi Boş",
      text: "Henüz kayıtlı işletme bulunmuyor. Yeni işletme ekleyin.",
      buttonText: "İşletmeler",
      target: "businesses"
    });
  }

  if (nextHoliday) {
    alerts.push({
      title: "Yaklaşan Resmi Tatil",
      text: `${formatSkillDate(nextHoliday.startDate)} tarihinde ${nextHoliday.name} var. Rehberlik ve devamsızlıkları planlayın.`,
      buttonText: "Tatiller",
      target: "holidays"
    });
  } else if (!skillState.holidays || !skillState.holidays.length) {
    alerts.push({
      title: "Resmi Tatil Takvimi Boş",
      text: "Resmi tatil kaydı bulunmuyor. Yıl takvimini otomatik çekebilirsiniz.",
      buttonText: "Tatiller",
      target: "holidays"
    });
  }

  const alertCountEl = document.getElementById("skillAlertCount");
  if (alertCountEl) {
    alertCountEl.textContent = `${alerts.length} bildirim`;
    alertCountEl.classList.toggle("is-empty", alerts.length === 0);
  }

  const dayNamesMap = { "1": "Pazartesi", "2": "Salı", "3": "Çarşamba", "4": "Perşembe", "5": "Cuma" };
  const jsDay = new Date().getDay();
  const isWeekday = jsDay >= 1 && jsDay <= 5;
  const targetDayKey = isWeekday ? String(jsDay) : "1";
  const todayVisits = skillState.coordinators.filter((item) => String(item.day || "").trim() === targetDayKey).length;
  const visitTitle = isWeekday ? `Bugünkü Ziyaretler (${dayNamesMap[targetDayKey]})` : `Yaklaşan Ziyaretler (${dayNamesMap[targetDayKey]})`;
  const visitText = todayVisits > 0
    ? `${todayVisits} işletme için koordinatörlük rehberliği planlanmış.`
    : `${dayNamesMap[targetDayKey]} günü için planlı işletme ziyareti bulunmuyor.`;

  const visitSummaryHtml = `
    <div class="skill-visit-summary">
      <div class="skill-visit-summary-left">
        <span class="skill-visit-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </span>
        <div>
          <strong>${escapeHtml(visitTitle)}</strong>
          <small>${escapeHtml(visitText)}</small>
        </div>
      </div>
      <button type="button" class="skill-visit-btn" onclick="filterCoordinatorsByDay('${targetDayKey}')">Programı Gör ➔</button>
    </div>
  `;

  if (!alerts.length) {
    els.skillAlertList.innerHTML = `
      <div class="skill-alert-empty-box">
        <div class="skill-alert-empty-icon">✓</div>
        <div class="skill-alert-empty-content">
          <strong>Her Şey Yolunda</strong>
          <p>Tüm öğrenciler işletmelere atandı, koordinatör günleri tanımlandı ve sistemde bekleyen acil işlem bulunmuyor.</p>
        </div>
        <button type="button" class="skill-alert-empty-btn" onclick="setSkillView('reports')">Rapor Al ➔</button>
      </div>
      ${visitSummaryHtml}
    `;
    return;
  }

  els.skillAlertList.innerHTML = alerts.map((alert) => `
    <div class="skill-alert">
      <span class="skill-alert-bullet" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <div class="skill-alert-body">
        <strong>${escapeHtml(alert.title)}</strong>
        <small>${escapeHtml(alert.text)}</small>
      </div>
      <button data-skill-view-target="${escapeHtml(alert.target)}" type="button">${escapeHtml(alert.buttonText)} ➔</button>
    </div>
  `).join("") + visitSummaryHtml;
}

function renderSkillWeeklySchedule() {
  const container = document.getElementById("skillWeeklyScheduleList");
  if (!container) return;

  const daysConfig = [
    { key: "1", label: "Pazartesi", short: "Pzt", pillClass: "day-pzt", color: "#38bdf8" },
    { key: "2", label: "Salı", short: "Sal", pillClass: "day-sal", color: "#c084fc" },
    { key: "3", label: "Çarşamba", short: "Çar", pillClass: "day-car", color: "#fbbf24" },
    { key: "4", label: "Perşembe", short: "Per", pillClass: "day-per", color: "#34d399" },
    { key: "5", label: "Cuma", short: "Cum", pillClass: "day-cum", color: "#f472b6" }
  ];

  const totalAssigned = skillState.coordinators.length;
  const badgeEl = document.getElementById("skillScheduleTotalBadge");
  if (badgeEl) {
    badgeEl.textContent = `${totalAssigned} işletme`;
  }

  const counts = {};
  daysConfig.forEach(d => counts[d.key] = 0);
  let unassignedCount = 0;

  skillState.coordinators.forEach(coord => {
    const d = String(coord.day || "").trim();
    if (counts[d] !== undefined) {
      counts[d]++;
    } else {
      unassignedCount++;
    }
  });

  const maxCount = Math.max(...Object.values(counts), 1);

  const rowsHtml = daysConfig.map(day => {
    const count = counts[day.key] || 0;
    const pct = Math.round((count / maxCount) * 100);
    return `
      <div class="skill-schedule-row${count === 0 ? " is-zero" : ""}" onclick="filterCoordinatorsByDay('${day.key}')" title="${day.label} günkü işletmeleri görüntüle">
        <span class="skill-day-pill ${day.pillClass}" style="min-width: 82px; text-align: center;">${day.label}</span>
        <div class="skill-schedule-bar-wrap">
          <div class="skill-schedule-bar ${day.pillClass}" style="width: ${Math.max(pct, count > 0 ? 8 : 0)}%;"></div>
        </div>
        <span class="skill-schedule-count">${count} İşletme</span>
        <span class="skill-schedule-arrow">›</span>
      </div>
    `;
  }).join("");

  const unassignedHtml = unassignedCount > 0 ? `
    <div class="skill-schedule-unassigned-note" onclick="filterCoordinatorsByDay('none')">
      <span>⚠️ <strong>${unassignedCount} işletmeye</strong> gün atanmamış</span>
      <span class="skill-unassigned-link">Ata ➔</span>
    </div>
  ` : "";

  container.innerHTML = rowsHtml + unassignedHtml;
}

window.filterCoordinatorsByDay = function(dayKey) {
  setSkillView("coordinators");
  const filter = document.getElementById("skillCoordinatorDayFilter");
  if (filter) {
    filter.value = dayKey;
    filter.dispatchEvent(new Event("change"));
  }
};

function renderSkillReportAssignments() {
  if (!els.skillReportAssignmentList) return;
  renderSkillReportControls();
  const query = (els.skillReportSearch?.value || "").toLocaleLowerCase("tr-TR");
  const selectedSchool = els.skillReportSchoolFilter?.value || "";
  const teacherFilter = els.skillReportCoordinatorFilter?.value || "";
  const includeEmpty = Boolean(els.skillReportIncludeEmpty?.checked);

  // Preserve previously selected checkboxes
  const prevChecked = new Set(
    Array.from(els.skillReportAssignmentList.querySelectorAll("[data-skill-report-business]:checked")).map((cb) => cb.value)
  );

  const rows = skillState.businesses.filter((business) => {
    const students = skillState.students.filter((student) => student.businessId === business.id);
    const coordinator = skillState.coordinators.find((item) => item.businessId === business.id);
    const teacher = skillState.teacherPool.find((t) => t.name === coordinator?.teacher);
    const businessSchoolId = coordinator?.schoolId || teacher?.schoolId || (skillState.schoolRecords.length === 1 ? skillState.schoolRecords[0].id : "");

    const matchesSchool = !selectedSchool || businessSchoolId === selectedSchool;
    const matchesEmpty = includeEmpty || students.length > 0;
    const matchesTeacher = !teacherFilter || coordinator?.teacher === teacherFilter;
    const matchesQuery = [business.name, coordinator?.teacher, ...students.map((student) => student.name)]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query);
    return matchesSchool && matchesEmpty && matchesTeacher && matchesQuery;
  });

  if (els.skillReportBusinessCount) els.skillReportBusinessCount.textContent = rows.length;
  if (els.skillReportStudentCount) {
    els.skillReportStudentCount.textContent = rows.reduce((total, business) => (
      total + skillState.students.filter((student) => student.businessId === business.id).length
    ), 0);
  }

  els.skillReportAssignmentList.innerHTML = rows.length ? rows.map((business) => {
    const students = skillState.students.filter((student) => String(student.businessId || "").trim() === String(business.id || "").trim());
    const coordinator = skillState.coordinators.find((item) => String(item.businessId || "").trim() === String(business.id || "").trim());
    const isChecked = prevChecked.has(business.id);
    const studentCount = students.length;
    const dayLabel = coordinator?.day ? getSkillDayName(coordinator.day) : "";
    const dayDisplay = dayLabel && dayLabel !== "Gün yok" ? ` (${escapeHtml(dayLabel)})` : (coordinator?.day ? ` (${escapeHtml(coordinator.day)})` : "");
    return `
      <div class="skill-assignment-card ${isChecked ? "is-selected" : ""}" data-skill-report-business-row="${escapeHtml(business.id)}">
        <div class="skill-assignment-header-row">
          <label class="skill-assignment-check-label">
            <input type="checkbox" value="${escapeHtml(business.id)}" data-skill-report-business ${isChecked ? "checked" : ""} />
            <div class="skill-assignment-main">
              <strong class="skill-assignment-name">${escapeHtml(business.name)}</strong>
              <span class="skill-assignment-sub">Koordinatör: ${escapeHtml(coordinator?.teacher || "Atanmadı")}${dayDisplay}</span>
            </div>
          </label>
          <button type="button" class="skill-assignment-badge ${studentCount > 0 ? "has-students" : "no-students"}" data-skill-toggle-students="${escapeHtml(business.id)}" onclick="toggleSkillBusinessStudents('${escapeHtml(business.id)}', event)" title="${studentCount > 0 ? "Öğrencileri göster / gizle" : "Kayıtlı öğrenci yok"}">
            ${studentCount > 0 ? `<span>${studentCount} Öğrenci</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>` : "Boş"}
          </button>
        </div>
        ${studentCount > 0 ? `
          <div class="skill-business-students-drawer" id="skillBusinessStudents_${escapeHtml(business.id)}" style="display: none;">
            <div class="skill-students-title">Öğrenciler (${studentCount}):</div>
            <div class="skill-students-chips">
              ${students.map((s) => {
                const stuNo = escapeHtml(String(s.no || s.studentNo || s.student_no || "-"));
                const stuName = escapeHtml(String(s.name || s.studentName || s.student_name || s.fullName || "Öğrenci"));
                const stuClass = (s.className || s.sinif || s.class_name) ? escapeHtml(String(s.className || s.sinif || s.class_name)) : "";
                const stuField = (s.field || s.alan || s.branch) ? escapeHtml(String(s.field || s.alan || s.branch)) : "";
                const stuDays = (s.days || s.schoolDays || s.school_days) ? escapeHtml(String(s.days || s.schoolDays || s.school_days)) : "";
                return `
                <div class="skill-student-chip">
                  <span class="stu-badge-no">#${stuNo}</span>
                  <strong class="stu-badge-name">${stuName}</strong>
                  ${stuClass ? `<span class="stu-badge-class">${stuClass}</span>` : ""}
                  ${stuField ? `<span class="stu-badge-field">${stuField}</span>` : ""}
                  ${stuDays ? `<span class="stu-badge-days" title="Okul Günleri">📅 ${stuDays}</span>` : ""}
                </div>`;
              }).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }).join("") : `<div class="empty-state">Kriterlere uygun işletme kaydı bulunamadı.</div>`;

  runSkillReportPrecheck();
}

let _lastSkillDrawerToggleTime = 0;
let _lastSkillDrawerToggleId = "";
window.toggleSkillBusinessStudents = function(businessId, event) {
  if (event) {
    if (event.__skillHandled) return;
    event.__skillHandled = true;
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
  }

  const now = Date.now();
  if (businessId && businessId === _lastSkillDrawerToggleId && now - _lastSkillDrawerToggleTime < 180) {
    return;
  }
  _lastSkillDrawerToggleTime = now;
  _lastSkillDrawerToggleId = businessId || "";

  const trigger = event?.currentTarget || event?.target;
  const card = trigger ? trigger.closest('.skill-assignment-card') : (businessId ? document.querySelector(`[data-skill-report-business-row="${businessId}"]`) : null);
  const drawer = card ? card.querySelector('.skill-business-students-drawer') : (businessId ? document.getElementById(`skillBusinessStudents_${businessId}`) : null);
  const toggleBtn = card ? (card.querySelector('[data-skill-toggle-students]') || trigger?.closest('[data-skill-toggle-students]')) : (businessId ? document.querySelector(`[data-skill-toggle-students="${businessId}"]`) : null);

  if (!drawer) return;

  const isCurrentlyOpen = (card && card.classList.contains("is-open")) || drawer.classList.contains("is-open") || (drawer.style.display !== "none" && drawer.style.display !== "");
  const nextOpen = !isCurrentlyOpen;

  if (card) card.classList.toggle("is-open", nextOpen);
  drawer.classList.toggle("is-open", nextOpen);
  drawer.style.setProperty("display", nextOpen ? "block" : "none", "important");

  if (toggleBtn) {
    toggleBtn.classList.toggle("is-open", nextOpen);
    const countMatch = toggleBtn.textContent.match(/\d+/);
    const count = countMatch ? countMatch[0] : "";
    const arrow = nextOpen ? "▴" : "▾";
    toggleBtn.textContent = count ? `👥 ${count} Öğrenci ${arrow}` : `Öğrenciler ${arrow}`;
  }
};

function renderSkillReportControls() {
  if (els.skillReportSchoolFilter) {
    const curSchool = els.skillReportSchoolFilter.value;
    els.skillReportSchoolFilter.innerHTML = [
      `<option value="">Tüm Okullar</option>`,
      ...skillState.schoolRecords.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
    ].join("");
    if (curSchool !== undefined && curSchool !== "" && skillState.schoolRecords.some((s) => s.id === curSchool)) {
      els.skillReportSchoolFilter.value = curSchool;
    } else if (window.activeSchoolId && skillState.schoolRecords.some((s) => s.id === window.activeSchoolId)) {
      els.skillReportSchoolFilter.value = window.activeSchoolId;
    } else {
      els.skillReportSchoolFilter.value = curSchool || "";
    }
  }

  if (els.skillReportCoordinatorFilter) {
    const current = els.skillReportCoordinatorFilter.value || "";
    const selectedSchool = els.skillReportSchoolFilter?.value || "";
    let filteredCoordinators = skillState.coordinators;
    if (selectedSchool) {
      filteredCoordinators = skillState.coordinators.filter((c) => {
        if (c.schoolId) return c.schoolId === selectedSchool;
        const teacher = skillState.teacherPool.find((t) => t.name === c.teacher);
        return !teacher?.schoolId || teacher.schoolId === selectedSchool;
      });
    }
    const teachers = [...new Set(filteredCoordinators.map((item) => item.teacher).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr-TR"));
    els.skillReportCoordinatorFilter.innerHTML = [`<option value="">Tümü</option>`, ...teachers.map((teacher) => `<option value="${escapeHtml(teacher)}">${escapeHtml(teacher)}</option>`)].join("");
    els.skillReportCoordinatorFilter.value = teachers.includes(current) ? current : "";
  }
  if (els.skillReportMonthSelect && !els.skillReportMonthSelect.options.length) {
    const now = new Date();
    const baseYear = now.getFullYear();
    const baseMonth = now.getMonth();
    const months = [];
    for (let offset = -12; offset <= 12; offset += 1) {
      const date = new Date(baseYear, baseMonth + offset, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.push(`<option value="${value}">${date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</option>`);
    }
    els.skillReportMonthSelect.innerHTML = months.join("");
    els.skillReportMonthSelect.value = skillReportMonth;
    syncSkillReportRange();
  }
  if (els.skillTerminationStudent) {
    const current = els.skillTerminationStudent.value || "";
    els.skillTerminationStudent.innerHTML = [
      `<option value="">Öğrenci seçiniz</option>`,
      ...skillState.students.map((student) => {
        const business = getSkillBusiness(student.businessId);
        const label = `${student.no || "-"} - ${student.name || "Öğrenci"} (${business?.name || "İşletme yok"})`;
        return `<option value="${student.id}">${escapeHtml(label)}</option>`;
      })
    ].join("");
    els.skillTerminationStudent.value = skillState.students.some((student) => student.id === current) ? current : "";
  }
}

function syncSkillReportMonthDates() {
  if (!els.skillReportMonthSelect) return;
  skillReportMonth = els.skillReportMonthSelect.value || skillReportMonth;
  const [year, month] = skillReportMonth.split("-").map(Number);
  if (!year || !month) return;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  if (els.skillReportStartDate) els.skillReportStartDate.value = start;
  if (els.skillReportEndDate) els.skillReportEndDate.value = end;
}

function getCheckedSkillReportRange() {
  return document.querySelector('input[name="skillReportRange"]:checked')?.value || "month";
}

function setCheckedSkillReportRange(value) {
  const input = document.querySelector(`input[name="skillReportRange"][value="${value}"]`);
  if (input && !input.checked) {
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function setSkillReportDateInputsEnabled(enabled) {
  if (els.skillReportStartDate) els.skillReportStartDate.disabled = !enabled;
  if (els.skillReportEndDate) els.skillReportEndDate.disabled = !enabled;
}

function getSkillWeekRange(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: toSkillIsoDate(start), endDate: toSkillIsoDate(end) };
}

function syncSkillReportRange() {
  const range = getCheckedSkillReportRange();
  if (range === "week") {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const activeMonth = els.skillReportMonthSelect?.value || skillReportMonth || currentYearMonth;
    let week;
    if (activeMonth === currentYearMonth) {
      week = getSkillWeekRange(today);
    } else {
      const [y, m] = activeMonth.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      const day = d.getDay() || 7;
      const start = new Date(d);
      if (day > 1) {
        start.setDate(start.getDate() + (8 - day));
      }
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      week = { startDate: toSkillIsoDate(start), endDate: toSkillIsoDate(end) };
    }
    if (els.skillReportStartDate) els.skillReportStartDate.value = week.startDate;
    if (els.skillReportEndDate) els.skillReportEndDate.value = week.endDate;
    setSkillReportDateInputsEnabled(false);
  } else if (range === "month") {
    if (els.skillReportMonthSelect?.value) {
      skillReportMonth = els.skillReportMonthSelect.value;
    }
    syncSkillReportMonthDates();
    setSkillReportDateInputsEnabled(false);
  } else {
    setSkillReportDateInputsEnabled(true);
  }
  runSkillReportPrecheck();
}

function moveSkillReportMonth(offset) {
  const [year, month] = skillReportMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  skillReportMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (els.skillReportMonthSelect) {
    if (![...els.skillReportMonthSelect.options].some((option) => option.value === skillReportMonth)) {
      els.skillReportMonthSelect.add(new Option(date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }), skillReportMonth));
    }
    els.skillReportMonthSelect.value = skillReportMonth;
  }
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
}

function getSelectedReportBusinessIds() {
  return selectedSkillIds(els.skillReportAssignmentList, "[data-skill-report-business]");
}

function getReportDateRange() {
  return {
    startDate: els.skillReportStartDate?.value || `${skillReportMonth}-01`,
    endDate: els.skillReportEndDate?.value || `${skillReportMonth}-31`
  };
}

function getDatesBetween(startDate, endDate) {
  const dates = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

function getShortSkillDay(date) {
  return ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][date.getDay()];
}

function getLongSkillDay(date) {
  return ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][date.getDay()];
}

function getSkillReportDayHeader(date) {
  return `${date.getDate()} ${getLongSkillDay(date)}`;
}

function isEntireWeekHoliday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d.setDate(diff));
  
  for (let i = 0; i < 5; i++) {
    const checkDate = new Date(monday);
    checkDate.setDate(monday.getDate() + i);
    const iso = toSkillIsoDate(checkDate);
    if (!getHolidayForDate(iso)) {
      return false;
    }
  }
  return true;
}

function formatGuidanceDate(date) {
  const dateObject = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const iso = toSkillIsoDate(dateObject);
  const holiday = getHolidayForDate(iso);
  if (holiday) {
    const month = String(dateObject.getMonth() + 1).padStart(2, "0");
    const year = dateObject.getFullYear();
    return `.....${month}.${year}`;
  }
  return formatSkillDate(iso);
}

function formatGuidanceLongDate(date) {
  const dateObject = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const formatted = formatGuidanceDate(dateObject);
  return `${formatted} ${getLongSkillDay(dateObject)}`;
}

function toSkillIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getHolidayForDate(dateValue) {
  return skillState.holidays.find((holiday) => dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate));
}

function getBaseReportSymbolForDate(student, date) {
  if (date.getDay() === 0 || date.getDay() === 6) return "";
  const schoolDays = String(student.days || "").split(",").map((day) => day.trim()).filter(Boolean);
  const isSchoolDay = schoolDays.includes(getShortSkillDay(date));
  if (isSchoolDay) return els.skillReportSchoolSymbolEnabled?.checked === false ? "" : "O";
  return els.skillReportBusinessSymbolEnabled?.checked === false ? "" : "X";
}

function getActiveSkillSchoolType() {
  return skillState?.schoolType || "mesem";
}

function getSchoolForStudent(student) {
  if (!student || !student.businessId) return skillState?.schoolRecords?.[0] || skillState?.school;
  const coordinator = skillState.coordinators.find((c) => c.businessId === student.businessId);
  return skillState.schoolRecords.find((school) => school.id === coordinator?.schoolId) || skillState.schoolRecords?.[0] || skillState.school;
}

function getStudentSchoolConfig(student) {
  const school = getSchoolForStudent(student);
  const schoolType = normalizeSkillSchoolType(school?.schoolType || skillState.schoolType || "mesem");
  const summerStartDate = school?.summerStartDate || "";
  const summerEndDate = school?.summerEndDate || "";
  return { schoolType, summerStartDate, summerEndDate };
}

function isSkillSchoolBreakForMesem(holiday, student = null) {
  if (!Boolean(holiday?.isSchoolBreak)) return false;
  if (student) {
    const { schoolType } = getStudentSchoolConfig(student);
    return schoolType === "mesem";
  }
  return getActiveSkillSchoolType() === "mesem";
}

function getSkillMesemBreakSymbol(date) {
  if (date.getDay() === 0 || date.getDay() === 6) return "";
  return els.skillReportBusinessSymbolEnabled?.checked === false ? "" : "X";
}

function isHolidaySession(holiday, dateValue, session) {
  const startDate = holiday.startDate;
  const endDate = holiday.endDate || holiday.startDate;
  const startPart = holiday.startPart || "full";
  const endPart = holiday.endPart || "full";
  if (dateValue > startDate && dateValue < endDate) return true;
  if (dateValue === startDate && dateValue === endDate) {
    if (startPart === "full" || endPart === "full") return true;
    return startPart === session || endPart === session;
  }
  if (dateValue === startDate) {
    if (startPart === "full") return true;
    return startPart === session;
  }
  if (dateValue === endDate) {
    if (endPart === "full") return true;
    return endPart === session;
  }
  return false;
}

function getReportSymbolForDate(student, date, session) {
  const dateValue = toSkillIsoDate(date);
  const { schoolType, summerStartDate, summerEndDate } = getStudentSchoolConfig(student);
  
  if (summerStartDate && summerEndDate) {
    const isSummer = (dateValue >= summerStartDate && dateValue <= summerEndDate);
    if (schoolType === "lise") {
      if (isSummer) {
        return "";
      }
    } else if (schoolType === "mesem") {
      if (isSummer) {
        if (skillState.absenceRecords?.[student.id]?.[dateValue]?.[session] !== undefined) {
          return skillState.absenceRecords[student.id][dateValue][session];
        }
        const matchingHolidays = skillState.holidays.filter((holiday) => dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate));
        const sessionHolidays = matchingHolidays.filter((holiday) => isHolidaySession(holiday, dateValue, session));
        if (sessionHolidays.some((holiday) => !holiday.isSchoolBreak)) {
          return "T";
        }
        if (date.getDay() === 0 || date.getDay() === 6) return "";
        return els.skillReportBusinessSymbolEnabled?.checked === false ? "" : "X";
      }
    }
  }

  if (skillState.absenceRecords?.[student.id]?.[dateValue]?.[session] !== undefined) {
    return skillState.absenceRecords[student.id][dateValue][session];
  }
  const matchingHolidays = skillState.holidays.filter((holiday) => dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate));
  const sessionHolidays = matchingHolidays.filter((holiday) => isHolidaySession(holiday, dateValue, session));
  if (sessionHolidays.some((holiday) => !isSkillSchoolBreakForMesem(holiday, student))) return "T";
  if (sessionHolidays.some((holiday) => isSkillSchoolBreakForMesem(holiday, student))) return getSkillMesemBreakSymbol(date);
  return getBaseReportSymbolForDate(student, date);
}

function isMutedReportDate(date) {
  const dateValue = toSkillIsoDate(date);
  return date.getDay() === 0 || date.getDay() === 6 || skillState.holidays.some((holiday) => (
    dateValue >= holiday.startDate && dateValue <= (holiday.endDate || holiday.startDate) && !isSkillSchoolBreakForMesem(holiday)
  ));
}

function getSkillDeputyForReport(coordinator) {
  const selectedSchoolId = els.skillReportSchoolFilter?.value;
  if (selectedSchoolId) {
    const s = skillState.schoolRecords.find((school) => school.id === selectedSchoolId);
    if (s?.deputy) return s.deputy;
  }
  const coordinatorSchool = skillState.schoolRecords.find((school) => school.id === coordinator?.schoolId);
  return coordinatorSchool?.deputy || skillState.schoolRecords?.[0]?.deputy || coordinator?.deputy || skillState.school?.deputy || "Müdür Yardımcısı";
}

function getSkillSchoolForReport(coordinator) {
  const selectedSchoolId = els.skillReportSchoolFilter?.value;
  if (selectedSchoolId) {
    const s = skillState.schoolRecords.find((school) => school.id === selectedSchoolId);
    if (s) return s;
  }
  return skillState.schoolRecords.find((school) => school.id === coordinator?.schoolId) || skillState.schoolRecords?.[0] || skillState.school;
}

function getGradeReportBusinessIds() {
  const selectedIds = getSelectedReportBusinessIds();
  return selectedIds.length ? selectedIds : skillState.businesses.map((business) => business.id);
}

function getFlexibleReportBusinessIds() {
  const selectedIds = getSelectedReportBusinessIds();
  return selectedIds.length ? selectedIds : skillState.businesses.map((business) => business.id);
}

function getGradeTermLabel() {
  return els.skillGradeTerm?.value === "2" ? "2. Dönem" : "1. Dönem";
}

function updateGradeLayoutOptions() {
  if (!els.skillGradeLayout) return;
  const isHighSchool = els.skillGradeType?.value === "lise";
  els.skillGradeLayout.innerHTML = isHighSchool
    ? `<option value="one">1 sayfaya 1 form (Dikey)</option>`
    : `<option value="one">1 sayfaya 1 form (Yatay)</option><option value="two-portrait">1 sayfaya 2 form (Dikey)</option>`;
}

function runSkillReportPrecheck() {
  const ids = ["grades", "wage", "absence", "daily", "monthly"].includes(activeSkillReportType) ? getFlexibleReportBusinessIds() : getSelectedReportBusinessIds();
  const { startDate, endDate } = getReportDateRange();
  const studentCount = skillState.students.filter((student) => ids.includes(student.businessId)).length;

  // Keep row styles in sync with checked state
  els.skillReportAssignmentList?.querySelectorAll(".skill-assignment-card, .skill-assignment-row").forEach((row) => {
    const cb = row.querySelector("input[type='checkbox']");
    row.classList.toggle("is-selected", Boolean(cb?.checked));
  });

  // Update preview button text with dynamic live badge
  if (els.skillReportPreviewBtn) {
    const countText = ids.length > 0 ? `(${ids.length} İşletme / ${studentCount} Öğrenci)` : `(Tüm İşletmeler)`;
    els.skillReportPreviewBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span>Rapor Önizleme</span><small style="font-size: 0.76rem; opacity: 0.88; font-weight: 500;">${countText}</small>`;
  }

  if (els.skillReportPrecheckText) {
    if (activeSkillReportType === "daily") {
      const entryCount = getDailyGuidanceEntries(ids, startDate, endDate).length;
      els.skillReportPrecheckText.textContent = `${ids.length} işletme için ${entryCount} günlük rehberlik formu hazır.`;
    } else if (activeSkillReportType === "monthly") {
      els.skillReportPrecheckText.textContent = `${ids.length} işletme için ${formatSkillDate(startDate)} - ${formatSkillDate(endDate)} aralığında aylık rehberlik raporu hazır.`;
    } else if (activeSkillReportType === "termination") {
      const student = skillState.students.find((item) => item.id === els.skillTerminationStudent?.value);
      els.skillReportPrecheckText.textContent = els.skillTerminationBlank?.checked
        ? "Boş sözleşme iptal tutanağı şablonu hazır."
        : student
          ? `${student.no || "-"} ${student.name} için sözleşme iptal tutanağı hazır.`
          : "Öğrenci seçin veya boş şablon oluştur seçeneğini işaretleyin.";
    } else if (activeSkillReportType === "grades") {
      const typeLabel = els.skillGradeType?.value === "lise" ? "Meslek Liseleri Not Fişi" : "Mesleki Eğitim Not Fişi";
      els.skillReportPrecheckText.textContent = `${ids.length} işletme, ${studentCount} öğrenci için ${getGradeTermLabel()} ${typeLabel} hazır.`;
    } else if (activeSkillReportType === "wage") {
      const typeLabel = els.skillWageStudentType?.value === "lise" ? "Meslek lisesi" : "Mesem";
      els.skillReportPrecheckText.textContent = `${ids.length} işletme, ${studentCount} öğrenci için ${typeLabel} ücret raporu hazır.`;
    } else {
      els.skillReportPrecheckText.textContent = `${ids.length} işletme, ${studentCount} öğrenci için ${formatSkillDate(startDate)} - ${formatSkillDate(endDate)} aralığı hazır.`;
    }
  }
}

function updateSkillReportPerPageLabels() {
  if (!els.skillReportPerPage) return;
  let labels = { 1: "1 İşletme", 2: "2 İşletme" };
  if (activeSkillReportType === "monthly") {
    labels = { 1: "1 Form (Dikey)", 2: "2 Form (Yatay)" };
  } else if (activeSkillReportType === "daily") {
    labels = { 1: "1 Form (Tam Sayfa)", 2: "2 Form (Yarım Sayfa)" };
  }
  Array.from(els.skillReportPerPage.options).forEach((option) => {
    option.textContent = labels[option.value] || option.textContent;
  });
}

function syncTerminationOptionState() {
  if (!els.skillTerminationStudent) return;
  const blank = Boolean(els.skillTerminationBlank?.checked);
  els.skillTerminationStudent.disabled = blank;
  if (els.skillTerminationContractDate) els.skillTerminationContractDate.disabled = blank;
  if (els.skillTerminationCancelDate) els.skillTerminationCancelDate.disabled = blank;
  if (els.skillTerminationReasons) els.skillTerminationReasons.disabled = blank;

  const isNotice = els.skillTerminationTemplate?.value === "notice";
  if (els.skillTerminationNoticeFields) {
    els.skillTerminationNoticeFields.hidden = !isNotice;
    const noticeInputs = els.skillTerminationNoticeFields.querySelectorAll("input, select, textarea");
    noticeInputs.forEach((input) => {
      input.disabled = blank;
    });
  }
  if (els.skillStandardReasonsLabel) {
    els.skillStandardReasonsLabel.hidden = isNotice;
  }
}

function setSkillReportType(type) {
  activeSkillReportType = type || "absence";
  const isTermination = activeSkillReportType === "termination";
  const isGrade = activeSkillReportType === "grades";
  const isWage = activeSkillReportType === "wage";
  if (els.skillReportOptions) {
    els.skillReportOptions.classList.toggle("is-termination-report", isTermination);
    els.skillReportOptions.classList.toggle("is-grade-report", isGrade);
    els.skillReportOptions.classList.toggle("is-wage-report", isWage);
  }
  els.skillReportTabs?.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.skillReportTab === activeSkillReportType);
  });
  if (els.skillReportMobileSelect) {
    els.skillReportMobileSelect.value = activeSkillReportType;
  }
  const hideSharedDateControls = isTermination || isGrade || isWage;
  if (els.skillReportMonthPicker) {
    els.skillReportMonthPicker.hidden = hideSharedDateControls;
    els.skillReportMonthPicker.style.display = hideSharedDateControls ? "none" : "";
  }
  if (els.skillReportRangeRow) {
    els.skillReportRangeRow.hidden = hideSharedDateControls;
    els.skillReportRangeRow.style.display = hideSharedDateControls ? "none" : "";
  }
  els.skillReportDateRows?.forEach((row) => {
    row.hidden = hideSharedDateControls;
    row.style.display = hideSharedDateControls ? "none" : "";
  });
  if (els.skillReportNup) {
    els.skillReportNup.hidden = hideSharedDateControls;
    els.skillReportNup.style.display = hideSharedDateControls ? "none" : "";
  }
  if (els.skillAbsenceEntryBtn) {
    els.skillAbsenceEntryBtn.hidden = activeSkillReportType !== "absence";
    els.skillAbsenceEntryBtn.style.display = activeSkillReportType === "absence" ? "" : "none";
  }
  if (els.skillReportSymbolOptions) {
    const isAbsence = activeSkillReportType === "absence";
    els.skillReportSymbolOptions.hidden = !isAbsence;
    els.skillReportSymbolOptions.style.setProperty("display", isAbsence ? "" : "none", "important");
  }
  if (els.skillMonthlyOptions) {
    els.skillMonthlyOptions.hidden = activeSkillReportType !== "monthly";
  }
  if (els.skillTerminationOptions) {
    els.skillTerminationOptions.hidden = !isTermination;
  }
  if (els.skillGradeOptions) {
    els.skillGradeOptions.hidden = !isGrade;
  }
  if (els.skillWageOptions) {
    els.skillWageOptions.hidden = !isWage;
  }
  if (isGrade) updateGradeLayoutOptions();
  syncTerminationOptionState();
  updateSkillReportPerPageLabels();
  runSkillReportPrecheck();
}

function getDailyGuidanceEntries(ids, startDate, endDate) {
  const dates = getDatesBetween(startDate, endDate);
  return ids.flatMap((businessId) => {
    const business = getSkillBusiness(businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const reportSchool = getSkillSchoolForReport(coordinator);
    const deputyName = getSkillDeputyForReport(coordinator);
    const matchingDates = coordinator?.day
      ? dates.filter((date) => {
          if (String(date.getDay()) !== String(coordinator.day)) return false;
          return !isEntireWeekHoliday(date);
        })
      : dates.filter((date) => !isEntireWeekHoliday(date)).slice(0, 1);
    return matchingDates.map((date) => ({
      business,
      coordinator,
      students,
      reportSchool,
      deputyName,
      date,
      field: students.find((student) => student.field)?.field || "-"
    }));
  });
}

function buildDailyGuidanceReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("İşletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();
  const perPage = Number(els.skillReportPerPage?.value || 1);
  const pageClass = perPage === 2 ? "two-up" : "one-up";
  const entries = getDailyGuidanceEntries(ids, startDate, endDate);
  if (!entries.length) {
    showToast("Seçilen aralıkta günlük rehberlik görevi bulunamadı.", "warning");
    return "";
  }
  const cards = entries.map((entry) => `
    <section class="daily-guidance-card ${perPage === 2 ? "is-half" : ""}">
      <h1>İŞLETMELERDE MESLEK EĞİTİMİ GÜNLÜK REHBERLİK GÖREV FORMU</h1>
      <div class="daily-info">
        <div><span>İşletmenin Adı</span><b>:</b><strong>${escapeHtml(entry.business?.name || "-")}</strong></div>
        <div><span>İzlemede Sorumlu Olduğu Öğrenci Sayısı</span><b>:</b><strong>${entry.students.length}</strong></div>
        <div><span>Meslek Alan Dalı</span><b>:</b><strong>${escapeHtml(entry.field)}</strong></div>
        <div><span>Görev Tarihi</span><b>:</b><strong>${escapeHtml(formatGuidanceLongDate(entry.date))}</strong></div>
      </div>
      <div class="daily-body">
        <strong>Aylık Rehberlik Formuna Göre:</strong>
        <p>İşletmede öğrenim gören öğrencilerin eğitimini olumsuz yönde etkileyen hususlar (varsa yazınız):</p>
        <p>Belirlenen aksaklıklarla ilgili yapılan rehberlik ve alınan önlemler:</p>
        <p>Aylık rehberlik formunda belirtilmesinde yarar görülen hususlar:</p>
      </div>
      <div class="daily-signatures">
        <span><strong>İşletme Eğitim Yetkilisi</strong><small>İmza</small></span>
        <span><strong>Koordinatör Öğretmen</strong><small>${escapeHtml(entry.coordinator?.teacher || "-")}<br>İmza</small></span>
        <span><strong>Koordinatör Müdür Yardımcısı</strong><small>${escapeHtml(entry.deputyName)}<br>İmza</small></span>
      </div>
      <div class="daily-note"><strong>Açıklamalar:</strong> Bu form koordinatör öğretmen tarafından her görev için görev haftası başında koordinatör müdür yardımcısından alınır. Görev sonrasında okula geldiği gün içinde imzaları tamamlanmış olarak koordinatör müdür yardımcısına teslim edilir. Bu form Aylık Rehberlik Formu'nun doldurulmasında esas alınır ve rapora eklenir.</div>
    </section>
  `).join("");
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Gunluk_Rehberlik_Raporu_${getFormattedReportDate()}</title>
        <style>
          @page { size: A4 portrait; margin: 9mm 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .report-sheet { width: 194mm; margin: 0 auto; }
          .daily-guidance-card {
            display: flex;
            flex-direction: column;
            width: 194mm;
            height: 279mm;
            min-height: 0;
            border: 1.8px solid #111;
            break-after: page;
            page-break-after: always;
            background: #fff;
          }
          .daily-guidance-card.is-half {
            min-height: 0;
            height: 133.5mm !important;
            break-after: auto;
            page-break-after: auto;
            overflow: visible !important;
          }
          .daily-guidance-card.is-half:nth-child(odd) {
            margin: 0 0 12mm 0 !important;
          }
          .daily-guidance-card.is-half:nth-child(even) {
            position: relative;
            margin: 0 !important;
            break-after: page;
            page-break-after: always;
          }
          .daily-guidance-card.is-half:nth-child(even)::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: -6mm;
            border-top: 1px dashed #000 !important;
          }
          h1 {
            margin: 0;
            padding: 2mm 3mm;
            border-bottom: 1px solid #111;
            text-align: center;
            font-size: 18px;
            line-height: 1.1;
            font-weight: 800;
          }
          .daily-info {
            padding: 2mm 3mm;
            border-bottom: 1px solid #111;
            font-size: 14px;
            line-height: 1.35;
          }
          .daily-info div { display: grid; grid-template-columns: 70mm 5mm minmax(0, 1fr); align-items: baseline; }
          .daily-info span, .daily-info b { font-weight: 400; }
          .daily-info strong { font-size: 16px; font-weight: 400; }
          .daily-body {
            display: grid;
            grid-template-rows: auto repeat(3, 1fr);
            flex: 1 1 auto;
            padding: 2mm 3mm;
            border-bottom: 1px solid #111;
            font-size: 15px;
            line-height: 1.35;
          }
          .daily-body strong { display: block; margin: 0; font-size: 16px; }
          .daily-body p { margin: 0; padding-top: 5mm; }
          .daily-signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            flex: 0 0 28mm;
            min-height: 0;
            border-bottom: 1px solid #111;
            text-align: center;
            font-size: 15px;
          }
          .daily-signatures span { padding: 3mm 2mm 2mm; }
          .daily-signatures strong, .daily-signatures small { display: block; }
          .daily-signatures small { margin-top: 3mm; font-size: 14px; line-height: 1.35; }
          .daily-note {
            display: flex;
            align-items: center;
            flex: 0 0 22mm;
            padding: 2mm 3mm;
            font-size: 11px;
            line-height: 1.18;
          }
          .daily-guidance-card.is-half h1 { padding: 1.3mm 2mm; font-size: 14px; }
          .daily-guidance-card.is-half .daily-info { padding: 1.2mm 2mm; font-size: 11px; line-height: 1.25; }
          .daily-guidance-card.is-half .daily-info div { grid-template-columns: 69mm 4mm minmax(0, 1fr); }
          .daily-guidance-card.is-half .daily-info strong { font-size: 12px; }
          .daily-guidance-card.is-half .daily-body { padding: 1.6mm 2mm; font-size: 12.5px; }
          .daily-guidance-card.is-half .daily-body strong { font-size: 13px; }
          .daily-guidance-card.is-half .daily-body p { padding-top: 2.8mm; }
          .daily-guidance-card.is-half .daily-signatures { flex-basis: 22mm; min-height: 0; font-size: 12.5px; }
          .daily-guidance-card.is-half .daily-signatures small { margin-top: 2mm; font-size: 12px; }
          .daily-guidance-card.is-half .daily-note { flex-basis: 13mm; padding: 1mm 2mm; font-size: 8.4px; }
          @media screen {
            body { background: #dfe4e9; padding: 10mm 0; }
            .daily-guidance-card { margin-bottom: 10mm; }
          }
          @media print {
            body { background: #fff; }
            .report-sheet { width: auto; margin: 0; }
          }
        </style>
      </head>
      <body><main class="report-sheet ${pageClass}">${cards}</main></body>
    </html>
  `;
}

const monthlyGuidanceTopics = [
  {
    section: "A. Mesleki ve Teknik Eğitim Yönetmeliği ile ilgili konular:",
    question: "1. Usta öğreticilik/eğitici personelin yıllık eğitim planı (Gelişim Tablosu) var mı? Uyguluyor mu? Öğrencilere sürekli aynı işlem mi, rotasyona göre mi eğitim yaptırılıyor?",
    answer: "Gelişim Tablosu var. Uygulanıyor. Rotasyona göre eğitim yaptırılıyor."
  },
  { question: "2. Öğrencilerin günlük çalışmaları yıllık eğitim planına uygun olarak planlanmış mı?", answer: "Öğrencilerin çalışmaları planlanmış." },
  { question: "3. Öğrenci devam durumu günlük olarak takip ediliyor mu?", answer: "Devamsızlık günlük olarak takip ediliyor." },
  { question: "4. Meslek eğitimi çalışmaları puanla değerlendiriliyor mu?", answer: "Mesleki çalışmalar puanla değerlendiriliyor." },
  { question: "5. Yapılan işlerle ilgili olarak her öğrenciye iş dosyası tutuluyor mu?", answer: "Öğrenciler iş dosyası tutturuluyor." },
  { question: "6. Öğrencilere 3308 sayılı Kanunun 25 inci maddesine göre aylık ücret ödeniyor mu?", answer: () => (els.skillMonthlyWagePaid?.checked ? "Aylık ücret ödeniyor." : ".....") },
  { question: "7. Meslek eğitimi, çalışma saatlerinde yapılıyor mu?", answer: "Meslek eğitimi, çalışma saatlerinde yapılıyor." },
  { question: "8. İş güvenliği konusunda öğrencilere yeterli bilgi veriliyor ve gerekli tedbirler alınıyor mu?", answer: "Yeterli bilgi veriliyor ve gerekli tedbirler alınıyor." },
  { question: "9. Öğrenciler disiplin, kılık-kıyafet ve işletmenin kurallarına uyuyor mu?", answer: "Öğrenciler işletmenin kurallarına uyuyor." },
  { question: "10. Öğrencilerin telafi eğitimine alınması gerekiyor mu? Gerekiyorsa hangi konularda telafi eğitimi uygulanmalı?", answer: "Telafi eğitimine ihtiyaç yoktur." },
  {
    section: "B. Eğitici Personel ile ilgili konular:",
    question: "1. İşletmenin meslek eğitimi ile görevli personelinin usta öğreticilik belgesi var mı?",
    answer: () => (els.skillMonthlyMasterCert?.checked ? "Usta öğreticilik belgesi var" : ".....")
  },
  { question: "2. Eğitici personelin sorumlu olduğu öğrenci grubu sayısı Mesleki ve Teknik Eğitim Yönetmeliğinin 192 inci maddesine uygun mu?", answer: "Öğrenci grubu sayısı yönetmeliğe uygundur." },
  { question: "3. Meslek eğitimi konusunda koordinatör tarafından eğitici personele yapılan rehberlik ve konusu.", answer: "3308 Sayılı Kanun hakkında bilgi verildi. Staj dosyaları hakkında bilgi verildi." },
  { question: "4. Eğitici personelin geliştirme ve uyum kursuna ihtiyacı var mı?", answer: "Uyum kursuna ihtiyaç yoktur." },
  {
    section: "C. İşletme ile ilgili konular:",
    question: "1. İşletmelerde meslek eğitimi, yıllık çalışma takvimine uygun olarak sürdürülüyor mu?",
    answer: "Yıllık çalışma takvimine uygundur."
  },
  { question: "2. İşletmede meslek eğitiminin mevzuata göre sürdürülmesi ile ilgili gerekli tedbirler alınıyor mu? (Meslekî ve Teknik Eğitim Yönetmeliği madde 196.)", answer: "Gerekli tedbirler alınıyor." },
  { question: "3. Okul/kurum, öğretim programlarını (Gelişim Tablosu) işletmeye verdi mi?", answer: "Gelişim tablosu işletmeye verildi." },
  { question: "4. Öğrenciler için gelişim tablosu uygulanıyor mu?", answer: "Gelişim tablosu uygulanıyor." },
  { question: "5. İşletme yetkililerinin meslek eğitiminin uygulanışı ve öğretim programları konusundaki görüş ve önerileri:", answer: "__________" },
  { section: "D. Açıklanması gereken diğer hususlar:", question: "", answer: "__________" }
];

function getMonthlyGuidanceEntries(ids, startDate, endDate) {
  const dates = getDatesBetween(startDate, endDate);
  return ids.map((businessId) => {
    const business = getSkillBusiness(businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const reportSchool = getSkillSchoolForReport(coordinator);
    const matchingDates = coordinator?.day
      ? dates.filter((date) => {
          if (String(date.getDay()) !== String(coordinator.day)) return false;
          return !isEntireWeekHoliday(date);
        })
      : dates.filter((date) => !isEntireWeekHoliday(date));
    return {
      business,
      coordinator,
      students,
      reportSchool,
      dates: matchingDates,
      field: students.find((student) => student.field)?.field || skillState.fields?.[0]?.area || "-",
      studentLine: students.map((student) => `${student.no || "-"} ${student.name}`).join(", ") || "-"
    };
  });
}

function buildMonthlyGuidanceRows() {
  const autoFill = Boolean(els.skillMonthlyAutoFill?.checked);
  return monthlyGuidanceTopics.map((item) => {
    const answer = typeof item.answer === "function" ? item.answer() : item.answer;
    return `
      <tr>
        <td>${item.section ? `<strong>${escapeHtml(item.section)}</strong><br>` : ""}${escapeHtml(item.question)}</td>
        <td>${escapeHtml(autoFill ? answer : "")}</td>
      </tr>
    `;
  }).join("");
}

function formatMonthlyGuidanceDates(dates) {
  if (!dates.length) return "-";
  return dates.map((date) => formatGuidanceDate(date)).join("<br>");
}

function buildMonthlyGuidanceReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("İşletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();
  const perPage = Number(els.skillReportPerPage?.value || 1);
  const entries = getMonthlyGuidanceEntries(ids, startDate, endDate);
  const pageClass = perPage === 2 ? "two-up" : "one-up";
  const rows = buildMonthlyGuidanceRows();

  let pagesHtml = "";

  const renderCard = (entry) => `
    <section class="monthly-guidance-card">
      <header>
        <h1>İŞLETMELERDE MESLEK EĞİTİMİ KOORDİNATÖRLERİNİN İŞLETMEYE YAPACAĞI<br>AYLIK REHBERLİK RAPOR FORMU</h1>
        <h2>${escapeHtml(entry.reportSchool?.name || "OKUL ADI")} MÜDÜRLÜĞÜ'NE</h2>
      </header>
      <p class="monthly-intro">Okulumuz <strong>${escapeHtml(entry.field)}</strong> alanı/dalı öğrencilerinin meslek eğitimi gördüğü işletmelerde yapmış olduğum bir aylık koordinatörlük görevlerim sırasında tespit ettiğim hususlar aşağıda belirtilmiştir.</p>
      <p class="monthly-request">Gereğini bilgilerinize arz ederim.</p>
      <div class="monthly-business-student-box">
        <div class="info-column">
          <span class="info-label">İşletmenin Adı ve Adresi:</span>
          <span class="info-value">
            <strong class="highlight-business-name">${escapeHtml(entry.business?.name || "-")}</strong>
            <span class="business-address"> / ${escapeHtml(entry.business?.address || "-")}</span>
          </span>
        </div>
        <div class="info-column">
          <span class="info-label">Öğrencilerin Adı Soyadı:</span>
          <span class="info-value"><strong class="highlight-student">${escapeHtml(entry.studentLine)}</strong></span>
        </div>
      </div>
      <div class="monthly-people">
        <span class="signature-cell">
          <span class="signature-name">..................................................</span>
          <span class="signature-title">İşletme Eğitim Yetkilisi</span>
        </span>
        <span class="signature-cell">
          <span class="signature-name">${entry.coordinator?.teacher ? escapeHtml(entry.coordinator.teacher) : ".................................................."}</span>
          <span class="signature-title">Koordinatör Öğretmen</span>
        </span>
        <span class="dates-cell">
          <span class="signature-title" style="text-decoration: underline; margin-bottom: 3.5px;">GÖREV TARİHLERİ</span>
          <small>${formatMonthlyGuidanceDates(entry.dates)}</small>
        </span>
      </div>
      <table>
        <thead><tr><th>Koordinatörün Rehberlik Yaptığı Konular</th><th>Değerlendirme ve Öneriler</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="monthly-note">Açıklama: Bu form her işletme için her ay ayrı ayrı doldurulacak, kurum idaresine verilecektir.</p>
    </section>
  `;

  if (perPage === 2) {
    for (let i = 0; i < entries.length; i += 2) {
      const pageEntries = entries.slice(i, i + 2);
      const pageCards = pageEntries.map(renderCard).join("");
      pagesHtml += `
        <div class="report-page">
          <main class="report-sheet two-up">${pageCards}</main>
        </div>
      `;
    }
  } else {
    pagesHtml = entries.map((entry) => `
      <div class="report-page">
        <main class="report-sheet one-up">${renderCard(entry)}</main>
      </div>
    `).join("");
  }

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Aylik_Rehberlik_Raporu_${getFormattedReportDate()}</title>
        <style>
          @page { size: ${perPage === 2 ? "A4 landscape" : "A4 portrait"}; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .report-sheet.one-up { width: 194mm; margin: 0 auto; padding-top: 8mm; }
          .report-sheet.two-up { width: 287mm; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; padding-top: 5mm; }
          .monthly-guidance-card {
            height: ${perPage === 2 ? "190mm" : "272mm"} !important;
            padding: ${perPage === 2 ? "3mm" : "4mm"};
            border: 1.8px solid #111;
            background: #fff;
            font-size: ${perPage === 2 ? "7.2px" : "11px"};
            line-height: 1.18;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .report-page {
            box-sizing: border-box;
            break-after: page;
            page-break-after: always;
          }
          .report-page:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }
          header { text-align: center; margin-bottom: ${perPage === 2 ? "1.5mm" : "2mm"}; }
          h1 { margin: 0 0 ${perPage === 2 ? "1.5mm" : "2.5mm"}; font-size: ${perPage === 2 ? "10px" : "14px"}; line-height: 1.12; }
          h2 { margin: 0 0 ${perPage === 2 ? "2mm" : "4.5mm"}; font-size: ${perPage === 2 ? "8.8px" : "12px"}; }
          p { margin: 0 0 ${perPage === 2 ? "1.5mm" : "2.5mm"}; }
          .monthly-intro { text-indent: ${perPage === 2 ? "5mm" : "8mm"}; }
          .monthly-request { margin-top: 0; }
          .monthly-business-student-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: ${perPage === 2 ? "3mm" : "6mm"};
            margin: ${perPage === 2 ? "2mm 0" : "4mm 0"};
            border: 1px solid #111;
            padding: ${perPage === 2 ? "1.5mm 2mm" : "2.5mm 3.5mm"};
            font-size: ${perPage === 2 ? "7px" : "10px"};
            line-height: 1.25;
          }
          .info-column {
            display: flex;
            flex-direction: column;
            gap: ${perPage === 2 ? "0.5mm" : "1.2mm"};
          }
          .info-label {
            font-weight: 800;
            display: block;
            margin-bottom: ${perPage === 2 ? "0.4mm" : "0.8mm"};
          }
          .highlight-student, .highlight-business-name {
            font-weight: 900 !important;
            color: #000000 !important;
          }
          .business-address {
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .monthly-people {
            display: grid;
            grid-template-columns: 1.1fr 1.1fr 0.8fr;
            align-items: stretch;
            min-height: ${perPage === 2 ? "20mm" : "32mm"};
            margin: ${perPage === 2 ? "1.5mm 0" : "4mm 0"};
            text-align: center;
            border: 1.5px solid #111;
          }
          .monthly-people span.signature-cell {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            padding: ${perPage === 2 ? "1.5mm 1mm" : "3mm 2mm"};
            border-right: 1.5px solid #111;
          }
          .monthly-people span.dates-cell {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: ${perPage === 2 ? "1.5mm 1mm" : "2.5mm 2mm"};
          }
          .signature-name {
            font-weight: 800;
            margin-bottom: ${perPage === 2 ? "0.6mm" : "1.2mm"};
            text-align: center;
          }
          .signature-title {
            font-weight: bold;
            font-size: ${perPage === 2 ? "7px" : "9.8px"};
            text-align: center;
          }
          .dates-cell small {
            display: block;
            font-size: inherit;
            text-align: center;
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: ${perPage === 2 ? "7.2px" : "9.8px"}; line-height: 1.1; }
          th, td { border: 1px solid #111; padding: ${perPage === 2 ? "0.85mm 0.75mm" : "1.55mm 1.5mm"}; vertical-align: middle; }
          th:first-child, td:first-child { width: ${perPage === 2 ? "76%" : "59%"}; }
          th:last-child, td:last-child { width: ${perPage === 2 ? "24%" : "41%"}; }
          th { text-align: center; font-weight: 800; }
          td:last-child { font-style: ${els.skillMonthlyAutoFill?.checked ? "italic" : "normal"}; }
          .monthly-note { margin-top: ${perPage === 2 ? "3mm" : "4mm"}; }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
            .report-page { margin-bottom: 8mm; }
          }
          @media print {
            body { background: #fff; }
            .report-page {
              width: 100%;
              height: 100%;
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>${pagesHtml}</body>
    </html>
  `;
}

function getGradeReportSchoolYear() {
  return skillState.school?.year || "2025-2026";
}

function getGradeReportSchool(coordinator) {
  return getSkillSchoolForReport(coordinator) || skillState.schoolRecords?.[0] || skillState.school;
}

function getGradeReportPrincipal(school) {
  return school?.principal || skillState.schoolRecords?.[0]?.principal || "Okul/Kurum Müdürü";
}

function getBusinessGradeRows(students) {
  const rows = students.length ? students : [{ no: "", name: "", field: "" }];
  return rows.map((student) => `
    <tr>
      <td class="no-cell">${escapeHtml(student.no || "")}</td>
      <td class="name-cell">${escapeHtml(student.name || "")}</td>
      <td class="field-cell">${escapeHtml(student.field || "")}</td>
      ${Array.from({ length: 17 }, () => "<td></td>").join("")}
    </tr>
  `).join("");
}

function buildVocationalGradeReportHtml(ids) {
  const term = els.skillGradeTerm?.value === "2" ? "2. DÖNEM" : "1. DÖNEM";
  const isTwoPortrait = els.skillGradeLayout?.value === "two-portrait";
  const cards = ids.map((businessId) => {
    const business = getSkillBusiness(businessId);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const studentCount = students.length || 1;
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const school = getGradeReportSchool(coordinator);
    const deputy = getSkillDeputyForReport(coordinator);
    const principal = getGradeReportPrincipal(school);

    let fontSize = "10px";
    let h1Margin = "4mm";
    let h1Padding = "4mm 2mm";
    let h1FontSize = "17px";
    let infoMargin = "3mm";
    let infoFontSize = "10px";
    let tableFontSize = "9.2px";
    let rowHeight = "18mm";
    let rowPadding = "1.2mm";
    let sigMargin = "3mm";
    let sigHeight = "32mm";
    let sigStrongSize = "12px";
    let sigSmallSize = "11px";
    let noteMargin = "3mm";
    let notePadding = "2.5mm";
    let noteFontSize = "11px";

    if (isTwoPortrait) {
      // Default portrait sizes (for 1-3 students)
      fontSize = "8.2px";
      h1Margin = "2mm";
      h1Padding = "2mm 1mm";
      h1FontSize = "12px";
      infoMargin = "2mm";
      infoFontSize = "8.2px";
      tableFontSize = "7.2px";
      rowHeight = "16mm";
      rowPadding = ".8mm";
      sigMargin = "2.5mm";
      sigHeight = "28mm";
      sigStrongSize = "8.5px";
      sigSmallSize = "7.5px";
      noteMargin = "2mm";
      notePadding = "1.5mm";
      noteFontSize = "7.5px";

      if (studentCount > 7) {
        // Very high density scaling (8+ students)
        fontSize = "6.5px";
        h1Margin = "0.8mm";
        h1Padding = "0.8mm .4mm";
        h1FontSize = "9.5px";
        infoMargin = "0.8mm";
        infoFontSize = "6.5px";
        tableFontSize = "5.5px";
        rowHeight = "7mm";
        rowPadding = ".3mm";
        sigMargin = "1mm";
        sigHeight = "15mm";
        sigStrongSize = "6.5px";
        sigSmallSize = "6.0px";
        noteMargin = "0.8mm";
        notePadding = "0.8mm";
        noteFontSize = "6.0px";
      } else if (studentCount > 5) {
        // High density scaling (6-7 students)
        fontSize = "7.0px";
        h1Margin = "1mm";
        h1Padding = "1mm .5mm";
        h1FontSize = "10px";
        infoMargin = "1mm";
        infoFontSize = "7px";
        tableFontSize = "6.0px";
        rowHeight = "9mm";
        rowPadding = ".4mm";
        sigMargin = "1.5mm";
        sigHeight = "18mm";
        sigStrongSize = "7.2px";
        sigSmallSize = "6.5px";
        noteMargin = "1mm";
        notePadding = "1mm";
        noteFontSize = "6.5px";
      } else if (studentCount > 3) {
        // Medium density scaling (4-5 students)
        fontSize = "7.6px";
        h1Margin = "1.5mm";
        h1Padding = "1.5mm 1mm";
        h1FontSize = "11px";
        infoMargin = "1.5mm";
        infoFontSize = "7.5px";
        tableFontSize = "6.6px";
        rowHeight = "12mm";
        rowPadding = ".6mm";
        sigMargin = "2mm";
        sigHeight = "23mm";
        sigStrongSize = "7.8px";
        sigSmallSize = "7.0px";
        noteMargin = "1.5mm";
        notePadding = "1.2mm";
        noteFontSize = "7.0px";
      }
    }

    return `
      <section class="grade-vocational-card ${isTwoPortrait ? "is-half" : ""}" style="
        --card-font-size: ${fontSize};
        --h1-margin: ${h1Margin};
        --h1-padding: ${h1Padding};
        --h1-font-size: ${h1FontSize};
        --info-margin: ${infoMargin};
        --info-font-size: ${infoFontSize};
        --table-font-size: ${tableFontSize};
        --row-height: ${rowHeight};
        --row-padding: ${rowPadding};
        --sig-margin: ${sigMargin};
        --sig-height: ${sigHeight};
        --sig-strong-size: ${sigStrongSize};
        --sig-small-size: ${sigSmallSize};
        --note-margin: ${noteMargin};
        --note-padding: ${notePadding};
        --note-font-size: ${noteFontSize};
      ">
        <h1>İŞLETMELERDE MESLEK EĞİTİMİ GÖREN ÖĞRENCİLERE AİT ${escapeHtml(term)} PUAN FİŞİ</h1>
        <table class="grade-info-table">
          <tr>
            <th>Okul/Kurum Adı :</th><td>${escapeHtml(school?.name || "")}</td>
            <th>Dersin Adı :</th><td>İşletmelerde Meslek Eğitimi</td>
          </tr>
          <tr>
            <th>ÖğretimYılı :</th><td>${escapeHtml(getGradeReportSchoolYear())}</td>
            <th>Tarih :</th><td></td>
          </tr>
          <tr>
            <th>İşletmenin Adı :</th><td>${escapeHtml(business?.name || "")}</td>
            <th>Koord. Öğrt. :</th><td>${escapeHtml(coordinator?.teacher || "")}</td>
          </tr>
        </table>
        <table class="grade-score-table">
          <colgroup>
            <col class="no-col">
            <col class="name-col">
            <col class="field-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="grade-col"><col class="grade-col"><col class="grade-col">
            <col class="score-col">
            <col class="score-col">
            <col class="score-col">
            <col class="score-col">
            <col class="write-col">
          </colgroup>
          <thead>
            <tr>
              <th colspan="3">Öğrencinin</th>
              <th colspan="12">İşletmede Verilen Puanlar</th>
              <th colspan="2">Okulda<br>Verilen<br>Puanlar</th>
              <th colspan="3">Dönem<br>Başarısı</th>
            </tr>
            <tr>
              <th class="no-cell"><div class="vertical-text">Numarası</div></th>
              <th class="name-cell">Adı Soyadı</th>
              <th class="field-cell">Alan Dalı</th>
              <th colspan="3" class="grade-header-cell">Temrin</th>
              <th colspan="3" class="grade-header-cell">İş-Hizmet</th>
              <th colspan="3" class="grade-header-cell">Proje</th>
              <th colspan="3" class="grade-header-cell">Deney</th>
              <th class="score-cell"><div class="vertical-text">Telafi Eğitim<br>Puanı(*)</div></th>
              <th class="score-cell"><div class="vertical-text">Beceri Sınav<br>Puanı(*)</div></th>
              <th class="score-cell"><div class="vertical-text">Dönem<br>Puan Ort.</div></th>
              <th class="score-cell"><div class="vertical-text">Rakamla</div></th>
              <th class="write-cell"><div class="vertical-text">Yazıyla</div></th>
            </tr>
          </thead>
          <tbody>${getBusinessGradeRows(students)}</tbody>
        </table>
        <div class="grade-signatures">
          <span><strong>Usta Öğretici / İşletme Yetkilisi</strong><small>Kaşe - İmza</small></span>
          <span><strong>Eğitici Personel</strong><small>Kaşe - İmza</small></span>
          <span><strong>Koordinatör<br>Müdür Yardımcısı</strong><small>${escapeHtml(deputy)}</small></span>
          <span><strong>Okul/Kurum Müdürü</strong><small>${escapeHtml(principal)}</small></span>
        </div>
        <p class="grade-note"><strong>AÇIKLAMA :</strong> (*) işaretli bölümler okul/kurum müdürlüğünce doldurulacak ve puan ortalaması alınarak dönem ortalaması belirlenecektir.</p>
      </section>
    `;
  }).join("");

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Not_Cizelgesi_${getFormattedReportDate()}</title>
        <style>
          @page { size: ${isTwoPortrait ? "A4 portrait" : "A4 landscape"}; margin: ${isTwoPortrait ? "9mm 8mm" : "8mm"}; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .grade-vocational-sheet { width: 100%; margin: 0 auto; }
          .grade-vocational-card {
            width: 100%;
            height: ${isTwoPortrait ? "139.5mm" : "186mm"};
            margin: 0 auto;
            break-after: ${isTwoPortrait ? "auto" : "page"};
            page-break-after: ${isTwoPortrait ? "auto" : "always"};
            font-size: var(--card-font-size);
            display: ${isTwoPortrait ? "flex" : "block"};
            flex-direction: ${isTwoPortrait ? "column" : "row"};
            justify-content: ${isTwoPortrait ? "center" : "normal"};
            overflow: hidden;
            box-sizing: border-box;
            background: #fff;
          }
          .grade-vocational-card > * {
            flex-shrink: 0;
          }
          .grade-vocational-card.is-half:nth-child(even) {
            border-top: 1px dashed #000 !important;
            break-after: page;
            page-break-after: always;
          }
          .grade-vocational-card h1 {
            margin: 0 0 var(--h1-margin);
            padding: var(--h1-padding);
            border: 1px solid #000;
            text-align: center;
            font-size: var(--h1-font-size);
            line-height: 1.12;
            font-weight: 800;
            letter-spacing: .2px;
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #000; padding: var(--row-padding); vertical-align: middle; }
          .grade-info-table { margin-bottom: var(--info-margin); font-size: var(--info-font-size); }
          .grade-info-table th { width: 18%; text-align: left; background: #f2f2f2; font-weight: 800; }
          .grade-info-table td { width: 32%; }
          .grade-score-table { font-size: var(--table-font-size); line-height: 1.04; }
          .grade-score-table thead th { background: #efefef; text-align: center; font-weight: 800; }
          .grade-score-table tbody td { height: var(--row-height); padding: var(--row-padding); }
          .grade-score-table .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; display: inline-block; }
          .grade-score-table .no-col { width: ${isTwoPortrait ? "5mm" : "7.5mm"}; }
          .grade-score-table .name-col { width: ${isTwoPortrait ? "24mm" : "30mm"}; }
          .grade-score-table .field-col { width: ${isTwoPortrait ? "20mm" : "25mm"}; }
          .grade-score-table .grade-col, .grade-score-table .score-col, .grade-score-table .write-col { width: ${isTwoPortrait ? "8.5mm" : "12mm"}; }
          .grade-score-table .no-cell { text-align: center; }
          .grade-score-table .field-cell { font-size: calc(var(--table-font-size) - 1px); }
          .grade-signatures {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            margin-top: var(--sig-margin);
            border: 1px solid #000;
            border-right: 0;
            min-height: var(--sig-height);
            text-align: center;
          }
          .grade-signatures span {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1mm;
            border-right: 1px solid #000;
            padding: var(--row-padding);
          }
          .grade-signatures strong { font-size: var(--sig-strong-size); line-height: 1.05; }
          .grade-signatures small { font-size: var(--sig-small-size); }
          .grade-note {
            margin: var(--note-margin) 0 0;
            padding: var(--note-padding);
            border: 1px solid #000;
            font-size: var(--note-font-size);
          }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
            .grade-vocational-sheet { width: ${isTwoPortrait ? "194mm" : "281mm"}; }
            .grade-vocational-card { background: #fff; margin-bottom: ${isTwoPortrait ? "5mm" : "8mm"}; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          }
          @media print {
            html, body { margin: 0; padding: 0; }
            body { background: #fff; }
            .grade-vocational-card:last-child { break-after: auto !important; page-break-after: auto !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            th, td {
              border: 1px solid #000 !important;
            }
          }
        </style>
      </head>
      <body><main class="grade-vocational-sheet">${cards}</main></body>
    </html>
  `;
}

function getHighSchoolGradeStudentCards(ids) {
  const criteria = [
    "Kavrama Yeteneği",
    "Öğrendiklerini Uygulama Becerisi",
    "Verilen görevleri tek başına yapabilme",
    "Tertip, Düzen, Tasarruf, Temizlik Durumu",
    "Dilbilgisini geliştirme, araştırma, mesleğe uygunluğu",
    "Beşeri İlişkiler (Amirlerine, 3.Şahıslara Karşı)",
    "İş Pratiğindeki Becerisi",
    "İş ve Çalışma Saatlerine Bağlılığı",
    "Kılık ve Kıyafet Kurallarına Uyma",
    "Güvenirliği"
  ];
  const scores = [
    ["Pekiyi", "85,00 - 100"],
    ["İyi", "70,00 - 84,99"],
    ["Orta", "60,00 - 69,99"],
    ["Geçer", "50,00 - 59,99"],
    ["Geçmez", "0 - 49,99"]
  ];
  const students = skillState.students.filter((student) => ids.includes(student.businessId));
  const rows = students.length ? students : [{ no: "", name: "", className: "", field: "", businessId: ids[0] || "" }];
  return rows.map((student) => {
    const business = getSkillBusiness(student.businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === student.businessId);
    const school = getGradeReportSchool(coordinator);
    const term = els.skillGradeTerm?.value === "2" ? "2. YARIYIL" : "1. YARIYIL";
    return `
      <section class="grade-high-card">
        <header>
          <h1>${escapeHtml(school?.name || "OKUL ADI")}</h1>
          <h2>${escapeHtml(getGradeReportSchoolYear())} EĞİTİM ÖĞRETİM YILI ${escapeHtml(term)}</h2>
          <h3>İŞLETMELERDE MESLEKİ EĞİTİM YAPAN ÖĞRENCİLERİN İŞYERİ DEĞERLENDİRME BELGESİ</h3>
        </header>
        <table class="high-student-table">
          <colgroup><col class="student-label-col"><col class="student-value-col"><col class="student-empty-col"></colgroup>
          <thead><tr><th colspan="3">ÖĞRENCİNİN</th></tr></thead>
          <tbody>
            <tr><th>Adı ve Soyadı</th><td>${escapeHtml(student.name || "")}</td><td rowspan="6"></td></tr>
            <tr><th>Okul No</th><td>${escapeHtml(student.no || "")}</td></tr>
            <tr><th>Sınıfı</th><td>${escapeHtml(student.className || "")}</td></tr>
            <tr><th>Alanı/Dalı</th><td>${escapeHtml(student.field || "")}</td></tr>
            <tr><th>Koordinatör Öğretmen</th><td>${escapeHtml(coordinator?.teacher || "")}</td></tr>
            <tr><th>İşletme</th><td>${escapeHtml(business?.name || "")}</td></tr>
          </tbody>
        </table>
        <table class="high-evaluation-table">
          <thead><tr><th>DEĞERLENDİRME</th><th>PUAN</th></tr></thead>
          <tbody>
            ${criteria.map((item, index) => `<tr><td>${index + 1}. ${escapeHtml(item)}</td><td></td></tr>`).join("")}
            <tr><th>Toplam Puan</th><td></td></tr>
            <tr><th>Dönem Puanı</th><td></td></tr>
          </tbody>
        </table>
        <div class="high-footer-grid">
          <table>
            <thead><tr><th colspan="2">Değerlendirme Esasları</th></tr></thead>
            <tbody>${scores.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody>
          </table>
          <div>Yukarıdaki çizelgede her şık 100 puan üzerinden değerlendirilecek, değerlendirme toplamının değerlendirme sayısına bölünmesi neticesi beceri puanı bulunacaktır.</div>
          <div>...../...../20....<br><br>Yetkili Adı Soyadı<br>Ünvanı&nbsp;&nbsp;Tarih<br>İmza-Mühür</div>
        </div>
      </section>
    `;
  }).join("");
}

function buildHighSchoolGradeReportHtml(ids) {
  const cards = getHighSchoolGradeStudentCards(ids);
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Not_Cizelgesi_${getFormattedReportDate()}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .grade-high-card { width: 194mm; min-height: 281mm; margin: 0 auto; break-after: page; page-break-after: always; font-size: 13.6px; }
          .grade-high-card header { margin-bottom: 7mm; padding: 4mm 3mm; border: 2px solid #111; text-align: center; font-weight: 800; }
          .grade-high-card h1, .grade-high-card h2, .grade-high-card h3 { margin: 0; font-size: 18px; line-height: 1.08; }
          .grade-high-card h3 { margin-top: .8mm; }
          .grade-high-card table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .grade-high-card th, .grade-high-card td { border: 1px solid #111; padding: 1.65mm; vertical-align: middle; }
          .high-student-table { border: 2px solid #111; margin-bottom: 7mm; font-size: 15px; }
          .high-student-table .student-label-col { width: 49mm; }
          .high-student-table .student-empty-col { width: 42mm; }
          .high-student-table .student-value-col { width: auto; }
          .high-student-table thead th { text-align: center; font-size: 17px; padding: 1.8mm; }
          .high-student-table tbody th { text-align: left; font-weight: 800; }
          .high-evaluation-table { border: 2px solid #111; font-size: 14px; }
          .high-evaluation-table thead th { font-size: 16px; text-align: left; }
          .high-evaluation-table thead th:last-child { width: 32mm; text-align: center; }
          .high-evaluation-table td, .high-evaluation-table th { height: 8.15mm; padding: 1.35mm; }
          .high-evaluation-table tbody td:last-child { width: 32mm; }
          .high-footer-grid { display: grid; grid-template-columns: 63mm 1fr 63mm; margin-top: 7mm; border: 2px solid #111; border-right: 0; min-height: 43mm; font-size: 13.3px; text-align: center; }
          .high-footer-grid > div { border-right: 2px solid #111; padding: 2.5mm; display: flex; align-items: center; justify-content: center; }
          .high-footer-grid > table { height: 100%; border: 0; border-right: 2px solid #111; }
          .high-footer-grid table th, .high-footer-grid table td { border: 1px solid #111; padding: 1.05mm; text-align: left; }
          .high-footer-grid table th { text-align: center; }
          @media screen { body { background: #dfe4e9; padding: 8mm 0; } .grade-high-card { background: #fff; margin-bottom: 8mm; } }
          @media print {
            body { background: #fff; }
            .grade-high-card:last-child { break-after: auto; page-break-after: auto; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>${cards}</body>
    </html>
  `;
}

function buildGradeReportHtml() {
  const ids = getGradeReportBusinessIds();
  if (!ids.length) {
    showToast("Not çizelgesi için işletme kaydı bulunamadı.", "warning");
    return "";
  }
  return els.skillGradeType?.value === "lise"
    ? buildHighSchoolGradeReportHtml(ids)
    : buildVocationalGradeReportHtml(ids);
}

function parseSkillMoney(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatSkillMoney(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function renderWageManualDialog() {
  if (!els.skillWageManualTable) return;
  const ids = getFlexibleReportBusinessIds();
  const students = skillState.students.filter((student) => ids.includes(student.businessId));
  els.skillWageManualTable.innerHTML = students.map((student) => {
    const business = getSkillBusiness(student.businessId);
    const value = skillState.wageManualAbsences?.[student.id] ?? "";
    return `
      <tr>
        <td>${escapeHtml(business?.name || "-")}</td>
        <td>${escapeHtml(student.no || "-")}</td>
        <td>${escapeHtml(student.name || "-")}</td>
        <td>${escapeHtml(student.className || "-")}</td>
        <td><input type="number" min="0" max="30" step="1" value="${escapeHtml(value)}" data-wage-manual-student="${escapeHtml(student.id)}" /></td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5">Öğrenci kaydı yok.</td></tr>`;
  updateWageManualSummary();
}

function updateWageManualSummary() {
  if (!els.skillWageManualSummary) return;
  const inputs = Array.from(els.skillWageManualTable?.querySelectorAll("[data-wage-manual-student]") || []);
  const filled = inputs.filter((input) => String(input.value || "").trim() !== "").length;
  els.skillWageManualSummary.textContent = `Girilen: ${filled} / ${inputs.length} öğrenci`;
}

function openWageManualDialog() {
  renderWageManualDialog();
  els.skillWageManualDialog?.showModal();
}

function closeWageManualDialog() {
  if (els.skillWageManualDialog?.open) els.skillWageManualDialog.close();
}

function clearWageManualInputs() {
  els.skillWageManualTable?.querySelectorAll("[data-wage-manual-student]").forEach((input) => {
    input.value = "";
  });
  updateWageManualSummary();
}

function saveWageManualAbsences(event) {
  event.preventDefault();
  if (!skillState.wageManualAbsences || Array.isArray(skillState.wageManualAbsences)) skillState.wageManualAbsences = {};
  els.skillWageManualTable?.querySelectorAll("[data-wage-manual-student]").forEach((input) => {
    const studentId = input.dataset.wageManualStudent;
    const raw = String(input.value || "").trim();
    if (!raw) {
      delete skillState.wageManualAbsences[studentId];
      return;
    }
    const value = Math.max(0, Math.min(30, Number(raw) || 0));
    skillState.wageManualAbsences[studentId] = value;
  });
  saveSkillState();
  closeWageManualDialog();
  runSkillReportPrecheck();
  showToast("Manuel devamsızlık değerleri kaydedildi.");
}

function getWageAbsenceForStudent(student) {
  if (!els.skillWageManualAbsence?.checked) return 0;
  const value = skillState.wageManualAbsences?.[student.id];
  return Number.isFinite(Number(value)) ? Math.max(0, Math.min(30, Number(value))) : 0;
}

function getWageSupportAmount({ studentType, business, monthlyAmount }) {
  if (studentType === "mesem") return monthlyAmount;
  return business?.group === "2" ? monthlyAmount / 3 : (monthlyAmount * 2) / 3;
}

function buildWageReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("Ücret raporu için işletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();
  const studentType = els.skillWageStudentType?.value || "mesem";
  const minimumWage = parseSkillMoney(els.skillWageMinimumNet?.value) || 28250;
  const monthlyAmount = minimumWage * 0.3;
  const rows = skillState.students
    .filter((student) => ids.includes(student.businessId))
    .map((student) => {
      const business = getSkillBusiness(student.businessId);
      const absenceDays = getWageAbsenceForStudent(student, startDate, endDate);
      const deduction = Math.min(monthlyAmount, (monthlyAmount / 30) * absenceDays);
      const net = Math.max(0, monthlyAmount - deduction);
      const support = getWageSupportAmount({ studentType, business, monthlyAmount: net });
      return { student, business, absenceDays, deduction, net, support };
    });
  const rateLabel = studentType === "mesem"
    ? "Oran: Mesem: %30"
    : "Oran: Meslek lisesi: %30";
  const rowHtml = rows.map(({ student, business, absenceDays, deduction, net, support }) => `
    <tr>
      <td>${escapeHtml(business?.name || "-")}</td>
      <td>${escapeHtml(student.no || "-")}</td>
      <td>${escapeHtml(student.name || "-")}</td>
      <td class="field-col">${escapeHtml((student.field || "-").toLocaleUpperCase("tr-TR"))}</td>
      <td class="number">${escapeHtml(absenceDays)}</td>
      <td class="money">${escapeHtml(formatSkillMoney(monthlyAmount))}</td>
      <td class="money">${escapeHtml(formatSkillMoney(deduction))}</td>
      <td class="money">${escapeHtml(formatSkillMoney(net))}</td>
      <td class="money">${escapeHtml(formatSkillMoney(support))}</td>
    </tr>
  `).join("") || `<tr><td colspan="9">Seçilen aralık için öğrenci kaydı yok.</td></tr>`;

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Ucret_Raporu_${getFormattedReportDate()}</title>
        <style>
          @page { size: A4 landscape; margin: 6mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #111; background: #fff; }
          .wage-sheet { width: 285mm; min-height: 196mm; margin: 0 auto; position: relative; padding: 2mm 0 10mm; overflow: hidden; }
          .wage-header { display: grid; grid-template-columns: 1fr auto; gap: 8mm; align-items: end; margin-bottom: 4mm; font-size: 10px; }
          .wage-header h1 { margin: 0 0 1mm; font-size: 11px; line-height: 1.1; }
          .wage-header p { margin: 0 0 1.6mm; color: #555; }
          .wage-header strong { display: block; margin-top: 3mm; font-weight: 500; color: #111; }
          .wage-rate { align-self: center; font-size: 10px; white-space: nowrap; }
          .wage-line { height: 1px; background: #222; margin-bottom: 5mm; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9.7px; }
          th { padding: .9mm 1mm; border: 1px solid #bcbcbc; background: #eeeeee; text-align: center; font-size: 9.4px; }
          td { padding: 2mm 1mm 1.1mm; border-bottom: 1px solid #d2d2d2; vertical-align: top; line-height: 1.12; }
          th:nth-child(1), td:nth-child(1) { width: 38mm; }
          th:nth-child(2), td:nth-child(2) { width: 16mm; }
          th:nth-child(3), td:nth-child(3) { width: 55mm; }
          th:nth-child(4), td:nth-child(4) { width: 34mm; }
          th:nth-child(5), td:nth-child(5) { width: 12mm; }
          th:nth-child(6), td:nth-child(6),
          th:nth-child(7), td:nth-child(7),
          th:nth-child(8), td:nth-child(8) { width: 23mm; }
          th:nth-child(9), td:nth-child(9) { width: 26mm; }
          .number, .money { text-align: right; white-space: nowrap; }
          .field-col { font-size: 7.8px; line-height: 1.02; word-break: break-word; }
          .wage-brand { position: absolute; left: 0; right: 0; bottom: 1mm; text-align: center; color: #666; font-size: 9px; }
          @media screen { body { background: #dfe4e9; padding: 8mm 0; } .wage-sheet { background: #fff; } }
          @media print { body { background: #fff; } }
        </style>
      </head>
      <body>
        <main class="wage-sheet">
          <header class="wage-header">
            <div>
              <h1>ÜCRET ÖDEME RAPORU</h1>
              <p>${escapeHtml(formatSkillDate(startDate))} - ${escapeHtml(formatSkillDate(endDate))}</p>
              <strong>Asgari (Net): ${escapeHtml(formatSkillMoney(minimumWage))}</strong>
            </div>
            <div class="wage-rate">${escapeHtml(rateLabel)}</div>
          </header>
          <div class="wage-line"></div>
          <table>
            <thead>
              <tr>
                <th>İşletme</th>
                <th>No</th>
                <th>Ad Soyad</th>
                <th>Alan</th>
                <th>Dev.</th>
                <th>Aylık</th>
                <th>Kesinti</th>
                <th>Net</th>
                <th>Devlet Desteği</th>
              </tr>
            </thead>
            <tbody>${rowHtml}</tbody>
          </table>
          <div class="wage-brand">İme Evrak</div>
        </main>
      </body>
    </html>
  `;
}

function formatTerminationReportDate(value) {
  return value ? formatSkillDate(value) : "....../....../20....";
}

function buildTerminationReasonLines(reason) {
  const text = String(reason || "").trim();
  const lines = text ? escapeHtml(text).replace(/\n/g, "<br>") : "";
  return `<div class="termination-reasons">${lines}${Array.from({ length: text ? 3 : 5 }, () => "<span></span>").join("")}</div>`;
}

function buildNoticeTerminationReportHtml() {
  const blank = Boolean(els.skillTerminationBlank?.checked);
  const student = blank ? null : skillState.students.find((item) => item.id === els.skillTerminationStudent?.value);
  if (!blank && !student) {
    showToast("Fesih raporu için öğrenci seçin veya boş şablon oluşturun.", "warning");
    return "";
  }
  const business = student ? getSkillBusiness(student.businessId) : null;
  const coordinator = student ? skillState.coordinators.find((item) => item.businessId === student.businessId) : null;
  const reportSchool = getSkillSchoolForReport(coordinator);
  const principalName = reportSchool?.principal || skillState.schoolRecords?.[0]?.principal || "Okul Müdürü";
  const deputyName = reportSchool?.deputy || skillState.schoolRecords?.[0]?.deputy || "Müdür Yardımcısı";
  const coordinatorName = coordinator?.teacher || "Koordinatör Öğretmen";
  
  const studentName = blank ? "" : (student.name || "");
  const studentClass = blank ? "" : (student.className || "");
  const studentNo = blank ? "" : (student.no || "0");
  const studentTc = blank ? "" : (els.skillTerminationStudentTc?.value || "");
  const studentBranch = blank ? "" : (student.field || "");
  
  const veliName = blank ? "" : (els.skillTerminationVeliName?.value || "");
  const veliPhone = blank ? "" : (els.skillTerminationVeliPhone?.value || "");
  const veliAddress = blank ? "" : (els.skillTerminationVeliAddress?.value || "");
  
  const businessAddress = blank ? "" : (business?.address || "");
  const businessPhoneVal = blank ? "" : (business?.phone || "");

  const selectedReasonCode = els.skillTerminationReasonCode?.value || "";
  const selectedReasonCodeSuffix = selectedReasonCode ? selectedReasonCode.replace("24-", "") : "......";
  
  const reasonList = [
    { code: "24-a", text: "İşletmenin kapanması" },
    { code: "24-b", text: "İşletmenin iş sağlığı ve Güvenliği yükümlülüklerini yerine getirmemesi" },
    { code: "24-c", text: "İşletmenin ücret ödeme yükümlülüğünü yerine getirmemesi" },
    { code: "24-ç", text: "İşletmenin ücretli izin yükümlülüğünü yerine getirmemesi" },
    { code: "24-d", text: "Öğrenciden öğretim programında belirtilen gün ve saatler dışında (gece çalışması dahil) mesleki eğitim/staja devam etmesinin talep edilmesi" },
    { code: "24-e", text: "İşletmenin, öğrenciyi öğretim programında yer almayan işlerde sürekli ve sistematik biçimde çalıştırması" },
    { code: "24-f", text: "İşletmenin araç, ekipman vb. bakımından eğitim programına uygunluğunu kaybetmesi" },
    { code: "24-g", text: "İşletmede görevlendirilen eğitici personel/usta öğreticinin, öğrencinin mesleki eğitim faaliyetlerini mevzuata ve öğretim programına uygun şekilde yürütmemesi veya yeterli rehberlik sağlaması" },
    { code: "24-ğ", text: "İşletmedeki eğitici personel/usta öğreticinin işten ayrılması (ölüm, istifa, emeklilik vb.)" },
    { code: "24-h", text: "Öğrencinin işyerinin şartlarına ve çalışma düzenine uymaması" },
    { code: "24-ı", text: "Öğrencinin, kasıtlı veya ağır ihmal sonucu işletmenin demirbaşına, makine ve teçhizatına zarar vermesi" },
    { code: "24-i", text: "Öğrencinin, işletmeye ait ticari sır, üretim bilgisi, müşteri verisi veya benzeri gizlilik arz eden bilgileri yetkisiz kişilerle paylaşması" },
    { code: "24-j", text: "Öğrencinin iş sağlığı ve güvenliği kurallarına kasıtlı ve ısrarlı şekilde uymaması" },
    { code: "24-k", text: "Öğrencinin adli bir suç nedeniyle tutuklanması veya hüküm giymesi sonucu eğitimin fiilen sürdürülememesi" },
    { code: "24-l", text: "Öğrencinin sağlık/özel eğitim durumunun işletmedeki eğitimden olumsuz etkilenmesi" },
    { code: "24-m", text: "Öğrencinin okul değiştirme veya örgün eğitim dışına çıkarma cezası alarak okul/kurumla ilişiğinin kesilmesi" },
    { code: "24-n", text: "Öğrencinin okula veya işletmeye devamsızlık nedeniyle sınıf tekrarına kalması" },
    { code: "24-o", text: "Öğrencinin ikametinin değişmesi nedeniyle işletmeye ulaşım zorluğu" },
    { code: "24-ö", text: "Öğrencinin nakil/geçiş yoluyla okul/program/tür değiştirmesi" },
    { code: "24-p", text: "Öğrencinin alan/dal değişikliği yapması" },
    { code: "24-r", text: "İşletme sahibinin değişmesi (ölüm, iflas, devir vb.)" },
    { code: "24-s", text: "İşletmede grev veya lokavt olması" },
    { code: "24-ş", text: "Tarafların karşılıklı ve yazılı mutabakatı" },
    { code: "24-t", text: "Deprem, yangın ve sel vb. doğal afetler" },
    { code: "24-u", text: "Mezuniyet" }
  ];

  const reasonsRowsHtml = reasonList.map(item => {
    const isSelected = !blank && item.code === selectedReasonCode;
    const tickVal = isSelected ? "✔" : "";
    return `
      <tr style="border-bottom: 1px solid #000;">
        <td style="width: 25px; border-right: 1px solid #000; text-align: center; font-weight: bold; padding: 1px; height: 14px;">${tickVal}</td>
        <td style="width: 40px; border-right: 1px solid #000; text-align: center; font-weight: bold; padding: 1px;">${item.code}</td>
        <td style="padding: 1px 4px; text-align: left;">${item.text}</td>
      </tr>
    `;
  }).join("");

  const coordinatorOpinion = "";

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Sozlesme_Fesih_Bildirimi_${getFormattedReportDate()}</title>
        <style>
          @page { size: A4 portrait; margin: 6mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; font-size: 10px; }
          .notice-card {
            width: 198mm;
            margin: 0 auto;
            padding: 2mm;
          }
          header { text-align: center; margin-bottom: 3mm; border: 2px solid #000; padding: 6px; }
          header h2 { margin: 0; font-size: 12px; font-weight: bold; }
          .main-table { width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed; }
          .main-table td { border: 1px solid #000; }
          .section-title { background: #e5e7eb; font-weight: bold; padding: 4px 6px; font-size: 11px; text-transform: uppercase; }
          .vertical-header-cell {
            width: 40px;
            text-align: center;
            vertical-align: middle;
            background: #f3f4f6;
            font-size: 8px;
            font-weight: bold;
            line-height: 1.15;
            padding: 4px 2px;
          }
          .vertical-text-wrap {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            display: inline-block;
            text-align: center;
            margin: 0 auto;
          }
          .reasons-table { width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.1; }
          .reasons-table td { border: none !important; border-bottom: 1px solid #ccc !important; }
          .reasons-table tr:last-child td { border-bottom: none !important; }
          .signature-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; text-align: center; }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
            .notice-card { background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); min-height: 285mm; }
          }
          @media print {
            body { background: #fff; }
          }
        </style>
      </head>
      <body>
        <main class="notice-card">
          <header>
            <h2>NAZİLLİ MESLEKİ EĞİTİM MERKEZİ İŞLETMELERDE BECERİ EĞİTİMİ / ÇIRAKLIK SÖZLEŞMESİ FESİH BİLDİRİMİ</h2>
          </header>
          <table class="main-table">
            <colgroup>
              <col style="width: 40px;" />
              <col />
              <col style="width: 25%;" />
              <col style="width: 25%;" />
            </colgroup>
            <!-- ÖĞRENCİNİN -->
            <tr>
              <td colspan="4" class="section-title">ÖĞRENCİNİN</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 5px; width: 50%;"><strong>Adı ve Soyadı :</strong> ${escapeHtml(studentName)}</td>
              <td style="padding: 5px; width: 25%;"><strong>Sınıfı :</strong> ${escapeHtml(studentClass)}</td>
              <td style="padding: 5px; width: 25%;"><strong>Okul No :</strong> ${escapeHtml(studentNo)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 5px;"><strong>TC Numarası :</strong> ${escapeHtml(studentTc)}</td>
              <td colspan="2" style="padding: 5px;"><strong>Meslek Dalı :</strong> ${escapeHtml(studentBranch)}</td>
            </tr>

            <!-- VELİ -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">ÖĞRENCİ VELİSİ<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <div style="text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 11px;">NAZİLLİ MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜNE</div>
                Velisi bulunduğum ve yukarıda kimlik bilgileri yazılı okulunuz öğrencisinin, işletmelerde beceri eğitimi sözleşmesini aşağıda belirttiğim nedenden dolayı; sözleşmesinin ilgili maddesi gereğince tarafımızca fesih edilmesini istiyorum. Gereğini bilgilerinize arz ederim.
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px;">
                  <div>
                    <strong>Adres:</strong> ${escapeHtml(veliAddress)}<br>
                    <strong>Telefon:</strong> ${escapeHtml(veliPhone)}
                  </div>
                  <div style="display: flex; justify-content: flex-end; padding-right: 10px;">
                    <div style="text-align: center; display: inline-block;">
                      ....../....../202...<br><br>
                      <strong>${escapeHtml(veliName)}</strong><br>
                      <span>(Veli Adı Soyadı- İmza)</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- İŞVEREN -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">AYRILDIĞI İŞVEREN/VEKİLİ<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <div style="text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 11px;">NAZİLLİ MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜNE</div>
                İşletmemizde yukarıda kimlik bilgileri yazılı okulunuz öğrencisinin, işletmelerde beceri eğitimi sözleşmesinin aşağıda belirttiğim nedenden; ilgili maddesi gereğince tarafımızca fesih edilmesini istiyorum. Gereğini bilgilerinize arz ederim.
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px;">
                  <div>
                    <strong>Adres:</strong> ${escapeHtml(businessAddress)}<br>
                    <strong>Telefon:</strong> ${escapeHtml(businessPhoneVal)}
                  </div>
                  <div style="display: flex; justify-content: flex-end; padding-right: 10px;">
                    <div style="text-align: center; display: inline-block;">
                      ....../....../202...<br><br>
                      <strong>(İşveren Adı Soyadı- İmza-Kaşe)</strong>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- FESİH SÖZLEŞMESİ İLGİLİ MADDESİ -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">FESİH SÖZLEŞMESİ<br>İLGİLİ MADDESİ</div>
              </td>
              <td colspan="3" style="padding: 6px; vertical-align: top;">
                <div style="font-weight: bold; margin-bottom: 4px;">İşletmelerde Beceri Eğitimi Sözleşmesinin Fesih Sebebi:....</div>
                <table class="reasons-table">
                  ${reasonsRowsHtml}
                </table>
                <div style="margin-top: 6px; font-weight: bold; text-align: justify; font-size: 8.5px; line-height: 1.2;">
                  hallerinde tek taraflı olarak feshedilir. Fesih durumu, sözleşmenin feshi tarihinden itibaren 3 iş günü içinde ilgili okul/kurum müdürlüğüne yazılı olarak bildirilir. (3308 sayılı Kanun madde 22, Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği, madde 133).
                </div>
              </td>
            </tr>

            <!-- KOORDİNATÖR -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">KOORDİNATÖR ÖĞRETMEN<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <strong>Varsa Özel Görüşü:</strong> <span style="border-bottom: 1px dashed #444; display: inline-block; width: 80%; min-height: 14px; padding-left: 5px;">${escapeHtml(coordinatorOpinion)}</span>
                <div style="display: flex; justify-content: flex-end; margin-top: 15px; padding-right: 10px;">
                  <div style="text-align: center; display: inline-block;">
                    ....../....../202...<br><br>
                    <strong>${escapeHtml(coordinatorName)}</strong><br>
                    <span>(Koordinatör Öğretmen - İmza)</span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- OKUL MÜDÜRLÜĞÜ -->
            <tr>
              <td class="vertical-header-cell">
                <div class="vertical-text-wrap">OKUL MÜDÜRLÜĞÜ<br>TARAFINDAN<br>DOLDURULACAKTIR</div>
              </td>
              <td colspan="3" style="padding: 8px; vertical-align: top;">
                <div style="text-align: justify; line-height: 1.3; font-weight: bold; margin-bottom: 8px; font-size: 10.5px;">
                  Tarafların isteklerinin sözleşmenin ( 24 - <strong style="border-bottom: 1.5px solid #000; padding: 0 8px; min-width: 30px; display: inline-block; text-align: center;">${blank ? "......" : selectedReasonCodeSuffix}</strong> ) Maddesine uygun olduğu, yasal sorumluluk taraflara ait olmak üzere fesih işleminin yapılması ve sözleşmenin iptal edilmesi uygundur.
                </div>
                <div class="signature-box">
                  <div>
                    ....../....../202...<br><br>
                    <strong>${escapeHtml(deputyName)}</strong><br>
                    <span>Koordinatör Müdür Yardımcısı</span><br>
                    <span>İmza</span>
                  </div>
                  <div>
                    ....../....../202...<br><br>
                    <strong>${escapeHtml(principalName)}</strong><br>
                    <span>Okul Müdürü</span><br>
                    <span>İmza - Mühür</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </main>
      </body>
    </html>
  `;
}

function buildTerminationReportHtml() {
  const blank = Boolean(els.skillTerminationBlank?.checked);
  const isNotice = els.skillTerminationTemplate?.value === "notice";
  if (isNotice) {
    return buildNoticeTerminationReportHtml();
  }
  const student = blank ? null : skillState.students.find((item) => item.id === els.skillTerminationStudent?.value);
  if (!blank && !student) {
    showToast("Fesih raporu için öğrenci seçin veya boş şablon oluşturun.", "warning");
    return "";
  }
  const business = student ? getSkillBusiness(student.businessId) : null;
  const coordinator = student ? skillState.coordinators.find((item) => item.businessId === student.businessId) : null;
  const reportSchool = getSkillSchoolForReport(coordinator);
  const principal = reportSchool?.principal || skillState.schoolRecords?.[0]?.principal || "Okul Müdürü";
  const field = student?.field || "";
  const contractDate = blank ? "" : formatTerminationReportDate(els.skillTerminationContractDate?.value);
  const cancelDate = blank ? "" : formatTerminationReportDate(els.skillTerminationCancelDate?.value);
  const reasons = buildTerminationReasonLines(blank ? "" : els.skillTerminationReasons?.value);
  const className = student?.className || "";
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Sozlesme_Iptal_Tutanagi_${getFormattedReportDate()}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .termination-card {
            width: 194mm;
            min-height: 275mm;
            margin: 0 auto;
            padding: 13mm 10mm;
            border: 1.8px solid #111;
            font-size: 14px;
            line-height: 1.18;
          }
          header { text-align: center; margin-bottom: 10mm; }
          h1, h2, h3 { margin: 0; font-weight: 800; }
          h1 { font-size: 14px; margin-bottom: 5mm; }
          h2 { font-size: 14px; margin-bottom: 6mm; }
          h3 { font-size: 20px; }
          .termination-row {
            display: grid;
            grid-template-columns: 72mm 6mm minmax(0, 1fr);
            align-items: center;
            min-height: 8.5mm;
            font-size: 14px;
          }
          .termination-row strong { font-size: 14px; }
          .termination-row .value {
            min-height: 7mm;
            padding: 1.4mm 1mm .4mm;
            border-bottom: 1px solid #cfcfcf;
            font-size: 14px;
            line-height: 1.1;
          }
          .student-title {
            margin: 4mm 0 1mm;
            font-size: 14px;
            font-weight: 800;
            text-decoration: underline;
          }
          .reason-row { align-items: start; margin-top: 3mm; }
          .reason-row strong, .reason-row b { padding-top: 1.5mm; }
          .termination-reasons {
            min-height: 30mm;
            padding-top: 0;
            border-bottom: 1px solid #cfcfcf;
          }
          .termination-reasons span {
            display: block;
            height: 7mm;
            border-bottom: 1px solid #d7d7d7;
          }
          .termination-text {
            margin-top: 18mm;
            font-weight: 800;
            text-align: justify;
            word-spacing: 2px;
          }
          .termination-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            margin-top: 18mm;
            align-items: start;
            text-align: center;
            font-size: 13px;
          }
          .termination-signatures strong,
          .termination-signatures span {
            display: block;
          }
          .termination-signatures small {
            display: block;
            margin-top: 6mm;
            font-size: 13px;
          }
          .principal-signature strong { margin-top: 6mm; }
          @media screen {
            body { background: #dfe4e9; padding: 8mm 0; }
          }
          @media print {
            body { background: #fff; }
          }
        </style>
      </head>
      <body>
        <main class="termination-card">
          <header>
            <h1>${escapeHtml(reportSchool?.name || "OKUL ADI")}</h1>
            <h2>İŞLETMELERDE BECERİ EĞİTİMİ GÖREN ÖĞRENCİLERE AİT</h2>
            <h3>SÖZLEŞME İPTAL TUTANAĞI</h3>
          </header>
          <section>
            <div class="termination-row"><strong>İŞLETMENİN ADI</strong><b>:</b><span class="value">${escapeHtml(business?.name || "")}</span></div>
            <div class="student-title">ÖĞRENCİNİN</div>
            <div class="termination-row"><strong>ADI SOYADI</strong><b>:</b><span class="value">${escapeHtml(student?.name || "")}</span></div>
            <div class="termination-row"><strong>ALANI</strong><b>:</b><span class="value">${escapeHtml(field)}</span></div>
            <div class="termination-row"><strong>SINIFI</strong><b>:</b><span class="value">${escapeHtml(className)}</span></div>
            <div class="termination-row"><strong>NUMARASI</strong><b>:</b><span class="value">${escapeHtml(student?.no || "")}</span></div>
            <div class="termination-row"><strong>SÖZLEŞME TARİHİ</strong><b>:</b><span class="value">${escapeHtml(contractDate)}</span></div>
            <div class="termination-row"><strong>SÖZLEŞME İPTAL TARİHİ</strong><b>:</b><span class="value">${escapeHtml(cancelDate)}</span></div>
            <div class="termination-row reason-row"><strong>İPTAL NEDENLERİ</strong><b>:</b>${reasons}</div>
          </section>
          <p class="termination-text">Ortaöğretim Kurumları Yönetmeliği uyarınca İşletmede Beceri Eğitimi yapılan ve yukarıda belirtilen iş yerinden kimliği yazılı öğrencinin açıklanan nedenlerden dolayı sözleşmesi iptal edilmiştir.</p>
          <div class="termination-signatures">
            <span><strong>İşletme Yetkilisi</strong></span>
            <span><strong>Koordinatör Öğretmen</strong><small>${escapeHtml(coordinator?.teacher || "")}</small></span>
            <span class="principal-signature"><span>....../....../${new Date().getFullYear()}</span><strong>${escapeHtml(principal)}</strong><small>Okul Müdürü</small></span>
          </div>
        </main>
      </body>
    </html>
  `;
}

function buildAbsenceReportHtml() {
  const ids = getFlexibleReportBusinessIds();
  if (!ids.length) {
    showToast("İşletme kaydı bulunamadı.", "warning");
    return "";
  }
  const { startDate, endDate } = getReportDateRange();

  function getSkillReportDocumentDateStr(endDateStr) {
    const parts = endDateStr.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let nextYear = year;
    let nextMonth = month;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    let targetDate = new Date(nextYear, nextMonth, 1);
    while (true) {
      const dayOfWeek = targetDate.getDay();
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, "0");
      const d = String(targetDate.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const isHoliday = skillState.holidays.some((holiday) => (
        dateStr >= holiday.startDate && 
        dateStr <= (holiday.endDate || holiday.startDate) && 
        !isSkillSchoolBreakForMesem(holiday)
      ));
      if (!isWeekend && !isHoliday) {
        return dateStr;
      }
      targetDate.setDate(targetDate.getDate() + 1);
    }
  }

  const docDateStr = getSkillReportDocumentDateStr(endDate);
  const dates = getDatesBetween(startDate, endDate);
  const perPage = Number(els.skillReportPerPage?.value || 1);
  const pageClass = perPage === 2 ? "two-up" : "one-up";
  const monthLabel = new Date(`${startDate}T00:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toLocaleUpperCase("tr-TR");
  const reportCards = ids.map((businessId) => {
    const business = getSkillBusiness(businessId);
    const coordinator = skillState.coordinators.find((item) => item.businessId === businessId);
    const reportSchool = getSkillSchoolForReport(coordinator);
    const deputyName = getSkillDeputyForReport(coordinator);
    const students = skillState.students.filter((student) => student.businessId === businessId);
    const dayHeads = dates.map((date) => `<th class="day-col date-head ${isMutedReportDate(date) ? "muted-day" : ""}" rowspan="2"><span>${escapeHtml(getSkillReportDayHeader(date))}</span></th>`).join("");
    const isHalf = perPage === 2;
    const dayColWidth = isHalf
      ? (113.0 / dates.length).toFixed(4)
      : (120.5 / dates.length).toFixed(4);
    const colGroup = isHalf
      ? `
        <colgroup>
          <col style="width: 33.0mm;">
          <col style="width: 5.5mm;">
          <col style="width: 16.5mm;">
          <col style="width: 6.0mm;">
          ${dates.map(() => `<col style="width: ${dayColWidth}mm;">`).join("")}
          <col style="width: 9.0mm;">
          <col style="width: 9.0mm;">
        </colgroup>
      `
      : `
        <colgroup>
          <col style="width: 30.0mm;">
          <col style="width: 6.0mm;">
          <col style="width: 16.5mm;">
          <col style="width: 7.0mm;">
          ${dates.map(() => `<col style="width: ${dayColWidth}mm;">`).join("")}
          <col style="width: 6.0mm;">
          <col style="width: 6.0mm;">
        </colgroup>
      `;
    const studentRows = students.map((student) => {
      let excusedAm = 0;
      let unexcusedAm = 0;
      let excusedPm = 0;
      let unexcusedPm = 0;
      let hasAnyAbsenceMark = false;
      dates.forEach((date) => {
        const amVal = getReportSymbolForDate(student, date, "am");
        const pmVal = getReportSymbolForDate(student, date, "pm");
        const amUpper = String(amVal || "").trim().toUpperCase();
        const pmUpper = String(pmVal || "").trim().toUpperCase();

        if (["İ", "I", "H", "R", "D", "T"].includes(amUpper)) hasAnyAbsenceMark = true;
        if (["İ", "I", "H", "R", "D", "T"].includes(pmUpper)) hasAnyAbsenceMark = true;

        if (["İ", "I", "H", "R", "T"].includes(amUpper)) excusedAm += 0.5;
        if (["D"].includes(amUpper)) unexcusedAm += 0.5;
        if (["İ", "I", "H", "R", "T"].includes(pmUpper)) excusedPm += 0.5;
        if (["D"].includes(pmUpper)) unexcusedPm += 0.5;
      });
      const showTotals = els.skillReportBusinessSymbolEnabled?.checked !== false && els.skillReportSchoolSymbolEnabled?.checked !== false;
      const excusedAmStr = (!hasAnyAbsenceMark || !showTotals) ? "" : (excusedAm % 1 === 0 ? String(excusedAm) : excusedAm.toFixed(1).replace(".", ","));
      const unexcusedAmStr = (!hasAnyAbsenceMark || !showTotals) ? "" : (unexcusedAm % 1 === 0 ? String(unexcusedAm) : unexcusedAm.toFixed(1).replace(".", ","));
      const excusedPmStr = (!hasAnyAbsenceMark || !showTotals) ? "" : (excusedPm % 1 === 0 ? String(excusedPm) : excusedPm.toFixed(1).replace(".", ","));
      const unexcusedPmStr = (!hasAnyAbsenceMark || !showTotals) ? "" : (unexcusedPm % 1 === 0 ? String(unexcusedPm) : unexcusedPm.toFixed(1).replace(".", ","));

      return `
        <tr>
          <td class="student-name" rowspan="2">${escapeHtml(student.name)}</td>
          <td class="student-no" rowspan="2">${escapeHtml(student.no || "-")}</td>
          <td class="student-field" rowspan="2">${escapeHtml(student.field || "-")}</td>
          <td class="student-days">S</td>
          ${dates.map((date) => `<td class="symbol-cell ${isMutedReportDate(date) ? "muted-day" : ""}">${escapeHtml(getReportSymbolForDate(student, date, "am"))}</td>`).join("")}
          <td class="total-cell">${escapeHtml(excusedAmStr)}</td><td class="total-cell">${escapeHtml(unexcusedAmStr)}</td>
        </tr>
        <tr>
          <td class="student-days">Ö</td>
          ${dates.map((date) => `<td class="symbol-cell ${isMutedReportDate(date) ? "muted-day" : ""}">${escapeHtml(getReportSymbolForDate(student, date, "pm"))}</td>`).join("")}
          <td class="total-cell">${escapeHtml(excusedPmStr)}</td><td class="total-cell">${escapeHtml(unexcusedPmStr)}</td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="${dates.length + 6}">Bu işletmeye bağlı öğrenci yok.</td></tr>`;
    return `
      <section class="absence-report-card ${perPage === 2 ? "is-half" : ""} ${perPage === 2 && students.length > 3 ? "is-condensed" : ""}">
        <div class="absence-report-wrapper">
          <header>
            <h1>${escapeHtml(reportSchool?.name || "OKUL ADI")}</h1>
            <h2>ÖĞRENCİLERİN İŞLETMELERDE MESLEKİ EĞİTİMİ AYLIK DEVAM - DEVAMSIZLIK BİLDİRİM ÇİZELGESİ</h2>
          </header>
          <div class="absence-report-meta">
            <span><strong>İŞLETME ADI</strong>${escapeHtml(business?.name || "-")}</span>
            <span><strong>İŞLETME TEL.</strong>${escapeHtml(business?.phone || "-")}</span>
            <span><strong>Ait Olduğu Ay</strong>${escapeHtml(monthLabel)}</span>
            <span><strong>Belgenin Düzenlendiği Tarih:</strong>${escapeHtml(formatSkillDate(docDateStr))}</span>
          </div>
          <table>
            ${colGroup}
            <thead>
              <tr>
                <th colspan="3" class="student-head">ÖĞRENCİNİN</th>
                <th rowspan="2" class="student-days"><span>GÜNLER</span></th>
                ${dayHeads}
                <th colspan="2" class="total-head">Toplam<br>Devamsızlık</th>
              </tr>
              <tr>
                <th class="student-name">ADI SOYADI</th>
                <th class="student-no"><span>OKUL NO</span></th>
                <th class="student-field"><span>ALAN DAL</span></th>
                <th class="total-cell"><span>ÖZÜRLÜ</span></th>
                <th class="total-cell"><span>ÖZÜRSÜZ</span></th>
              </tr>
            </thead>
            <tbody>${studentRows}</tbody>
          </table>
          <div class="absence-report-footer">
            <span><strong>İŞLETME YETKİLİSİ</strong><small>...../...../20.....<br><br><br>ADI SOYADI<br>Kaşe - İmza</small></span>
            <span><strong>İNCELENDİ</strong><small>...../...../20.....<br><br>${escapeHtml(deputyName)}<br>Koordinatör<br>Müdür Yardımcısı<br><br>İmza</small></span>
            <span>
              <div class="legend-note">
                <strong>Açıklama:</strong> Bu çizelge, işletme tarafından tutulacak, öğrencinin işletmede bulunması gereken günlere ait devamsızlık durumları ilgili sütunda, altta gösterilen uygun sembollerle belirtilecektir. (İ),(H),ve (R) ile gösterilen devamsızlıklar toplamı özürlü devamsızlık sütununa yazılacaktır.
              </div>
              <div class="legend-group">
                <div class="legend-title">Devam Sembolleri:</div>
                <div class="legend-items">
                  <span class="legend-item"><b>X</b>İşletmede</span>
                  <span class="legend-item"><b>O</b>Okulda</span>
                </div>
              </div>
              <div class="legend-group">
                <div class="legend-title">Devamsızlık Sembolleri:</div>
                <div class="legend-items">
                  <span class="legend-item"><b>İ</b>İzinli</span>
                  <span class="legend-item"><b>D</b>Özürsüz</span>
                  <span class="legend-item"><b>H</b>Hasta</span>
                  <span class="legend-item"><b>R</b>Raporlu</span>
                  <span class="legend-item"><b>T</b>Tatil</span>
                  <span class="legend-item"><b>S</b>Sabah</span>
                  <span class="legend-item"><b>Ö</b>Öğle</span>
                </div>
              </div>
            </span>
          </div>
        </div>
      </section>
    `;
  }).join("");
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Devamsizlik_Raporu_${getFormattedReportDate()}</title>
        <style>
          @page { size: A4 portrait; margin: 9mm 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif; color: #000; background: #fff; }
          .report-sheet { width: 194mm; margin: 0 auto; }
          .absence-report-card {
            width: 194mm;
            padding: 0;
            border: 0;
            background: #fff;
            break-after: page;
            page-break-after: always;
          }
          .absence-report-card.is-half {
            width: 194mm;
            height: 139.5mm;
            margin: 0 !important;
            padding: 0 !important;
            break-after: auto;
            page-break-after: auto;
            overflow: hidden;
            box-sizing: border-box;
            background: #fff;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }
          .absence-report-card.is-half > * {
            flex-shrink: 0 !important;
          }
          .absence-report-wrapper {
            width: 100%;
            display: block;
            padding: 0 0.5mm;
          }
          .absence-report-card.is-half:nth-child(even) {
            border-top: 1px dashed #000 !important;
            break-after: page;
            page-break-after: always;
          }
          header { text-align: center; margin-bottom: 2mm; }
          header {
            min-height: 12mm;
            padding: 2.5mm 2mm 1.8mm;
            border: 1px solid #000;
          }
          h1 { margin: 0; font-size: 12.5px; line-height: 1.15; font-weight: 800; }
          h2 { margin: 1mm 0 0; font-size: 11px; line-height: 1.12; font-weight: normal; }
          .absence-report-meta {
            display: grid;
            grid-template-columns: 87.62mm 28.11mm 28.12mm 49.15mm;
            margin-bottom: 1.8mm;
            border: 1px solid #000;
            font-size: 10px;
          }
          .absence-report-meta span {
            min-height: 12mm;
            padding: 1.3mm;
            border-right: 1px solid #000;
            text-align: center;
          }
          .absence-report-meta span:last-child {
            border-right: 0;
          }
          .absence-report-meta strong { display: block; margin-bottom: 1.4mm; font-size: 9.5px; font-weight: normal; }
          table { width: calc(100% - 1px); margin: 0 auto; border-collapse: collapse; table-layout: fixed; font-size: 8px; line-height: 1.05; border: 1px solid #000; }
          th, td { border: 1px solid #000; padding: .85mm .55mm; text-align: center; vertical-align: middle; overflow: hidden; background-clip: padding-box !important; }
          tbody td { padding: 0.9mm 0.55mm; }
          thead th { font-weight: normal; border-bottom: 1px solid #000 !important; }
          thead tr:first-child th { border-top: 1px solid #000 !important; }
          .student-head, .student-name, .student-field { text-align: left; }
          .student-head { text-align: center; }
          .student-name { font-size: 9.5px; }
          .student-no { }
          .student-field { font-size: 7.2px; line-height: 1.0; }
          .student-days { font-weight: normal; }
          th.student-days,
          thead th.student-no,
          thead th.student-field,
          thead th.total-cell {
            writing-mode: vertical-rl;
            white-space: nowrap;
            padding: 1.5mm 0.5mm;
            text-align: center;
            vertical-align: middle;
          }
          th.student-days span,
          thead th.student-no span,
          thead th.student-field span,
          thead th.total-cell span {
            display: inline-block;
            transform: rotate(180deg);
          }
          .date-head, .student-head, th.student-days, .total-head { border-top: 1px solid #000 !important; }
          .date-head {
            height: 22mm;
            writing-mode: horizontal-tb !important;
            white-space: nowrap;
            text-align: center;
            vertical-align: bottom;
            padding: 1.5mm 0;
          }
          .date-head span {
            display: inline-block;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            color: #000;
            font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
            font-size: 11px;
            font-weight: normal;
            line-height: 1;
            letter-spacing: -0.05px;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          .day-col { padding-left: 0; padding-right: 0; }
          .symbol-cell { font-size: 8px; font-weight: normal; padding-left: 0; padding-right: 0; }
          .muted-day {
            background-color: #f1f5f9 !important;
            background-image: repeating-linear-gradient(
              -45deg,
              #64748b,
              #64748b 1.2px,
              #ffffff 1.2px,
              #ffffff 4.5px
            ) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          th.date-head.muted-day {
            background-color: #e5e7eb !important;
            background-image: none !important;
            border-bottom: 2px solid #000 !important;
          }
          th.date-head.muted-day span {
            font-weight: 800 !important;
            color: #000 !important;
          }
          .total-cell { padding-left: 0; padding-right: 0; }
          .total-head { font-size: 6.8px; line-height: 1.05; white-space: normal; word-break: break-word; }
          .absence-report-footer {
            display: grid;
            grid-template-columns: 1fr 1fr 1.15fr;
            gap: 0;
            margin-top: 3mm;
            border: 1px solid #000;
            border-right: 0;
            font-size: 10px;
          }
          .absence-report-footer > span { min-height: 34mm; border-right: 1px solid #000; padding: 2mm; text-align: center; }
          .absence-report-footer strong, .absence-report-footer small { display: block; }
          .absence-report-footer strong { font-weight: normal; }
          .absence-report-footer small { margin-top: 3.5mm; line-height: 1.35; }
          .absence-report-footer > span:nth-child(3) { text-align: left; }
          .absence-report-footer > span:nth-child(3) strong { text-align: center; margin-bottom: 2mm; }
          .legend-group {
            margin-bottom: 2mm;
          }
          .legend-title {
            font-size: 8.5px;
            font-weight: bold;
            margin-bottom: 1.2mm;
          }
          .legend-items {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1mm 1.5mm;
          }
          .legend-item {
            display: inline-flex;
            align-items: center;
            white-space: nowrap;
            font-size: 8px;
          }
          .legend-item b {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 3.8mm;
            height: 3.8mm;
            border: 1px solid #000;
            margin-right: 0.8mm;
            font-weight: bold;
            background: #f8fafc;
          }
          .legend-note {
            border-bottom: 1px solid #000;
            padding-bottom: 2.0mm;
            margin-bottom: 2.0mm;
            font-size: 7.5px;
            line-height: 1.22;
          }
          .legend-note strong {
            display: inline !important;
            font-weight: bold !important;
            text-align: left !important;
          }
          .absence-report-card.is-half.is-condensed header { min-height: 9mm; margin-bottom: 1mm; padding: 1.5mm; }
          .absence-report-card.is-half.is-condensed h1 { font-size: 10px; }
          .absence-report-card.is-half.is-condensed h2 { font-size: 8.8px; }
          .absence-report-card.is-half .absence-report-meta {
            grid-template-columns: 87.37mm 26.36mm 26.37mm 52.90mm;
          }
          .absence-report-card.is-half.is-condensed .absence-report-meta {
            font-size: 8px;
            margin-bottom: 1mm;
          }
          .absence-report-card.is-half.is-condensed .absence-report-meta span { min-height: 8mm; padding: .9mm; }
          .absence-report-card.is-half.is-condensed .absence-report-meta strong { font-size: 7px; margin-bottom: .6mm; }
          .absence-report-card.is-half.is-condensed table { font-size: 6.2px; }
          .absence-report-card.is-half.is-condensed th, .absence-report-card.is-half.is-condensed td { padding: .45mm .35mm; }
          .absence-report-card.is-half.is-condensed tbody td { padding: 0.5mm 0.35mm; }
          .absence-report-card.is-half.is-condensed .date-head {
            height: 19mm;
            padding: 1mm 0;
            writing-mode: horizontal-tb !important;
            white-space: nowrap;
            text-align: center;
            vertical-align: bottom;
          }
          .absence-report-card.is-half.is-condensed .date-head span {
            display: inline-block;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 9.5px;
            font-weight: normal;
            letter-spacing: -0.05px;
          }
          .absence-report-card.is-half.is-condensed th.date-head.muted-day {
            background-color: #e5e7eb !important;
            background-image: none !important;
            border-bottom: 2px solid #000 !important;
          }
          .absence-report-card.is-half.is-condensed th.date-head.muted-day span {
            font-weight: 800 !important;
            color: #000 !important;
          }
          .absence-report-card.is-half.is-condensed .day-col { }
          .absence-report-card.is-half.is-condensed .symbol-cell { font-size: 6.5px; }
          .absence-report-card.is-half.is-condensed .student-name { font-size: 7.5px; }
          .absence-report-card.is-half.is-condensed .student-no { }
          .absence-report-card.is-half.is-condensed .student-field { font-size: 5.8px; line-height: 1.0; }
          .absence-report-card.is-half.is-condensed .student-days { }
          .absence-report-card.is-half.is-condensed .total-cell { }
          .absence-report-card.is-half.is-condensed .total-head { font-size: 5.5px; line-height: 1.05; white-space: normal; word-break: break-word; }
          .absence-report-card.is-half.is-condensed .absence-report-footer { margin-top: 2mm; font-size: 8px; }
          .absence-report-card.is-half.is-condensed .absence-report-footer > span { min-height: 25mm; padding: 1.2mm; }
          .absence-report-card.is-half.is-condensed .absence-report-footer small { margin-top: 1.8mm; }
          .absence-report-card.is-half.is-condensed .legend-group {
            margin-bottom: 1.2mm;
          }
          .absence-report-card.is-half.is-condensed .legend-title {
            font-size: 7.2px;
            margin-bottom: 0.8mm;
          }
          .absence-report-card.is-half.is-condensed .legend-items {
            grid-template-columns: repeat(4, 1fr);
            gap: 0.8mm 1mm;
          }
          .absence-report-card.is-half.is-condensed .legend-item {
            font-size: 7px;
          }
          .absence-report-card.is-half.is-condensed .legend-item b {
            width: 3.3mm;
            height: 3.3mm;
            margin-right: 0.5mm;
          }
          .absence-report-card.is-half.is-condensed .legend-note {
            padding-bottom: 1.2mm;
            margin-bottom: 1.2mm;
            font-size: 6.2px;
            line-height: 1.15;
            border-bottom: 1px solid #000;
          }

          /* Border overrides removed to make all borders uniform 1px */

          @media screen {
            body { background: #f1f5f9; padding: 10mm 0; }
            .report-sheet { width: 194mm; margin: 0 auto; }
            .absence-report-card {
              margin-bottom: 10mm;
              padding: 0;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 6px !important;
            }
          }
          @media print {
            body { background: #fff; }
            .report-sheet { width: auto; margin: 0; }
            .absence-report-card { box-shadow: none; margin: 0; border: none !important; border-radius: 0 !important; }
          }
        </style>
      </head>
      <body><main class="report-sheet ${pageClass}">${reportCards}</main></body>
    </html>
  `;
}

function previewSkillAbsenceReport() {
  if (!["absence", "daily", "monthly", "termination", "grades", "wage"].includes(activeSkillReportType)) {
    showToast("Bu rapor türü için önizleme henüz eklenmedi.", "warning");
    return;
  }
  const html = activeSkillReportType === "daily"
    ? buildDailyGuidanceReportHtml()
    : activeSkillReportType === "monthly"
      ? buildMonthlyGuidanceReportHtml()
      : activeSkillReportType === "termination"
        ? buildTerminationReportHtml()
        : activeSkillReportType === "grades"
          ? buildGradeReportHtml()
          : activeSkillReportType === "wage"
            ? buildWageReportHtml()
            : buildAbsenceReportHtml();
  if (!html) return;
  if (!els.skillReportPreviewFrame || !els.skillReportPreviewDialog) return;
  if (els.skillReportPreviewTitle) {
    els.skillReportPreviewTitle.textContent = activeSkillReportType === "daily"
      ? "Günlük Rehberlik Raporu Önizleme"
      : activeSkillReportType === "monthly"
        ? "Aylık Rehberlik Raporu Önizleme"
        : activeSkillReportType === "termination"
          ? "Sözleşme İptal Tutanağı Önizleme"
          : activeSkillReportType === "grades"
            ? "Not Çizelgesi Önizleme"
            : activeSkillReportType === "wage"
              ? "Ücret Raporu Önizleme"
              : "Devamsızlık Raporu Önizleme";
  }
  currentSkillReportZoom = 1.0;
  if (els.skillReportZoomLabel) {
    els.skillReportZoomLabel.textContent = "100%";
  }
  els.skillReportPreviewFrame.srcdoc = html;
  els.skillReportPreviewDialog.showModal();
}

function closeSkillReportPreview() {
  if (els.skillReportPreviewDialog?.open) els.skillReportPreviewDialog.close();
}

function getActiveSkillReportDocTitle() {
  const todayStr = getFormattedReportDate();
  switch (activeSkillReportType) {
    case "daily":
      return `Gunluk_Rehberlik_Raporu_${todayStr}`;
    case "monthly":
      return `Aylik_Rehberlik_Raporu_${todayStr}`;
    case "grades":
      return `Not_Cizelgesi_${todayStr}`;
    case "wage":
      return `Ucret_Raporu_${todayStr}`;
    case "termination":
      return els.skillTerminationTemplate?.value === "notice"
        ? `Sozlesme_Fesih_Bildirimi_${todayStr}`
        : `Sozlesme_Iptal_Tutanagi_${todayStr}`;
    case "absence":
    default:
      return `Devamsizlik_Raporu_${todayStr}`;
  }
}

function printSkillAbsenceReport() {
  const frameWindow = els.skillReportPreviewFrame?.contentWindow;
  const frameDoc = els.skillReportPreviewFrame?.contentDocument;
  if (!frameWindow) return;

  const reportDocTitle = getActiveSkillReportDocTitle();
  const previousTitle = document.title;

  document.title = reportDocTitle;
  if (frameDoc) {
    frameDoc.title = reportDocTitle;
  }

  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  };
  window.addEventListener("afterprint", restoreTitle, { once: true });
  setTimeout(restoreTitle, 4000);

  frameWindow.focus();
  frameWindow.print();
}

async function downloadSkillReportPdf() {
  const frameWindow = els.skillReportPreviewFrame?.contentWindow;
  const frameDoc = els.skillReportPreviewFrame?.contentDocument;
  if (!frameDoc || !frameDoc.body) return;

  const reportDocTitle = getActiveSkillReportDocTitle();
  const isLandscape = ["monthly", "wage"].includes(activeSkillReportType) ||
    (activeSkillReportType === "grades" && els.skillGradeType?.value !== "lise" && els.skillGradeLayout?.value !== "portrait_two");

  if (typeof html2pdf !== "undefined") {
    showToast("PDF hazırlanıyor, lütfen bekleyin...", "info");
    try {
      const element = frameDoc.body;
      const opt = {
        margin: [4, 4, 4, 4],
        filename: `${reportDocTitle}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: isLandscape ? "landscape" : "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };
      await html2pdf().set(opt).from(element).save();
      showToast(`"${reportDocTitle}.pdf" başarıyla indirildi.`);
      return;
    } catch (err) {
      console.warn("html2pdf dönüştürmesi başarısız, yazdırma ekranına aktarılıyor:", err);
    }
  }

  // Fallback to print with proper title
  printSkillAbsenceReport();
}
let currentSkillReportZoom = 1.0;

function zoomSkillReport(factor) {
  currentSkillReportZoom = Math.min(2.0, Math.max(0.5, currentSkillReportZoom + factor));
  updateSkillReportZoom();
}

function updateSkillReportZoom() {
  if (els.skillReportZoomLabel) {
    els.skillReportZoomLabel.textContent = `${Math.round(currentSkillReportZoom * 100)}%`;
  }
  const frameDoc = els.skillReportPreviewFrame?.contentDocument;
  if (frameDoc && frameDoc.body) {
    frameDoc.body.style.zoom = currentSkillReportZoom;
  }
}

async function shareSkillReport() {
  const reportTitle = els.skillReportPreviewTitle?.textContent || "Rapor";
  if (navigator.share) {
    try {
      await navigator.share({
        title: reportTitle,
        text: `${reportTitle} - Okul Takip Sistemi (OTS) Beceri Eğitimi Modülü`,
        url: window.location.href
      });
    } catch (err) {
      console.log("Paylaşım başarısız veya iptal edildi:", err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Rapor bağlantısı panoya kopyalandı!");
    } catch (err) {
      alert("Bağlantı kopyalanamadı.");
    }
  }
}
