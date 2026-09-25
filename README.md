# Game Art Studio

**Your AI agent is the artist. This is its studio.**

Game Art Studio is a local-first studio for game assets, in the spirit of [Open Design](https://github.com/nexu-io/open-design) but built for games. You talk to your coding agent (Claude Code, Codex, Cursor, Claude Desktop or any MCP client); the agent creates UI, icons, panels, bars and VFX through a local MCP server, guided by a knowledge base of real game-art practice; the studio in your browser shows the work live. Nothing is tied to one genre: every project has its own art bible.

- **Knowledge first.** A production workflow, a critique rubric with an anti-slop list, art fundamentals (light and value, color ramps, shape, materials), SVG craft techniques, specs per asset type and genre style packs.
- **The agent sees what it makes.** Every save renders the asset in headless Chromium and returns a review sheet: the render, a grayscale value check, 64px and 32px readability previews and animation frames, plus lint (palette drift, clipping, 9-slice, broken animation timing, unsafe SVG). The agent critiques and iterates like an artist instead of shipping its first draft.
- **Game-ready output.** Transparent PNG @1x/@2x, sprite sheets with TexturePacker-style JSON (works with Pixi and Phaser), and a manifest with sizes, 9-slice insets and frame timing.
- **Local and open.** Your files, your agent, your machine. No account, no API key, no telemetry.

## Quick start

Requirements: Node.js 20.1+ and Google Chrome, Edge or Chromium (or run `npx playwright install chromium`, or set `CHROME_PATH`).

```bash
git clone <this repo> game-art-studio
cd game-art-studio
npm install          # also builds the studio UI
```

Connect your agent. `GAME_ART_PROJECT` is the folder where the art lives (default: `./game-art` in the agent's working directory).

**Claude Code**
```bash
claude mcp add game-art -e GAME_ART_PROJECT=/path/to/my-game/art -- node /path/to/game-art-studio/mcp/server.js
```

**Codex** (`~/.codex/config.toml`)
```toml
[mcp_servers.game-art]
command = "node"
args = ["/path/to/game-art-studio/mcp/server.js"]
env = { GAME_ART_PROJECT = "/path/to/my-game/art" }
```

**Cursor, Claude Desktop, Windsurf and other MCP clients**
```json
{
  "mcpServers": {
    "game-art": {
      "command": "node",
      "args": ["/path/to/game-art-studio/mcp/server.js"],
      "env": { "GAME_ART_PROJECT": "/path/to/my-game/art" }
    }
  }
}
```

Then ask your agent something like *"Read the game-art project, propose an art bible for my cozy farming game, then make the main menu buttons."* It will give you the studio URL (default `http://127.0.0.1:4477`); keep it open to watch assets appear and update.

To browse the bundled multi-genre showcase without an agent: `npm run dev` and open `http://localhost:5173`.

## How it works

```text
you ──prompt──▶ your agent ──MCP──▶ game-art server ──writes──▶ project/
                    ▲                     │                      ├── STYLE.md   (art bible)
                    │                     │ renders in Chromium  ├── assets/*.svg
                    └── review sheet ◀────┘                      └── exports/
                                                                      │
                                   studio (browser) ◀── live view ────┘
```

1. `get_project` shows the art bible and assets. With no art bible, the agent reads the workflow and the closest style pack, agrees on a direction with you and writes `STYLE.md`.
2. For each asset the agent reads its asset-type guide, writes SVG and calls `save_asset`.
3. The review sheet comes back as an image; the agent scores it against the critique rubric, fixes the weakest part and saves again until every score passes.
4. `export_assets` produces engine-ready files once you approve.

### MCP tools

| Tool | What it does |
| --- | --- |
| `get_project` | Project folder, studio URL, art bible and asset list. |
| `read_guide` | Reads the knowledge base (index, or one or more topics). |
| `write_art_bible` | Creates or replaces `STYLE.md`; its hex codes become the linted palette. |
| `read_asset` | Returns an asset's SVG, for revisions, states and variants. |
| `save_asset` | Validates, lints, saves and returns the review sheet. |
| `view_assets` | Renders several assets side by side to check a set's consistency. |
| `export_assets` | Writes PNGs, sprite sheets, atlases and `manifest.json` to `exports/`. |

### Asset format

An asset is a plain SVG file in `assets/`, readable by any tool. Metadata lives on the root element:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="376" height="132" viewBox="0 0 376 132"
     data-type="button" data-style="xianxia" data-nine-slice="30 84 30 84">
```

`data-type` is one of `button`, `panel`, `frame`, `bar`, `icon`, `vfx`, `background`, `other`. Animated assets (SMIL or CSS) add `data-duration` in seconds and optionally `data-frames`. States are sibling files: `btn-play.svg`, `btn-play.pressed.svg`.

## Knowledge base

```text
knowledge/
├── README.md            index
├── workflow.md          brief → art bible → block-in → form → polish → critique → export
├── critique.md          scoring rubric and anti-slop checklist
├── art-bible.md         how to write STYLE.md
├── fundamentals/        light-value, color, shape, materials, svg-craft
├── asset-types/         button, panel, icon, bar, vfx
└── styles/              xianxia, dark-fantasy, heroic-fantasy, sci-fi, casual, pixel
```

Style packs are starting points. A genre that is not listed works the same way: the agent builds a custom art bible from your description and references.

Contributions that raise output quality are the most valuable: a new style pack, a new asset-type guide, a better material recipe, or a lint rule that catches a common mistake. Keep guides short, specific and testable; every rule should change what the agent draws.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GAME_ART_PROJECT` | `./game-art` | Project folder the MCP server reads and writes. `npm run dev` defaults to `examples/showcase`. |
| `GAME_ART_PORT` | `4477` | First port tried for the studio (next free port is used if taken). Bound to 127.0.0.1. |
| `CHROME_PATH` | auto | Chromium-based browser used for rendering. |

## Development

```bash
npm run dev     # studio with hot reload, serving GAME_ART_PROJECT or the showcase
npm run check   # svelte-check / TypeScript
npm run build   # studio bundle in dist/, served by the MCP server
npm test        # end-to-end MCP self-test over stdio (needs Chrome)
npm run mcp     # run the MCP server on stdio
```

`mcp/server.js` is the MCP server (stdio JSON-RPC), `mcp/render.js` renders, lints and composes review sheets and sprite sheets, `mcp/http.js` serves the studio and project files, `src/` is the studio UI.

## Current limits

- Vector-first: assets are SVG, which suits UI, icons, HUD and stylized VFX. Painterly, raster-heavy art (characters, textured illustrations) is not generated yet; SVG can embed raster images if you bring them.
- The MCP server implements tools over stdio only.
- The studio polls the project once a second.
