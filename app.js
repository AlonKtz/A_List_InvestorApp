const { Client, Account, Databases, ID, Query, Permission, Role } = Appwrite;

// P&L accounts for direction: Short Sell profits when price falls
function calcPnl(t) {
  const diff = parseFloat(t.exit_price) - parseFloat(t.entry_price);
  const qty  = t.quantity || 1;
  return t.order_category === 'Short Sell' ? -diff * qty : diff * qty;
}

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
  const btn      = formLogin.querySelector('button[type="submit"]');
  errEl.classList.add('hidden');
  btn.disabled = true; btn.textContent = 'Logging in…';

  try {
    await account.createEmailPasswordSession(email, password);
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Log In';
  }
});

// ── Sign up ──
formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errEl    = document.getElementById('signup-error');
  const btn      = formSignup.querySelector('button[type="submit"]');
  errEl.classList.add('hidden');
  btn.disabled = true; btn.textContent = 'Creating account…';

  try {
    await account.create(ID.unique(), email, password);
    await account.createEmailPasswordSession(email, password);
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Create Account';
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
  document.getElementById('price-info').textContent = '';
});

// ── Finnhub: fetch current price ──
document.getElementById('btn-fetch-price').addEventListener('click', async () => {
  const ticker  = document.getElementById('trade-stock').value.trim().toUpperCase();
  const infoEl  = document.getElementById('price-info');
  const btn     = document.getElementById('btn-fetch-price');
  if (!ticker) { infoEl.textContent = 'Enter a ticker first.'; return; }

  btn.disabled = true;
  infoEl.textContent = 'Fetching…';

  try {
    const res  = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();

    if (!data.c || data.c === 0) {
      infoEl.textContent = `Unknown ticker: ${ticker}`;
      return;
    }

    // Fill buy price
    document.getElementById('trade-entry-price').value = data.c.toFixed(2);

    // Show info: price, change%, timestamp in Jerusalem time
    const sign  = data.d >= 0 ? '+' : '';
    const ts    = data.t
      ? new Date(data.t * 1000).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false })
      : '';
    infoEl.innerHTML =
      `<span class="text-white font-bold">$${data.c.toFixed(2)}</span>` +
      `<span class="${data.d >= 0 ? 'text-emerald-400' : 'text-red-400'} ml-2">${sign}${data.dp.toFixed(2)}%</span>` +
      (ts ? `<span class="text-slate-600 ml-2">${ts} IL</span>` : '');
  } catch (err) {
    infoEl.textContent = 'Price fetch failed.';
  } finally {
    btn.disabled = false;
  }
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
  const quantity = parseInt(document.getElementById('trade-quantity').value, 10);
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
        entry_time: entryTime, exit_time: exitTime, order_category: category, quantity },
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

// ── T11: Fetch trades + render everything ──
let allTrades = [];

async function loadTrades() {
  const loading = document.getElementById('dashboard-loading');
  const error   = document.getElementById('dashboard-error');
  const content = document.getElementById('dashboard-content');

  loading.classList.remove('hidden');
  error.classList.add('hidden');
  content.classList.add('hidden');

  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      [Query.orderDesc('$createdAt'), Query.limit(200)]
    );
    allTrades = res.documents;
    const chrono = [...allTrades].sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
    const tagMap = buildTagMap(chrono);
    renderTable(allTrades, tagMap);
    computeMetrics(chrono);
    renderTimeline(chrono, tagMap);
    renderCharts(chrono);
    content.classList.remove('hidden');
  } catch (err) {
    document.getElementById('dashboard-error-msg').textContent = err.message;
    error.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}

