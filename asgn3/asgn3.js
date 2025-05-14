// asgn3.js

// Vertex shader program (remains the same)
const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    varying vec2 v_TexCoord;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        v_TexCoord = a_TexCoord;
    }`;

// Fragment shader program (remains the same)
const FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform sampler2D u_Sampler;
    uniform bool u_UseTextures;
    uniform vec4 u_BaseColor;
    varying vec2 v_TexCoord;
    void main() {
        if (u_UseTextures) {
            gl_FragColor = texture2D(u_Sampler, v_TexCoord);
        } else {
            gl_FragColor = u_BaseColor;
        }
    }`;

// --- CAMERA CLASS DEFINITION --- (remains the same)
class Camera {
    constructor(fov = 60, aspect = 1.0, near = 0.1, far = 1000.0) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.eye = new Vector3([0, 1, 7]); // Start a bit further back to see ground/sky
        this.at  = new Vector3([0, 0, 0]);
        this.up  = new Vector3([0, 1, 0]);
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.speed = 0.25; 
        this.turnSpeed = 4.0; 
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }
    updateViewMatrix() { /* ... same ... */ 
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
            this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
        );
    }
    updateProjectionMatrix() { /* ... same ... */ 
        let aspectToUse = this.aspect;
        if (isNaN(this.aspect) || this.aspect === 0 || !isFinite(this.aspect)) {
            aspectToUse = 1.0; 
        }
        this.projectionMatrix.setPerspective(this.fov, aspectToUse, this.near, this.far);
    }
    moveForward() { /* ... same ... */ 
        let f = new Vector3();
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = 0; 
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        f.normalize();
        f.elements[0] *= this.speed;
        f.elements[2] *= this.speed;
        this.eye.elements[0] += f.elements[0];
        this.eye.elements[2] += f.elements[2];
        this.at.elements[0] += f.elements[0];
        this.at.elements[2] += f.elements[2];
        this.updateViewMatrix();
    }
    moveBackward() { /* ... same ... */ 
        let f = new Vector3();
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = 0; 
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        f.normalize();
        f.elements[0] *= this.speed;
        f.elements[2] *= this.speed;
        this.eye.elements[0] -= f.elements[0];
        this.eye.elements[2] -= f.elements[2];
        this.at.elements[0] -= f.elements[0];
        this.at.elements[2] -= f.elements[2];
        this.updateViewMatrix();
    }
    _getRightDirection() { /* ... same ... */ 
        let f_x_dir = this.at.elements[0] - this.eye.elements[0];
        let f_z_dir = this.at.elements[2] - this.eye.elements[2];
        let f_len = Math.sqrt(f_x_dir * f_x_dir + f_z_dir * f_z_dir);
        if (f_len < 0.00001) { return new Vector3([1, 0, 0]);  }
        f_x_dir /= f_len;
        f_z_dir /= f_len;
        let r_x = -f_z_dir;
        let r_z = f_x_dir;
        return new Vector3([r_x, 0, r_z]);
    }
    moveLeft() { /* ... same ... */ 
        let rightDir = this._getRightDirection();
        this.eye.elements[0] -= rightDir.elements[0] * this.speed;
        this.eye.elements[2] -= rightDir.elements[2] * this.speed;
        this.at.elements[0] -= rightDir.elements[0] * this.speed;
        this.at.elements[2] -= rightDir.elements[2] * this.speed;
        this.updateViewMatrix();
    }
    moveRight() { /* ... same ... */ 
        let rightDir = this._getRightDirection();
        this.eye.elements[0] += rightDir.elements[0] * this.speed;
        this.eye.elements[2] += rightDir.elements[2] * this.speed;
        this.at.elements[0] += rightDir.elements[0] * this.speed;
        this.at.elements[2] += rightDir.elements[2] * this.speed;
        this.updateViewMatrix();
    }
    panLeft() { /* ... same ... */ 
        let f = new Vector3(); 
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = this.at.elements[1] - this.eye.elements[1]; 
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(this.turnSpeed, 0, 1, 0);         
        let f_prime = rotMatrix.multiplyVector3(f); 
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
        this.updateViewMatrix(); 
    }
    panRight() { /* ... same ... */ 
        let f = new Vector3();
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = this.at.elements[1] - this.eye.elements[1];
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(-this.turnSpeed, 0, 1, 0); 
        let f_prime = rotMatrix.multiplyVector3(f);
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
        this.updateViewMatrix();
    }
}
// --- END OF CAMERA CLASS ---

// Global variables
let gl;
let canvas;
let n_indices_cube; // Number of indices for a cube object

