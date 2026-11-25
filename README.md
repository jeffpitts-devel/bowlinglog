# Bowling Tracker

A phone-first app for logging bowling games, first-ball leaves and spare results. No build step, no dependencies.

## Files
- `index.html` – the whole app (screens, scoring, stats, backup and restore)
- `manifest.json`, `icon-*.png` – install-to-home-screen support
- `sw.js` – offline support

## Run locally
Needs a web server (not file://): `npx http-server . -p 8080`, then open http://localhost:8080.

## Deploying an update
Replace `index.html` on GitHub. Open the installed app online once or twice to pick up the new version.
Saved games stay in the browser on each device. Use Download in the Games tab to back them up, and Restore to load a backup.