// ── T12–T14: Behavioral metrics ──
function computeMetrics(chrono) {
  const n = chrono.length;
  const pnl = t => calcPnl(t);

  // Panic Exit Rate — Day Trades that lost / all Day Trades
  const dayTrades   = chrono.filter(t => t.order_category === 'Day Trade');
  const panicExits  = dayTrades.filter(t => pnl(t) < 0);
  const panicRate   = dayTrades.length ? Math.round(panicExits.length / dayTrades.length * 100) : null;
  const composure   = panicRate !== null ? 100 - panicRate : null;

  const panicEl  = document.getElementById('stat-panic');
  const panicBar = document.getElementById('stat-panic-bar');
  if (composure !== null) {
    panicEl.textContent = composure;
    panicEl.className   = `text-5xl font-black mt-2 ${composure >= 70 ? 'text-emerald-400' : composure >= 40 ? 'text-yellow-400' : 'text-red-400'}`;
    panicBar.style.width     = `${composure}%`;
    panicBar.className       = `h-full rounded-full transition-all duration-700 ${composure >= 70 ? 'bg-emerald-400' : composure >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`;
  } else {
    panicEl.textContent = 'N/A';
    panicEl.className   = 'text-5xl font-black mt-2 text-slate-500';
  }

  // FOMO Tax — losses on trades entered same date as a prior winning trade
  let fomoTax = 0, fomoCount = 0;
  for (let i = 1; i < n; i++) {
    const prevPnl  = pnl(chrono[i - 1]);
    const currPnl  = pnl(chrono[i]);
    const sameDay  = chrono[i - 1].entry_time?.slice(0, 10) === chrono[i].entry_time?.slice(0, 10);
    if (prevPnl > 0 && sameDay && currPnl < 0) { fomoTax += currPnl; fomoCount++; }
  }
  const fomoEl  = document.getElementById('stat-fomo');
  const fomoSub = document.getElementById('stat-fomo-sub');
  fomoEl.textContent = fomoCount ? `-$${Math.abs(fomoTax).toFixed(0)}` : '$0';
  fomoEl.className   = `text-5xl font-black mt-2 ${fomoTax < 0 ? 'text-red-400' : 'text-slate-400'}`;
  fomoSub.textContent = fomoCount ? `${fomoCount} chaser trade${fomoCount > 1 ? 's' : ''} identified` : 'No chasing detected yet';

  // Tilt Multiplier — avg loss size after a prior loss vs overall avg loss
  const allLosses = chrono.filter(t => pnl(t) < 0).map(t => Math.abs(pnl(t)));
  const avgLoss   = allLosses.length ? allLosses.reduce((a, b) => a + b, 0) / allLosses.length : 0;
  const postLossLosses = [];
  for (let i = 1; i < n; i++) {
    if (pnl(chrono[i - 1]) < 0 && pnl(chrono[i]) < 0)
      postLossLosses.push(Math.abs(pnl(chrono[i])));
  }
  const avgPost   = postLossLosses.length ? postLossLosses.reduce((a, b) => a + b, 0) / postLossLosses.length : null;
  const tiltMult  = avgLoss > 0 && avgPost !== null ? avgPost / avgLoss : null;

  const tiltEl  = document.getElementById('stat-tilt');
  const tiltSub = document.getElementById('stat-tilt-sub');
  if (tiltMult !== null) {
    tiltEl.textContent = `${tiltMult.toFixed(1)}x`;
    tiltEl.className   = `text-5xl font-black mt-2 ${tiltMult > 1.2 ? 'text-red-400' : 'text-emerald-400'}`;
    tiltSub.textContent = tiltMult > 1.2 ? '⚠ You lose bigger after a loss' : '✓ Losses stay consistent';
  } else {
    tiltEl.textContent  = 'N/A';
    tiltEl.className    = 'text-5xl font-black mt-2 text-slate-500';
    tiltSub.textContent = 'Need consecutive losses to measure';
  }
}

// ── T15–T16: Trade Autopsy tagging + timeline ──
const TAG_STYLE = {
  PANIC_EXIT:     { bg: 'bg-red-500',     label: 'Panic Exit' },
  EUPHORIA_TRADE: { bg: 'bg-yellow-500',  label: 'Euphoria' },
  REVENGE_TRADE:  { bg: 'bg-orange-500',  label: 'Revenge' },
  TUNNEL_VISION:  { bg: 'bg-purple-500',  label: 'Tunnel Vision' },
  CLEAN:          { bg: 'bg-emerald-600', label: 'Clean' },
};

function tagTrade(t, i, chrono) {
  const pnl = x => calcPnl(x);
  if (i >= 3 && chrono.slice(i - 3, i).every(x => x.sector === t.sector)) return 'TUNNEL_VISION';
  if (i > 0 && pnl(chrono[i - 1]) < 0) return 'REVENGE_TRADE';
  if (i > 0 && pnl(chrono[i - 1]) > 0 &&
      chrono[i - 1].entry_time?.slice(0, 10) === t.entry_time?.slice(0, 10)) return 'EUPHORIA_TRADE';
  if (t.order_category === 'Day Trade' && pnl(t) < 0) return 'PANIC_EXIT';
  return 'CLEAN';
}

function buildTagMap(chrono) {
  const map = {};
  chrono.forEach((t, i) => { map[t.$id] = tagTrade(t, i, chrono); });
  return map;
}

