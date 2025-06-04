Assignment 5: Three.js First-Person Exploration Scene
Hello! This is my submission for Assignment 5, a first-person exploration 3D scene created using the Three.js library.

How to Run the Project:

Please serve the entire project folder (containing index.html, the models folder, and the textures folder) using a local HTTP server (e.g., VS Code's Live Server extension).
Alternatively, you can access the project directly via the live hosted link I will provide with my submission.
Once index.html is loaded, click on "Click to Start" on the screen to begin interaction.
Use WASD or Arrow Keys for movement.
Use the Mouse to look around.
Use the Spacebar to jump.
Press the ESC key to release mouse control.
Project Link : https://dhrrdh.github.io/CSE-160/asgn5/index.html

Fulfillment of Assignment Requirements
Here’s how this project meets each of the grading requirements for the assignment:

Basic scene is working (2 pts)

At least 3 different primary shapes: The scene programmatically generates various primitive geometries, including BoxGeometry (cubes), SphereGeometry (spheres), CylinderGeometry (cylinders), ConeGeometry (cones), and TorusGeometry (tori). 
At least one of these shapes is animated: A red sphere (animatedSphere) in the scene has an up-and-down bouncing animation. 
A directional light source: The scene includes a DirectionalLight to simulate sunlight and cast shadows. 
A camera with perspective projection: A PerspectiveCamera is used to provide a view with depth. 

At least one primary shape in your scene is textured (1 pt)

One cube (texturedCube) in the scene is textured using textures/cube_texture.jpg. The ground plane is also textured using textures/brick_texture.jpg. 

To have a custom textured 3D model (.glb, .gltf or .obj with .mtl loaded) (1 pt)

The scene loads three external .glb models (located in the models/ folder): Cottage.glb, Roman Centurion.glb, and Trees.glb. These models include their own textures. 
To be able to move the camera with controls (1 pt)

PointerLockControls have been implemented, allowing the user to freely look around with the mouse and navigate the scene in first-person using keyboard (WASD/Arrow keys) input, including a jump function with the spacebar. 

To have at least 3 different light sources into your scene (1 pt)

The scene utilizes four different types of light sources to create a richer lighting environment:
AmbientLight 
DirectionalLight 

PointLight 
SpotLight 
To have a skybox in your scene (1 pt)

The scene uses a CubeTextureLoader to load 6 images from the textures/skybox_storforsen/ folder, creating a complete natural landscape skybox background. 
To have at least 20 primary shapes in your scene (1 pt)

In addition to a few distinct, manually placed primitive shapes, the code includes a loop that generates multiple additional primitive shapes with random colors and materials, ensuring the total count well exceeds 20. The specific count can be viewed in the browser console via the Total Primary Shapes log. 

Extra Feature (Wow Point - 1.5 pts)

First-Person Controls: For the "Wow Point," I focused on implementing an immersive first-person exploration experience. By using PointerLockControls combined with custom keyboard movement (WASD/Arrow Keys) and jump logic (Spacebar), users can navigate the scene much like in a first-person game. This offers a higher degree of interactivity and exploration fun compared to basic orbit controls and aligns well with the "first-person exploration application" goal mentioned in the assignment introduction.  A note explaining this feature is also present in the bottom-left corner of the webpage (wowPointNote).

Place your site link as a comment of the submission (0.5 pts)

I will include the live hosted link for the project as a comment with my submission on Canvas.

Thank you for your time and for reviewing my project! I hope you enjoy exploring the scene.