var gl;
var program;
var canvas;

var vBuffer;
var cBuffer;

var index = 0;
var numPoints = 0;
var maxVerts = 3 * 5_000; // whole number of triangles
var vertices = [];

function render() {
    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw content to screen
    if (numPoints > 0) {
        gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    }
}

function animate(timeStamp) {
    render();
    requestAnimationFrame(animate);
}

function addPoint(x, y, size, color) {
    var offset = size / 2;
    var points = [
        vec2(x - offset, y - offset),
        vec2(x + offset, y - offset),
        vec2(x - offset, y + offset),
        vec2(x + offset, y + offset),
        vec2(x + offset, y - offset),
        vec2(x - offset, y + offset),
    ]

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(points));

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(Array(6).fill(color)));

    updateIndex(6);
}

function updateIndex(n) {
    index += n;
    numPoints = Math.max(numPoints, index);
    index %= maxVerts;
}

window.onload = function init() {
    // setup
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) {
        alert("WebGL isn't available!");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // vertex buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec2'], gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // color buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * sizeof['vec3'], gl.STATIC_DRAW);
    var cPosition = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(cPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cPosition);

    // callbacks
    canvas.addEventListener("click", function (ev) {
        console.log(ev)
        var bbox = ev.target.getBoundingClientRect();
        addPoint(
            2*(ev.clientX - bbox.left) / canvas.width - 1,
            2*(canvas.height - ev.clientY + bbox.top - 1) / canvas.height - 1,
            0.02,
            vec3(0.0, 0.0, 0.0)
        );
    })

    // start animation loop
    animate();
}