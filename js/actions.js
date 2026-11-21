import { ALL, derive, sortPins } from './logic.js';
import { data, ui, save, leagueById, gameById, activeGame, resetBall } from './state.js';
import { $, uid, toggle, toast } from './util.js';
import { render } from './render.js';
import { loadSample, removeSample } from './sample.js';

let confirmTimer = null;

/* ---------- helpers ---------- */
function commitBall(b) {
  let g = activeGame(); if (!g) return;
  g.balls.push(b); resetBall(); save(); render();
}
function newGame(leagueId) {
  let g = { id: uid('g'), leagueId: leagueId, t: Date.now(), balls: [] };
  data.games.push(g); data.activeId = g.id; data.lastLeague = leagueId; resetBall(); save();
}
function armConfirm(key) {
  ui.confirm = key; clearTimeout(confirmTimer);
  confirmTimer = setTimeout(function () { ui.confirm = null; render(); }, 4000);
  render();
}
function addLeague() {
  let inp = $('leagueName'), name = inp ? inp.value.trim() : '';
  if (!name) { toast('Type a league name first'); return; }
  let l = { id: uid('l'), name: name };
  data.leagues.push(l); ui.pick = l.id; save(); render();
}
function backupJson() { return JSON.stringify({ app: 'bowling-tracker', v: 1, leagues: data.leagues, games: data.games }, null, 2); }
function restore(text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { toast('That file is not a backup from this app'); return; }
  if (!d || !Array.isArray(d.games) || !Array.isArray(d.leagues)) { toast('That file is not a backup from this app'); return; }
  let addedG = 0;
  d.leagues.forEach(function (l) { if (l && l.id && l.name && !leagueById(l.id)) data.leagues.push({ id: String(l.id), name: String(l.name), sample: !!l.sample }); });
  d.games.forEach(function (g) {
    if (!g || !g.id || !Array.isArray(g.balls) || gameById(g.id) || !leagueById(g.leagueId)) return;
    let ok = g.balls.every(function (b) { return b && Array.isArray(b.s) && Array.isArray(b.l); });
    if (!ok) return;
    data.games.push({ id: String(g.id), leagueId: g.leagueId, t: Number(g.t) || Date.now(), balls: g.balls, sample: !!g.sample }); addedG++;
  });
  save(); render(); toast(addedG ? 'Restored ' + addedG + ' game' + (addedG === 1 ? '' : 's') : 'Nothing new to restore');
}

/* ---------- click handlers, one per data-act ---------- */
function saveDate() {
  const f = $('gameDate'), gm = gameById(ui.detail);
  if (!f || !f.value || !gm) { toast('Pick a date first'); return; }
  const parts = f.value.split('-'), prev = new Date(gm.t);
  const nd = new Date(+parts[0], +parts[1] - 1, +parts[2], prev.getHours(), prev.getMinutes(), prev.getSeconds());
  if (isNaN(nd.getTime())) { toast('That date did not work'); return; }
  gm.t = nd.getTime(); save(); render(); toast('Date updated');
}

function download() {
  try {
    const blob = new Blob([backupJson()], { type: 'application/json' }), link = document.createElement('a'), d = new Date();
    link.href = URL.createObjectURL(blob);
    link.download = 'bowling-backup-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 4000);
    toast('Backup file requested. If nothing downloads, use Copy.');
  } catch (err) { ui.backupText = backupJson(); render(); }
}

function copyBackup() {
  const json = backupJson();
  function fallback() { ui.backupText = json; render(); const b = $('backupBox'); if (b) { b.focus(); b.select(); } }
  try {
    navigator.clipboard.writeText(json).then(function () { toast('Backup copied. Paste it into a note.'); }, fallback);
  } catch (err) { fallback(); }
}

function renameLeague(id) {
  ui.renaming = id; render();
  const rf = $('renameField'); if (rf) { rf.focus(); rf.select(); }
}

function saveLeagueName(id) {
  const field = $('renameField'), name = field ? field.value.trim() : '', lg = leagueById(id);
  if (!name) { toast('A league needs a name'); return; }
  if (lg) { lg.name = name; save(); }
  ui.renaming = null; render();
}

