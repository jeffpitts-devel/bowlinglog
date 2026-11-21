import { scoreGame, runningScore, frameMarks } from '../logic.js';
import { data, ui, memoryOnly, leagueName, fmtDay, gameNumber } from '../state.js';
import { esc } from '../util.js';

export function stripHtml(frames, balls, curFrame) {
  let cum = scoreGame(balls), out = '';
  for (let i = 0; i < 10; i++) {
    let fr = frames[i] || { balls: [] };
    let cls = i === curFrame ? 'cell cur' : (fr.balls.length ? 'cell' : 'cell todo');
    out += '<div class="' + cls + '"><div class="fn">' + (i + 1) + '</div><div class="mk">' + frameMarks(fr).join(' ') + '</div><div class="sc">' + (cum[i] === null ? '' : cum[i]) + '</div></div>';
  }
  return '<div class="strip" role="img" aria-label="Scorecard, frames 1 to 10">' + out + '</div>';
}
export function framesScored(balls) { return scoreGame(balls).filter(function (v) { return v !== null; }).length; }
export function headHtml(g, d) {
  let n = framesScored(g.balls);
  return '<div class="head"><div><div class="eyebrow">' + esc(leagueName(g.leagueId)) + ' · ' + esc(fmtDay(g.t)) + '</div><div class="h1">Game ' + gameNumber(g) + '</div></div>' +
    '<div class="right"><div class="num" style="font-size:38px">' + runningScore(g.balls) + '</div><div class="tiny muted">' + (n ? 'through frame ' + n : 'no score yet') + '</div></div></div>';
}
export function chipsFor(items, current, act) {
  return '<div class="chips">' + items.map(function (it) {
    return '<button type="button" class="chip" data-act="' + act + '" data-id="' + esc(it[0]) + '" aria-pressed="' + (current === it[0]) + '">' + esc(it[1]) + '</button>';
  }).join('') + '</div>';
}
export function leagueChoices() { return [['all', 'All leagues']].concat(data.leagues.map(function (l) { return [l.id, l.name]; })); }
export function warnHtml() {
  return memoryOnly ? '<div class="warn" role="alert">This browser is not saving your games. Use Copy backup in Games before you close the page.</div>' : '';
}
export function sampleButton() {
  return '<button type="button" class="btn sm quiet full" data-act="sample">Try it with sample games</button>';
}
