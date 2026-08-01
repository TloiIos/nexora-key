/**
 * ============================================================================
 * NEXORA KEY — Client Portal Application Logic
 * Version: 9.0.0  |  File: js/shop.js
 * ============================================================================
 *
 * Modules:
 *   A. Configuration & State
 *   B. Firebase REST API Data Loaders
 *   C. Stats Bar Renderer
 *   D. Duration Tab Switcher (Day / Month / Year / Lifetime)
 *   E. Package Grid Renderer — price adjusted per selected duration
 *   F. Key Checker — validate Firebase Node ID, HWID, expiry, status
 *   G. Buy Modal — Zalo contact flow
 *   H. Code Integration Snippet Tabs
 *   I. API Sandbox Console
 *   J. FAQ Accordion
 *   K. Toast Notification System
 *   L. Utility Helpers
 * ============================================================================
 */


// ============================================================================
// A. CONFIGURATION & STATE
// ============================================================================

const CONFIG = {
  shopName:   "NEXORA KEY",
  zaloPhone:  "0900000000",                   // ← Thay số Zalo thật vào đây
  zaloOaName: "NEXORA KEY SYSTEM",

  firebase: {
    packages: "https://keyb-2f31d-default-rtdb.asia-southeast1.firebasedatabase.app/packages.json",
    keys:     "https://keyb-2f31d-default-rtdb.asia-southeast1.firebasedatabase.app/keys.json"
  },

  storage: {
    packages: "nexora_packages_v9",
    keys:     "nexora_keys_v9"
  },

  // Durations mapping: tab id → multiplier / label / days
  durations: {
    day:      { label: "1 Ngày (24h)",    days: 1,   key: "priceDay" },
    month:    { label: "1 Tháng (30 ngày)", days: 30, key: "priceMonth" },
    year:     { label: "1 Năm (365 ngày)", days: 365, key: "priceYear" },
    lifetime: { label: "Vĩnh Viễn",        days: 0,   key: "priceLifetime" }
  }
};

/** Shared application state */
const state = {
  packages:    [],
  keys:        [],
  activeDuration: "day"        // currently selected duration tab: day|month|year|lifetime
};

/** SVG icon snippets for runtime injection */
const SVG = {
  check:   `<svg class="feature-list__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  cart:    `<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  zalo:    `<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  clock:   `<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  hwid:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
  shield:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
};


// ============================================================================
// B. FIREBASE REST API DATA LOADERS
// ============================================================================

/**
 * Fetch packages from Firebase Realtime DB.
 * Falls back to localStorage cache, then hardcoded demo data.
 */
async function loadPackages() {
  try {
    const res = await fetch(CONFIG.firebase.packages, { cache: "no-store" });
    if (res.ok) {
      const raw = await res.json();
      if (raw) {
        state.packages = Array.isArray(raw)
          ? raw.filter(Boolean)
          : Object.keys(raw).map(id => ({ id, ...raw[id] }));
        localStorage.setItem(CONFIG.storage.packages, JSON.stringify(state.packages));
        return;
      }
    }
  } catch (err) {
    console.warn("[NEXORA] packages fetch failed:", err.message);
  }

  // Try localStorage cache
  const cached = localStorage.getItem(CONFIG.storage.packages);
  if (cached) {
    try { state.packages = JSON.parse(cached); return; } catch (_) {}
  }

  // Fallback: built-in demo packages (Day/Month/Year pricing)
  state.packages = [
    {
      id:           "-OyHMOsX_XVD2K1bLjdt",
      name:         "NEXORA Login API Key — VIP1",
      type:         "apikey",
      category:     "API Login",
      priceDay:     10000,
      priceMonth:   150000,
      priceYear:    1200000,
      priceLifetime: 2500000,
      maxDevices:   1,
      image:        "https://picsum.photos/seed/nexora1/300/300",
      description:  "Token OAuth 15ms latency\nFirebase Realtime Sync\nAnti-share HWID lock\n1 thiết bị / key",
      featured:     true
    },
    {
      id:           "p002",
      name:         "Auto Login & Register — Full Source",
      type:         "file",
      category:     "Tool Source Code",
      priceDay:     350000,
      priceMonth:   350000,
      priceYear:    350000,
      priceLifetime: 350000,
      maxDevices:   1,
      image:        "https://picsum.photos/seed/nexora2/300/300",
      description:  "C# .NET Core Source Code\nZIP 48.5 MB full project\nTurnstile bypass included\nUnlimited updates",
      featured:     true
    },
    {
      id:           "p003",
      name:         "Master Auth Multi-Account API Key",
      type:         "apikey",
      category:     "API Login",
      priceDay:     20000,
      priceMonth:   280000,
      priceYear:    2200000,
      priceLifetime: 4000000,
      maxDevices:   1,
      image:        "https://picsum.photos/seed/nexora3/300/300",
      description:  "Multi-account Turnstile bypass\nBatch processing 50 req/s\nReal-time HWID binding\nPriority support",
      featured:     false
    }
  ];
}

