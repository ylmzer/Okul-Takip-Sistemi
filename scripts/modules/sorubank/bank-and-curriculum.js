function render() {
  const course = currentCourse();
  els.courseTitle.textContent = `${course.name} Soru Havuzu`;
  renderCourses();
  renderCloudStatus();
  renderFilters();
  renderMetrics();
  renderQuestions();
  renderSelectedQuestions();
  renderExamCart();
  renderExamArchive();
  renderExamAnalysis();
  renderCourseOptions();
  renderCurriculumSelectors();
  renderCurriculumManager();
  syncExamMeta();
  syncSettings();
}

function closeCoursePicker() {
  els.coursePicker.classList.remove("is-open");
  els.coursePickerButton.setAttribute("aria-expanded", "false");
}

function openExamCart() {
  renderExamCart();
  els.examCartDialog.showModal();
}

function renderCourses() {
  const selectedCourse = currentCourse();
  const courseQuestions = state.questions.filter((question) => question.courseId === selectedCourse.id);
  const courseCurriculum = curriculumForCourse(selectedCourse);
  const selected = selectedQuestions();
  const selectedCount = courseQuestions.length;
  const curriculumUnitCount = new Set(courseCurriculum.map((item) => item.topic || item.unit).filter(Boolean)).size;
  const questionUnitCount = new Set(courseQuestions.map((question) => question.topic).filter(Boolean)).size;
  const unitCount = curriculumUnitCount || questionUnitCount;
  const feedbackType = cartFeedback?.courseId === selectedCourse.id ? cartFeedback.type : "";
  const outcomeCount = new Set([
    ...courseCurriculum.map((item) => item.outcome).filter(Boolean),
    ...courseQuestions.map((question) => question.outcome).filter(Boolean)
  ]).size;
  const typeCounts = courseQuestions.reduce((counts, question) => {
    const key = question.type && questionTypes[question.type] ? question.type : "open";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const typeStats = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `<span>${escapeHtml(questionTypes[type])}<strong>${count}</strong></span>`)
    .join("") || `<em>Henüz soru yok</em>`;

  els.coursePickerButton.style.setProperty("--course-color", selectedCourse.color);
  els.coursePickerButton.setAttribute("aria-expanded", els.coursePicker.classList.contains("is-open") ? "true" : "false");
  els.coursePickerButton.innerHTML = `
    <span class="picker-icon" aria-hidden="true"></span>
    <span><small>Ders seçimi</small><strong>${escapeHtml(selectedCourse.name)}</strong></span>
    <span class="course-picker-arrow" aria-hidden="true">▼</span>
  `;

  els.activeCourseCard.innerHTML = `
    <div class="active-course-summary" style="--course-color:${escapeHtml(selectedCourse.color)}">
      <button class="active-course-head" type="button" data-action="open-course">
        <span class="course-dot" aria-hidden="true"></span>
        <span><strong>${escapeHtml(selectedCourse.name)}</strong></span>
      </button>
      <div class="active-course-stats">
        <span><strong>${escapeHtml(gradeValueForCourse(selectedCourse) || selectedCourse.grade || "-")}</strong><small>Sınıf</small></span>
        <span><strong>${selectedCount}</strong><small>Soru</small></span>
        <span><strong>${unitCount}</strong><small>Ünite</small></span>
      </div>
      <div class="active-course-meta">
        <span><strong>${outcomeCount}</strong><small>Kazanım</small></span>
        <button class="active-cart-button${selected.length ? " has-items" : ""}${feedbackType ? ` cart-${feedbackType}` : ""}" type="button" data-action="open-cart" data-feedback="${feedbackType === "added" ? "+1" : feedbackType === "removed" ? "-1" : ""}">
          <small>Sınav sepeti</small>
          <strong>${selected.length} soru</strong>
          <em>${feedbackType === "added" ? "Eklendi" : feedbackType === "removed" ? "Çıkarıldı" : "Sepeti aç"}</em>
        </button>
      </div>
      <div class="active-course-types">
        <small>Soru türleri</small>
        <div>${typeStats}</div>
      </div>
      <div class="course-actions">
        <button type="button" data-action="edit">Düzenle</button>
        <button type="button" data-action="delete">Sil</button>
      </div>
    </div>
  `;
  els.activeCourseCard.querySelector('[data-action="open-course"]').addEventListener("click", () => {
    if (state.currentView === "settings") setView("bank");
  });
  els.activeCourseCard.querySelector('[data-action="open-cart"]').addEventListener("click", openExamCart);
  els.activeCourseCard.querySelector('[data-action="edit"]').addEventListener("click", () => openEditCourse(selectedCourse.id));
  els.activeCourseCard.querySelector('[data-action="delete"]').addEventListener("click", () => deleteCourse(selectedCourse.id));
  sidebarCartCounts.set(selectedCourse.id, selected.length);

  els.courseList.innerHTML = "";
  state.courses.forEach((course) => {
    const count = state.questions.filter((question) => question.courseId === course.id).length;
    const item = document.createElement("button");
    item.type = "button";
    item.className = `course-option${course.id === state.selectedCourseId ? " is-active" : ""}`;
    item.style.setProperty("--course-color", course.color);
    item.innerHTML = `
      <span class="course-dot" aria-hidden="true"></span>
      <span><strong>${escapeHtml(course.name)}</strong><small>${escapeHtml(course.grade || "Düzey belirtilmedi")}</small></span>
      <span class="course-count">${count}</span>
    `;
    item.addEventListener("click", () => {
      state.selectedCourseId = course.id;
      state.activeExamArchiveId = "";
      els.examArchiveNameInput.value = "";
      bulkSelectedQuestionIds.clear();
      saveState();
      closeCoursePicker();
      render();
      if (state.currentView === "settings") {
        setView("bank");
      }
    });
    els.courseList.append(item);
  });
}

function renderFilters() {
  const courseQuestions = questionsForCurrentCourse();
  const topics = [...new Set(courseQuestions.map((question) => question.topic).filter(Boolean))].sort();
  const previousTopic = els.topicFilter.value;
  const previousRandomTopic = els.randomTopic.value;
  optionList(els.topicFilter, topics, "Tüm birimler");
  optionList(els.randomTopic, topics, "Tüm birimler");
  els.difficultyFilter.value = "";
  optionList(els.gradeFilter, [], "Tüm sınıflar");
  els.topicFilter.value = topics.includes(previousTopic) ? previousTopic : "";
  els.randomTopic.value = topics.includes(previousRandomTopic) ? previousRandomTopic : "";
}

function renderMetrics() {
  const courseQuestions = questionsForCurrentCourse();
  const selected = selectedQuestions();
  els.metricQuestionCount.textContent = courseQuestions.length;
  els.metricExamCount.textContent = selected.length;
  els.metricTotalPoints.textContent = selected.reduce((sum, question) => sum + Number(question.points || 0), 0);
  els.metricTopics.textContent = new Set(courseQuestions.map((question) => question.topic).filter(Boolean)).size;
}

function filteredQuestions() {
  const term = els.searchInput.value.trim().toLocaleLowerCase("tr-TR");
  return questionsForCurrentCourse().filter((question) => {
    const haystack = [
      stripHtml(question.content),
      stripHtml(question.answer),
      question.topic,
      question.outcome,
      examScopeLabel(question),
      questionTypes[question.type],
      question.choices.map((choice) => choice.text).join(" "),
      question.acceptedAnswers.join(" "),
      question.tags.join(",")
    ].join(" ").toLocaleLowerCase("tr-TR");
    return (
      (!term || haystack.includes(term)) &&
      (!els.topicFilter.value || question.topic === els.topicFilter.value)
    );
  });
}

function selectedBulkQuestions() {
  const courseQuestionIds = new Set(questionsForCurrentCourse().map((question) => question.id));
  return [...bulkSelectedQuestionIds].filter((id) => courseQuestionIds.has(id));
}

function renderBulkToolbar(visibleQuestions = filteredQuestions()) {
  const selectedIds = selectedBulkQuestions();
  const visibleIds = visibleQuestions.map((question) => question.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => bulkSelectedQuestionIds.has(id));
  els.bulkQuestionCount.textContent = `${selectedIds.length} soru seçildi`;
  els.deleteSelectedQuestionsBtn.disabled = selectedIds.length === 0;
  els.toggleVisibleQuestionsBtn.disabled = visibleIds.length === 0;
  els.toggleVisibleQuestionsBtn.textContent = allVisibleSelected ? "Görünen seçimi kaldır" : "Hepsini seç";
}

function renderQuestions() {
  const questions = filteredQuestions();
  renderBulkToolbar(questions);
  els.questionGrid.innerHTML = "";
  if (!questions.length) {
    els.questionGrid.innerHTML = `<div class="empty-state">Bu filtrelerle eşleşen soru yok. Yeni bir soru ekleyebilir veya filtreleri temizleyebilirsiniz.</div>`;
    return;
  }
  questions.forEach((question) => {
    const isSelected = basketIdsForCourse().includes(question.id);
    const isBulkSelected = bulkSelectedQuestionIds.has(question.id);
    const card = document.createElement("article");
    card.className = `question-card${isSelected ? " is-selected" : ""}${isBulkSelected ? " is-bulk-selected" : ""}`;
    card.innerHTML = `
      <label class="question-select" title="Toplu işlem için seç">
        <input type="checkbox" data-action="bulk-select" ${isBulkSelected ? "checked" : ""} aria-label="Toplu işlem için soruyu seç" />
      </label>
      <div class="question-meta">
        <span class="chip">${questionTypes[question.type]}</span>
        <span class="chip">${escapeHtml(question.topic || "Birim yok")}</span>
        <span class="chip chip-points">${question.points} puan</span>
        ${examScopeLabel(question) ? `<span class="chip chip-scope">${escapeHtml(examScopeLabel(question))}</span>` : ""}
      </div>
      <div class="question-preview">${question.content}${renderQuestionSupplements(question, "bank")}</div>
      <div class="card-actions">
        <button class="card-btn card-btn-primary" type="button" data-action="toggle">${isSelected ? "Sınavdan çıkar" : "Sınava ekle"}</button>
        <button class="card-btn card-btn-soft" type="button" data-action="preview">Soru-cevap</button>
        <button class="card-btn card-btn-plain" type="button" data-action="edit">Düzenle</button>
      </div>
      <div class="question-card-footer">
        <label class="quick-points">
          <span>Puan</span>
          <input type="number" min="1" value="${question.points}" data-action="points" />
        </label>
        <button class="delete-question-btn" type="button" data-action="delete" title="Soruyu sil" aria-label="Soruyu sil">Sil</button>
      </div>
    `;
    card.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleQuestion(question.id));
    card.querySelector('[data-action="preview"]').addEventListener("click", () => openQuestionPreview(question.id));
    card.querySelector('[data-action="edit"]').addEventListener("click", () => editQuestion(question.id));
    card.querySelector('[data-action="points"]').addEventListener("change", (event) => updateQuestionPoints(question.id, event.target.value));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteQuestionById(question.id));
    card.querySelector('[data-action="bulk-select"]').addEventListener("change", (event) => {
      if (event.target.checked) {
        bulkSelectedQuestionIds.add(question.id);
      } else {
        bulkSelectedQuestionIds.delete(question.id);
      }
      renderQuestions();
    });
    els.questionGrid.append(card);
  });
}

