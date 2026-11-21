/* Small DOM and string helpers. */
export function $(id) { return document.getElementById(id); }
export function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
export function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
export function toggle(arr, n) { let i = arr.indexOf(n); let c = arr.slice(); if (i >= 0) c.splice(i, 1); else c.push(n); return c; }
let toastTimer = null;
export function toast(msg) {
  let t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
}
