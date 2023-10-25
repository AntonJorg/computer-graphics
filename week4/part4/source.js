// webgl objects 
var gl;
var program;
var canvas;

// webgl extension objects
var instancedArrays;

var vertexBuffer;

var subDivLevel = 0;
var subDivLevelSpan; // HTML element

var orbiting = true;
var prevTimeStamp = 0;
var theta = 0;
const dist = 5;

// lighting model parameters
var ambientK;
var diffuseK;
var specularK;
var shininess;
var lightEmission;

const initialTetrahedron = [
    vec3(0.0, 0.0, 1.0),
    vec3(0.0, 0.942809, -0.333333),
    vec3(-0.816497, -0.471405, -0.333333),
    vec3(0.816497, -0.471405, -0.333333),
];

var vertices = sphere(initialTetrahedron, subDivLevel);
var nVertices = vertices.length;

const indices = new Uint32Array([
    ...Array(vertices.length).keys()
]);
const numInstances = 1;

const P = perspective(45, 1, 1, 50);
var Vloc;
const M = new Float32Array([
    ...flatten(translate(0.0, 0.0, 0.0)),
]);


function sphere(initialTetrahedron, nSubdivisions) {
    var [a, b, c, d] = initialTetrahedron;
    var vertices = [];

    function divideTriangle(a, b, c, n) {
        if (n > 0) {
            var ab = normalize(mix(a, b, 0.5));
            var ac = normalize(mix(a, c, 0.5));
            var bc = normalize(mix(b, c, 0.5));

            divideTriangle(a, ab, ac, n - 1);
            divideTriangle(ab, b, bc, n - 1);
            divideTriangle(bc, c, ac, n - 1);
            divideTriangle(ab, bc, ac, n - 1);
        } else {
            vertices.push(a);
            vertices.push(b);
            vertices.push(c);
        }
    }

    divideTriangle(a, b, c, nSubdivisions);
    divideTriangle(d, c, b, nSubdivisions);
    divideTriangle(a, d, b, nSubdivisions);
    divideTriangle(a, c, d, nSubdivisions);

    return vertices;
}

function updateVertexBuffer() {
    vertices = sphere(initialTetrahedron, subDivLevel);
    nVertices = vertices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
}

function render(timeStamp) {
    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (orbiting) {
        theta += (timeStamp - prevTimeStamp) / 1000;
        
        let V = lookAt(
            vec3(dist * Math.cos(theta), 0.0, dist * Math.sin(theta)), // eye
            vec3(0.0, 0.0, 0.0), // at
            vec3(0.0, 1.0, 0.0) // up
        );

        gl.uniformMatrix4fv(Vloc, false, flatten(V));
    }

    prevTimeStamp = timeStamp;
    
    gl.drawArrays(gl.TRIANGLES, 0, nVertices);

}

function animate(timeStamp) {
        render(timeStamp);
        requestAnimationFrame(animate);
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

    // enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // enable back face culling
    gl.enable(gl.CULL_FACE);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // uniforms
    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));

    Vloc = gl.getUniformLocation(program, "V");

    // attributes
    vertexBuffer = setUpAttribute(flatten(vertices), "position", 3);
    setUpMatrixAttribute(M, "M", 4, divisor=1);

    // callbacks
    subDivLevelSpan = document.getElementById("subDivLevel");
    subDivLevelSpan.textContent = subDivLevel;

    document.getElementById("increment").addEventListener("click", (event) => {
        subDivLevel = Math.min(subDivLevel + 1, 8);
        subDivLevelSpan.textContent = subDivLevel;
        updateVertexBuffer();
    })
    
    document.getElementById("decrement").addEventListener("click", (event) => {
        subDivLevel = Math.max(0, subDivLevel - 1);
        subDivLevelSpan.textContent = subDivLevel;
        updateVertexBuffer();
    })

    document.getElementById("toggleOrbit").addEventListener("click", (event) => {
        orbiting = !orbiting;
    })


    function addSliderCallback(name, toUpdate) {
        var elem = document.getElementById(name + "SliderValue");
        document.getElementById(name + "Slider").addEventListener("input", (event) => {
            let newVal = event.target.value;
            toUpdate = newVal;
            elem.textContent = newVal;
        })
    }

    addSliderCallback("ambientK", ambientK);
    addSliderCallback("diffuseK", diffuseK);
    addSliderCallback("specularK", specularK);
    addSliderCallback("shininess", shininess);
    addSliderCallback("lightEmission", lightEmission);
    

    requestAnimationFrame(animate);
}

