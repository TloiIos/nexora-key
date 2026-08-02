/**
 * NEXORA KEY — Admin Panel Application Logic
 * Version: 8.0.0
 * Features: Key Expiration Management (Day/Month/Year), Quick Extend (+7d/+30d/+365d), HWID Device Unbind, Firebase REST Sync
 */

const AUTH_CONFIG = {
  sessionKey: "nexora_admin_session",
  rememberKey: "nexora_remember_session"
};

const ENDPOINTS = {
  packages: "https://keyb-2f31d-default-rtdb.asia-southeast1.firebasedatabase.app/packages.json",
  keys: "https://keyb-2f31d-default-rtdb.asia-southeast1.firebasedatabase.app/keys.json"
};

const STORAGE_KEYS = {
  packages: "nexora_packages_v8",
  keys: "nexora_keys_v8"
};

let state = {
  products: [],
  keysArray: []
};

const ICONS = {
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
};

document.addEventListener("DOMContentLoaded", initAdmin);

function initAdmin() {
  // Check auth status; if unauthenticated, security guard in HTML already handled, but double check
  if (localStorage.getItem(AUTH_CONFIG.rememberKey) !== "1" && sessionStorage.getItem(AUTH_CONFIG.sessionKey) !== "1") {
    window.location.href = "login.html";
    return;
  }

  bindLogout();
  bindPresetSelect();
  loadAdminData();
  bindNavigation();
}

function bindLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", e => {
      e.preventDefault();
      sessionStorage.removeItem(AUTH_CONFIG.sessionKey);
      localStorage.removeItem(AUTH_CONFIG.rememberKey);
      toast("Đã đăng xuất! Chuyển hướng...");
      setTimeout(() => { window.location.href = "login.html"; }, 500);
    });
  }
}

function bindPresetSelect() {
  const presetSelect = document.getElementById("kDurationPreset");
  const customWrap = document.getElementById("customDateWrap");

  if (presetSelect && customWrap) {
    presetSelect.addEventListener("change", () => {
      customWrap.style.display = presetSelect.value === "custom" ? "block" : "none";
    });
  }
}

// ====== DATA SYNC WITH FIREBASE ======

async function loadAdminData() {
  await fetchProducts();
  await fetchKeys();
  renderAllAdminViews();
}

async function fetchProducts() {
  try {
    const res = await fetch(ENDPOINTS.packages, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        if (Array.isArray(data)) {
          state.products = data.filter(Boolean);
        } else if (typeof data === "object") {
          state.products = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        }
        localStorage.setItem(STORAGE_KEYS.packages, JSON.stringify(state.products));
        return;
      }
    }
  } catch (err) {
    console.warn("Products load failed:", err);
  }

  const cached = localStorage.getItem(STORAGE_KEYS.packages);
  if (cached) {
    try { state.products = JSON.parse(cached); } catch (e) { state.products = []; }
  }

  if (!state.products.length) {
    state.products = [
      {
        id: "-OyHMOsX_XVD2K1bLjdt",
        name: "NEXORA Login API Key — VIP1",
        type: "apikey",
        category: "API Login",
        priceDay: 10000,
        priceMonth: 150000,
        priceYear: 1200000,
        price: 150000,
        image: "https://picsum.photos/seed/nexora1/300/300",
        description: "Token OAuth 15ms latency, full source code",
        featured: true
      },
      {
        id: "p002",
        name: "Auto Login & Reg Account Full Source",
        type: "file",
        category: "Tool Source Code",
        priceDay: 350000,
        priceMonth: 350000,
        priceYear: 350000,
        price: 350000,
        image: "https://picsum.photos/seed/nexora2/300/300",
        description: "File ZIP 48.5 MB — C# .NET Core Source Code",
        featured: true
      }
    ];
    await saveProductsToFirebase();
  }
}

async function fetchKeys() {
  try {
    const res = await fetch(ENDPOINTS.keys, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        state.keysArray = Object.keys(data).map(nodeId => ({
          id: nodeId,
          key: data[nodeId].key || nodeId,
          ...data[nodeId]
        }));
        localStorage.setItem(STORAGE_KEYS.keys, JSON.stringify(state.keysArray));
        return;
      }
    }
  } catch (err) {
    console.warn("Keys load failed:", err);
  }

  const cached = localStorage.getItem(STORAGE_KEYS.keys);
  if (cached) {
    try { state.keysArray = JSON.parse(cached); } catch (e) { state.keysArray = []; }
  }
}

