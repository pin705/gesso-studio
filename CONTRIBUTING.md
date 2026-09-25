# Contributing to Gesso

Thanks for helping make AI-made game art look hand-crafted. Every kind of contribution is welcome: code, knowledge guides, style packs, bug reports, and showcase assets.

## Where help matters most

1. **Knowledge.** The guides in `knowledge/` decide what the agent draws. A sharper material recipe, a new style pack or a clearer rubric improves every future asset. See [docs/knowledge-authoring.md](docs/knowledge-authoring.md).
2. **Lint rules.** A check in `server/utils/render.ts` that catches a common mistake (like the SMIL `keyTimes` rule) turns an invisible failure into a fixable one.
3. **Studio UX** for reviewing art: faster feedback, better comparison tools, accessibility.
4. **Engine exporters** and platform testing (Windows, macOS, Linux; Chrome, Edge, Chromium).

## Development setup

```bash
git clone https://github.com/gesso-studio/gesso.git
cd gesso
npm install
npm run dev          # http://localhost:3000, hot reload for app and server
```

Use a scratch data folder while developing so you don't touch your real projects:

```bash
GESSO_HOME=/tmp/gesso-dev npm run dev
```

Before opening a pull request:

```bash
npm run typecheck
npm run build
npm test             # end-to-end, needs Chrome, Edge or Chromium
```

## Project layout

| Path | What lives there |
| --- | --- |
| `app/` | Studio UI (Nuxt pages, components, composables). `app/components/ui/` holds shadcn-vue components; regenerate them with the shadcn-vue CLI rather than editing by hand. |
| `server/` | Nitro server: REST API, `/mcp` endpoint, SQLite, file sync, renderer. |
| `server/utils/mcp.ts` | MCP tools and their descriptions (the agent reads these, so write them carefully). |
| `server/utils/render.ts` | Headless Chromium: lint, review sheets, sprite sheets. |
| `knowledge/` | The game-art knowledge base served to agents. |
| `examples/showcase/` | Sample project bundled with the studio. |
| `bin/gesso.mjs` | CLI: start the studio, or run the stdio MCP bridge. |
| `test/e2e.mjs` | End-to-end test against the production build. |

## Pull requests

- Keep each PR focused on one change, and explain why in the description.
- Match the existing code style: small functions, no speculative abstraction, comments only where the code can't say it.
- Knowledge changes: include a before/after review sheet (from `save_asset` or `view_assets`) that shows the improvement.
- Add or extend a check in `test/e2e.mjs` when you change server behavior.
- Update `CHANGELOG.md` under **Unreleased**.
- Commits: use a short imperative subject (`Add ice material recipe`, `Fix 9-slice guides on zoom`).

## Reporting bugs

Open an issue with steps to reproduce, the expected and actual result, your OS, Node version and browser, and the MCP client you use. For rendering problems, attach the SVG. Security issues go through [SECURITY.md](SECURITY.md), not public issues.

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE).
