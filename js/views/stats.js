import { ALL, computeStats, leaveInfo } from '../logic.js';
import { data, ui, leagueName, hasSampleData } from '../state.js';
import { esc } from '../util.js';
import { pinPos, HEAT, heatLevel } from '../pins.js';
import { chipsFor, leagueChoices, warnHtml, sampleButton } from './shared.js';

export function filteredGames() {
  let gs = data.games.filter(function (g) { return g.balls.length > 0 && (ui.sLeague === 'all' || g.leagueId === ui.sLeague); });
  gs.sort(function (a, b) { return b.t - a.t; });
  if (ui.sRange === 'last10') gs = gs.slice(0, 10);
  else if (ui.sRange === 'last30') gs = gs.slice(0, 30);
  return gs;
}
export function leaveLabel(e) {
  let info = leaveInfo(e.pins);
  return { label: info.kind === 'single' ? String(e.pins[0]) : e.key, type: info.kind === 'single' ? 'Single pin' : info.kind === 'split' ? 'Split' : 'Multi-pin' };
}
export function leakName(e) {
  let info = leaveInfo(e.pins);
  return 'the ' + (info.kind === 'single' ? info.title.toLowerCase() : e.key + ' leave');
}

export function viewStats() {
  let any = data.games.some(function (g) { return g.balls.length > 0; });
  let h = warnHtml();
  if (!any) {
    return h + '<div class="stack"><h1 class="h1">Leaves and spares</h1></div>' +
      '<div class="panel"><div class="h3">Nothing to show yet</div><p class="muted small" style="margin:0">Log a few games and this page shows which pins you leave on the first ball and how often you pick each one up. Leaves settle into a pattern after about fifteen games.</p>' +
      '<button type="button" class="btn primary sm full" data-act="goBowl">Start a game</button>' + sampleButton() + '</div>';
  }
  let gs = filteredGames(), st = computeStats(gs);
  let scope = ui.sLeague === 'all' ? 'all leagues' : leagueName(ui.sLeague);
  h += '<div class="head"><div><h1 class="h1">Leaves and spares</h1><div class="small muted" style="margin-top:4px">' + st.games + ' game' + (st.games === 1 ? '' : 's') + ' · ' + esc(scope) + '</div></div>' + (hasSampleData() ? '<span class="pill">Sample data</span>' : '') + '</div>';
  if (data.leagues.length > 1) h += chipsFor(leagueChoices(), ui.sLeague, 'sLeague');
  h += '<div class="seg" role="group" aria-label="Range">' + [['last10', 'Last 10 games'], ['last30', 'Last 30'], ['all', 'All time']].map(function (r) {
    return '<button type="button" data-act="sRange" data-id="' + r[0] + '" aria-pressed="' + (ui.sRange === r[0]) + '">' + r[1] + '</button>';
  }).join('') + '</div>';

  h += '<div class="tiles"><div class="tile"><div class="num">' + st.finished + '</div><div class="lb">Games</div></div>' +
    '<div class="tile"><div class="num">' + (st.average === null ? '–' : st.average) + '</div><div class="lb">Average</div></div>' +
    '<div class="tile"><div class="num">' + (st.strikePct === null ? '–' : st.strikePct + '%') + '</div><div class="lb">Strikes</div></div>' +
    '<div class="tile"><div class="num">' + (st.sparePct === null ? '–' : st.sparePct + '%') + '</div><div class="lb">Spares</div></div></div>';

  /* heatmap */
  let pins = '', top = null;
  ALL.forEach(function (n) {
    let p = st.firstBalls ? Math.round(100 * st.standing[n] / st.firstBalls) : null;
    if (p !== null && (!top || p > top.p)) top = { n: n, p: p };
    let c = HEAT[p === null ? 0 : heatLevel(p)];
    pins += '<div class="pin heat" style="' + pinPos(n) + ';background:' + c[0] + ';border-color:' + c[1] + ';color:' + c[2] + '" aria-hidden="true"><span class="pn">' + n + '</span><span class="pp">' + (p === null ? '–' : p + '%') + '</span></div>';
  });
  h += '<div class="stack-lg"><div class="stack"><h2 class="h2">Where your first ball leaves pins</h2><div class="small muted">Share of first balls where each pin stayed up</div></div>' +
    '<div class="deck" role="img" aria-label="Heatmap of how often each pin is left standing after the first ball' + (top ? '. The ' + top.n + '-pin is highest at ' + top.p + ' percent' : '') + '">' + pins + '</div>' +
    '<div class="legend"><span>Less often</span>' + HEAT.map(function (c) { return '<i style="background:' + c[0] + ';box-shadow:inset 0 0 0 1px ' + c[1] + '"></i>'; }).join('') + '<span>More often</span></div>' +
    '<div class="tiny muted">From ' + st.firstBalls + ' first balls.' + (st.firstBalls < 150 ? ' Early numbers are hints until you have about fifteen games.' : '') + '</div></div>';

  /* spare conversion */
  let rows = st.leaves.slice(0, 8), leak = null;
  st.leaves.forEach(function (e) { let miss = e.attempts - e.made; if (miss >= 2 && (!leak || miss > leak.miss)) leak = { e: e, miss: miss }; });
  h += '<div class="stack-lg"><div class="stack"><h2 class="h2">Spare conversion by leave</h2><div class="small muted">How often you leave it, and how often you pick it up</div></div>';
  if (!st.leaves.length) {
    h += '<div class="small muted">No spare shots logged yet.</div>';
  } else {
    if (leak) h += '<div class="leak"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 4v10"></path><path d="M12 19v.5"></path></svg>Biggest leak: ' + esc(leakName(leak.e)) + ', ' + leak.miss + ' missed spares</div>';
    h += '<div>' + rows.map(function (e) {
      let lb = leaveLabel(e), pct = Math.round(100 * e.made / e.attempts);
      return '<div class="lv"><div class="lv-top"><div class="lv-name"><span class="num">' + esc(lb.label) + '</span><span class="small muted">' + lb.type + '</span></div>' +
        '<div class="lv-val"><span class="small muted">' + e.made + ' of ' + e.attempts + '</span><span class="num">' + pct + '%</span></div></div>' +
        '<div class="bar"><i style="width:' + pct + '%;background:' + (pct >= 75 ? 'var(--good)' : 'var(--bad)') + '"></i></div></div>';
    }).join('') + '</div>';
    if (st.leaves.length > 8) h += '<div class="tiny muted">Showing the 8 most common of ' + st.leaves.length + ' leaves.</div>';
  }
  h += '</div>';

  /* how you miss */
  let missed = st.leaves.filter(function (e) { return e.attempts > e.made; }).sort(function (a, b) { return (b.attempts - b.made) - (a.attempts - a.made); });
  let choices = [['all', 'All misses']].concat(missed.slice(0, 4).map(function (e) { return [e.key, leaveLabel(e).label + (leaveInfo(e.pins).kind === 'single' ? '-pin' : '')]; }));
  let sel = ui.sLeave;
  if (!choices.some(function (c) { return c[0] === sel; })) sel = 'all';
  let counts = { left: 0, right: 0, stayed: 0, unsure: 0, none: 0 }, total = 0;
  missed.forEach(function (e) {
    if (sel !== 'all' && e.key !== sel) return;
    Object.keys(e.misses).forEach(function (k) { counts[k] += e.misses[k]; total += e.misses[k]; });
    counts.none += e.untagged; total += e.untagged;
  });
  h += '<div class="stack-lg"><div class="stack"><h2 class="h2">How you miss</h2><div class="small muted">' + (total ? 'From ' + total + ' missed spare' + (total === 1 ? '' : 's') : 'No missed spares yet') + '</div></div>';
  if (total) {
    if (choices.length > 1) h += chipsFor(choices, sel, 'sLeave');
    let maxc = 0; Object.keys(counts).forEach(function (k) { if (counts[k] > maxc) maxc = counts[k]; });
    h += '<div class="stack-lg">' + [['right', 'Missed right'], ['left', 'Missed left'], ['stayed', 'Hit it, stayed up'], ['unsure', 'No idea'], ['none', 'No reason logged']].filter(function (r) { return counts[r[0]] > 0; }).map(function (r) {
      return '<div class="mrow"><div class="lbl">' + r[1] + '</div><div class="bar"><i style="width:' + Math.round(100 * counts[r[0]] / maxc) + '%;background:var(--accent)"></i></div><div class="num n">' + counts[r[0]] + '</div></div>';
    }).join('') + '</div>';
  }
  h += '</div>';
  if (hasSampleData()) h += '<button type="button" class="btn sm quiet full" data-act="rmSample">Remove sample games</button>';
  return h;
}
