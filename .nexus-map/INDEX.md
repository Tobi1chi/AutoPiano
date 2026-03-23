# AutoPiano Nexus Map

Verified at: 2026-03-23

AutoPiano is a Vue 2 single-page web piano app with one primary routed experience: the desktop piano page. The core runtime path is `src/main.js` -> `src/App.vue` -> `src/router/index.js` -> `src/pages/AutoPianoPC.vue`, with Vuex used only for wallpaper state and an event bus used for playback orchestration.

The product is mostly front-end only. Static content and score catalogs live in `src/config/` and `static/`. The largest behavioral hotspot is [`src/components/Piano.vue`](/Volumes/111/portable_wd/AutoPiano/src/components/Piano.vue), which owns keyboard rendering, sample loading, user input, and three autoplay modes via mixins.

Primary systems:
- UI shell and routing: `src/main.js`, `src/App.vue`, `src/router/index.js`
- Playback engine: `src/components/Piano.vue`, `src/mixins/*.js`, `src/lib/Tonejs-Instruments.js`
- Score and content catalogs: `src/config/*.js`, `static/xmlscore/`, `static/midi/`
- Supporting presentation components: `src/components/*.vue`, `src/pages/*.vue`
- Build pipeline: `build/`, `config/`, `package.json`

Important constraints:
- `AutoPianoMobile.vue` exists but is not referenced by router or any other module; current shipped route entry is desktop-focused.
- There are no test files in the repository.
- AST coverage is downgraded: `.vue` files were captured at module level only, and internal dependency edges were validated by manual inspection rather than automated graph extraction.

Change hotspots from Git history over 4000 days / 51 commits / 4 authors:
- `src/components/Piano.vue`
- `src/components/AutoPlayScoreList.vue`
- `src/config/scorexml.js`
- `src/router/index.js`
- `config/index.js`

High-risk change themes:
- Playback behavior changes usually cross `Piano.vue`, one or more autoplay mixins, and config datasets.
- Presentation changes on the main page often span `AutoPianoPC.vue`, `PageHeader.vue`, `Footer.vue`, and `CommodityList.vue`.
- Build/deploy changes touch both webpack config under `build/` and app HTML/config under `index.html` and `config/index.js`.

Evidence gaps:
- unknown: there is no direct evidence that `AutoPianoMobile.vue` is reachable in the current app build.
- evidence gap: AST import edges are absent in raw output, so dependency sections below are inferred from file imports and component registration.
- unsupported language downgrade: Vue SFCs have module-only AST coverage in raw data.

## [操作指南] 强制执行步骤

> 本节是对所有读取本文件的 AI 发出的硬性操作指令，不是建议。

### 步骤1 — 必须先读完以下所有文件（顺序不限）

读完本文件后，在执行任何任务之前，必须依次 read 以下文件完整内容：

- `.nexus-map/arch/systems.md` — 系统边界与代码位置
- `.nexus-map/arch/dependencies.md` — 系统间依赖关系与 Mermaid 图
- `.nexus-map/arch/test_coverage.md` — 测试面与证据缺口
- `.nexus-map/hotspots/git_forensics.md` — Git 热点与耦合风险
- `.nexus-map/concepts/domains.md` — 核心领域概念

> 这些文件均为高密度摘要，总量通常 < 5000 tokens，是必要的上下文成本。
> 不得以"任务简单"或"只改一个文件"为由跳过。

### 步骤2 — 按任务类型追加操作（步骤1 完成后执行）

- 若任务涉及接口修改、新增跨模块调用、删除或重命名公共函数：
  → 必须运行 `query_graph.py --impact <目标文件>`，同时手工检查相关 `.vue` 导入链，因为当前图谱对 Vue 依赖覆盖不完整。
- 若任务需要判断某文件被谁引用：
  → 先运行 `query_graph.py --summary`，再用 `rg` 校对 `@/` 导入关系。
- 若仓库结构已发生重大变化：
  → 任务完成后重新运行 nexus-mapper 更新 `.nexus-map/`。
