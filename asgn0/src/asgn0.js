function main() {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return false;
  }

  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var x1 = parseFloat(document.getElementById('xCoord').value);
  var y1 = parseFloat(document.getElementById('yCoord').value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  var x2 = parseFloat(document.getElementById('xCoord2').value);
  var y2 = parseFloat(document.getElementById('yCoord2').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var x1 = parseFloat(document.getElementById('xCoord').value);
  var y1 = parseFloat(document.getElementById('yCoord').value);
  var x2 = parseFloat(document.getElementById('xCoord2').value);
  var y2 = parseFloat(document.getElementById('yCoord2').value);
  var scalar = parseFloat(document.getElementById('scalar').value);
  var op = document.getElementById('operation').value;

  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, "red");
  drawVector(v2, "blue");

  if (op === "add") {
    let v3 = new Vector3([x1, y1, 0]);
    v3.add(v2);
    drawVector(v3, "green");
  } else if (op === "sub") {
    let v3 = new Vector3([x1, y1, 0]);
    v3.sub(v2);
    drawVector(v3, "green");
  } else if (op === "mul") {
    let v3 = new Vector3([x1, y1, 0]);
    let v4 = new Vector3([x2, y2, 0]);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (op === "div") {
    let v3 = new Vector3([x1, y1, 0]);
    let v4 = new Vector3([x2, y2, 0]);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (op === "magnitude") {
    console.log("Magnitude v1: " + v1.magnitude());
    console.log("Magnitude v2: " + v2.magnitude());
  } else if (op === "normalize") {
    v1.normalize();
    v2.normalize();
    drawVector(v1, "green");
    drawVector(v2, "green");
  } else if (op === "angle") {
    let dot = Vector3.dot(v1, v2);
    let mag1 = v1.magnitude();
    let mag2 = v2.magnitude();
    let angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
    console.log("Angle between v1 and v2: " + angle.toFixed(2) + " degrees");
  } else if (op === "area") {
    let cross = Vector3.cross(v1, v2);
    let area = cross.magnitude() / 2;
    console.log("Area of triangle: " + area.toFixed(3));
  }
}

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  var originX = canvas.width / 2;
  var originY = canvas.height / 2;

  var x = v.elements[0] * 20;
  var y = v.elements[1] * 20;

  var endX = originX + x;
  var endY = originY - y;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}