async function saveProductsToFirebase() {
  localStorage.setItem(STORAGE_KEYS.packages, JSON.stringify(state.products));
  try {
    await fetch(ENDPOINTS.packages, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.products)
    });
  } catch (err) { console.warn("Firebase products save failed:", err); }
}

async function saveKeysToFirebase() {
  localStorage.setItem(STORAGE_KEYS.keys, JSON.stringify(state.keysArray));
  try {
    const mapObj = {};
    state.keysArray.forEach(item => {
      const nodeId = item.id || generateNodeId();
      mapObj[nodeId] = {
        createdAt: item.createdAt || Date.now(),
        devices: item.devices || {},
        expiresAt: item.expiresAt,
        maxDevices: item.maxDevices || 1,
        packageId: item.packageId || "-OyHMOsX_XVD2K1bLjdt",
        status: item.status || "active",
        key: item.key || nodeId,
        note: item.note || ""
      };

      if (item.lockedUids && typeof item.lockedUids === 'object') {
        mapObj[nodeId].lockedUids = item.lockedUids;
      }
    });

    await fetch(ENDPOINTS.keys, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapObj)
    });
  } catch (err) { console.warn("Firebase keys save failed:", err); }
}

// ====== NAVIGATION ======

function bindNavigation() {
  document.getElementById("navKeys")?.addEventListener("click", e => { e.preventDefault(); switchTab("keys"); });
  document.getElementById("navUIDs")?.addEventListener("click", e => { e.preventDefault(); switchTab("uids"); });
  document.getElementById("navProducts")?.addEventListener("click", e => { e.preventDefault(); switchTab("products"); });

  document.getElementById("reloadBtn")?.addEventListener("click", async () => {
    toast("Đang tải lại dữ liệu từ Firebase Realtime DB...");
    await loadAdminData();
    toast("Đồng bộ dữ liệu thành công!");
  });

  document.getElementById("exportBtn")?.addEventListener("click", exportJsonBackup);
  switchTab("keys");
}

function switchTab(tab) {
  const panelKeys = document.getElementById("panelKeys");
  const panelUIDs = document.getElementById("panelUIDs");
  const panelProducts = document.getElementById("panelProducts");
  const navKeys = document.getElementById("navKeys");
  const navUIDs = document.getElementById("navUIDs");
  const navProducts = document.getElementById("navProducts");

  if (panelKeys) panelKeys.style.display = tab === "keys" ? "block" : "none";
  if (panelUIDs) panelUIDs.style.display = tab === "uids" ? "block" : "none";
  if (panelProducts) panelProducts.style.display = tab === "products" ? "block" : "none";

  if (navKeys) navKeys.classList.toggle("nav-item--active", tab === "keys");
  if (navUIDs) navUIDs.classList.toggle("nav-item--active", tab === "uids");
  if (navProducts) navProducts.classList.toggle("nav-item--active", tab === "products");

  const titleEl = document.getElementById("pageTitle");
  const subEl = document.getElementById("pageSubtitle");

  if (titleEl && subEl) {
    if (tab === "keys") {
      titleEl.textContent = "Quản Lý Key & Thời Hạn License";
      subEl.textContent = "Cấu hình thời gian hết hạn (Ngày/Tháng/Năm), kích hoạt & gỡ HWID thiết bị";
    } else if (tab === "uids") {
      titleEl.textContent = "Quản Lý UID Thiết Bị";
      subEl.textContent = "Xem UID theo key, trạng thái và khóa thiết bị riêng biệt.";
    } else {
      titleEl.textContent = "Gói License & Giá Bán";
      subEl.textContent = "Thiết lập danh mục sản phẩm, gói bán và định giá theo ngày/tháng/năm";
    }
  }

  renderAllAdminViews();
}

// ====== RENDER VIEWS ======

function renderAllAdminViews() {
  renderStats();
  renderFirebaseKeysTable();
  renderUIDTable();
  bindKeyForm();
  renderProductsTable();
  bindProductForm();
  renderPackageSelect();
}