function renderSelectedQuestions() {
  const selected = selectedQuestions();
  els.selectedList.innerHTML = "";
  if (!selected.length) {
    els.selectedList.innerHTML = `<div class="empty-state">Henüz sınava soru eklenmedi. Havuzdan seçim yapabilir veya rastgele seçim kullanabilirsiniz.</div>`;
    return;
  }
  selected.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = "selected-row";
    row.innerHTML = `
      <span class="selected-index">${index + 1}</span>
      <div>
        <p>${stripHtml(question.content).slice(0, 180)}${stripHtml(question.content).length > 180 ? "..." : ""}</p>
        <small>${questionTypes[question.type]} · ${question.topic || "Birim yok"}${examScopeLabel(question) ? ` · ${examScopeLabel(question)}` : ""} · ${question.points} puan</small>
      </div>
      <div class="selected-actions">
        <label class="quick-points selected-points">
          <span>Puan</span>
          <input type="number" min="1" value="${question.points}" data-action="points" />
        </label>
        <button class="ghost-action" data-action="remove" type="button">Çıkar</button>
      </div>
    `;
    row.querySelector('[data-action="points"]').addEventListener("change", (event) => updateQuestionPoints(question.id, event.target.value));
    row.querySelector('[data-action="remove"]').addEventListener("click", () => toggleQuestion(question.id));
    els.selectedList.append(row);
  });
}

function defaultExamArchiveTitle() {
  const className = state.examMeta.className ? ` ${state.examMeta.className}` : "";
  return `${currentCourse().name}${className} ${state.examMeta.term}. Dönem ${state.examMeta.examNumber}. Yazılı`;
}

