/* Bowling logic: pure functions, no DOM. Shared by the app and the tests. */
export const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const ADJ = {
  1: [2, 3], 2: [1, 3, 4, 5], 3: [1, 2, 5, 6], 4: [2, 5, 7, 8], 5: [2, 3, 4, 6, 8, 9],
  6: [3, 5, 9, 10], 7: [4, 8], 8: [4, 5, 7, 9], 9: [5, 6, 8, 10], 10: [6, 9]
};
export const SPLIT_NAMES = { '7-10': 'Bedposts', '4-6-7-10': 'Big four', '2-7': 'Baby split', '3-10': 'Baby split' };

export function sortPins(a) { return a.slice().sort(function (x, y) { return x - y; }); }
export function leaveKey(p) { return sortPins(p).join('-'); }

export function componentCount(pins) {
  let left = {}, seen = {}, count = 0, i;
  for (i = 0; i < pins.length; i++) left[pins[i]] = true;
  for (i = 0; i < pins.length; i++) {
    let p = pins[i];
    if (seen[p]) continue;
    count++;
    let stack = [p];
    seen[p] = true;
    while (stack.length) {
      let cur = stack.pop();
      let nb = ADJ[cur];
      for (let j = 0; j < nb.length; j++) {
        if (left[nb[j]] && !seen[nb[j]]) { seen[nb[j]] = true; stack.push(nb[j]); }
      }
    }
  }
  return count;
}

/* A split: head pin down, two or more pins up, and the standing pins do not all touch. */
export function isSplit(pins) {
  return pins.length >= 2 && pins.indexOf(1) < 0 && componentCount(pins) > 1;
}

export function leaveInfo(pins) {
  let key = leaveKey(pins), n = pins.length;
  if (n === 0) return { key: '', title: 'Clean', kind: 'none', sub: '' };
  if (n === 1) {
    return { key: key, title: pins[0] === 1 ? 'Head pin' : pins[0] + '-pin', kind: 'single', sub: 'Single pin leave' };
  }
  if (n === 10) return { key: key, title: 'Nothing down', kind: 'multi', sub: 'All ten pins standing' };
  if (n >= 7) return { key: key, title: n + ' pins left', kind: 'multi', sub: 'Pins ' + key };
  if (isSplit(pins)) {
    let nm = SPLIT_NAMES[key];
    return { key: key, title: key, kind: 'split', sub: nm ? 'Split · ' + nm : 'Split' };
  }
  return { key: key, title: key, kind: 'multi', sub: pins.indexOf(1) >= 0 ? 'Multi-pin leave, includes head pin' : 'Multi-pin leave' };
}

/* A ball is {s: pins standing before it, l: pins standing after it, m: miss reason or null}. */
export function knocked(b) { return b.s.length - b.l.length; }

/* Turn the flat list of balls into frames and say what the next ball is. */
export function derive(balls) {
  let frames = [], idx = 0, f, fr, b1, b2, b3;
  for (f = 0; f < 10; f++) {
    fr = { balls: [], complete: false };
    frames.push(fr);
    if (idx >= balls.length) return { frames: frames, cur: { frame: f, ball: 0, start: ALL.slice() }, done: false };
    b1 = balls[idx++]; fr.balls.push(b1);
    if (f < 9) {
      if (b1.l.length === 0) { fr.complete = true; continue; }
      if (idx >= balls.length) return { frames: frames, cur: { frame: f, ball: 1, start: b1.l.slice() }, done: false };
      fr.balls.push(balls[idx++]); fr.complete = true;
      continue;
    }
    let strike1 = b1.l.length === 0;
    if (idx >= balls.length) return { frames: frames, cur: { frame: 9, ball: 1, start: strike1 ? ALL.slice() : b1.l.slice() }, done: false };
    b2 = balls[idx++]; fr.balls.push(b2);
    let need3 = strike1 || b2.l.length === 0;
    if (!need3) { fr.complete = true; break; }
    if (idx >= balls.length) return { frames: frames, cur: { frame: 9, ball: 2, start: b2.l.length === 0 ? ALL.slice() : b2.l.slice() }, done: false };
    b3 = balls[idx++]; fr.balls.push(b3); fr.complete = true;
  }
  return { frames: frames, cur: null, done: true };
}

