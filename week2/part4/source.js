var gl;
var program;
var canvas;

var vBuffer;
var cBuffer;

var index = 0;
var numPoints = 0;
const maxVerts = 3 * 5_000; // whole number of triangles
var vertices = [];
var colors = [
    vec3(0.0, 0.0, 0.0),
    vec3(1.0, 0.0, 0.0),
    vec3(1.0, 1.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 0.0, 1.0),
    vec3(0.0, 1.0, 1.0),
    vec3(0.3921, 0.5843, 0.9294)
]

// draw mode variables
var drawMode;

const POINT_MODE = 0;
const TRIANGLE_MODE_0 = 1;
const TRIANGLE_MODE_1 = 2;
const TRIANGLE_MODE_2 = 3;
const CIRCLE_MODE_0 = 4;
const CIRCLE_MODE_1 = 5;

const CIRCLE_RESOLUTION = 64;

const drawModeLabels = [
    "Points", 
    "Triangles: Place first point",
    "Triangles: Place second point",
    "Triangles: Place last point to complete triangle", 
    "Circles: Place center",
    "Circles: Place radial point to complete circle"
];

var drawMarkerBuffer = [];
var drawColorBuffer = [];

function setDrawMode(mode) {
    drawMode = mode;
    document.getElementById("drawModeSpan").textContent = drawModeLabels[mode];
}

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

    updateBuffer(points, Array(6).fill(color));
}

function addTriangle(points, colors) {
    if ((points.length != 3) & (colors.length != 3)) {
        throw new Error("Malformed arguments to addTriangle!");
    }
    updateBuffer(points, colors);
}

function addCircle(points, colors) {
    let center = points[0];
    let radial = points[1];
    let centerColor = colors[0];
    let radialColor = colors[1];

    let radius = Math.sqrt(Math.pow(center[0] - radial[0], 2) + Math.pow(center[1] - radial[1], 2));

    let circlePoints = [];
    let circleColors = [];

    var theta = 0;
    let delta_theta = 2 * Math.PI / CIRCLE_RESOLUTION;

    for (var i = 0; i < CIRCLE_RESOLUTION + 1; i++) {
        let next_theta = theta + delta_theta;
        
        circlePoints.push(
            vec2(center[0] + Math.cos(theta) * radius, center[1] + Math.sin(theta) * radius),
            vec2(center[0] + Math.cos(next_theta) * radius, center[1] + Math.sin(next_theta) * radius),
            center
        )

        circleColors.push(radialColor, radialColor, centerColor);

        theta = next_theta;
    }

    console.log(circlePoints, circleColors);

    updateBuffer(circlePoints, circleColors);
}

function updateBuffer(points, colors) {
    let l = points.length;
    if (!((l == colors.length) & (l % 3 == 0))) {
        throw new Error("Malformed arguments to updateBuffer!");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(points));

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(colors));

    updateIndex(l);
}

function clearMarkerBuffer() {
    index -= drawMarkerBuffer.length * 6;
    numPoints -= drawMarkerBuffer.length * 6;
    
    drawMarkerBuffer = [];
    drawColorBuffer = [];
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

    // set initial draw mode
    setDrawMode(POINT_MODE);

    // callbacks
    canvas.addEventListener("click", function (ev) {
        console.log(ev)
        const bbox = ev.target.getBoundingClientRect();
        const color = colors[document.getElementById("colorSelect").selectedIndex]; // consider moving this to a select callback;
        
        const x = 2*(ev.clientX - bbox.left) / canvas.width - 1;
        const y = 2*(canvas.height - ev.clientY + bbox.top - 1) / canvas.height - 1;
        const point = vec2(x, y);

        switch (drawMode) {
            case POINT_MODE:
                addPoint(x, y, 0.05, color);
                break;
            case TRIANGLE_MODE_0:
                drawMarkerBuffer.push(point);
                drawColorBuffer.push(color);
                addPoint(x, y, 0.05, color);
                setDrawMode(TRIANGLE_MODE_1);
                break;
            case TRIANGLE_MODE_1:
                drawMarkerBuffer.push(point);
                drawColorBuffer.push(color);
                addPoint(x, y, 0.05, color);
                setDrawMode(TRIANGLE_MODE_2);
                break;
            case TRIANGLE_MODE_2:
                drawMarkerBuffer.push(point);
                drawColorBuffer.push(color);

                index -= 12;
                numPoints -= 12;
 
                addTriangle(drawMarkerBuffer, drawColorBuffer);

                drawMarkerBuffer = [];
                drawColorBuffer = [];

                setDrawMode(TRIANGLE_MODE_0);
                break;
            case CIRCLE_MODE_0:
                drawMarkerBuffer.push(point);
                drawColorBuffer.push(color);

                addPoint(x, y, 0.05, color);
                setDrawMode(CIRCLE_MODE_1);
                break;
            case CIRCLE_MODE_1:
                drawMarkerBuffer.push(point);
                drawColorBuffer.push(color);

                index -= 6;
                numPoints -= 6;
 
                addCircle(drawMarkerBuffer, drawColorBuffer);

                drawMarkerBuffer = [];
                drawColorBuffer = [];

                setDrawMode(CIRCLE_MODE_0);
                break;
        }
    });

    document.getElementById("clearButton").addEventListener("click", function (ev) {
        var color = colors[document.getElementById("clearColorSelect").selectedIndex];
        gl.clearColor(color[0], color[1], color[2], 1.0);
        index = 0;
        numPoints = 0;

        clearMarkerBuffer();

        switch (drawMode) {
            case TRIANGLE_MODE_1:
            case TRIANGLE_MODE_2:
                setDrawMode(TRIANGLE_MODE_0);
                break;
            case CIRCLE_MODE_1:
                setDrawMode(CIRCLE_MODE_0);
        };
    });

    document.getElementById("pointButton").addEventListener("click", function (ev) {
        clearMarkerBuffer();
        setDrawMode(POINT_MODE);
    });

    document.getElementById("triangleButton").addEventListener("click", function (ev) {
        clearMarkerBuffer();
        setDrawMode(TRIANGLE_MODE_0);
    });

    document.getElementById("circleButton").addEventListener("click", function (ev) {
        clearMarkerBuffer();        
        setDrawMode(CIRCLE_MODE_0);
    });

    // start animation loop
    animate();
}