function archivedExamsForCurrentCourse() {
  return state.archivedExams
    .filter((exam) => exam.courseId === currentCourse().id)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function currentExamSnapshot(id = state.activeExamArchiveId, title = els.examArchiveNameInput.value.trim()) {
  const selected = selectedQuestions();
  const now = new Date().toISOString();
  const answerSpaces = Object.fromEntries(selected.map((question) => [
    question.id,
    answerSpaceForBasketQuestion(question.id, question.courseId)
  ]));
  return {
    id: id || uid("exam"),
    courseId: currentCourse().id,
    title: title || defaultExamArchiveTitle(),
    meta: structuredClone(state.examMeta),
    questionIds: selected.map((question) => question.id),
    questionPoints: Object.fromEntries(selected.map((question) => [question.id, Number(question.points || 0)])),
    answerSpaces,
    createdAt: state.archivedExams.find((exam) => exam.id === id)?.createdAt || now,
    updatedAt: now
  };
}

function renderExamArchive() {
  const exams = archivedExamsForCurrentCourse();
  const activeExam = state.archivedExams.find((exam) => exam.id === state.activeExamArchiveId && exam.courseId === currentCourse().id);
  els.examArchiveNameInput.value = activeExam?.title || els.examArchiveNameInput.value || defaultExamArchiveTitle();
  els.examArchiveSelect.innerHTML = "";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = exams.length ? "Sınav seçiniz" : "Bu ders için kayıt yok";
  els.examArchiveSelect.append(emptyOption);
  exams.forEach((exam) => {
    const option = document.createElement("option");
    option.value = exam.id;
    option.textContent = `${exam.title} (${exam.questionIds.length} soru)`;
    els.examArchiveSelect.append(option);
  });
  els.examArchiveSelect.value = activeExam?.id || "";
  const hasArchiveSelection = Boolean(els.examArchiveSelect.value);
  els.loadExamArchiveBtn.disabled = !hasArchiveSelection;
  els.updateExamArchiveBtn.disabled = !state.activeExamArchiveId || !activeExam || !selectedQuestions().length;
  els.deleteExamArchiveBtn.disabled = !hasArchiveSelection;
  els.saveExamArchiveBtn.textContent = activeExam ? "Arşivi güncelle" : "Arşive kaydet";
  els.saveExamArchiveBtn.disabled = !selectedQuestions().length;
  els.saveExamArchiveAsBtn.disabled = !selectedQuestions().length;
}

function addAnalysisBucket(map, label, points) {
  const key = label || "Belirtilmedi";
  const data = map.get(key) || { count: 0, points: 0 };
  data.count += 1;
  data.points += Number(points || 0);
  map.set(key, data);
}

function analysisListHtml(entries, emptyText, { totalPoints = 0 } = {}) {
  if (!entries.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  return `
    <table class="analysis-distribution-table">
      <tbody>
        ${entries.map(([label, data]) => {
          const percent = totalPoints > 0 ? Math.round((data.points / totalPoints) * 100) : 0;
          const filledCells = Math.max(1, Math.round(percent / 10));
          const meter = Array.from({ length: 10 }, (_, index) => (
            `<td class="${index < filledCells ? "is-filled" : ""}">&nbsp;</td>`
          )).join("");
          return `
            <tr>
              <td class="analysis-dist-label">${escapeHtml(label)}</td>
              <td class="analysis-dist-bar">
                <table class="analysis-meter" cellspacing="0" cellpadding="0"><tr>${meter}</tr></table>
              </td>
              <td class="analysis-dist-value">${data.count} soru<br>${data.points} P</td>
              <td class="analysis-dist-percent">%${percent}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function buildAnalysisReportHtml({ printable = false } = {}) {
  const selected = selectedQuestions();
  if (!selected.length) {
    return `<div class="empty-state">Analiz için sınava soru ekleyin.</div>`;
  }
  const totalPoints = selected.reduce((sum, question) => sum + Number(question.points || 0), 0);
  const byUnit = new Map();
  const byOutcome = new Map();
  const byDifficulty = new Map();
  const byType = new Map();
  selected.forEach((question) => {
    const unit = question.topic || "Birim yok";
    const outcome = question.outcome || "Kazanım seçilmedi";
    const points = Number(question.points || 0);
    addAnalysisBucket(byUnit, unit, points);
    addAnalysisBucket(byOutcome, outcome, points);
    addAnalysisBucket(byDifficulty, question.difficulty || "Zorluk yok", points);
    addAnalysisBucket(byType, questionTypes[question.type] || question.type || "Soru türü yok", points);
  });
  const byCountThenName = (a, b) => b[1].count - a[1].count || b[1].points - a[1].points || a[0].localeCompare(b[0], "tr");
  const unitEntries = [...byUnit.entries()].sort(byCountThenName);
  const outcomeEntries = [...byOutcome.entries()].sort(byCountThenName);
  const difficultyEntries = [...byDifficulty.entries()].sort(byCountThenName);
  const typeEntries = [...byType.entries()].sort(byCountThenName);
  const dominantUnit = unitEntries[0]?.[0] || "-";
  const dominantOutcome = outcomeEntries[0]?.[0] || "-";
  const dominantDifficulty = difficultyEntries[0]?.[0] || "-";
  const rows = selected.map((question, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(stripHtml(question.content).slice(0, printable ? 105 : 90))}${stripHtml(question.content).length > (printable ? 105 : 90) ? "..." : ""}</td>
      <td>${escapeHtml(questionTypes[question.type] || question.type || "-")}</td>
      <td>${escapeHtml(question.difficulty || "-")}</td>
      <td>${escapeHtml(question.topic || "Birim yok")}</td>
      <td>${escapeHtml(question.outcome || "Kazanım seçilmedi")}</td>
      <td class="analysis-points-cell">${question.points} P</td>
    </tr>
  `).join("");
  const heading = printable ? `
    <div class="analysis-print-heading">
      <h3>${escapeHtml(currentCourse().name)} - ${escapeHtml(examTitle())} Analiz Raporu</h3>
      <p>${escapeHtml(state.examMeta.className || "")}${state.examMeta.date ? ` · ${escapeHtml(formatExamDate(state.examMeta.date))}` : ""}</p>
    </div>
  ` : "";
  const analysisBoxes = [
    {
      title: "Öğrenme birimi dağılımı",
      body: analysisListHtml(unitEntries, "Öğrenme birimi yok.", { totalPoints })
    },
    {
      title: "Hedeflenen kazanımlar",
      body: analysisListHtml(outcomeEntries, "Kazanım seçilmedi.", { totalPoints })
    },
    {
      title: "Zorluk dağılımı",
      body: analysisListHtml(difficultyEntries, "Zorluk bilgisi yok.", { totalPoints })
    },
    {
      title: "Soru türü dağılımı",
      body: analysisListHtml(typeEntries, "Soru türü yok.", { totalPoints })
    }
  ];
  const analysisBoxHtml = (box) => {
    const boxTag = printable ? "div" : "section";
    return `
    <${boxTag} class="analysis-box">
      <h3>${box.title}</h3>
      ${box.body}
    </${boxTag}>
  `;
  };
  const analysisGrid = printable ? `
    <table class="analysis-grid-table">
      <tr>
        <td class="analysis-grid-cell">${analysisBoxHtml(analysisBoxes[0])}</td>
        <td class="analysis-grid-cell analysis-grid-cell-right">${analysisBoxHtml(analysisBoxes[1])}</td>
      </tr>
      <tr>
        <td class="analysis-grid-cell">${analysisBoxHtml(analysisBoxes[2])}</td>
        <td class="analysis-grid-cell analysis-grid-cell-right">${analysisBoxHtml(analysisBoxes[3])}</td>
      </tr>
    </table>
  ` : `
    <div class="analysis-grid">
      ${analysisBoxes.map(analysisBoxHtml).join("")}
    </div>
  `;
  return `
    ${heading}
    <table class="analysis-kpi-table">
      <tr>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Soru</p><p class="analysis-kpi-value">${selected.length}</p><p class="analysis-kpi-note">Seçili soru</p></td>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Öğrenme birimi</p><p class="analysis-kpi-value">${unitEntries.length}</p><p class="analysis-kpi-note">Farklı birim</p></td>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Kazanım</p><p class="analysis-kpi-value">${outcomeEntries.length}</p><p class="analysis-kpi-note">Farklı kazanım</p></td>
        <td class="analysis-kpi-card"><p class="analysis-kpi-label">Zorluk</p><p class="analysis-kpi-value">${escapeHtml(dominantDifficulty)}</p><p class="analysis-kpi-note">${difficultyEntries[0]?.[1].count || 0} soru</p></td>
      </tr>
    </table>
    <div class="analysis-brief">
      <span class="analysis-brief-title">Özet:</span>
      En yoğun birim ${escapeHtml(dominantUnit)}, öne çıkan kazanım ${escapeHtml(dominantOutcome)}, zorluk ${escapeHtml(dominantDifficulty)}.
    </div>
    ${analysisGrid}
    <table class="analysis-table">
      <thead>
        <tr><th>#</th><th>Soru özeti</th><th>Tür</th><th>Zorluk</th><th>Birim</th><th>Ölçülen kazanım</th><th>Puan</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderExamAnalysis() {
  const html = buildAnalysisReportHtml();
  els.examAnalysisReport.innerHTML = html;
  els.examAnalysisPrintable.innerHTML = buildAnalysisReportHtml({ printable: true });
}

function selectedQuestionRowHtml(question, index, options = {}) {
  const showAnswer = options.showAnswer;
  const answerSpace = answerSpaceForBasketQuestion(question.id, question.courseId);
  return `
    <span class="selected-index">${index + 1}</span>
    <div>
      <p>${stripHtml(question.content).slice(0, 180)}${stripHtml(question.content).length > 180 ? "..." : ""}</p>
      <small>${questionTypes[question.type]} · ${question.topic || "Birim yok"}${examScopeLabel(question) ? ` · ${examScopeLabel(question)}` : ""} · ${question.points} puan</small>
    </div>
    <div class="selected-actions">
      <label class="quick-points selected-points">
        <span>Puan</span>
        <input type="number" min="1" value="${question.points}" data-action="points" />
      </label>
      <label class="basket-answer-space-select">
        <span>Cevap boşluğu</span>
        <select data-action="expected-answer-items">
          <option value="0" ${answerSpace.expectedAnswerItems ? "" : "selected"}>Otomatik</option>
          ${Array.from({ length: 12 }, (_, index) => {
            const value = index + 1;
            return `<option value="${value}" ${answerSpace.expectedAnswerItems === value ? "selected" : ""}>${value} satır</option>`;
          }).join("")}
          ${[15, 20, 25, 30].map((value) => (
            `<option value="${value}" ${answerSpace.expectedAnswerItems === value ? "selected" : ""}>${value} satır</option>`
          )).join("")}
        </select>
      </label>
      <button class="ghost-action" data-action="remove" type="button">Çıkar</button>
    </div>
    ${showAnswer ? `
      <div class="basket-qa">
        <section>
          <h3>Soru</h3>
          <div>${question.content}${renderQuestionSupplements(question, "bank")}</div>
        </section>
        <section>
          <h3>Cevap</h3>
          <div>${answerKeyHtml(question) || "<p>Cevap girilmedi.</p>"}</div>
        </section>
      </div>
    ` : ""}
  `;
}

function bindSelectedQuestionRow(row, question) {
  row.querySelector('[data-action="points"]').addEventListener("change", (event) => updateQuestionPoints(question.id, event.target.value));
  row.querySelector('[data-action="remove"]').addEventListener("click", () => toggleQuestion(question.id));
  row.querySelector('[data-action="expected-answer-items"]')?.addEventListener("change", (event) => {
    const value = Number(event.target.value || 0);
    updateBasketAnswerSpace(question.id, {
      answerSpaceMode: "auto",
      expectedAnswerItems: Number.isFinite(value) ? value : 0
    }, question.courseId);
  });
}

function renderExamCart() {
  const selected = selectedQuestions();
  const totalPoints = selected.reduce((sum, question) => sum + Number(question.points || 0), 0);
  els.cartQuestionCount.textContent = `${selected.length} soru`;
  els.cartPointCount.textContent = `${totalPoints} puan`;
  els.cartDialogQuestionCount.textContent = selected.length;
  els.cartDialogPointCount.textContent = totalPoints;
  renderCartWarnings(selected, totalPoints);
  els.examCartBtn.classList.toggle("is-empty", !selected.length);
  els.clearCartBtn.disabled = !selected.length;
  els.goExamFromCartBtn.disabled = !selected.length;
  els.cartViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.cartView === cartViewMode);
  });
  els.basketSectionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.basketSection === basketSectionMode);
  });
  els.basketSections.forEach((section) => {
    section.hidden = section.dataset.basketSectionPanel !== basketSectionMode;
  });
  els.cartSelectedList.innerHTML = "";
  if (!selected.length) {
    els.cartSelectedList.innerHTML = `<div class="empty-state">Sepette soru yok. Soru havuzundan sınava soru ekleyebilirsiniz.</div>`;
    return;
  }
  selected.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = `selected-row basket-row${cartViewMode === "qa" ? " is-expanded" : ""}`;
    row.innerHTML = selectedQuestionRowHtml(question, index, { showAnswer: cartViewMode === "qa" });
    bindSelectedQuestionRow(row, question);
    els.cartSelectedList.append(row);
  });
}

