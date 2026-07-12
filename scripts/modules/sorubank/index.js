/* ==========================================================================
   SORUBANK MODÜLÜ - EKRAN BAĞLARI VE EDİTÖR ETKİLEŞİMLERİ
   ========================================================================== */

els.moduleSwitchBtn?.addEventListener("click", returnToModuleHub);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

document.querySelector("#newQuestionBtn").addEventListener("click", () => {
  resetQuestionForm();
  setView("question");
});

document.querySelector("#newEditorQuestionBtn").addEventListener("click", resetQuestionForm);
document.querySelector("#resetQuestionBtn").addEventListener("click", resetQuestionForm);
els.questionForm.addEventListener("submit", saveQuestion);
els.deleteQuestionBtn.addEventListener("click", deleteCurrentQuestion);
if (els.closeQuestionEditorBtn) {
  els.closeQuestionEditorBtn.addEventListener("click", () => els.questionEditorDialog.close());
}
if (els.questionEditorDialog) {
  // Prevent closing the dialog with Escape key
  els.questionEditorDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
  });
}
document.querySelector("#closePreviewBtn").addEventListener("click", () => els.questionPreviewDialog.close());
els.prevPreviewBtn.addEventListener("click", () => moveQuestionPreview(-1));
els.nextPreviewBtn.addEventListener("click", () => moveQuestionPreview(1));
els.previewToggleExamBtn.addEventListener("click", () => {
  if (currentPreviewQuestionId) toggleQuestion(currentPreviewQuestionId);
});
els.previewQuestionPoints.addEventListener("change", (event) => {
  if (currentPreviewQuestionId) updateQuestionPoints(currentPreviewQuestionId, event.target.value);
});
els.questionPreviewDialog.addEventListener("click", (event) => {
  if (event.target === els.questionPreviewDialog) {
    els.questionPreviewDialog.close();
  }
});
els.questionPreviewDialog.addEventListener("close", () => {
  currentPreviewQuestionId = null;
  previewQuestionIds = [];
});
els.toggleVisibleQuestionsBtn.addEventListener("click", toggleVisibleQuestionSelection);
els.deleteSelectedQuestionsBtn.addEventListener("click", deleteBulkQuestions);
els.questionType.addEventListener("change", updateTypePanels);
els.addChoiceBtn.addEventListener("click", () => {
  if (els.choiceList.children.length >= choiceLabels.length) return;
  const label = choiceLabels[els.choiceList.children.length];
  const choices = [...getChoicesFromEditor(), { id: label, label, text: "" }];
  renderChoiceEditor(choices, els.correctChoice.value);
});

function activateEditorForToolbar(toolbar) {
  if (!toolbar) return;
  activeToolbar = toolbar;
  activeRichEditor = toolbar.classList.contains("compact-tools") ? els.answerContent : els.questionContent;
  saveEditorSelection();
}

function setActiveEditorForToolbar(toolbar) {
  if (!toolbar) return;
  activeToolbar = toolbar;
  activeRichEditor = toolbar.classList.contains("compact-tools") ? els.answerContent : els.questionContent;
}

document.querySelectorAll(".editor-tools [data-command]").forEach((button) => {
  button.addEventListener("mousedown", (event) => {
    activateEditorForToolbar(button.closest(".editor-tools"));
    event.preventDefault();
  });
  button.addEventListener("click", () => {
    setActiveEditorForToolbar(button.closest(".editor-tools"));
    runEditorCommand(button.dataset.command);
  });
});

