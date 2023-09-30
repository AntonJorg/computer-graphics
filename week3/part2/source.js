var gl;
var program;
var canvas;

var vBuffer;
var cBuffer;
var iBuffer;

var Mloc;

const vertices = [
    vec3(0.0, 0.0, 1.0),
    vec3(0.0, 1.0, 1.0),
    vec3(1.0, 1.0, 1.0),
    vec3(1.0, 0.0, 1.0),
    vec3(0.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(1.0, 1.0, 0.0),
    vec3(1.0, 0.0, 0.0),
];


const indices = new Uint32Array([
    0, 1, 1, 2, 2, 3, 3, 0, // front
    2, 3, 3, 7, 7, 6, 6, 2, // right
    0, 3, 3, 7, 7, 4, 4, 0, // down
    1, 2, 2, 6, 6, 5, 5, 1, // up
    4, 5, 5, 6, 6, 7, 7, 4, // back
    0, 1, 1, 5, 5, 4, 4, 0 // left
]);

const N = length(indices);
const NCubes = 3;

const P = perspective(45, 1, 0, 50);
const V = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0))

const modelMatrices = [
    translate(-0.5, -0.5, -5.0),
    mult(translate(2.0, -0.5, -8.0), rotateY(30)),
    mult(translate(-2.2, -0.5, -8.0), mult(rotateX(45), rotateY(30)))
];


function render() {
    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < modelMatrices.length; i++) {
        gl.uniformMatrix4fv(Mloc, false, flatten(modelMatrices[i]));
        gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_INT, 0);
    }
}

function animate(timeStamp) {
    render();
    requestAnimationFrame(animate);
}

window.onload = function init() {
    // setup
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) {
        alert("WebGL isn't available!");
    }

    // enable U32 index buffer support
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
      console.log('Warning: Unable to use an extension');
    }

    // enable instanced rendering
    var ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    //index buffer
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);


    var mBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mBuffer);

    Mloc = gl.getAttribLocation(program, "M");
    gl.vertexAttribPointer(Mloc, 16, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(Mloc, 1);
    gl.enableVertexAttribArray(Mloc);

    var aPosition = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));

    var Vloc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(Vloc, false, flatten(V));

    // start animation loop
    animate();
}