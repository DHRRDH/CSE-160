# Assignment 4: Lighting and Shaders

## Overview

This project implements a 3D scene with multiple objects illuminated by different types of light sources using the Phong shading model. It demonstrates understanding of lighting calculations, normal transformations, user interface controls for scene manipulation, and OBJ model loading in WebGL.

## Features Implemented

* **Basic Shapes:**
    * At least one **Cube** is rendered in the scene. [cite: 1]
    * A **Sphere** is also created and rendered. [cite: 1]
* **World Elements:**
    * The scene includes a ground plane and additional "blocky world" elements, all of which are correctly lit. [cite: 1]
* **Lighting Model:**
    * Objects are illuminated using the **Phong Shading model**, which includes ambient, diffuse, and specular components. [cite: 1]
    * Vertex normals are calculated and passed to the shaders for accurate lighting. [cite: 1]
* **Light Sources:**
    * **Point Light:**
        * A point light source illuminates the objects in the world. [cite: 1]
        * The point light's position **animates over time**, moving around the world. [cite: 1]
        * Sliders are provided to **manually adjust the X, Y, and Z position** of the point light. [cite: 1]
        * The **color** of the point light (R, G, B components) can be changed using sliders. [cite: 1]
        * A visual marker (a small cube) indicates the current position of the point light. [cite: 1]
        * The point light can be toggled on/off. [cite: 1]
    * **Spotlight:**
        * An additional **spotlight** is implemented, focusing light in a particular direction. [cite: 1]
        * The spotlight's position, direction, and cutoff angle (cosine) can be controlled via UI sliders. [cite: 1]
        * A visual marker indicates the current position of the spotlight. [cite: 1]
        * The spotlight can be toggled on/off independently. [cite: 1]
* **Camera Controls:**
    * The camera's viewing angle (X and Y rotation) can be adjusted using sliders, allowing the user to view the scene from different perspectives. [cite: 1]
* **User Interface Controls:**
    * A button is provided to **toggle overall lighting** on and off. When off, objects are rendered with their base colors. [cite: 1]
    * A button allows **visualization of vertex normals** by rendering them as colors. [cite: 1]
* **OBJ Model Loading:**
    * The application supports loading and displaying a user-selected `.obj` model file. [cite: 1]
    * The loaded OBJ model is integrated into the scene and is correctly illuminated by the existing light sources. [cite: 1]

## How to Run

1.  Open the `asgn4.html` file in a WebGL-enabled browser.
2.  Use the provided sliders and buttons to interact with the scene, camera, lights, and load an OBJ model.

## Notes

* The `cuon-matrix.js` library is used for matrix operations.
* External `webgl-utils.js` and `webgl-lessons-ui.js` are used for WebGL setup and UI elements respectively.
* The OBJ parser included is basic and works best with models that include vertex normals.