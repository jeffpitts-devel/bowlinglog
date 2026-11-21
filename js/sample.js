import { ALL, derive, isSplit } from './logic.js';
import { SAMPLE_ID } from './constants.js';
import { data, ui, save, gameById, hasSampleData } from './state.js';
import { uid } from './util.js';

/* Sample games so the Leaves page has something to show. */
export function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const POOL = [[[10], 14], [[7], 12], [[6], 9], [[4], 8], [[5], 6], [[9], 5], [[8], 4], [[2], 3], [[3], 3], [[2, 4], 3], [[3, 6], 3], [[6, 10], 4], [[4, 7], 3], [[7, 10], 4], [[4, 6], 2], [[5, 7], 2], [[2, 5], 2], [[5, 10], 2]];
export function pickLeave(r) {
  let total = 0, i; for (i = 0; i < POOL.length; i++) total += POOL[i][1];
  let x = r() * total;
  for (i = 0; i < POOL.length; i++) { x -= POOL[i][1]; if (x < 0) return POOL[i][0].slice(); }
  return [10];
}
export function sampleGame(r) {
  let balls = [], guard = 0;
  while (guard++ < 40) {
    let d = derive(balls);
    if (d.done) break;
    let st = d.cur.start;
    if (st.length === 10) {
      if (r() < 0.32) balls.push({ s: ALL.slice(), l: [], m: null });
      else balls.push({ s: ALL.slice(), l: pickLeave(r), m: null });
    } else {
      let p = st.length === 1 ? (st[0] === 10 ? 0.9 : st[0] === 7 ? 0.6 : 0.8) : (isSplit(st) ? 0.2 : 0.55);
      if (r() < p) balls.push({ s: st.slice(), l: [], m: null });
      else {
        let rem = st.length === 1 ? st.slice() : st.filter(function () { return r() < 0.6; });
        if (!rem.length) rem = [st[st.length - 1]];
        let reasons = ['left', 'right', 'right', 'stayed', 'unsure'];
        balls.push({ s: st.slice(), l: rem, m: r() < 0.12 ? null : reasons[Math.floor(r() * reasons.length)] });
      }
    }
  }
  return balls;
}
export function loadSample() {
  if (hasSampleData()) return;
  let r = rng(20261118);
  data.leagues.push({ id: SAMPLE_ID, name: 'Sample league', sample: true });
  [10, 6, 3, 1].forEach(function (daysAgo) {
    let base = new Date(); base.setDate(base.getDate() - daysAgo); base.setHours(19, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
      data.games.push({ id: uid('s'), leagueId: SAMPLE_ID, t: base.getTime() + i * 25 * 60000, balls: sampleGame(r), sample: true });
    }
  });
  save();
}
export function removeSample() {
  data.games = data.games.filter(function (g) { return g.leagueId !== SAMPLE_ID; });
  data.leagues = data.leagues.filter(function (l) { return l.id !== SAMPLE_ID; });
  if (data.activeId && !gameById(data.activeId)) data.activeId = null;
  if (data.lastLeague === SAMPLE_ID) data.lastLeague = null;
  if (ui.pick === SAMPLE_ID) ui.pick = null;
  if (ui.sLeague === SAMPLE_ID) ui.sLeague = 'all';
  if (ui.gFilter === SAMPLE_ID) ui.gFilter = 'all';
  ui.detail = null; save();
}
