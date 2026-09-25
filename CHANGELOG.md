# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Gesso Kit** at `/kit`: CSS materials and components (`gesso.css`), procedural textures, 13 self-hosted game fonts, game-icons and lucide silhouettes, and browser builds of PixiJS, pixi-filters, three.js and Rough.js.
- HTML assets alongside SVG, rendered on an isolated origin; `defineAsset()` runtime for deterministic Pixi and three.js frames.
- `search_icons` MCP tool, `kit` and `asset-types/mockup` guides, mockup asset type.
- Server-rendered thumbnails for every format, revision and scale.
- Export manifests carry CC BY 3.0 credits for silhouettes used.

### Fixed
- Content bounds are measured from rendered pixels, so clip paths and glows no longer cause false edge warnings; `data-bleed` marks intentional full-bleed art.
- A file removed on disk no longer deletes its history: the asset is hidden and revived with all revisions when the file returns.
- `view_assets` shows animated assets at a representative frame.

## [0.3.0] - 2026-09-25

### Added
- Nuxt 4 application: studio UI, REST API and MCP in one local server.
- MCP over Streamable HTTP at `/mcp`, and a stdio bridge (`gesso mcp`) for stdio-only clients.
- SQLite storage through `node:sqlite`: projects, revisions, feedback, activity.
- Multi-project support and a bundled showcase project.
- Review workflow: statuses, pinned feedback, and agent replies through the `get_feedback` and `resolve_feedback` tools.
- Revision history with swipe comparison and restore; direct file edits are picked up as revisions and linted in the background.
- Viewer: backdrops, zoom and pan, grayscale value check, 9-slice guides and stretch test, animation playback and frame stepping.
- Agent self-critique scores stored with each revision and shown in the studio.
- Art bible viewer and editor, knowledge base browser, exports page, live activity feed, command palette, light and dark themes.
- Security guards: local Host and Origin checks, confined writes, inert SVG serving.

### Changed
- Renamed the project to **Gesso** and licensed it under Apache-2.0.

## [0.2.0] - 2026-09-25

### Added
- Local MCP server with a game-art knowledge base, a rendered review sheet and lint.
- Genre style packs; the art bible (`STYLE.md`) per project replaces hard-coded xianxia generators.