document.querySelectorAll(".rich-editor").forEach((editor) => {
  editor.addEventListener("focus", () => {
    activeRichEditor = editor;
    if (editor.id === "questionContent") {
      activeToolbar = document.querySelector(".editor-tools:not(.compact-tools)");
    } else if (editor.id === "answerContent") {
      activeToolbar = document.querySelector(".editor-tools.compact-tools");
    }
    saveEditorSelection();
  });
  editor.addEventListener("mouseup", () => {
    activeRichEditor = editor;
    if (editor.id === "questionContent") {
      activeToolbar = document.querySelector(".editor-tools:not(.compact-tools)");
    } else if (editor.id === "answerContent") {
      activeToolbar = document.querySelector(".editor-tools.compact-tools");
    }
    saveEditorSelection();
  });
  editor.addEventListener("keyup", () => {
    activeRichEditor = editor;
    if (editor.id === "questionContent") {
      activeToolbar = document.querySelector(".editor-tools:not(.compact-tools)");
    } else if (editor.id === "answerContent") {
      activeToolbar = document.querySelector(".editor-tools.compact-tools");
    }
    saveEditorSelection();
  });
  editor.addEventListener("keydown", (event) => {
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    activeRichEditor = editor;
    if (editor.id === "questionContent") {
      activeToolbar = document.querySelector(".editor-tools:not(.compact-tools)");
    } else if (editor.id === "answerContent") {
      activeToolbar = document.querySelector(".editor-tools.compact-tools");
    }
    const direction = event.key === "Backspace" ? "backward" : "forward";
    if (mergeEditorBlockAtBoundary(editor, direction)) {
      event.preventDefault();
      event.stopPropagation();
      editor._mergeDeleteAtBlockBoundary = false;
    }
  });
  editor.addEventListener("beforeinput", (event) => {
    if (event.inputType !== "deleteContentBackward" && event.inputType !== "deleteContentForward") {
      editor._mergeDeleteAtBlockBoundary = false;
      return;
    }
    activeRichEditor = editor;
    if (editor.id === "questionContent") {
      activeToolbar = document.querySelector(".editor-tools:not(.compact-tools)");
    } else if (editor.id === "answerContent") {
      activeToolbar = document.querySelector(".editor-tools.compact-tools");
    }
    editor._mergeDeleteAtBlockBoundary = isEditorSelectionAtBlockBoundary(editor, event.inputType);
  });
  editor.addEventListener("input", (event) => {
    activeRichEditor = editor;
    if (editor.id === "questionContent") {
      activeToolbar = document.querySelector(".editor-tools:not(.compact-tools)");
    } else if (editor.id === "answerContent") {
      activeToolbar = document.querySelector(".editor-tools.compact-tools");
    }
    if (editor._mergeDeleteAtBlockBoundary && (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward")) {
      normalizeLineMergeFormattingToDefault(editor);
    } else {
      saveEditorSelection();
    }
    editor._mergeDeleteAtBlockBoundary = false;
  });
  editor.addEventListener("click", handleEditorMediaClick);
  editor.addEventListener("mousedown", (event) => {
    const table = event.target.closest("table");
    const img = event.target.closest("img");
    
    if (table) {
      const target = getTableDragTarget(table, event.clientX, event.clientY);
      if (target && target.type !== 'table-corner') {
        event.preventDefault();
        event.stopPropagation();
        
        dragInfo = {
          ...target,
          startX: event.clientX,
          startY: event.clientY,
          tableStartWidth: table.getBoundingClientRect().width,
          tableStartHeight: table.getBoundingClientRect().height
        };
        
        document.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseup", handleGlobalMouseUp);
      }
    } else if (img) {
      const rect = img.getBoundingClientRect();
      const isNearCornerX = Math.abs(event.clientX - rect.right) <= 8;
      const isNearCornerY = Math.abs(event.clientY - rect.bottom) <= 8;
      if (isNearCornerX && isNearCornerY) {
        event.preventDefault();
        event.stopPropagation();
        
        dragInfo = {
          type: 'table-corner',
          element: img,
          startX: event.clientX,
          startY: event.clientY,
          startWidth: rect.width,
          startHeight: rect.height
        };
        
        document.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseup", handleGlobalMouseUp);
      }
    }
  });
  editor.addEventListener("scroll", () => {
    if (selectedResizableElement) {
      positionCornerHandle();
    }
    if (activeHoveredTable && tableActionsOverlay && tableActionsOverlay.style.display !== "none") {
      positionTableOverlays(activeHoveredTable, activeHoveredCell);
    }
  });
  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    
    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      // Clean headers, script, style, link tags
      doc.querySelectorAll("style, link, meta, title, script").forEach((item) => item.remove());
      
      const allElements = doc.querySelectorAll("*");
      allElements.forEach((el) => {
        // 1. Google Docs normal-weight bold tag unwrap
        if (el.tagName === "B" || el.tagName === "STRONG") {
          const fw = el.style ? el.style.fontWeight : "";
          if (fw === "normal" || fw === "400" || fw === "300" || fw === "200" || fw === "100") {
            const parent = el.parentNode;
            if (parent) {
              while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
              }
              el.remove();
              return;
            }
          }
        }
        
        // 2. Convert CSS-based formatting (from Word, etc.) into semantic tags
        if (el.style) {
          const fw = el.style.fontWeight;
          const fs = el.style.fontStyle;
          const td = el.style.textDecoration;
          
          if (fw === "bold" || fw === "700" || fw === "800" || fw === "900") {
            const strong = doc.createElement("strong");
            while (el.firstChild) {
              strong.appendChild(el.firstChild);
            }
            el.appendChild(strong);
          }
          if (fs === "italic" || fs === "oblique") {
            const em = doc.createElement("em");
            while (el.firstChild) {
              em.appendChild(el.firstChild);
            }
            el.appendChild(em);
          }
          if (td && td.includes("underline")) {
            const u = doc.createElement("u");
            while (el.firstChild) {
              u.appendChild(el.firstChild);
            }
            el.appendChild(u);
          }
        }
      });
      
      // 3. Remove inline styles/classes from non-structural elements, and reset font properties
      const remainingElements = doc.querySelectorAll("*");
      remainingElements.forEach((el) => {
        const keepStyleTags = ["TABLE", "TR", "TD", "TH", "IMG"];
        if (!keepStyleTags.includes(el.tagName)) {
          el.removeAttribute("style");
          el.removeAttribute("class");
        } else {
          if (el.style) {
            el.style.fontFamily = "";
            el.style.fontSize = "";
            el.style.color = "";
            el.style.backgroundColor = "";
          }
          el.removeAttribute("class");
        }
        if (el.tagName === "FONT") {
          el.removeAttribute("face");
          el.removeAttribute("size");
          el.removeAttribute("color");
        }
      });
      
      document.execCommand("insertHTML", false, doc.body.innerHTML);
    } else {
      document.execCommand("insertText", false, text);
    }
    saveEditorSelection();
  });
});

