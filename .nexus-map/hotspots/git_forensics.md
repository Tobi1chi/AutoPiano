# Git Forensics

Verified at: 2026-03-23
Window: 4000 days
Stats: 51 commits, 4 authors

## Hotspots

Top change-frequency files from `.nexus-map/raw/git_stats.json`:

1. `README.md` — 20 changes — high
2. `index.html` — 12 changes — medium
3. `src/components/Footer.vue` — 10 changes — medium
4. `package.json` — 10 changes — medium
5. `src/config/scorexml.js` — 10 changes — medium
6. `config/index.js` — 9 changes — medium
7. `src/components/Piano.vue` — 9 changes — medium
8. `src/components/AutoPlayScoreList.vue` — 8 changes — medium
9. `src/router/index.js` — 8 changes — medium
10. `src/config/lyrics.js` — 7 changes — medium

## Relevant Engineering Takeaways

- `src/components/Piano.vue` is the most important code hotspot for behavior changes. Treat it as a regression-sensitive file even though docs and packaging files outrank it in raw count.
- `src/config/scorexml.js` being a hotspot suggests product behavior has historically changed through curated content as much as through engine code.
- `src/router/index.js` and `index.html` show repeated co-change activity, which hints that route and app-shell modifications were often bundled together.

## Coupling Pairs

Highest logical co-change pairs:

- `build/webpack.prod.conf.js` <-> `src/components/Footer.vue` — 7 co-changes, score 1.0
- `config/index.js` <-> `src/config/wallpaper.js` — 7 co-changes, score 1.0
- `config/index.js` <-> `src/lib/Tonejs-Instruments.js` — 7 co-changes, score 1.0
- `index.html` <-> `src/config/wallpaper.js` — 7 co-changes, score 1.0
- `index.html` <-> `src/lib/Tonejs-Instruments.js` — 7 co-changes, score 1.0
- `src/components/Piano.vue` <-> `src/router/index.js` — 7 co-changes, score 0.875
- `src/components/Piano.vue` <-> `src/config/index.js` — 6 co-changes, score 0.857
- `package.json` <-> `yarn.lock` — 6 co-changes, score 0.857

## Interpretation Rules

- Co-change is a maintenance signal, not proof of runtime dependency.
- When editing `Piano.vue`, review nearby changes in `src/config/index.js`, autoplay lists, and router/app-shell files.
- When editing build behavior, review both webpack config and HTML/app config together.

## Evidence Gaps

- evidence gap: hotspot data is historical Git activity only; it does not measure current runtime centrality.
