function examTitle() {
  return `${state.examMeta.term}. Dönem ${state.examMeta.examNumber}. Yazılı`;
}

function questionNumberHtml(index, points = null) {
  const pointsText = points !== null && points !== undefined && points !== "" ? ` ${questionPointsHtml(points)}` : "";
  return `<span class="print-question-no" style="font-weight:bold; margin-right:8px; display:inline;">Soru-${index + 1})${pointsText}&nbsp;&nbsp;</span>`;
}

function questionPointsHtml(points) {
  return `<span class="print-question-points" style="font-weight:bold; white-space:nowrap;">(${points}P)</span>`;
}

function answerHeadingHtml(index, points) {
  return `<div class="print-answer-heading"><span>Cevap-${index + 1})</span> ${questionPointsHtml(points)}</div>`;
}

function answerQuestionLineHtml(question, index) {
  return `
    <div class="print-answer-question-line">
      ${questionNumberHtml(index, question.points)}
      <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "answer")}</div>
    </div>
  `;
}

function answerItemHtml(question, index, { includeQuestion = false } = {}) {
  if (includeQuestion) {
    return `
      ${answerQuestionLineHtml(question, index)}
      <div class="print-answer-label">Cevap:</div>
      <div class="print-answer">${answerKeyHtml(question)}</div>
    `;
  }
  return `
    ${answerHeadingHtml(index, question.points)}
    <div class="print-answer">${answerKeyHtml(question)}</div>
  `;
}

function formatExamDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function answerWritingSpaceSize(question, { compact = false, study = false } = {}) {
  const mode = question.answerSpaceMode || "auto";
  const expectedItems = Number(question.expectedAnswerItems || 0);
  const min = compact ? (study ? 30 : 35) : (study ? 34 : 42);
  const lineUnit = compact ? (study ? 11 : 13) : (study ? 15 : 18);
  const fixedSizes = {
    short: compact ? (study ? 34 : 42) : (study ? 44 : 58),
    medium: compact ? (study ? 58 : 72) : (study ? 78 : 98),
    large: compact ? (study ? 88 : 112) : (study ? 128 : 165)
  };

  if (mode !== "auto" || expectedItems > 0) {
    let base;
    if (mode === "custom" && expectedItems > 0) {
      base = min + expectedItems * lineUnit;
    } else if (fixedSizes[mode]) {
      base = fixedSizes[mode];
    } else {
      const itemCount = Math.max(1, expectedItems);
      base = min + itemCount * lineUnit + Math.max(0, itemCount - 4) * (compact ? 4 : 6);
    }

    const maxLimit = compact ? 210 : 285;
    base = Math.max(min, Math.min(maxLimit, Math.round(base)));
    return {
      base,
      min: Math.min(min, base),
      weight: Math.max(0.8, Math.min(2.4, base / Math.max(1, min))),
      max: Math.max(base, Math.min(compact ? 245 : 330, base + (compact ? 45 : 70)))
    };
  }

  const answerHtml = answerKeyHtml(question);
  const answerText = stripHtml(answerHtml).replace(/\s+/g, " ").trim();
  const answerLength = answerText.length;
  const blockCount = (answerHtml.match(/<\/p>|<br\s*\/?>|<li\b|<\/div>|<\/tr>/gi) || []).length;
  const hasStructuredAnswer = /<table\b|<ol\b|<ul\b|<img\b/i.test(answerHtml);
  const maxBase = compact ? 230 : 315;

  let base = Math.max(min, Math.ceil(answerLength * (compact ? 0.42 : 0.5)));
  base += Math.min(compact ? 34 : 52, blockCount * (compact ? 7 : 10));
  if (hasStructuredAnswer) base += compact ? 18 : 30;
  base = Math.min(maxBase, Math.max(min, base));

  return {
    base,
    min,
    weight: Math.max(0.8, Math.min(3, base / min)),
    max: Math.max(base, Math.min(compact ? 280 : 360, base + (compact ? 70 : 115)))
  };
}

function answerSpaceMinHeight(space) {
  return parseFloat(window.getComputedStyle(space).minHeight) || 0;
}

function shrinkAnswerSpaces(answerSpaces, overflow) {
  if (!answerSpaces.length || overflow <= 0) return 0;
  let remaining = overflow;

  for (let pass = 0; pass < 4 && remaining > 1; pass += 1) {
    const shrinkable = answerSpaces
      .map(space => {
        const currentMinHeight = answerSpaceMinHeight(space);
        const minHeight = parseFloat(space.dataset.answerMin || "");
        const floorHeight = Number.isFinite(minHeight) ? minHeight : Math.min(32, currentMinHeight);
        return {
          space,
          currentMinHeight,
          room: Math.max(0, currentMinHeight - floorHeight)
        };
      })
      .filter(item => item.room > 0);
    if (!shrinkable.length) break;

    const totalRoom = shrinkable.reduce((total, item) => total + item.room, 0);
    let removed = 0;
    shrinkable.forEach(item => {
      const reduction = Math.min(item.room, remaining * (item.room / totalRoom));
      if (reduction > 0) {
        item.space.style.minHeight = `${Math.round(item.currentMinHeight - reduction)}px`;
        removed += reduction;
      }
    });
    if (removed <= 0.5) break;
    remaining -= removed;
  }

  return overflow - remaining;
}

function distributeRemainingAnswerSpace(answerSpaces, remainingSpace, { isTwoCol = false } = {}) {
  if (!answerSpaces.length || remainingSpace <= 0) return;

  if (isTwoCol) {
    const numRows = Math.ceil(answerSpaces.length / 2);
    const spacePerRow = Math.floor(remainingSpace / numRows);
    if (spacePerRow > 0) {
      answerSpaces.forEach(space => {
        const currentMinHeight = parseFloat(window.getComputedStyle(space).minHeight) || 0;
        space.style.minHeight = `${currentMinHeight + spacePerRow}px`;
      });
    }
    return;
  }

  let remaining = remainingSpace;
  for (let pass = 0; pass < 3 && remaining > 1; pass += 1) {
    const growable = answerSpaces
      .map(space => {
        const currentMinHeight = parseFloat(window.getComputedStyle(space).minHeight) || 0;
        const maxHeight = parseFloat(space.dataset.answerMax || "");
        const weight = parseFloat(space.dataset.answerWeight || "1") || 1;
        return {
          space,
          currentMinHeight,
          room: Number.isFinite(maxHeight) ? Math.max(0, maxHeight - currentMinHeight) : remaining,
          weight
        };
      })
      .filter(item => item.room > 0);
    if (!growable.length) break;

    const totalWeight = growable.reduce((total, item) => total + item.weight, 0);
    let used = 0;
    growable.forEach(item => {
      const share = remaining * (item.weight / totalWeight);
      const addition = Math.min(item.room, share);
      if (addition > 0) {
        item.space.style.minHeight = `${Math.round(item.currentMinHeight + addition)}px`;
        used += addition;
      }
    });
    if (used <= 0.5) break;
    remaining -= used;
  }
}