/**
 * Fetch all keys from Firebase Realtime DB.
 * Falls back to localStorage cache.
 */
async function loadKeys() {
  try {
    const res = await fetch(CONFIG.firebase.keys, { cache: "no-store" });
    if (res.ok) {
      const raw = await res.json();
      if (raw && typeof raw === "object") {
        state.keys = Object.keys(raw).map(nodeId => ({
          id:         nodeId,
          key:        raw[nodeId].key || nodeId,
          expiresAt:  raw[nodeId].expiresAt   || null,
          createdAt:  raw[nodeId].createdAt   || null,
          maxDevices: raw[nodeId].maxDevices  || 1,
          packageId:  raw[nodeId].packageId   || null,
          status:     raw[nodeId].status      || "active",
          devices:    raw[nodeId].devices     || {},
          note:       raw[nodeId].note        || ""
        }));
        localStorage.setItem(CONFIG.storage.keys, JSON.stringify(state.keys));
        return;
      }
    }
  } catch (err) {
    console.warn("[NEXORA] keys fetch failed:", err.message);
  }

  const cached = localStorage.getItem(CONFIG.storage.keys);
  if (cached) {
    try { state.keys = JSON.parse(cached); } catch (_) { state.keys = []; }
  }
}


// ============================================================================
// C. STATS BAR RENDERER
// ============================================================================

function renderStats() {
  const now = Date.now();

  let activeCount = 0;
  let deviceCount = 0;

  state.keys.forEach(k => {
    const isExpired = k.expiresAt && Number(k.expiresAt) < now;
    if (k.status !== "revoked" && !isExpired) activeCount++;

    if (k.devices && typeof k.devices === "object") {
      deviceCount += Object.keys(k.devices).length;
    }
  });

  setEl("statKeysTotal",  state.keys.length  || 12);
  setEl("statKeysActive", activeCount         || 10);
  setEl("statDevices",    deviceCount         || 18);
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


// ============================================================================
// D. DURATION TAB SWITCHER
// ============================================================================

function bindDurationTabs() {
  const tabs = document.querySelectorAll(".duration-tab");
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const dur = tab.dataset.duration;
      if (!dur || dur === state.activeDuration) return;

      // Update active class
      tabs.forEach(t => t.classList.remove("duration-tab--active"));
      tab.classList.add("duration-tab--active");

      // Animate grid out, re-render, animate in
      const grid = document.getElementById("packageGrid");
      if (grid) {
        grid.classList.add("pricing__grid--transitioning");
        setTimeout(() => {
          state.activeDuration = dur;
          renderPackages();
          grid.classList.remove("pricing__grid--transitioning");
        }, 180);
      } else {
        state.activeDuration = dur;
        renderPackages();
      }
    });
  });
}


// ============================================================================
// E. PACKAGE GRID RENDERER — price dynamically adjusted by duration tab
// ============================================================================

/**
 * Returns the price for the given package at the current selected duration.
 * Falls back through day → month → year → any positive price.
 */
function getPriceForDuration(pkg, duration) {
  const priceKey = CONFIG.durations[duration]?.key;
  const candidate = pkg[priceKey];

  // If a valid price exists for this duration, use it
  if (candidate && Number(candidate) > 0) return Number(candidate);

  // For file-type products: single price regardless of duration
  if (pkg.type === "file") {
    return Number(pkg.price || pkg.priceMonth || pkg.priceDay || 0);
  }

  // Fallback chain
  const fallbacks = ["priceDay", "priceMonth", "priceYear", "price"];
  for (const k of fallbacks) {
    if (pkg[k] && Number(pkg[k]) > 0) return Number(pkg[k]);
  }
  return 0;
}

function formatVND(amount) {
  if (!amount || amount === 0) return "Liên hệ";
  return Number(amount).toLocaleString("vi-VN") + "₫";
}