function renderCartWarnings(selected, totalPoints) {
  if (!els.cartWarningList) return;
  const warnings = [];
  const topicCounts = selected.reduce((counts, question) => {
    const topic = question.topic || "Birim yok";
    counts.set(topic, (counts.get(topic) || 0) + 1);
    return counts;
  }, new Map());
  const repeatedTopic = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (repeatedTopic && repeatedTopic[1] >= 3) {
    warnings.push(`Bu sınavda ${repeatedTopic[1]} soru "${repeatedTopic[0]}" biriminden.`);
  }
  const scopes = new Set(selected.map(examScopeLabel).filter(Boolean));
  const hasUnscoped = selected.some((question) => !examScopeLabel(question));
  if (scopes.size > 1 || (scopes.size === 1 && hasUnscoped)) {
    warnings.push("Farklı dönem/yazılı kapsamından soru var.");
  }
  els.cartWarningList.innerHTML = warnings.map((warning) => `<div>${escapeHtml(warning)}</div>`).join("");
  els.cartWarningList.hidden = !warnings.length;
}

function openQuestionPreview(id) {
  previewQuestionIds = filteredQuestions().map((question) => question.id);
  if (!previewQuestionIds.includes(id)) {
    previewQuestionIds = questionsForCurrentCourse().map((question) => question.id);
  }
  currentPreviewQuestionId = id;
  renderQuestionPreview();
  els.questionPreviewDialog.showModal();
}

function renderQuestionPreview() {
  const question = state.questions.find((item) => item.id === currentPreviewQuestionId);
  if (!question) return;
  const previewIndex = previewQuestionIds.indexOf(question.id);
  const hasSequence = previewIndex >= 0 && previewQuestionIds.length > 0;
  const isSelected = basketIdsForCourse().includes(question.id);
  els.previewQuestionMeta.innerHTML = [
    questionTypes[question.type],
    `${question.points} puan`,
    examScopeLabel(question)
  ].filter(Boolean).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("");
  const contextRows = [
    ["Öğrenme birimi", question.topic || "Birim yok"],
    ["Kazanım", question.outcome || "Kazanım seçilmedi"]
  ];
  els.previewQuestionContext.innerHTML = contextRows.map(([label, value]) => `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
  els.previewQuestionContent.innerHTML = `${question.content}${renderQuestionSupplements(question, "bank")}`;
  els.previewAnswerContent.innerHTML = answerKeyHtml(question);
  els.previewQuestionCounter.textContent = hasSequence ? `${previewIndex + 1} / ${previewQuestionIds.length}` : "1 / 1";
  els.previewQuestionPoints.value = question.points;
  els.previewToggleExamBtn.textContent = isSelected ? "Sınavdan çıkar" : "Sınava ekle";
  els.prevPreviewBtn.disabled = !hasSequence || previewQuestionIds.length <= 1;
  els.nextPreviewBtn.disabled = !hasSequence || previewQuestionIds.length <= 1;
}

function moveQuestionPreview(direction) {
  if (!previewQuestionIds.length) return;
  const currentIndex = Math.max(0, previewQuestionIds.indexOf(currentPreviewQuestionId));
  const nextIndex = (currentIndex + direction + previewQuestionIds.length) % previewQuestionIds.length;
  currentPreviewQuestionId = previewQuestionIds[nextIndex];
  renderQuestionPreview();
}

function renderQuestionSupplements(question, mode = "exam") {
  if (question.type === "multipleChoice") {
    const choices = question.choices
      .filter((choice) => choice.text.trim())
      .map((choice) => `<li><strong>${choice.label})</strong> ${escapeHtml(choice.text)}</li>`)
      .join("");
    return choices ? `<ol class="choice-preview">${choices}</ol>` : "";
  }
  if (question.type === "trueFalse" && mode === "exam") {
    return `<div class="true-false-line">Doğru ( ) &nbsp;&nbsp; Yanlış ( )</div>`;
  }
  return "";
}

function answerKeyHtml(question) {
  if (question.type === "multipleChoice") {
    const correct = question.choices.find((choice) => choice.id === question.correctChoiceId);
    return `<p><strong>Doğru seçenek:</strong> ${correct ? `${correct.label}) ${escapeHtml(correct.text)}` : "-"}</p>${question.answer || ""}`;
  }
  if (question.type === "trueFalse") {
    return `<p><strong>Doğru cevap:</strong> ${question.correctBoolean ? "Doğru" : "Yanlış"}</p>${question.answer || ""}`;
  }
  if (question.type === "shortAnswer") {
    const answers = question.acceptedAnswers.length ? question.acceptedAnswers.map(escapeHtml).join(", ") : "-";
    return `<p><strong>Kabul edilen cevaplar:</strong> ${answers}</p>${question.answer || ""}`;
  }
  return question.answer || "<p>Cevap eklenmedi.</p>";
}

function renderCourseOptions() {
  els.questionCourse.innerHTML = "";
  state.courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.name;
    els.questionCourse.append(option);
  });
  if (!state.editingQuestionId) {
    els.questionCourse.value = state.selectedCourseId;
  }
}

function courseForQuestionForm() {
  return state.courses.find((course) => course.id === els.questionCourse.value) || currentCourse();
}

function renderCurriculumSelectors(preferredTopic = els.questionTopic.value, preferredOutcome = els.questionOutcome.value) {
  const course = courseForQuestionForm();
  const curriculumTopics = topicOptionsForCourse(course);
  const questionTopics = [...new Set(state.questions
    .filter((question) => question.courseId === course.id)
    .map((question) => question.topic)
    .filter(Boolean))];
  const topics = [...new Set([...curriculumTopics, ...questionTopics])];

  els.questionTopic.innerHTML = `<option value="">Öğrenme birimi seçiniz</option>`;
  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    els.questionTopic.append(option);
  });
  if (preferredTopic && !topics.includes(preferredTopic)) {
    const option = document.createElement("option");
    option.value = preferredTopic;
    option.textContent = preferredTopic;
    els.questionTopic.append(option);
  }
  els.questionTopic.value = preferredTopic || "";

  const curriculumOutcomes = outcomeOptionsForTopic(els.questionTopic.value, course);
  const questionOutcomes = [...new Set(state.questions
    .filter((question) => question.courseId === course.id && (!els.questionTopic.value || question.topic === els.questionTopic.value))
    .map((question) => question.outcome)
    .filter(Boolean))];
  const outcomes = [...new Set([...curriculumOutcomes, ...questionOutcomes])];

  els.questionOutcome.innerHTML = `<option value="">Kazanım seçiniz</option>`;
  outcomes.forEach((outcome) => {
    const option = document.createElement("option");
    option.value = outcome;
    option.textContent = outcome;
    els.questionOutcome.append(option);
  });
  if (preferredOutcome && !outcomes.includes(preferredOutcome)) {
    const option = document.createElement("option");
    option.value = preferredOutcome;
    option.textContent = preferredOutcome;
    els.questionOutcome.append(option);
  }
  els.questionOutcome.value = preferredOutcome || "";
}

function renderCurriculumManager() {
  const topics = topicOptionsForCourse();
  if (!topics.includes(state.selectedCurriculumTopic)) {
    state.selectedCurriculumTopic = topics[0] || "";
  }

  els.curriculumTopicList.innerHTML = "";
  if (!topics.length) {
    els.curriculumTopicList.innerHTML = `<div class="empty-state">Bu ders için öğrenme birimi yok. Manuel ekleyebilir veya PDF'den aktarabilirsiniz.</div>`;
  } else {
    topics.forEach((topic) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `topic-item${topic === state.selectedCurriculumTopic ? " is-active" : ""}`;
      button.innerHTML = `
        <span>${escapeHtml(topic)}</span>
        <small>${outcomeOptionsForTopic(topic).length} kazanım</small>
        <span class="topic-actions">
          <span data-action="edit-unit">Düzenle</span>
          <span data-action="delete-unit">Sil</span>
        </span>
      `;
      button.addEventListener("click", () => {
        state.selectedCurriculumTopic = topic;
        saveState();
        renderCurriculumManager();
      });
      button.querySelector('[data-action="edit-unit"]').addEventListener("click", (event) => {
        event.stopPropagation();
        editUnit(topic);
      });
      button.querySelector('[data-action="delete-unit"]').addEventListener("click", (event) => {
        event.stopPropagation();
        deleteUnit(topic);
      });
      els.curriculumTopicList.append(button);
    });
  }

  els.selectedTopicTitle.textContent = state.selectedCurriculumTopic || "Birim seçiniz";
  els.curriculumOutcomeList.innerHTML = "";
  const outcomes = outcomeOptionsForTopic(state.selectedCurriculumTopic);
  if (!state.selectedCurriculumTopic) {
    els.curriculumOutcomeList.innerHTML = `<div class="empty-state">Kazanım eklemek için önce öğrenme birimi seçin.</div>`;
    return;
  }
  if (!outcomes.length) {
    els.curriculumOutcomeList.innerHTML = `<div class="empty-state">Bu öğrenme birimi için kazanım yok.</div>`;
    return;
  }
  outcomes.forEach((outcome) => {
    const row = document.createElement("div");
    row.className = "outcome-item";
    row.innerHTML = `
      <span>${escapeHtml(outcome)}</span>
      <div>
        <button type="button" data-action="edit">Düzenle</button>
        <button type="button" data-action="delete">Sil</button>
      </div>
    `;
    row.querySelector('[data-action="edit"]').addEventListener("click", () => editOutcome(state.selectedCurriculumTopic, outcome));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteOutcome(state.selectedCurriculumTopic, outcome));
    els.curriculumOutcomeList.append(row);
  });
}