function renderTimeline(chrono, tagMap) {
  const container = document.getElementById('timeline');
  const empty     = document.getElementById('timeline-empty');
  container.querySelectorAll('.trade-dot').forEach(el => el.remove());
  if (!chrono.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  chrono.forEach(t => {
    const tag    = tagMap[t.$id] || 'CLEAN';
    const style  = TAG_STYLE[tag];
    const p      = calcPnl(t);
    const pSign  = p >= 0 ? '+' : '';
    const ring   = p >= 0 ? 'ring-emerald-400' : 'ring-red-400';

    const dot = document.createElement('div');
    dot.className = 'trade-dot relative flex-shrink-0 group cursor-default';
    dot.innerHTML = `
      <div class="w-12 h-12 rounded-full ${style.bg} ${ring} ring-2 flex items-center justify-center text-white font-bold text-xs">
        ${t.stock.slice(0, 4)}
      </div>
      <div class="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs w-36 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
        <p class="font-bold">${t.stock}</p>
        <p class="${p >= 0 ? 'text-emerald-400' : 'text-red-400'}">${pSign}$${Math.abs(p).toFixed(2)}</p>
        <p class="text-slate-300 mt-1 font-semibold">${style.label}</p>
      </div>`;
    container.appendChild(dot);
  });
}

// ── T17–T18: Charts ──
let sectorChart = null;
let pnlChart    = null;
let tagsChart   = null;

function renderCharts(chrono) {
  // Sector bar chart
  const counts = {};
  chrono.forEach(t => { counts[t.sector] = (counts[t.sector] || 0) + 1; });
  if (sectorChart) sectorChart.destroy();
  sectorChart = new Chart(document.getElementById('chart-sector'), {
    type: 'bar',
    data: {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts), backgroundColor: '#10b981', borderRadius: 6 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: '#1e293b' } }
      }
    }
  });

  // Cumulative P&L line chart
  let cum = 0;
  const pnlPoints = chrono.map(t => {
    cum += calcPnl(t);
    return parseFloat(cum.toFixed(2));
  });
  // Behavioral breakdown pie chart
  const tagOrder  = ['CLEAN', 'PANIC_EXIT', 'EUPHORIA_TRADE', 'REVENGE_TRADE', 'TUNNEL_VISION'];
  const tagLabels = ['Clean', 'Panic Exit', 'Euphoria', 'Revenge', 'Tunnel Vision'];
  const tagColors = ['#059669', '#ef4444', '#eab308', '#f97316', '#a855f7'];
  const pieTagMap = buildTagMap(chrono);
  const tagCounts = tagOrder.map(tag => chrono.filter(t => pieTagMap[t.$id] === tag).length);

  if (tagsChart) tagsChart.destroy();
  tagsChart = new Chart(document.getElementById('chart-tags'), {
    type: 'pie',
    data: {
      labels: tagLabels,
      datasets: [{ data: tagCounts, backgroundColor: tagColors, borderWidth: 0 }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', padding: 12, font: { size: 11 } }
        }
      }
    }
  });

  if (pnlChart) pnlChart.destroy();
  pnlChart = new Chart(document.getElementById('chart-pnl'), {
    type: 'line',
    data: {
      labels: chrono.map(t => t.stock),
      datasets: [{
        data: pnlPoints,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: pnlPoints.map(v => v >= 0 ? '#10b981' : '#ef4444'),
        pointRadius: 5,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
      }
    }
  });
}

const CATEGORY_BADGE = {
  'Day Trade':     'bg-blue-900/50 text-blue-300',
  'Swing Trade':   'bg-purple-900/50 text-purple-300',
  'Long Position': 'bg-emerald-900/50 text-emerald-300',
  'Short Sell':    'bg-orange-900/50 text-orange-300',
};

function renderTable(trades, tagMap = {}) {
  const tbody = document.getElementById('trades-table-body');
  if (!trades.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="py-10 text-center text-slate-600">No trades logged yet.</td></tr>';
    return;
  }

  tbody.innerHTML = trades.map(t => {
    const pnl     = calcPnl(t).toFixed(2);
    const pnlCls  = pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
    const pnlSign = pnl >= 0 ? '+' : '';
    const catCls  = CATEGORY_BADGE[t.order_category] || 'bg-slate-800 text-slate-400';
    const tag     = tagMap[t.$id];
    const tagStyle = TAG_STYLE[tag];
    const date    = t.entry_time ? t.entry_time.slice(0, 10) : '—';

    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
        <td class="py-3 pr-6 font-bold">${t.stock}</td>
        <td class="py-3 pr-6 text-slate-400 text-sm">${t.sector}</td>
        <td class="py-3 pr-6 text-slate-300">${t.quantity || 1}</td>
        <td class="py-3 pr-6">$${parseFloat(t.entry_price).toFixed(2)}</td>
        <td class="py-3 pr-6">$${parseFloat(t.exit_price).toFixed(2)}</td>
        <td class="py-3 pr-6 font-bold ${pnlCls}">${pnlSign}$${pnl}</td>
        <td class="py-3 pr-6"><span class="px-2 py-1 rounded-md text-xs font-semibold ${catCls}">${t.order_category || '—'}</span></td>
        <td class="py-3 pr-6">
          ${tagStyle ? `<span class="px-2 py-1 rounded-md text-xs font-semibold text-white ${tagStyle.bg}">${tagStyle.label}</span>` : '<span class="text-slate-600 text-xs">—</span>'}
        </td>
        <td class="py-3">
          <button class="delete-btn text-slate-600 hover:text-red-400 transition-colors text-xs font-semibold px-2 py-1 rounded hover:bg-red-400/10"
            data-id="${t.$id}">✕</button>
        </td>
      </tr>`;
  }).join('');
}

// ── Delete trade ──
document.getElementById('trades-table-body').addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  if (!confirm('Delete this trade?')) return;

  const id = btn.dataset.id;
  btn.textContent = '…';
  btn.disabled = true;

  try {
    await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, id);
    allTrades = allTrades.filter(t => t.$id !== id);
    const chrono = [...allTrades].sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
    const tagMap = buildTagMap(chrono);
    renderTable(allTrades, tagMap);
    computeMetrics(chrono);
    renderTimeline(chrono, tagMap);
    renderCharts(chrono);
  } catch (err) {
    alert('Could not delete: ' + err.message);
    btn.textContent = '✕';
    btn.disabled = false;
  }
});

init();