function adjustPrintPagesLayout() {
  const pages = Array.from(document.querySelectorAll(".print-page"));
  if (!pages.length) return;

  pages.forEach(page => {
    // Temporarily collapse page min-height to 0 to measure natural content scrollHeight
    const originalMinHeight = page.style.minHeight;
    page.style.minHeight = "0";

    const targetInnerHeight = 1015; // A4 inner height budget in pixels at 96 DPI (with safety buffer)
    
    const style = window.getComputedStyle(page);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    
    // Total height of elements currently rendered in page
    const innerContentHeight = page.scrollHeight - paddingTop - paddingBottom;
    const remainingSpace = targetInnerHeight - innerContentHeight;
    
    // Restore original min-height
    page.style.minHeight = originalMinHeight;
    
    if (remainingSpace <= 10) return; // Very little space left or page overflowed

    const answerSpaces = Array.from(page.querySelectorAll(".answer-space"));
    const answerItems = Array.from(page.querySelectorAll(".print-answer-item"));
    const normalQuestions = Array.from(page.querySelectorAll(".print-question:not(.placeholder-cell)"));
    
    const printDoc = page.closest(".print-document");
    const isTwoCol = printDoc && (printDoc.classList.contains("has-table-layout") || 
                                  printDoc.classList.contains("has-two-columns"));
    const isLastPage = page === pages[pages.length - 1];
    const shouldStretchAnswerSpaces = !(isTwoCol && isLastPage && normalQuestions.length <= 2);

    if (answerSpaces.length > 0 && shouldStretchAnswerSpaces) {
      distributeRemainingAnswerSpace(answerSpaces, remainingSpace, { isTwoCol });
    } else if (answerItems.length > 0) {
      // Answer keys should keep their natural spacing; only exam answer areas are stretched.
    } else if (answerSpaces.length > 0) {
      // In two-column/grid layouts, a final page with one row should not absorb all leftover page space.
    } else if (normalQuestions.length > 0) {
      const spacePerQuestion = Math.floor(remainingSpace / normalQuestions.length);
      if (spacePerQuestion > 0) {
        normalQuestions.forEach(q => {
          const currentMargin = parseFloat(window.getComputedStyle(q).marginBottom) || 0;
          q.style.marginBottom = `${currentMargin + spacePerQuestion}px`;
        });
      }
    }

    const overflow = (page.scrollHeight - paddingTop - paddingBottom) - targetInnerHeight;
    if (overflow > 0) {
      shrinkAnswerSpaces(Array.from(page.querySelectorAll(".answer-space")), overflow + 2);
    }
  });
}