async function addTopic() {
  const topic = await appPrompt({
    title: "Öğrenme birimi ekle",
    label: "Öğrenme birimi adı",
    placeholder: "Örn. 1. Hukuka Giriş",
    okText: "Birim ekle"
  });
  if (!topic?.trim()) return;
  const outcome = await appPrompt({
    title: "İlk kazanımı ekle",
    label: "Bu öğrenme birimi için ilk kazanım",
    placeholder: "Örn. Hukuk kavramını açıklar.",
    okText: "Kazanım ekle"
  });
  if (!outcome?.trim()) return;
  state.curriculumItems.push({
    courseName: currentCourse().name,
    unit: topic.trim(),
    topic: topic.trim(),
    outcome: outcome.trim()
  });
  state.selectedCurriculumTopic = topic.trim();
  saveState();
  render();
}

async function addOutcome() {
  if (!state.selectedCurriculumTopic) {
    await addTopic();
    return;
  }
  const outcome = await appPrompt({
    title: "Kazanım ekle",
    label: `${state.selectedCurriculumTopic} öğrenme birimi için kazanım`,
    placeholder: "Kazanımı yazın",
    okText: "Kazanım ekle"
  });
  if (!outcome?.trim()) return;
  state.curriculumItems.push({
    courseName: currentCourse().name,
    unit: state.selectedCurriculumTopic,
    topic: state.selectedCurriculumTopic,
    outcome: outcome.trim()
  });
  saveState();
  render();
}

async function editOutcome(topic, oldOutcome) {
  const nextOutcome = await appPrompt({
    title: "Kazanımı düzenle",
    label: "Kazanım",
    value: oldOutcome,
    okText: "Kaydet"
  });
  if (!nextOutcome?.trim() || nextOutcome.trim() === oldOutcome) return;
  const courseName = currentCourse().name;
  const topicKey = normalizeCurriculumText(topic);
  state.curriculumItems = state.curriculumItems.map((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return matchesCourse && normalizeCurriculumText(item.unit || item.topic) === topicKey && item.outcome === oldOutcome
      ? { ...item, outcome: nextOutcome.trim() }
      : item;
  });
  saveState();
  render();
}

async function deleteOutcome(topic, outcome) {
  if (!await appConfirm("Bu kazanım silinsin mi?", { title: "Kazanımı sil", okText: "Sil" })) return;
  const courseName = currentCourse().name;
  const topicKey = normalizeCurriculumText(topic);
  state.curriculumItems = state.curriculumItems.filter((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return !(matchesCourse && normalizeCurriculumText(item.unit || item.topic) === topicKey && item.outcome === outcome);
  });
  saveState();
  render();
}

async function editUnit(oldUnit) {
  const nextUnit = await appPrompt({
    title: "Öğrenme birimini düzenle",
    label: "Öğrenme birimi adı",
    value: oldUnit,
    okText: "Kaydet"
  });
  if (!nextUnit?.trim() || nextUnit.trim() === oldUnit) return;
  const courseName = currentCourse().name;
  const oldUnitKey = normalizeCurriculumText(oldUnit);
  state.curriculumItems = state.curriculumItems.map((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return matchesCourse && normalizeCurriculumText(item.unit || item.topic) === oldUnitKey
      ? { ...item, unit: nextUnit.trim(), topic: nextUnit.trim() }
      : item;
  });
  state.selectedCurriculumTopic = nextUnit.trim();
  saveState();
  render();
}

async function deleteUnit(unit) {
  if (!await appConfirm(`${unit} öğrenme birimi ve bağlı kazanımları silinsin mi?`, { title: "Öğrenme birimini sil", okText: "Sil" })) return;
  const courseName = currentCourse().name;
  const unitKey = normalizeCurriculumText(unit);
  state.curriculumItems = state.curriculumItems.filter((item) => {
    const matchesCourse = courseNameMatches(item.courseName, courseName);
    return !(matchesCourse && normalizeCurriculumText(item.unit || item.topic) === unitKey);
  });
  if (normalizeCurriculumText(state.selectedCurriculumTopic) === unitKey) state.selectedCurriculumTopic = "";
  saveState();
  render();
}

function openCreateCourse() {
  els.courseForm.reset();
  els.courseIdInput.value = "";
  els.courseDialogTitle.textContent = "Ders ekle";
  els.saveCourseBtn.textContent = "Ekle";
  els.courseDialog.showModal();
}

function openEditCourse(id) {
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  els.courseIdInput.value = course.id;
  els.courseNameInput.value = course.name;
  els.courseGradeInput.value = course.grade || "";
  els.courseDialogTitle.textContent = "Dersi düzenle";
  els.saveCourseBtn.textContent = "Kaydet";
  els.courseDialog.showModal();
}

function saveCourse(event) {
  event.preventDefault();
  const name = els.courseNameInput.value.trim();
  if (!name) return;
  const existingId = els.courseIdInput.value;
  if (existingId) {
    const existingCourse = state.courses.find((course) => course.id === existingId);
    const previousName = existingCourse?.name || name;
    state.courses = state.courses.map((course) =>
      course.id === existingId ? { ...course, name, grade: els.courseGradeInput.value.trim() } : course
    );
    state.curriculumItems = state.curriculumItems.map((item) =>
      courseNameMatches(item.courseName, previousName) ? { ...item, courseName: name } : item
    );
  } else {
    const course = {
      id: uid("course"),
      name,
      grade: els.courseGradeInput.value.trim(),
      color: palette[state.courses.length % palette.length]
    };
    state.courses.push(course);
    state.selectedCourseId = course.id;
  }
  saveState();
  render();
  els.courseDialog.close();
}

