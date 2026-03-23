# Test Coverage

Verified at: 2026-03-23

## Current State

- No test files were found by repository scan.
- No unit, integration, or end-to-end harness is defined in `package.json`.
- There is no static evidence of CI enforcement for behavior or regression checks.

## Effective Coverage Model

Current confidence is based on:
- manual browser-driven verification in development mode
- successful production bundle generation
- static reading of Vue components, mixins, and config files

## Highest-Risk Untested Areas

- `src/components/Piano.vue`
  - manual key interaction
  - sample loading
  - event-bus listener setup
- `src/mixins/xmlAutoPlayMixin.js`
  - measure iteration
  - stop/queue edge cases
- `src/mixins/midiAutoPlayMixin.js`
  - async MIDI loading
  - note scheduling loop
- `src/components/AutoPlayScoreList.vue`
  - transition between list and player modes
  - XML AJAX load success/failure behavior
- `src/components/PageHeader.vue`
  - wallpaper change path and image preload behavior

## Evidence Gaps

- evidence gap: no automated assertions exist for score parsing/playback timing.
- evidence gap: no automated coverage exists for legacy webpack build compatibility.
- evidence gap: mobile page behavior is not exercised by routing and is likely stale.

## Recommendation

Before changing playback logic, at minimum add one focused regression path around:
- emitting an autoplay event
- scheduling notes in the relevant mixin
- stopping playback cleanly
