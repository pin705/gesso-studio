# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