async function deleteCourse(id) {
  if (state.courses.length <= 1) {
    showToast("En az bir ders kalmalı.", "warning");
    return;
  }
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  const questionCount = state.questions.filter((question) => question.courseId === id).length;
  const confirmed = await appConfirm(`${course.name} dersi ve bu derse bağlı ${questionCount} soru silinsin mi?`, {
    title: "Dersi sil",
    okText: "Sil"
  });
  if (!confirmed) return;
  state.courses = state.courses.filter((item) => item.id !== id);
  const deletedQuestionIds = state.questions.filter((question) => question.courseId === id).map((question) => question.id);
  state.questions = state.questions.filter((question) => question.courseId !== id);
  state.curriculumItems = state.curriculumItems.filter((item) => !courseNameMatches(item.courseName, course.name));
  state.archivedExams = state.archivedExams.filter((exam) => exam.courseId !== id);
  delete state.examBaskets[id];
  if (state.examAnswerSpaces) delete state.examAnswerSpaces[id];
  state.selectedQuestionIds = flattenExamBaskets(state.examBaskets);
  deletedQuestionIds.forEach((questionId) => bulkSelectedQuestionIds.delete(questionId));
  if (state.selectedCourseId === id) {
    state.selectedCourseId = state.courses[0].id;
    state.activeExamArchiveId = "";
    bulkSelectedQuestionIds.clear();
  }
  if (deletedQuestionIds.includes(state.editingQuestionId)) {
    resetQuestionForm();
  }
  saveState();
  render();
}

function syncExamMeta() {
  const course = currentCourse();
  els.examCourseInput.value = course.name;
  els.examTermSelect.value = state.examMeta.term;
  els.examNumberSelect.value = state.examMeta.examNumber;
  
  const courseGrade = course.grade || "";
  const currentVal = state.examMeta.className || "";
  const courseGradeNum = String(courseGrade).match(/\d+/)?.[0] || "";
  const currentValNum = String(currentVal).match(/\d+/)?.[0] || "";
  
  if (courseGradeNum && (currentValNum !== courseGradeNum || !currentVal)) {
    const branchMatch = currentVal.match(/\/[A-Za-z0-9]+/);
    const branch = branchMatch ? branchMatch[0] : "";
    state.examMeta.className = courseGradeNum + branch;
  }
  
  els.examClassInput.value = state.examMeta.className || "";
  els.examDurationInput.value = state.examMeta.duration;
  els.examDateInput.value = state.examMeta.date || "";
  els.examPageTargetSelect.value = state.examMeta.pageTarget || "auto";
  els.examColumnSelect.value = state.examMeta.columns || "1";
  els.examOutputTypeSelect.value = state.examMeta.outputType || "exam";
  els.answerKeyModeSelect.value = state.examMeta.answerKeyMode || "answers";
  els.examInstructionInput.value = state.examMeta.instruction;
}

function syncSettings() {
  els.schoolNameInput.value = state.settings.schoolName;
  els.academicYearInput.value = state.settings.academicYear;
  renderTeacherList();
}

function renderTeacherList() {
  els.teacherList.innerHTML = "";
  if (!state.settings.teachers.length) {
    els.teacherList.innerHTML = `<div class="teacher-empty">Henüz öğretmen eklenmedi.</div>`;
    return;
  }
  state.settings.teachers.forEach((teacher, index) => {
    const item = document.createElement("div");
    item.className = "teacher-item";
    item.innerHTML = `
      <span>${escapeHtml(teacher)}</span>
      <button type="button" aria-label="Öğretmeni kaldır">×</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.settings.teachers.splice(index, 1);
      saveState();
      renderTeacherList();
    });
    els.teacherList.append(item);
  });
}

function setView(view) {
  if (view === "question") {
    if (els.questionEditorDialog && !els.questionEditorDialog.open) {
      els.questionEditorDialog.showModal();
    }
    if (!state.currentView || state.currentView === "question") {
      setView("bank");
    }
    return;
  }
  state.currentView = view;
  document.body.classList.toggle("settings-mode", view === "settings");
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === view));
  if (els.appNavMobileSelect) {
    els.appNavMobileSelect.value = view;
  }
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("is-active", panel.id === `${view}View`));
  document.querySelector("#settingsBtn").classList.toggle("is-active", view === "settings");
  saveState();
}

function toggleQuestion(id) {
  const basketIds = basketIdsForCourse();
  const courseId = currentCourse().id;
  const wasSelected = basketIds.includes(id);
  if (wasSelected) {
    setBasketIdsForCourse(basketIds.filter((questionId) => questionId !== id));
  } else {
    setBasketIdsForCourse([...basketIds, id]);
  }
  const token = Date.now();
  cartFeedback = { courseId, type: wasSelected ? "removed" : "added", token };
  saveState();
  render();
  setTimeout(() => {
    if (cartFeedback?.token === token) {
      cartFeedback = null;
      renderCourses();
    }
  }, 950);
  if (els.questionPreviewDialog.open && currentPreviewQuestionId === id) {
    renderQuestionPreview();
  }
}

function updateQuestionPoints(id, value) {
  const points = Math.min(100, Math.max(1, Number(value || 1)));
  state.questions = state.questions.map((question) => question.id === id ? { ...question, points } : question);
  saveState();
  renderMetrics();
  renderQuestions();
  renderSelectedQuestions();
  renderExamCart();
  renderExamArchive();
  renderExamAnalysis();
  if (els.questionPreviewDialog.open && currentPreviewQuestionId === id) {
    renderQuestionPreview();
  }
}

function editQuestion(id) {
  const storedQuestion = state.questions.find((item) => item.id === id);
  if (!storedQuestion) return;
  const question = normalizeQuestion(storedQuestion);
  state.editingQuestionId = id;
  els.deleteQuestionBtn.hidden = false;
  
  const titleEl = document.querySelector("#questionEditorTitle");
  if (titleEl) titleEl.textContent = "Soru Düzenle";
  
  els.questionType.value = question.type;
  els.questionCourse.value = question.courseId;
  renderCurriculumSelectors(question.topic, question.outcome);
  els.questionGrade.value = question.grade || gradeValueForCourse(courseForQuestionForm());
  els.questionDifficulty.value = question.difficulty;
  els.questionExamScope.value = examScopeValue(question);
  els.questionPoints.value = question.points;
  els.questionTags.value = question.tags.join(", ");
  els.questionNote.value = question.note;
  els.questionContent.innerHTML = question.content;
  els.answerContent.innerHTML = question.answer;
  renderChoiceEditor(question.choices, question.correctChoiceId);
  els.correctBoolean.value = String(question.correctBoolean);
  els.acceptedAnswers.value = question.acceptedAnswers.join("\n");
  updateTypePanels();
  setView("question");
}

function resetQuestionForm() {
  state.editingQuestionId = null;
  els.deleteQuestionBtn.hidden = true;
  
  const titleEl = document.querySelector("#questionEditorTitle");
  if (titleEl) titleEl.textContent = "Yeni Soru Ekle";
  
  els.questionType.value = "open";
  els.questionCourse.value = state.selectedCourseId;
  renderCurriculumSelectors("", "");
  syncQuestionGradeFromCourse(true);
  els.questionDifficulty.value = "Orta";
  els.questionExamScope.value = "";
  els.questionPoints.value = 10;
  els.questionTags.value = "";
  els.questionNote.value = "";
  els.questionContent.innerHTML = "";
  els.answerContent.innerHTML = "";
  renderChoiceEditor(choiceLabels.slice(0, 4).map((label) => ({ id: label, label, text: "" })), "A");
  els.correctBoolean.value = "true";
  els.acceptedAnswers.value = "";
  updateTypePanels();
}

function updateTypePanels() {
  const type = els.questionType.value;
  const mode = editorModes[type] || editorModes.open;
  els.questionPromptLabel.textContent = mode.promptLabel;
  els.answerLabel.textContent = mode.answerLabel;
  els.questionContent.dataset.placeholder = mode.questionPlaceholder;
  els.answerContent.dataset.placeholder = mode.answerPlaceholder;
  els.multipleChoicePanel.classList.toggle("is-active", type === "multipleChoice");
  els.trueFalsePanel.classList.toggle("is-active", type === "trueFalse");
  els.shortAnswerPanel.classList.toggle("is-active", type === "shortAnswer");
}

function renderChoiceEditor(choices, correctChoiceId) {
  els.choiceList.innerHTML = "";
  const normalizedChoices = choices.length ? choices : choiceLabels.slice(0, 4).map((label) => ({ id: label, label, text: "" }));
  normalizedChoices.forEach((choice, index) => {
    const row = document.createElement("div");
    row.className = "choice-row";
    row.dataset.choiceId = choice.id;
    row.innerHTML = `
      <span class="choice-label">${choice.label}</span>
      <input type="text" value="${escapeHtml(choice.text)}" placeholder="${choice.label} seçeneği" />
      <button class="choice-remove" type="button" ${normalizedChoices.length <= 2 ? "disabled" : ""} title="Seçeneği sil">×</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      if (els.choiceList.children.length <= 2) return;
      row.remove();
      refreshChoiceLabels();
    });
    els.choiceList.append(row);
  });
  refreshChoiceLabels(correctChoiceId);
}