function renderStats() {
  const totalKeys = document.getElementById("statTotalKeys");
  const activeKeys = document.getElementById("statActiveKeys");
  const expiredKeys = document.getElementById("statExpiredKeys");
  const hwidDevs = document.getElementById("statHwidDevices");

  let activeCount = 0;
  let expiredCount = 0;
  let devCount = 0;

  state.keysArray.forEach(k => {
    if (k.status === "revoked") {
      // revoked
    } else if (k.expiresAt && Number(k.expiresAt) < Date.now()) {
      expiredCount++;
    } else {
      activeCount++;
    }

    if (k.devices && typeof k.devices === "object") {
      devCount += Object.keys(k.devices).length;
    }
  });

  if (totalKeys) totalKeys.textContent = state.keysArray.length;
  if (activeKeys) activeKeys.textContent = activeCount;
  if (expiredKeys) expiredKeys.textContent = expiredCount;
  if (hwidDevs) hwidDevs.textContent = devCount;
}

// ====== FIREBASE KEYS & EXPIRATION MANAGEMENT ======

function renderFirebaseKeysTable() {
  const body = document.getElementById("firebaseKeyTableBody");
  const countEl = document.getElementById("firebaseKeyCount");
  const searchInput = document.getElementById("keySearch");
  const statusFilter = document.getElementById("keyFilterStatus");

  if (!body) return;
  if (countEl) countEl.textContent = state.keysArray.length;

  const query = (searchInput?.value || "").toLowerCase();
  const filter = statusFilter?.value || "";

  let list = state.keysArray;

  if (query) {
    list = list.filter(k =>
      (k.id || "").toLowerCase().includes(query) ||
      (k.key || "").toLowerCase().includes(query) ||
      (k.note || "").toLowerCase().includes(query)
    );
  }

  if (filter) {
    list = list.filter(k => {
      const isExpired = k.expiresAt && Number(k.expiresAt) < Date.now();
      if (filter === "active") return k.status !== "revoked" && !isExpired;
      if (filter === "expired") return k.status !== "revoked" && isExpired;
      if (filter === "revoked") return k.status === "revoked";
      return true;
    });
  }

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="6" class="data-table__empty">Chưa có mã Key nào trong cơ sở dữ liệu Firebase.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(k => {
    const pkg = state.products.find(p => p.id === k.packageId);
    const expiresText = k.expiresAt ? formatTimestamp(k.expiresAt) : "Vĩnh viễn (Lifetime)";
    const devCount = k.devices && typeof k.devices === "object" ? Object.keys(k.devices).length : 0;
    const maxDev = k.maxDevices || pkg?.maxDevices || 1;

    const isExpired = k.expiresAt && Number(k.expiresAt) < Date.now();
    let statusPill = `<span class="stock-pill">Active</span>`;

    if (k.status === "revoked") {
      statusPill = `<span class="stock-pill stock-pill--warning" style="color:var(--color-rose);">Revoked</span>`;
    } else if (isExpired) {
      statusPill = `<span class="stock-pill stock-pill--warning">Expired</span>`;
    }

    const latestUid = (k.devices && typeof k.devices === 'object')
      ? Object.keys(k.devices).sort((a, b) => (k.devices[a] || 0) - (k.devices[b] || 0)).pop()
      : "—";

    return `
    <tr>
      <td class="data-table__mono">
        ${k.key || k.id}
        <div style="font-size:0.75rem;color:var(--color-text-dim);">${k.note || ''}</div>
      </td>
      <td class="data-table__muted">${pkg?.name || k.packageId || "—"}</td>
      <td><span class="badge-count">${devCount}/${maxDev} máy</span></td>
      <td class="data-table__mono" style="font-size:0.85rem;line-height:1.3;">
        ${latestUid !== "—" ? latestUid : '<span style="color:var(--color-text-dim);">Chưa có</span>'}
      </td>
      <td style="font-size:var(--text-xs);">${expiresText}</td>
      <td>${statusPill}</td>
      <td>
        <div class="row-actions">
          <button class="row-actions__btn row-actions__btn--edit" data-act="extend-30d" data-id="${k.id}" title="+30 Ngày">
            ${ICONS.clock} +30 ngày
          </button>
          <button class="row-actions__btn" data-act="lock-uid" data-id="${k.id}" title="Khóa UID mới nhất">
            ${ICONS.lock} Khoá UID
          </button>
          <button class="row-actions__btn" data-act="edit-k" data-id="${k.id}">
            ${ICONS.edit} Sửa Hạn
          </button>
          <button class="row-actions__btn row-actions__btn--delete" data-act="del-k" data-id="${k.id}">
            ${ICONS.delete} Xoá
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");

  body.querySelectorAll("button[data-act]").forEach(btn => {
    const id = btn.dataset.id;
    btn.addEventListener("click", () => {
      if (btn.dataset.act === "extend-30d") quickExtendKey(id, 30);
      if (btn.dataset.act === "lock-uid") lockLatestUid(id);
      if (btn.dataset.act === "revoke-key") revokeKeyNode(id);
      if (btn.dataset.act === "edit-k") editKey(id);
      if (btn.dataset.act === "del-k") deleteKeyNode(id);
    });
  });

  if (searchInput && !searchInput._bound) {
    searchInput._bound = true;
    searchInput.addEventListener("input", renderFirebaseKeysTable);
  }
  if (statusFilter && !statusFilter._bound) {
    statusFilter._bound = true;
    statusFilter.addEventListener("change", renderFirebaseKeysTable);
  }
}

function renderUIDTable() {
  const body = document.getElementById("uidTableBody");
  const countEl = document.getElementById("uidCount");
  const searchInput = document.getElementById("uidSearch");
  const statusFilter = document.getElementById("uidFilterStatus");

  if (!body) return;

  const uidEntries = [];
  state.keysArray.forEach(key => {
    if (key.devices && typeof key.devices === "object") {
      Object.entries(key.devices).forEach(([uid, lastSeen]) => {
        const isLocked = key.lockedUids && key.lockedUids[uid];
        uidEntries.push({
          uid,
          keyId: key.id,
          keyString: key.key || key.id,
          keyStatus: key.status || "active",
          lastSeen: lastSeen || 0,
          isLocked: !!isLocked,
          lockInfo: isLocked,
          parentKey: key
        });
      });
    }
  });

  const query = (searchInput?.value || "").toLowerCase();
  let list = uidEntries;

  if (query) {
    list = list.filter(item =>
      item.uid.toLowerCase().includes(query) ||
      item.keyString.toLowerCase().includes(query)
    );
  }

  if (statusFilter?.value) {
    list = list.filter(item => {
      const keyExpired = item.parentKey.expiresAt && Number(item.parentKey.expiresAt) < Date.now();
      if (statusFilter.value === "active") return item.keyStatus !== "revoked" && !keyExpired;
      if (statusFilter.value === "expired") return item.keyStatus !== "revoked" && keyExpired;
      if (statusFilter.value === "revoked") return item.keyStatus === "revoked";
      return true;
    });
  }

  if (countEl) countEl.textContent = list.length.toString();

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="6" class="data-table__empty">Không có UID nào phù hợp.</td></tr>`;
  } else {
    body.innerHTML = list.map(item => {
      const lastSeenText = item.lastSeen ? formatTimestamp(item.lastSeen) : "Chưa rõ";
      const statusTag = item.keyStatus === "revoked"
        ? `<span class="stock-pill stock-pill--warning" style="color:var(--color-rose);">Revoked</span>`
        : `<span class="stock-pill">${item.parentKey.expiresAt && Number(item.parentKey.expiresAt) < Date.now() ? "Expired" : "Active"}</span>`;
      const actionCell = item.isLocked
        ? `<span class="stock-pill stock-pill--warning" style="color:var(--color-rose);">Đã khóa</span>`
        : `<button class="row-actions__btn" data-act="lock-uid-row" data-id="${item.keyId}" data-uid="${item.uid}" title="Khóa UID này">${ICONS.lock} Khóa</button>`;

      return `
      <tr>
        <td><img class="uid-avatar" src="https://picsum.photos/seed/${encodeURIComponent(item.uid)}/72/72" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></td>
        <td class="data-table__mono">${item.uid}</td>
        <td class="data-table__muted">${item.keyString}</td>
        <td>${statusTag}</td>
        <td>${lastSeenText}</td>
        <td>${actionCell}</td>
      </tr>`;
    }).join("");
  }

  body.querySelectorAll("button[data-act='lock-uid-row']").forEach(btn => {
    const keyId = btn.dataset.id;
    const uid = btn.dataset.uid;
    btn.addEventListener("click", async () => {
      await lockSpecificUid(keyId, uid);
    });
  });

  if (searchInput && !searchInput._bound) {
    searchInput._bound = true;
    searchInput.addEventListener("input", renderUIDTable);
  }
  if (statusFilter && !statusFilter._bound) {
    statusFilter._bound = true;
    statusFilter.addEventListener("change", renderUIDTable);
  }
}

async function lockSpecificUid(keyId, uid) {
  const key = state.keysArray.find(x => x.id === keyId);
  if (!key || !uid) return;

  if (!key.lockedUids) key.lockedUids = {};
  if (key.lockedUids[uid]) {
    toast(`UID ${uid} đã được khóa trước đó.`);
    return;
  }

  const reason = prompt(`Khóa UID ${uid} trên Key ${key.key || key.id}\nNhập lý do hoặc để trống:`);
  if (reason === null) return;

  key.lockedUids[uid] = {
    lockedAt: Date.now(),
    reason: reason.trim() || "Khóa theo UID",
    byAdmin: "admin"
  };

  if (!key.devices || typeof key.devices !== "object") {
    key.devices = {};
  }
  if (!key.devices[uid]) {
    key.devices[uid] = Date.now();
  }

  await saveKeysToFirebase();
  renderAllAdminViews();
  toast(`Đã khóa UID ${uid}.`);
}

function bindKeyForm() {
  const form = document.getElementById("keyForm");
  const genBtn = document.getElementById("genKeyBtn");
  const resetBtn = document.getElementById("resetKeyFormBtn");

  if (!form || form._bound) return;
  form._bound = true;

  if (genBtn) {
    genBtn.addEventListener("click", () => {
      document.getElementById("kKey").value = generateNodeId();
    });
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const editId = document.getElementById("kEditId").value;
    const keyVal = document.getElementById("kKey").value.trim() || generateNodeId();
    const pkgId = document.getElementById("kPackage").value;
    const preset = document.getElementById("kDurationPreset").value;
    const maxDev = Number(document.getElementById("kMaxDevices").value) || 1;
    const note = document.getElementById("kNote").value.trim();

    let expiresAt = null;

    if (preset === "custom") {
      const customDateVal = document.getElementById("kCustomExpiryDate").value;
      if (customDateVal) {
        expiresAt = new Date(customDateVal).getTime();
      }
    } else {
      const days = parseInt(preset);
      if (days > 0) {
        expiresAt = Date.now() + days * 86400000;
      } else {
        expiresAt = null; // Lifetime
      }
    }

    if (editId) {
      const existing = state.keysArray.findIndex(k => k.id === editId);
      if (existing >= 0) {
        state.keysArray[existing].key = keyVal;
        state.keysArray[existing].packageId = pkgId;
        state.keysArray[existing].maxDevices = maxDev;
        state.keysArray[existing].expiresAt = expiresAt;
        state.keysArray[existing].note = note;
        state.keysArray[existing].status = "active";
      }
      toast("Đã cập nhật thời hạn Key thành công!");
    } else {
      const newKeyObj = {
        id: keyVal,
        key: keyVal,
        packageId: pkgId,
        maxDevices: maxDev,
        expiresAt: expiresAt,
        createdAt: Date.now(),
        status: "active",
        note: note,
        devices: {}
      };
      state.keysArray.push(newKeyObj);
      toast("Đã khởi tạo Key mới trên Firebase!");
    }

    await saveKeysToFirebase();
    renderAllAdminViews();
    resetKeyForm();
  });

  if (resetBtn) resetBtn.addEventListener("click", resetKeyForm);
}

