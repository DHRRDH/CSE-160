// Global Variables
let canvas, gl, a_Position, u_ModelMatrix, u_GlobalRotation, u_FragColor;
let gAnimalGlobalRotation = 0;
let gFrontLegAngle = 0;
let gTailAngle = 0;
let gTailTipAngle = 0;
let gAnimationOn = true;
let gPokeAnimationOn = false;
let gMouseDown = false;
let gLastMouseX = 0;
let gStartRotation = 0;
let gMouseSensitivity = 0.5;
let g_lastTick = Date.now();
let g_lastFpsUpdate = Date.now();
let g_frames = 0;
let gEarWiggleAngle = 0;

function main() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('Failed to get WebGL context.');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.getElementById('globalRotationSlider').addEventListener('input', (e) => {
        gAnimalGlobalRotation = Number(e.target.value);
        gStartRotation = gAnimalGlobalRotation;  // update starting rotation
        renderScene();
    });

    document.getElementById('frontLegSlider').addEventListener('input', (e) => {
        gFrontLegAngle = Number(e.target.value);
        renderScene();
    });

    document.getElementById('animationButton').addEventListener('click', () => {
        gAnimationOn = !gAnimationOn;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.shiftKey) {
            gPokeAnimationOn = !gPokeAnimationOn;
        } else {
            gMouseDown = true;
            gLastMouseX = e.clientX;
        }
    });

    canvas.addEventListener('mouseup', () => {
        gMouseDown = false;
        gStartRotation = gAnimalGlobalRotation;  // save new rotation after drag
    });

    canvas.addEventListener('mousemove', (e) => {
        if (gMouseDown) {
            let deltaX = e.clientX - gLastMouseX;
            gAnimalGlobalRotation = gStartRotation + deltaX * gMouseSensitivity;
        }
    });

    requestAnimationFrame(tick);
}

// Vertex Shader
const VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotation;
void main() {
    gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;
}
`;

// Fragment Shader
const FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main() {
    gl_FragColor = u_FragColor;
}
`;

// Draw Cube
function drawCube(matrix, color) {
    let vertices = new Float32Array([
        // Front face
        -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
        // Back face
        -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
        // Top face
        -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
        // Bottom face
        -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
        // Right face
         0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
         0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
        // Left face
        -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
    ]);

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// Draw Pyramid
function drawPyramid(matrix, color) {
    let vertices = new Float32Array([
        // Base
        -0.5, 0.0, -0.5,   0.5, 0.0, -0.5,   0.5, 0.0,  0.5,
        -0.5, 0.0, -0.5,   0.5, 0.0,  0.5,  -0.5, 0.0,  0.5,
        // Sides
        -0.5, 0.0, -0.5,   0.0, 0.8, 0.0,    0.5, 0.0, -0.5,
         0.5, 0.0, -0.5,   0.0, 0.8, 0.0,    0.5, 0.0,  0.5,
         0.5, 0.0,  0.5,   0.0, 0.8, 0.0,   -0.5, 0.0,  0.5,
        -0.5, 0.0,  0.5,   0.0, 0.8, 0.0,   -0.5, 0.0, -0.5,
    ]);

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 18);
}