function refreshChoiceLabels(preferredCorrectId = els.correctChoice.value) {
  [...els.choiceList.children].forEach((row, index) => {
    const label = choiceLabels[index];
    row.dataset.choiceId = label;
    row.querySelector(".choice-label").textContent = label;
    row.querySelector("input").placeholder = `${label} seçeneği`;
  });
  els.correctChoice.innerHTML = "";
  [...els.choiceList.children].forEach((row, index) => {
    const label = choiceLabels[index];
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    els.correctChoice.append(option);
  });
  els.correctChoice.value = [...els.correctChoice.options].some((option) => option.value === preferredCorrectId)
    ? preferredCorrectId
    : "A";
  [...els.choiceList.querySelectorAll(".choice-remove")].forEach((button) => {
    button.disabled = els.choiceList.children.length <= 2;
  });
}

function getChoicesFromEditor() {
  return [...els.choiceList.children].map((row, index) => ({
    id: choiceLabels[index],
    label: choiceLabels[index],
    text: row.querySelector("input").value.trim()
  }));
}

function saveQuestion(event) {
  event.preventDefault();
  clearResizableSelection();
  const content = cleanEditorHtmlForSave(els.questionContent.innerHTML).trim();
  if (!stripHtml(content)) {
    showToast("Soru metni boş olamaz.", "warning");
    return;
  }
  const now = new Date().toISOString();
  const choices = getChoicesFromEditor();
  const [examTerm = "", examNumber = ""] = els.questionExamScope.value.split("-");
  const payload = {
    type: els.questionType.value,
    courseId: els.questionCourse.value,
    topic: els.questionTopic.value.trim(),
    outcome: els.questionOutcome.value.trim(),
    grade: els.questionGrade.value.trim(),
    difficulty: els.questionDifficulty.value,
    examTerm,
    examNumber,
    points: Math.min(100, Math.max(1, Number(els.questionPoints.value || 10))),
    tags: els.questionTags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
    note: els.questionNote.value.trim(),
    content,
    answer: cleanEditorHtmlForSave(els.answerContent.innerHTML).trim(),
    choices,
    correctChoiceId: els.correctChoice.value || choices[0]?.id || "A",
    correctBoolean: els.correctBoolean.value === "true",
    acceptedAnswers: els.acceptedAnswers.value.split("\n").map((answer) => answer.trim()).filter(Boolean),
    updatedAt: now
  };

  if (payload.type === "multipleChoice" && choices.filter((choice) => choice.text.trim()).length < 2) {
    showToast("Çoktan seçmeli soru için en az iki seçenek girin.", "warning");
    return;
  }

  if (state.editingQuestionId) {
    state.questions = state.questions.map((question) =>
      question.id === state.editingQuestionId ? { ...question, ...payload } : question
    );
    showToast("Soru başarıyla güncellendi.", "success");
  } else {
    const id = uid("q");
    state.questions.unshift({ id, ...payload, createdAt: now });
    state.editingQuestionId = id;
    showToast("Yeni soru başarıyla eklendi.", "success");
  }

  state.selectedCourseId = payload.courseId;
  saveState();
  render();
  
  editQuestion(state.editingQuestionId);
}

async function deleteQuestionById(id) {
  if (!id || !state.questions.some((question) => question.id === id)) return false;
  const confirmed = await appConfirm("Bu soru silinsin mi?", { title: "Soruyu sil", okText: "Sil" });
  if (!confirmed) return false;
  state.questions = state.questions.filter((question) => question.id !== id);
  Object.keys(state.examBaskets || {}).forEach((courseId) => {
    setBasketIdsForCourse(basketIdsForCourse(courseId).filter((questionId) => questionId !== id), courseId);
  });
  bulkSelectedQuestionIds.delete(id);
  if (state.editingQuestionId === id) {
    resetQuestionForm();
  }
  if (currentPreviewQuestionId === id) {
    previewQuestionIds = previewQuestionIds.filter((questionId) => questionId !== id);
    currentPreviewQuestionId = previewQuestionIds[0] || "";
    if (!currentPreviewQuestionId && els.questionPreviewDialog.open) {
      els.questionPreviewDialog.close();
    }
  }
  saveState();
  render();
  if (els.questionPreviewDialog.open && currentPreviewQuestionId) {
    renderQuestionPreview();
  }
  showToast("Soru silindi.");
  return true;
}

function toggleVisibleQuestionSelection() {
  const visibleIds = filteredQuestions().map((question) => question.id);
  if (!visibleIds.length) return;
  const allVisibleSelected = visibleIds.every((id) => bulkSelectedQuestionIds.has(id));
  visibleIds.forEach((id) => {
    if (allVisibleSelected) {
      bulkSelectedQuestionIds.delete(id);
    } else {
      bulkSelectedQuestionIds.add(id);
    }
  });
  renderQuestions();
}

async function deleteBulkQuestions() {
  const selectedIds = selectedBulkQuestions();
  if (!selectedIds.length) return;
  const confirmed = await appConfirm(`${selectedIds.length} soru kalıcı olarak silinsin mi?`, {
    title: "Seçili soruları sil",
    okText: "Sil"
  });
  if (!confirmed) return;
  const selectedIdSet = new Set(selectedIds);
  state.questions = state.questions.filter((question) => !selectedIdSet.has(question.id));
  Object.keys(state.examBaskets || {}).forEach((courseId) => {
    setBasketIdsForCourse(basketIdsForCourse(courseId).filter((questionId) => !selectedIdSet.has(questionId)), courseId);
  });
  if (selectedIdSet.has(state.editingQuestionId)) {
    resetQuestionForm();
  }
  if (selectedIdSet.has(currentPreviewQuestionId)) {
    previewQuestionIds = previewQuestionIds.filter((questionId) => !selectedIdSet.has(questionId));
    currentPreviewQuestionId = previewQuestionIds[0] || "";
    if (!currentPreviewQuestionId && els.questionPreviewDialog.open) {
      els.questionPreviewDialog.close();
    }
  }
  bulkSelectedQuestionIds.clear();
  saveState();
  render();
  showToast(`${selectedIds.length} soru silindi.`);
}

async function deleteCurrentQuestion() {
  if (!state.editingQuestionId) return;
  await deleteQuestionById(state.editingQuestionId);
}

function randomPick() {
  const count = Math.max(1, Number(els.randomCount.value || 1));
  const pool = questionsForCurrentCourse().filter((question) => {
    const scopeMatches = !els.randomScope.value || (
      question.examTerm === state.examMeta.term && question.examNumber === state.examMeta.examNumber
    );
    return (
      (!els.randomTopic.value || question.topic === els.randomTopic.value) &&
      (!els.randomDifficulty.value || question.difficulty === els.randomDifficulty.value) &&
      scopeMatches
    );
  });
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  setBasketIdsForCourse([...basketIdsForCourse(), ...shuffled.map((question) => question.id)]);
  saveState();
  render();
}

function clearSelectedForCurrentCourse() {
  setBasketIdsForCourse([]);
  saveState();
  render();
}

