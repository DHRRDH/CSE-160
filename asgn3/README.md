# WebGL 3D Virtual World

A WebGL-based 3D virtual world project that implements an interactive block-based world with terrain generation and building features.

## Features

1. Terrain Generation
   - Natural terrain generation using Perlin noise algorithm
   - Multiple layers including grass, dirt, and stone
   - Automatic tree generation with trunks and leaves

2. Camera System
   - WASD keys for movement
   - QE keys for rotation
   - Mouse control for view direction
   - Spacebar for jumping
   - Collision detection system

3. Block Interaction
   - Left-click to add blocks
   - Right-click to remove blocks
   - Block highlighting for selection

4. Scene Rendering
   - Skybox system
   - Basic texture rendering
   - Frustum culling optimization
   - Chunk loading system

## Installation and Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the project:
   - Use a web server with local file access (e.g., VS Code's Live Server extension)
   - Open `asgn3.html` file

## Controls

- W: Move forward
- S: Move backward
- A: Move left
- D: Move right
- Q: Rotate left
- E: Rotate right
- Spacebar: Jump
- Mouse movement: Control view direction
- Left mouse button: Add block
- Right mouse button: Remove block

## Project Structure

```
asgn3/
├── asgn3.js          # Main game logic
├── asgn3.html        # HTML entry file
├── generate_skybox.js # Skybox generation tool
├── lib/              # WebGL utility libraries
├── skybox/           # Skybox textures
├── textures/         # Block textures
└── square.png        # Basic texture image
```

## Technical Implementation

1. Terrain Generation
   - Multi-octave Perlin noise for natural terrain
   - Chunk system for performance optimization
   - Dynamic loading and unloading of distant chunks

2. Rendering Optimization
   - Frustum culling implementation
   - Chunk-based rendering for performance
   - Optimized texture loading and usage

3. Physics System
   - Basic gravity implementation
   - Collision detection
   - Ray casting for block selection

## Requirements

- Modern web browser (Chrome, Firefox, etc.)
- Graphics hardware with WebGL support
- Local web server recommended to avoid cross-origin issues
