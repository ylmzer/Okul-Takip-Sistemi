(function () {
  const state = {
    initialized: false,
    isVerified: false,
    adminPassword: "",
    activeTab: "overview",
    overview: null,
    users: [],
    creditCodes: [],
    publicConfig: null,
    searchQuery: "",
    statusFilter: "all",
    roleFilter: "all",
    editingUserKey: null,
    els: {}
  };

  const MODULE_METAS = [
    { id: "sorubank", name: "Soru Bankası", icon: "SB", desc: "Soru, sınav ve analiz modülü" },
    { id: "student-tracking", name: "Ders Takibi", icon: "DT", desc: "Sınıf ve öğrenci izleme modülü" },
    { id: "skill-training", name: "Beceri Eğitimi", icon: "BE", desc: "İşletme ve evrak takibi modülü" },
    { id: "course-tracking", name: "Kurs Takibi", icon: "KT", desc: "Devam ve not yönetimi modülü" },
    { id: "annual-plan", name: "Yıllık Plan", icon: "YP", desc: "Alan, ders ve plan üretim modülü" }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function getAdminPassword() {
    return state.adminPassword || sessionStorage.getItem("ots:admin-token-pass") || "";
  }

  function setAdminPassword(password) {
    state.adminPassword = password;
    if (password) {
      sessionStorage.setItem("ots:admin-token-pass", password);
      state.isVerified = true;
    } else {
      sessionStorage.removeItem("ots:admin-token-pass");
      state.isVerified = false;
    }
    if (window.syncSystemPermissions) window.syncSystemPermissions();
  }

  function collectElements() {
    return {
      shell: byId("systemAdminShell"),
      tabs: document.querySelectorAll("[data-admin-tab]"),
      panels: document.querySelectorAll("[data-admin-panel]"),
      mobileSelect: byId("adminMobileSelect"),
      tabTitle: byId("adminCurrentTabTitle"),
      logoutBtn: byId("adminLogoutSessionBtn"),
      moduleSwitchBtn: byId("adminModuleSwitchBtn"),
      quickAddUserBtn: byId("adminQuickAddUserBtn"),
      topMaintenanceBadge: byId("adminMaintenanceBadge"),

      // Overview
      statTotalUsers: byId("adminStatTotalUsers"),
      statActiveUsers: byId("adminStatActiveUsers"),
      statSuspendedUsers: byId("adminStatSuspendedUsers"),
      statTotalCredits: byId("adminStatTotalCredits"),
      statActiveCoupons: byId("adminStatActiveCoupons"),
      statSystemStatus: byId("adminStatSystemStatus"),
      quickMaintenanceToggle: byId("adminQuickMaintenanceToggle"),
      quickMaintenanceMsg: byId("adminQuickMaintenanceMsg"),
      saveMaintenanceBtn: byId("adminSaveMaintenanceBtn"),
      announcementActiveToggle: byId("adminAnnouncementActiveToggle"),
      announcementMsgInput: byId("adminAnnouncementMsgInput"),
      announcementTypeSelect: byId("adminAnnouncementTypeSelect"),
      saveAnnouncementBtn: byId("adminSaveAnnouncementBtn"),
      auditLogsContainer: byId("adminAuditLogsContainer"),

      // Users
      usersTableBody: byId("adminUsersTableBody"),
      userSearchInput: byId("adminUserSearchInput"),
      userStatusFilter: byId("adminUserStatusFilter"),
      userRoleFilter: byId("adminUserRoleFilter"),
      addUserBtn: byId("adminAddUserBtn"),
      userModal: byId("adminUserModal"),
      userModalForm: byId("adminUserModalForm"),
      userModalTitle: byId("adminUserModalTitle"),
      userModalName: byId("adminUserModalName"),
      userModalEmail: byId("adminUserModalEmail"),
      userModalPassword: byId("adminUserModalPassword"),
      userModalRole: byId("adminUserModalRole"),
      userModalIsActive: byId("adminUserModalIsActive"),
      userModalCredits: byId("adminUserModalCredits"),
      userModalNotes: byId("adminUserModalNotes"),
      userModalModuleChecks: document.querySelectorAll(".admin-user-module-check"),
      userModalCloseBtn: byId("adminUserModalCloseBtn"),

      // Credit modal
      creditModal: byId("adminCreditModal"),
      creditModalForm: byId("adminCreditModalForm"),
      creditModalUserLabel: byId("adminCreditModalUserLabel"),
      creditModalCurrent: byId("adminCreditModalCurrent"),
      creditModalAmount: byId("adminCreditModalAmount"),
      creditModalType: byId("adminCreditModalType"),
      creditModalNote: byId("adminCreditModalNote"),
      creditModalCloseBtn: byId("adminCreditModalCloseBtn"),

      // Module control
      moduleControlGrid: byId("adminModuleControlGrid"),

      // Credits & coupons
      couponsTableBody: byId("adminCouponsTableBody"),
      createCouponForm: byId("adminCreateCouponForm"),
      newCouponCode: byId("adminNewCouponCode"),
      newCouponCredits: byId("adminNewCouponCredits"),
      newCouponMaxUses: byId("adminNewCouponMaxUses"),
      newCouponNote: byId("adminNewCouponNote"),
      generateRandomCodeBtn: byId("adminGenerateRandomCodeBtn"),

      // Security
      changePasswordForm: byId("adminChangePasswordForm"),
      currentPasswordInput: byId("adminCurrentPasswordInput"),
      newPasswordInput: byId("adminNewPasswordInput"),
      newPasswordConfirmInput: byId("adminNewPasswordConfirmInput"),
      defaultCreditsInput: byId("adminDefaultCreditsInput"),
      saveDefaultsBtn: byId("adminSaveDefaultsBtn"),
      defaultModuleChecks: document.querySelectorAll(".admin-default-module-check"),

      // Auth Challenge Modal
      authModal: byId("adminAuthModal"),
      authModalForm: byId("adminAuthModalForm"),
      authModalPasswordInput: byId("adminAuthModalPasswordInput"),
      authModalError: byId("adminAuthModalError"),
      authModalCancelBtn: byId("adminAuthModalCancelBtn")
    };
  }

  function setPanel(panel = "overview") {
    state.activeTab = panel;
    const tabLabels = {
      overview: "Genel Bakış",
      users: "Kullanıcılar & Yetki Yönetimi",
      modules: "Program & Modül Kontrolü",
      credits: "Kredi & Kupon Yönetimi",
      security: "Güvenlik & Sistem Ayarları"
    };

    if (state.els.tabTitle) {
      state.els.tabTitle.textContent = tabLabels[panel] || "Yönetim Paneli";
    }

    state.els.tabs.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.adminTab === panel);
    });

    if (state.els.mobileSelect) {
      state.els.mobileSelect.value = panel;
    }

    state.els.panels.forEach((section) => {
      section.classList.toggle("is-active", section.dataset.adminPanel === panel);
    });

    if (panel === "users") renderUsersTable();
    if (panel === "modules") renderModuleControls();
    if (panel === "credits") renderCouponsTable();
  }

  // --- API HELPER ---
  async function adminFetch(endpoint, body = {}) {
    const pass = getAdminPassword();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, adminPassword: pass })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setAdminPassword("");
      promptAuth();
      throw new Error(data.error || "Yönetici yetkisi geçersiz.");
    }
    if (!res.ok) {
      throw new Error(data.error || "İşlem başarısız.");
    }
    return data;
  }

  // --- AUTH PROMPT ---
  function promptAuth(callback = null) {
    if (!state.els.authModal) return;
    if (state.els.authModalError) state.els.authModalError.hidden = true;
    if (state.els.authModalPasswordInput) {
      state.els.authModalPasswordInput.value = "";
    }
    state.els.authModal.showModal();
    state.authCallback = callback;
    setTimeout(() => state.els.authModalPasswordInput?.focus(), 50);
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const password = state.els.authModalPasswordInput?.value?.trim();
    if (!password) return;

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Şifre hatalı.");
      }

      setAdminPassword(password);
      state.els.authModal.close();
      window.showToast?.("Yönetici girişi başarılı.", "success");
      await refreshAll();

      if (typeof state.authCallback === "function") {
        state.authCallback();
        state.authCallback = null;
      }
    } catch (err) {
      if (state.els.authModalError) {
        state.els.authModalError.textContent = err.message;
        state.els.authModalError.hidden = false;
      }
    }
  }

  // --- DATA FETCHING ---
  async function refreshAll() {
    try {
      await Promise.all([
        refreshOverview(),
        refreshUsers(),
        refreshCreditCodes()
      ]);
    } catch (err) {
      console.warn("Admin panel data refresh error:", err.message);
    }
  }

  async function refreshOverview() {
    const data = await adminFetch("/api/admin/overview");
    state.overview = data;
    renderOverview();
  }

  async function refreshUsers() {
    const data = await adminFetch("/api/admin/users", { action: "list" });
    state.users = data.users || [];
    renderUsersTable();
  }

  async function refreshCreditCodes() {
    const data = await adminFetch("/api/admin/credit-codes", { action: "list" });
    state.creditCodes = data.creditCodes || [];
    renderCouponsTable();
  }

  // --- RENDERING ---
  function renderOverview() {
    if (!state.overview) return;
    const { stats, maintenanceMode, maintenanceMessage, announcement, recentLogs } = state.overview;

    if (state.els.statTotalUsers) state.els.statTotalUsers.textContent = stats.totalUsers ?? 0;
    if (state.els.statActiveUsers) state.els.statActiveUsers.textContent = stats.activeUsers ?? 0;
    if (state.els.statSuspendedUsers) state.els.statSuspendedUsers.textContent = stats.suspendedUsers ?? 0;
    if (state.els.statTotalCredits) state.els.statTotalCredits.textContent = Number(stats.totalCredits ?? 0).toLocaleString("tr-TR");
    if (state.els.statActiveCoupons) state.els.statActiveCoupons.textContent = stats.activeCoupons ?? 0;

    if (state.els.statSystemStatus) {
      if (maintenanceMode) {
        state.els.statSystemStatus.innerHTML = `<span class="badge-status status-danger">⚠️ Bakım Modunda</span>`;
      } else {
        state.els.statSystemStatus.innerHTML = `<span class="badge-status status-success">🟢 Sistem Aktif</span>`;
      }
    }

    if (state.els.topMaintenanceBadge) {
      state.els.topMaintenanceBadge.hidden = !maintenanceMode;
    }

    if (state.els.quickMaintenanceToggle) state.els.quickMaintenanceToggle.checked = Boolean(maintenanceMode);
    if (state.els.quickMaintenanceMsg) state.els.quickMaintenanceMsg.value = maintenanceMessage || "";

    if (state.els.announcementActiveToggle) state.els.announcementActiveToggle.checked = Boolean(announcement?.active);
    if (state.els.announcementMsgInput) state.els.announcementMsgInput.value = announcement?.message || "";
    if (state.els.announcementTypeSelect) state.els.announcementTypeSelect.value = announcement?.type || "info";

    // Render audit logs
    if (state.els.auditLogsContainer) {
      if (!recentLogs || !recentLogs.length) {
        state.els.auditLogsContainer.innerHTML = `<p class="empty-state-text">Henüz işlem kaydı bulunmuyor.</p>`;
      } else {
        state.els.auditLogsContainer.innerHTML = recentLogs.map((log) => {
          const dateStr = log.date ? new Date(log.date).toLocaleString("tr-TR") : "";
          return `
            <div class="admin-audit-item">
              <span class="admin-audit-time">${dateStr}</span>
              <span class="admin-audit-action">${escapeHtml(log.action || "İŞLEM")}</span>
              <span class="admin-audit-desc">${escapeHtml(log.details || "")}</span>
            </div>
          `;
        }).join("");
      }
    }

    renderModuleControls();
  }

  function renderUsersTable() {
    if (!state.els.usersTableBody) return;
    const query = state.searchQuery.toLowerCase().trim();
    const status = state.statusFilter;
    const role = state.roleFilter;

    const filtered = state.users.filter((u) => {
      if (query && !`${u.name} ${u.email} ${u.id}`.toLowerCase().includes(query)) return false;
      if (status === "active" && !u.isActive) return false;
      if (status === "suspended" && u.isActive) return false;
      if (role !== "all" && u.role !== role) return false;
      return true;
    });

    if (!filtered.length) {
      state.els.usersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-cell">Kriterlere uygun kullanıcı bulunamadı.</td>
        </tr>
      `;
      return;
    }

    state.els.usersTableBody.innerHTML = filtered.map((u) => {
      const roleBadges = {
        admin: `<span class="badge-role role-admin">👑 Yönetici</span>`,
        teacher: `<span class="badge-role role-teacher">👨‍🏫 Öğretmen</span>`,
        user: `<span class="badge-role role-user">👤 Standart</span>`
      };
      const statusBadge = u.isActive
        ? `<span class="badge-status status-success">🟢 Aktif</span>`
        : `<span class="badge-status status-danger">🔴 Donduruldu</span>`;

      const moduleBadges = (u.allowedModules || []).map((m) => {
        const found = MODULE_METAS.find((x) => x.id === m);
        return `<span class="badge-module" title="${found ? found.name : m}">${found ? found.icon : m}</span>`;
      }).join(" ");

      const isProtectedAdmin = u.id === "admin" || u.userKey === "admin";

      return `
        <tr data-user-key="${escapeHtml(u.userKey || u.id)}" class="${u.isActive ? "" : "is-suspended"}">
          <td>
            <div class="admin-user-cell">
              <span class="user-avatar-small">${(u.name || "K").charAt(0).toUpperCase()}</span>
              <div>
                <strong>${escapeHtml(u.name || "İsimsiz")}</strong>
                <small>${escapeHtml(u.email || "-")}</small>
              </div>
            </div>
          </td>
          <td>${roleBadges[u.role] || roleBadges.teacher}</td>
          <td>${statusBadge}</td>
          <td><div class="module-badges-wrap">${moduleBadges || '<span class="badge-none">Erişim Yok</span>'}</div></td>
          <td><strong>${Number(u.credits || 0)}</strong> <small>Kredi</small></td>
          <td><small>${u.createdAt ? new Date(u.createdAt).toLocaleDateString("tr-TR") : "-"}</small></td>
          <td>
            <div class="admin-row-actions">
              <button type="button" class="btn-action btn-action-edit" data-user-action="edit" title="Yetkileri ve Bilgileri Düzenle">✏️</button>
              <button type="button" class="btn-action btn-action-credit" data-user-action="credit" title="Kredi Yükle / Düzenle">💳</button>
              <button type="button" class="btn-action btn-action-toggle" data-user-action="toggle" title="${u.isActive ? 'Hesabı Dondur' : 'Hesabı Aktifleştir'}">
                ${u.isActive ? "⏸️" : "▶️"}
              </button>
              ${isProtectedAdmin ? "" : `<button type="button" class="btn-action btn-action-delete" data-user-action="delete" title="Kullanıcıyı Sil">🗑️</button>`}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderModuleControls() {
    if (!state.els.moduleControlGrid) return;
    const globalModules = state.overview?.globalModules || {};

    state.els.moduleControlGrid.innerHTML = MODULE_METAS.map((m) => {
      const current = globalModules[m.id] || { enabled: true };
      const isEnabled = current.enabled !== false;
      return `
        <div class="admin-module-card ${isEnabled ? "is-enabled" : "is-disabled"}" data-module-id="${m.id}">
          <div class="admin-module-card-header">
            <span class="admin-module-icon">${m.icon}</span>
            <div class="admin-module-info">
              <strong>${m.name}</strong>
              <p>${m.desc}</p>
            </div>
          </div>
          <div class="admin-module-card-footer">
            <span class="admin-module-status-badge ${isEnabled ? 'status-active' : 'status-inactive'}">
              ${isEnabled ? "🟢 Yayında / Aktif" : "🔴 Devre Dışı / Bakımda"}
            </span>
            <label class="admin-toggle-switch">
              <input type="checkbox" data-module-toggle="${m.id}" ${isEnabled ? "checked" : ""} />
              <span class="admin-toggle-slider"></span>
            </label>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderCouponsTable() {
    if (!state.els.couponsTableBody) return;
    const codes = state.creditCodes || [];

    if (!codes.length) {
      state.els.couponsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-cell">Henüz oluşturulmuş kupon kodu bulunmuyor.</td>
        </tr>
      `;
      return;
    }

    state.els.couponsTableBody.innerHTML = codes.map((c) => {
      const isAvailable = c.isActive !== false && (!c.maxUses || (c.usedCount || 0) < c.maxUses);
      return `
        <tr class="${isAvailable ? "" : "is-coupon-depleted"}">
          <td><strong class="code-badge">${escapeHtml(c.code)}</strong></td>
          <td><span class="badge-credit">+${c.credits} Kredi</span></td>
          <td>${c.usedCount || 0} / ${c.maxUses || "∞"}</td>
          <td>
            <span class="badge-status ${isAvailable ? 'status-success' : 'status-danger'}">
              ${isAvailable ? "Aktif" : (c.isActive === false ? "Durduruldu" : "Tükendi")}
            </span>
          </td>
          <td><small>${escapeHtml(c.note || "-")}</small></td>
          <td><small>${c.createdAt ? new Date(c.createdAt).toLocaleDateString("tr-TR") : "-"}</small></td>
          <td>
            <div class="admin-row-actions">
              <button type="button" class="btn-action" data-coupon-action="copy" data-code="${escapeHtml(c.code)}" title="Kodu Kopyala">📋</button>
              <button type="button" class="btn-action" data-coupon-action="toggle" data-code="${escapeHtml(c.code)}" title="${c.isActive ? 'Pasife Al' : 'Aktife Al'}">
                ${c.isActive ? "⏸️" : "▶️"}
              </button>
              <button type="button" class="btn-action btn-action-delete" data-coupon-action="delete" data-code="${escapeHtml(c.code)}" title="Kodu Sil">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // --- USER MODAL ACTIONS ---
  function openUserModal(user = null) {
    if (!state.els.userModal) return;
    state.editingUserKey = user ? (user.userKey || user.id) : null;

    if (state.els.userModalTitle) {
      state.els.userModalTitle.textContent = user ? "Kullanıcıyı ve Yetkileri Düzenle" : "Yeni Kullanıcı Ekle";
    }

    if (state.els.userModalName) state.els.userModalName.value = user?.name || "";
    if (state.els.userModalEmail) {
      state.els.userModalEmail.value = user?.email || "";
      state.els.userModalEmail.readOnly = Boolean(user);
    }
    if (state.els.userModalPassword) state.els.userModalPassword.value = "";
    if (state.els.userModalRole) state.els.userModalRole.value = user?.role || "teacher";
    if (state.els.userModalIsActive) state.els.userModalIsActive.checked = user ? user.isActive !== false : true;
    if (state.els.userModalCredits) {
      state.els.userModalCredits.value = user ? (user.credits || 0) : (state.overview?.initialUserCredits || 1);
    }
    if (state.els.userModalNotes) state.els.userModalNotes.value = user?.notes || "";

    const allowed = user ? (user.allowedModules || []) : (state.overview?.defaultAllowedModules || MODULE_METAS.map((m) => m.id));
    state.els.userModalModuleChecks.forEach((chk) => {
      chk.checked = allowed.includes(chk.value);
    });

    state.els.userModal.showModal();
  }

  async function handleUserFormSubmit(e) {
    e.preventDefault();
    const name = state.els.userModalName?.value?.trim();
    const email = state.els.userModalEmail?.value?.trim()?.toLowerCase();
    const password = state.els.userModalPassword?.value?.trim();
    const role = state.els.userModalRole?.value || "teacher";
    const isActive = state.els.userModalIsActive?.checked;
    const credits = Number(state.els.userModalCredits?.value || 0);
    const notes = state.els.userModalNotes?.value?.trim();

    if (!name || !email) {
      window.showToast?.("Ad soyad ve e-posta zorunludur.", "warning");
      return;
    }

    const allowedModules = [...state.els.userModalModuleChecks].filter((c) => c.checked).map((c) => c.value);

    try {
      if (state.editingUserKey) {
        // Update permissions and details
        await adminFetch("/api/admin/users", {
          action: "update_permissions",
          targetUserId: state.editingUserKey,
          role,
          allowedModules,
          isActive
        });
        if (password) {
          await adminFetch("/api/admin/users", {
            action: "reset_password",
            targetUserId: state.editingUserKey,
            password
          });
        }
        await adminFetch("/api/admin/user-credits", {
          targetUserId: state.editingUserKey,
          amount: credits,
          type: "set",
          note: "Yönetici tarafından bakiye güncellendi"
        });
        window.showToast?.("Kullanıcı başarıyla güncellendi.", "success");
      } else {
        // Create new
        await adminFetch("/api/admin/users", {
          action: "create",
          user: { name, email, password, role, isActive, allowedModules, credits, notes }
        });
        window.showToast?.("Yeni kullanıcı eklendi.", "success");
      }

      state.els.userModal.close();
      await refreshAll();
    } catch (err) {
      window.showToast?.(err.message, "error");
    }
  }

  // --- CREDIT MODAL ACTIONS ---
  function openCreditModal(user) {
    if (!state.els.creditModal || !user) return;
    state.creditTargetUserId = user.userKey || user.id;
    if (state.els.creditModalUserLabel) {
      state.els.creditModalUserLabel.textContent = `${user.name} (${user.email || user.id})`;
    }
    if (state.els.creditModalCurrent) {
      state.els.creditModalCurrent.textContent = `${user.credits || 0} Kredi`;
    }
    if (state.els.creditModalAmount) state.els.creditModalAmount.value = "5";
    if (state.els.creditModalType) state.els.creditModalType.value = "add";
    if (state.els.creditModalNote) state.els.creditModalNote.value = "";
    state.els.creditModal.showModal();
  }

  async function handleCreditFormSubmit(e) {
    e.preventDefault();
    const amount = Number(state.els.creditModalAmount?.value || 0);
    const type = state.els.creditModalType?.value || "add";
    const note = state.els.creditModalNote?.value?.trim() || "";

    if (amount <= 0 && type !== "set") {
      window.showToast?.("Geçerli bir kredi miktarı girin.", "warning");
      return;
    }

    try {
      const res = await adminFetch("/api/admin/user-credits", {
        targetUserId: state.creditTargetUserId,
        amount,
        type,
        note
      });
      window.showToast?.(res.message || "Kredi başarıyla uygulandı.", "success");
      state.els.creditModal.close();
      await refreshAll();
    } catch (err) {
      window.showToast?.(err.message, "error");
    }
  }

  // --- EVENT BINDINGS ---
  function bindEvents() {
    // Tabs
    state.els.tabs.forEach((button) => {
      button.addEventListener("click", () => setPanel(button.dataset.adminTab));
    });
    if (state.els.mobileSelect) {
      state.els.mobileSelect.addEventListener("change", (e) => setPanel(e.target.value));
    }

    // Auth modal
    state.els.authModalForm?.addEventListener("submit", handleAuthSubmit);
    state.els.authModalCancelBtn?.addEventListener("click", () => {
      state.els.authModal.close();
      window.returnToModuleHub?.();
    });

    // Logout
    state.els.logoutBtn?.addEventListener("click", () => {
      setAdminPassword("");
      window.showToast?.("Yönetici oturumu kapatıldı.", "info");
      window.returnToModuleHub?.();
    });

    // Quick add user
    state.els.quickAddUserBtn?.addEventListener("click", () => openUserModal(null));
    state.els.addUserBtn?.addEventListener("click", () => openUserModal(null));

    // User search & filters
    state.els.userSearchInput?.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderUsersTable();
    });
    state.els.userStatusFilter?.addEventListener("change", (e) => {
      state.statusFilter = e.target.value;
      renderUsersTable();
    });
    state.els.userRoleFilter?.addEventListener("change", (e) => {
      state.roleFilter = e.target.value;
      renderUsersTable();
    });

    // Users table row action delegation
    state.els.usersTableBody?.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-user-action]");
      if (!btn) return;
      const row = btn.closest("tr");
      const userKey = row?.dataset.userKey;
      const user = state.users.find((u) => (u.userKey || u.id) === userKey);
      if (!user) return;

      const action = btn.dataset.userAction;
      if (action === "edit") {
        openUserModal(user);
      } else if (action === "credit") {
        openCreditModal(user);
      } else if (action === "toggle") {
        try {
          const res = await adminFetch("/api/admin/users", {
            action: "toggle_active",
            targetUserId: userKey
          });
          window.showToast?.(
            res.isActive ? `${user.name} aktif edildi.` : `${user.name} hesabı donduruldu.`,
            res.isActive ? "success" : "warning"
          );
          await refreshUsers();
        } catch (err) {
          window.showToast?.(err.message, "error");
        }
      } else if (action === "delete") {
        if (!confirm(`${user.name} (${user.email || user.id}) kullanıcısını sistemden tamamen silmek istediğinize emin misiniz?`)) return;
        try {
          await adminFetch("/api/admin/users", {
            action: "delete",
            targetUserId: userKey
          });
          window.showToast?.("Kullanıcı silindi.", "info");
          await refreshAll();
        } catch (err) {
          window.showToast?.(err.message, "error");
        }
      }
    });

    // User modal form
    state.els.userModalForm?.addEventListener("submit", handleUserFormSubmit);
    state.els.userModalCloseBtn?.addEventListener("click", () => state.els.userModal.close());

    // Credit modal form
    state.els.creditModalForm?.addEventListener("submit", handleCreditFormSubmit);
    state.els.creditModalCloseBtn?.addEventListener("click", () => state.els.creditModal.close());

    // Module toggle switches
    state.els.moduleControlGrid?.addEventListener("change", async (e) => {
      const toggle = e.target.closest("[data-module-toggle]");
      if (!toggle) return;
      const moduleId = toggle.dataset.moduleToggle;
      const enabled = toggle.checked;

      try {
        await adminFetch("/api/admin/modules", {
          action: "toggle_module",
          moduleId,
          enabled
        });
        window.showToast?.(`${moduleId} modülü ${enabled ? 'açıldı' : 'devre dışı bırakıldı'}.`, "info");
        await refreshOverview();
        if (window.syncSystemPermissions) await window.syncSystemPermissions();
      } catch (err) {
        toggle.checked = !enabled; // Revert switch on failure
        window.showToast?.(err.message, "error");
      }
    });

    // Maintenance save
    state.els.saveMaintenanceBtn?.addEventListener("click", async () => {
      const maintenanceMode = Boolean(state.els.quickMaintenanceToggle?.checked);
      const maintenanceMessage = state.els.quickMaintenanceMsg?.value?.trim() || "";

      try {
        await adminFetch("/api/admin/modules", {
          action: "set_maintenance",
          maintenanceMode,
          maintenanceMessage
        });
        window.showToast?.("Bakım modu ayarları güncellendi.", "success");
        await refreshOverview();
        if (window.syncSystemPermissions) await window.syncSystemPermissions();
      } catch (err) {
        window.showToast?.(err.message, "error");
      }
    });

    // Announcement save
    state.els.saveAnnouncementBtn?.addEventListener("click", async () => {
      const active = Boolean(state.els.announcementActiveToggle?.checked);
      const message = state.els.announcementMsgInput?.value?.trim() || "";
      const type = state.els.announcementTypeSelect?.value || "info";

      try {
        await adminFetch("/api/admin/announcement", { active, message, type });
        window.showToast?.("Sistem duyurusu güncellendi.", "success");
        await refreshOverview();
        if (window.syncSystemPermissions) await window.syncSystemPermissions();
      } catch (err) {
        window.showToast?.(err.message, "error");
      }
    });

    // Coupon actions
    state.els.generateRandomCodeBtn?.addEventListener("click", () => {
      const rnd = `KREDI-${state.els.newCouponCredits?.value || 5}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      if (state.els.newCouponCode) state.els.newCouponCode.value = rnd;
    });

    state.els.createCouponForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = state.els.newCouponCode?.value?.trim().toUpperCase();
      const credits = Number(state.els.newCouponCredits?.value || 1);
      const maxUses = Number(state.els.newCouponMaxUses?.value || 1);
      const note = state.els.newCouponNote?.value?.trim();

      try {
        await adminFetch("/api/admin/credit-codes", {
          action: "create",
          newCode: { code, credits, maxUses, note }
        });
        window.showToast?.(`Kupon başarıyla oluşturuldu: ${code}`, "success");
        if (state.els.newCouponCode) state.els.newCouponCode.value = "";
        if (state.els.newCouponNote) state.els.newCouponNote.value = "";
        await refreshCreditCodes();
      } catch (err) {
        window.showToast?.(err.message, "error");
      }
    });

    state.els.couponsTableBody?.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-coupon-action]");
      if (!btn) return;
      const action = btn.dataset.couponAction;
      const code = btn.dataset.code;

      if (action === "copy") {
        navigator.clipboard.writeText(code).then(() => {
          window.showToast?.(`"${code}" panoya kopyalandı!`, "info");
        });
      } else if (action === "toggle") {
        try {
          await adminFetch("/api/admin/credit-codes", { action: "toggle", code });
          window.showToast?.("Kupon durumu değiştirildi.", "info");
          await refreshCreditCodes();
        } catch (err) {
          window.showToast?.(err.message, "error");
        }
      } else if (action === "delete") {
        if (!confirm(`"${code}" kuponunu silmek istediğinize emin misiniz?`)) return;
        try {
          await adminFetch("/api/admin/credit-codes", { action: "delete", code });
          window.showToast?.("Kupon silindi.", "info");
          await refreshCreditCodes();
        } catch (err) {
          window.showToast?.(err.message, "error");
        }
      }
    });

    // Password change
    state.els.changePasswordForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = state.els.currentPasswordInput?.value;
      const newPassword = state.els.newPasswordInput?.value;
      const newPasswordConfirm = state.els.newPasswordConfirmInput?.value;

      if (!currentPassword || !newPassword) {
        window.showToast?.("Mevcut ve yeni şifre zorunludur.", "warning");
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        window.showToast?.("Yeni şifreler birbiriyle eşleşmiyor.", "error");
        return;
      }

      try {
        await adminFetch("/api/admin/change-password", { currentPassword, newPassword });
        setAdminPassword(newPassword);
        window.showToast?.("Yönetici şifresi başarıyla değiştirildi!", "success");
        if (state.els.currentPasswordInput) state.els.currentPasswordInput.value = "";
        if (state.els.newPasswordInput) state.els.newPasswordInput.value = "";
        if (state.els.newPasswordConfirmInput) state.els.newPasswordConfirmInput.value = "";
      } catch (err) {
        window.showToast?.(err.message, "error");
      }
    });

    // Defaults save
    state.els.saveDefaultsBtn?.addEventListener("click", async () => {
      const initialUserCredits = Number(state.els.defaultCreditsInput?.value || 1);
      const defaultAllowedModules = [...state.els.defaultModuleChecks].filter((c) => c.checked).map((c) => c.value);

      try {
        await adminFetch("/api/admin/modules", {
          action: "update_defaults",
          initialUserCredits,
          defaultAllowedModules
        });
        window.showToast?.("Varsayılan kullanıcı ayarları kaydedildi.", "success");
      } catch (err) {
        window.showToast?.(err.message, "error");
      }
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- INITIALIZATION ---
  function init() {
    if (state.initialized) return;
    state.els = collectElements();
    bindEvents();
    state.initialized = true;
  }

  function render(session = {}) {
    if (!state.initialized) init();

    const pass = getAdminPassword();
    if (!pass) {
      promptAuth(() => {
        setPanel("overview");
      });
      return;
    }

    state.isVerified = true;
    setPanel(state.activeTab || "overview");
    refreshAll();
  }

  const systemAdminModule = {
    init,
    render,
    setPanel,
    promptAuth,
    refreshAll,
    get isVerified() {
      return state.isVerified;
    }
  };

  window.AppModules.register("system-admin", systemAdminModule);
})();
