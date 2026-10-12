# Rive MCP scope

Cursor talks to the editor through the `user-rive` MCP. A live ping to `session_info` is the check that the connection is actually up.

Rive files live in the cloud. There is no path on disk; use the URL from `session_info` / `open_file_editor`.

## What the MCP can do

- Query the open file: artboards, selection, hierarchy, properties
- Create and edit **Luau scripts** and **WGSL shaders** (`manage_scripts` with `code_file_type: "wgsl"`)
- Upload **2D** assets into the open file: PNG / JPEG / WebP, SVG, TTF / OTF, MP3 / WAV / FLAC
- Instantiate images and SVGs onto an artboard
- Export `.riv` / `.rev`, upload a `.rev`
- Mesh **2D** images and vector paths for bone deformation (`mesh_rigging_tool`)

## What it cannot do

- **Upload GLTF / GLB / other 3D meshes** via `upload_asset`. That tool only accepts images, SVG, fonts, and audio.
- Treat `mesh_rigging_tool` as a 3D importer. It traces a 2D silhouette and binds bones to that mesh.

## 3D in Early Access scripts

3D is not an MCP upload path. It is **in-file Luau**:

- `GltfLoader` / `MeshLoader` parse a `.glb` / `.gltf` blob already in the file
- `GltfViewport3D` renders it through `GPURenderer` + WGSL (`PBRShader`, post-FX, etc.)
- The viewport’s `model` input is a filename string (e.g. `Scifi_satellite_04.glb`), not an MCP upload

If you need a new GLB in the file, add it in the Rive editor (or as a blob asset). The MCP cannot push the binary in today.

## Shader creation

Yes — create a WGSL file with `manage_scripts`:

```
command: create
data.create: [{ name: "MyShader", code_file_type: "wgsl", content: "..." }]
```

Seed `content` on create. Edit later with `text_editor`. A shader with no `@vertex` / `@fragment` (e.g. empty `Shader 1`) only warns; it will not bake to HLSL.
