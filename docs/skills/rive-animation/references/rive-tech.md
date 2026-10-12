# Rive technical research: building Dombi and UI effects

Research date: 2026-10-10. Sources are rive.app/docs (the `.md` versions), the Rive blog, community and marketplace pages, GitHub repos, and the local Rive MCP `get_scripting_reference` tool. Items marked **(inferred)** are my own conclusions or extrapolations, not quoted from a source.

Who this is for: an AI agent that drives the Rive Editor through the MCP tools (`animation_editor`, `create_listeners`, `viewmodel_editor`, `component_editor`, `path_editor`, `mesh_rigging_tool`, `layout_editor`, `group_editor`, `set_property_values`, `manage_scripts`/`text_editor`, `get_scripting_reference`, `capture_artboard`, `export_file`).

---

## 0. TL;DR (the decisions that matter)

1. **Data Binding (View Models) is the current way to drive Rive.** State Machine Inputs and runtime "General Events" are officially **deprecated** (they still work, but new work should use view model properties). Drive everything with VM numbers, booleans, triggers, enums, colors, lists, and artboards. Use a VM trigger plus the `onTrigger` callback, or VM property observation, to signal back to the app (for example, "play a sound" or "animation finished").
2. **Build one state machine with several layers.** Use one layer per concern (body/idle, face/expression, gesture/hands, mouth/visemes, effects). A Rive staffer warned against using multiple state machines on one artboard ("about to drop support" in runtimes). Layers lower in the Layers list win when two layers key the same property.
3. **Random idles are built in.** Turn on **Randomize Exit** on a state and give each outgoing transition a weight (e.g. 3:1 means 75%/25%).
4. **Particles: Rive has NO built-in emitter.** The real options are:
   - (a) **Rive Scripting Node script** (Luau) that simulates particles in `advance()` and draws them in `draw()` with `Path`/`Paint`. Since 2026-09-30, TeamRive also ships an official **"Particle Library"** community file (#28062) for node and layout scripts: "You feed it emitter configs, advance it each frame, and draw it."
   - (b) **Script that instances an Artboard input** (`Input<Artboard<...>>` → `:instance()` → `:advance()` / `:draw()` under `renderer:transform`). The artist owns the look (stars, Dombi-colored confetti) and the script owns the motion. This is the "Artboard = Particle, Script = Particle System" pattern.
   - (c) **No-code: an Artboard List + Number-to-List converter + Follow Path constraint**, with each item artboard self-animating and using its index for offsets.
   - (d) **Pre-animated burst component**: hand-keyed 8–16 pieces with staggered keys, fired by a VM trigger. Cheapest at runtime, with no scripting dependency.
   - (e) For hundreds of sprites: `renderer:drawImageMeshInstanced` with `MeshInstances`, which draws one mesh N times in one call **(inferred best for big counts)**.
5. **Renderer:** the RN runtime always uses the Rive Renderer, and **Vector Feathering (glow/soft shadow) requires the Rive Renderer**. On the web, `@rive-app/canvas` has no feathering, so use `@rive-app/webgl2` for feathering. Blend modes are expensive on the web.
6. **Lip sync:** Rive has no auto lip-sync. Build a mouth layer driven by a VM number `viseme` (one state per mouth shape, or a blend), then drive it from TTS viseme timings in app code. Keep expressions and visemes on **separate layers/blend states**, or an expression at 100% will kill the visemes.

---

## 1. Local MCP scripting reference (pulled with `get_scripting_reference`)

Command used (read-only): `FULL=1 node rive.js call get_scripting_reference '{"topic":"<key>"}'`. The tool requires a `topic`. Calling it with a bad topic lists the valid keys:

```
rive/vector, rive/path, rive/mat2d, rive/gradient, rive/mat4, rive/color, rive/mesh,
rive/gpu_types, rive/image, rive/paint, rive/renderer, rive/text, rive/artboards,
rive/dataValue, rive/gpu, rive/promise, rive/interfaces, rive/testing, rive/fileFormat,
rive/base, @luau, rive/typeslib   (+ "viewmodel_definitions", "example_node", "example_test")
```

The full dumps are saved next to this report in `research/ref/*.txt` (rive_renderer.txt, rive_artboards.txt [39 KB], rive_interfaces.txt [56 KB], rive_paint.txt, rive_path.txt, rive_mesh.txt, example_node.txt, etc.). Key surface area:

### 1.1 Script protocols (from `rive/interfaces`)
| Protocol | Hooks | Use for Dombi project |
|---|---|---|
| `Node<T>` | `init(self, context)->bool`, `advance(self, seconds)->bool`, `update(self)`, `draw(self, renderer)`, `pointerDown/Move/Up/Exit/Scroll`, gamepad | particles, procedural wobble, custom drawing |
| `Layout<T>` | Node + `measure()`, `resize(size, scale)` | particle systems that need the layout size |
| `Converter<T,I,O>` | `convert`, `reverseConvert`, `advance` | e.g. streak number → label, viseme id mapping |
| `PathEffect<T>` | `update(self, PathData, NodeReadData)->PathData`, `advance` | wobbly outlines, scribble draw-on |
| `ListenerAction<T>` | `performAction(self, ListenerContext)` (`perform` is deprecated) | scripted reactions to taps |
| `TransitionCondition<T>` | `evaluate(self)->bool` | custom transition logic |
| `Interpolator<T>` | `transform(value)`, `transformValue(from,to,value)` | custom easing (overshoot/spring) |
| `Transition<T>` | `changed(from,to,direction)`, `advance`, `draw(renderer, from, to)`, `managesTo` | custom crossfade/slide between solo-like children |
| `Tests` | `setup(test)` with `group`/`case`/`expect` | unit tests |

- `advance` returning `false` stops further advance calls. Return `true` while particles are alive and `false` when the pool is empty, so the runtime can go idle **(inferred from the docs: "Returns true if the node should continue receiving advance calls")**.
- `update` is called when any input changes. **Do NOT call `markNeedsUpdate()` inside `update`** (it is ignored). Call `context:markNeedsUpdate()` from `init`, `advance`, or listener callbacks instead.
- The factory must return defaults for every field. Use `late()` for inputs that the editor assigns (artboards, view models).

### 1.2 Renderer API (`rive/renderer`)
```lua
renderer:drawPath(path: Path, paint: Paint)
renderer:drawImage(image, sampler: ImageSampler, blendMode, opacity)
renderer:drawImageMesh(image, sampler, vertices: VertexBuffer, uvs: VertexBuffer, triangles: TriangleBuffer, blendMode, opacity)
renderer:drawImageMeshInstanced(image, sampler, vertices, uvs, triangles, instances: MeshInstances) -- one call, N copies; srcOver only
renderer:clipPath(path)            -- until restore()
renderer:save() / renderer:restore()
renderer:transform(m: Mat2D)       -- cumulative
renderer:modulateOpacity(a)        -- multiplicative, captured by save/restore
renderer:modulateColor(color)      -- tint
renderer:setColorModulation(color) -- set outright
```
`MeshInstances`: `MeshInstances(count)`, `:resize(n)`, `:set(index0based, transform: Mat2D, opacity?, additiveness?, uvTranslate?, uvScale?)`. It is "meant to be rewritten every frame". Good for sprite-sheet particles (use uvTranslate/uvScale to pick a frame).

### 1.3 Paint / Path / math
- `Paint.new()`, `Paint.with({ style='fill'|'stroke', color=Color.rgb(...), thickness, join, cap, blendMode, feather=<number>, gradient=Gradient.linear(...)|radial(...), gradientTransform })`, `paint:copy({...})`. **`feather` is available on script paints**, so you can make soft glow dots in code (Rive Renderer only).
- BlendMode values include `'srcOver' | 'additive' | 'screen' | ...` (additive is good for sparkles).
- `Path.new()`, `:moveTo(Vector)`, `:lineTo`, `:quadTo`, `:cubicTo(cOut, cIn, to)`, `:close()`, `:reset()`, `:add(otherPath, Mat2D?)`, `:measure()` → `PathMeasure` with `positionAndTangent(distance)`, `extract(start, end, dest, startWithMove)`, `warp(v)`.
- `Vector.xy(x,y)`, `:length()`, `:normalized()`, `:lerp()`, `Vector.distance(a,b)`. `Mat2D.withTranslation(x,y)`, `withRotation(rad)`, `withScale(x,y)`, `withScaleAndTranslation(sx,sy,x,y)`, fields `xx xy yx yy tx ty`.
- `Color.rgb(r,g,b)`, `Color.rgba(r,g,b,a)` (0–255), `Color.lerp(a,b,t)`, `Color.opacity(c, v)`, `Color.alpha(c)`.
- Gradients: `Gradient.linear(from, to, {{position=0,color=...},...})`, `Gradient.radial(center, radius, stops)`.

### 1.4 Artboards from script (`rive/artboards`)
```lua
type FX = { piece: Input<Artboard<Data.Piece>>, inst: Artboard<Data.Piece>? }
-- init:    self.inst = self.piece:instance()            -- optional: :instance(vm)
-- advance: self.inst:advance(seconds)                   -- runs its state machine/animations
-- draw:    renderer:save(); renderer:transform(m); self.inst:draw(renderer); renderer:restore()
-- also:    inst:animation('Spin') -> Animation (:advance(s), :setTime(t), :setTimePercentage(p), .duration)
--          inst:node('Hips') -> NodeData; inst:bounds(); inst.width/height; inst.frameOrigin = true
--          inst:pointerDown(event) -> hit; inst.data -> its view model (typed Data.Piece)
```

### 1.5 Data from script (`rive/dataValue`, Context)
- `context:viewModel()`, `context:rootViewModel()`, `context:globalViewModel(name)`, `context:dataContext():parent()`.
- `vm:getNumber('x')`, `getBoolean`, `getString`, `getColor`, `getTrigger`, `getEnum`, `getList`, `getViewModel`, `getImage`. Each returns a `Property` with `.value`, `:addListener(cb)` or `:addListener(anchor, cb)`, and `:removeListener`. Triggers have `:fire()` and `:addListener`.
- **GC gotcha:** if you get the VM into a `local` and add listeners, it can be garbage-collected. Store it on `self` (`self.vm = context:viewModel()`) or pass it as the anchor.
- Lists: `list.length`, `list[i]`, `:push(vm)`, `:insert`, `:swap(a,b)`, `:remove`. Create instances with `Data.MyVM.new()`.
- Script inputs: `Input<number>`, `Input<Color>`, `Input<boolean>`, `Input<Trigger>` (the default value is a **function** that is called when the trigger fires), `Input<Data.SomeVM>`, `Input<Artboard<Data.SomeVM>>`. Inputs can be data-bound in the editor (right-click → Data Bind).
- Audio from script: `context:audio('name')` → `AudioSource`; `Audio.play(src)` → `AudioSound` (`:stop(fadeFrames?)`, `:seek(s)`, `:completed()`), plus `Audio.playAtTime/playInTime`.

### 1.6 Official example node (verbatim, abridged)
```lua
local paint = Paint.with({ color = 0xFFFF0000 })
type Oval = { width: Input<number>, height: Input<number>, path: Path }
function init(self: Oval): boolean
  addOval(self.path, 0, 0, self.width, self.height); return true
end
function advance(self: Oval, seconds: number): boolean return false end
function update(self: Oval) end           -- Do NOT call markNeedsUpdate() here
function draw(self: Oval, renderer: Renderer) renderer:drawPath(self.path, paint) end
return function(): Node<Oval>
  return { width = 100, height = 200, path = Path.new(),
           init = init, advance = advance, update = update, draw = draw }
end
```
`addOval` uses the 0.5519150244935105707435627 cubic-circle constant with 4 `cubicTo` quadrants. Reuse this for round particles.

---

## 2. State machines in depth

### 2.1 Building blocks (docs: states, transitions, layers)
- **Entry state:** where each layer starts. It can connect to several states (e.g. start On or Off depending on a condition).
- **Exit state:** "tells the State Machine layer to stop playing". It is niche and useful with multiple layers, e.g. a gesture layer that finishes and then goes quiet.
- **Any State:** transitions from Any fire regardless of the current state. Use it for interrupts like `celebrate`, `wrong`, `skin change`. **Gotcha (inferred):** an Any-State transition whose condition stays true will re-enter every frame. Use triggers, or add a condition that the target state invalidates.
- **Animation state types:** Single Animation (one-shot / loop / ping-pong comes from the timeline's loop setting), **1D Blend** (one number blends N timelines over a range; mixing "is not linear, but additive and could give you unexpected results", so key few properties per timeline), and **Additive Blend** (formerly "Direct"): several number properties, each weighting a timeline. "Blend by Value" entries are a fixed-weight baseline pose, and "Blend by Property" entries are driven by a VM number. Use it for faces: brows-up, smile, squint, each 0–100.
- **State options:** Speed (negative = reverse), Caption (editor-only notes), and **State Actions** at Start/End: set property values, report events, align targets, control focus, fire a scripted action.
- **Transitions:** Path + Conditions (VM properties, events, built-ins such as artboard width/height/ratio; ops ==, !=, >, >=, <, <=; the comparison value can itself be data-bound; multiple conditions = AND; multiple transitions between the same states = OR) + Properties (**Duration**, default 0 = snap; **Exit Time** in time or %, e.g. 100% = finish the one-shot first; **Pause source when exiting**; **Allow exit during transition**, i.e. interruptible; **Interpolation**, linear/cubic/etc.) + **Actions** at transition Start/End (same list as state actions).
- **Randomize Exit** (on the origin state): picks an outgoing path at random using per-path **weights**. This is the native way to build idle variation.
- **Without conditions, transitions fire immediately.** Combine that with Exit Time for chained sequences (A plays fully → B).
- **Layers:** each layer plays one state at a time. Add layers to play several at once. "Layers farther down the list take priority… if multiple layers control the same object property, the animation in the lower layer takes priority as the layers mix." Layer menu: Delete / Duplicate / **Disable** / Snapping.
- A forum answer phrases the order as "layers blend right to left", from older UI wording. The current docs say "farther down the list wins". **Trust the current docs.**

### 2.2 Recipe: Dombi character state machine
To build Dombi's machine in Rive:
1. **One artboard `Dombi` (component)** with a view model `DombiVM`: `mood` (enum: idle, happy, sad, thinking, surprised), `talking` (bool), `viseme` (number 0..N), `gesture` (enum: none, wave, point, thumbsUp, shrug), `lookX`/`lookY` (number −100..100), triggers `celebrate`, `wrong`, `correct`, `tap`, and output trigger `gestureDone`.
2. **Layer 1 "Body"** (top of list = lowest priority): Entry → `Idle_Breathe` (loop, keys only body scaleY/scaleX and y). Turn on **Randomize Exit** on a short `Idle_Hub` one-shot state with weighted exits to `Idle_Breathe` (w=6), `Idle_LookAround` (w=2), `Idle_Bounce` (w=1), `Idle_Smirk` (w=1). Each variant has Exit Time 100% back to `Idle_Hub`, so idles chain forever with variety. **(inferred technique combining Randomize Exit + Exit Time)**
3. **Layer 2 "Reactions":** Any State → `Celebrate` (cond: trigger `celebrate`), `Wrong` (cond: `wrong`), `Correct`. Each is a one-shot that returns to an `Empty` state (a state with an empty or near-empty timeline) via Exit Time 100%. While `Empty` is active this layer keys nothing, so Body shows through **(inferred)**. Give these transitions Duration 0.1–0.2 s and cubic interpolation.
4. **Layer 3 "Face":** an **Additive Blend** state: baseline `Face_Neutral` (Blend by Value, 100) + `Face_Happy`, `Face_Sad`, `Face_Squint`, `Brow_Up` each bound to a VM number. Alternatively use states per `mood` enum value with 0.15 s transitions.
5. **Layer 4 "Eyes":** a blink loop on its own layer: `Blink` one-shot (~0.15 s close/open) → `EyesOpen` hold with Randomize Exit or several hold lengths (2 s / 3.5 s / 5 s) so the blinks don't look periodic. Gaze: a **joystick** or two 1D blends (`lookX`, `lookY`) that move the pupils/eye group.
6. **Layer 5 "Hands/Gesture":** hidden-by-default circle hands. `None` (hands scale 0) → `Wave`, `Point`, ... using enum `gesture` conditions. Each gesture is a one-shot: pop in (scale 0→1.15→1 with an elastic/cubic overshoot), act, pop out. On end, a **state action** sets `gesture` back to `none` and fires `gestureDone` so app code knows.
7. **Layer 6 "Mouth":** visemes (see §6). Put it **lowest in the list** so speech wins over the face layer on the mouth shapes.
8. **Layer 7 "FX"** (optional): a nested component holding the confetti script / sparkle bursts, fired by the `celebrate` trigger (bind the nested component's VM trigger to the parent trigger).
9. Test with `simulateStateMachine`, then `capture_artboard` at several times.

### 2.3 Property leaks between states (CRITICAL)
- **Rule (inferred, consistent with forum guidance):** a state machine only writes the properties that the active animation(s) key. When you leave a state, properties that the new state does not key **keep their last value**. They do NOT snap back to the design-mode value. That is how "hands stay visible" or "eye stays squinted" bugs happen.
- **Fixes:**
  1. **Key everything a layer ever touches in every state of that layer.** At minimum, put a frame-0 key of the neutral value in each state's timeline (e.g. every gesture state keys both hands' scale/x/y/rotation, and the `None` state keys hands at scale 0).
  2. **Neutral/reset state:** have one-shots return to a `Neutral` state whose timeline keys all of the layer's properties at rest. Forum fix: "reset the element on the upper layer with a neutral state."
  3. **Partition properties by layer:** never let two layers key the same property, unless you intend the lower layer to override. Per the docs, the lower layer wins while it is keying.
  4. Use an **Empty** state (no keys) on overlay layers so they release control **(inferred: the last values written may still remain until another layer writes them, so the base layer must key those properties continuously, e.g. in its looping idle)**.
- Blend states keep the machine "active" and prevent runtime self-pause. Transition out of blend states when done (official best practice).
- "Exceeded max iterations" error = two states ping-ponging on conditions that stay true.

### 2.4 One-shot vs looping
- The loop type is set on the timeline (One Shot / Loop / Ping Pong). One-shots hold their last frame. Pair them with Exit Time 100% to auto-advance.
- Performance: "if no looping animations or active blend states are playing, the runtime will preemptively pause itself". So static UI icons should end in one-shots, but a mascot that is always idling will always run (fine for one mascot on screen).

---

## 3. Inputs vs View Models / Data Binding (2025–2026 best practice)

### 3.1 Status
Official migration guide: "Data binding replaces both **state machine inputs** and **runtime event listeners**, and also removes the need to directly modify elements like text runs from code." Inputs and events "will continue to work", but new work should use data binding. The editor's hamburger menu has **Convert Inputs to View Models**.

| | Inputs | Events | VM Properties |
|---|---|---|---|
| Number / Boolean | yes | yes | yes |
| Trigger | yes | no | yes |
| String | no | yes | yes |
| Enum, Color, nesting, Lists, Images, Artboards | no | no | yes |

- **Signaling back to the app (replacing General Events):** "Create a view model property; update it from your Rive file (via animation, listener, or script); subscribe to that property in your runtime." For "play a sound in the app", use a VM trigger such as `sfxCorrect` fired by a state action, and handle it with `useRiveTrigger(..., { onTrigger })`. Or use **Audio Events** inside Rive (see 3.4).
- **Converters** transform values before binding (Number-to-List, string formatting, math, etc.). Custom converters can be scripted (Converter protocol).
- **Enums** are good for `mood` and `gesture`. String enum values are set from code (`setEnum('mood','happy')`).
- **Artboard properties** let you swap a component at runtime (e.g. which hat Dombi wears, or which reward badge shows). Best practices say data binding an artboard is "the most performant way" to do skins that don't need bone weighting.
- **Stateful components** have their own VM. The parent binds the nested VM to its own properties.

### 3.2 React Native (new Nitro runtime, recommended)
```bash
npm install @rive-app/react-native react-native-nitro-modules
```
```tsx
import { RiveView, useRiveFile, useViewModelInstance, useRiveNumber,
         useRiveEnum, useRiveBoolean, useRiveTrigger, useRiveList, Fit } from '@rive-app/react-native';

const { riveFile } = useRiveFile(require('./dombi.riv'));
const { instance } = useViewModelInstance(riveFile, { async: true });       // default VM, default instance
// or { async:true, artboardName:'Dombi' } / { viewModelName:'DombiVM', instanceName:'Main' }

const { setValue: setViseme } = useRiveNumber('viseme', instance);
const { setValue: setMood }   = useRiveEnum('mood', instance);
const { setValue: setTalking } = useRiveBoolean('talking', instance);
const { trigger: celebrate }  = useRiveTrigger('celebrate', instance);
useRiveTrigger('gestureDone', instance, { onTrigger: () => {/* next step */} }); // Rive -> app
// nested paths: useRiveNumber('fx/burstCount', instance)

return riveFile && instance &&
  <RiveView file={riveFile} dataBind={instance} fit={Fit.Contain} autoPlay style={{width:200,height:200}} />;
```
- `RiveView` props: `file`, `hybridRef`, `autoPlay` (default true), `fit` (default Contain), `alignment`, `layoutScaleFactor` (for `Fit.Layout`, −1 = device DPI), `artboardName`, `stateMachineName`, `dataBind` (`ViewModelInstance | DataBindMode.Auto | DataBindMode.None | {byName}`), `onError`.
- Lists: `useRiveList('items', instance)` → `length, addInstance, addInstanceAt, removeInstance, removeInstanceAt, swap, getInstanceAt`. Create items with `(await riveFile.viewModelByNameAsync('Item')).createBlankInstanceAsync()`.
- The RN runtime renders with the **Rive Renderer only**, so feathering works.

### 3.3 Flutter (rive 0.14+/rive_native)
```dart
await RiveNative.init();                                   // in main()
final file = await File.asset('assets/dombi.riv', riveFactory: Factory.rive);
final controller = RiveWidgetController(file!);
final vmi = controller.dataBind(DataBind.auto());          // or byName / byIndex / byInstance
vmi.number('viseme')!.value = 3;
vmi.number('viseme')!.addListener((v) => ...);
// dispose vmi, controller, file when done
```
Flutter can pick between `Factory.rive` (Rive Renderer, which supports feathering) and Flutter's Skia/Impeller renderers. **Use `Factory.rive`.**

### 3.4 Web
`@rive-app/webgl2` = Rive Renderer (feathering, best fidelity). `@rive-app/canvas` = Canvas2D, smaller, and better when you have many instances on screen, but no Rive-Renderer-only features. React has the same split: `@rive-app/react-webgl2` / `react-canvas`. VM access: `r.viewModelInstance.number('a/b/c')`, `.on(cb)` to observe.

### 3.5 Listeners (editor)
Listeners respond to pointer events on a target shape (down/up/enter/exit/move/click), to **VM property changes**, and to events. They can set VM values, fire triggers, align targets (follow pointer), or run a scripted ListenerAction (`performAction(self, ListenerContext)`, with `ctx:isPointerEvent()`, `isViewModelChange()`, `isReportedEvent()`). Use listeners for tap-on-Dombi → `tap` trigger → giggle reaction.

### 3.6 Events and audio
- Event types now: **Open URL**, **Audio**, and **General (deprecated)**. Fire them from a timeline keyframe (exact frame), a state (start/end), a transition, or a listener.
- **Audio Events** play an imported MP3/WAV/FLAC (or a Soundly library sound) directly in Rive. They are "ideal for triggering shorter sounds", e.g. a pop when the hands appear or a chime on correct. For volume/fade control, use scripting (`AudioSound`). Runtimes have "Playing Audio" pages: audio plays through the runtime's engine. **(inferred: test that the device mute switch and app audio session behave as you want; otherwise fire VM triggers and let the app play the SFX.)**

---

## 4. Components, solos, constraints, rigging, effects

### 4.1 Components (formerly nested artboards)
- Any artboard → Component (Inspector icon or `Shift+N`); it gets a purple title. **Only the default artboard and Components are exported** to the .riv. Other artboards are editor-only (good for references and tests).
- Use components as: nested instances (Component Tool `N`), a VM **artboard property** (swappable at runtime), **script-instanced** prefabs, and **List items**.
- "Create Component" from a selection copies the relevant timeline keys into the new component. **State machines are not copied**, and data bindings are copied but their VMs are not. It fails if draw-order or other dependencies cross the boundary.
- Recommended structure: `Dombi` (component, own SM), `ConfettiBurst` (component, own SM + script), `StreakFlame`, `CorrectCheck`, `WrongShake`. The app screen artboard nests them, or the app renders each as its own RiveView. **(inferred: separate small RiveViews are simpler to place in RN layouts; nesting is better when effects must overlap Dombi exactly.)**

### 4.2 Solos
- A Solo renders exactly one child. That is "much faster than having to animate the opacity of each object individually". Animate it by clicking the radio button in a timeline. **The active child is bindable to a VM number** (index, 0 = first). Holiday-loader example: `activeBall` number bound to the Solo, with 14 ornament variants.
- Use Solos for Dombi's mouth shapes (frame-by-frame visemes), eye states (open / closed / happy-arc / X-X), and hand poses (open, point, fist, thumbs-up).

### 4.3 Constraints
IK, Distance, Transform, Translation, Scale, Rotation, **Follow Path**, Scroll. Uses for this project:
- **Translation constraint with limits** on the pupils, with a target that a joystick or `lookX/lookY` moves. The eyes then follow the target but stay inside the eye.
- **Distance constraint**: hands "orbit" the body at a fixed max distance.
- **Follow Path**: particles or sparkles travelling along a curve, or stars orbiting during celebration. Animate the constraint's **distance/offset** (0–100%) in a loop.
- Constraints vs data binding (official): constraints for direct visual/spatial object-to-object links; data binding when the value comes from or goes to code, needs conversion, or is shared.

### 4.4 Bones and meshes (squash/stretch on a blob)
- Vector paths: "Bind the vertices and Bézier handles of a vector path to one or more bones. Adjust their weights." Meshes are for **raster images** only.
- **Blob squash/stretch recipe:**
  1. **Simplest (recommended):** animate the body group's `scaleX`/`scaleY` (inverse, e.g. 1.12/0.9 on land, 0.92/1.1 on jump) with the origin at the **bottom center**, so Dombi squashes onto the floor. Add a slight `y` offset and keep the eyes in a child group that counter-scales a bit to stay round **(inferred art direction)**.
  2. **Organic wobble:** a short bone chain (root at the base, 2–3 bones up the center), with the body path's vertices weighted along it. Rotating the top bones gives a jelly lean without breaking the outline. Keep the vertex count low (a circle = 4 vertices + handles).
  3. **Procedural:** a PathEffect or Node script that perturbs the circle's 4 cubic control points with a sine of time, for a "breathing blob" **(inferred)**.
- `mesh_rigging_tool` (MCP) "traces a 2D silhouette and binds bones" for images and paths. For a flat vector Dombi, prefer native vector bone binding.

### 4.5 Joysticks
A joystick pans through timelines assigned to its X and Y axes ("animate body poses, eyes, mouths, hands"). It can be driven by other joysticks or by data binding. For gaze: X axis = `Look_LeftRight` timeline (pupils at x=−max at frame 0 and +max at the end), Y axis = `Look_UpDown`. Bind the handle to `lookX/lookY`.

### 4.6 Trim paths (draw-on)
Every stroke has Trim Path with Start / End / Offset and a mode (Sequential / Synchronized). Draw-on: animate End 0→100%. Comet trail: animate Start and End together with an offset gap. Use it for the check-mark stroke, the circle burst ring, and streak flame outlines.

### 4.7 Clipping
Clip a shape or group by another shape (Clipping in the inspector). Avoid clipping whole artboards for performance. Use it for eye-blink masks (lid shape clipping the pupil) or for a reveal wipe.

### 4.8 Vector Feathering (glow/soft shadow)
- Apply it to any fill or stroke. The fill rule must be **Clockwise**. Properties: **Amount**, **Offset (x/y)**, **Inner** (inner glow/shading). Set **Space = World** so the offset ignores rotation/scale.
- "Not quite the same as a traditional blur" but scalable and cheap. **Requires the Rive Renderer**: it works on RN (always Rive Renderer), Flutter with `Factory.rive`, and web `webgl2`. It does **not** work on web `canvas`.
- Script paints accept `feather` too, so sparkle dots can have soft halos.
- Uses: a soft contact shadow under Dombi (an ellipse with feather and no offset), a glow behind the streak flame, a celebration halo.

### 4.9 Blend modes
They are available per shape/paint (`additive`, `screen`, `multiply`, ...). They are **expensive on the web** (a framebuffer copy) and fine on native with the Rive Renderer. Use `additive` for sparkle particles sparingly.

### 4.10 Layouts and text
- Layouts (flex-like) with Fit.Layout at runtime adapt artboards to screen size (`layoutScaleFactor`). They are useful for full-screen celebration overlays that must stretch.
- Text runs: bind strings via VM (e.g. "+15 XP"). Don't address runs by name from code (deprecated approach). Subset fonts (glyph selection) to keep the .riv small.

---

## 5. PARTICLES IN RIVE (all known approaches)

### 5.1 Facts
- "Rive doesn't include a built-in particle system — and that's intentional" (Rive Masterclass, Dec 2025).
- Scripting launched GA on **2026-01-13** ("Scripting is live in Rive"). The launch post lists "Particle behaviors: emitters, trails, procedural bursts, noise-driven motion, controllable UI confetti".
- Official **Particle Library** by TeamRive (community file 28062, CC BY, 2026-09-30): "A small, self contained particle system for Rive node and layout scripts. It draws everything through the 2D Renderer that scripts already have access to, so there is nothing external to wire up. You feed it emitter configs, advance it each frame, and draw it." Demo .riv: `https://static.rive.app/rivs/particle-demo.riv` (artboard `Demo`). **Action:** remix or download this file in the editor and copy its scripts into our file rather than writing from scratch. I could not read its source over HTTP (the page needs JS).
- The Rive Editor has an **AI Agent** that can generate scripts (e.g. "generate a confetti script, then use your own artwork as the pieces", per a YouTube tutorial). Our MCP agent can do the same with `manage_scripts`.

### 5.2 Approach A: pure-draw Luau particle system (confetti)
Community example (theanimatedmonk/Rive-Scripts `confetti.lua`, abridged). It shows the real API usage, including **`Input<Trigger>` whose default is the handler function**:
```lua
export type Confetti = {
  fireTrigger: Input<Trigger>, delaySeconds: Input<number>,
  color1: Input<Color>, color2: Input<Color>, color3: Input<Color>, color4: Input<Color>,
  particles: { ConfettiPiece }, colors: { Color }, confettiCountdown: number,
}
local function onFireTrigger(self: Confetti) self.confettiCountdown = self.delaySeconds end
local function updatePiece(p, dt): boolean
  p.vy += GRAVITY * dt; p.x += p.vx * dt; p.y += p.vy * dt
  p.rotation += p.rotationSpeed * dt; p.life += dt
  return p.life <= p.maxLife and p.y <= BOUNDS_H + MARGIN
end
function draw(self: Confetti, renderer: Renderer)
  for _, p in ipairs(self.particles) do
    renderer:save()
    renderer:transform(Mat2D.withTranslation(p.x, p.y))
    renderer:transform(Mat2D.withRotation(p.rotation))
    drawRect(renderer, p.width, p.height, color)   -- NOTE: allocates Path+Paint per particle per frame (slow)
    renderer:restore()
  end
end
return function(): Node<Confetti>
  return { fireTrigger = onFireTrigger, delaySeconds = 1, color1 = Color.rgb(255,100,180), ...,
           particles = {}, colors = {}, confettiCountdown = 0,
           init = init, advance = advance, update = update, draw = draw }
end
```

**Improved production version for our app (inferred; composed from the API reference + LERP performance rules: build Path/Paint once, pool particles, no per-frame allocation):**
```lua
-- ConfettiBurst.luau  (Node protocol)
local MAX = 80
local GRAVITY = 900

type P = { alive: boolean, x: number, y: number, vx: number, vy: number,
           rot: number, vr: number, life: number, maxLife: number, sx: number, kind: number }

export type ConfettiBurst = {
  fire: Input<Trigger>,
  count: Input<number>,          -- 40 for normal, 70 for lesson complete
  spread: Input<number>,         -- radians, e.g. 1.2
  power: Input<number>,          -- px/s, e.g. 650
  c1: Input<Color>, c2: Input<Color>, c3: Input<Color>, c4: Input<Color>,
  pool: { P },
  rect: Path, dot: Path,
  paints: { Paint },
  active: number,
}

local function rnd(a: number, b: number): number return a + math.random() * (b - a) end

local function spawn(self: ConfettiBurst)
  local n = math.min(self.count, MAX)
  local spawned = 0
  for _, p in self.pool do
    if spawned >= n then break end
    if not p.alive then
      local ang = -math.pi / 2 + rnd(-self.spread, self.spread)   -- upward cone
      local spd = rnd(0.55, 1) * self.power
      p.alive = true; p.x = rnd(-10, 10); p.y = 0
      p.vx = math.cos(ang) * spd; p.vy = math.sin(ang) * spd
      p.rot = rnd(0, math.pi * 2); p.vr = rnd(-10, 10)
      p.life = 0; p.maxLife = rnd(1.2, 1.9); p.sx = rnd(0.6, 1.2)
      p.kind = math.random(1, 4)
      spawned += 1
    end
  end
  self.active += spawned
end

local function onFire(self: ConfettiBurst) spawn(self) end

function init(self: ConfettiBurst, context: Context): boolean
  for i = 1, MAX do
    table.insert(self.pool, { alive = false, x = 0, y = 0, vx = 0, vy = 0, rot = 0, vr = 0,
                              life = 0, maxLife = 1, sx = 1, kind = 1 })
  end
  -- unit rectangle 10x6 centred, built once
  self.rect:moveTo(Vector.xy(-5, -3)); self.rect:lineTo(Vector.xy(5, -3))
  self.rect:lineTo(Vector.xy(5, 3));   self.rect:lineTo(Vector.xy(-5, 3)); self.rect:close()
  self.paints = { Paint.with({ color = self.c1 }), Paint.with({ color = self.c2 }),
                  Paint.with({ color = self.c3 }), Paint.with({ color = self.c4 }) }
  return true
end

function update(self: ConfettiBurst)            -- colors changed in editor / via binding
  self.paints[1].color = self.c1; self.paints[2].color = self.c2
  self.paints[3].color = self.c3; self.paints[4].color = self.c4
end

function advance(self: ConfettiBurst, dt: number): boolean
  if self.active == 0 then return true end      -- keep listening (see gotcha: returning false stops advance)
  local alive = 0
  for _, p in self.pool do
    if p.alive then
      p.vy += GRAVITY * dt
      p.vx *= (1 - 1.5 * dt)                     -- air drag
      p.x += p.vx * dt; p.y += p.vy * dt
      p.rot += p.vr * dt; p.life += dt
      if p.life >= p.maxLife then p.alive = false else alive += 1 end
    end
  end
  self.active = alive
  return true
end

function draw(self: ConfettiBurst, renderer: Renderer)
  for _, p in self.pool do
    if p.alive then
      local t = p.life / p.maxLife
      renderer:save()
      renderer:transform(Mat2D.withTranslation(p.x, p.y))
      renderer:transform(Mat2D.withRotation(p.rot))
      -- fake 3D flutter: squash X with a sine of rotation
      renderer:transform(Mat2D.withScale(p.sx * math.cos(p.rot * 1.7), p.sx))
      renderer:modulateOpacity(t < 0.75 and 1 or (1 - t) / 0.25)
      renderer:drawPath(self.rect, self.paints[p.kind])
      renderer:restore()
    end
  end
end

return function(): Node<ConfettiBurst>
  return {
    fire = onFire, count = 40, spread = 1.1, power = 650,
    c1 = Color.rgb(88, 204, 2), c2 = Color.rgb(255, 200, 0),
    c3 = Color.rgb(28, 176, 246), c4 = Color.rgb(255, 75, 75),
    pool = {}, rect = Path.new(), dot = Path.new(), paints = {}, active = 0,
    init = init, advance = advance, update = update, draw = draw,
  }
end
```
Wiring: attach the script node at the burst origin. Data-bind `fire` to a VM trigger (`celebrate`) and `count` to a VM number. Note that the advance returns `true` always: **(inferred) returning `false` stops advance calls, and it is unclear whether a later trigger restarts them**. To be safe, keep it `true` and return early when idle, or call `context:markNeedsUpdate()` from the trigger handler if you choose to return false. Verify in the editor with simulateStateMachine + capture_artboard.

**Sparkles variant (inferred):** a 4-point star path built once (moveTo top, quadTo through the center to each tip), `Paint.with({ color = white, blendMode = 'additive', feather = 4 })`. Each particle: scale 0→1→0 with an ease-out-back curve over 0.5 s, slight rotation, spawned at random points on a ring around the target (`Vector.xy(math.cos(a)*r, math.sin(a)*r)`).

### 5.3 Approach B: Artboard-as-particle (designer-owned look)
Official "Instantiating components" pattern (Node Scripts docs):
```lua
type Enemy = { artboard: Artboard<Data.Enemy>, position: Vector }
export type MyGame = { enemy: Input<Artboard<Data.Enemy>>, enemies: { Enemy } }
function createEnemy(self: MyGame)
  local enemy = self.enemy:instance()
  table.insert(self.enemies, { artboard = enemy, position = Vector.xy(0, 0) })
end
function advance(self: MyGame, seconds: number)
  for _, e in self.enemies do e.artboard:advance(seconds) end
  return true
end
function draw(self: MyGame, renderer: Renderer)
  for _, e in self.enemies do renderer:save(); e.artboard:draw(renderer); renderer:restore() end
end
return function(): Node<MyGame>
  return { init = init, advance = advance, draw = draw, enemy = late(), enemies = {} }
end
```
Rive Masterclass "snow" system: the particle is a 24×24 component (white ellipse, centered origin, no logic). The script exposes `screenWidth/screenHeight` (bind to VM), `particlesCount`, `speedFactor` (clamped ≥ 0.1), and `wind` (−1..1). It randomizes X and the time offset per particle and recycles particles when they exit the bottom. Prompts were given to the in-editor AI agent one behavior at a time.

For Dombi: make `Star`, `Heart`, `ConfettiPiece` components whose own state machine plays a 0.6 s pop/twinkle. The script spawns N instances, sets per-instance VM values (`inst.data` typed `Data.Piece`, e.g. color index), moves them, and draws them with `renderer:transform(Mat2D.withScaleAndTranslation(s, s, x, y))`. **Cost note (inferred):** each instance runs its own artboard and state machine. Keep N ≤ ~30 on mobile, and prefer pure-draw (A) for 50–150 pieces.

### 5.4 Approach C: No-code Artboard List
Rive blog "holiday spinning loader" (Dec 2025): Main artboard VM number `count` → **Number to List converter** → **Artboard List** (items = `Particle` component with its own VM: `activeBall` bound to a Solo, `triggerJump`, `setRandomBall`), then a **Follow Path constraint on the list** with a looping timeline animating the constraint offset, producing a ring of particles. Lists are GA (July 2025), support virtualization for big counts, and expose the **item index** for per-item styling/offsets. Item positioning comes from the parent Layout or constraints. For a radial burst, use index-driven rotation via a converter, or put a Follow Path around a circle **(inferred)**.

### 5.5 Approach D: Hand-keyed burst component (cheapest, most reliable)
To build "correct answer" sparkle burst without code:
1. Component `BurstCorrect`, 160×160, origin center.
2. 8 pieces (4 small circles, 4 star shapes) in a group. Each piece has its own short timeline segment: position 0→(r·cos θ, r·sin θ) with ease-out over 0.35 s, scale 0→1 at 0.08 s → 0 at 0.45 s, rotation ±90°. Stagger the start keys by 0.02 s.
3. Add a ring: an ellipse stroke with Trim Path or scale 0.2→1.3 and opacity 1→0 over 0.4 s.
4. State machine: `Idle` (all pieces keyed at scale 0) ←Exit Time 100%← `Burst` (one-shot) ←trigger `fire`.
5. Randomness: make 3 variants (`Burst_A/B/C` with different angles) and use **Randomize Exit** from a hub state, so repeated bursts don't look identical.

### 5.6 Approach E: Instanced image mesh (hundreds of sprites, inferred)
Build one quad (`VertexBuffer` with 4 vertices, `uvs`, `TriangleBuffer` 2 triangles) and an image or sprite sheet from `context:image('spark')`. Each frame, `instances:resize(n)` and `instances:set(i-1, Mat2D.withScaleAndTranslation(...), opacity, additiveness, uvTranslate, uvScale)`, then call `renderer:drawImageMeshInstanced(img, sampler, verts, uvs, tris, instances)`. This is a single draw call. It is raster, though, so it breaks the pure-vector look. Use it only for dense dust or snow.

### 5.7 Performance limits (mobile)
- Allocate `Path`/`Paint`/tables once in `init`. Never allocate in `draw`. Pool particles; don't grow tables without bound. (LERP course "Performance" chapter; the community confetti.lua violates this.)
- Avoid `print` in loops.
- Prefer fewer, simpler paths: a rectangle = 4 vertices, a circle = 4 cubics.
- Use a fixed-timestep accumulator if the physics must be frame-rate independent (official docs pattern: `accumulator += seconds; while accumulator >= dt and steps < 5 do ... end`).
- Return to idle: when no particles are alive, skip work early **(inferred)**.
- **Inferred budgets:** ~100–200 simple vector particles via a pure-draw script is reasonable on mid-range phones with the Rive Renderer. Artboard-instance particles cost much more each (full artboard + SM advance), so keep them to ~20–40. Test on a low-end Android device.

---

## 6. Lip sync

Facts:
- Duolingo (official blog "world character visemes") uses Rive: "an animation state for each character's general poses… but we also made separate states just for the character's mouths". Mouth states "have to run at the same time as the states for the character animation", i.e. a separate layer. They have 20+ mouth shapes per character. Timings come from their speech pipeline (phoneme timings mapped to visemes). At runtime: "we retrieve the audio and the timing information, and then use the timings to trigger the animation state machine in sync with the audio". The character can stop speaking early, and idle (nods, blinks, brows) continues alongside.
- Rive staff (forum): Rive does **not** auto-lip-sync from text. Build visemes in the state machine "triggered by a number" and convert audio to those values in code.
- Forum issue: making the character smile at 100% "stopped the lip sync animations completely". Staff fix: **separate expressions from visemes, with one blend state for visemes and another for expressions** (separate layers).

Recipe (Dombi):
1. Mouth art: a **Solo** with ~8–12 mouth shapes (Dombi is minimal, so 8 is enough: rest/smirk, M/B/P closed, A/I open-wide, E, O/U round, F/V, L/TH, smile-talk). Keep the smirk as the rest shape.
2. VM: `viseme` number (0..N), `talking` bool.
3. Option (i), crisp/flat style (recommended for flat 2D): **bind the Solo's active index directly to `viseme`**. There is no state machine at all for the mouth, and the switch is instant (frame-by-frame like 2D cartoons). **(inferred: simplest and closest to flat-cartoon timing)**
4. Option (ii), smooth: a "Mouth" layer with states `V0..Vn` reached from Any State with condition `viseme == k`, transition duration 0.04–0.06 s. Or use a 1D blend on `viseme`, but 1D blends interpolate through intermediate shapes (0→5 passes 1..4), which looks wrong. Prefer discrete states or an Additive blend with per-viseme weight numbers driven from code.
5. App side: get viseme timings from TTS. Azure Speech gives 22 viseme IDs with audio offsets, and Amazon Polly gives speech marks. Map them to our 8–12 IDs. Start audio playback, then schedule `setViseme(id)` at each offset (use the audio clock, not setTimeout drift). Set `talking=false` and `viseme=0` at the end or on interrupt.
6. Fallback without timings: amplitude-driven `mouthOpen` 0..100 (1D blend closed→open). Third-party guides note this "looks mechanical". Mix the two: visemes for shape, amplitude for openness.
7. Put the mouth layer lowest in the layer list so it overrides the face layer's mouth keys. Better still, the face layer never keys the mouth.

---

## 7. Runtime and performance best practices (official + inferred)

- **File size:** images, audio, and fonts are the bloat. Subset font glyphs, use WebP for images, and set "Prevent Export" for unused assets. Only Components and the default artboard export.
- **Vertices:** "thousands might" hurt. Be careful with AI-generated or traced SVGs. Dombi should be built from primitives (ellipse + few-point paths).
- **Clipped artboards** are expensive. Remove the artboard clip when possible.
- **Idle self-pause:** if only one-shots are left and no blend state is active, the runtime pauses. Move out of blend states when done.
- **Solos/data-bound artboards** instead of opacity toggles for skins and variants.
- **Multiple instances on the web:** use the canvas package or share one renderer. On RN, each RiveView is a native view **(inferred: keep simultaneous animated RiveViews per screen low, e.g. Dombi + 1 effect)**.
- **Renderer:** Rive Renderer everywhere for this app (RN default). Feathering depends on it.
- **Fit:** `Fit.Contain` for the mascot. `Fit.Layout` + `layoutScaleFactor` for full-screen responsive overlays (celebration screen). `alignment` is ignored with Fit.Layout.
- **Reduced motion:** Rive has an editor accessibility feature for reduced motion (docs: editor/accessibility/reduced-motion). Branch the state machine on it, e.g. skip the confetti and use a simple scale pop.
- **Testing:** test on target devices continuously (official). Use Debug Panel in the editor. Over MCP: `script_diagnostics` (linter is the source of truth), `read_console` only shows frames that already ran (play or scrub first), and `recompile_all_scripts` after text edits (theanimatedmonk MCP notes). Node `drawCanvas` was removed: GPU canvas work goes in `draw`.

---

## 8. Recipes (quick)

**Dombi hands pop-in (gesture):** hands live in a group under the body, default keyed scale 0 in the `None` state. In `Wave`: frame 0 scale 0 → 0.12 s scale 1.15 (cubic ease-out) → 0.2 s scale 1 → wave rotation ±20° ×2 → 0.9 s scale 1 → 1.05 s scale 0. Exit Time 100% → `None`. State action End: set `gesture = none`, fire `gestureDone`. Optional Audio Event "pop" at frame 0.

**Correct feedback:** VM trigger `correct` → Reactions layer `Correct` (Dombi squash 0.9/1.1 → hop y −24 → land squash 1.12/0.9 → settle, hands thumbs-up) plus a nested `BurstCorrect` fired by the same trigger. Total ≤ 0.8 s.

**Incorrect feedback:** `Wrong`: horizontal shake x ±6 px ×3 over 0.3 s (linear, hold keys for snap), eyes Solo → "squint", mouth → flat. No particles, so it stays calm and readable.

**Streak flame:** a flame path with 2–3 bones (sway loop, 1.2 s ping-pong), an inner flame layer offset in phase, a feathered glow ellipse behind it (feather ~20, Rive Renderer), and a text run bound to `streakCount` (string converter). Increment animation: number scale pop 1→1.3→1 with trim-path ring.

**Lesson complete celebration:** full-screen artboard with Fit.Layout. Dombi jump loop ×2, ConfettiBurst script `count=70` from two emitters (left and right bottom corners, cones pointing inward-up), sparkles around the XP number.

**Draw-on check mark:** a stroke path of the check, Trim End 0→100% over 0.25 s ease-out, after a circle scale-in. Cap round, thickness 8.

---

## 9. Gotchas list

1. **Unkeyed properties persist** after a state change. Key neutral values at frame 0 in every state of a layer, or route through a Neutral state. (§2.3)
2. **Two layers keying the same property:** the lower layer in the list wins. Keep property ownership per layer.
3. **Multiple state machines on one artboard** is discouraged and may lose runtime support. Use one machine with layers.
4. **Transitions without conditions fire immediately.** Missing Exit Time means one-shots get cut at frame 0.
5. **Any State + a condition that stays true** re-enters constantly, or causes "exceeded max iterations". Use triggers.
6. **1D blend is additive, not linear.** Key few properties per blended timeline. Don't use it for discrete visemes.
7. **Blend states keep the runtime awake.** Exit them when done.
8. **Inputs and General Events are deprecated.** Use VM properties. Use "Convert Inputs to View Models" on old files.
9. **Feathering needs the Rive Renderer** (not web canvas). Its fill rule must be Clockwise.
10. **Blend modes are costly on the web.**
11. **Artboards that aren't Components don't export.** Converting a selection to a component doesn't copy the state machine.
12. **Scripts:** don't allocate Path/Paint in `draw`. Don't call `markNeedsUpdate()` inside `update`. Store VMs on `self` or they get GC'd and listeners die. Remove listeners when done. `advance` returning false stops ticks.
13. **`Input<Trigger>` default = the handler function** (e.g. `fire = onFire`) in the factory table. Artboard/VM inputs default to `late()`.
14. **Script coordinates are in the host node's local space.** Put the script node at the emitter origin.
15. **MCP:** a file must be open (`session_info` openTabs). After text edits, recompile and re-run diagnostics. The console only reflects frames that have run.
16. **Lip sync:** expressions and visemes must be on separate layers/blends, or a 100% expression blocks the visemes.
17. **Randomize Exit** works per state on its outgoing paths. Weights are relative (3:1 = 75/25).
18. **Exit state** stops the whole layer. Don't route a looping base layer to Exit.

---

## 10. Sources

Official docs (rive.app/docs, `.md` versions):
- https://rive.app/docs/llms.txt (doc index)
- https://rive.app/docs/editor/state-machine/state-machine.md
- https://rive.app/docs/editor/state-machine/states.md
- https://rive.app/docs/editor/state-machine/transitions.md
- https://rive.app/docs/editor/state-machine/layers.md
- https://rive.app/docs/editor/state-machine/listeners.md
- https://rive.app/docs/editor/data-binding/overview.md
- https://rive.app/docs/editor/data-binding/view-models.md
- https://rive.app/docs/editor/data-binding/property-types.md
- https://rive.app/docs/editor/data-binding/converters.md
- https://rive.app/docs/editor/data-binding/lists.md
- https://rive.app/docs/editor/data-binding/stateful-components.md
- https://rive.app/docs/editor/data-binding/migration-guide.md
- https://rive.app/docs/editor/fundamentals/components.md
- https://rive.app/docs/editor/manipulating-shapes/solos.md
- https://rive.app/docs/editor/manipulating-shapes/bones.md
- https://rive.app/docs/editor/manipulating-shapes/meshes.md
- https://rive.app/docs/editor/manipulating-shapes/joysticks.md
- https://rive.app/docs/editor/manipulating-shapes/trim-path.md
- https://rive.app/docs/editor/manipulating-shapes/clipping.md
- https://rive.app/docs/editor/constraints/constraints-overview.md
- https://rive.app/docs/editor/constraints/follow-path-constraint.md
- https://rive.app/docs/editor/events/overview.md
- https://rive.app/docs/editor/events/audio-events.md
- https://rive.app/docs/getting-started/best-practices.md
- https://rive.app/docs/runtimes/choose-a-renderer/overview.md
- https://rive.app/docs/scripting/getting-started.md
- https://rive.app/docs/scripting/creating-scripts.md
- https://rive.app/docs/scripting/protocols/overview.md
- https://rive.app/docs/scripting/protocols/node-scripts.md
- https://rive.app/docs/scripting/protocols/path-effect-scripts.md
- https://rive.app/docs/scripting/script-inputs.md
- https://rive.app/docs/scripting/data-binding.md
- https://rive.app/docs/scripting/demos.md
- https://rive.app/docs/runtimes/react-native/react-native.md
- https://rive.app/docs/runtimes/react-native/data-binding.md
- https://rive.app/docs/runtimes/react-native/props.md
- https://rive.app/docs/runtimes/flutter/data-binding.md
- https://rive.app/docs/runtimes/flutter/flutter.md
- https://rive.app/docs/runtimes/web/data-binding.md

Rive blog / community:
- https://rive.app/blog/scripting-is-live-in-rive (2026-01-13)
- https://rive.app/blog/build-a-holiday-spinning-loader-with-data-binding (2025-12-11)
- https://rive.app/blog/data-binding-supercharged-lists-images-and-artboards
- https://rive.app/blog/introducing-vector-feathering
- https://rive.app/blog/how-rive-reinvented-feathering-for-the-vectorian-era
- https://rive.app/community/files/28062-particle-librar/ (TeamRive Particle Library)
- https://static.rive.app/rivs/particle-demo.riv
- https://rive.app/marketplace/25802-48192-dynamic-particle-system-script-ai-agent/
- https://rive.app/community/files/28136-transitions-demos
- https://rive.app/community/forums/support/fsnLLkXUaA62/layers-in-state-machine-conflict/ftvvp26ifTuQ (via search snippet)
- https://rive.app/community/forums/support/fsnLLkXUaA62/blending-between-inputs/ftNEp8TkjtJb (via search snippet)
- https://rive.app/community/forums/support/fsnLLkXUaA62/lip-sync/ftyrdnSzhsd7 (via search snippet)

Third party:
- https://www.rivemasterclass.com/blog/build-dynamic-particles-system-scripting-ai-agent-rive
- https://github.com/theanimatedmonk/Rive-Scripts (confetti.lua, confetti2.lua, rain_particle_system.lua, mcp/*.md)
- https://github.com/ivg-design/lerp (Luau course: docs/best-practices/performance.mdx, docs/advanced/procedural.mdx)
- https://www.youtube.com/watch?v=Zp119_RaBb0 (Rive Scripting: your own art as confetti)
- https://blog.duolingo.com/world-character-visemes
- https://dev.to/uianimation/building-a-duolingo-style-interactive-mascot-in-rive-step-by-step-guide-2d5c
- https://dev.to/mascotengine/5-rive-state-machine-tricks-every-flutter-developer-should-know-239

Local:
- Rive MCP `get_scripting_reference` dumps: `scratchpad/research/ref/*.txt` (renderer, artboards, interfaces, paint, path, vector, mat2d, color, gradient, mesh, image, text, dataValue, promise, example_node, example_test, viewmodel_definitions).