function saveMiss(reason) {
  const g = activeGame(); if (!g) return;
  const start = derive(g.balls).cur.start, rem = start.filter(function (p) { return ui.fell.indexOf(p) < 0; });
  if (rem.length) commitBall({ s: start, l: sortPins(rem), m: reason });
}

function undoBall() {
  const g = activeGame();
  if (g && g.balls.length) { g.balls.pop(); resetBall(); save(); render(); }
}

function discardGame() {
  const g = activeGame();
  if (ui.confirm === 'discard' && g) {
    data.games = data.games.filter(function (x) { return x.id !== g.id; });
    data.activeId = null; ui.confirm = null; resetBall(); save(); render(); toast('Game discarded');
  } else armConfirm('discard');
}

function deleteGame(id) {
  if (ui.confirm === 'del' + id) {
    data.games = data.games.filter(function (x) { return x.id !== id; });
    if (data.activeId === id) data.activeId = null;
    ui.detail = null; ui.confirm = null; save(); render(true); toast('Game deleted');
  } else armConfirm('del' + id);
}

/* Each handler gets { id, n, el } read from the clicked element's data attributes. */
const ACTIONS = {
  pickLeague: function (c) { ui.pick = c.id; render(); },
  addLeague: addLeague,
  start: function () { if (ui.pick) { newGame(ui.pick); render(); } },
  pinUp: function (c) { ui.sel = toggle(ui.sel, c.n); render(); },
  strike: function () { commitBall({ s: ALL.slice(), l: [], m: null }); },
  nextBall: function () { if (ui.sel.length) commitBall({ s: ALL.slice(), l: sortPins(ui.sel), m: null }); },
  made: function () { const g = activeGame(); if (g) commitBall({ s: derive(g.balls).cur.start, l: [], m: null }); },
  missed: function () { ui.missing = !ui.missing; ui.fell = []; render(); },
  cancelMiss: function () { ui.missing = false; ui.fell = []; render(); },
  fellPin: function (c) { ui.fell = toggle(ui.fell, c.n); render(); },
  miss: function (c) { saveMiss(c.id); },
  saveMiss: function () { saveMiss(null); },
  undo: undoBall,
  discard: discardGame,
  nextGame: function () { const g = activeGame(); if (g) { newGame(g.leagueId); render(true); } },
  done: function () { data.activeId = null; save(); render(true); },
  tab: function (c) { ui.tab = c.el.getAttribute('data-tab'); ui.confirm = null; render(true); },
  goBowl: function () { ui.tab = 'bowl'; render(true); },
  sRange: function (c) { ui.sRange = c.id; render(); },
  sLeague: function (c) { ui.sLeague = c.id; render(); },
  sLeave: function (c) { ui.sLeave = c.id; render(); },
  gFilter: function (c) { ui.gFilter = c.id; render(); },
  open: function (c) { ui.detail = c.id; ui.confirm = null; render(true); },
  back: function () { ui.detail = null; ui.confirm = null; render(true); },
  saveDate: saveDate,
  resume: function (c) { data.activeId = c.id; resetBall(); ui.detail = null; ui.tab = 'bowl'; save(); render(true); },
  delGame: function (c) { deleteGame(c.id); },
  rename: function (c) { renameLeague(c.id); },
  renameCancel: function () { ui.renaming = null; render(); },
  renameSave: function (c) { saveLeagueName(c.id); },
  sample: function () { loadSample(); ui.tab = 'stats'; render(true); toast('Sample games added. Remove them any time.'); },
  rmSample: function () { removeSample(); render(true); toast('Sample games removed'); },
  dl: download,
  copy: copyBackup
};

export function initActions() {
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const handler = ACTIONS[el.getAttribute('data-act')];
    if (handler) handler({ el: el, id: el.getAttribute('data-id'), n: parseInt(el.getAttribute('data-n'), 10) });
  });

  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'restoreFile' && e.target.files && e.target.files[0]) {
      const rd = new FileReader();
      rd.onload = function () { restore(String(rd.result)); };
      rd.onerror = function () { toast('Could not read that file'); };
      rd.readAsText(e.target.files[0]);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target) return;
    if (e.target.id === 'leagueName') { e.preventDefault(); addLeague(); }
    if (e.target.id === 'renameField') { e.preventDefault(); const b = document.querySelector('[data-act="renameSave"]'); if (b) b.click(); }
  });
}
