## Article Topics
- What Integrity Engine is and why it was built
- The five supported platforms and their rendering backends
- The Meson build system and Docker cross-compilation setup
- Key subsystems: rendering, input, physics, audio, and scripting
- The 18 included example projects and what each demonstrates

## Introduction

Integrity Engine (known internally as **gamejam**) is an open source cross-platform C game engine I started in 2019. The primary targets are the **Sega Dreamcast** and **Sony PSP**, with full desktop support on Windows, Linux, and macOS for fast iteration before pushing to real hardware.

The motivation was simple: every Dreamcast and PSP project I worked on ended up reinventing the same wheel. Platform setup, rendering boilerplate, controller input, asset loading. Integrity Engine pulls all of that into one reusable foundation so you can focus on writing the actual game.

- [GitLab](https://gitlab.com/HaydenKow/gamejam)

## What It Does

The engine handles everything below the game-logic layer across all five platforms:

- **2D and 3D rendering**: built on OpenGL, using platform-appropriate GL variants (KallistiOS GL on Dreamcast, pspGL on PSP, GLAD + GLFW on desktop). The same draw calls work everywhere.
- **Scene system**: game states (title screen, gameplay, menus) are structured as scenes with lifecycle callbacks. The engine manages transitions and dispatches the per-frame update and render calls automatically.
- **Unified controller input**: buttons, D-pad, analog sticks, and pressure-sensitive triggers are abstracted into a single API regardless of whether you're on a Dreamcast controller, PSP face buttons, or a PC gamepad.
- **Asset pipeline**: loaders for images, Wavefront OBJ models, a custom compact model format (JFM), and WAV audio. A resource manager handles asset lifetimes so scenes don't leak.
- **Abstracted file I/O**: path handling differences between disc-based Dreamcast, memory-stick PSP, and desktop filesystems are resolved transparently.
- **2D and voxel physics**: AABB collision, 2D rigidbodies, and a 3D voxel sweep physics system.
- **Sound**: OpenAL-backed audio on desktop platforms; the interface stubs compile cleanly on all targets.
- **Scripting**: [Umka](https://github.com/vtereshkov/umka-lang), a statically typed embeddable scripting language, is integrated as a dependency for driving game logic.

## Build System

The `simple_physics` branch migrated from hand-written per-platform Makefiles to **Meson**, which handles dependency resolution, platform flags, and static library packaging in a single `meson.build`. Each platform is selected via a build option and gets the correct toolchain flags, optimization settings, and linked libraries automatically.

Docker support is still present for zero-configuration cross-compilation. A single `make` pulls the appropriate containers and builds all targets without any local toolchain setup.

## Platform Support

| Platform | Renderer | Audio |
|---|---|---|
| Sega Dreamcast | KallistiOS GL + GLdc | n/a |
| Sony PSP | pspGL | n/a |
| Windows | GLAD + GLFW | OpenAL |
| Linux | GLAD + GLFW | OpenAL |
| macOS | GLAD + GLFW | OpenAL Soft |

## Examples

The repo includes 18 example projects that cover the engine's feature set end to end. Each builds to a runnable CDI for Dreamcast, an EBOOT.PBP for PSP, and a native binary on desktop.

**Basics**

- **hello**: The minimum viable Integrity program. Registers a scene, draws to screen, confirms the build pipeline is working.
- **umka_hello**: The same hello world driven by an Umka script instead of hardcoded C. A starting point for games that want embedded scripting.
- **input_test**: Exercises the unified input API across all button, D-pad, and analog inputs. Useful for verifying controller mappings on a new platform.

**Rendering**

- **spinner**: Loads a 3D model and spins it in place. A quick sanity check for the renderer and OBJ loader.
- **mdl_viewer**: Interactive model viewer with camera controls. Used to inspect assets before integrating them into a full scene.
- **vertex_colors**: Demonstrates per-vertex color rendering without textures. Shows the direct vertex pipeline.
- **scaled_2d**: Explores 2D rendering at non-native scales. Useful for UI and sprite-based games targeting different resolutions.
- **particles_basic**: Basic particle emitter. Covers spawning, updating, and rendering a large number of simple quads per frame.

**World and Physics**

- **json_world** / **json_world_v2**: Loads level geometry and object placement from a JSON definition file. The v2 version extends the format with additional entity types.
- **voxels**: A chunk-based voxel world with a walking player. Renders a tile-atlas terrain, tracks player position across chunks, and shows a live FPS counter.
- **voxel_chunk**: A smaller focused demo of a single voxel chunk. Used to profile and iterate on the chunk generation and rendering code.
- **platformer**: The most complete example in the repo. Loads a GLTF scene through the asset cooker, initializes a triangle-mesh physics world via simple_physics, and runs a full player controller with a chase camera and debug collision overlay.

**Audio and Visualization**

- **jump_it**: A small 2D platformer with sound. Plays jump and land audio cues through the OpenAL backend, demonstrating basic sound integration alongside scene and world management.
- **sound_viz_basic**: Renders a simple real-time audio visualizer driven by a pre-computed spectrum file.
- **sound_viz_outrun**: An Outrun-style music visualizer. Renders a 3D car, scrolling palm trees, and a road while syncing their animation to per-frame frequency band data extracted from a music track.

