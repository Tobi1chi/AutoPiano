# Domains

Verified at: 2026-03-23

## Core Domain Concepts

### Virtual Piano
- Rendered in `src/components/Piano.vue`
- Represents white/black keys from `Notes`
- Supports click and keyboard-triggered note playback
- Uses sampled piano audio via `Tonejs-Instruments`

### Manual Scores
- Source: `src/config/scoremanual.js`
- Presented by `ManualPlayScoreList.vue`
- Purpose: teach users which keyboard keys to press manually
- Important distinction: these are read/display artifacts, not timed autoplay assets

### Numbered Notation Autoplay
- Source: `src/config/scorenum.js`
- Engine: `pianoAutoPlayMixin.js`
- Domain model: scale degree notation plus step map and tempo

### MusicXML-Derived Autoplay
- Source: `src/config/scorexml.js` and `static/xmlscore/*.json`
- Engine: `xmlAutoPlayMixin.js`
- Domain model: measures -> staff -> voice -> note arrays with duration/chord/tie metadata

### MIDI Autoplay
- Source: `src/config/scoremidi.js` and `static/midi/*.mid`
- Engine: `midiAutoPlayMixin.js`
- Domain model: MIDI tracks and note timing parsed by `@tonejs/midi`

### Wallpaper State
- Source: `src/config/wallpaper.js`
- Managed by Vuex module `src/store/modules/autopiano.js`
- Changed through `PageHeader.vue`

### Event Bus Protocol
- Source: `src/config/index.js` `OBEvent`
- Transport: `Observe`
- Role: orchestrates playback, loading, wallpaper change, and playback stop/end signals

### Link and Commerce Content
- Links: `src/config/links.js` rendered in `FriendLinks.vue`
- Goods: `src/config/goods.js` plus optional `/static/data/goods.json`, rendered in `CommodityList.vue`

## Concept Boundaries

- Vuex is not the app's general domain store; it currently behaves like a narrow UI-state holder.
- `OBEvent` is the actual workflow backbone for playback features.
- Static config files are part of the product domain, not just seed data. Many feature edits will be data edits, not component edits.

## Unknowns

- unknown: no direct evidence shows whether `static/data/goods.json` is expected to exist in deployments; `CommodityList.vue` tolerates its absence by keeping config defaults.
- unknown: the intended production role of `AutoPianoMobile.vue` is unclear because it is not routed.
