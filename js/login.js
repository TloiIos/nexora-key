/**
 * NEXORA KEY — Authentication Portal Controller
 * Version: 8.0.0
 * Features: Dual Tab (Login/Register), Local Storage User Registry, Session Persistence, Password Toggling
 */

const AUTH_CONFIG = {
  defaultUser: "admin",
  defaultPassword: "admin123",
  sessionKey: "nexora_admin_session",
  rememberKey: "nexora_remember_session",
  customerSessionKey: "nexora_customer_session",
  customerRememberKey: "nexora_customer_remember",
  usersRegistryKey: "nexora_users_registry_v8"
};

const ICONS = {
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`
};

document.addEventListener("DOMContentLoaded", initAuth);

function initAuth() {
  initTabs();
  initPasswordToggle();
  initLoginForm();
  initRegisterForm();
  initUserRegistry();
}

function initTabs() {
  const loginTab = document.getElementById("tabLoginBtn");
  const regTab = document.getElementById("tabRegisterBtn");
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("registerForm");

  if (!loginTab || !regTab || !loginForm || !regForm) return;

  loginTab.addEventListener("click", () => {
    loginTab.classList.add("auth-tab--active");
    regTab.classList.remove("auth-tab--active");
    loginForm.style.display = "flex";
    regForm.style.display = "none";
    clearErrors();
  });

  regTab.addEventListener("click", () => {
    regTab.classList.add("auth-tab--active");
    loginTab.classList.remove("auth-tab--active");
    regForm.style.display = "flex";
    loginForm.style.display = "none";
    clearErrors();
  });
}

function initPasswordToggle() {
  const toggleBtn = document.getElementById("toggleLoginPw");
  const pwInput = document.getElementById("loginPw");

  if (!toggleBtn || !pwInput) return;

  toggleBtn.addEventListener("click", () => {
    const isPw = pwInput.type === "password";
    pwInput.type = isPw ? "text" : "password";
    toggleBtn.innerHTML = isPw ? ICONS.eyeOff : ICONS.eye;
  });
}

function initUserRegistry() {
  let registry = localStorage.getItem(AUTH_CONFIG.usersRegistryKey);
  if (!registry) {
    const defaultRegistry = [
      { username: AUTH_CONFIG.defaultUser, password: AUTH_CONFIG.defaultPassword, email: "admin@nexorakey.io", role: "SuperAdmin" }
    ];
    localStorage.setItem(AUTH_CONFIG.usersRegistryKey, JSON.stringify(defaultRegistry));
  }
}

function getUsersRegistry() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_CONFIG.usersRegistryKey)) || [];
  } catch (e) {
    return [{ username: AUTH_CONFIG.defaultUser, password: AUTH_CONFIG.defaultPassword }];
  }
}

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors();

    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPw").value;
    const remember = document.getElementById("rememberMe").checked;
    const errorEl = document.getElementById("loginError");

    const registry = getUsersRegistry();
    const user = registry.find(user => user.username.toLowerCase() === u.toLowerCase() && user.password === p);
    const isAdminFallback = u === AUTH_CONFIG.defaultUser && p === AUTH_CONFIG.defaultPassword;

    if (isAdminFallback) {
      if (remember) {
        localStorage.setItem(AUTH_CONFIG.rememberKey, "1");
        localStorage.setItem("nexora_active_user", u);
      } else {
        sessionStorage.setItem(AUTH_CONFIG.sessionKey, "1");
        sessionStorage.setItem("nexora_active_user", u);
      }
      toast("Đăng nhập admin thành công! Đang chuyển hướng...");
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 600);
    } else if (user) {
      if (remember) {
        localStorage.setItem(AUTH_CONFIG.customerRememberKey, "1");
        localStorage.setItem("nexora_customer_user", u);
      } else {
        sessionStorage.setItem(AUTH_CONFIG.customerSessionKey, "1");
        sessionStorage.setItem("nexora_customer_user", u);
      }
      toast("Đăng nhập khách hàng thành công!" );
      setTimeout(() => {
        window.location.href = "index.html";
      }, 600);
    } else {
      if (errorEl) errorEl.textContent = "Tài khoản hoặc mật khẩu không chính xác!";
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors();

    const u = document.getElementById("regUser").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const p = document.getElementById("regPw").value;
    const confirmP = document.getElementById("regConfirmPw").value;
    const errorEl = document.getElementById("regError");
    const successEl = document.getElementById("regSuccess");

    if (u.length < 3) {
      if (errorEl) errorEl.textContent = "Tên tài khoản phải từ 3 ký tự trở lên!";
      return;
    }

    if (p.length < 6) {
      if (errorEl) errorEl.textContent = "Mật khẩu phải chứa ít nhất 6 ký tự!";
      return;
    }

    if (p !== confirmP) {
      if (errorEl) errorEl.textContent = "Mật khẩu xác nhận không trùng khớp!";
      return;
    }

    const registry = getUsersRegistry();
    if (registry.some(user => user.username.toLowerCase() === u.toLowerCase())) {
      if (errorEl) errorEl.textContent = "Tên tài khoản này đã được sử dụng!";
      return;
    }

    registry.push({ username: u, password: p, email: email, role: "Customer", registeredAt: new Date().toISOString() });
    localStorage.setItem(AUTH_CONFIG.usersRegistryKey, JSON.stringify(registry));

    if (successEl) successEl.textContent = "Đăng ký khách hàng thành công! Tài khoản này không dùng để truy cập admin.";
    toast("Tạo tài khoản khách hàng thành công!");
    form.reset();
  });
}

function clearErrors() {
  const loginErr = document.getElementById("loginError");
  const regErr = document.getElementById("regError");
  const regSucc = document.getElementById("regSuccess");

  if (loginErr) loginErr.textContent = "";
  if (regErr) regErr.textContent = "";
  if (regSucc) regSucc.textContent = "";
}

let toastTimer;
function toast(msg) {
  let t = document.getElementById("authToast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visible"), 2400);
}