function editKey(id) {
  const k = state.keysArray.find(x => x.id === id);
  if (!k) return;

  document.getElementById("keyFormTitle").textContent = "Sửa Thời Hạn Key";
  document.getElementById("kEditId").value = k.id;
  document.getElementById("kKey").value = k.key || k.id;
  document.getElementById("kPackage").value = k.packageId || "";
  document.getElementById("kMaxDevices").value = k.maxDevices || 1;
  document.getElementById("kNote").value = k.note || "";

  document.getElementById("keyForm")?.scrollIntoView({ behavior: "smooth" });
}

async function quickExtendKey(id, days) {
  const k = state.keysArray.find(x => x.id === id);
  if (!k) return;

  const currentExp = (k.expiresAt && Number(k.expiresAt) > Date.now()) ? Number(k.expiresAt) : Date.now();
  k.expiresAt = currentExp + (days * 86400000);
  k.status = "active";

  await saveKeysToFirebase();
  renderAllAdminViews();
  toast(`Đã gia hạn thêm ${days} ngày cho Key: ${k.key || k.id}`);
}

async function deleteKeyNode(id) {
  if (!confirm("Xoá mã Key này khỏi cơ sở dữ liệu Firebase Realtime DB?")) return;
  state.keysArray = state.keysArray.filter(k => k.id !== id);
  await saveKeysToFirebase();
  renderAllAdminViews();
  toast("Đã xoá Key khỏi Firebase Database!");
}

