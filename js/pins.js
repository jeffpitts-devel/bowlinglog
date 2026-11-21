/* Pin deck layout, heat colours and small icons, all as HTML strings. */
const LAYOUT = { 7: [-102, 24], 8: [-34, 24], 9: [34, 24], 10: [102, 24], 4: [-68, 86], 5: [0, 86], 6: [68, 86], 2: [-34, 148], 3: [34, 148], 1: [0, 210] };
export function pinPos(n) {
  let p = LAYOUT[n];
  return 'left:' + ((178 + p[0]) / 358 * 100).toFixed(2) + '%;top:' + ((p[1] + 26) / 286 * 100).toFixed(2) + '%';
}
export function pinEl(n, cls, act, label, pressed) {
  let style = pinPos(n);
  if (act) {
    return '<button type="button" class="pin ' + cls + '" style="' + style + '" data-act="' + act + '" data-n="' + n + '" aria-label="' + label + '" aria-pressed="' + pressed + '">' + n + '</button>';
  }
  return '<div class="pin ' + cls + '" style="' + style + '" aria-hidden="true">' + n + '</div>';
}
export function deck(label, inner) { return '<div class="deck" role="group" aria-label="' + label + '">' + inner + '</div>'; }

export const HEAT = [
  ['#1B232C', '#2B3745', '#9AA7B5'],
  ['#5A4313', '#7A5C1C', '#FFE9B8'],
  ['#C98F14', '#C98F14', '#1A1203'],
  ['#FFB020', '#FFB020', '#1A1203'],
  ['#FFD36B', '#FFD36B', '#1A1203']
];
export function heatLevel(p) { return p < 3 ? 0 : p < 5 ? 1 : p < 8 ? 2 : p < 12 ? 3 : 4; }
export function arrowSvg() { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>'; }
export function checkSvg() { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>'; }
export function crossSvg() { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>'; }
