import { ALL, derive, computeStats, leaveInfo } from '../logic.js';
import { REASONS } from '../constants.js';
import { data, ui, activeGame, leagueById, leagueName, fmtDay, gameNumber } from '../state.js';
import { esc } from '../util.js';
import { pinEl, deck, arrowSvg, checkSvg, crossSvg } from '../pins.js';
import { stripHtml, headHtml, chipsFor, warnHtml, sampleButton } from './shared.js';
import { gameSummary } from '../logic.js';

export function viewBowl() {
  let g = activeGame();
  if (!g) return viewStart();
  let d = derive(g.balls);
  return d.done ? viewSummary(g, d) : viewBall(g, d);
}

export function viewStart() {
  let picked = ui.pick || data.lastLeague;
  if (picked && !leagueById(picked)) picked = null;
  if (!picked && data.leagues.length === 1) picked = data.leagues[0].id;
  ui.pick = picked;
  let h = '<div class="stack"><div class="eyebrow">Bowling tracker</div><h1 class="h1">Start a game</h1></div>';
  if (!data.leagues.length) {
    h += '<p class="muted small" style="margin:0">Name the league you bowl in, for example Tuesday league. Every game is saved under its league and date, and you can add more leagues any time.</p>';
  } else {
    h += '<div class="stack"><div class="h3">League</div>' + chipsFor(data.leagues.map(function (l) { return [l.id, l.name]; }), picked, 'pickLeague') + '</div>';
  }
  h += '<div class="stack"><label class="small muted" for="leagueName">' + (data.leagues.length ? 'Or add another league' : 'League name') + '</label>' +
    '<div class="row"><input class="field grow" id="leagueName" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Tuesday league">' +
    '<button type="button" class="btn sm ghost" data-act="addLeague">Add</button></div></div>';
  h += '<button type="button" class="btn primary full" data-act="start"' + (picked ? '' : ' disabled') + '>Start game</button>';
  if (!data.games.length) h += sampleButton();
  return warnHtml() + h;
}

export function leaveHistory(key) {
  let st = computeStats(data.games), e = null;
  st.leaves.forEach(function (l) { if (l.key === key) e = l; });
  return e;
}