function renderPackages() {
  const grid = document.getElementById("packageGrid");
  if (!grid) return;

  if (!state.packages.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:64px;color:var(--color-text-muted);font-family:var(--font-mono);">Chưa có gói License nào trên hệ thống.</div>`;
    return;
  }

  const dur        = state.activeDuration;
  const durInfo    = CONFIG.durations[dur];
  const durLabel   = durInfo?.label  || "24 Giờ";

  grid.innerHTML = state.packages.map(pkg => {
    const price        = getPriceForDuration(pkg, dur);
    const features     = (pkg.description || "").split("\n").filter(Boolean);
    const isLifetime   = dur === "lifetime";
    const deviceText   = `Tối đa ${pkg.maxDevices || 1} HWID device`;

    // Pricing sub-label
    const durationText = pkg.type === "file"
      ? "Mua 1 lần — Sở hữu vĩnh viễn"
      : (isLifetime ? "Vĩnh viễn — Không giới hạn" : `Hiệu lực: ${durLabel}`);

    return `
    <div class="pkg-card ${pkg.featured ? "pkg-card--featured" : ""}">
      <div class="pkg-card__header">
        <span class="pkg-card__type-badge">${pkg.category || "API Key"}</span>
        <h3 class="pkg-card__name">${pkg.name}</h3>
        <div class="pkg-card__price">
          ${formatVND(price)}
          <span class="pkg-card__price-suffix">/ ${dur === "day" ? "ngày" : dur === "month" ? "tháng" : dur === "year" ? "năm" : "Lifetime"}</span>
        </div>
        <div class="pkg-card__meta">
          <span>${durationText}</span>
          <span class="pkg-card__meta-separator"></span>
          <span>${deviceText}</span>
        </div>
      </div>

      <div class="pkg-card__body">
        <ul class="feature-list">
          ${features.length
            ? features.map(f => `<li class="feature-list__item">${SVG.check}<span>${f}</span></li>`).join("")
            : `<li class="feature-list__item">${SVG.check}<span>High-speed Firebase endpoint</span></li>
               <li class="feature-list__item">${SVG.check}<span>Strict 1-device HWID lock</span></li>`
          }
        </ul>
      </div>

      <div class="pkg-card__footer">
        <button class="btn btn--primary buy-pkg-btn" data-id="${pkg.id}" data-dur="${dur}">
          ${SVG.cart}
          Mua ${dur === "day" ? "Gói Ngày" : dur === "month" ? "Gói Tháng" : dur === "year" ? "Gói Năm" : "Lifetime"}
        </button>
      </div>
    </div>`;
  }).join("");

  // Bind buy buttons
  grid.querySelectorAll(".buy-pkg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      openBuyModal(btn.dataset.id, btn.dataset.dur);
    });
  });
}


// ============================================================================
// F. KEY CHECKER — validate Firebase Node ID, HWID, expiry, status
// ============================================================================

function bindKeyChecker() {
  const btn      = document.getElementById("checkKeyBtn");
  const input    = document.getElementById("checkKeyInput");
  const resultEl = document.getElementById("checkerResult");

  if (!btn || !input || !resultEl) return;

  btn.addEventListener("click", executeCheck);
  input.addEventListener("keydown", e => { if (e.key === "Enter") executeCheck(); });

  async function executeCheck() {
    const query = input.value.trim();
    if (!query) { showToast("Vui lòng nhập mã Key!"); return; }

    // Show loading state
    btn.disabled = true;
    btn.textContent = "Checking...";

    // Re-fetch keys to ensure fresh data
    await loadKeys();
    renderStats();

    btn.disabled = false;
    btn.innerHTML = `<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Check Key`;

    const normalizedQuery = query.toLowerCase().trim();
    const match = state.keys.find(k =>
      (k.id  && k.id.toLowerCase()  === normalizedQuery) ||
      (k.key && k.key.toLowerCase() === normalizedQuery)
    );

    resultEl.style.display = "block";

    if (!match) {
      renderCheckerResult(null, query);
      showToast("Key không tồn tại trong hệ thống Firebase!");
      return;
    }

    renderCheckerResult(match, query);
    showToast("Đã tra cứu thông tin Key thành công!");
  }
}

