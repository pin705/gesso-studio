# Security Policy

## Supported versions

Gesso is pre-1.0. Security fixes land on the latest release only.

## Reporting a vulnerability

Please do **not** open a public issue. Report it privately through **GitHub → Security → Report a vulnerability** on this repository. Include the affected version, steps to reproduce, and the impact you expect. You will get an acknowledgement within a few days, and a fix or mitigation plan once the report is confirmed.

## Threat model

Gesso runs on your machine, writes files and drives a browser, so it assumes that **web pages and agent input are untrusted**:

- **Local only.** The server binds to `127.0.0.1` and rejects requests whose `Host` header is not local (DNS rebinding) or whose `Origin` is another site (cross-site requests to localhost).
- **Confined writes.** Asset ids are validated (`[a-z0-9._-]`, no `..`), files are written only inside a registered project's `assets/`, `exports/` and `STYLE.md`, and new projects must live under your home directory.
- **Inert SVG.** Assets are served with `Content-Security-Policy: script-src 'none'` and `nosniff`; lint rejects `<script>`, `<foreignObject>` and event handler attributes.
- **Sandboxed HTML.** HTML assets are served with `Content-Security-Policy: sandbox allow-scripts`, so their scripts always run on an opaque origin and cannot call the studio API, even when a file is opened directly. The renderer loads them on a private origin where only the asset folder and `/kit` resolve and all other requests are aborted.
- **Sanitized markdown.** Art bibles and guides are rendered with raw HTML disabled.
- **No telemetry.** Gesso makes no network requests of its own. Rendering loads only the files you created.

An MCP client that you connect can call every Gesso tool. Only connect agents you trust, and review what they are asked to do.