document.addEventListener("mousedown", (event) => {
  const isEditor = event.target.closest(".rich-editor");
  const isToolbar = event.target.closest(".editor-tools");
  const isPicker = event.target.closest(".list-picker-popup") || 
                   event.target.closest(".table-picker-popup") || 
                   event.target.closest(".table-actions-overlay") || 
                   event.target.closest(".resize-handle-corner") || 
                   event.target.closest(".color-picker-popup") || 
                   (typeof resizePanel !== "undefined" && resizePanel && resizePanel.contains(event.target));
  const isPrompt = event.target.closest("#promptDialog");
  const isJournalDialog = event.target.closest("#journalEntryDialog");
  
  if (!isEditor && !isToolbar && !isPicker && !isPrompt && !isJournalDialog) {
    clearResizableSelection();
    savedSelectionRange = null;
    const selection = window.getSelection();
    selection.removeAllRanges();
    if (activeRichEditor) {
      activeRichEditor.blur();
      activeRichEditor = null;
    }
  } else if (!isEditor && !isPicker) {
    clearResizableSelection();
  }
});

window.addEventListener("resize", positionResizePanel);
window.addEventListener("scroll", positionResizePanel, true);

document.querySelectorAll(".font-size-select").forEach((select) => {
  select.addEventListener("focus", () => {
    activateEditorForToolbar(select.closest(".editor-tools"));
  });
  select.addEventListener("change", () => {
    if (isProgrammaticChange) return;
    if (select.value === select._lastProgrammaticValue) return;
    activateEditorForToolbar(select.closest(".editor-tools"));
    if (select.value) {
      setFontSizeOfSelection(select.value);
    }
  });
});

document.querySelectorAll(".table-rows, .table-cols").forEach((select) => {
  select.addEventListener("focus", () => {
    activeToolbar = select.closest(".editor-tools");
  });
  select.addEventListener("change", () => {
    activeToolbar = select.closest(".editor-tools");
  });
});

// Table picker listeners are initialized via initTablePickers() at page load.

document.querySelectorAll(".image-input").forEach((input) => {
  input.addEventListener("change", (event) => {
    activateEditorForToolbar(input.closest(".editor-tools"));
    insertImage(event.target.files[0]);
    event.target.value = "";
  });
});

document.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("mousedown", (event) => {
    event.preventDefault(); // Crucial: prevents losing focus and editor selection
  });
  option.addEventListener("click", (event) => {
    activateEditorForToolbar(option.closest(".editor-tools"));
    const color = option.dataset.color;
    const isBack = option.closest(".color-picker-wrapper").querySelector(".back-color-btn") !== null;
    const command = isBack ? "hiliteColor" : "foreColor";
    
    runEditorCommand(command, color);
  });
});