async function lockLatestUid(id) {
  const k = state.keysArray.find(x => x.id === id);
  if (!k) return;

  if (!k.devices || typeof k.devices !== 'object' || !Object.keys(k.devices).length) {
    toast('Key này chưa có thiết bị HWID nào để khóa.');
    return;
  }

  const latestUid = Object.keys(k.devices).sort((a, b) => (k.devices[a] || 0) - (k.devices[b] || 0)).pop();
  if (!latestUid) {
    toast('Không tìm thấy UID mới nhất để khóa.');
    return;
  }

  const reason = prompt(`Khóa UID mới nhất cho key ${k.key || k.id}:\n${latestUid}\nNhập lý do hoặc để trống:`);
  if (reason === null) {
    return;
  }

  if (!k.lockedUids) {
    k.lockedUids = {};
  }

  k.lockedUids[latestUid] = {
    lockedAt: Date.now(),
    reason: reason.trim() || 'Khóa theo UID mới nhất',
    byAdmin: 'admin'
  };

  if (!k.devices[latestUid]) {
    k.devices[latestUid] = Date.now();
  }

  k.status = 'revoked';
  await saveKeysToFirebase();
  renderAllAdminViews();
  toast(`Đã khóa UID ${latestUid} cho Key.`);
}

async function revokeKeyNode(id) {
  const k = state.keysArray.find(x => x.id === id);
  if (!k) return;
  if (k.status === 'revoked') {
    toast('Key này đã bị khoá rồi.');
    return;
  }

  const confirmLock = confirm(`Khoá toàn bộ key ${k.key || k.id}?
Key sẽ chuyển sang trạng thái Revoked và không thể kích hoạt thêm thiết bị.`);
  if (!confirmLock) return;

  const reason = prompt(`Nhập lý do khoá key ${k.key || k.id} (tùy chọn):`);
  k.status = 'revoked';
  k.revokedAt = Date.now();
  k.revokedReason = reason === null ? '' : reason.trim();

  await saveKeysToFirebase();
  renderAllAdminViews();
  toast(`Đã khoá key ${k.key || k.id}.`);
}