function buildPrintDocument(mode) {
  const selected = selectedQuestions();
  if (!selected.length) {
    showToast("Word çıktısı için önce sınava soru ekleyin.", "warning");
    return false;
  }
  if (mode === "analysis") {
    els.printExamArea.innerHTML = `
      <div class="print-document print-analysis-document">
        ${buildAnalysisReportHtml({ printable: true })}
      </div>
    `;
    return true;
  }
  const schoolName = escapeHtml(state.settings.schoolName).replace(/\s+/g, " ");
  const teacherLine = `<div class="print-header-teacher">${
    state.settings.teachers.length
      ? `<strong>Ders öğretmeni:</strong> ${state.settings.teachers.map(escapeHtml).join(" / ")}`
      : ""
  }</div>`;
  const dateLine = `<div class="print-header-date">${
    state.examMeta.date
      ? `<strong>Sınav tarihi:</strong> ${escapeHtml(formatExamDate(state.examMeta.date))}`
      : ""
  }</div>`;
  const isStudyOutput = mode === "exam" && state.examMeta.outputType === "study";
  const answerIncludesQuestions = state.examMeta.answerKeyMode === "questions";
  
  // Mathematical Page-Fit Sizing Engine
  const pageTarget = state.examMeta.pageTarget || "auto";
  const columns = state.examMeta.columns || "1";
  const isTableLayout = columns === "table";
  const isTwoColLayout = columns === "2" || isTableLayout;
  
  const numQuestions = selected.length;
  const virtualRows = isTwoColLayout ? Math.ceil(numQuestions / 2) : numQuestions;
  
  const printClasses = [
    "print-document",
    isStudyOutput ? "study-document" : "",
    state.examMeta.pageTarget === "one" ? "fit-one-page" : "",
    state.examMeta.pageTarget === "two" ? "fit-two-pages" : "",
    state.examMeta.columns === "2" ? "has-two-columns" : "",
    state.examMeta.columns === "table" ? "has-table-layout" : ""
  ].filter(Boolean).join(" ");
  
  const isTable = columns === "table";
  
  // Create temporary container for measuring exact question heights as rendered by browser
  const tempContainer = document.createElement("div");
  tempContainer.className = `print-document ${printClasses}`;
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = "210mm";
  tempContainer.style.padding = "8mm 12mm";
  tempContainer.style.boxSizing = "border-box";
  tempContainer.style.background = "#fff";
  
  const tempPage = document.createElement("div");
  tempPage.className = "print-page";
  tempContainer.appendChild(tempPage);
  document.body.appendChild(tempContainer);
  
  const questionHTMLs = selected.map((q, idx) => {
    const answerSize = answerWritingSpaceSize(q, { compact: isTwoColLayout, study: isStudyOutput });
    const baseSpace = answerSize.base;
    const answerSpace = Math.max(32, baseSpace);
    const answerSpaceAttrs = `data-answer-weight="${answerSize.weight.toFixed(3)}" data-answer-min="${Math.round(answerSize.min)}" data-answer-max="${Math.round(answerSize.max)}"`;
    
    if (mode === "answer") {
      return `
        <article class="print-question print-answer-item" data-q-id="${q.id}">
          ${answerItemHtml(q, idx, { includeQuestion: answerIncludesQuestions })}
        </article>
      `;
    }
    
    if (isStudyOutput) {
      if (isTable) {
        return `
          <div class="print-question print-study-item" data-q-id="${q.id}">
            <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
              ${questionNumberHtml(idx, q.points)}
              <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(q, "exam", { includeSupplements: false })}</div>
            </div>
            <div class="answer-space" ${answerSpaceAttrs} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px; border-bottom:none;"></div>
          </div>
        `;
      }
      return `
        <article class="print-question print-study-item" data-q-id="${q.id}">
          <div class="study-question-line">
            ${questionNumberHtml(idx, q.points)}
            <div class="print-question-content" style="font-weight:normal;">${questionContentHtml(q, "exam")}</div>
          </div>
          <div class="answer-space" ${answerSpaceAttrs} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px"></div>
        </article>
      `;
    }
    
    if (isTable) {
      return `
        <div class="print-question" data-q-id="${q.id}">
          <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
            ${questionNumberHtml(idx, q.points)}
            <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(q, "exam", { includeSupplements: false })}</div>
          </div>
          <div class="answer-space" ${answerSpaceAttrs} style="min-height:${answerSpace}px; border-bottom:none;"></div>
        </div>
      `;
    }
    
    return `
      <article class="print-question" data-q-id="${q.id}">
        <div style="font-weight:normal; line-height:1.26; margin-bottom:8px;">
          ${questionNumberHtml(idx, q.points)}
          <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(q, "exam")}</div>
        </div>
        <div class="answer-space" ${answerSpaceAttrs} style="min-height:${answerSpace}px"></div>
      </article>
    `;
  });
  
  tempPage.innerHTML = `<div class="print-questions">${questionHTMLs.join("")}</div>`;
  
  const measuredHeights = {};
  const measuredMinHeights = {};
  tempPage.querySelectorAll(".print-question").forEach(el => {
    const qId = el.getAttribute("data-q-id");
    const measuredHeight = el.offsetHeight || 100;
    const answerSpace = el.querySelector(".answer-space");
    if (answerSpace) {
      const currentAnswerHeight = parseFloat(window.getComputedStyle(answerSpace).minHeight) || 0;
      const minAnswerHeight = parseFloat(answerSpace.dataset.answerMin || "") || currentAnswerHeight;
      measuredMinHeights[qId] = Math.max(40, measuredHeight - currentAnswerHeight + minAnswerHeight);
    } else {
      measuredMinHeights[qId] = measuredHeight;
    }
    measuredHeights[qId] = measuredHeight;
  });
  
  document.body.removeChild(tempContainer);
  
  const printablePageHeight = 1010; // True A4 printable vertical space budget in pixels (~281mm - small buffer)
  let staticHeight = 0;
  if (!isStudyOutput) {
    staticHeight += 150; // schoolName, year, title
    if (mode === "exam") {
      staticHeight += 58; // student info table
    }
    if (mode === "exam" && state.examMeta.instruction && state.examMeta.instruction.trim()) {
      staticHeight += 28; // instructions line
    }
  }

  const getRenderedHeight = (questions, isPageOne) => {
    const pageStaticHeight = isPageOne ? staticHeight : 28;
    if (questions.length === 0) return pageStaticHeight;
    
    if (isTwoColLayout) {
      let height = pageStaticHeight;
      for (let i = 0; i < questions.length; i += 2) {
        const q1 = questions[i];
        const q2 = questions[i + 1];
        const h1 = measuredHeights[q1.id] || 100;
        const h2 = q2 ? (measuredHeights[q2.id] || 0) : 0;
        height += Math.max(h1, h2);
      }
      return height;
    }
    
    let height = pageStaticHeight;
    questions.forEach(q => {
      const heightMap = pageTarget === "auto" && !isTwoColLayout ? measuredMinHeights : measuredHeights;
      height += (heightMap[q.id] || measuredHeights[q.id] || 100);
    });
    return height;
  };

  const pagesQuestions = [];

  if (pageTarget === "one") {
    // Force exactly 1 page
    pagesQuestions.push({
      questions: selected,
      startIdx: 0
    });
  } else if (pageTarget === "two") {
    // Force exactly 2 pages, split equally
    let half = Math.ceil(selected.length / 2);
    if (isTwoColLayout && half < selected.length && half % 2 !== 0) {
      half += 1;
    }
    pagesQuestions.push({
      questions: selected.slice(0, half),
      startIdx: 0
    });
    if (half < selected.length) {
      pagesQuestions.push({
        questions: selected.slice(half),
        startIdx: half
      });
    }
  } else {
    // auto mode: partition based on actual physical space availability!
    let currentPage = [];
    let pageStartIndex = 0;
    
    for (let i = 0; i < selected.length; i++) {
      const q = selected[i];
      const testPage = [...currentPage, q];
      const pageLimit = printablePageHeight;
      
      const estimatedHeight = getRenderedHeight(testPage, pagesQuestions.length === 0);
      
      if (estimatedHeight > pageLimit && currentPage.length > 0) {
        pagesQuestions.push({
          questions: currentPage,
          startIdx: pageStartIndex
        });
        currentPage = [q];
        pageStartIndex = i;
      } else {
        currentPage.push(q);
      }
    }
    if (currentPage.length > 0) {
      pagesQuestions.push({
        questions: currentPage,
        startIdx: pageStartIndex
      });
    }

    if ((mode === "answer" || !isTwoColLayout) && pagesQuestions.length > 1) {
      let mergedOrphan = true;
      while (mergedOrphan && pagesQuestions.length > 1) {
        mergedOrphan = false;
        const lastPage = pagesQuestions[pagesQuestions.length - 1];
        const previousPage = pagesQuestions[pagesQuestions.length - 2];
        const previousPageIndex = pagesQuestions.length - 2;
        if (lastPage.questions.length !== 1) break;

        const candidateQuestions = [...previousPage.questions, lastPage.questions[0]];
        const candidateHeight = getRenderedHeight(candidateQuestions, previousPageIndex === 0);
        if (candidateHeight <= printablePageHeight + 72) {
          previousPage.questions = candidateQuestions;
          pagesQuestions.pop();
          mergedOrphan = true;
        }
      }

      let nextStartIdx = 0;
      pagesQuestions.forEach(page => {
        page.startIdx = nextStartIdx;
        nextStartIdx += page.questions.length;
      });
    }

    if (mode === "answer" && pagesQuestions.length > 1) {
      let compactedAnswers = true;
      while (compactedAnswers && pagesQuestions.length > 1) {
        compactedAnswers = false;
        const lastPage = pagesQuestions[pagesQuestions.length - 1];
        const previousPage = pagesQuestions[pagesQuestions.length - 2];
        const previousPageIndex = pagesQuestions.length - 2;

        while (lastPage.questions.length > 0) {
          const candidateQuestions = [...previousPage.questions, lastPage.questions[0]];
          const candidateHeight = getRenderedHeight(candidateQuestions, previousPageIndex === 0);
          if (candidateHeight > printablePageHeight + 140) break;

          previousPage.questions.push(lastPage.questions.shift());
          compactedAnswers = true;
        }

        if (lastPage.questions.length === 0) {
          pagesQuestions.pop();
          compactedAnswers = true;
        }
      }

      let nextStartIdx = 0;
      pagesQuestions.forEach(page => {
        page.startIdx = nextStartIdx;
        nextStartIdx += page.questions.length;
      });
    }

  }
  
  // Render pages
  const academicYearLine = `${escapeHtml(state.settings.academicYear)} EĞİTİM VE ÖĞRETİM YILI${state.examMeta.className ? ` ${escapeHtml(state.examMeta.className.toLocaleUpperCase('tr-TR'))} SINIFI` : ""}`;
  const courseName = currentCourse().name.toLocaleUpperCase("tr-TR");
  const suffix = mode === "answer" ? "CEVAP ANAHTARI" : "SINAVI SORULARI";
  const examTitleLine = `"${escapeHtml(courseName)}" DERSİ ${state.examMeta.term}. DÖNEM ${state.examMeta.examNumber}. YAZILI ${suffix}`;
  

  
  let pagesHtml = pagesQuestions.map((pageData, pIdx) => {
    const pageQuestions = pageData.questions;
    const pageStartIdx = pageData.startIdx;
    
    // Calculate page specific budget and proportional scaling factor k
    const pageStaticHeight = pIdx === 0 ? staticHeight : 28;
    const pagePrintableHeight = printablePageHeight;
    const pageVirtualRows = isTwoColLayout ? Math.ceil(pageQuestions.length / 2) : pageQuestions.length;
    
    let scale = 1.0;
    if (pageTarget === "one") {
      scale = 0.78;
    } else if (pageTarget === "two") {
      scale = 0.88;
    } else {
      scale = 0.88;
    }
    
    let pageStaticContentHeight = 0;
    pageQuestions.forEach(q => {
      const textLength = stripHtml(q.content).length;
      const estLineCount = Math.max(1, Math.ceil(textLength / (isTwoColLayout ? 45 : 90)));
      const textHeight = estLineCount * 18;
      
      let qStatic = 60;
      if (isTable) {
        qStatic = 50;
      } else if (isTwoColLayout) {
        qStatic = 41;
      }
      
      pageStaticContentHeight += Math.round((qStatic + textHeight) * scale);
    });
    
    if (isTwoColLayout) {
      pageStaticContentHeight = pageStaticContentHeight / 2;
    }
    
    const pageRemainingHeightForAnswers = pagePrintableHeight - pageStaticHeight - pageStaticContentHeight;
    
    const answerSizes = pageQuestions.map(q => answerWritingSpaceSize(q, {
      compact: isTwoColLayout,
      study: isStudyOutput
    }));
    const baseSpaces = answerSizes.map(size => size.base);
    
    // In two-column layout, calculate total required height based on the tallest column
    let pageBaseSpaceNeeded = 0;
    if (isTwoColLayout) {
      const half = Math.ceil(baseSpaces.length / 2);
      const col1Base = baseSpaces.slice(0, half).reduce((a, b) => a + b, 0);
      const col2Base = baseSpaces.slice(half).reduce((a, b) => a + b, 0);
      pageBaseSpaceNeeded = Math.max(col1Base, col2Base);
    } else {
      pageBaseSpaceNeeded = baseSpaces.reduce((a, b) => a + b, 0);
    }
    
    let k = 1.0;
    if (pageBaseSpaceNeeded > 0 && pageRemainingHeightForAnswers > 0) {
      k = pageRemainingHeightForAnswers / pageBaseSpaceNeeded;
    }
    
    const isLastPage = pIdx === pagesQuestions.length - 1;
    
    if (pageTarget === "auto") {
      // In auto mode, do not stretch during initial rendering. Let adjustPrintPagesLayout do all stretching.
      // We only allow minor shrinking (down to 0.85) if estimated height slightly exceeds the limit.
      k = Math.max(0.85, Math.min(1.0, k));
    } else {
      // In fit modes, we allow both shrinking and stretching to force fit the target
      k = Math.max(0.5, Math.min(1.6, k));
    }
    
    let renderList = pageQuestions.map((q, i) => ({
      question: q,
      qIdx: i,
      globalIndex: pageStartIdx + i
    }));

    if (isTable && renderList.length % 2 !== 0) {
      renderList.push({
        isPlaceholder: true
      });
    }

    const pageQuestionsHtml = renderList.map((item, gridIdx) => {
      if (item.isPlaceholder) {
        const isLastRow = gridIdx >= renderList.length - 2;
        const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
        return `<div class="print-question placeholder-cell" ${borderStyle}></div>`;
      }
      
      const question = item.question;
      const qIdx = item.qIdx;
      const globalIndex = item.globalIndex;
      const answerSize = answerSizes[qIdx];
      const baseSpace = baseSpaces[qIdx];
      const answerSpace = Math.max(32, Math.round(baseSpace * k));
      const answerSpaceAttrs = (multiplier = 1) => {
        const maxSpace = Math.max(answerSpace, Math.round(answerSize.max * multiplier));
        const minSpace = Math.round(answerSize.min * multiplier);
        return `data-answer-weight="${answerSize.weight.toFixed(3)}" data-answer-min="${minSpace}" data-answer-max="${maxSpace}"`;
      };
      
      if (mode === "answer") {
        const isLastRow = isTable && gridIdx >= renderList.length - 2;
        const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
        return `
          <article class="print-question print-answer-item" ${borderStyle}>
            ${answerItemHtml(question, globalIndex, { includeQuestion: answerIncludesQuestions })}
          </article>
        `;
      }
      
      if (isStudyOutput) {
        if (isTable) {
          const isLastRow = gridIdx >= renderList.length - 2;
          const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
          return `
            <div class="print-question print-study-item" ${borderStyle}>
              <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
                ${questionNumberHtml(globalIndex, question.points)}
                <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "exam", { includeSupplements: false })}</div>
              </div>
              <div class="answer-space" ${answerSpaceAttrs(0.72)} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px; border-bottom:none;"></div>
            </div>
          `;
        }
        return `
          <article class="print-question print-study-item">
            <div class="study-question-line">
              ${questionNumberHtml(globalIndex, question.points)}
              <div class="print-question-content" style="font-weight:normal;">${questionContentHtml(question, "exam")}</div>
            </div>
            <div class="answer-space" ${answerSpaceAttrs(0.72)} style="min-height:${Math.max(30, Math.round(answerSpace * 0.72))}px"></div>
          </article>
        `;
      }
      
      if (isTable) {
        const isLastRow = gridIdx >= renderList.length - 2;
        const borderStyle = isLastRow ? 'style="border-bottom:none !important;"' : "";
        return `
          <div class="print-question" ${borderStyle}>
            <div style="font-weight:normal; margin-bottom:6px; line-height:1.26;">
              ${questionNumberHtml(globalIndex, question.points)}
              <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "exam", { includeSupplements: false })}</div>
            </div>
            <div class="answer-space" ${answerSpaceAttrs()} style="min-height:${answerSpace}px; border-bottom:none;"></div>
          </div>
        `;
      }
      
      return `
        <article class="print-question">
          <div style="font-weight:normal; line-height:1.26; margin-bottom:8px;">
            ${questionNumberHtml(globalIndex, question.points)}
            <div style="display:inline; font-weight:normal;" class="print-question-content">${questionContentHtml(question, "exam")}</div>
          </div>
          <div class="answer-space" ${answerSpaceAttrs()} style="min-height:${answerSpace}px"></div>
        </article>
      `;
    }).join("");
    
    return `
      <div class="print-page">
        ${pIdx === 0 ? (
          isStudyOutput ? "" : `
          <header class="print-header">
            <div class="official-heading">
              <p>${schoolName}</p>
              <p>${academicYearLine}</p>
              <p>${examTitleLine}</p>
            </div>
            ${teacherLine}
            <div class="print-header-duration"><strong>Süre:</strong> ${escapeHtml(state.examMeta.duration || "-")}</div>
            ${dateLine}
            ${mode === "exam" && state.examMeta.instruction && state.examMeta.instruction.trim() ? `<div style="grid-column:1/-1"><strong>Yönerge:</strong> ${escapeHtml(state.examMeta.instruction)}</div>` : ""}
          </header>
          ${mode === "exam" && !isStudyOutput ? `
          <table class="student-info-table">
            <tr class="student-info-row">
              <td class="student-info-name">
                <strong>Adı Soyadı:</strong>
              </td>
              <td class="student-info-points student-info-points-top" valign="top">
                <div class="student-points-label">ALDIĞI PUAN</div>
              </td>
            </tr>
            <tr class="student-info-row">
              <td class="student-info-meta">
                <strong>Okul Numarası:</strong>
              </td>
              <td class="student-info-points student-info-points-bottom">&nbsp;</td>
            </tr>
          </table>
          ` : ""}
          `
        ) : ""}
        <div class="print-questions">
          ${pageQuestionsHtml}
        </div>
      </div>
    `;
  }).join("");
  
  els.printExamArea.innerHTML = `
    <div class="${printClasses}">
      ${pagesHtml}
    </div>
  `;
  
  // Temporarily show the print area off-screen to measure element dimensions accurately
  const originalDisplay = els.printExamArea.style.display;
  const originalPosition = els.printExamArea.style.position;
  const originalLeft = els.printExamArea.style.left;
  
  els.printExamArea.style.display = "block";
  els.printExamArea.style.position = "absolute";
  els.printExamArea.style.left = "-9999px";
  
  adjustPrintPagesLayout();
  
  els.printExamArea.style.display = originalDisplay;
  els.printExamArea.style.position = originalPosition;
  els.printExamArea.style.left = originalLeft;

  return true;
}