// Model matrices for different objects
let g_worldModelMatrix = new Matrix4(); // For the main spinning cube
let g_groundModelMatrix = new Matrix4();
let g_skyModelMatrix = new Matrix4();

let g_mvpMatrix = new Matrix4(); // Reused for each object
let g_camera;
let g_texture0; // For spinning cube and ground (can add more textures later)
let u_Sampler;
let u_UseTextures;
let u_BaseColor;
let u_MvpMatrixLoc;
let g_currentAngle = 0.0; 
const ANGLE_STEP = 45.0;  
let g_lastTime = Date.now(); 

function main() {
    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas, true);
    if (!gl) { console.log('Failed to get GL context'); return; }
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { /* ... */ return; }
    
    // Initialize buffers for a unit cube. This will be used by all cube objects.
    n_indices_cube = initVertexBuffersCube();
    if (n_indices_cube < 0) { /* ... */ return; }

    gl.clearColor(0.0, 0.0, 0.1, 1.0); // Initial clear color, skybox will mostly cover
    gl.enable(gl.DEPTH_TEST);

    // Get uniform locations (once)
    u_MvpMatrixLoc = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures');
    u_BaseColor = gl.getUniformLocation(gl.program, 'u_BaseColor');
    if (!u_MvpMatrixLoc || !u_Sampler || !u_UseTextures || !u_BaseColor) { /* ... */ return; }
    
    if (!initTextures()) { /* ... */ return; }

    g_camera = new Camera(60, 1.0, 0.1, 100.0); // Aspect set by resize

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize(); 

    initEventHandlers();
    g_lastTime = Date.now();
    tick();
}

function onWindowResize() { /* ... same ... */ 
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    if (g_camera) { 
        g_camera.aspect = gl.canvas.width / gl.canvas.height;
        g_camera.updateProjectionMatrix();
    }
}

function initVertexBuffersCube() { /* ... same (provides generic cube vertices/indices) ... */ 
    const verticesTexCoords = new Float32Array([ -0.5, -0.5,  0.5,  0.0, 0.0,  0.5, -0.5,  0.5,  1.0, 0.0,  0.5,  0.5,  0.5,  1.0, 1.0, -0.5,  0.5,  0.5,  0.0, 1.0, -0.5, -0.5, -0.5,  1.0, 0.0, -0.5,  0.5, -0.5,  1.0, 1.0,  0.5,  0.5, -0.5,  0.0, 1.0,  0.5, -0.5, -0.5,  0.0, 0.0, -0.5,  0.5,  0.5,  0.0, 1.0, -0.5,  0.5, -0.5,  0.0, 0.0,  0.5,  0.5, -0.5,  1.0, 0.0,  0.5,  0.5,  0.5,  1.0, 1.0, -0.5, -0.5,  0.5,  1.0, 1.0,  0.5, -0.5,  0.5,  0.0, 1.0,  0.5, -0.5, -0.5,  0.0, 0.0, -0.5, -0.5, -0.5,  1.0, 0.0,  0.5, -0.5,  0.5,  0.0, 0.0,  0.5, -0.5, -0.5,  1.0, 0.0,  0.5,  0.5, -0.5,  1.0, 1.0,  0.5,  0.5,  0.5,  0.0, 1.0, -0.5, -0.5,  0.5,  1.0, 0.0, -0.5,  0.5,  0.5,  1.0, 1.0, -0.5,  0.5, -0.5,  0.0, 1.0, -0.5, -0.5, -0.5,  0.0, 0.0 ]);
    const indices = new Uint8Array([ 0,  1,  2,    0,  2,  3,  4,  5,  6,    4,  6,  7,  8,  9, 10,    8, 10, 11, 12, 13, 14,   12, 14, 15, 16, 17, 18,   16, 18, 19, 20, 21, 22,   20, 22, 23 ]);
    const num_indices = indices.length;
    const vertexTexCoordBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    if (!vertexTexCoordBuffer || !indexBuffer) { console.log("Buffer creation failed"); return -1; }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
    const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) { console.log("Failed to get a_Position"); return -1; }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
    const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) { console.log("Failed to get a_TexCoord"); return -1; }
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return num_indices;
}

function initTextures() { /* ... same (loads g_texture0 with square.png) ... */ 
    g_texture0 = gl.createTexture(); if (!g_texture0) { console.log("Failed to create texture object"); return false;}
    const image = new Image(); if (!image) { console.log("Failed to create image object"); return false; }
    image.onload = function() { loadTexture(g_texture0, image, u_Sampler, 0); };
    image.onerror = function() { console.log("Failed to load image 'square.png'"); }
    image.src = 'square.png'; return true;
}