document.querySelectorAll(".link-btn").forEach((button) => {
  button.addEventListener("mousedown", (event) => {
    activateEditorForToolbar(button.closest(".editor-tools"));
    event.preventDefault();
  });
  button.addEventListener("click", async () => {
    activateEditorForToolbar(button.closest(".editor-tools"));
    const url = await appPrompt({
      title: "Bağlantı Ekle",
      label: "Bağlantı adresi:",
      placeholder: "https://example.com",
      value: "https://",
      okText: "Ekle",
      cancelText: "Vazgeç"
    });
    if (url?.trim()) {
      runEditorCommand("createLink", url.trim());
    }
  });
});

[els.searchInput, els.topicFilter].forEach((control) => {
  control.addEventListener("input", renderQuestions);
});

els.questionCourse.addEventListener("change", () => {
  renderCurriculumSelectors("", "");
  syncQuestionGradeFromCourse(true);
});
els.questionTopic.addEventListener("change", () => renderCurriculumSelectors(els.questionTopic.value, ""));

[els.examTermSelect, els.examNumberSelect, els.examClassInput, els.examDurationInput, els.examDateInput, els.examPageTargetSelect, els.examColumnSelect, els.examOutputTypeSelect, els.answerKeyModeSelect, els.examInstructionInput].forEach((control) => {
  control.addEventListener("input", updateExamMeta);
  control.addEventListener("change", updateExamMeta);
});

document.querySelector("#randomPickBtn").addEventListener("click", randomPick);
document.querySelector("#clearExamBtn").addEventListener("click", clearSelectedForCurrentCourse);
document.querySelector("#wordExamBtn").addEventListener("click", () => exportWordDocument("exam"));
document.querySelector("#wordAnswerBtn").addEventListener("click", () => exportWordDocument("answer"));
document.querySelector("#wordAnalysisBtn").addEventListener("click", () => exportWordDocument("analysis"));
els.saveExamArchiveBtn.addEventListener("click", () => saveExamArchive());
els.saveExamArchiveAsBtn.addEventListener("click", () => saveExamArchive({ forceNew: true }));
els.loadExamArchiveBtn.addEventListener("click", loadExamArchive);
els.updateExamArchiveBtn.addEventListener("click", () => saveExamArchive());
els.deleteExamArchiveBtn.addEventListener("click", deleteExamArchive);
els.examArchiveSelect.addEventListener("change", () => {
  const exam = state.archivedExams.find((item) => item.id === els.examArchiveSelect.value);
  els.examArchiveNameInput.value = exam?.title || defaultExamArchiveTitle();
  const hasSelection = Boolean(exam);
  els.loadExamArchiveBtn.disabled = !hasSelection;
  els.deleteExamArchiveBtn.disabled = !hasSelection;
});
els.examCartBtn.addEventListener("click", openExamCart);
els.cartViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    cartViewMode = button.dataset.cartView || "summary";
    renderExamCart();
  });
});
els.basketSectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    basketSectionMode = button.dataset.basketSection || "questions";
    renderExamCart();
    renderExamArchive();
    renderExamAnalysis();
  });
});
els.closeCartBtn.addEventListener("click", () => els.examCartDialog.close());
els.closeCartBottomBtn.addEventListener("click", () => els.examCartDialog.close());
els.clearCartBtn.addEventListener("click", clearSelectedForCurrentCourse);
els.goExamFromCartBtn.addEventListener("click", () => {
  els.examCartDialog.close();
  setView("exam");
});
els.examCartDialog.addEventListener("click", (event) => {
  if (event.target === els.examCartDialog) {
    els.examCartDialog.close();
  }
});
document.querySelector("#settingsBtn").addEventListener("click", () => setView("settings"));

els.signInBtn.addEventListener("click", signInToCloud);
els.signUpBtn.addEventListener("click", signUpToCloud);
els.signOutBtn.addEventListener("click", signOutFromCloud);
els.syncNowBtn.addEventListener("click", syncCloudNow);
els.saveCloudConfigBtn.addEventListener("click", saveCloudConfigFromForm);
els.settingsForm.addEventListener("submit", updateSettings);
els.addTopicBtn.addEventListener("click", addTopic);
els.addOutcomeBtn.addEventListener("click", addOutcome);
els.curriculumPdfInput.addEventListener("change", (event) => importCurriculumPdf(event.target.files[0]));
if (els.questionDocxInput) els.questionDocxInput.addEventListener("change", (event) => importQuestionsDocx(event.target.files[0]));
els.addTeacherBtn.addEventListener("click", () => addTeacherFromInput());
els.teacherNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTeacherFromInput();
  }
});

