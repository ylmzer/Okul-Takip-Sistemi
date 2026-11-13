function insertTableOfSize(rows, cols) {
  focusActiveEditor();
  const tableRows = Array.from({ length: rows }, (_, rowIndex) => {
    const cells = Array.from({ length: cols }, (_, colIndex) => {
      const tag = rowIndex === 0 ? "th" : "td";
      const text = rowIndex === 0 ? `Başlık ${colIndex + 1}` : "Veri";
      return `<${tag}>${text}</${tag}>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  document.execCommand("insertHTML", false, `<table data-resizable="true" style="width: 100%; max-width: 100%; font-family: 'Segoe UI Semibold', 'Segoe UI', -apple-system, sans-serif; font-size: 11pt;"><tbody>${tableRows}</tbody></table><p><br></p>`);
}

function journalRowTemplate(row = {}, index = 0) {
  const isSubaccount = Boolean(row.isSubaccount || row.subaccount || isJournalSubaccountCode(row.code));
  const codePlaceholder = row.codePlaceholder || "100";
  const namePlaceholder = row.namePlaceholder || "Kasa Hesabı";
  return `
    <div class="journal-entry-row ${isSubaccount ? "is-subaccount-row" : ""}" data-journal-row>
      <input class="journal-code-input" type="text" value="${escapeHtml(row.code || "")}" placeholder="${escapeHtml(codePlaceholder)}" list="journalAccountCodeList" aria-label="Hesap kodu ${index + 1}" />
      <input class="journal-name-input" type="text" value="${escapeHtml(row.name || "")}" placeholder="${escapeHtml(namePlaceholder)}" aria-label="Hesap adı ${index + 1}" />
      <label class="journal-subaccount-toggle" title="Alt hesap olarak göster">
        <input class="journal-subaccount-input" type="checkbox" ${isSubaccount ? "checked" : ""} />
        <span>Alt</span>
      </label>
      <input class="journal-debit-input" type="number" min="0" step="0.01" value="${row.debit || ""}" placeholder="0,00" aria-label="Borç ${index + 1}" />
      <input class="journal-credit-input" type="number" min="0" step="0.01" value="${row.credit || ""}" placeholder="0,00" aria-label="Alacak ${index + 1}" />
      <button class="journal-remove-row" type="button" title="Satırı sil">×</button>
    </div>
  `;
}

function journalAccountNameForCode(code) {
  const normalized = String(code || "").trim();
  if (!/^\d{3}$/.test(normalized)) return "";
  return JOURNAL_ACCOUNT_PLAN[normalized] || "";
}

function syncJournalAccountNameForRow(rowEl) {
  if (!rowEl) return;
  const codeInput = rowEl.querySelector(".journal-code-input");
  const nameInput = rowEl.querySelector(".journal-name-input");
  const subaccountInput = rowEl.querySelector(".journal-subaccount-input");
  if (!codeInput || !nameInput) return;
  const shouldSkip = subaccountInput?.checked || isJournalSubaccountCode(codeInput.value);
  const accountName = shouldSkip ? "" : journalAccountNameForCode(codeInput.value);
  const canReplace = !nameInput.value.trim() || rowEl.dataset.accountNameAuto === "true";
  if (accountName && canReplace) {
    nameInput.value = accountName;
    rowEl.dataset.accountNameAuto = "true";
  } else if (!accountName && rowEl.dataset.accountNameAuto === "true") {
    nameInput.value = "";
    delete rowEl.dataset.accountNameAuto;
  }
}

function journalAccountCodeOptionsHtml() {
  return Object.entries(JOURNAL_ACCOUNT_PLAN)
    .map(([code, name]) => `<option value="${escapeHtml(code)}">${escapeHtml(name)}</option>`)
    .join("");
}

function journalNumber(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatJournalAmount(value) {
  const number = journalNumber(value);
  return number ? number.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
}

function parseJournalAmount(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function collectJournalEntryForm() {
  const dialog = ensureJournalEntryDialog();
  const isBlank = dialog.querySelector("#journalEntryBlank")?.checked || false;
  const collectedRows = [...dialog.querySelectorAll("[data-journal-row]")].map((row, index) => ({
    code: row.querySelector(".journal-code-input").value.trim(),
    name: row.querySelector(".journal-name-input").value.trim(),
    isSubaccount: row.querySelector(".journal-subaccount-input")?.checked || false,
    isAutoParent: row.dataset.autoParent === "true",
    index,
    debit: journalNumber(row.querySelector(".journal-debit-input").value),
    credit: journalNumber(row.querySelector(".journal-credit-input").value)
  }));
  const rows = isBlank
    ? collectedRows.map((row) => ({ ...row, code: "", name: "", isSubaccount: false, debit: 0, credit: 0 }))
    : collectedRows.filter((row) => row.code || row.name || row.debit || row.credit);

  return {
    date: dialog.querySelector("#journalEntryDate").value.trim(),
    description: dialog.querySelector("#journalEntryDescription").value.trim(),
    isBlank,
    rows
  };
}

function journalTotals(rows) {
  return rows.reduce((totals, row) => ({
    debit: totals.debit + journalNumber(row.debit),
    credit: totals.credit + journalNumber(row.credit)
  }), { debit: 0, credit: 0 });
}

function journalSubaccountParentCode(row, rows) {
  const code = String(row?.code || "").trim();
  if (isJournalSubaccountCode(code)) {
    const directParentCode = journalMainAccountCode(code);
    if (rows.some((candidate) => String(candidate?.code || "").trim() === directParentCode && !isJournalSubaccountRow(candidate))) {
      return directParentCode;
    }
  }
  for (let index = Number(row?.index) - 1; index >= 0; index -= 1) {
    const candidate = rows[index];
    if (candidate && !isJournalSubaccountRow(candidate) && candidate.code) {
      return String(candidate.code).trim();
    }
  }
  return "";
}

function journalParentCodesForRows(rows) {
  const parentCodes = new Set();
  rows.forEach((row) => {
    if (!isJournalSubaccountRow(row)) return;
    const parentCode = journalSubaccountParentCode(row, rows);
    if (parentCode) parentCodes.add(parentCode);
  });
  return parentCodes;
}

function journalEffectiveRows(rows) {
  const parentCodes = journalParentCodesForRows(rows);
  return rows.filter((row) => {
    if (isJournalSubaccountRow(row)) return true;
    return !parentCodes.has(String(row.code || "").trim());
  });
}

function journalChildTotalsByParent(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    if (!isJournalSubaccountRow(row)) return;
    const parentCode = journalSubaccountParentCode(row, rows);
    if (!parentCode) return;
    const current = totals.get(parentCode) || { debit: 0, credit: 0 };
    current.debit += journalNumber(row.debit);
    current.credit += journalNumber(row.credit);
    totals.set(parentCode, current);
  });
  return totals;
}

function setJournalAmountInput(input, value) {
  input.value = value ? Number(value.toFixed(2)) : "";
}

function syncJournalParentAmounts() {
  const dialog = ensureJournalEntryDialog();
  const rowEls = [...dialog.querySelectorAll("[data-journal-row]")];
  const rows = rowEls.map((row, index) => ({
    code: row.querySelector(".journal-code-input").value.trim(),
    isSubaccount: row.querySelector(".journal-subaccount-input")?.checked || false,
    index,
    debit: journalNumber(row.querySelector(".journal-debit-input").value),
    credit: journalNumber(row.querySelector(".journal-credit-input").value)
  }));
  const childTotals = journalChildTotalsByParent(rows);

  rowEls.forEach((rowEl) => {
    rowEl.classList.toggle("is-subaccount-row", rowEl.querySelector(".journal-subaccount-input")?.checked || false);
    const code = rowEl.querySelector(".journal-code-input").value.trim();
    const debitInput = rowEl.querySelector(".journal-debit-input");
    const creditInput = rowEl.querySelector(".journal-credit-input");
    const totals = childTotals.get(code);
    const wasAutoParent = rowEl.dataset.autoParent === "true";

    if (totals && !(rowEl.querySelector(".journal-subaccount-input")?.checked)) {
      rowEl.dataset.autoParent = "true";
      rowEl.classList.add("is-auto-parent-row");
      setJournalAmountInput(debitInput, totals.debit);
      setJournalAmountInput(creditInput, totals.credit);
      debitInput.readOnly = true;
      creditInput.readOnly = true;
    } else {
      if (wasAutoParent) {
        debitInput.value = "";
        creditInput.value = "";
      }
      delete rowEl.dataset.autoParent;
      rowEl.classList.remove("is-auto-parent-row");
      debitInput.readOnly = false;
      creditInput.readOnly = false;
    }
  });
}

function updateJournalEntrySummary() {
  const dialog = ensureJournalEntryDialog();
  syncJournalParentAmounts();
  const { rows } = collectJournalEntryForm();
  const isBlank = dialog.querySelector("#journalEntryBlank")?.checked || false;
  const rowCount = dialog.querySelectorAll("[data-journal-row]").length || rows.length || 1;
  const totals = journalTotals(journalEffectiveRows(rows));
  const diff = Math.abs(totals.debit - totals.credit);
  const summary = dialog.querySelector("#journalEntrySummary");
  const insertBtn = dialog.querySelector("#journalEntryInsertBtn");
  const balanceBtn = dialog.querySelector("#journalEntryBalanceBtn");
  if (isBlank) {
    summary.textContent = `${rowCount} satır boş yevmiye`;
    summary.classList.remove("is-balanced", "is-unbalanced");
    if (balanceBtn) balanceBtn.disabled = true;
    insertBtn.textContent = editingJournalTable ? "Boş Yevmiyeyi Güncelle" : "Boş Yevmiyeyi Ekle";
    return;
  }
  if (balanceBtn) balanceBtn.disabled = false;
  const status = diff < 0.005 ? "Dengede" : `Fark: ${formatJournalAmount(diff)}`;
  summary.textContent = `Borç ${formatJournalAmount(totals.debit) || "0,00"} | Alacak ${formatJournalAmount(totals.credit) || "0,00"} | ${status}`;
  summary.classList.toggle("is-balanced", diff < 0.005 && (totals.debit > 0 || totals.credit > 0));
  summary.classList.toggle("is-unbalanced", diff >= 0.005);
  insertBtn.textContent = editingJournalTable ? "Yevmiyeyi Güncelle" : "Yevmiyeyi Ekle";
}

function addJournalEntryRow(row = {}) {
  const dialog = ensureJournalEntryDialog();
  const rowsEl = dialog.querySelector("#journalEntryRows");
  rowsEl.insertAdjacentHTML("beforeend", journalRowTemplate(row, rowsEl.children.length));
  updateJournalEntrySummary();
}

function emptyJournalEntryRows() {
  return [
    { code: "", name: "", debit: "", credit: "", codePlaceholder: "100", namePlaceholder: "Kasa Hesabı" },
    { code: "", name: "", debit: "", credit: "" }
  ];
}

function parseJournalEntryTable(table) {
  if (!table || table.dataset.journalEntry !== "true") {
    return { date: "", description: "", isBlank: false, rows: emptyJournalEntryRows() };
  }
  const isBlank = table.dataset.blank === "true";
  const titleText = table.querySelector(".journal-entry-date-cell")?.textContent.trim()
    || table.querySelector(".journal-entry-title-row th")?.textContent.trim()
    || "";
  const parsedDate = /^\.*\/\.*\/20\.*$/.test(titleText)
    ? ""
    : /^Yevmiye Maddesi\s*-\s*/i.test(titleText)
    ? titleText.replace(/^Yevmiye Maddesi\s*-\s*/i, "").trim()
    : (/^Yevmiye Maddesi$/i.test(titleText) ? "" : titleText);
  const descriptionText = table.querySelector(".journal-entry-desc-row th")?.textContent.trim() || "";
  const parsedDescription = descriptionText.replace(/^Açıklama:\s*/i, "").trim();
  const rows = [...table.querySelectorAll("tbody tr")].map((tr) => {
    const cells = [...tr.children];
    if (cells.length === 3) {
      const accountText = cells[0]?.textContent.trim() || "";
      const accountParts = accountText.match(/^(\S+)\s+(.+)$/);
      return {
        code: tr.dataset.code || accountParts?.[1] || "",
        name: tr.dataset.name || accountParts?.[2] || accountText,
        isSubaccount: tr.dataset.subaccount === "true" || cells[0]?.classList.contains("is-subaccount") || false,
        debit: parseJournalAmount(tr.dataset.debit || cells[1]?.textContent),
        credit: parseJournalAmount(tr.dataset.credit || cells[2]?.textContent)
      };
    }
    const accountCell = cells.find(cell => cell.classList.contains("journal-account") && cell.textContent.trim()) || cells[0];
    const accountText = (accountCell?.querySelector(".journal-account-text")?.textContent || accountCell?.textContent || "")
      .replace(/\s*-\s*\([^)]*\)\s*$/, "")
      .trim();
    const accountParts = accountText.match(/^(\S+)\s+(.+)$/);
    return {
      code: tr.dataset.code || accountParts?.[1] || accountText,
      name: tr.dataset.name || accountParts?.[2] || "",
      isSubaccount: tr.dataset.subaccount === "true" || accountCell?.classList.contains("is-subaccount") || false,
      debit: parseJournalAmount(tr.dataset.debit || cells[cells.length - 2]?.textContent),
      credit: parseJournalAmount(tr.dataset.credit || cells[cells.length - 1]?.textContent)
    };
  });
  return {
    date: table.dataset.date || parsedDate || "",
    description: table.dataset.description || parsedDescription || "",
    isBlank,
    rows: rows.length ? rows : emptyJournalEntryRows()
  };
}

function isJournalSubaccountCode(code) {
  return /^\d+\.\d+/.test(String(code || "").trim());
}

function isJournalSubaccountRow(row) {
  return Boolean(row?.isSubaccount || row?.subaccount || isJournalSubaccountCode(row?.code));
}

function journalMainAccountCode(code) {
  return String(code || "").trim().split(".")[0];
}

function renderJournalEntryTable(entry) {
  const rows = entry.rows.length ? entry.rows : emptyJournalEntryRows();
  const isBlank = Boolean(entry.isBlank || entry.blank);
  const parentCodes = journalParentCodesForRows(rows);
  const childTotals = journalChildTotalsByParent(rows);
  const title = escapeHtml(entry.date || "...../...../20.....");
  const descriptionRow = `<tr class="journal-entry-desc-row"><th colspan="4">Açıklama:${entry.description ? ` ${escapeHtml(entry.description)}` : ""}</th></tr>`;
  const bodyRows = rows.map((row) => {
    if (isBlank) {
      return `
    <tr data-code="" data-name="" data-subaccount="false" data-debit="0" data-credit="0">
      <td class="journal-account is-debit journal-account-debit-side">&nbsp;</td>
      <td class="journal-account is-debit journal-account-credit-side">&nbsp;</td>
      <td class="journal-amount">&nbsp;</td>
      <td class="journal-amount">&nbsp;</td>
    </tr>
  `;
    }
    const isSubaccount = isJournalSubaccountRow(row);
    const isParentWithSubaccounts = parentCodes.has(String(row.code || "").trim()) && !isSubaccount;
    const childTotalsForParent = isParentWithSubaccounts ? childTotals.get(String(row.code || "").trim()) : null;
    const debit = isSubaccount ? 0 : isParentWithSubaccounts ? childTotalsForParent?.debit || 0 : row.debit;
    const credit = isSubaccount ? 0 : isParentWithSubaccounts ? childTotalsForParent?.credit || 0 : row.credit;
    const inlineAmount = isSubaccount ? formatJournalAmount(journalNumber(row.debit) || journalNumber(row.credit)) : "";
    const isCredit = isSubaccount
      ? journalNumber(row.credit) && !journalNumber(row.debit)
      : journalNumber(credit) && !journalNumber(debit);
    const accountClass = [
      "journal-account",
      isCredit ? "is-credit" : "is-debit",
      isSubaccount ? "is-subaccount" : ""
    ].filter(Boolean).join(" ");
    const accountText = escapeHtml([row.code, row.name].filter(Boolean).join(" "));
    const inlineAmountHtml = inlineAmount ? `<span class="journal-subaccount-amount">- (${inlineAmount})</span>` : "";
    const accountContent = `<span class="journal-account-side"><span class="journal-account-text">${accountText}</span>${inlineAmountHtml}</span>`;
    const debitAccountCell = isCredit ? "" : accountContent;
    const creditAccountCell = isCredit ? accountContent : "";
    return `
    <tr data-code="${escapeHtml(row.code)}" data-name="${escapeHtml(row.name)}" data-subaccount="${isSubaccount ? "true" : "false"}" data-debit="${journalNumber(row.debit)}" data-credit="${journalNumber(row.credit)}">
      <td class="${accountClass} journal-account-debit-side">${debitAccountCell}</td>
      <td class="${accountClass} journal-account-credit-side">${creditAccountCell}</td>
      <td class="journal-amount">${formatJournalAmount(debit)}</td>
      <td class="journal-amount">${formatJournalAmount(credit)}</td>
    </tr>
  `;
  }).join("");

  return `
    <table class="journal-entry-table ${isBlank ? "is-blank-journal" : ""}" data-journal-entry="true" data-resizable="true" data-date="${escapeHtml(entry.date)}" data-description="${escapeHtml(entry.description)}" data-blank="${isBlank ? "true" : "false"}" style="width:100%; max-width:100%; font-family:'Segoe UI Semibold', 'Segoe UI', -apple-system, sans-serif; font-size:11pt;">
      <colgroup>
        <col class="journal-account-debit-col">
        <col class="journal-account-credit-col">
        <col class="journal-amount-col">
        <col class="journal-amount-col">
      </colgroup>
      <thead>
        <tr>
          <th class="journal-entry-date-cell" colspan="2">${title}</th>
          <th>Borç</th>
          <th>Alacak</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>${descriptionRow}</tfoot>
    </table>
  `;
}

function normalizeJournalEntryTablesHtml(html = "") {
  if (!String(html || "").includes("data-journal-entry")) return html || "";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html || "";
  wrapper.querySelectorAll('table[data-journal-entry="true"]').forEach((table) => {
    table.outerHTML = renderJournalEntryTable(parseJournalEntryTable(table));
  });
  return wrapper.innerHTML;
}

function questionContentHtml(question, mode = "exam", { includeSupplements = true } = {}) {
  const content = normalizeJournalEntryTablesHtml(question.content || "");
  return `${content}${includeSupplements ? renderQuestionSupplements(question, mode) : ""}`;
}

function fillJournalEntryDialog(entry) {
  const dialog = ensureJournalEntryDialog();
  dialog.querySelector("#journalEntryDate").value = entry.date || "";
  dialog.querySelector("#journalEntryDescription").value = entry.description || "";
  dialog.querySelector("#journalEntryBlank").checked = Boolean(entry.isBlank || entry.blank);
  dialog.querySelector("#journalEntryRows").innerHTML = "";
  (entry.rows?.length ? entry.rows : emptyJournalEntryRows()).forEach(addJournalEntryRow);
  updateJournalEntrySummary();
}

function balanceJournalEntryRows() {
  const dialog = ensureJournalEntryDialog();
  const rows = [...dialog.querySelectorAll("[data-journal-row]")];
  const entry = collectJournalEntryForm();
  const totals = journalTotals(journalEffectiveRows(entry.rows));
  const diff = +(totals.debit - totals.credit).toFixed(2);
  if (Math.abs(diff) < 0.005) {
    showToast("Yevmiye maddesi zaten dengede.", "success");
    return;
  }

  const targetClass = diff > 0 ? ".journal-credit-input" : ".journal-debit-input";
  let targetRow = rows.find((row) => !journalNumber(row.querySelector(".journal-debit-input").value) && !journalNumber(row.querySelector(".journal-credit-input").value));
  if (!targetRow) {
    addJournalEntryRow();
    targetRow = [...dialog.querySelectorAll("[data-journal-row]")].at(-1);
  }
  targetRow.querySelector(targetClass).value = Math.abs(diff).toFixed(2);
  updateJournalEntrySummary();
}

function saveJournalEntryFromDialog(event) {
  event.preventDefault();
  syncJournalParentAmounts();
  const entry = collectJournalEntryForm();
  if (!entry.rows.length) {
    showToast("En az bir yevmiye satırı girin.", "warning");
    return;
  }
  if (!entry.isBlank && !entry.rows.some((row) => row.debit || row.credit)) {
    showToast("Borç veya alacak tutarı girin.", "warning");
    return;
  }
  const totals = journalTotals(journalEffectiveRows(entry.rows));
  if (!entry.isBlank && Math.abs(totals.debit - totals.credit) >= 0.005) {
    showToast("Borç ve alacak toplamları eşit değil. Yine de ekleyebilirsiniz; tablo farkı gösterecek.", "warning");
  }

  const html = renderJournalEntryTable(entry);
  if (editingJournalTable?.isConnected) {
    editingJournalTable.outerHTML = html;
    clearResizableSelection();
  } else {
    insertHtmlIntoActiveEditor(`${html}<p><br></p>`);
  }
  editingJournalTable = null;
  ensureJournalEntryDialog().close();
}

function ensureJournalEntryDialog() {
  if (journalEntryDialog) return journalEntryDialog;
  journalEntryDialog = document.createElement("dialog");
  journalEntryDialog.id = "journalEntryDialog";
  journalEntryDialog.className = "journal-entry-dialog";
  journalEntryDialog.innerHTML = `
    <form class="dialog-body journal-entry-form" id="journalEntryForm">
      <div class="journal-entry-heading">
        <div>
          <p class="eyebrow">Muhasebe</p>
          <h2>Yevmiye maddesi</h2>
        </div>
        <button class="course-dialog-close-btn" type="button" data-journal-close aria-label="Kapat">×</button>
      </div>
      <div class="journal-entry-meta">
        <label>
          <span>Tarih / madde no</span>
          <input id="journalEntryDate" type="text" placeholder="Örn. 01.06.2026 / 1" />
        </label>
        <label>
          <span>Açıklama</span>
          <input id="journalEntryDescription" type="text" placeholder="İşlem açıklaması" />
        </label>
      </div>
      <div class="journal-entry-grid-head" aria-hidden="true">
        <span>Hesap kodu</span>
        <span>Hesap adı</span>
        <span>Alt</span>
        <span>Borç</span>
        <span>Alacak</span>
        <span></span>
      </div>
      <div class="journal-entry-rows" id="journalEntryRows"></div>
      <datalist id="journalAccountCodeList">${journalAccountCodeOptionsHtml()}</datalist>
      <div class="journal-entry-tools">
        <button class="secondary-action" id="journalEntryAddRowBtn" type="button">Satır ekle</button>
        <button class="ghost-action" id="journalEntryBalanceBtn" type="button">Farkı dengele</button>
        <label class="journal-blank-toggle" title="Satır sayısı kadar boş yevmiye şablonu ekle">
          <input id="journalEntryBlank" type="checkbox" />
          <span>Boş</span>
        </label>
        <strong id="journalEntrySummary">Borç 0,00 | Alacak 0,00 | Dengede</strong>
      </div>
      <div class="dialog-actions">
        <button class="ghost-action" type="button" data-journal-close>Vazgeç</button>
        <button class="primary-action" id="journalEntryInsertBtn" type="submit">Yevmiyeyi Ekle</button>
      </div>
    </form>
  `;
  document.body.appendChild(journalEntryDialog);
  journalEntryDialog.querySelector("#journalEntryForm").addEventListener("submit", saveJournalEntryFromDialog);
  journalEntryDialog.querySelector("#journalEntryAddRowBtn").addEventListener("click", () => addJournalEntryRow());
  journalEntryDialog.querySelector("#journalEntryBalanceBtn").addEventListener("click", balanceJournalEntryRows);
  journalEntryDialog.querySelectorAll("[data-journal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      editingJournalTable = null;
      journalEntryDialog.close();
    });
  });
  journalEntryDialog.addEventListener("input", (event) => {
    const row = event.target.closest?.("[data-journal-row]");
    if (row && event.target.classList.contains("journal-code-input")) {
      syncJournalAccountNameForRow(row);
    }
    if (row && event.target.classList.contains("journal-name-input")) {
      delete row.dataset.accountNameAuto;
    }
    if (row && event.target.classList.contains("journal-subaccount-input")) {
      syncJournalAccountNameForRow(row);
    }
    if (event.target.closest(".journal-entry-form")) updateJournalEntrySummary();
  });
  journalEntryDialog.addEventListener("change", (event) => {
    const row = event.target.closest?.("[data-journal-row]");
    if (row && event.target.classList.contains("journal-subaccount-input")) {
      syncJournalAccountNameForRow(row);
      updateJournalEntrySummary();
    }
  });
  journalEntryDialog.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".journal-remove-row");
    if (!removeBtn) return;
    const row = removeBtn.closest("[data-journal-row]");
    if (journalEntryDialog.querySelectorAll("[data-journal-row]").length <= 1) {
      row.querySelectorAll("input").forEach((input) => { input.value = ""; });
    } else {
      row.remove();
    }
    updateJournalEntrySummary();
  });
  return journalEntryDialog;
}

function openJournalEntryEditor(table = null) {
  editingJournalTable = table?.dataset?.journalEntry === "true" ? table : null;
  fillJournalEntryDialog(parseJournalEntryTable(editingJournalTable));
  const dialog = ensureJournalEntryDialog();
  if (!dialog.open) dialog.showModal();
  window.setTimeout(() => dialog.querySelector(".journal-code-input")?.focus(), 30);
}

function initJournalEntryTools() {
  document.querySelectorAll(".editor-tools").forEach((toolbar) => {
    if (toolbar.querySelector(".journal-entry-tool-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "journal-entry-tool-btn";
    button.title = "Yevmiye maddesi ekle/düzenle";
    button.textContent = "Yev";
    button.addEventListener("mousedown", (event) => {
      activeToolbar = toolbar;
      activeRichEditor = toolbar.classList.contains("compact-tools") ? els.answerContent : els.questionContent;
      saveEditorSelection();
      event.preventDefault();
    });
    button.addEventListener("click", () => {
      const selectedJournal = selectedResizableElement?.dataset?.journalEntry === "true" ? selectedResizableElement : null;
      openJournalEntryEditor(selectedJournal);
    });
    const tableTool = toolbar.querySelector(".table-picker-wrapper");
    if (tableTool) {
      tableTool.insertAdjacentElement("afterend", button);
    } else {
      toolbar.appendChild(button);
    }
  });

  document.querySelectorAll(".rich-editor").forEach((editor) => {
    editor.addEventListener("dblclick", (event) => {
      const table = event.target.closest('table[data-journal-entry="true"]');
      if (!table || !editor.contains(table)) return;
      activeRichEditor = editor;
      activeToolbar = editor.id === "answerContent"
        ? document.querySelector(".editor-tools.compact-tools")
        : document.querySelector(".editor-tools:not(.compact-tools)");
      event.preventDefault();
      openJournalEntryEditor(table);
    });
  });
}

function insertImage(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    focusActiveEditor();
    document.execCommand("insertHTML", false, `<p><img src="${reader.result}" alt="Soru görseli" data-resizable="true" style="width: 70%; max-width: 100%; height: auto;"></p>`);
  };
  reader.readAsDataURL(file);
}

function ensureTableOverlays() {
  const activeDialog = document.querySelector("dialog[open]");
  const container = activeDialog || document.body;

  if (!tableActionsOverlay) {
    tableActionsOverlay = document.createElement("div");
    tableActionsOverlay.id = "editor-table-actions";
    tableActionsOverlay.className = "table-actions-overlay";
    tableActionsOverlay.innerHTML = `
      <div class="col-actions-group">
        <button type="button" class="action-btn col-delete" title="Sütunu Sil">-</button>
        <button type="button" class="action-btn col-add" title="Sütun Ekle">+</button>
      </div>
      <div class="row-actions-group">
        <button type="button" class="action-btn row-delete" title="Satırı Sil">-</button>
        <button type="button" class="action-btn row-add" title="Satır Ekle">+</button>
      </div>
      <button type="button" class="action-btn table-delete" title="Sil">🗑️</button>
    `;
    tableActionsOverlay.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    tableActionsOverlay.querySelector(".col-add").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickColAdd();
    });
    tableActionsOverlay.querySelector(".col-delete").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickColDelete();
    });
    tableActionsOverlay.querySelector(".row-add").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickRowAdd();
    });
    tableActionsOverlay.querySelector(".row-delete").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickRowDelete();
    });
    tableActionsOverlay.querySelector(".table-delete").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleQuickTableDelete();
    });
  }

  if (!resizeCornerHandle) {
    resizeCornerHandle = document.createElement("div");
    resizeCornerHandle.id = "editor-resize-handle-corner";
    resizeCornerHandle.className = "resize-handle-corner";
    resizeCornerHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleCornerMouseDown(e);
    });
  }

  if (tableActionsOverlay.parentElement !== container) {
    container.appendChild(tableActionsOverlay);
  }
  if (resizeCornerHandle.parentElement !== container) {
    container.appendChild(resizeCornerHandle);
  }
}

function positionTableOverlays(element, cell) {
  if (!tableActionsOverlay) return;
  
  const colActions = tableActionsOverlay.querySelector(".col-actions-group");
  const rowActions = tableActionsOverlay.querySelector(".row-actions-group");
  const tableDelete = tableActionsOverlay.querySelector(".table-delete");
  
  tableActionsOverlay.style.display = "block";
  
  if (element.tagName === "TABLE") {
    colActions.style.display = "flex";
    rowActions.style.display = "flex";
    tableDelete.title = "Tabloyu Sil";
    
    if (cell) {
      const cellRect = cell.getBoundingClientRect();
      const tableRect = element.getBoundingClientRect();
      
      const colLeft = cellRect.left + (cellRect.width / 2) - (colActions.offsetWidth / 2 || 24);
      const colTop = cellRect.top - (colActions.offsetHeight || 24) - 4;
      colActions.style.top = `${colTop}px`;
      colActions.style.left = `${colLeft}px`;
      
      const rowLeft = cellRect.left - (rowActions.offsetWidth || 24) - 4;
      const rowTop = cellRect.top + (cellRect.height / 2) - (rowActions.offsetHeight / 2 || 12);
      rowActions.style.top = `${rowTop}px`;
      rowActions.style.left = `${rowLeft}px`;
      
      const delLeft = tableRect.right - (tableDelete.offsetWidth || 20) - 2;
      const delTop = tableRect.top - (tableDelete.offsetHeight || 20) - 4;
      tableDelete.style.top = `${delTop}px`;
      tableDelete.style.left = `${delLeft}px`;
    }
  } else if (element.tagName === "IMG") {
    colActions.style.display = "none";
    rowActions.style.display = "none";
    tableDelete.title = "Görseli Sil";
    
    const imgRect = element.getBoundingClientRect();
    const delLeft = imgRect.right - (tableDelete.offsetWidth || 20) - 2;
    const delTop = imgRect.top - (tableDelete.offsetHeight || 20) - 4;
    tableDelete.style.top = `${delTop}px`;
    tableDelete.style.left = `${delLeft}px`;
  }
}

function positionCornerHandle() {
  if (!selectedResizableElement || !resizeCornerHandle) return;
  const rect = selectedResizableElement.getBoundingClientRect();
  
  resizeCornerHandle.style.display = "block";
  resizeCornerHandle.style.top = `${rect.bottom - 5}px`;
  resizeCornerHandle.style.left = `${rect.right - 5}px`;
}

function getTableDragTarget(table, clientX, clientY) {
  const tableRect = table.getBoundingClientRect();
  
  const isNearCornerX = Math.abs(clientX - tableRect.right) <= 8;
  const isNearCornerY = Math.abs(clientY - tableRect.bottom) <= 8;
  if (isNearCornerX && isNearCornerY) {
    return { type: 'table-corner', table, element: table };
  }

  const elements = document.elementsFromPoint(clientX, clientY);
  const cell = elements.find(el => el.tagName === 'TD' || el.tagName === 'TH');
  if (!cell || !table.contains(cell)) return null;

  const rect = cell.getBoundingClientRect();
  const rowIndex = cell.parentNode.rowIndex;
  const colIndex = cell.cellIndex;
  const threshold = 6;

  if (Math.abs(clientX - rect.right) <= threshold) {
    return { type: 'col-resize', table, colIndex, startSize: rect.width };
  }
  if (Math.abs(clientX - rect.left) <= threshold && colIndex > 0) {
    const prevCell = cell.parentNode.cells[colIndex - 1];
    return { type: 'col-resize', table, colIndex: colIndex - 1, startSize: prevCell ? prevCell.getBoundingClientRect().width : rect.width };
  }
  if (Math.abs(clientY - rect.bottom) <= threshold) {
    return { type: 'row-resize', table, rowIndex, startSize: rect.height };
  }
  if (Math.abs(clientY - rect.top) <= threshold && rowIndex > 0) {
    const prevRow = table.rows[rowIndex - 1];
    return { type: 'row-resize', table, rowIndex: rowIndex - 1, startSize: prevRow ? prevRow.getBoundingClientRect().height : rect.height };
  }

  return null;
}

function handleCornerMouseDown(e) {
  if (!selectedResizableElement) return;
  
  dragInfo = {
    type: 'table-corner',
    element: selectedResizableElement,
    startX: e.clientX,
    startY: e.clientY,
    startWidth: selectedResizableElement.getBoundingClientRect().width,
    startHeight: selectedResizableElement.getBoundingClientRect().height
  };
  
  document.addEventListener("mousemove", handleGlobalMouseMove);
  document.addEventListener("mouseup", handleGlobalMouseUp);
}

function handleGlobalMouseMove(e) {
  if (!dragInfo) return;
  
  e.preventDefault();
  
  if (dragInfo.type === 'col-resize') {
    const deltaX = e.clientX - dragInfo.startX;
    const newWidth = Math.max(20, dragInfo.startSize + deltaX);
    const table = dragInfo.table;
    const colIndex = dragInfo.colIndex;
    
    Array.from(table.rows).forEach(row => {
      const cell = row.cells[colIndex];
      if (cell) {
        cell.style.width = `${newWidth}px`;
      }
    });
    
    if (activeHoveredCell) positionTableOverlays(table, activeHoveredCell);
    positionCornerHandle();
  }
  
  else if (dragInfo.type === 'row-resize') {
    const deltaY = e.clientY - dragInfo.startY;
    const newHeight = Math.max(15, dragInfo.startSize + deltaY);
    const table = dragInfo.table;
    const rowIndex = dragInfo.rowIndex;
    
    const row = table.rows[rowIndex];
    if (row) {
      row.style.height = `${newHeight}px`;
    }
    
    if (activeHoveredCell) positionTableOverlays(table, activeHoveredCell);
    positionCornerHandle();
  }
  
  else if (dragInfo.type === 'table-corner') {
    const deltaX = e.clientX - dragInfo.startX;
    const deltaY = e.clientY - dragInfo.startY;
    const newWidthPx = Math.max(20, dragInfo.startWidth + deltaX);
    const newHeightPx = Math.max(20, dragInfo.startHeight + deltaY);
    const element = dragInfo.element;
    const editor = element.closest('.rich-editor');
    
    if (editor) {
      const editorWidth = editor.getBoundingClientRect().width || 1;
      const widthPercent = Math.max(10, Math.min(100, Math.round((newWidthPx / editorWidth) * 100)));
      element.style.width = `${widthPercent}%`;
      element.style.maxWidth = "100%";
      
      const rangeInput = document.getElementById("resizeRange");
      if (rangeInput) rangeInput.value = widthPercent;
    }
    
    element.style.height = `${newHeightPx}px`;
    
    positionCornerHandle();
    if (element.tagName === "TABLE" && activeHoveredCell) {
      positionTableOverlays(element, activeHoveredCell);
    } else if (element.tagName === "IMG") {
      positionTableOverlays(element, null);
    }
  }
}

function handleGlobalMouseUp(e) {
  if (dragInfo) {
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    document.removeEventListener("mouseup", handleGlobalMouseUp);
    
    saveEditorSelection();
    dragInfo = null;
  }
}

function handleQuickColAdd() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const colIndex = activeHoveredCell.cellIndex;
  
  Array.from(table.rows).forEach(row => {
    const isHeader = row.parentNode.tagName === "THEAD" || row.rowIndex === 0;
    const cell = document.createElement(isHeader ? "th" : "td");
    cell.innerHTML = "Veri";
    const refCell = row.cells[colIndex];
    if (refCell) {
      cell.style.width = refCell.style.width;
      refCell.parentNode.insertBefore(cell, refCell.nextSibling);
    } else {
      row.appendChild(cell);
    }
  });
  
  if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
  saveEditorSelection();
}

function handleQuickColDelete() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const colIndex = activeHoveredCell.cellIndex;
  
  Array.from(table.rows).forEach(row => {
    if (row.cells[colIndex]) {
      row.deleteCell(colIndex);
    }
  });
  
  const numCols = table.rows[0]?.cells.length || 0;
  if (numCols === 0) {
    table.remove();
    clearResizableSelection();
  } else {
    if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
    saveEditorSelection();
  }
}

function handleQuickRowAdd() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const rowIndex = activeHoveredCell.parentNode.rowIndex;
  
  const newRow = table.insertRow(rowIndex + 1);
  const numCols = table.rows[0]?.cells.length || 1;
  for (let i = 0; i < numCols; i++) {
    const cell = newRow.insertCell(i);
    cell.innerHTML = "Veri";
    const refCell = table.rows[0]?.cells[i];
    if (refCell && refCell.style.width) {
      cell.style.width = refCell.style.width;
    }
  }
  
  if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
  saveEditorSelection();
}

function handleQuickRowDelete() {
  if (!activeHoveredTable || !activeHoveredCell) return;
  const table = activeHoveredTable;
  const rowIndex = activeHoveredCell.parentNode.rowIndex;
  
  if (rowIndex >= 0 && table.rows[rowIndex]) {
    table.deleteRow(rowIndex);
  }
  
  if (table.rows.length === 0) {
    table.remove();
    clearResizableSelection();
  } else {
    if (tableActionsOverlay) tableActionsOverlay.style.display = "none";
    saveEditorSelection();
  }
}

function handleQuickTableDelete() {
  if (!activeHoveredTable) return;
  activeHoveredTable.remove();
  clearResizableSelection();
}

function selectResizableElement(element) {
  clearResizableSelection(false);
  selectedResizableElement = element;
  selectedResizableElement.classList.add("is-selected-media");
  selectedResizableElement.dataset.resizable = "true";
  
  ensureTableOverlays();

  if (resizePanel) {
    resizePanel.hidden = true;
  }
  positionCornerHandle();
}

function clearResizableSelection(hidePanel = true) {
  if (overlayHideTimeout) {
    clearTimeout(overlayHideTimeout);
    overlayHideTimeout = null;
  }
  if (selectedResizableElement) {
    selectedResizableElement.classList.remove("is-selected-media");
    if (selectedResizableElement.tagName === "TABLE") {
      selectedResizableElement.querySelectorAll("td, th").forEach(c => c.classList.remove("is-selected-cell"));
      delete selectedResizableElement.dataset.selectedCellRowIndex;
      delete selectedResizableElement.dataset.selectedCellColIndex;
    }
  }
  selectedResizableElement = null;
  activeHoveredTable = null;
  activeHoveredCell = null;
  
  if (hidePanel) {
    if (resizePanel) {
      resizePanel.hidden = true;
    }
    if (resizeCornerHandle) {
      resizeCornerHandle.style.display = "none";
    }
    if (tableActionsOverlay) {
      tableActionsOverlay.style.display = "none";
    }
  }
}

function positionResizePanel() {
  if (!selectedResizableElement || !resizePanel || resizePanel.hidden) return;
  const rect = selectedResizableElement.getBoundingClientRect();
  const panelRect = resizePanel.getBoundingClientRect();
  const top = Math.min(window.innerHeight - panelRect.height - 12, rect.bottom + 8);
  const left = Math.min(window.innerWidth - panelRect.width - 12, Math.max(12, rect.left));
  resizePanel.style.top = `${Math.max(12, top)}px`;
  resizePanel.style.left = `${left}px`;
}

function handleEditorMediaClick(event) {
  const media = event.target.closest("img, table");
  if (!media || !event.currentTarget.contains(media)) {
    clearResizableSelection();
    return;
  }
  
  if (media.tagName === "TABLE") {
    media.querySelectorAll("td, th").forEach(c => c.classList.remove("is-selected-cell"));
    const cell = event.target.closest("td, th");
    if (cell) {
      media.dataset.selectedCellRowIndex = cell.parentNode.rowIndex;
      media.dataset.selectedCellColIndex = cell.cellIndex;
      cell.classList.add("is-selected-cell");
      
      ensureTableOverlays();
      positionTableOverlays(media, cell);
    }
  } else if (media.tagName === "IMG") {
    event.preventDefault();
    ensureTableOverlays();
    positionTableOverlays(media, null);
  }
  selectResizableElement(media);
}

function focusActiveEditor() {
  activeRichEditor = activeRichEditor || els.questionContent;
  activeRichEditor.focus();
  const selection = window.getSelection();
  if (savedSelectionRange && !savedSelectionRange.collapsed && activeRichEditor.contains(savedSelectionRange.commonAncestorContainer)) {
    selection.removeAllRanges();
    selection.addRange(savedSelectionRange);
    return;
  }
  const currentRange = selection.rangeCount ? selection.getRangeAt(0) : null;
  if (currentRange && activeRichEditor.contains(currentRange.commonAncestorContainer)) {
    return;
  }

  selection.removeAllRanges();
  if (savedSelectionRange && activeRichEditor.contains(savedSelectionRange.commonAncestorContainer)) {
    selection.addRange(savedSelectionRange);
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(activeRichEditor);
  range.collapse(false);
  selection.addRange(range);
  savedSelectionRange = range.cloneRange();
}

function insertHtmlIntoActiveEditor(html) {
  activeRichEditor = activeRichEditor || els.questionContent;
  activeRichEditor.focus();
  const selection = window.getSelection();
  let range = savedSelectionRange;

  if (!range || !activeRichEditor.contains(range.commonAncestorContainer)) {
    range = document.createRange();
    range.selectNodeContents(activeRichEditor);
    range.collapse(false);
  }

  selection.removeAllRanges();
  selection.addRange(range);
  range.deleteContents();

  const fragment = range.createContextualFragment(html);
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    const nextRange = document.createRange();
    nextRange.setStartAfter(lastNode);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedSelectionRange = nextRange.cloneRange();
  } else {
    savedSelectionRange = range.cloneRange();
  }
  saveEditorSelection();
}

function commandActiveAtSelection(command, editor, range) {
  if (command === "bold") {
    const node = range.commonAncestorContainer;
    return nodeHasBoldContextWithin(node, editor);
  }
  try {
    return document.queryCommandState(command);
  } catch (_) {
    return false;
  }
}

function inlineFormattingElementForCommand(command) {
  if (command === "bold") return document.createElement("strong");
  if (command === "italic") return document.createElement("em");
  if (command === "underline") return document.createElement("u");
  if (command === "strikeThrough") return document.createElement("s");
  return null;
}

function prepareCollapsedInlineFormatting(command) {
  const selection = window.getSelection();
  if (!activeRichEditor || !selection.rangeCount || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!activeRichEditor.contains(range.commonAncestorContainer)) return false;

  if (commandActiveAtSelection(command, activeRichEditor, range)) {
    document.execCommand(command, false, null);
    saveEditorSelection();
    return true;
  }

  const element = inlineFormattingElementForCommand(command);
  if (!element) return false;

  const marker = document.createTextNode("\u200b");
  element.appendChild(marker);
  range.insertNode(element);

  const nextRange = document.createRange();
  nextRange.setStart(marker, 1);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedSelectionRange = nextRange.cloneRange();
  return true;
}

function stripBoldFormattingFromFragment(fragment) {
  fragment.querySelectorAll?.("b, strong").forEach(unwrapEditorElement);
  fragment.querySelectorAll?.("*").forEach((element) => {
    if (element.style) element.style.fontWeight = "";
  });
}

function selectionFragmentIsFullyBold(fragment) {
  const nodes = meaningfulEditorNodes(fragment);
  return nodes.length > 0 && nodes.every((node) => nodeHasBoldContextWithin(node, fragment));
}

function selectedRangeNodes(range, editor) {
  const nodes = [];
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue.replace(/\u200b/g, "").trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
      if (["IMG", "TABLE"].includes(node.tagName)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    }
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

function selectedRangeIsFullyBold(range, editor) {
  const nodes = selectedRangeNodes(range, editor);
  return nodes.length > 0 && nodes.every((node) => nodeHasBoldContextWithin(node, editor));
}

function replaceSelectionWithFragment(range, fragment) {
  const selection = window.getSelection();
  const firstNode = fragment.firstChild;
  const lastNode = fragment.lastChild;
  range.deleteContents();
  range.insertNode(fragment);

  const nextRange = document.createRange();
  if (firstNode && lastNode && firstNode.parentNode && lastNode.parentNode) {
    nextRange.setStartBefore(firstNode);
    nextRange.setEndAfter(lastNode);
  } else {
    nextRange.selectNodeContents(activeRichEditor);
    nextRange.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedSelectionRange = nextRange.cloneRange();
}

function toggleBoldForSelectedRange() {
  const selection = window.getSelection();
  if (!activeRichEditor || !selection.rangeCount || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!activeRichEditor.contains(range.commonAncestorContainer)) return false;

  const fragment = range.cloneContents();
  if (selectedRangeIsFullyBold(range, activeRichEditor) || selectionFragmentIsFullyBold(fragment)) {
    stripBoldFormattingFromFragment(fragment);
    const normalSpan = document.createElement("span");
    normalSpan.style.fontWeight = "normal";
    normalSpan.appendChild(fragment);
    const normalFragment = document.createDocumentFragment();
    normalFragment.appendChild(normalSpan);
    replaceSelectionWithFragment(range, normalFragment);
    return true;
  }

  const strong = document.createElement("strong");
  strong.appendChild(fragment);
  const wrapperFragment = document.createDocumentFragment();
  wrapperFragment.appendChild(strong);
  replaceSelectionWithFragment(range, wrapperFragment);
  return true;
}

function runEditorCommand(command, value = null) {
  focusActiveEditor();
  if (command === "removeFormat") {
    removeEditorFormattingToDefault();
    return;
  }
  if (command === "bold" && toggleBoldForSelectedRange()) {
    return;
  }
  if (["bold", "italic", "underline", "strikeThrough"].includes(command) && prepareCollapsedInlineFormatting(command)) {
    return;
  }
  document.execCommand(command, false, value);
  saveEditorSelection();
}

function clearDefaultEditorFontStyles(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
  if (element.style) {
    element.style.fontFamily = "";
    element.style.fontSize = "";
    element.style.lineHeight = "";
    element.style.color = "";
    element.style.backgroundColor = "";
    element.style.fontWeight = "";
    element.style.fontStyle = "";
    element.style.textDecoration = "";
  }
  if (element.tagName === "FONT") {
    element.removeAttribute("face");
    element.removeAttribute("size");
    element.removeAttribute("color");
  }
}

function unwrapEditorElement(element) {
  const parent = element?.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  element.remove();
}

function isEditorBoldElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  if (element.tagName === "B" || element.tagName === "STRONG") return true;
  return isBoldFontWeightValue(element.style?.fontWeight);
}

function isBoldFontWeightValue(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "bold" || normalized === "bolder") return true;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 600;
}

function isEditorInlineFormattingElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  if (!EDITOR_INLINE_FORMAT_TAGS.has(element.tagName)) return false;
  if (["IMG", "TABLE", "TR", "TD", "TH"].includes(element.tagName)) return false;
  return true;
}

function meaningfulEditorNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue.replace(/\u200b/g, "").trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
      if (node !== root && ["IMG", "TABLE"].includes(node.tagName)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    }
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

function nodeHasBoldContextWithin(node, root) {
  let current = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  while (current) {
    if (isEditorBoldElement(current)) return true;
    if (current === root) break;
    current = current.parentElement;
  }
  return false;
}

function blockContentIsFullyBold(block) {
  if (!block) return false;
  const nodes = meaningfulEditorNodes(block);
  return nodes.length > 0 && nodes.every((node) => nodeHasBoldContextWithin(node, block));
}

function blockEndsWithBoldFormatting(block) {
  if (!block) return false;
  if (blockNeedsNormalWeightWrapper(block)) return true;
  const nodes = meaningfulEditorNodes(block);
  const lastNode = nodes[nodes.length - 1];
  return Boolean(lastNode && nodeHasBoldContextWithin(lastNode, block));
}

function stripBoldFormattingFromBlock(block) {
  if (!block) return;
  const boldElements = Array.from(block.querySelectorAll("b, strong"));
  boldElements.forEach(unwrapEditorElement);
  [block, ...Array.from(block.querySelectorAll("*"))].forEach((element) => {
    if (element.style) element.style.fontWeight = "";
  });
}

function blockNeedsNormalWeightWrapper(block) {
  if (!block) return false;
  if (isEditorBoldElement(block)) return true;
  try {
    return isBoldFontWeightValue(window.getComputedStyle(block).fontWeight);
  } catch (_) {
    return false;
  }
}

function cleanEditorFormattingFragment(fragment) {
  if (!fragment) return;
  const elements = [
    ...(fragment.nodeType === Node.ELEMENT_NODE ? [fragment] : []),
    ...Array.from(fragment.querySelectorAll?.("*") || [])
  ];
  elements.forEach((element) => {
    const structural = ["TABLE", "THEAD", "TBODY", "TR", "TD", "TH", "IMG"].includes(element.tagName);
    clearDefaultEditorFontStyles(element);
    if (!structural) {
      element.removeAttribute("class");
    }
    if (isEditorInlineFormattingElement(element)) {
      unwrapEditorElement(element);
    }
  });
}

function resetEditorCommandStateToDefault() {
  ["bold", "italic", "underline", "strikeThrough"].forEach((command) => {
    try {
      if (document.queryCommandState(command)) {
        document.execCommand(command, false, null);
      }
    } catch (_) {}
  });
}

function restoreCaretAtNodePosition(marker) {
  const parent = marker.parentNode;
  if (!parent) return;
  const offset = Array.prototype.indexOf.call(parent.childNodes, marker);
  marker.remove();
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(parent, Math.max(0, offset));
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  savedSelectionRange = range.cloneRange();
}

function splitFormattingAncestorsAtCaret(editor, { unwrapTrailing = false } = {}) {
  if (!editor) return;
  const selection = window.getSelection();
  if (!selection.rangeCount || !selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const marker = document.createTextNode("");
  range.insertNode(marker);
  let anchor = marker;
  let parent = anchor.parentElement;

  while (parent && parent !== editor) {
    if (!isEditorInlineFormattingElement(parent)) {
      parent = parent.parentElement;
      continue;
    }

    const grandParent = parent.parentNode;
    const trailingNodes = [];
    while (anchor.nextSibling) {
      trailingNodes.push(anchor.nextSibling);
    }

    grandParent.insertBefore(anchor, parent.nextSibling);
    if (trailingNodes.length) {
      if (unwrapTrailing) {
        trailingNodes.forEach((node) => grandParent.insertBefore(node, anchor.nextSibling));
      } else {
        const trailingWrapper = parent.cloneNode(false);
        clearDefaultEditorFontStyles(trailingWrapper);
        trailingNodes.forEach((node) => trailingWrapper.appendChild(node));
        grandParent.insertBefore(trailingWrapper, anchor.nextSibling);
      }
    }

    if (!parent.childNodes.length) parent.remove();
    parent = anchor.parentElement;
  }

  restoreCaretAtNodePosition(anchor);
}

function removeFormattingFromSelectedRange(editor, range) {
  const selection = window.getSelection();
  const fragment = range.extractContents();
  cleanEditorFormattingFragment(fragment);

  const firstNode = fragment.firstChild;
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  const nextRange = document.createRange();
  if (firstNode && lastNode && firstNode.parentNode && lastNode.parentNode) {
    nextRange.setStartBefore(firstNode);
    nextRange.setEndAfter(lastNode);
  } else {
    nextRange.selectNodeContents(editor);
    nextRange.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedSelectionRange = nextRange.cloneRange();
  try {
    document.execCommand("removeFormat", false, null);
    if (selection.rangeCount) {
      normalizeFormattingRangeToDefault(editor, selection.getRangeAt(0));
    }
  } catch (_) {}
}

function normalizeFormattingRangeToDefault(editor, range) {
  if (!editor || !range) return;
  const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  const scope = common && editor.contains(common) ? common : editor;
  if (scope !== editor) {
    clearDefaultEditorFontStyles(scope);
  }
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  let node = walker.currentNode;
  while (node) {
    clearDefaultEditorFontStyles(node);
    node = walker.nextNode();
  }
  editor.querySelectorAll("span:empty, font:empty").forEach((node) => node.remove());
}

function normalizeFormattingAtCaretToDefault(editor, range) {
  if (!editor || !range) return;
  let node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  while (node && node !== editor) {
    clearDefaultEditorFontStyles(node);
    node = node.parentElement;
  }
}

function removeEditorFormattingToDefault() {
  focusActiveEditor();
  if (!activeRichEditor) return;
  const selection = window.getSelection();
  const range = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  try {
    if (range && !range.collapsed) {
      removeFormattingFromSelectedRange(activeRichEditor, range);
    } else {
      document.execCommand("removeFormat", false, null);
      resetEditorCommandStateToDefault();
      normalizeFormattingAtCaretToDefault(activeRichEditor, range);
      if (range) {
        const block = nearestEditorBlock(range.commonAncestorContainer, activeRichEditor);
        if (block && block !== activeRichEditor) {
          cleanEditorFormattingFragment(block);
        }
      }
      splitFormattingAncestorsAtCaret(activeRichEditor);
    }
  } catch (_) {
    document.execCommand("removeFormat", false, null);
    activeRichEditor.querySelectorAll('[style*="font-family"], [style*="font-size"], [style*="font-weight"], font').forEach(clearDefaultEditorFontStyles);
  }
  activeRichEditor.style.fontFamily = "";
  activeRichEditor.style.fontSize = "";
  activeRichEditor.normalize();
  syncActiveToolbarDefaultFontSize();
  saveEditorSelection();
}

function nearestEditorBlock(node, editor) {
  let current = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  while (current && current !== editor) {
    if (EDITOR_BLOCK_BOUNDARY_TAGS.has(current.tagName)) return current;
    current = current.parentElement;
  }
  return editor;
}

function normalizedRangeText(range) {
  return range.toString().replace(/\u200b/g, "").trim();
}

function isEditorSelectionAtBlockBoundary(editor, inputType) {
  const selection = window.getSelection();
  if (!editor || !selection.rangeCount || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;
  const block = nearestEditorBlock(range.commonAncestorContainer, editor);
  if (!block || block === editor) return false;

  const probe = document.createRange();
  probe.selectNodeContents(block);
  if (inputType === "deleteContentBackward") {
    probe.setEnd(range.startContainer, range.startOffset);
  } else if (inputType === "deleteContentForward") {
    probe.setStart(range.startContainer, range.startOffset);
  } else {
    return false;
  }
  return normalizedRangeText(probe) === "";
}

function editorBlockPeer(block, direction) {
  if (!block || ["TD", "TH"].includes(block.tagName)) return null;
  const peer = direction === "backward" ? block.previousElementSibling : block.nextElementSibling;
  if (!peer || !EDITOR_BLOCK_BOUNDARY_TAGS.has(peer.tagName) || ["TD", "TH"].includes(peer.tagName)) return null;
  return peer;
}

function moveBlockChildrenAtBoundary(sourceBlock, targetBlock, direction) {
  const marker = document.createTextNode("");
  const shouldStripMovedBold = blockContentIsFullyBold(sourceBlock) && blockEndsWithBoldFormatting(targetBlock);
  const shouldWrapMovedContent = blockNeedsNormalWeightWrapper(targetBlock);
  if (shouldStripMovedBold) {
    stripBoldFormattingFromBlock(sourceBlock);
  }
  targetBlock.appendChild(marker);
  const movedContainer = shouldWrapMovedContent ? document.createElement("span") : targetBlock;
  if (shouldWrapMovedContent) {
    movedContainer.style.fontWeight = "normal";
  }
  while (sourceBlock.firstChild) {
    movedContainer.appendChild(sourceBlock.firstChild);
  }
  if (shouldWrapMovedContent && movedContainer.childNodes.length) {
    targetBlock.appendChild(movedContainer);
  }
  sourceBlock.remove();
  restoreCaretAtNodePosition(marker);
}

function mergeEditorBlockAtBoundary(editor, direction) {
  if (!editor) return false;
  const inputType = direction === "backward" ? "deleteContentBackward" : "deleteContentForward";
  if (!isEditorSelectionAtBlockBoundary(editor, inputType)) return false;
  const selection = window.getSelection();
  if (!selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  const block = nearestEditorBlock(range.commonAncestorContainer, editor);
  if (!block || block === editor) return false;
  const peer = editorBlockPeer(block, direction);
  if (!peer || !editor.contains(peer)) return false;

  activeRichEditor = editor;
  if (direction === "backward") {
    moveBlockChildrenAtBoundary(block, peer, "backward");
  } else {
    moveBlockChildrenAtBoundary(peer, block, "forward");
  }
  resetEditorCommandStateToDefault();
  editor.normalize();
  saveEditorSelection();
  return true;
}

function normalizeLineMergeFormattingToDefault(editor) {
  if (!editor) return;
  activeRichEditor = editor;
  splitFormattingAncestorsAtCaret(editor, { unwrapTrailing: true });
  resetEditorCommandStateToDefault();
  editor.normalize();
  saveEditorSelection();
}

function syncActiveToolbarDefaultFontSize() {
  if (!activeToolbar) return;
  const sizeSelect = activeToolbar.querySelector(".font-size-select");
  if (!sizeSelect) return;
  isProgrammaticChange = true;
  sizeSelect.value = EDITOR_DEFAULT_FONT_SIZE;
  sizeSelect._lastProgrammaticValue = EDITOR_DEFAULT_FONT_SIZE;
  isProgrammaticChange = false;
}

function setFontSizeOfSelection(sizeValue) {
  focusActiveEditor();
  const sizeWithUnit = sizeValue + "pt";
  const selection = window.getSelection();
  if (!selection.rangeCount || !activeRichEditor) return;
  const range = selection.getRangeAt(0);

  if (selection.isCollapsed) {
    let parentSpan = range.commonAncestorContainer;
    if (parentSpan.nodeType === Node.TEXT_NODE) {
      parentSpan = parentSpan.parentNode;
    }
    if (parentSpan && parentSpan.nodeName === "SPAN" && parentSpan.style.fontSize === sizeWithUnit) {
      return;
    }
    
    const span = document.createElement("span");
    span.style.fontSize = sizeWithUnit;
    span.innerHTML = "&#8203;"; // Zero-width space
    range.insertNode(span);
    
    const newRange = document.createRange();
    newRange.setStart(span.firstChild, 1);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    savedSelectionRange = newRange.cloneRange();
  } else {
    document.execCommand("fontSize", false, "7");
    const fonts = activeRichEditor.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = sizeWithUnit;
      while (font.firstChild) {
        span.appendChild(font.firstChild);
      }
      font.parentNode.replaceChild(span, font);
    });
    saveEditorSelection();
  }
}

function setListStyle(styleType, isOrdered) {
  focusActiveEditor();
  const cmd = isOrdered ? "insertOrderedList" : "insertUnorderedList";
  document.execCommand(cmd, false, null);
  
  const selection = window.getSelection();
  if (!selection.rangeCount || !activeRichEditor) return;
  let node = selection.getRangeAt(0).commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  
  const tag = isOrdered ? "OL" : "UL";
  while (node && node !== activeRichEditor) {
    if (node.nodeName === tag) {
      node.style.listStyleType = styleType;
      break;
    }
    node = node.parentNode;
  }
  saveEditorSelection();
}

function updateToolbarStates() {
  if (!activeRichEditor) return;
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  let node = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  
  let fontSize = "";
  while (node && node !== activeRichEditor) {
    if (node.style && node.style.fontSize) {
      fontSize = node.style.fontSize;
      break;
    }
    node = node.parentNode;
  }
  
  let numericSize = "";
  if (fontSize) {
    const match = fontSize.match(/^(\d+(?:\.\d+)?)(pt|px)$/);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2];
      if (unit === "pt") {
        numericSize = String(Math.round(val));
      } else if (unit === "px") {
        numericSize = String(Math.round(val * 0.75));
      }
    }
  }
  
  if (activeToolbar) {
    const sizeSelect = activeToolbar.querySelector(".font-size-select");
    if (sizeSelect) {
      isProgrammaticChange = true;
      const valToSet = (numericSize && Array.from(sizeSelect.options).some(opt => opt.value === numericSize)) ? numericSize : EDITOR_DEFAULT_FONT_SIZE;
      sizeSelect.value = valToSet;
      sizeSelect._lastProgrammaticValue = valToSet;
      isProgrammaticChange = false;
    }
  }
}

function saveEditorSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount || !activeRichEditor) return;
  const range = selection.getRangeAt(0);
  if (activeRichEditor.contains(range.commonAncestorContainer)) {
    savedSelectionRange = range.cloneRange();
    updateToolbarStates();
  }
}

