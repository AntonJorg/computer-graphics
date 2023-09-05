var theta = 0.0;
var lastTimeStamp = 0;

var gl;
var u_Offset;

var n_points = 64;

function drawScene(timeStamp) {
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");

    theta += 0.005 * (timeStamp - lastTimeStamp);
    lastTimeStamp = timeStamp;

    // rotation matrix
    var offset = Math.sin(theta) * 0.5;
    gl.uniform1f(u_Offset, offset);

    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // draw content to screen
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n_points + 2);

    // request next frame
    window.requestAnimationFrame(drawScene);
}


function circle(center, radius, n_points) {
    var points = [center];

    for (var i = 0; i < n_points + 1; i++) {
        var theta = 2 * Math.PI * i / n_points;
        points.push(
            vec2(
                Math.cos(theta) * radius,
                Math.sin(theta) * radius
            )
        )
    }

    return points;
}


window.onload = function init() {
    // setup
    var canvas = document.getElementById("canvas");
    var gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) {
        alert("WebGL isn't available!");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // vertex buffer
    var vertices = circle(vec2(0.0, 0.0), 0.5, n_points);
    console.log(vertices)
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // offset buffer
    var oBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, oBuffer);
    u_Offset = gl.getUniformLocation(program, "u_Offset");

    window.requestAnimationFrame(drawScene);
}