// Build Cat
function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let globalRotMat = new Matrix4().rotate(gAnimalGlobalRotation, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

    // --- Body ---
    let body = new Matrix4();
    body.scale(1, 0.5, 0.5);
    drawCube(body, [1.0, 0.6, 0.6, 1.0]);

    // --- Head ---
    let head = new Matrix4(body);
    head.translate(0.0, 0.75, 0.0);
    head.scale(0.5, 0.5, 0.5);
    drawCube(head, [1.0, 0.8, 0.8, 1.0]);

    // --- Tail Base (第一级尾巴) ---
    let tailBase = new Matrix4(body);
    tailBase.translate(-0.55, 0.25, 0.0);
    tailBase.rotate(gTailAngle, 0, 0, 1);
    tailBase.scale(0.1, 0.4, 0.1);
    drawCube(tailBase, [1.0, 0.5, 0.5, 1.0]);

    // --- Tail Tip (第二级尾巴) ---
    let tailTip = new Matrix4(tailBase);
    tailTip.translate(0.0, 1.0, 0.0);
    tailTip.rotate(gTailTipAngle, 0, 0, 1);
    tailTip.scale(0.8, 0.8, 0.8);
    drawCube(tailTip, [1.0, 0.5, 0.5, 1.0]);

    // --- Tail Tip Tip (第三级尾巴，新加的！) ---
    let tailTipTip = new Matrix4(tailTip);
    tailTipTip.translate(0.0, 1.0, 0.0);
    tailTipTip.rotate(gTailTipAngle * 1.2, 0, 0, 1);  // 摆动更灵活一点
    tailTipTip.scale(0.6, 0.6, 0.6);
    drawCube(tailTipTip, [1.0, 0.5, 0.5, 1.0]);

    // --- Front Left Leg ---
    let frontLeftLeg = new Matrix4(body);
    frontLeftLeg.translate(0.35, -0.75, 0.25);
    frontLeftLeg.rotate(gFrontLegAngle, 1, 0, 0);
    frontLeftLeg.scale(0.1, 0.5, 0.1);
    drawCube(frontLeftLeg, [1.0, 0.5, 0.5, 1.0]);

    // --- Front Right Leg ---
    let frontRightLeg = new Matrix4(body);
    frontRightLeg.translate(-0.35, -0.75, 0.25);
    frontRightLeg.rotate(gFrontLegAngle, 1, 0, 0); 
    frontRightLeg.scale(0.1, 0.5, 0.1);
    drawCube(frontRightLeg, [1.0, 0.5, 0.5, 1.0]);

    // --- Back Left Leg ---
    let backLeftLeg = new Matrix4(body);
    backLeftLeg.translate(0.35, -0.75, -0.25);
    backLeftLeg.scale(0.1, 0.5, 0.1);
    drawCube(backLeftLeg, [1.0, 0.5, 0.5, 1.0]);

    // --- Back Right Leg ---
    let backRightLeg = new Matrix4(body);
    backRightLeg.translate(-0.35, -0.75, -0.25);
    backRightLeg.scale(0.1, 0.5, 0.1);
    drawCube(backRightLeg, [1.0, 0.5, 0.5, 1.0]);

    // --- Left Ear ---
    let leftEar = new Matrix4(head);
    leftEar.translate(-0.2, 0.5, 0.0);
    leftEar.rotate(gEarWiggleAngle, 0, 0, 1);  // 左右扭动
    leftEar.scale(0.2, 0.3, 0.2);
    drawPyramid(leftEar, [1.0, 0.4, 0.4, 1.0]);

    // --- Right Ear ---
    let rightEar = new Matrix4(head);
    rightEar.translate(0.2, 0.5, 0.0);
    rightEar.rotate(-gEarWiggleAngle, 0, 0, 1);  // 反方向扭动
    rightEar.scale(0.2, 0.3, 0.2);
    drawPyramid(rightEar, [1.0, 0.4, 0.4, 1.0]);
}


// Tick Loop
function tick() {
    let now = Date.now();
    let elapsed = now - g_lastTick;
    if (elapsed < 16) {
        requestAnimationFrame(tick);
        return;
    }
    g_lastTick = now;

    if (gAnimationOn) {
        gTailAngle = (gTailAngle + 1) % 360;
    }
    if (gPokeAnimationOn) {
        gTailTipAngle = (gTailTipAngle + 2) % 360;
    }
    
    if (gPokeAnimationOn) {
        gTailTipAngle = (gTailTipAngle + 2) % 360;
        gEarWiggleAngle = (gEarWiggleAngle + 10) % 60 - 30; // 摇摆角度 -30 到 +30度
    }
    
    renderScene();

    g_frames++;
    if (now - g_lastFpsUpdate >= 1000) {
        document.getElementById('fps').innerText = `FPS: ${g_frames}`;
        g_frames = 0;
        g_lastFpsUpdate = now;
    }

    requestAnimationFrame(tick);
}
