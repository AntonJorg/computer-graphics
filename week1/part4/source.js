var theta = 0.0;
var lastTimeStamp = 0;

var gl;
var u_Rotation;

function drawScene(timeStamp) {
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");

    theta += 0.01 * (timeStamp - lastTimeStamp);
    lastTimeStamp = timeStamp;

    // rotation matrix
    var rotation = rotateZ(theta);
    gl.uniformMatrix4fv(u_Rotation, false, flatten(rotation));

    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // draw content to screen
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // request next frame
    window.requestAnimationFrame(drawScene);
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
    var vertices = [ vec2(0.0, 0.5), vec2(0.5, 0.0), vec2(-0.5, 0.0), vec2(0.0, -0.5) ];
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // rotation buffer
    var rBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rBuffer);
    u_Rotation = gl.getUniformLocation(program, "u_Rotation");

    window.requestAnimationFrame(drawScene);
}