function renderCheckerResult(match, rawQuery) {
  if (!match) {
    setEl("resKeyCode",    rawQuery);
    setResultBadge("status-pill--revoked", "Not Found");
    setEl("resPkgName",   "Gói không xác định");
    setEl("resExpiry",    "N/A");
    setEl("resDevices",   "0/0 devices");
    setEl("resNote",      "Mã Key không tồn tại trong Firebase Realtime DB");
    setEl("resUidItems",  "—");
    return;
  }

  const now      = Date.now();
  const pkg      = state.packages.find(p => p.id === match.packageId);
  const maxDev   = match.maxDevices || pkg?.maxDevices || 1;

  // Collect registered device IDs
  let devices = [];
  if (match.devices && typeof match.devices === "object") {
    devices = Object.values(match.devices).map(d =>
      typeof d === "object" ? (d.uid || d.hwid || JSON.stringify(d)) : String(d)
    );
  }

  // Determine status
  const isExpired  = match.expiresAt && Number(match.expiresAt) < now;
  const isRevoked  = match.status === "revoked";

  let pillClass = "status-pill--active";
  let pillText  = "Active";

  if (isRevoked) {
    pillClass = "status-pill--revoked";
    pillText  = "Revoked";
  } else if (isExpired) {
    pillClass = "status-pill--expired";
    pillText  = "Expired";
  }

  setEl("resKeyCode",  match.key || match.id);
  setResultBadge(pillClass, pillText);
  setEl("resPkgName", pkg?.name || "NEXORA License");
  setEl("resExpiry",  match.expiresAt ? formatTimestamp(match.expiresAt) : "Vĩnh Viễn (Lifetime)");
  setEl("resDevices", `${devices.length} / ${maxDev} thiết bị HWID`);
  setEl("resNote",    match.note || "Key hợp lệ — Đã xác thực trên Firebase");
  setEl("resUidItems", devices.length ? devices.join(" | ") : "Chưa có thiết bị nào đăng ký");
}

function setResultBadge(cls, text) {
  const badge = document.getElementById("resStatusBadge");
  if (!badge) return;
  badge.className = `status-pill ${cls}`;
  badge.innerHTML = `<span class="status-pill__dot"></span>${text}`;
}


// ============================================================================
// G. BUY MODAL — Zalo contact & confirmation flow
// ============================================================================

function bindBuyModal() {
  const modal      = document.getElementById("buyModal");
  const fabBtn     = document.getElementById("floatBuyBtn");
  const heroBuyBtn = document.getElementById("heroBuyBtn");
  const closeBtn   = document.getElementById("modalCloseBtn");
  const confirmBtn = document.getElementById("modalConfirmBtn");
  const select     = document.getElementById("modalPkgSelect");

  if (!modal) return;

  // Open triggers
  if (fabBtn)     fabBtn.addEventListener("click",     () => openBuyModal(state.packages[0]?.id, state.activeDuration));
  if (heroBuyBtn) heroBuyBtn.addEventListener("click", () => openBuyModal(state.packages[0]?.id, state.activeDuration));

  // Close triggers
  if (closeBtn) closeBtn.addEventListener("click", closeBuyModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeBuyModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeBuyModal(); });

  // Package select change → update summary
  if (select) select.addEventListener("change", updateModalSummary);

  // Confirm → open Zalo with pre-filled message
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const pkgId  = select?.value;
      const pkg    = state.packages.find(p => p.id === pkgId);
      const dur    = state.activeDuration;
      const durInfo = CONFIG.durations[dur];
      const price  = pkg ? getPriceForDuration(pkg, dur) : 0;

      if (!pkg) { showToast("Vui lòng chọn gói License trước!"); return; }

      const msgParts = [
        `Xin chào NEXORA KEY!`,
        `Tôi muốn mua: [${pkg.name}]`,
        `Gói thời hạn: ${durInfo?.label || "Gói Tháng"}`,
        `Giá: ${formatVND(price)}`,
        `Yêu cầu: 1 thiết bị HWID`,
        `Vui lòng hướng dẫn thanh toán.`
      ];

      const text = encodeURIComponent(msgParts.join("\n"));
      window.open(`https://zalo.me/${CONFIG.zaloPhone}?text=${text}`, "_blank");
      closeBuyModal();
      showToast("Đã mở Zalo! Vui lòng gửi tin nhắn để đặt mua.");
    });
  }
}

function openBuyModal(pkgId, dur) {
  const modal  = document.getElementById("buyModal");
  const select = document.getElementById("modalPkgSelect");
  if (!modal || !select) return;

  // Populate select options
  select.innerHTML = state.packages.map(p => {
    const price = getPriceForDuration(p, dur || state.activeDuration);
    return `<option value="${p.id}" ${p.id === pkgId ? "selected" : ""}>${p.name} — ${formatVND(price)}</option>`;
  }).join("");

  updateModalSummary(dur);
  modal.classList.add("modal--open");
}