function resetKeyForm() {
  document.getElementById("keyForm")?.reset();
  document.getElementById("kEditId").value = "";
  document.getElementById("customDateWrap").style.display = "none";
  document.getElementById("keyFormTitle").textContent = "Khởi Tạo / Cấu Hình Key";
}

// ====== PRODUCT / PACKAGE MANAGEMENT ======

function renderProductsTable() {
  const body = document.getElementById("productTableBody");
  const countEl = document.getElementById("productCount");
  if (!body) return;

  if (countEl) countEl.textContent = state.products.length;

  if (!state.products.length) {
    body.innerHTML = `<tr><td colspan="5" class="data-table__empty">Chưa có gói License nào. Hãy tạo gói mới.</td></tr>`;
    return;
  }

  body.innerHTML = state.products.map(p => {
    const isApiKey = p.type === "apikey" || p.priceDay;
    const priceText = isApiKey
      ? `Ngày: <strong>${(p.priceDay||10000).toLocaleString("vi-VN")}₫</strong> &bull; Tháng: <strong>${(p.priceMonth||150000).toLocaleString("vi-VN")}₫</strong> &bull; Năm: <strong>${(p.priceYear||1200000).toLocaleString("vi-VN")}₫</strong>`
      : `<strong>${(p.price||p.priceMonth||350000).toLocaleString("vi-VN")} ₫</strong>`;

    return `
    <tr>
      <td><img src="${p.image}" alt="${p.name}" class="table-thumb" onerror="this.src='https://picsum.photos/seed/placeholder/100/100'"></td>
      <td>
        <strong style="color:#fff;">${p.name}</strong>
        ${p.featured ? '<span class="vip-badge">VIP</span>' : ""}
        <div class="data-table__muted" style="margin-top:2px;">${p.category || "API Login"}</div>
      </td>
      <td><span class="type-badge">${isApiKey ? 'API Key' : 'File Download'}</span></td>
      <td style="font-size:var(--text-xs);">${priceText}</td>
      <td>
        <div class="row-actions">
          <button class="row-actions__btn row-actions__btn--edit" data-act="edit-p" data-id="${p.id}">
            ${ICONS.edit} Sửa
          </button>
          <button class="row-actions__btn row-actions__btn--delete" data-act="del-p" data-id="${p.id}">
            ${ICONS.delete} Xoá
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");

  body.querySelectorAll("button[data-act]").forEach(btn => {
    const id = btn.dataset.id;
    btn.addEventListener("click", () => {
      if (btn.dataset.act === "edit-p") editProduct(id);
      if (btn.dataset.act === "del-p") deleteProduct(id);
    });
  });
}

function renderPackageSelect() {
  const sel = document.getElementById("kPackage");
  if (!sel) return;
  sel.innerHTML = state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
}

function bindProductForm() {
  const form = document.getElementById("productForm");
  const resetBtn = document.getElementById("resetFormBtn");

  if (!form || form._bound) return;
  form._bound = true;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await saveProductFromForm();
  });

  if (resetBtn) resetBtn.addEventListener("click", resetProductForm);
}

async function saveProductFromForm() {
  const id = document.getElementById("pId").value || "pkg_" + Date.now();
  const existing = state.products.findIndex(p => p.id === id);

  const data = {
    id,
    name: document.getElementById("pName").value.trim(),
    type: document.getElementById("pType").value,
    category: document.getElementById("pCategory").value.trim(),
    priceDay: Number(document.getElementById("pPriceDay").value) || 10000,
    priceMonth: Number(document.getElementById("pPriceMonth").value) || 150000,
    priceYear: Number(document.getElementById("pPriceYear").value) || 1200000,
    price: Number(document.getElementById("pPriceMonth").value) || 150000,
    image: document.getElementById("pImage").value.trim(),
    description: document.getElementById("pDesc").value.trim(),
    featured: document.getElementById("pFeatured").checked
  };

  if (existing >= 0) {
    state.products[existing] = data;
    toast("Đã cập nhật gói sản phẩm!");
  } else {
    state.products.push(data);
    toast("Đã thêm gói sản phẩm mới!");
  }

  await saveProductsToFirebase();
  renderAllAdminViews();
  resetProductForm();
}

function editProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  const formTitle = document.getElementById("formTitle");
  if (formTitle) formTitle.textContent = "Sửa Gói License";

  document.getElementById("pId").value = p.id;
  document.getElementById("pName").value = p.name;
  document.getElementById("pType").value = p.type || "apikey";
  document.getElementById("pCategory").value = p.category || "";
  document.getElementById("pPriceDay").value = p.priceDay || 10000;
  document.getElementById("pPriceMonth").value = p.priceMonth || 150000;
  document.getElementById("pPriceYear").value = p.priceYear || 1200000;
  document.getElementById("pImage").value = p.image || "";
  document.getElementById("pDesc").value = p.description || "";
  document.getElementById("pFeatured").checked = !!p.featured;

  document.getElementById("productForm")?.scrollIntoView({ behavior: "smooth" });
}

async function deleteProduct(id) {
  if (!confirm("Xoá gói sản phẩm này khỏi Firebase?")) return;
  state.products = state.products.filter(p => p.id !== id);
  await saveProductsToFirebase();
  renderAllAdminViews();
  toast("Đã xoá gói sản phẩm!");
}

function resetProductForm() {
  document.getElementById("productForm")?.reset();
  document.getElementById("pId").value = "";
  const title = document.getElementById("formTitle");
  if (title) title.textContent = "Thêm Gói License Mới";
}

// ====== UTILS & EXPORT ======

function generateNodeId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let autoId = "";
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

function exportJsonBackup() {
  const data = {
    products: state.products,
    keys: state.keysArray,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nexora-firebase-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Đã tải xuống file Backup JSON!");
}

function formatTimestamp(ts) {
  if (!ts) return "Vĩnh viễn";
  const num = Number(ts);
  const d = isNaN(num) ? new Date(ts) : new Date(num);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

let toastTimer;
function toast(msg) {
  let t = document.getElementById("adminToast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visible"), 2400);
}
