# Systems

Verified at: 2026-03-23

## System Boundaries

### 1. Bootstrap and App Shell
- Files: `src/main.js`, `src/App.vue`, `src/router/index.js`, `src/store/index.js`
- Responsibility: create the Vue app, mount router and store, load global styles, and expose the routed page shell.
- Notes: routing is hash-based and only defines `/` and `/links`.

### 2. Main Piano Experience
- Files: `src/pages/AutoPianoPC.vue`, `src/components/Piano.vue`, `src/components/PageHeader.vue`, `src/components/Footer.vue`, `src/components/RandomLyric.vue`, `src/components/ManualPlayScoreList.vue`, `src/components/AutoPlayScoreList.vue`, `src/components/CommodityList.vue`
- Responsibility: render the desktop landing page, keyboard UI, score lists, wallpaper controls, footer support popup, and product carousel.
- Notes: this is the primary user-facing system and the likely default modification target.

### 3. Playback Engine
- Files: `src/components/Piano.vue`, `src/mixins/pianoAutoPlayMixin.js`, `src/mixins/xmlAutoPlayMixin.js`, `src/mixins/midiAutoPlayMixin.js`, `src/lib/Tonejs-Instruments.js`, `src/utils/index.js`, `src/utils/observe.js`
- Responsibility: load piano samples, handle manual keyboard/click playback, and orchestrate numbered notation, MusicXML JSON, and MIDI autoplay.
- Notes: coordination is event-driven through `Observe` and `OBEvent`.

### 4. Data Catalogs and Static Assets
- Files: `src/config/index.js`, `src/config/*.js`, `static/xmlscore/*`, `static/midi/*`, `static/data/*`, `static/samples/piano/*`
- Responsibility: hold note metadata, lyric lists, wallpaper choices, score definitions, external links, goods metadata, and static media.
- Notes: many user-visible changes are pure data edits here rather than component logic edits.

### 5. Presentation Utilities
- Files: `src/components/CommodityCard.vue`, `src/components/ModalLoader.vue`, `src/assets/style/*`
- Responsibility: present reusable UI fragments and global styling primitives.
- Notes: low domain complexity, but broad visual impact.

### 6. Build and Packaging
- Files: `build/*`, `config/*`, `index.html`, `package.json`
- Responsibility: webpack dev server, production build config, HTML template, aliases, and environment settings.
- Notes: legacy Vue 2 + webpack 2 toolchain; changes here need compatibility caution.

## Entry Points

- Runtime entry: [`src/main.js`](/Volumes/111/portable_wd/AutoPiano/src/main.js)
- Primary routed page: [`src/pages/AutoPianoPC.vue`](/Volumes/111/portable_wd/AutoPiano/src/pages/AutoPianoPC.vue)
- Secondary routed page: [`src/pages/FriendLinks.vue`](/Volumes/111/portable_wd/AutoPiano/src/pages/FriendLinks.vue)
- Build entry: [`build/dev-server.js`](/Volumes/111/portable_wd/AutoPiano/build/dev-server.js) and [`build/build.js`](/Volumes/111/portable_wd/AutoPiano/build/build.js)

## Notable Observations

- `src/pages/AutoPianoMobile.vue` is currently orphaned: `rg` found no imports or route references to it.
- Vuex usage is intentionally narrow; the only obvious persisted app state is wallpaper.
- The event bus is more important than Vuex for behavioral flow.
- `src/config/scoremanual.js` and related score datasets are large content sources and can dominate line count without adding architectural complexity.

## Provenance

- Module inventory comes from `.nexus-map/raw/file_tree.txt` and `.nexus-map/raw/ast_nodes.json`.
- Dependency placement for Vue SFCs is inferred from manual inspection because Vue AST support is module-only in this run.