function updateModalSummary(dur) {
  const select  = document.getElementById("modalPkgSelect");
  if (!select) return;

  const pkgId   = select.value;
  const pkg     = state.packages.find(p => p.id === pkgId);
  if (!pkg) return;

  const activeDur = typeof dur === "string" ? dur : state.activeDuration;
  const price     = getPriceForDuration(pkg, activeDur);
  const durInfo   = CONFIG.durations[activeDur];

  setEl("modalMaxDev",     `1 thiết bị HWID (cố định)`);
  setEl("modalDuration",   durInfo?.label || "30 ngày");
  setEl("modalTotalPrice", formatVND(price));
}

function closeBuyModal() {
  const modal = document.getElementById("buyModal");
  if (modal) modal.classList.remove("modal--open");
}


// ============================================================================
// H. CODE INTEGRATION SNIPPET TABS
// ============================================================================

function bindCodeTabs() {
  const tabs   = document.querySelectorAll(".code-tab");
  const blocks = document.querySelectorAll(".code-block");
  const copyBtn = document.getElementById("copyCodeBtn");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t   => t.classList.remove("code-tab--active"));
      blocks.forEach(b => b.classList.remove("code-block--active"));
      tab.classList.add("code-tab--active");
      const target = document.getElementById(`code-${tab.dataset.lang}`);
      if (target) target.classList.add("code-block--active");
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const activeBlock = document.querySelector(".code-block.code-block--active");
      if (activeBlock) {
        navigator.clipboard.writeText(activeBlock.textContent.trim()).then(() => {
          showToast("Đã copy đoạn mã tích hợp vào clipboard!");
          copyBtn.textContent = "COPIED!";
          setTimeout(() => { copyBtn.textContent = "COPY"; }, 1600);
        });
      }
    });
  }
}


// ============================================================================
// I. API SANDBOX CONSOLE
// ============================================================================

function bindSandbox() {
  const btn     = document.getElementById("sendApiTestBtn");
  const console = document.getElementById("sandboxConsole");

  if (!btn || !console) return;

  btn.addEventListener("click", async () => {
    console.textContent = "// Connecting to Firebase Realtime Database...\n// GET " + CONFIG.firebase.keys;
    try {
      const start  = Date.now();
      const res    = await fetch(CONFIG.firebase.keys, { cache: "no-store" });
      const data   = await res.json();
      const latency = Date.now() - start;

      const payload = {
        http_status:  res.status,
        ok:           res.ok,
        latency_ms:   latency,
        endpoint:     CONFIG.firebase.keys,
        timestamp:    new Date().toISOString(),
        total_keys:   data ? Object.keys(data).length : 0,
        sample:       data
      };

      console.textContent = JSON.stringify(payload, null, 2);
      showToast(`Firebase Response: ${res.status} OK — ${latency}ms`);
    } catch (err) {
      console.textContent = JSON.stringify({ error: err.message, endpoint: CONFIG.firebase.keys }, null, 2);
    }
  });
}


// ============================================================================
// J. FAQ ACCORDION
// ============================================================================

function bindFaq() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach(item => {
    const q = item.querySelector(".faq-item__question");
    if (q) {
      q.addEventListener("click", () => {
        const isActive = item.classList.contains("faq-item--active");
        items.forEach(i => i.classList.remove("faq-item--active"));
        if (!isActive) item.classList.add("faq-item--active");
      });
    }
  });
}


// ============================================================================
// K. TOAST NOTIFICATION SYSTEM
// ============================================================================

let _toastTimer = null;

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("toast--visible");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("toast--visible"), 2600);
}


// ============================================================================
// L. UTILITY HELPERS
// ============================================================================

/** Format a Unix timestamp (ms or ISO string) to Vietnamese date format */
function formatTimestamp(ts) {
  if (!ts) return "Vĩnh Viễn";
  const num = Number(ts);
  const d   = isNaN(num) ? new Date(ts) : new Date(num);
  if (isNaN(d.getTime())) return "Vĩnh Viễn";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Set footer year */
function setFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}


// ============================================================================
// ENTRY POINT
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  setFooterYear();

  // Parallel load both Firebase sources
  await Promise.all([loadPackages(), loadKeys()]);

  // Render initial UI
  renderStats();
  bindDurationTabs();
  renderPackages();       // Default: Day pricing displayed first
  bindKeyChecker();
  bindBuyModal();
  bindCodeTabs();
  bindSandbox();
  bindFaq();
});
