import { Client, Account, ID } from 'https://cdn.jsdelivr.net/npm/appwrite/dist/esm/sdk.mjs';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './config.js';

// ── Client ──
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);

// ── Auth tab toggle ──
const tabLogin  = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const formLogin  = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');

tabLogin.addEventListener('click', () => {
  formLogin.classList.remove('hidden');
  formSignup.classList.add('hidden');
  tabLogin.classList.add('bg-emerald-500', 'text-white');
  tabLogin.classList.remove('text-slate-400');
  tabSignup.classList.remove('bg-emerald-500', 'text-white');
  tabSignup.classList.add('text-slate-400');
});

tabSignup.addEventListener('click', () => {
  formSignup.classList.remove('hidden');
  formLogin.classList.add('hidden');
  tabSignup.classList.add('bg-emerald-500', 'text-white');
  tabSignup.classList.remove('text-slate-400');
  tabLogin.classList.remove('bg-emerald-500', 'text-white');
  tabLogin.classList.add('text-slate-400');
});

// ── Login ──
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.classList.add('hidden');

  try {
    await account.createEmailPasswordSession(email, password);
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});

// ── Sign up ──
formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errEl    = document.getElementById('signup-error');
  errEl.classList.add('hidden');

  try {
    await account.create(ID.unique(), email, password);
    await account.createEmailPasswordSession(email, password);
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});

// ── Logout ──
document.getElementById('btn-logout').addEventListener('click', async () => {
  await account.deleteSession('current');
  location.reload();
});

// ── Nav tab switching ──
const navDashboard = document.getElementById('nav-dashboard');
const navLog       = document.getElementById('nav-log');
const viewDashboard = document.getElementById('view-dashboard');
const viewLog       = document.getElementById('view-log');

navDashboard.addEventListener('click', () => {
  viewDashboard.classList.remove('hidden');
  viewLog.classList.add('hidden');
  navDashboard.classList.add('bg-emerald-500', 'text-white');
  navDashboard.classList.remove('text-slate-400');
  navLog.classList.remove('bg-emerald-500', 'text-white');
  navLog.classList.add('text-slate-400');
});

navLog.addEventListener('click', () => {
  viewLog.classList.remove('hidden');
  viewDashboard.classList.add('hidden');
  navLog.classList.add('bg-emerald-500', 'text-white');
  navLog.classList.remove('text-slate-400');
  navDashboard.classList.remove('bg-emerald-500', 'text-white');
  navDashboard.classList.add('text-slate-400');
});

// ── Show / hide screens ──
function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
}

// ── Session check on load ──
async function init() {
  try {
    await account.get();
    showApp();
  } catch {
    // not logged in — auth screen already visible
  }
}

init();
