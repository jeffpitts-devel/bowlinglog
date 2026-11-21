// Run with: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL, derive, scoreGame, runningScore, leaveInfo, gameSummary, computeStats } from '../js/logic.js';

const strike = () => ({ s: ALL.slice(), l: [], m: null });
const ball = (s, l) => ({ s, l, m: null });

test('perfect game scores 300', () => {
  const balls = Array.from({ length: 12 }, strike);
  assert.equal(runningScore(balls), 300);
  assert.equal(derive(balls).done, true);
});

test('nine strikes then X 9 / scores 289', () => {
  const balls = Array.from({ length: 10 }, strike);
  balls.push(ball(ALL.slice(), [10]), ball([10], []));
  assert.equal(runningScore(balls), 289);
});

test('open frame and score after each frame', () => {
  const balls = [ball(ALL.slice(), [7, 10]), ball([7, 10], [10])];
  assert.deepEqual(scoreGame(balls).slice(0, 2), [9, null]);
});

test('leave classification', () => {
  assert.equal(leaveInfo([7, 10]).sub, 'Split · Bedposts');
  assert.equal(leaveInfo([1, 2]).kind, 'multi');
  assert.equal(leaveInfo([6]).title, '6-pin');
  assert.equal(leaveInfo(ALL).title, 'Nothing down');
});

test('spare stats count made and missed', () => {
  const g = { balls: [ball(ALL.slice(), [10]), ball([10], []), ball(ALL.slice(), [10]), { s: [10], l: [10], m: 'left' }] };
  const st = computeStats([g]);
  assert.equal(st.tries, 2);
  assert.equal(st.made, 1);
  assert.equal(gameSummary(g.balls).tries, 2);
});
