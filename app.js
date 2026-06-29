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
const tabLogin   = document.getElementById('tab-login');
const tabSignup  = document.getElementById('tab-signup');
const formLogin  = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');

tabLogin.addEventListener('click', () => {
  formLogin.classList.remove('hidden');
  formSignup.classList.add('hidden');
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
});

tabSignup.addEventListener('click', () => {
  formSignup.classList.remove('hidden');
  formLogin.classList.add('hidden');
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
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

// ── Demo Login — Jack ──
document.getElementById('btn-demo-jack').addEventListener('click', () => {
  document.getElementById('login-email').value    = 'jack@alist.demo';
  document.getElementById('login-password').value = 'DemoJack123!';
  tabLogin.click();
  formLogin.requestSubmit();
});

// ── Logout ──
document.getElementById('btn-logout').addEventListener('click', async () => {
  await account.deleteSession('current');
  location.reload();
});

// ── Nav tab switching ──
const navDashboard  = document.getElementById('nav-dashboard');
const navLog        = document.getElementById('nav-log');
const viewDashboard = document.getElementById('view-dashboard');
const viewLog       = document.getElementById('view-log');

navDashboard.addEventListener('click', () => {
  viewDashboard.classList.remove('hidden');
  viewLog.classList.add('hidden');
  navDashboard.classList.add('active');    navDashboard.classList.remove('inactive');
  navLog.classList.remove('active');       navLog.classList.add('inactive');
});

navLog.addEventListener('click', () => {
  viewLog.classList.remove('hidden');
  viewDashboard.classList.add('hidden');
  navLog.classList.add('active');          navLog.classList.remove('inactive');
  navDashboard.classList.remove('active'); navDashboard.classList.add('inactive');
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

// ── Sector auto-fill (static map + Finnhub profile fallback) ──
let _sectorDebounce = null;

document.getElementById('trade-stock').addEventListener('input', (e) => {
  const ticker = e.target.value.trim().toUpperCase();
  const badge  = document.getElementById('sector-badge');
  const hidden = document.getElementById('trade-sector');
  document.getElementById('price-info').textContent = '';

  if (!ticker) {
    badge.textContent = 'Sector will auto-fill';
    badge.classList.remove('filled');
    hidden.value = '';
    return;
  }

  // Instant hit from static map
  if (SECTOR_MAP[ticker]) {
    badge.textContent = SECTOR_MAP[ticker];
    badge.classList.add('filled');
    hidden.value = SECTOR_MAP[ticker];
    clearTimeout(_sectorDebounce);
    return;
  }

  // Unknown — show pending state, then ask Finnhub after 600ms pause
  badge.textContent = 'Looking up…';
  badge.classList.remove('filled');
  hidden.value = 'Other';

  clearTimeout(_sectorDebounce);
  _sectorDebounce = setTimeout(async () => {
    // Re-check in case user kept typing
    const current = document.getElementById('trade-stock').value.trim().toUpperCase();
    if (current !== ticker) return;
    try {
      const res  = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`
      );
      const data = await res.json();
      const sector = data.finnhubIndustry || null;
      if (sector) {
        SECTOR_MAP[ticker] = sector; // cache for session
        badge.textContent = sector;
        badge.classList.add('filled');
        hidden.value = sector;
      } else {
        badge.textContent = 'Unknown ticker';
        hidden.value = 'Other';
      }
    } catch {
      badge.textContent = 'Other';
      hidden.value = 'Other';
    }
  }, 600);
});

// ── Finnhub: fetch current price ──
document.getElementById('btn-fetch-price').addEventListener('click', async () => {
  const ticker = document.getElementById('trade-stock').value.trim().toUpperCase();
  const infoEl = document.getElementById('price-info');
  const btn    = document.getElementById('btn-fetch-price');
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

    document.getElementById('trade-entry-price').value = data.c.toFixed(2);

    const sign = data.d >= 0 ? '+' : '';
    const ts   = data.t
      ? new Date(data.t * 1000).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false })
      : '';
    infoEl.innerHTML =
      `<span style="color:var(--text-primary);font-weight:700">$${data.c.toFixed(2)}</span>` +
      `<span style="color:${data.d >= 0 ? 'var(--gain)' : 'var(--loss)'};margin-left:8px">${sign}${data.dp.toFixed(2)}%</span>` +
      (ts ? `<span style="color:var(--text-faint);margin-left:8px">${ts} IL</span>` : '');
  } catch {
    infoEl.textContent = 'Price fetch failed.';
  } finally {
    btn.disabled = false;
  }
});

// ── Insert trade ──
document.getElementById('form-trade').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn   = document.getElementById('btn-log-trade');
  const errEl = document.getElementById('trade-error');
  errEl.classList.add('hidden');
  btn.disabled    = true;
  btn.textContent = 'Saving…';

  const stock     = document.getElementById('trade-stock').value.trim().toUpperCase();
  const sector    = document.getElementById('trade-sector').value || 'Other';
  const buyPrice  = parseFloat(document.getElementById('trade-entry-price').value);
  const sellPrice = parseFloat(document.getElementById('trade-exit-price').value);
  const category  = document.getElementById('trade-order-category').value;
  const quantity  = parseInt(document.getElementById('trade-quantity').value, 10);
  const date      = document.getElementById('trade-date').value;

  const holdDays  = { 'Day Trade': 0, 'Short Sell': 0, 'Swing Trade': 5, 'Long Position': 30 };
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
    const badge = document.getElementById('sector-badge');
    badge.textContent = 'Sector will auto-fill';
    badge.classList.remove('filled');
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

// ── Fetch + render ──
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
    renderBestWorst(chrono);
    renderRecentTrades(chrono, tagMap);
    renderTopSectors(chrono);
    renderCharts(chrono);
    content.classList.remove('hidden');
  } catch (err) {
    document.getElementById('dashboard-error-msg').textContent = err.message;
    error.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}

// ── Behavioral metrics ──
function computeMetrics(chrono) {
  const n   = chrono.length;
  const pnl = t => calcPnl(t);

  // Composure Rating
  const dayTrades  = chrono.filter(t => t.order_category === 'Day Trade');
  const panicExits = dayTrades.filter(t => pnl(t) < 0);
  const panicRate  = dayTrades.length ? Math.round(panicExits.length / dayTrades.length * 100) : null;
  const composure  = panicRate !== null ? 100 - panicRate : null;

  const panicEl  = document.getElementById('stat-panic');
  const panicBar = document.getElementById('stat-panic-bar');
  if (composure !== null) {
    const r = composure >= 70 ? 'good' : composure >= 40 ? 'warn' : 'bad';
    panicEl.textContent    = composure;
    panicEl.className      = `stat-num ${r}`;
    panicBar.style.width   = `${composure}%`;
    panicBar.className     = `progress-fill ${r}`;
  } else {
    panicEl.textContent = 'N/A';
    panicEl.className   = 'stat-num neutral';
  }

  // FOMO Tax
  let fomoTax = 0, fomoCount = 0;
  for (let i = 1; i < n; i++) {
    const prevPnl = pnl(chrono[i - 1]);
    const currPnl = pnl(chrono[i]);
    const sameDay = chrono[i - 1].entry_time?.slice(0, 10) === chrono[i].entry_time?.slice(0, 10);
    if (prevPnl > 0 && sameDay && currPnl < 0) { fomoTax += currPnl; fomoCount++; }
  }
  const fomoEl  = document.getElementById('stat-fomo');
  const fomoSub = document.getElementById('stat-fomo-sub');
  fomoEl.textContent = fomoCount ? `-$${Math.abs(fomoTax).toFixed(0)}` : '$0';
  fomoEl.className   = `stat-num ${fomoTax < 0 ? 'bad' : 'neutral'}`;
  fomoSub.textContent = fomoCount ? `${fomoCount} chaser trade${fomoCount > 1 ? 's' : ''} identified` : 'No chasing detected yet';

  // Tilt Multiplier
  const allLosses     = chrono.filter(t => pnl(t) < 0).map(t => Math.abs(pnl(t)));
  const avgLoss       = allLosses.length ? allLosses.reduce((a, b) => a + b, 0) / allLosses.length : 0;
  const postLossLosses = [];
  for (let i = 1; i < n; i++) {
    if (pnl(chrono[i - 1]) < 0 && pnl(chrono[i]) < 0)
      postLossLosses.push(Math.abs(pnl(chrono[i])));
  }
  const avgPost  = postLossLosses.length ? postLossLosses.reduce((a, b) => a + b, 0) / postLossLosses.length : null;
  const tiltMult = avgLoss > 0 && avgPost !== null ? avgPost / avgLoss : null;

  const tiltEl  = document.getElementById('stat-tilt');
  const tiltSub = document.getElementById('stat-tilt-sub');
  if (tiltMult !== null) {
    const r = tiltMult > 1.2 ? 'bad' : 'good';
    tiltEl.textContent  = `${tiltMult.toFixed(1)}x`;
    tiltEl.className    = `stat-num ${r}`;
    tiltSub.textContent = tiltMult > 1.2 ? '⚠ You lose bigger after a loss' : '✓ Losses stay consistent';
  } else {
    tiltEl.textContent  = 'N/A';
    tiltEl.className    = 'stat-num neutral';
    tiltSub.textContent = 'Need consecutive losses to measure';
  }
}

// ── Behavioral tagging ──
const TAG_META = {
  PANIC_EXIT:     { cls: 'tag-PANIC_EXIT',     label: 'Panic Exit',    color: '#ef4444' },
  EUPHORIA_TRADE: { cls: 'tag-EUPHORIA_TRADE', label: 'Euphoria',      color: '#eab308' },
  REVENGE_TRADE:  { cls: 'tag-REVENGE_TRADE',  label: 'Revenge',       color: '#f97316' },
  TUNNEL_VISION:  { cls: 'tag-TUNNEL_VISION',  label: 'Tunnel Vision', color: '#a855f7' },
  CLEAN:          { cls: 'tag-CLEAN',          label: 'Clean',         color: '#059669' },
};

const CAT_CLASS = {
  'Day Trade':     'cat-day',
  'Swing Trade':   'cat-swing',
  'Long Position': 'cat-long',
  'Short Sell':    'cat-short',
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

// ── Best & Worst Trade ──
function renderBestWorst(chrono) {
  const el = document.getElementById('best-worst');
  if (!chrono.length) {
    el.innerHTML = '<p style="color:var(--text-faint);font-size:14px">No trades yet.</p>';
    return;
  }

  let best = chrono[0], worst = chrono[0];
  chrono.forEach(t => {
    if (calcPnl(t) > calcPnl(best))  best  = t;
    if (calcPnl(t) < calcPnl(worst)) worst = t;
  });

  const bp = calcPnl(best),  wp = calcPnl(worst);
  const bd = best.entry_time  ? best.entry_time.slice(0, 10)  : '—';
  const wd = worst.entry_time ? worst.entry_time.slice(0, 10) : '—';

  const row = (emoji, ticker, pnl, color, sign, date) => `
    <div class="glass-card-nested" style="padding:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:8px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">${emoji}</span>
        <div>
          <p style="font-weight:900;font-size:18px;margin:0;letter-spacing:-0.02em">${ticker}</p>
          <p style="color:var(--text-faint);font-size:11px;margin:2px 0 0">${date}</p>
        </div>
      </div>
      <span style="font-weight:900;font-size:20px;color:${color};letter-spacing:-0.02em">${sign}$${Math.abs(pnl).toFixed(2)}</span>
    </div>`;

  el.innerHTML =
    row('🏆', best.stock,  bp, 'var(--gain)', '+', bd) +
    row('💀', worst.stock, wp, 'var(--loss)', '-', wd);
}

// ── Recent 3 Trades ──
function renderRecentTrades(chrono, tagMap) {
  const el = document.getElementById('recent-trades');
  if (!chrono.length) {
    el.innerHTML = '<p style="color:var(--text-faint);font-size:14px">No trades yet.</p>';
    return;
  }

  const recent = [...chrono].slice(-3).reverse();

  el.innerHTML = recent.map((t, i) => {
    const p       = calcPnl(t);
    const pSign   = p >= 0 ? '+' : '-';
    const pColor  = p >= 0 ? 'var(--gain)' : 'var(--loss)';
    const tag     = tagMap[t.$id];
    const tagMeta = TAG_META[tag];
    const date    = t.entry_time ? t.entry_time.slice(0, 10) : '—';
    const border  = i < recent.length - 1 ? 'border-bottom:1px solid var(--glass-border);' : '';

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;${border}">
        <div>
          <span style="font-weight:800;font-size:15px;color:var(--text-primary)">${t.stock}</span>
          <span style="color:var(--text-faint);font-size:11px;margin-left:7px">${date}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:700;color:${pColor}">${pSign}$${Math.abs(p).toFixed(2)}</span>
          ${tagMeta ? `<span class="tag-badge ${tagMeta.cls}">${tagMeta.label}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Top Sectors ──
function renderTopSectors(chrono) {
  const el = document.getElementById('top-sectors');
  if (!chrono.length) {
    el.innerHTML = '<p style="color:var(--text-faint);font-size:14px">No sector data yet.</p>';
    return;
  }

  const bysector = {};
  chrono.forEach(t => {
    const s = t.sector || 'Other';
    if (!bysector[s]) bysector[s] = { total: 0, wins: 0, count: 0 };
    const p = calcPnl(t);
    bysector[s].total += p;
    bysector[s].count++;
    if (p > 0) bysector[s].wins++;
  });

  const ranked = Object.entries(bysector)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 2);

  if (!ranked.length) {
    el.innerHTML = '<p style="color:var(--text-faint);font-size:14px">No sector data yet.</p>';
    return;
  }

  const medals = ['🥇', '🥈'];
  el.innerHTML = ranked.map(([sector, s], i) => {
    const pnlSign  = s.total >= 0 ? '+' : '-';
    const pnlColor = s.total >= 0 ? 'var(--gain)' : 'var(--loss)';
    const winRate  = Math.round(s.wins / s.count * 100);
    const rating   = winRate >= 60 ? 'good' : winRate >= 40 ? 'warn' : 'bad';
    return `
      <div class="glass-card-nested" style="padding:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-weight:700;color:var(--text-primary)">${medals[i]} ${sector}</span>
          <span style="font-weight:900;color:${pnlColor}">${pnlSign}$${Math.abs(s.total).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:8px">
          <span>${s.count} trade${s.count !== 1 ? 's' : ''}</span>
          <span>${winRate}% win rate</span>
        </div>
        <div class="progress-track" style="margin-top:0">
          <div class="progress-fill ${rating}" style="width:${winRate}%"></div>
        </div>
      </div>`;
  }).join('');
}

// ── Charts ──
let sectorChart = null, pnlChart = null, tagsChart = null;

function renderCharts(chrono) {
  const counts = {};
  chrono.forEach(t => { counts[t.sector] = (counts[t.sector] || 0) + 1; });
  if (sectorChart) sectorChart.destroy();
  sectorChart = new Chart(document.getElementById('chart-sector'), {
    type: 'bar',
    data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: '#10b981', borderRadius: 6 }] },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  let cum = 0;
  const pnlPoints = chrono.map(t => parseFloat((cum += calcPnl(t)).toFixed(2)));
  if (pnlChart) pnlChart.destroy();
  pnlChart = new Chart(document.getElementById('chart-pnl'), {
    type: 'line',
    data: {
      labels: chrono.map(t => t.stock),
      datasets: [{
        data: pnlPoints,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true, tension: 0.3,
        pointBackgroundColor: pnlPoints.map(v => v >= 0 ? '#10b981' : '#f87171'),
        pointRadius: 4,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  const tagOrder  = ['CLEAN', 'PANIC_EXIT', 'EUPHORIA_TRADE', 'REVENGE_TRADE', 'TUNNEL_VISION'];
  const tagLabels = ['Clean', 'Panic Exit', 'Euphoria', 'Revenge', 'Tunnel Vision'];
  const tagColors = ['#059669', '#ef4444', '#eab308', '#f97316', '#a855f7'];
  const pieTagMap = buildTagMap(chrono);
  const tagCounts = tagOrder.map(tag => chrono.filter(t => pieTagMap[t.$id] === tag).length);

  if (tagsChart) tagsChart.destroy();
  tagsChart = new Chart(document.getElementById('chart-tags'), {
    type: 'pie',
    data: { labels: tagLabels, datasets: [{ data: tagCounts, backgroundColor: tagColors, borderWidth: 0 }] },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } }
      }
    }
  });
}

// ── Trade history table ──
function renderTable(trades, tagMap = {}) {
  const tbody = document.getElementById('trades-table-body');
  if (!trades.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="padding:40px 0;text-align:center;color:var(--text-faint)">No trades logged yet.</td></tr>';
    return;
  }

  tbody.innerHTML = trades.map(t => {
    const p       = calcPnl(t);
    const pStr    = p.toFixed(2);
    const pSign   = p >= 0 ? '+' : '';
    const pColor  = p >= 0 ? 'var(--gain)' : 'var(--loss)';
    const catCls  = CAT_CLASS[t.order_category] || '';
    const tag     = tagMap[t.$id];
    const tagMeta = TAG_META[tag];
    const date    = t.entry_time ? t.entry_time.slice(0, 10) : '—';

    return `
      <tr>
        <td style="font-weight:700">${t.stock}</td>
        <td style="color:var(--text-muted);font-size:13px">${date}</td>
        <td style="color:var(--text-muted);font-size:13px">${t.sector}</td>
        <td style="color:var(--text-emphasis)">${t.quantity || 1}</td>
        <td>$${parseFloat(t.entry_price).toFixed(2)}</td>
        <td>$${parseFloat(t.exit_price).toFixed(2)}</td>
        <td style="font-weight:700;color:${pColor}">${pSign}$${Math.abs(p).toFixed(2)}</td>
        <td><span class="cat-badge ${catCls}">${t.order_category || '—'}</span></td>
        <td>${tagMeta ? `<span class="tag-badge ${tagMeta.cls}">${tagMeta.label}</span>` : '<span style="color:var(--text-faint);font-size:11px">—</span>'}</td>
        <td><button class="delete-btn btn-delete" data-id="${t.$id}">✕</button></td>
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
    renderBestWorst(chrono);
    renderRecentTrades(chrono, tagMap);
    renderTopSectors(chrono);
    renderCharts(chrono);
  } catch (err) {
    alert('Could not delete: ' + err.message);
    btn.textContent = '✕';
    btn.disabled = false;
  }
});

init();
