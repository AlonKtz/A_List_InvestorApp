const { Client, Account, Databases, ID, Query, Permission, Role } = Appwrite;

// ── Client ──
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account   = new Account(client);
const databases = new Databases(client);

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
  loadTrades();
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

// ── T10: Insert trade ──
document.getElementById('form-trade').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn   = document.getElementById('btn-log-trade');
  const errEl = document.getElementById('trade-error');
  errEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const entryTime = document.getElementById('trade-entry-time').value;
  const exitTime  = document.getElementById('trade-exit-time').value;

  if (new Date(exitTime) <= new Date(entryTime)) {
    errEl.textContent = 'Exit time must be after entry time.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Log Trade';
    return;
  }

  try {
    const user = await account.get();
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      ID.unique(),
      {
        stock:       document.getElementById('trade-stock').value.trim().toUpperCase(),
        sector:      document.getElementById('trade-sector').value,
        entry_price: parseFloat(document.getElementById('trade-entry-price').value),
        exit_price:  parseFloat(document.getElementById('trade-exit-price').value),
        entry_time:  entryTime,
        exit_time:   exitTime,
      },
      [
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
      ]
    );

    e.target.reset();
    btn.textContent = 'Logged!';
    setTimeout(() => { btn.textContent = 'Log Trade'; }, 1500);

    // Switch back to dashboard and refresh
    navDashboard.click();
    loadTrades();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    btn.textContent = 'Log Trade';
  } finally {
    btn.disabled = false;
  }
});

// ── T11: Fetch trades + render history table ──
let allTrades = [];

async function loadTrades() {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      [Query.orderDesc('entry_time'), Query.limit(200)]
    );
    allTrades = res.documents;
    renderTable(allTrades);
  } catch (err) {
    console.error('Failed to load trades:', err);
  }
}

function formatHold(entryTime, exitTime) {
  const mins = Math.round((new Date(exitTime) - new Date(entryTime)) / 60000);
  if (mins < 60)  return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

function renderTable(trades) {
  const tbody = document.getElementById('trades-table-body');
  if (!trades.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="py-10 text-center text-slate-600">No trades logged yet.</td></tr>';
    return;
  }

  tbody.innerHTML = trades.map(t => {
    const pnl     = (t.exit_price - t.entry_price).toFixed(2);
    const pnlCls  = pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
    const pnlSign = pnl >= 0 ? '+' : '';
    const hold    = formatHold(t.entry_time, t.exit_time);

    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
        <td class="py-3 pr-6 font-bold">${t.stock}</td>
        <td class="py-3 pr-6 text-slate-400">${t.sector}</td>
        <td class="py-3 pr-6">$${parseFloat(t.entry_price).toFixed(2)}</td>
        <td class="py-3 pr-6">$${parseFloat(t.exit_price).toFixed(2)}</td>
        <td class="py-3 pr-6 font-bold ${pnlCls}">${pnlSign}$${pnl}</td>
        <td class="py-3 pr-6 text-slate-400">${hold}</td>
        <td class="py-3 text-slate-500 text-xs">—</td>
      </tr>`;
  }).join('');
}

init();
