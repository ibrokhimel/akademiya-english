# Redesign · The four tabs

Pencil section **"Redesign · Tabs"** in `pendev/Akademiya English.pen` holds the redesign of Learn, Speak, Practice
and Me (plan: `docs/superpowers/plans/2026-10-23-redesign-tabs-in-pencil.md`, design:
`docs/superpowers/specs/2026-10-23-english-redesign-design.md`).

- New screens use only the `ds-` colour variables (the shared design system, light and dark). The older variables
  stay for the existing storyboards.
- `tabs/` holds PNG exports of each option and of the final screens.

## Checking a screen

`design/system/pencil-check.js` is a Pencil `execute` snippet. Put the frame ids in `FRAMES` on its first line and
run it through the Pencil MCP. Each frame prints `{ frame, name, total, violations }`; `total: 0` means it passes.

Rules: `small-text` (under 12), `off-scale` (size/weight not a type step), `raw-colour` (hex instead of a
variable, except inside character and icon artwork), `old-variable` (a non-`ds-` variable on new work), `width`
(not 390 or 360), `no-dombi` (no Dombi on the screen), `two-heroes` (more than one reward-yellow card).
