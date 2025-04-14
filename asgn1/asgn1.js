let canvas, gl;
let a_Position, u_FragColor, u_PointSize;
let g_r = 1.0, g_g = 0.0, g_b = 0.0;
let g_size = 10.0;
let g_segmentCount = 30;
let g_selectedType = 'square';
let g_trianglePoints = [];
let g_shapesList = [];

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initEventHandlers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
}

function connectVariablesToGLSL() {
  const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_PointSize;
    void main() {
      gl_Position = a_Position;
      gl_PointSize = u_PointSize;
    }`;
  const FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
      gl_FragColor = u_FragColor;
    }`;
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
}

function initEventHandlers() {
  let isDrawing = false;
  canvas.onmousedown = (ev) => { isDrawing = true; handleClick(ev); };
  canvas.onmousemove = (ev) => { if (isDrawing && g_selectedType === 'square') handleClick(ev); };
  canvas.onmouseup = () => { isDrawing = false; };

  document.getElementById('redSlide').oninput = (e) => g_r = e.target.value / 100;
  document.getElementById('greenSlide').oninput = (e) => g_g = e.target.value / 100;
  document.getElementById('blueSlide').oninput = (e) => g_b = e.target.value / 100;
  document.getElementById('sizeSlide').oninput = (e) => g_size = e.target.value;
  document.getElementById('segmentSlide').oninput = (e) => g_segmentCount = e.target.value;

  document.getElementById('clearButton').onclick = () => { g_shapesList = []; g_trianglePoints = []; renderAllShapes(); };
  document.getElementById('squareButton').onclick = () => g_selectedType = 'square';
  document.getElementById('triangleButton').onclick = () => g_selectedType = 'triangle';
  document.getElementById('circleButton').onclick = () => g_selectedType = 'circle';
  document.getElementById('drawPictureButton').onclick = drawMyPicture;
  document.getElementById('undoButton').onclick = function () {
    g_shapesList.pop(); 
    renderAllShapes();
  };
  
  document.getElementById('saveButton').onclick = function () {
    const link = document.createElement('a');
    link.download = 'webgl_drawing.png';
    link.href = canvas.toDataURL(); 
  };
  
}

function handleClick(ev) {
  const [x, y] = convertCoordinates(ev);
  if (g_selectedType === 'square') {
    g_shapesList.push(new Square([x, y], [g_r, g_g, g_b, 1.0], g_size));
  } else if (g_selectedType === 'triangle') {
    g_trianglePoints.push([x, y]);
    if (g_trianglePoints.length === 3) {
      g_shapesList.push(new Triangle(...g_trianglePoints, [g_r, g_g, g_b, 1.0]));
      g_trianglePoints = [];
    }
  } else if (g_selectedType === 'circle') {
    g_shapesList.push(new Circle([x, y], [g_r, g_g, g_b, 1.0], g_size, g_segmentCount));
  }
  renderAllShapes();
}

function convertCoordinates(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) - canvas.width / 2) / (canvas.width / 2);
  const y = (canvas.height / 2 - (ev.clientY - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let shape of g_shapesList) shape.render();
}

class Square {
  constructor(position, color, size) {
    this.position = position;
    this.color = color;
    this.size = size;
  }
  render() {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.position), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_PointSize, this.size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor(p1, p2, p3, color) {
    this.points = [...p1, ...p2, ...p3];
    this.color = color;
  }
  render() {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.uniform4f(u_FragColor, ...this.color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

class Circle {
  constructor(center, color, size, segments = 30) {
    this.center = center;
    this.color = color;
    this.size = size;
    this.segments = segments;
  }
  render() {
    const r = this.size / 200;
    const verts = [this.center[0], this.center[1]];
    for (let i = 0; i <= this.segments; i++) {
      const angle = i * 2 * Math.PI / this.segments;
      verts.push(this.center[0] + Math.cos(angle) * r, this.center[1] + Math.sin(angle) * r);
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.uniform4f(u_FragColor, ...this.color);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.segments + 2);
  }
}

function drawMyPicture() {
    const bodyColor = [1.0, 0.6, 0.2, 1.0];
    const darkColor = [0.85, 0.45, 0.1, 1.0];
    const faceColor = [1.0, 0.7, 0.3, 1.0];
    const black = [0.0, 0.0, 0.0, 1.0];
  
    const triangles = [
      { p1: [-0.3, 0.0], p2: [0.0, 0.25], p3: [0.3, 0.0], color: faceColor },
      { p1: [-0.3, 0.0], p2: [0.0, -0.05], p3: [0.3, 0.0], color: faceColor },
  
      { p1: [-0.3, 0.0], p2: [-0.45, 0.3], p3: [-0.15, 0.2], color: darkColor },
      { p1: [0.3, 0.0], p2: [0.45, 0.3], p3: [0.15, 0.2], color: darkColor },
  
      { p1: [-0.3, 0.0], p2: [-0.37, 0.21], p3: [-0.23, 0.17], color: bodyColor },
      { p1: [0.3, 0.0], p2: [0.37, 0.21], p3: [0.23, 0.17], color: bodyColor },
  
      { p1: [-0.2, -0.6], p2: [-0.2, 0.0], p3: [0.2, -0.6], color: bodyColor },
      { p1: [-0.2, 0.0], p2: [0.2, 0.0], p3: [0.2, -0.6], color: bodyColor },
  
      { p1: [0.0, -0.6], p2: [0.0, -0.2], p3: [0.15, -0.6], color: darkColor },
  
      { p1: [-0.4, -0.5], p2: [-0.5, -0.3], p3: [-0.38, -0.1], color: bodyColor },
      { p1: [-0.4, -0.5], p2: [-0.38, -0.1], p3: [-0.25, -0.5], color: bodyColor },
      { p1: [-0.38, -0.1], p2: [-0.32, 0.0], p3: [-0.2, -0.1], color: bodyColor },
  
      { p1: [-0.2, -0.6], p2: [0.0, -0.75], p3: [0.2, -0.6], color: darkColor },
  
      { p1: [-0.025, 0.05], p2: [0.025, 0.05], p3: [0.0, 0.02], color: black },
  
      { p1: [0.0, 0.02], p2: [0.01, -0.015], p3: [-0.01, -0.015], color: black },
      { p1: [0.01, -0.015], p2: [0.025, -0.04], p3: [0.0, -0.02], color: black },
      { p1: [-0.01, -0.015], p2: [-0.025, -0.04], p3: [0.0, -0.02], color: black },
      { p1: [-0.15, -0.05], p2: [-0.1, -0.2], p3: [-0.05, -0.05], color: darkColor },
      { p1: [0.05, -0.05], p2: [0.1, -0.2], p3: [0.15, -0.05], color: darkColor },
      { p1: [0.15, -0.15], p2: [0.2, -0.3], p3: [0.25, -0.15], color: darkColor },

      { p1: [-0.05, 0.20], p2: [0.05, 0.20], p3: [0.0, 0.15], color: darkColor },
    ];
  
    for (let t of triangles) {
      const tri = new Triangle(t.p1, t.p2, t.p3, t.color);
      g_shapesList.push(tri);
    }
  
    const eyeSize = 5;
    g_shapesList.push(
      new Circle([-0.1, 0.08], black, eyeSize, 20),
      new Circle([0.1, 0.08], black, eyeSize, 20)
    );
  
    renderAllShapes();
    console.log("Cats Shape Total：", g_shapesList.length);
  }
  
  
