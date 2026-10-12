# Debugging Rive scripts over MCP

Use this order when a file is open and something is red.

## 1. Confirm the file

`session_info` — active file name, id, editor URL, open tabs.

If `openTabs` is empty, tools that read scripts will fail with “no file is currently open”.

## 2. List code

`get_scripts` — Luau (with protocol: node, layout, utility, …) and WGSL.

## 3. Linter

`script_diagnostics` with no path = every script.

Typical sources:

| Source | Meaning |
| --- | --- |
| `luau` | Type / syntax errors in scripts |
| `wgslAnalyzer` | WGSL parse / type errors |
| `naga` | GPU shader validation (also HLSL bake warnings) |

Line numbers are 1-based in the editor. Cascade errors are common: one bad field access produces a dozen `clamp` / `mix` overload failures. Fix the first real mismatch, then re-run.

## 4. Runtime console

`read_console` only has output from **frames that already ran**. After a code change, play or scrub once before trusting it.

Filter with `entry_type: "error"`, `script_name`, `reverse: true`.

Stale errors stay in the log until new output replaces what you are looking at. Linter (`script_diagnostics`) is the source of truth for “is this still broken?”

## 5. Recompile

`recompile_all_scripts` commits bytecode after edits. Run it after a batch of `text_editor` changes, then diagnostics again.

## Node `draw` signature

Current node / layout lifecycle (from the scripting reference) is `init` / `update` / `advance` / `draw(self, renderer)`. There is no `drawCanvas` hook anymore. See [drawcanvas-to-draw.md](drawcanvas-to-draw.md).
