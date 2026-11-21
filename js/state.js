import { KEY, SAMPLE_ID } from './constants.js';

/* All saved data lives in `data`; `ui` is screen state that is not saved. */
export let memoryOnly = false;
export function fresh() { return { v: 1, leagues: [], games: [], activeId: null, lastLeague: null }; }
export function load() {
  try {
    let raw = localStorage.getItem(KEY);
    if (raw) {
      let d = JSON.parse(raw);
      if (d && Array.isArray(d.games) && Array.isArray(d.leagues)) return d;
    }
  } catch (e) { memoryOnly = true; }
  return fresh();
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); memoryOnly = false; } catch (e) { memoryOnly = true; }
}

export const data = load();
export const ui = { tab: 'bowl', pick: null, sel: [], fell: [], missing: false, confirm: null, detail: null, gFilter: 'all', sLeague: 'all', sRange: 'last10', sLeave: 'all', renaming: null, backupText: '' };

export function leagueById(id) { for (let i = 0; i < data.leagues.length; i++) if (data.leagues[i].id === id) return data.leagues[i]; return null; }
export function gameById(id) { for (let i = 0; i < data.games.length; i++) if (data.games[i].id === id) return data.games[i]; return null; }
export function activeGame() { return data.activeId ? gameById(data.activeId) : null; }
export function leagueName(id) { let l = leagueById(id); return l ? l.name : 'League'; }
export function dayKey(t) { let d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
export function fmtDay(t) {
  let d = new Date(t), o = { weekday: 'short', month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
  return d.toLocaleDateString(undefined, o);
}
export function isoDay(t) { let d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
export function gameNumber(g) {
  let n = 0;
  data.games.forEach(function (o) { if (o.leagueId === g.leagueId && dayKey(o.t) === dayKey(g.t) && o.t <= g.t) n++; });
  return n;
}
export function resetBall() { ui.sel = []; ui.fell = []; ui.missing = false; }
export function hasSampleData() { return !!leagueById(SAMPLE_ID); }
