// webgl objects 
var gl;
var program;
var canvas;

// webgl extension objects
var instancedArrays;

const indices = new Uint32Array([
    0, 1, 1, 2, 2, 3, 3, 0, // front
    2, 3, 3, 7, 7, 6, 6, 2, // right
    0, 3, 3, 7, 7, 4, 4, 0, // down
    1, 2, 2, 6, 6, 5, 5, 1, // up
    4, 5, 5, 6, 6, 7, 7, 4, // back
    0, 1, 1, 5, 5, 4, 4, 0 // left
]);

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

const numInstances = 3;

const P = perspective(45, 1, 0, 50);
const V = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));

// transpose?
const M = new Float32Array([
    ...flatten(translate(-0.5, -0.5, -5.0)),
    ...flatten(mult(translate(2.0, -0.5, -8.0), rotateY(30))),
    ...flatten(mult(translate(-2.2, -0.5, -8.0), mult(rotateX(45), rotateY(30))))
])

function render(timeStamp) {
    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);

    instancedArrays.drawElementsInstancedANGLE(gl.LINES, indices.length, gl.UNSIGNED_INT, 0, numInstances);
}

function getAnimationFunction(renderFunction) {
    return function (timeStamp) {
        renderFunction(timeStamp);
        requestAnimationFrame(animate);
    }
}

function setUpAttribute(data, attribute, size, divisor=0, mode=gl.STATIC_DRAW) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, mode);

    var loc = gl.getAttribLocation(program, attribute);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);
    
    instancedArrays.vertexAttribDivisorANGLE(loc, divisor);

    // attach location to buffer object
    buffer.loc = loc;

    return buffer;
}

function setUpMatrixAttribute(data, attribute, size, divisor=0, mode=gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, mode);

    const loc = gl.getAttribLocation(program, attribute);
    const bytesPerMatrix = size * size * 4; // 4 bytes per float
    for (let i = 0; i < size; ++i) {
        const rowLoc = loc + i;
        gl.enableVertexAttribArray(rowLoc);
        // note the stride and offset
        const offset = i * size * 4;  // size floats per row, 4 bytes per float
        gl.vertexAttribPointer(
            rowLoc,
            size,               // elements per row
            gl.FLOAT,
            false,
            bytesPerMatrix,     // stride to next matrix
            offset,             // offset from loc
        );
      
        instancedArrays.vertexAttribDivisorANGLE(rowLoc, divisor);
    }
    // attach location to buffer object
    buffer.loc = loc;

    return buffer;
}

function loadExtension(name) {
    var ext = gl.getExtension(name);
    if (!ext) {
        console.log('Warning: Unable to use extension:', name);
    }
    return ext;
}

window.onload = function init() {
    // setup
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) {
        alert("WebGL isn't available!");
    }

    // enable U32 index buffer support
    loadExtension('OES_element_index_uint')

    // enable instanced rendering
    instancedArrays = loadExtension('ANGLE_instanced_arrays');

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // uniforms
    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));

    var Vloc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(Vloc, false, flatten(V));

    // index buffer
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
    
    // attributes
    setUpAttribute(flatten(vertices), "position", 3);
    setUpMatrixAttribute(M, "M", 4, divisor=1);

    animate = getAnimationFunction(render);
    animate();
}

