# Bowling Tracker

A phone-first PWA for logging bowling games, first-ball leaves and spare results. No build step, no dependencies.

## Layout
- `index.html` – page shell
- `css/styles.css` – all styling
- `js/logic.js` – pure scoring and stats (no DOM; unit tested)
- `js/state.js` – saved data (`localStorage`), screen state, lookups
- `js/views/` – one file per screen (`bowl`, `stats`, `games`) plus shared pieces
- `js/actions.js` – every button, keyboard and file handler
- `js/render.js`, `js/main.js` – drawing and startup
- `js/sample.js` – optional sample games
- `sw.js`, `manifest.webmanifest`, `icon-*.png` – offline and install support

## Run locally
ES modules need a web server (not file://): `npx http-server . -p 8080`, then open http://localhost:8080.

## Tests
`node --test`

## Deploying an update
Replace the files on GitHub, and bump `CACHE_VERSION` in `sw.js` so phones fetch the new version.
Saved games are unaffected: the storage format is unchanged.