function loadTexture(texture, image, sampler, texUnit) { /* ... same ... */ 
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    if (texUnit === 0) gl.activeTexture(gl.TEXTURE0);
    else if (texUnit === 1) gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(sampler, texUnit);
}

function animate() { /* ... same (animates g_currentAngle for the spinning cube) ... */ 
    const now = Date.now();
    const elapsed = now - g_lastTime;
    g_lastTime = now;
    g_currentAngle = (g_currentAngle + (ANGLE_STEP * elapsed) / 1000.0) % 360;
}

function drawScene() { // Renamed from draw() to drawScene() for clarity
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- Draw Skybox ---
    // The skybox is a large cube centered at the world origin, or around the camera
    // For simplicity, let's make it very large and centered at world origin.
    // We want to render the *inside* of the skybox.
    // One way: disable culling or cull front faces. For now, let's just draw it.
    // If the camera is inside, and it's large enough, we'll see its inner faces.
    g_skyModelMatrix.setIdentity(); // No rotation needed
    g_skyModelMatrix.translate(0, 0, 0); // Centered at origin
    g_skyModelMatrix.scale(200, 200, 200); // Very large

    g_mvpMatrix.set(g_camera.projectionMatrix);
    g_mvpMatrix.multiply(g_camera.viewMatrix);
    g_mvpMatrix.multiply(g_skyModelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrixLoc, false, g_mvpMatrix.elements);

    gl.uniform1i(u_UseTextures, 0); // 0 for false (don't use texture)
    gl.uniform4f(u_BaseColor, 0.529, 0.808, 0.922, 1.0); // Light Sky Blue color (R,G,B,A)
    gl.drawElements(gl.TRIANGLES, n_indices_cube, gl.UNSIGNED_BYTE, 0);

    // --- Draw Ground ---
    // A large, flat cube. Can be textured or colored.
    g_groundModelMatrix.setIdentity();
    g_groundModelMatrix.translate(0, -0.75, 0); // Position it below origin (y=-0.5 is its center, scaled y=0.5 makes top at y=-0.5)
    g_groundModelMatrix.scale(50, 0.5, 50);   // Large in X/Z, thin in Y

    g_mvpMatrix.set(g_camera.projectionMatrix);
    g_mvpMatrix.multiply(g_camera.viewMatrix);
    g_mvpMatrix.multiply(g_groundModelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrixLoc, false, g_mvpMatrix.elements);

    // Use the same texture as the spinning cube for now for the ground
    gl.uniform1i(u_UseTextures, 1); // Use texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, g_texture0);
    gl.uniform1i(u_Sampler, 0);
    gl.drawElements(gl.TRIANGLES, n_indices_cube, gl.UNSIGNED_BYTE, 0);

    // --- Draw the original spinning cube ---
    g_worldModelMatrix.setRotate(g_currentAngle, 0, 1, 0); 
    g_worldModelMatrix.translate(0, 0, 0); // Centered at origin, on top of ground plane's center

    g_mvpMatrix.set(g_camera.projectionMatrix);
    g_mvpMatrix.multiply(g_camera.viewMatrix);
    g_mvpMatrix.multiply(g_worldModelMatrix); // Use the spinning cube's model matrix
    gl.uniformMatrix4fv(u_MvpMatrixLoc, false, g_mvpMatrix.elements);
    
    gl.uniform1i(u_UseTextures, 1); // Use texture
    // Texture unit 0 should still be active and g_texture0 bound from drawing ground
    // but good practice to ensure:
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, g_texture0);
    gl.uniform1i(u_Sampler, 0);
    gl.drawElements(gl.TRIANGLES, n_indices_cube, gl.UNSIGNED_BYTE, 0);
}

function tick() {
    requestAnimationFrame(tick);
    animate(); 
    drawScene(); // Call drawScene now   
}

// --- EVENT HANDLING --- (remains the same)
function initEventHandlers() { /* ... same ... */ 
    document.addEventListener('keydown', handleKeyDown);
}
function handleKeyDown(ev) { /* ... same ... */ 
    let keyProcessed = true;
    switch (ev.code) {
        case 'KeyW': g_camera.moveForward(); break;
        case 'KeyS': g_camera.moveBackward(); break;
        case 'KeyA': g_camera.moveLeft(); break;
        case 'KeyD': g_camera.moveRight(); break;
        case 'KeyQ': g_camera.panLeft(); break;
        case 'KeyE': g_camera.panRight(); break;
        default: keyProcessed = false; break;
    }
    if (keyProcessed) {
        ev.preventDefault(); 
    }
}