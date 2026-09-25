# Writing knowledge

Agents read `knowledge/` before they draw, so every sentence there should change what gets drawn. Guides are plain Markdown; the file path is the topic id (`knowledge/styles/xianxia.md` is `styles/xianxia`). New files appear in `read_guide` and in the studio automatically.

## Principles

- **Specific over inspirational.** "Shadows on gold are warm brown (#6e3f10), never gray" beats "make gold look rich".
- **Testable.** Prefer rules an agent can check on its review sheet: values in grayscale, readability at 64 px, a margin in pixels.
- **Short.** Agents load several guides per task. Aim for one screen; cut anything the agent already knows.
- **No brand copying.** Describe qualities ("chunky bevels, saturated sunlit palette") instead of naming a game to imitate.

## Adding a style pack

Copy the structure of an existing pack in `knowledge/styles/`:

1. **Mood**: three adjectives and one sentence about the look.
2. **Light**: direction, temperature, shadow color.
3. **Palette**: ramps of 4-6 hex values from dark to light, with roles and a 60/30/10 split.
4. **Shape language and ornament**, **Line and edges**, **Materials**.
5. **UI kit**: corner radius family, bevel, shadow, label color.
6. **VFX** and **Don'ts**.

Then list it in `knowledge/README.md`. Show that it works: ask an agent to make a button, an icon and a panel in the new style, and attach the review sheets to your pull request.

## Adding an asset type

Describe the deliverables (files and states), the size at a reference resolution, construction from back to front, engine constraints (9-slice, stretching, separate layers) and state logic. Add the type to the lint list in `server/utils/render.ts` if it needs its own checks.