export function viewBall(g, d) {
  let cur = d.cur, fresh = cur.start.length === 10, h = warnHtml();
  h += headHtml(g, d) + stripHtml(d.frames, g.balls, cur.frame);
  if (fresh) {
    h += '<div class="row"><button type="button" class="btn ghost grow" data-act="strike">Strike</button>' +
      '<button type="button" class="btn primary grow2" data-act="nextBall"' + (ui.sel.length ? '' : ' disabled') + '>Next ball ' + arrowSvg() + '</button></div>';
  }
  if (!fresh) {
    h += '<div class="row"><button type="button" class="btn good grow" data-act="made">' + checkSvg() + 'Made it</button>' +
      '<button type="button" class="btn bad grow" data-act="missed" aria-pressed="' + ui.missing + '">' + crossSvg() + 'Missed</button></div>';
  }
  h += '<div class="head"><div class="h2">Frame ' + (cur.frame + 1) + ' · Ball ' + (cur.ball + 1) + '</div>';

  if (fresh) {
    let pins = '';
    ALL.forEach(function (n) {
      let on = ui.sel.indexOf(n) >= 0;
      pins += pinEl(n, on ? 'on' : '', 'pinUp', 'Pin ' + n + (on ? ', standing' : ', down'), on);
    });
    let info = leaveInfo(ui.sel);
    h += '<div class="small muted">Tap the pins left standing</div></div>';
    h += deck('Pin deck. Tap each pin that is still standing.', pins);
    h += '<div class="card"><div><div class="num" style="font-size:' + (ui.sel.length ? 26 : 20) + 'px">' + esc(ui.sel.length ? info.title : 'Nothing standing') + '</div><div class="small muted" style="margin-top:3px">' + esc(ui.sel.length ? info.sub : 'Tap the pins left, or hit Strike') + '</div></div>' +
      '<div class="num" style="font-size:22px;color:var(--accent)">' + (ui.sel.length ? (10 - ui.sel.length) + ' down' : '') + '</div></div>';
  } else {
    let start = cur.start, info2 = leaveInfo(start), pins2 = '';
    ALL.forEach(function (n) {
      let inStart = start.indexOf(n) >= 0;
      if (!inStart) { pins2 += pinEl(n, 'ghost'); return; }
      if (ui.missing) {
        let fell = ui.fell.indexOf(n) >= 0;
        pins2 += pinEl(n, fell ? 'fell' : 'on', 'fellPin', 'Pin ' + n + (fell ? ', fell' : ', still standing'), fell);
      } else {
        pins2 += pinEl(n, 'on');
      }
    });
    h += '<div class="small muted">' + (ui.missing ? 'Tap any pins that fell' : 'Spare shot') + '</div></div>';
    h += deck(ui.missing ? 'Pins left. Tap each pin that fell.' : 'Pins left to pick up: ' + start.join(', '), pins2);
    let hist = leaveHistory(info2.key), right;
    if (hist && hist.attempts) {
      right = '<div class="right"><div class="num" style="font-size:24px;color:var(--accent)">' + Math.round(100 * hist.made / hist.attempts) + '%</div><div class="tiny muted">' + hist.made + ' of ' + hist.attempts + ' made</div></div>';
    } else {
      right = '<div class="right tiny muted">First time<br>logged</div>';
    }
    h += '<div class="card"><div><div class="num" style="font-size:26px">' + esc(info2.title) + '</div><div class="small muted" style="margin-top:3px">' + esc(info2.sub) + '</div></div>' + right + '</div>';
    if (ui.missing) {
      let remaining = start.filter(function (n) { return ui.fell.indexOf(n) < 0; });
      h += '<div class="stack"><div class="head" style="align-items:baseline"><div class="h3">How did you miss?</div><div class="tiny muted">Optional</div></div>' +
        '<div class="chips two">' + REASONS.map(function (r) {
          return '<button type="button" class="chip" data-act="miss" data-id="' + r[0] + '" aria-pressed="false"' + (remaining.length ? '' : ' disabled') + '>' + r[1] + '</button>';
        }).join('') + '</div>' +
        '<div class="tiny muted">' + (remaining.length ? 'Tap a reason and the ball saves. Or save without one.' : 'Every pin is marked as fallen. That is a spare, so use Made it.') + '</div></div>';
      h += '<div class="row"><button type="button" class="btn quiet sm grow" data-act="cancelMiss">Back</button>' +
        '<button type="button" class="btn primary sm grow2" data-act="saveMiss"' + (remaining.length ? '' : ' disabled') + '>Save without a reason</button></div>';
    }
  }
  h += gameTools(g);
  return h;
}

export function gameTools(g) {
  return '<div class="row"><button type="button" class="btn quiet sm grow" data-act="undo"' + (g.balls.length ? '' : ' disabled') + '>Undo ball</button>' +
    '<button type="button" class="btn quiet sm grow" data-act="discard">' + (ui.confirm === 'discard' ? 'Tap again to discard' : 'Discard game') + '</button></div>';
}

export function viewSummary(g, d) {
  let s = gameSummary(g.balls), h = warnHtml();
  h += '<div class="stack"><div class="eyebrow">' + esc(leagueName(g.leagueId)) + ' · ' + esc(fmtDay(g.t)) + ' · Game ' + gameNumber(g) + ' finished</div>' +
    '<div class="num" style="font-size:72px">' + s.score + '</div></div>';
  h += stripHtml(d.frames, g.balls, -1);
  h += '<div class="tiles three"><div class="tile"><div class="num">' + s.strikes + '</div><div class="lb">Strikes</div></div>' +
    '<div class="tile"><div class="num">' + (s.tries ? s.made + '/' + s.tries : '–') + '</div><div class="lb">Spares made</div></div>' +
    '<div class="tile"><div class="num">' + s.open + '</div><div class="lb">Open frames</div></div></div>';
  h += '<div class="row"><button type="button" class="btn ghost grow" data-act="done">Done</button><button type="button" class="btn primary grow2" data-act="nextGame">Next game</button></div>';
  h += '<button type="button" class="btn quiet sm full" data-act="undo">Undo ball</button>';
  return h;
}