function updateExamMeta() {
  state.examMeta = {
    term: els.examTermSelect.value,
    examNumber: els.examNumberSelect.value,
    className: els.examClassInput.value,
    duration: els.examDurationInput.value,
    date: els.examDateInput.value,
    pageTarget: els.examPageTargetSelect.value,
    columns: els.examColumnSelect.value,
    outputType: els.examOutputTypeSelect.value,
    answerKeyMode: els.answerKeyModeSelect.value,
    instruction: els.examInstructionInput.value
  };
  saveState();
  renderSelectedQuestions();
  renderExamAnalysis();
}

function saveExamArchive({ forceNew = false } = {}) {
  if (!selectedQuestions().length) {
    showToast("Arşive kaydetmek için önce sınava soru ekleyin.", "warning");
    return;
  }
  const activeExam = state.archivedExams.find((exam) => exam.id === state.activeExamArchiveId);
  const id = forceNew || !activeExam ? "" : state.activeExamArchiveId;
  const snapshot = currentExamSnapshot(id);
  if (id) {
    state.archivedExams = state.archivedExams.map((exam) => exam.id === id ? snapshot : exam);
  } else {
    state.archivedExams.unshift(snapshot);
  }
  state.activeExamArchiveId = snapshot.id;
  els.examArchiveNameInput.value = snapshot.title;
  saveState();
  renderExamArchive();
  showToast(id ? "Sınav arşiv kaydı güncellendi." : "Sınav arşive kaydedildi.");
}

function loadExamArchive() {
  const exam = state.archivedExams.find((item) => item.id === els.examArchiveSelect.value);
  if (!exam) return;
  state.selectedCourseId = exam.courseId;
  state.activeExamArchiveId = exam.id;
  state.examMeta = { ...structuredClone(initialState.examMeta), ...structuredClone(exam.meta) };
  const availableIds = new Set(state.questions.filter((question) => question.courseId === exam.courseId).map((question) => question.id));
  setBasketIdsForCourse(exam.questionIds.filter((id) => availableIds.has(id)), exam.courseId);
  state.examAnswerSpaces = state.examAnswerSpaces || {};
  state.examAnswerSpaces[exam.courseId] = {};
  Object.entries(exam.answerSpaces || {}).forEach(([questionId, config]) => {
    if (availableIds.has(questionId) && exam.questionIds.includes(questionId)) {
      state.examAnswerSpaces[exam.courseId][questionId] = normalizeAnswerSpaceConfig(config);
    }
  });
  if (!Object.keys(state.examAnswerSpaces[exam.courseId]).length) delete state.examAnswerSpaces[exam.courseId];
  state.questions = state.questions.map((question) => {
    if (!Object.prototype.hasOwnProperty.call(exam.questionPoints, question.id)) return question;
    return { ...question, points: Math.max(1, Number(exam.questionPoints[question.id] || question.points || 1)) };
  });
  els.examArchiveNameInput.value = exam.title;
  saveState();
  render();
  showToast("Sınav arşivden açıldı. Düzenleyip güncelleyebilirsiniz.");
}

async function deleteExamArchive() {
  const exam = state.archivedExams.find((item) => item.id === els.examArchiveSelect.value);
  if (!exam) return;
  const confirmed = await appConfirm(`${exam.title} arşivden silinsin mi?`, {
    title: "Arşiv kaydını sil",
    okText: "Sil"
  });
  if (!confirmed) return;
  state.archivedExams = state.archivedExams.filter((item) => item.id !== exam.id);
  if (state.activeExamArchiveId === exam.id) {
    state.activeExamArchiveId = "";
  }
  saveState();
  renderExamArchive();
  showToast("Arşiv kaydı silindi.");
}

function updateSettings(event) {
  event.preventDefault();
  addTeacherFromInput(false);
  state.settings = {
    schoolName: els.schoolNameInput.value.trim(),
    teachers: state.settings.teachers,
    academicYear: els.academicYearInput.value.trim()
  };
  saveState();
  renderTeacherList();
  showToast("Genel ayarlar kaydedildi.");
}

function addTeacherFromInput(shouldSave = true) {
  const teacher = els.teacherNameInput.value.trim();
  if (!teacher) return;
  state.settings.teachers.push(teacher);
  els.teacherNameInput.value = "";
  if (shouldSave) {
    saveState();
    renderTeacherList();
  }
}

async function importCurriculumPdf(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append("pdf", file);
  const course = currentCourse();
  formData.append("courseName", course.name);
  try {
    const response = await fetch("/api/import-curriculum", {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    if (!Array.isArray(result.items) || !result.items.length) {
      showToast("PDF içinden öğrenme birimi/kazanım bulunamadı.", "warning");
      return;
    }
    
    // Check if there are existing items for this course
    const courseItems = state.curriculumItems.filter(item => courseNameMatches(item.courseName, course.name));
    let finalItems = state.curriculumItems;
    if (courseItems.length > 0) {
      const confirmOverwrite = await appConfirm(
        `Bu ders için zaten kayıtlı kazanımlar var. Mevcut kazanımları temizleyip sadece PDF'dekileri mi aktarmak istersiniz? (Temizle'ye basarsanız eskiler silinir, Ekle'ye basarsanız üzerine eklenir.)`,
        {
          title: "Kazanım Aktarımı",
          okText: "Temizle ve Aktar",
          cancelText: "Üzerine Ekle"
        }
      );
      if (confirmOverwrite) {
        finalItems = state.curriculumItems.filter(item => !courseNameMatches(item.courseName, course.name));
      }
    }
    
    state.curriculumItems = mergeCurriculumItems([...finalItems, ...result.items]);
    state.selectedCurriculumTopic = result.items[0].topic;
    saveState();
    render();
    showToast(`${result.items.length} öğrenme birimi/kazanım kaydı aktarıldı.`);
  } catch (error) {
    showToast(`PDF aktarılamadı: ${error.message || "Bilinmeyen hata"}`, "error");
  } finally {
    els.curriculumPdfInput.value = "";
  }
}

async function importQuestionsDocx(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append("docx", file);
  try {
    const response = await fetch("/api/import-questions-docx", {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const imported = Array.isArray(result.questions) ? result.questions : [];
    if (!imported.length) {
      showToast("Word dosyasından soru bulunamadı.", "warning");
      return;
    }
    const meta = result.meta || {};
    const scopeText = meta.term && meta.examNumber
      ? `${meta.term}. dönem ${meta.examNumber}. yazılı`
      : "dönem/yazılı etiketi bulunamadı";
    const confirmed = await appConfirm(`${file.name} dosyasında ${imported.length} soru bulundu. Kapsam: ${scopeText}. Bu sorular mevcut derse aktarılsın mı?`, {
      title: "Word sorularını aktar",
      okText: "Aktar"
    });
    if (!confirmed) return;

    const course = currentCourse();
    const now = new Date().toISOString();
    const importedQuestions = imported.map((question) => ({
      id: uid("q"),
      type: "open",
      courseId: course.id,
      topic: "",
      outcome: "",
      grade: gradeValueForCourse(course),
      difficulty: "Orta",
      examTerm: meta.term || "",
      examNumber: meta.examNumber || "",
      points: normalizeImportedPoint(question.points),
      tags: ["Word aktarım"],
      note: `Kaynak dosya: ${file.name}`,
      content: question.content || "",
      answer: question.answer || "",
      choices: choiceLabels.slice(0, 4).map((label) => ({ id: label, label, text: "" })),
      correctChoiceId: "A",
      correctBoolean: true,
      acceptedAnswers: [],
      createdAt: now,
      updatedAt: now
    }));
    state.questions = [...importedQuestions, ...state.questions];
    saveState();
    render();
    setView("bank");
    showToast(`${importedQuestions.length} soru soru havuzuna aktarıldı.`);
  } catch (error) {
    const message = String(error.message || "Bilinmeyen hata");
    const friendly = message === "Not found"
      ? "Word aktarım servisi bulunamadı. Sunucuyu kapatıp yeniden başlatın; yeni sunucu kodu yüklendikten sonra tekrar deneyin."
      : `Word dosyası aktarılamadı: ${message}`;
    showToast(friendly, "error");
  } finally {
    if (els.questionDocxInput) els.questionDocxInput.value = "";
  }
}
