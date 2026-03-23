# Dependencies

Verified at: 2026-03-23

Most relationships below are inferred from file imports and component registration during manual inspection. Raw AST output did not recover internal import edges for this repository.

## System Dependency Graph

```mermaid
graph TD
  A["main.js / App shell"] --> B["Router"]
  A --> C["Vuex store"]
  B --> D["AutoPianoPC page"]
  B --> E["FriendLinks page"]
  D --> F["Header / Footer / Lyrics / Lists / Commodity UI"]
  D --> G["Piano component"]
  E --> F
  F --> H["src/config datasets"]
  G --> H
  G --> I["Autoplay mixins"]
  I --> H
  I --> J["Observe event bus"]
  G --> J
  G --> K["Tonejs-Instruments / tone / @tonejs/midi"]
  F --> L["static assets and AJAX-loaded JSON"]
  M["Webpack build config"] --> A
  M --> L
```

## Practical Dependency Notes

- `src/main.js` imports the root app, store, and router.
- `src/router/index.js` lazy-loads `AutoPianoPC` and `FriendLinks`.
- `AutoPianoPC.vue` composes the main page from header, piano, two score lists, footer, and commodity list.
- `FriendLinks.vue` shares header/footer and consumes `Links` plus wallpaper state.
- `PageHeader.vue` drives wallpaper changes through `Observe` and the Vuex wallpaper action.
- `Piano.vue` is the hub for playback behavior and mixes in all autoplay implementations.
- `AutoPlayScoreList.vue` emits events that trigger numbered score, MIDI, or MusicXML playback.
- `ManualPlayScoreList.vue` is isolated from playback and acts as a read-only training catalog.
- `CommodityList.vue` falls back to `src/config/goods.js` and then overwrites with AJAX-loaded `/static/data/goods.json` if present.

## Key Flows

### Wallpaper flow

```mermaid
sequenceDiagram
  participant User
  participant Header as PageHeader.vue
  participant Bus as Observe
  participant Store as Vuex AutoPianoModule
  participant Page as AutoPianoPC/FriendLinks

  User->>Header: click "更换壁纸"
  Header->>Bus: emit CHANGE_WALLPAPER
  Header->>Store: dispatch $setWallpaper after image preload
  Store-->>Page: getter $currentWallpaper updates
  Page-->>User: background image changes
```

### Autoplay flow

```mermaid
sequenceDiagram
  participant User
  participant List as AutoPlayScoreList.vue
  participant Bus as Observe
  participant Piano as Piano.vue
  participant Mixin as autoplay mixins

  User->>List: choose score
  List->>Bus: emit AUTO_PLAY_* event
  Bus->>Piano: listener receives event
  Piano->>Mixin: delegate to numbered/XML/MIDI handler
  Mixin-->>Piano: trigger playNote / key highlight loop
```

## Coupling Warnings From Git

- `config/index.js` co-changes heavily with `index.html`, `src/config/scorexml.js`, `src/config/wallpaper.js`, and `src/lib/Tonejs-Instruments.js`.
- `src/components/Piano.vue` co-changes with `src/router/index.js`, `src/config/index.js`, and `src/components/Footer.vue`.
- `package.json` and `yarn.lock` move together, as expected for dependency edits.

These are change-risk hints, not proof of runtime dependency.