document.querySelector("#addCourseBtn").addEventListener("click", openCreateCourse);
els.coursePickerButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = !els.coursePicker.classList.contains("is-open");
  els.coursePicker.classList.toggle("is-open", willOpen);
  els.coursePickerButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
});
document.addEventListener("click", (event) => {
  if (!els.coursePicker.contains(event.target)) closeCoursePicker();
  if (!event.target.closest(".user-menu-wrap")) closeUserMenus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCoursePicker();
});

document.querySelector("#cancelCourseBtn").addEventListener("click", () => els.courseDialog.close());

els.courseForm.addEventListener("submit", saveCourse);

function initTablePickers() {
  document.querySelectorAll(".table-picker-wrapper").forEach((wrapper) => {
    const trigger = wrapper.querySelector(".table-picker-btn");
    const popup = wrapper.querySelector(".table-picker-popup");
    const grid = wrapper.querySelector(".table-picker-grid");
    const title = wrapper.querySelector(".table-picker-title");
    
    // Generate 6x6 grid dynamically
    grid.innerHTML = "";
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        const cell = document.createElement("div");
        cell.className = "table-picker-cell";
        cell.dataset.row = r;
        cell.dataset.col = c;
        grid.appendChild(cell);
      }
    }
    
    // Prevent selection loss when clicking inside the popup
    popup.addEventListener("mousedown", (e) => {
      activateEditorForToolbar(wrapper.closest(".editor-tools"));
      e.preventDefault();
    });
    trigger.addEventListener("mousedown", (e) => {
      activateEditorForToolbar(wrapper.closest(".editor-tools"));
      e.preventDefault();
    });
    
    // Grid mouse hover (highlighting)
    grid.addEventListener("mousemove", (e) => {
      const cell = e.target.closest(".table-picker-cell");
      if (!cell) return;
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      title.textContent = `${row}x${col} Tablo`;
      
      grid.querySelectorAll(".table-picker-cell").forEach((item) => {
        const itemRow = parseInt(item.dataset.row);
        const itemCol = parseInt(item.dataset.col);
        item.classList.toggle("is-active", itemRow <= row && itemCol <= col);
      });
    });
    
    // Reset highlights on leaving the grid
    grid.addEventListener("mouseleave", () => {
      title.textContent = "Tablo seçin";
      grid.querySelectorAll(".table-picker-cell").forEach((item) => item.classList.remove("is-active"));
    });
    
    // Click to insert
    grid.addEventListener("click", (e) => {
      const cell = e.target.closest(".table-picker-cell");
      if (!cell) return;
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      
      // Call standard insertTableOfSize logic
      insertTableOfSize(row, col);
      
      // Instantly hide the popup using the hidden class override
      popup.classList.add("is-hidden");
    });

    // Custom table size button handler
    const customBtn = wrapper.querySelector(".table-picker-custom-btn");
    if (customBtn) {
      customBtn.addEventListener("mousedown", (e) => {
        activeToolbar = wrapper.closest(".editor-tools");
        if (activeToolbar.classList.contains("compact-tools")) {
          activeRichEditor = els.answerContent;
        } else {
          activeRichEditor = els.questionContent;
        }
        saveEditorSelection();
        e.preventDefault();
      });
      
      customBtn.addEventListener("click", async (e) => {
        // Instantly hide the popup using the hidden class override
        popup.classList.add("is-hidden");
        
        // Use appPrompt to ask for rows and columns
        const rowsStr = await appPrompt({
          title: "Tablo Ekle",
          label: "Satır sayısı (1-50):",
          value: "8",
          placeholder: "Örn. 8",
          okText: "İleri"
        });
        if (!rowsStr) return;
        const rows = parseInt(rowsStr);
        if (isNaN(rows) || rows <= 0 || rows > 50) {
          showToast("Lütfen 1-50 arasında geçerli bir satır sayısı girin.", "warning");
          return;
        }

        const colsStr = await appPrompt({
          title: "Tablo Ekle",
          label: "Sütun sayısı (1-20):",
          value: "8",
          placeholder: "Örn. 8",
          okText: "Ekle"
        });
        if (!colsStr) return;
        const cols = parseInt(colsStr);
        if (isNaN(cols) || cols <= 0 || cols > 20) {
          showToast("Lütfen 1-20 arasında geçerli bir sütun sayısı girin.", "warning");
          return;
        }

        insertTableOfSize(rows, cols);
      });
    }
    
    // Reset the hidden state when mouse leaves the wrapper, so it opens on next hover
    wrapper.addEventListener("mouseleave", () => {
      popup.classList.remove("is-hidden");
    });
  });
}

