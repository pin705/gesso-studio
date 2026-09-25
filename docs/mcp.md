# MCP reference

Endpoint: `http://127.0.0.1:4477/mcp` (Streamable HTTP, stateless). Add `?project=/absolute/path` to target a project; it is registered on first use. Stdio-only clients run `node bin/gesso.mjs mcp --project /absolute/path`.

The server sends workflow instructions during `initialize`. Agents that honour server instructions follow the production workflow automatically.

| Tool | Arguments | Returns |
| --- | --- | --- |
| `get_project` | none | Project folder, studio URL, art bible, assets with status and revision, open feedback. Call it first. |
| `list_projects` | none | Projects on this machine. |
| `open_project` | `path`, `name?` | Registers (and creates) a folder under your home directory and makes it the target. |
| `read_guide` | `topics?: string[]` | Knowledge base index, or the requested guides (`workflow`, `asset-types/button`, `styles/xianxia`…). |
| `write_art_bible` | `markdown` | Saves `STYLE.md`; reports the palette that lint will enforce. |
| `read_asset` | `id`, `revision?` | SVG source of the latest or a given revision. |
| `save_asset` | `id`, `svg` (a complete HTML or SVG document), `note?`, `critique?` | Lint summary and a JPEG review sheet. `critique` is `{ scores: { readability, value, form, material, color, craft, fitness }, notes }`. |
| `search_icons` | `query`, `set?` | Silhouette paths under `/kit/icons/…` (game-icons: 4000+ game silhouettes, CC BY 3.0; lucide: UI glyphs). |
| `view_assets` | `ids?`, `time?` | One contact-sheet image of several assets, for checking a set's consistency. |
| `get_feedback` | `id?` | Open feedback, with pinned points in asset pixels. |
| `resolve_feedback` | `feedback_id`, `reply` | Marks feedback resolved; the reply is shown to the user. |
| `export_assets` | `ids?`, `scales?` | Writes PNGs, sprite sheets, atlases and `manifest.json` to `exports/`. |

## Asset conventions

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="376" height="132" viewBox="0 0 376 132"
     data-type="button" data-style="xianxia" data-nine-slice="30 84 30 84">
```

- `data-type`: `button`, `panel`, `frame`, `bar`, `icon`, `vfx`, `background` or `other`.
- `data-nine-slice`: insets in 1x pixels, CSS order (top, right, bottom, left).
- Animations: SMIL or CSS inside the SVG, plus `data-duration` (seconds) and optionally `data-frames`.
- States are sibling ids: `btn-play`, `btn-play.pressed`, `btn-play.disabled`.
- Prefix every internal id with the asset id; no scripts, `foreignObject` or external URLs.

## Lint checks

Parse errors (the save is rejected), missing `viewBox` or size, oversize canvases, missing `data-type`, duplicate or unprefixed ids, scripts and event handlers, external resources, content touching the canvas edge (icons and VFX), low icon fill, baked text in UI chrome, invalid 9-slice insets, animated assets without `data-duration`, SMIL timing lists that browsers silently ignore, and colors missing from the art bible palette.