function documentModeLabel(mode) {
  if (mode === "answer") return "Cevap Anahtarı";
  if (mode === "analysis") return "Analiz Raporu";
  return "Sınav";
}

function safeFileName(value) {
  return String(value || "belge")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "belge";
}

function getFormattedReportDate(dateObj = new Date()) {
  const d = dateObj instanceof Date && !isNaN(dateObj) ? dateObj : new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}_${month}_${year}`;
}

function formatReportSlug(text) {
  const map = { "ç": "c", "Ç": "C", "ğ": "g", "Ğ": "G", "ı": "i", "I": "I", "İ": "I", "ö": "o", "Ö": "O", "ş": "s", "Ş": "S", "ü": "u", "Ü": "U" };
  return String(text || "")
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (m) => map[m] || m)
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function wordDocumentStyles() {
  return `
    @page WordSection1 {
      size: 595.3pt 841.9pt;
      margin: 22.7pt 34pt 22.7pt 34pt;
    }
    div.WordSection1 { page: WordSection1; }
    body {
      margin: 0;
      color: #000;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.2;
    }
    .print-document {
      width: 100%;
      margin: 0;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
    }
    .print-page {
      width: 100%;
      min-height: 0;
      padding: 0;
      margin: 0;
      border: 0;
      box-shadow: none;
      page-break-after: always;
    }
    .print-page + .print-page {
      page-break-before: always;
      break-before: page;
      mso-break-type: section-break;
    }
    .print-page:last-child { page-break-after: auto; }
    .print-header {
      display: block;
      margin-bottom: 6pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid #000;
      font-size: 10.6pt;
    }
    .official-heading {
      text-align: center;
      font-size: 11pt;
      font-weight: 700;
      line-height: 1.08;
      text-transform: uppercase;
      margin: 0 0 5pt;
    }
    .official-heading p { margin: 0 0 1pt; }
    .word-header-meta {
      width: 100%;
      border-collapse: collapse;
      margin: 2pt 0 0;
      table-layout: fixed;
    }
    .word-header-meta td {
      width: 33.33%;
      border: 0;
      padding: 0;
      font-size: 10.6pt;
      vertical-align: top;
    }
    .word-header-meta td:nth-child(2) { text-align: center; }
    .word-header-meta td:nth-child(3) { text-align: right; }
    .word-header-instruction {
      margin-top: 5pt;
      font-size: 11pt;
    }
    .student-info-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      box-sizing: border-box;
      margin-bottom: 8px;
      font-size: 11pt;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
    }
    .student-info-row {
      height: 20pt;
    }
    .student-info-table td {
      border: 1pt solid #000;
      height: 20pt;
      box-sizing: border-box;
    }
    .student-info-name,
    .student-info-meta {
      width: 75%;
      padding: 0 7pt;
      vertical-align: middle;
      line-height: 20pt;
    }
    .student-info-points {
      width: 25%;
      text-align: center;
      font-weight: bold;
      font-size: 11pt;
      vertical-align: top;
      height: 20pt;
      line-height: 1.1;
      padding: 0;
    }
    .student-info-points-top {
      border-bottom: 0;
    }
    .student-info-points-bottom {
      border-top: 0;
    }
    .student-points-label {
      font-size: 9pt;
      font-weight: bold;
      margin: 0;
      padding-top: 3pt;
    }
    .print-subpage-header {
      display: table !important;
      width: 100%;
      border-bottom: 1pt solid #000;
      padding-bottom: 4px;
      margin-bottom: 15px;
      font-size: 9.5pt;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-weight: bold;
      page-break-after: avoid;
      break-after: avoid;
    }
    .print-subpage-header > div {
      display: table-cell;
      width: 50%;
    }
    .print-subpage-header > div:nth-child(2) { text-align: right; }
    .print-question {
      display: block;
      page-break-inside: avoid;
      margin: 0 0 12px;
    }
    .print-question h2 {
      margin: 0 0 8px;
      font-size: 11pt;
    }
    .print-question-content p {
      display: inline;
      margin: 0;
    }
    .print-question-no,
    .print-question-points {
      font-weight: bold;
    }
    .print-question-no {
      display: inline;
      margin-right: 10pt;
    }
    .print-question-content {
      font-weight: normal;
    }
    .print-answer-heading {
      margin: 0 0 6pt;
      font-size: 11pt;
      line-height: 1.18;
      font-weight: bold;
    }
    .print-answer-label {
      margin: 5pt 0 2pt;
      font-size: 11pt;
      line-height: 1.16;
      font-weight: bold;
    }
    .print-answer-question-line {
      margin: 0 0 4pt;
      font-size: 11pt;
      line-height: 1.22;
      font-weight: normal;
    }
    .print-answer {
      display: block;
      white-space: pre-wrap;
      font-size: 11pt;
      line-height: 1.18;
    }
    .print-answer p,
    .print-answer div {
      display: block;
      margin: 4px 0;
      white-space: pre-wrap;
    }
    .print-answer ul,
    .print-answer ol {
      margin: 6px 0;
      padding-left: 20px;
    }
    .print-answer li { margin: 4px 0; }
    .print-question-content table,
    .print-answer table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 6pt 0;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
    }
    .print-question-content th,
    .print-question-content td,
    .print-answer th,
    .print-answer td {
      border: 0.75pt solid #000;
      padding: 4pt 5pt;
      vertical-align: top;
      line-height: 1.2;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
    }
    .print-question-content th,
    .print-answer th {
      font-weight: bold;
      text-align: center;
    }
    .print-question-content td p,
    .print-question-content th p,
    .print-answer td p,
    .print-answer th p {
      margin: 0 0 3pt;
      line-height: 1.2;
    }
    .print-question-content td p:last-child,
    .print-question-content th p:last-child,
    .print-answer td p:last-child,
    .print-answer th p:last-child {
      margin-bottom: 0;
    }
    .print-question-content table.journal-entry-table,
    .print-answer table.journal-entry-table {
      margin: 3pt 0;
      font-size: 11pt;
      line-height: 1.04;
    }
    .print-question-content .journal-entry-table .journal-account-debit-col,
    .print-question-content .journal-entry-table .journal-account-credit-col,
    .print-answer .journal-entry-table .journal-account-debit-col,
    .print-answer .journal-entry-table .journal-account-credit-col {
      width: 40%;
    }
    .print-question-content .journal-entry-table .journal-amount-col,
    .print-answer .journal-entry-table .journal-amount-col {
      width: 10%;
    }
    .print-question-content .journal-entry-table th,
    .print-question-content .journal-entry-table td,
    .print-answer .journal-entry-table th,
    .print-answer .journal-entry-table td {
      padding: 1pt 4pt;
      line-height: 1.02;
    }
    .print-question-content .journal-entry-table .journal-entry-date-cell,
    .print-answer .journal-entry-table .journal-entry-date-cell {
      font-size: 11pt;
    }
    .print-question-content .journal-entry-table .journal-entry-desc-row th,
    .print-answer .journal-entry-table .journal-entry-desc-row th {
      font-size: 11pt;
      text-align: left;
    }
    .print-question-content .journal-entry-table .journal-account,
    .print-answer .journal-entry-table .journal-account {
      text-align: left;
      color: #000;
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
      font-weight: normal;
    }
    .print-question-content .journal-entry-table .journal-account-debit-side,
    .print-answer .journal-entry-table .journal-account-debit-side {
      border-right: none;
    }
    .print-question-content .journal-entry-table .journal-account-credit-side,
    .print-answer .journal-entry-table .journal-account-credit-side {
      border-left: none;
    }
    .print-question-content .journal-entry-table .journal-account-side,
    .print-answer .journal-entry-table .journal-account-side {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
    }
    .print-question-content .journal-entry-table .journal-account.is-subaccount .journal-account-side,
    .print-answer .journal-entry-table .journal-account.is-subaccount .journal-account-side {
      font-size: 11pt;
    }
    .print-question-content .journal-entry-table tbody td,
    .print-answer .journal-entry-table tbody td {
      border-top: none;
      border-bottom: none;
    }
    .print-question-content .journal-entry-table .journal-subaccount-amount,
    .print-answer .journal-entry-table .journal-subaccount-amount {
      display: inline-block;
      margin-left: 8pt;
      text-align: right;
    }
    .answer-space {
      min-height: 30px;
      margin-top: 12px;
      border-bottom: none;
      mso-element: para-border-div;
    }
    .word-grid-table,
    .word-two-column-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-top: 6pt;
    }
    .word-grid-table {
      border: 0.75pt solid #000;
    }
    .word-grid-table tr,
    .word-two-column-table tr,
    .word-grid-table td,
    .word-two-column-table td {
      page-break-inside: avoid;
      break-inside: avoid;
      mso-pagination: none;
    }
    .word-grid-table td,
    .word-two-column-table td {
      width: 50%;
      vertical-align: top;
    }
    .word-grid-table td {
      border: 0.75pt solid #000;
      padding: 4pt 6pt;
    }
    .word-two-column-table td {
      border: 0.75pt solid #000;
      padding: 5pt 6pt;
    }
    .word-grid-table .print-question,
    .word-two-column-table .print-question {
      border: 0;
      padding: 0;
      margin: 0;
      page-break-inside: avoid;
    }
    .word-question-inline {
      margin: 0;
      font-weight: normal;
      line-height: 1.26;
    }
    .word-question-inline p,
    .word-question-inline div {
      display: inline;
      margin: 0;
    }
    .word-question-inline .word-question-no {
      display: inline;
      margin-right: 10pt;
      font-weight: bold;
    }
    .word-question-inline .word-question-points {
      font-weight: bold;
      white-space: nowrap;
    }
    .word-answer-space {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
    }
    .word-grid-table .word-answer-space,
    .word-two-column-table .word-answer-space {
      margin-top: 5pt;
    }
    .word-answer-space td {
      border: 0;
      padding: 0;
      width: 100%;
      font-size: 1pt;
      line-height: 1pt;
    }
    .word-single-question-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0 0 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
      mso-pagination: none;
    }
    .word-single-question-table tr,
    .word-single-question-table td {
      page-break-inside: avoid;
      break-inside: avoid;
      mso-pagination: none;
    }
    .word-single-question-table td {
      border: 0;
      padding: 0;
      vertical-align: top;
    }
    .word-single-question-table .print-question {
      margin: 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-document.fit-one-page {
      font-size: 8.4pt;
    }
    .print-document.fit-one-page .official-heading {
      font-size: 9.6pt;
      line-height: 1.04;
      margin-bottom: 2pt;
    }
    .print-document.fit-one-page .print-header,
    .print-document.fit-one-page .word-header-meta td {
      font-size: 8.8pt;
    }
    .print-document.fit-one-page .student-info-table {
      font-size: 8.6pt;
      margin-bottom: 5pt;
    }
    .print-document.fit-one-page .student-info-name,
    .print-document.fit-one-page .student-info-meta {
      padding: 1pt 5pt;
    }
    .print-document.fit-one-page .student-points-label {
      font-size: 8pt;
      padding-top: 2pt;
    }
    .print-document.fit-one-page .word-grid-table td,
    .print-document.fit-one-page .word-two-column-table td {
      padding: 3pt 5pt;
    }
    .print-document.fit-one-page .word-question-inline {
      font-size: 8.4pt;
      line-height: 1.08;
    }
    .print-document.fit-one-page .print-answer-heading,
    .print-document.fit-one-page .print-answer-question-line,
    .print-document.fit-one-page .print-answer,
    .print-document.fit-one-page .print-answer-label {
      font-size: 8.8pt;
      line-height: 1.08;
    }
    .print-document.fit-one-page .word-answer-space {
      margin-top: 2pt;
    }
    .print-document.fit-one-page .word-single-question-table {
      margin-bottom: 3pt;
      page-break-inside: auto;
      break-inside: auto;
    }
    .print-document.fit-two-pages {
      font-size: 10.3pt;
    }
    .print-document.fit-two-pages .official-heading {
      font-size: 10.5pt;
      line-height: 1.08;
      margin-bottom: 3pt;
    }
    .print-document.fit-two-pages .print-header,
    .print-document.fit-two-pages .word-header-meta td {
      font-size: 10pt;
    }
    .print-document.fit-two-pages .student-info-table {
      font-size: 10pt;
      margin-bottom: 9pt;
    }
    .print-document.fit-two-pages .student-info-name,
    .print-document.fit-two-pages .student-info-meta {
      padding: 4pt 6pt;
    }
    .print-document.fit-two-pages .word-grid-table td,
    .print-document.fit-two-pages .word-two-column-table td {
      padding: 3.5pt 5.5pt;
    }
    .print-document.fit-two-pages .word-question-inline {
      font-size: 10.3pt;
      line-height: 1.18;
    }
    .print-document.fit-two-pages .print-answer-heading,
    .print-document.fit-two-pages .print-answer-question-line,
    .print-document.fit-two-pages .print-answer,
    .print-document.fit-two-pages .print-answer-label {
      font-size: 10.2pt;
      line-height: 1.14;
    }
    .print-document.fit-two-pages .word-answer-space {
      margin-top: 4pt;
    }
    .print-document.fit-two-pages .word-single-question-table {
      margin-bottom: 7pt;
    }
    .print-analysis-document {
      font-family: "Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif;
      font-size: 11pt;
      color: #111;
    }
    .analysis-print-heading {
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 1pt solid #000;
      text-align: center;
    }
    .analysis-print-heading h3 {
      margin: 0 0 3pt;
      font-size: 11pt;
    }
    .analysis-print-heading p {
      margin: 0;
      font-size: 9.5pt;
    }
    .analysis-kpi-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
    }
    .analysis-kpi-table td {
      width: 25%;
      border: 1pt solid #777;
      padding: 6pt;
      vertical-align: middle;
      text-align: center;
      background: #f3f7f7;
    }
    .analysis-kpi-card {
      min-height: 44pt;
      border-top: 2.5pt solid #148177;
    }
    .analysis-kpi-card p {
      display: block;
      margin: 0;
    }
    .analysis-kpi-label {
      color: #000;
      font-size: 8.5pt;
      font-weight: normal;
    }
    .analysis-kpi-value {
      display: block;
      margin: 3pt 0 0;
      font-size: 13pt;
      line-height: 1.05;
      font-weight: normal;
    }
    .analysis-kpi-note {
      display: block;
      margin: 2pt 0 0;
      font-size: 7.5pt;
      line-height: 1.15;
      font-weight: normal;
    }
    .analysis-brief {
      margin-bottom: 8pt;
      padding: 6pt;
      border: 1pt solid #aaa;
      background: #fffdf5;
      font-size: 9.2pt;
      line-height: 1.3;
    }
    .analysis-grid {
      width: 100%;
      margin-bottom: 8pt;
    }
    .analysis-grid-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 7pt;
      margin-bottom: 8pt;
    }
    .analysis-grid-cell {
      width: 50%;
      border: 0;
      padding: 0 4pt 7pt 0;
      vertical-align: top;
    }
    .analysis-grid-cell-right {
      padding-left: 4pt;
      padding-right: 0;
    }
    .analysis-box {
      border: 1pt solid #999;
      padding: 6pt;
      margin-bottom: 7pt;
      page-break-inside: avoid;
    }
    .analysis-grid-table .analysis-box {
      margin-bottom: 0;
      min-height: 68pt;
    }
    .analysis-box h3 {
      margin: 0 0 5pt;
      font-size: 10.5pt;
      color: #000;
    }
    .analysis-distribution-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.7pt;
    }
    .analysis-distribution-table td {
      border-bottom: 1pt solid #ddd;
      padding: 3pt 2pt;
      vertical-align: middle;
    }
    .analysis-dist-label {
      width: 42%;
      font-weight: normal;
    }
    .analysis-dist-bar {
      width: 30%;
    }
    .analysis-meter {
      width: 100%;
      border-collapse: separate;
    }
    .analysis-meter td {
      height: 5pt;
      padding: 0;
      border: 1pt solid #fff;
      background: #e9eeee;
    }
    .analysis-meter td.is-filled {
      background: #148177;
    }
    .analysis-dist-value {
      width: 18%;
      text-align: right;
      white-space: nowrap;
      font-weight: normal;
    }
    .analysis-dist-percent {
      width: 12%;
      text-align: right;
      font-weight: normal;
    }
    .analysis-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }
    .analysis-table th,
    .analysis-table td {
      border: 1pt solid #888;
      padding: 4pt;
      vertical-align: top;
    }
    .analysis-table th {
      background: #eef4f4;
      font-weight: bold;
    }
    table { border-collapse: collapse; }
    img { max-width: 100%; height: auto; }
  `;
}

function normalizeWordAnswerSpaces(root) {
  const isCompactLayout = root.classList.contains("has-table-layout") || root.classList.contains("has-two-columns");
  const isOnePage = root.classList.contains("fit-one-page");
  const isTwoPages = root.classList.contains("fit-two-pages");
  const minimumHeight = isOnePage
    ? (isCompactLayout ? 44 : 68)
    : isTwoPages
      ? (isCompactLayout ? 68 : 76)
      : (isCompactLayout ? 95 : 130);
  const maximumHeight = isOnePage
    ? (isCompactLayout ? 82 : 118)
    : isTwoPages
      ? (isCompactLayout ? 88 : 102)
      : Infinity;

  root.querySelectorAll(".answer-space").forEach(space => {
    const styledHeight = parseFloat(space.style.minHeight || space.style.height || "");
    const dataMin = parseFloat(space.dataset.answerMin || "");
    const baseHeight = [styledHeight, dataMin]
      .filter(Number.isFinite)
      .reduce((max, value) => Math.max(max, value), 0);
    const heightPx = Math.min(maximumHeight, Math.max(minimumHeight, baseHeight || minimumHeight));
    const heightPt = Math.round(heightPx * 0.75);

    const table = document.createElement("table");
    table.className = "word-answer-space";
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");
    table.style.height = `${heightPt}pt`;
    table.style.minHeight = `${heightPt}pt`;

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.style.height = `${heightPt}pt`;
    cell.innerHTML = "&nbsp;";
    row.appendChild(cell);
    table.appendChild(row);
    space.replaceWith(table);
  });
}

function inlineWordHtmlFromContent(contentNode) {
  const clone = contentNode.cloneNode(true);
  Array.from(clone.querySelectorAll("p, div")).reverse().forEach(node => {
    if (node.classList && node.classList.contains("print-question-content")) return;
    const span = document.createElement("span");
    span.innerHTML = node.innerHTML;
    node.replaceWith(span, document.createTextNode(" "));
  });
  return clone.innerHTML.replace(/\s+/g, " ").trim();
}

function normalizeWordQuestionLines(root) {
  root.querySelectorAll(".print-question:not(.placeholder-cell):not(.print-answer-item)").forEach(question => {
    const content = question.querySelector(".print-question-content");
    if (!content) return;

    const heading = content.parentElement;
    if (!heading) return;

    const numberText = Array.from(heading.children)
      .find(child => child !== content && /^Soru-\d+\)/.test(child.textContent.trim()))
      ?.textContent.trim();
    if (!numberText) return;

    let pointsText = "";
    Array.from(heading.children).forEach(child => {
      const text = child.textContent.trim();
      if (child !== content && /^\(\s*\d+(?:[.,]\d+)?\s*P\s*\)$/.test(text)) {
        pointsText = text;
      }
    });

    let contentHtml = inlineWordHtmlFromContent(content);
    if (!pointsText) {
      const pointMatch = contentHtml.match(/\(\s*\d+(?:[.,]\d+)?\s*P\s*\)\s*$/);
      if (pointMatch) {
        pointsText = pointMatch[0].trim();
        contentHtml = contentHtml.slice(0, pointMatch.index).trim();
      }
    }

    const inline = document.createElement("div");
    inline.className = "word-question-inline";
    inline.innerHTML = `<span class="word-question-no">${escapeHtml(numberText)}&nbsp;&nbsp;</span>${contentHtml}${pointsText ? ` <span class="word-question-points">${escapeHtml(pointsText)}</span>` : ""}`;
    heading.replaceWith(inline);
  });
}

function normalizeWordStudentInfo(root) {
  root.querySelectorAll(".student-info-row").forEach(row => {
    row.style.height = "20pt";
  });
  root.querySelectorAll(".student-info-name, .student-info-meta").forEach(cell => {
    cell.setAttribute("valign", "middle");
    cell.style.verticalAlign = "middle";
    cell.style.height = "20pt";
    cell.style.paddingTop = "0";
    cell.style.paddingBottom = "0";
    cell.style.lineHeight = "20pt";
  });
  root.querySelectorAll(".student-info-points").forEach(cell => {
    cell.setAttribute("valign", "top");
    cell.style.verticalAlign = "top";
    cell.style.height = "20pt";
    cell.style.padding = "0";
  });
  root.querySelectorAll(".student-info-points-top").forEach(cell => {
    cell.style.borderBottom = "0";
  });
  root.querySelectorAll(".student-info-points-bottom").forEach(cell => {
    cell.style.borderTop = "0";
  });
  root.querySelectorAll(".student-points-label").forEach(label => {
    label.style.marginTop = "0";
    label.style.paddingTop = root.classList.contains("fit-one-page") ? "2pt" : "3pt";
  });
}

function normalizeWordPageBreaks(root) {
  root.querySelectorAll(".print-page").forEach((page, index) => {
    page.style.pageBreakAfter = index === root.querySelectorAll(".print-page").length - 1 ? "auto" : "always";
    if (index > 0) {
      page.style.pageBreakBefore = "always";
      page.style.breakBefore = "page";
    }
  });
}

function makeWordCellParagraph(html) {
  const paragraph = document.createElement("p");
  paragraph.innerHTML = html || "&nbsp;";
  paragraph.style.margin = "0 0 3pt";
  paragraph.style.lineHeight = "1.2";
  return paragraph;
}

function splitFlatNumberedCellLines(text) {
  const normalized = (text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const matches = Array.from(normalized.matchAll(/\d{1,2}[.)]\s*/g))
    .filter(match => match.index === 0 || !/\d/.test(normalized.charAt(match.index - 1)));
  if (matches.length < 2) return [];

  return matches
    .map((match, index) => normalized.slice(match.index, matches[index + 1]?.index || normalized.length).trim())
    .filter(Boolean);
}

function normalizeWordTableCellLines(cell) {
  if (cell.querySelector("table")) return;

  const paragraphs = [];
  let inlineBuffer = [];
  const flushInlineBuffer = () => {
    const html = inlineBuffer.map(node => node.outerHTML || escapeHtml(node.textContent || "")).join("").trim();
    inlineBuffer = [];
    if (html) paragraphs.push(makeWordCellParagraph(html));
  };

  Array.from(cell.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) inlineBuffer.push(node.cloneNode(true));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();
    if (tag === "br") {
      flushInlineBuffer();
      return;
    }
    if (tag === "p" || tag === "div") {
      flushInlineBuffer();
      if (node.textContent.trim() || node.querySelector("img, table")) {
        paragraphs.push(makeWordCellParagraph(node.innerHTML));
      }
      return;
    }
    if (tag === "ol" || tag === "ul") {
      flushInlineBuffer();
      Array.from(node.children).forEach((item, index) => {
        if (item.tagName.toLowerCase() !== "li") return;
        const prefix = tag === "ol" ? `${index + 1}. ` : "• ";
        paragraphs.push(makeWordCellParagraph(`${prefix}${item.innerHTML}`));
      });
      return;
    }
    inlineBuffer.push(node.cloneNode(true));
  });
  flushInlineBuffer();

  if (paragraphs.length === 1) {
    const flatLines = splitFlatNumberedCellLines(paragraphs[0].textContent);
    if (flatLines.length > 1) {
      paragraphs.splice(0, paragraphs.length, ...flatLines.map(line => makeWordCellParagraph(escapeHtml(line))));
    }
  }

  if (paragraphs.length <= 1) return;
  paragraphs[paragraphs.length - 1].style.marginBottom = "0";
  cell.replaceChildren(...paragraphs);
}

function normalizeWordContentTables(root) {
  root.querySelectorAll(".print-question-content table, .print-answer table").forEach(table => {
    const isJournalTable = table.classList.contains("journal-entry-table");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.tableLayout = "fixed";
    table.style.margin = isJournalTable ? "3pt 0" : "6pt 0";
    table.style.fontFamily = '"Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif';
    table.style.fontSize = "11pt";
    if (isJournalTable) {
      table.style.fontSize = "11pt";
      table.style.lineHeight = "1.02";
      const cols = table.querySelectorAll("col");
      if (cols.length >= 4) {
        if (cols[0]) cols[0].style.width = "40%";
        if (cols[1]) cols[1].style.width = "40%";
        if (cols[2]) cols[2].style.width = "10%";
        if (cols[3]) cols[3].style.width = "10%";
      } else {
        if (cols[0]) cols[0].style.width = "72%";
        if (cols[1]) cols[1].style.width = "14%";
        if (cols[2]) cols[2].style.width = "14%";
      }
    }
    table.querySelectorAll("th, td").forEach(cell => {
      cell.style.border = "0.75pt solid #000";
      cell.style.padding = isJournalTable ? "0pt 4pt" : "4pt 5pt";
      cell.style.verticalAlign = "top";
      cell.style.lineHeight = isJournalTable ? "1.02" : "1.2";
      cell.style.fontFamily = '"Segoe UI Semibold", "Segoe UI", -apple-system, sans-serif';
      cell.style.fontSize = "11pt";
      normalizeWordTableCellLines(cell);
    });
    table.querySelectorAll("th").forEach(cell => {
      cell.style.fontWeight = "bold";
      cell.style.textAlign = "center";
    });
    if (isJournalTable) {
      const isBlankJournal = table.classList.contains("is-blank-journal") || table.dataset.blank === "true";
      table.querySelectorAll(".journal-entry-date-cell").forEach(cell => {
        cell.style.fontSize = "11pt";
        cell.style.padding = "1pt 4pt";
      });
      table.querySelectorAll(".journal-entry-desc-row th").forEach(cell => {
        cell.style.fontSize = "11pt";
        cell.style.textAlign = "left";
        cell.style.padding = "1pt 4pt";
      });
      table.querySelectorAll(".journal-amount").forEach(cell => {
        cell.style.textAlign = "right";
        cell.style.fontSize = "11pt";
      });
      table.querySelectorAll(".journal-account").forEach(cell => {
        cell.style.textAlign = "left";
        cell.style.fontSize = "11pt";
        cell.style.color = "#000";
        cell.style.fontWeight = "normal";
        cell.style.paddingLeft = cell.classList.contains("is-subaccount") && cell.textContent.trim() ? "14pt" : "4pt";
      });
      table.querySelectorAll(".journal-account-debit-side").forEach(cell => {
        cell.style.borderRight = "none";
      });
      table.querySelectorAll(".journal-account-credit-side").forEach(cell => {
        cell.style.borderLeft = "none";
      });
      table.querySelectorAll(".journal-account-side").forEach(node => {
        const cell = node.closest(".journal-account");
        node.style.display = "inline-block";
        node.style.width = "100%";
        node.style.boxSizing = "border-box";
        node.style.verticalAlign = "top";
        if (cell?.classList.contains("is-subaccount")) {
          node.style.paddingLeft = "0";
          node.style.fontSize = "11pt";
        }
      });
      table.querySelectorAll(".journal-subaccount-amount").forEach(node => {
        node.style.display = "inline-block";
        node.style.marginLeft = "8pt";
        node.style.textAlign = "right";
      });
      table.querySelectorAll("tfoot th").forEach(cell => {
        cell.style.fontSize = "11pt";
      });
      table.querySelectorAll("tbody td").forEach(cell => {
        cell.style.borderTop = "none";
        cell.style.borderBottom = "none";
        if (isBlankJournal) cell.style.height = "18pt";
      });
    }
  });
}

function convertWordHeaderMeta(root) {
  root.querySelectorAll(".print-header").forEach(header => {
    const teacher = header.querySelector(".print-header-teacher");
    const duration = header.querySelector(".print-header-duration");
    const date = header.querySelector(".print-header-date");
    if (!teacher && !duration && !date) return;

    const metaTable = document.createElement("table");
    metaTable.className = "word-header-meta";
    metaTable.setAttribute("cellspacing", "0");
    metaTable.setAttribute("cellpadding", "0");

    const row = document.createElement("tr");
    [teacher, duration, date].forEach(node => {
      const cell = document.createElement("td");
      if (node) {
        cell.innerHTML = node.innerHTML || "&nbsp;";
        node.remove();
      } else {
        cell.innerHTML = "&nbsp;";
      }
      row.appendChild(cell);
    });
    metaTable.appendChild(row);

    const instruction = Array.from(header.children).find(child => {
      if (child.classList && child.classList.contains("official-heading")) return false;
      return child.textContent && child.textContent.trim().startsWith("Yönerge:");
    });

    header.appendChild(metaTable);
    if (instruction) {
      instruction.classList.add("word-header-instruction");
      header.appendChild(instruction);
    }
  });
}

function convertWordQuestionsToTable(root) {
  const isGrid = root.classList.contains("has-table-layout");
  const isTwoColumn = root.classList.contains("has-two-columns");
  if (!isGrid && !isTwoColumn) return;

  root.querySelectorAll(".print-page .print-questions").forEach(container => {
    const questions = Array.from(container.children)
      .filter(child => child.classList && child.classList.contains("print-question"));
    if (!questions.length) return;

    const table = document.createElement("table");
    table.className = isGrid ? "word-grid-table" : "word-two-column-table";
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");

    for (let index = 0; index < questions.length; index += 2) {
      const row = document.createElement("tr");
      row.style.pageBreakInside = "avoid";
      [questions[index], questions[index + 1]].forEach(question => {
        const cell = document.createElement("td");
        cell.style.pageBreakInside = "avoid";
        if (question && !question.classList.contains("placeholder-cell")) {
          question.removeAttribute("style");
          question.style.pageBreakInside = "avoid";
          question.style.breakInside = "avoid";
          cell.appendChild(question);
        } else {
          cell.innerHTML = "&nbsp;";
        }
        row.appendChild(cell);
      });
      table.appendChild(row);
    }

    container.replaceChildren(table);
  });
}

function wrapWordSingleColumnQuestions(root) {
  const isTwoColumnOutput = root.classList.contains("has-table-layout") || root.classList.contains("has-two-columns");
  if (isTwoColumnOutput || root.classList.contains("fit-one-page")) return;

  root.querySelectorAll(".print-page .print-questions").forEach(container => {
    const questions = Array.from(container.children)
      .filter(child => child.classList && child.classList.contains("print-question") && child.querySelector(".word-answer-space"));
    if (!questions.length) return;

    questions.forEach(question => {
      const table = document.createElement("table");
      table.className = "word-single-question-table";
      table.setAttribute("cellspacing", "0");
      table.setAttribute("cellpadding", "0");
      table.style.pageBreakInside = "avoid";

      const row = document.createElement("tr");
      row.style.pageBreakInside = "avoid";

      const cell = document.createElement("td");
      cell.style.pageBreakInside = "avoid";
      question.style.pageBreakInside = "avoid";
      question.style.breakInside = "avoid";
      cell.appendChild(question);
      row.appendChild(cell);
      table.appendChild(row);
      container.appendChild(table);
    });
  });
}

function prepareWordPrintHtml() {
  const printDocument = els.printExamArea.querySelector(".print-document");
  if (!printDocument) return "";
  const clone = printDocument.cloneNode(true);
  normalizeWordPageBreaks(clone);
  convertWordHeaderMeta(clone);
  normalizeWordStudentInfo(clone);
  normalizeWordContentTables(clone);
  normalizeWordQuestionLines(clone);
  normalizeWordAnswerSpaces(clone);
  wrapWordSingleColumnQuestions(clone);
  convertWordQuestionsToTable(clone);
  return clone.outerHTML;
}

function exportWordDocument(mode) {
  if (!buildPrintDocument(mode)) return;

  const label = documentModeLabel(mode);
  const courseName = currentCourse().name || "Ders";
  const title = `${courseName} ${label}`;
  const documentHtml = prepareWordPrintHtml();
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>${wordDocumentStyles()}</style>
</head>
<body>
  <div class="WordSection1">
    ${documentHtml}
  </div>
</body>
</html>`;

  const todayStr = getFormattedReportDate();
  const cleanCourse = formatReportSlug(courseName) || "Ders";
  let fileName = "";

  if (mode === "exam") {
    const term = state.examMeta?.term || "1";
    const examNum = state.examMeta?.examNumber || "1";
    fileName = `${cleanCourse}_${term}_Donem_${examNum}_Yazili_${todayStr}`;
  } else if (mode === "answerKey") {
    const term = state.examMeta?.term || "1";
    const examNum = state.examMeta?.examNumber || "1";
    fileName = `${cleanCourse}_${term}_Donem_${examNum}_Yazili_Cevap_Anahtari_${todayStr}`;
  } else if (mode === "analysis") {
    fileName = `${cleanCourse}_Soru_Analiz_Raporu_${todayStr}`;
  } else {
    fileName = `${cleanCourse}_${formatReportSlug(label)}_${todayStr}`;
  }

  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  downloadBlob(blob, `${fileName}.doc`);
  showToast(`${label} Word dosyası indirildi.`);
}

