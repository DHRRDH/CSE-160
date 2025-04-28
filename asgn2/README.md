
--------------------------------
Description:
This is a "Blocky Cat" created for Assignment 2. 
The cat is made up of multiple parts and features full interactive controls, animations, and performance optimizations as required by the rubric.

--------------------------------
Features Implemented:

- Draw a Cube:
  - Implemented a reusable drawCube(matrix, color) function.

- Global Rotation:
  - The entire cat model can rotate using the "Global Rotation" slider or by dragging with the mouse.

- Single renderScene() function:
  - All drawing operations are centralized in renderScene().

- Complete Animal Model:
  - Includes head, body, four legs, tail (with three segments), and two ears (pyramids).

- Controllable Joint:
  - The front legs can be controlled with the "Front Leg" slider.

- Second Level Joint:
  - The tail has a base and tip segment with independent movement.

- Third Level Joint:
  - A third segment ("tail tip tip") is attached to the tail tip to fulfill the third level joint requirement.

- Tick() Animation:
  - Tail wagging and poking animations are handled via a working tick() function.

- Animation Toggle Button:
  - A button toggles animation on and off.

- Colors:
  - The cat’s body, head, ears, and legs are colored to make the appearance appealing.

- Animation on Most Parts:
  - Tail base, tail tip, and ears animate naturally.

- Non-Cube Primitive:
  - Ears are modeled using pyramids (not cubes).

- Poke Animation (Shift-Click):
  - Shift-clicking the canvas causes the ears to wiggle.

- Mouse Drag Control:
  - Mouse dragging rotates the entire animal.

- Performance Optimization:
  - Used frame limiting in tick() to maintain smooth FPS (~48-60 FPS).

- FPS Indicator:
  - A visible FPS counter is displayed at the bottom of the page.

--------------------------------
How to Use:

- Adjust "Global Rotation" slider to rotate the whole cat.
- Drag the mouse to rotate the cat manually.
- Adjust "Front Leg" slider to move the front legs.
- Click "Toggle Animation" to start/stop tail and ear animations.
- Shift-Click on the canvas to activate poke animation (ear wiggle).
- Watch the FPS counter for performance information.

--------------------------------
Notes:
- This project was developed and tested using the Mininet VM environment.
- No external frameworks were used other than provided cuon-utils and cuon-matrix libraries.

--------------------------------
