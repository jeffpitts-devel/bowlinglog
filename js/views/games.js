import { derive, gameSummary, leaveInfo } from '../logic.js';
import { REASON_TEXT } from '../constants.js';
import { data, ui, gameById, leagueName, dayKey, fmtDay, isoDay, gameNumber, hasSampleData } from '../state.js';
import { esc } from '../util.js';
import { stripHtml, chipsFor, leagueChoices, warnHtml, sampleButton } from './shared.js';

export function ballLine(b) {
  if (b.s.length === 10) return b.l.length ? 'Left ' + leaveInfo(b.l).title : 'Strike';
  if (!b.l.length) return 'Made it';
  return 'Missed' + (b.m ? ', ' + REASON_TEXT[b.m] : '') + (b.l.length < b.s.length ? ' (' + b.l.join('-') + ' left)' : '');
}

export function viewGames() {
  if (ui.detail) { let gd = gameById(ui.detail); if (gd) return viewDetail(gd); ui.detail = null; }
  let h = warnHtml() + '<div class="stack"><h1 class="h1">Games</h1></div>';
  if (data.leagues.length > 1) h += chipsFor(leagueChoices(), ui.gFilter, 'gFilter');
  let gs = data.games.filter(function (g) { return g.balls.length > 0 && (ui.gFilter === 'all' || g.leagueId === ui.gFilter); });
  gs.sort(function (a, b) { return b.t - a.t; });
  if (!gs.length) {
    h += '<div class="panel"><div class="h3">No games yet</div><p class="muted small" style="margin:0">Games you log show up here, grouped by night and league. Tap one to see every frame and leave.</p>' +
      '<button type="button" class="btn primary sm full" data-act="goBowl">Start a game</button>' + (data.games.length ? '' : sampleButton()) + '</div>';
  } else {
    let groups = [], idx = {};
    gs.forEach(function (g) {
      let k = dayKey(g.t) + '|' + g.leagueId;
      if (!(k in idx)) { idx[k] = groups.length; groups.push({ t: g.t, leagueId: g.leagueId, games: [] }); }
      groups[idx[k]].games.push(g);
    });
    groups.forEach(function (gr) {
      gr.games.sort(function (a, b) { return a.t - b.t; });
      h += '<div class="group"><div class="eyebrow">' + esc(fmtDay(gr.t)) + ' · ' + esc(leagueName(gr.leagueId)) + '</div>' + gr.games.map(function (g) {
        let s = gameSummary(g.balls);
        return '<button type="button" class="gbtn" data-act="open" data-id="' + esc(g.id) + '"><div><div class="h3">Game ' + gameNumber(g) + '</div><div class="small muted" style="margin-top:3px">' +
          (s.done ? s.strikes + ' strike' + (s.strikes === 1 ? '' : 's') + (s.tries ? ' · ' + s.made + ' of ' + s.tries + ' spares' : '') : 'In progress') + '</div></div><div class="num">' + s.score + '</div></button>';
      }).join('') + '</div>';
    });
  }

  /* leagues */
  h += '<hr class="hr"><div class="stack-lg"><h2 class="h2">Leagues</h2>';
  if (!data.leagues.length) h += '<div class="small muted">Leagues you add when starting a game appear here.</div>';
  data.leagues.forEach(function (l) {
    if (ui.renaming === l.id) {
      h += '<div class="row"><input class="field grow" id="renameField" type="text" maxlength="40" value="' + esc(l.name) + '" aria-label="League name"><button type="button" class="btn sm ghost" data-act="renameSave" data-id="' + esc(l.id) + '">Save</button><button type="button" class="btn sm quiet" data-act="renameCancel">Cancel</button></div>';
    } else {
      h += '<div class="card" style="min-height:56px"><div><div class="h3">' + esc(l.name) + '</div></div><button type="button" class="btn sm quiet" data-act="rename" data-id="' + esc(l.id) + '">Rename</button></div>';
    }
  });
  h += '</div>';

  /* backup */
  h += '<hr class="hr"><div class="stack-lg"><h2 class="h2">Backup</h2><p class="small muted" style="margin:0">Your games are stored on this phone only. Save a copy now and then so a cleared browser never costs you a season.</p>' +
    '<div class="row wrap">' + '<button type="button" class="btn sm ghost grow" data-act="dl">Download</button>' + '<button type="button" class="btn sm ghost grow" data-act="copy">Copy</button>' +
    '<label class="btn sm quiet grow" for="restoreFile" style="cursor:pointer">Restore</label><input class="sr" type="file" id="restoreFile" accept=".json,application/json"></div>';
  if (ui.backupText) h += '<textarea class="field" id="backupBox" readonly aria-label="Backup text">' + esc(ui.backupText) + '</textarea><div class="tiny muted">Select all, copy, and paste it into a note.</div>';
  h += '</div>';
  if (hasSampleData()) h += '<button type="button" class="btn sm quiet full" data-act="rmSample">Remove sample games</button>';
  return h;
}

export function viewDetail(g) {
  let d = derive(g.balls), s = gameSummary(g.balls);
  let h = warnHtml() + '<button type="button" class="btn sm quiet" style="align-self:flex-start" data-act="back">← All games</button>';
  h += '<div class="head"><div><div class="eyebrow">' + esc(fmtDay(g.t)) + ' · ' + esc(leagueName(g.leagueId)) + '</div><div class="h1" style="margin-top:4px">Game ' + gameNumber(g) + '</div></div>' +
    '<div class="right"><div class="num" style="font-size:44px">' + s.score + '</div>' + (s.done ? '' : '<div class="tiny muted">in progress</div>') + '</div></div>';
  h += stripHtml(d.frames, g.balls, -1);
  h += '<div class="tiles three"><div class="tile"><div class="num">' + s.strikes + '</div><div class="lb">Strikes</div></div>' +
    '<div class="tile"><div class="num">' + (s.tries ? s.made + '/' + s.tries : '–') + '</div><div class="lb">Spares made</div></div>' +
    '<div class="tile"><div class="num">' + s.open + '</div><div class="lb">Open frames</div></div></div>';
  h += '<div class="stack"><label class="small muted" for="gameDate">Date played</label><div class="row"><input class="field grow" type="date" id="gameDate" value="' + isoDay(g.t) + '"><button type="button" class="btn sm ghost" data-act="saveDate">Save date</button></div></div>';
  h += '<div class="frames">' + d.frames.filter(function (f) { return f.balls.length; }).map(function (f, i) {
    return '<div class="frow"><div class="num">' + (i + 1) + '</div><div class="txt">' + f.balls.map(function (b) { return esc(ballLine(b)); }).join(' → ') + '</div></div>';
  }).join('') + '</div>';
  if (!s.done) h += '<button type="button" class="btn primary sm full" data-act="resume" data-id="' + esc(g.id) + '">Continue this game</button>';
  h += '<button type="button" class="btn sm quiet full" data-act="delGame" data-id="' + esc(g.id) + '">' + (ui.confirm === 'del' + g.id ? 'Tap again to delete this game' : 'Delete game') + '</button>';
  return h;
}
