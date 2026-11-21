import { ui } from './state.js';
import { $ } from './util.js';
import { viewBowl } from './views/bowl.js';
import { viewStats } from './views/stats.js';
import { viewGames } from './views/games.js';

const VIEWS = { bowl: viewBowl, stats: viewStats, games: viewGames };

/* Redraw the current tab. Keeps the scroll position unless resetScroll is true. */
export function render(resetScroll) {
  const view = $('view'), scroll = view.scrollTop;
  view.innerHTML = (VIEWS[ui.tab] || viewBowl)();
  view.scrollTop = resetScroll ? 0 : scroll;
  document.querySelectorAll('.navb').forEach(function (b) {
    if (b.getAttribute('data-tab') === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}