function initListPickers() {
  document.querySelectorAll(".list-picker-wrapper").forEach((wrapper) => {
    const trigger = wrapper.querySelector(".list-picker-btn");
    const popup = wrapper.querySelector(".list-picker-popup");
    
    // Prevent selection loss when clicking inside the popup
    popup.addEventListener("mousedown", (e) => {
      activateEditorForToolbar(wrapper.closest(".editor-tools"));
      e.preventDefault();
    });
    trigger.addEventListener("mousedown", (e) => {
      activateEditorForToolbar(wrapper.closest(".editor-tools"));
      e.preventDefault();
    });
    
    popup.querySelectorAll(".list-style-option").forEach((option) => {
      option.addEventListener("click", () => {
        const isOrdered = trigger.dataset.command === "insertOrderedList";
        const style = option.dataset.style;
        setListStyle(style, isOrdered);
        popup.style.display = "none";
      });
    });
    
    wrapper.addEventListener("mouseleave", () => {
      popup.style.display = "";
    });
  });
}

function initTableManipulation() {
  document.addEventListener("mousemove", (event) => {
    if (dragInfo) return;

    const editor = event.target.closest(".rich-editor");
    const actionsOverlay = document.getElementById("editor-table-actions");

    const cell = event.target.closest("td, th");
    const table = cell ? cell.closest("table") : null;
    const img = event.target.closest("img");
    const isOverOverlay = event.target.closest(".table-actions-overlay") || event.target.closest(".resize-handle-corner");

    if (table && cell && editor) {
      if (overlayHideTimeout) {
        clearTimeout(overlayHideTimeout);
        overlayHideTimeout = null;
      }
      activeHoveredTable = table;
      activeHoveredCell = cell;
      
      ensureTableOverlays();
      positionTableOverlays(table, cell);
      
      const target = getTableDragTarget(table, event.clientX, event.clientY);
      if (target) {
        editor.style.cursor = target.type === 'col-resize' ? 'col-resize' : 
                              target.type === 'row-resize' ? 'row-resize' : 'nwse-resize';
      } else {
        editor.style.cursor = 'text';
      }
    } else if (img && editor) {
      if (overlayHideTimeout) {
        clearTimeout(overlayHideTimeout);
        overlayHideTimeout = null;
      }
      activeHoveredTable = img;
      activeHoveredCell = null;
      
      ensureTableOverlays();
      positionTableOverlays(img, null);
      
      const rect = img.getBoundingClientRect();
      const isNearCornerX = Math.abs(event.clientX - rect.right) <= 8;
      const isNearCornerY = Math.abs(event.clientY - rect.bottom) <= 8;
      if (isNearCornerX && isNearCornerY) {
        editor.style.cursor = 'nwse-resize';
      } else {
        editor.style.cursor = 'default';
      }
    } else if (isOverOverlay) {
      if (overlayHideTimeout) {
        clearTimeout(overlayHideTimeout);
        overlayHideTimeout = null;
      }
    } else {
      if (actionsOverlay && actionsOverlay.style.display !== "none" && !overlayHideTimeout) {
        overlayHideTimeout = setTimeout(() => {
          actionsOverlay.style.display = "none";
          overlayHideTimeout = null;
        }, 450);
      }
      if (editor) {
        editor.style.cursor = 'default';
      }
    }
  });

  document.addEventListener("mousedown", (event) => {
    if (event.target.closest("table, img, .table-actions-overlay, .resize-handle-corner, .resize-panel, .editor-tools, #journalEntryDialog")) {
      return;
    }
    clearResizableSelection();
  });
}

initTablePickers();
initListPickers();
initTableManipulation();
initJournalEntryTools();


const sorubankModule = {
  get shell() {
    return document.querySelector(".app-shell");
  },
  get state() {
    return state;
  },
  render() {
    return render();
  },
  setView(view) {
    return setView(view);
  },
  resetQuestionForm() {
    return resetQuestionForm();
  },
  closeCoursePicker() {
    return closeCoursePicker();
  }
};
window.AppModules.register("sorubank", sorubankModule);
