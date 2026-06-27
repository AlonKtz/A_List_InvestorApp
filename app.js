const { Client, Account, Databases, ID, Query, Permission, Role } = Appwrite;

// ── Sector auto-detect map ──
const SECTOR_MAP = {
  // Technology
  AAPL:'Technology', MSFT:'Technology', GOOGL:'Technology', GOOG:'Technology',
  META:'Technology', NVDA:'Technology', AMZN:'Technology', TSLA:'Technology',
  NFLX:'Technology', AMD:'Technology', INTC:'Technology', CRM:'Technology',
  ADBE:'Technology', ORCL:'Technology', CSCO:'Technology', QCOM:'Technology',
  UBER:'Technology', PYPL:'Technology', SHOP:'Technology', SQ:'Technology',
  SNAP:'Technology', SPOT:'Technology', TWLO:'Technology', NET:'Technology',
  // Finance
  JPM:'Finance', BAC:'Finance', GS:'Finance', MS:'Finance', WFC:'Finance',
  C:'Finance', BLK:'Finance', V:'Finance', MA:'Finance', AXP:'Finance', COF:'Finance',
  // Healthcare
  JNJ:'Healthcare', PFE:'Healthcare', MRNA:'Healthcare', UNH:'Healthcare',
  CVS:'Healthcare', ABBV:'Healthcare', LLY:'Healthcare', MRK:'Healthcare',
  BMY:'Healthcare', AMGN:'Healthcare', GILD:'Healthcare', ISRG:'Healthcare',
  // Energy
  XOM:'Energy', CVX:'Energy', COP:'Energy', SLB:'Energy', OXY:'Energy',
  BP:'Energy', SHEL:'Energy', MPC:'Energy',
  // Consumer
  WMT:'Consumer', TGT:'Consumer', COST:'Consumer', HD:'Consumer', LOW:'Consumer',
  MCD:'Consumer', SBUX:'Consumer', NKE:'Consumer', DIS:'Consumer',
  KO:'Consumer', PEP:'Consumer', PG:'Consumer',
  // Industrials
  BA:'Industrials', CAT:'Industrials', GE:'Industrials', MMM:'Industrials',
  HON:'Industrials', UPS:'Industrials', FDX:'Industrials', RTX:'Industrials',
  // Real Estate
  AMT:'Real Estate', PLD:'Real Estate', EQIX:'Real Estate', SPG:'Real Estate',
};

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

// ── Sector auto-fill on ticker input ──
document.getElementById('trade-stock').addEventListener('input', (e) => {
  const ticker  = e.target.value.trim().toUpperCase();
  const sector  = SECTOR_MAP[ticker] || 'Other';
  const badge   = document.getElementById('sector-badge');
  const hidden  = document.getElementById('trade-sector');
  badge.textContent = ticker ? sector : 'Sector will auto-fill';
  badge.classList.toggle('text-emerald-400', !!ticker);
  badge.classList.toggle('text-slate-400',   !ticker);
  hidden.value = sector;
});

// ── T10: Insert trade ──
document.getElementById('form-trade').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn   = document.getElementById('btn-log-trade');
  const errEl = document.getElementById('trade-error');
  errEl.classList.add('hidden');
  btn.disabled    = true;
  btn.textContent = 'Saving…';

  const stock    = document.getElementById('trade-stock').value.trim().toUpperCase();
  const sector   = document.getElementById('trade-sector').value || 'Other';
  const buyPrice = parseFloat(document.getElementById('trade-entry-price').value);
  const sellPrice= parseFloat(document.getElementById('trade-exit-price').value);
  const category = document.getElementById('trade-order-category').value;
  const date     = document.getElementById('trade-date').value;

  // Derive entry_time / exit_time from date + order category
  const holdDays = { 'Day Trade': 0, 'Short Sell': 0, 'Swing Trade': 5, 'Long Position': 30 };
  const entryTime = `${date}T09:30:00`;
  const exitDate  = new Date(date);
  exitDate.setDate(exitDate.getDate() + (holdDays[category] ?? 0));
  const exitTime  = `${exitDate.toISOString().slice(0, 10)}T16:00:00`;

  try {
    const user = await account.get();
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      ID.unique(),
      { stock, sector, entry_price: buyPrice, exit_price: sellPrice,
        entry_time: entryTime, exit_time: exitTime, order_category: category },
      [Permission.read(Role.user(user.$id)), Permission.write(Role.user(user.$id))]
    );

    e.target.reset();
    document.getElementById('sector-badge').textContent = 'Sector will auto-fill';
    document.getElementById('sector-badge').classList.remove('text-emerald-400');
    document.getElementById('sector-badge').classList.add('text-slate-400');
    btn.textContent = '✓ Logged!';
    setTimeout(() => { btn.textContent = 'Log Trade'; }, 1500);
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

const CATEGORY_BADGE = {
  'Day Trade':     'bg-blue-900/50 text-blue-300',
  'Swing Trade':   'bg-purple-900/50 text-purple-300',
  'Long Position': 'bg-emerald-900/50 text-emerald-300',
  'Short Sell':    'bg-orange-900/50 text-orange-300',
};

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
    const catCls  = CATEGORY_BADGE[t.order_category] || 'bg-slate-800 text-slate-400';
    const date    = t.entry_time ? t.entry_time.slice(0, 10) : '—';

    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
        <td class="py-3 pr-6 font-bold">${t.stock}</td>
        <td class="py-3 pr-6 text-slate-400 text-sm">${t.sector}</td>
        <td class="py-3 pr-6">$${parseFloat(t.entry_price).toFixed(2)}</td>
        <td class="py-3 pr-6">$${parseFloat(t.exit_price).toFixed(2)}</td>
        <td class="py-3 pr-6 font-bold ${pnlCls}">${pnlSign}$${pnl}</td>
        <td class="py-3 pr-6"><span class="px-2 py-1 rounded-md text-xs font-semibold ${catCls}">${t.order_category || '—'}</span></td>
        <td class="py-3 text-slate-500 text-xs">—</td>
      </tr>`;
  }).join('');
}

init();
