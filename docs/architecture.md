# Architecture

Gesso is one Nuxt 4 application. The browser runs the studio (a single-page app); the Nitro server owns the files, the database, the renderer and the MCP endpoint. Agents and the studio talk to the same server, so there is one writer and one source of truth.

```text
┌────────────── your machine ───────────────────────────────────────────────┐
│                                                                           │
│  agent (Claude Code, Codex, Cursor…)          browser: Gesso studio       │
│        │  MCP (HTTP /mcp)                            │ REST + SSE         │
│        │  or stdio → bin/gesso.mjs mcp ──┐           │                    │
│        ▼                                 ▼           ▼                    │
│  ┌──────────────────── Nitro server (server/) ───────────────────────┐    │
│  │ middleware/guard   local Host/Origin only                          │    │
│  │ utils/mcp          tools, JSON-RPC            api/*   studio REST  │    │
│  │ utils/pipeline     review → save → export     api/events  SSE      │    │
│  │ utils/store        projects, assets, revisions, feedback, activity │    │
│  │ utils/render       headless Chromium: lint, review & sprite sheets │    │
│  │ utils/watch        picks up direct file edits as revisions         │    │
│  └───────────┬──────────────────────────┬─────────────────────────────┘    │
│              ▼                          ▼                                  │
│   ~/.gesso/gesso.db (SQLite)     <project>/STYLE.md, assets/*.svg, exports/ │
└───────────────────────────────────────────────────────────────────────────┘
```

## Data

- **Project folders hold the art.** `assets/<id>.svg` is the current source of every asset; `STYLE.md` is the art bible; `exports/` holds generated files. Folders can live in the game's repository.
- **SQLite holds the history.** `~/.gesso/gesso.db` (`GESSO_HOME`) stores the project registry, every revision's SVG with its lint report and the agent's critique, feedback, activity and settings. It uses WAL mode and forward-only migrations keyed by `PRAGMA user_version` (`server/utils/db.ts`).
- **Files win.** When a file changes on disk (an agent with file tools, a hand edit, a `git pull`), the watcher records a new revision with source `disk` and lints it in the background. Writes from Gesso are atomic (temp file, then rename) and are ignored by the watcher because the content hash matches.

## Asset lifecycle

1. `save_asset` writes a hidden draft next to the assets, renders it, and lints it (`pipeline.saveReviewed`). Unparseable SVG is rejected; lint problems are recorded but don't block the save.
2. The draft becomes `assets/<id>.svg`, a revision is added, the status moves to **Needs review**, and an SSE event updates every open studio tab.
3. The user approves, requests changes or leaves feedback (optionally pinned to normalized coordinates). Feedback moves the asset to **Changes requested**.
4. The agent reads feedback with `get_feedback` (pins arrive in asset pixels), saves a new revision and resolves the item with a reply.
5. `export_assets` renders PNGs per scale and sprite sheets for animated assets, and updates `exports/manifest.json`.

## Rendering

Assets are HTML documents on the Gesso Kit or SVG. The renderer opens each one on a private origin (`http://gesso.render`) where only the asset's folder and `/kit` resolve; every other request, including the Gesso API and the network, is aborted, so scripted assets (Pixi, three) cannot reach anything. Scripted assets register `window.gesso.render(t)` through `/kit/gesso.mjs`, and Gesso calls it for every review and export frame. In the studio, HTML assets are served with a CSP `sandbox allow-scripts` directive (an opaque origin even when a file is opened directly, so asset scripts cannot call the studio API) and load only local resources; mockups can embed other assets in nested iframes.

`server/utils/render.ts` launches one shared Chromium (installed Chrome, then Edge, then Playwright's bundled Chromium, or `CHROME_PATH`). Each asset is opened as its own document so ids never collide. Scaling uses the SVG's `width`/`height` with its `viewBox`, so exports stay vector-sharp. Animations are sampled deterministically by pausing SMIL (`setCurrentTime`) and CSS animations (`currentTime`).

## MCP

`server/routes/mcp.ts` implements Streamable HTTP in stateless mode: every POST carries one JSON-RPC message or a batch, responses are JSON, notifications get `202`. The target project comes from `?project=<path or id>` or the studio's active project. `bin/gesso.mjs mcp` bridges stdio to that endpoint and starts the server when needed. Tool definitions are in `server/utils/mcp.ts`; see [mcp.md](mcp.md).

## Studio

`app/` is a Nuxt SPA (`ssr: false`) built with Tailwind CSS 4 and shadcn-vue. `useLive` holds one `EventSource` and refreshes only the data that changed. The viewer embeds SVGs in `<object>` elements so it can pause and scrub animations; thumbnails use `<img>`. The 9-slice stretch test uses CSS `border-image`, which slices the same way engines do.

## Security

See [SECURITY.md](../SECURITY.md) for the threat model and guards.