/* Running score after each frame, or null where later balls are still needed. */
export function scoreGame(balls) {
  let rolls = balls.map(knocked), cum = [], total = 0, ri = 0, alive = true;
  for (let f = 0; f < 10; f++) {
    let v = null;
    if (alive) {
      let r0 = rolls[ri];
      if (r0 === undefined) alive = false;
      else if (r0 === 10) {
        let a = rolls[ri + 1], b = rolls[ri + 2];
        if (a === undefined || b === undefined) alive = false;
        else { total += 10 + a + b; v = total; }
        ri += 1;
      } else {
        let r1 = rolls[ri + 1];
        if (r1 === undefined) alive = false;
        else if (r0 + r1 === 10) {
          let c = rolls[ri + 2];
          if (c === undefined) alive = false;
          else { total += 10 + c; v = total; }
          ri += 2;
        } else { total += r0 + r1; v = total; ri += 2; }
      }
    }
    cum.push(v);
  }
  return cum;
}

export function runningScore(balls) {
  let cum = scoreGame(balls), last = 0;
  for (let i = 0; i < cum.length; i++) if (cum[i] !== null) last = cum[i];
  return last;
}

export function ballSymbol(b) {
  if (b.l.length === 0) return b.s.length === 10 ? 'X' : '/';
  let k = knocked(b);
  return k === 0 ? '-' : String(k);
}

export function frameMarks(frame) {
  return frame.balls.map(ballSymbol);
}

export function gameSummary(balls) {
  let d = derive(balls), strikes = 0, made = 0, tries = 0, open = 0, i;
  for (i = 0; i < balls.length; i++) {
    let b = balls[i];
    if (b.s.length === 10 && b.l.length === 0) strikes++;
    if (b.s.length < 10) { tries++; if (b.l.length === 0) made++; }
  }
  for (i = 0; i < d.frames.length; i++) {
    let fr = d.frames[i];
    if (fr.complete && fr.balls[0].l.length > 0 && fr.balls[1] && fr.balls[1].l.length > 0) open++;
  }
  return { strikes: strikes, made: made, tries: tries, open: open, score: runningScore(balls), done: d.done };
}

/* Stats over a list of games. */
export function computeStats(games) {
  let firstBalls = 0, firstStrikes = 0, standing = {}, byLeave = {}, tries = 0, made = 0, done = 0, scoreSum = 0, i, j, p;
  for (p = 1; p <= 10; p++) standing[p] = 0;
  for (i = 0; i < games.length; i++) {
    let balls = games[i].balls;
    if (derive(balls).done) { done++; scoreSum += runningScore(balls); }
    for (j = 0; j < balls.length; j++) {
      let b = balls[j];
      if (b.s.length === 10) {
        firstBalls++;
        if (b.l.length === 0) firstStrikes++;
        for (let k = 0; k < b.l.length; k++) standing[b.l[k]]++;
      } else {
        tries++;
        let key = leaveKey(b.s);
        let e = byLeave[key] || (byLeave[key] = { key: key, pins: sortPins(b.s), attempts: 0, made: 0, misses: {}, untagged: 0 });
        e.attempts++;
        if (b.l.length === 0) { e.made++; made++; }
        else if (b.m) e.misses[b.m] = (e.misses[b.m] || 0) + 1;
        else e.untagged++;
      }
    }
  }
  let leaves = Object.keys(byLeave).map(function (k) { return byLeave[k]; });
  leaves.sort(function (a, b) { return b.attempts - a.attempts || (a.key < b.key ? -1 : 1); });
  return {
    games: games.length, finished: done, average: done ? Math.round(scoreSum / done) : null,
    firstBalls: firstBalls, strikePct: firstBalls ? Math.round(100 * firstStrikes / firstBalls) : null,
    standing: standing, tries: tries, made: made, sparePct: tries ? Math.round(100 * made / tries) : null,
    leaves: leaves
  };
}
