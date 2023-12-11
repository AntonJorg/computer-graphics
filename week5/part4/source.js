// webgl objects 
var gl;
var program;
var canvas;

// webgl extension objects
var instancedArrays;

var subDivLevel = 0;
var subDivLevelSpan; // HTML element

var orbiting = true;
var prevTimeStamp = 0;
var theta = 0;
const dist = 5;

var vertices = [];
var nVertices = 0;

const indices = new Uint32Array();
const numInstances = 1;

const P = perspective(45, 1, 1, 50);
const M = new Float32Array([
    ...flatten(translate(0.0, 0.0, 0.0)),
]);


var g_objDoc; // The information of OBJ file
var g_drawingInfo; // The information for drawing 3D model

function onReadComplete(gl, program, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
    drawingInfo.nVertices = drawingInfo.vertices.length;
    drawingInfo.nElements = drawingInfo.indices.length;
    
    console.log(drawingInfo.colors)

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, program.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, program.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
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

        gl.uniformMatrix4fv(program.V, false, flatten(V));
        
        
        let VRot = mat3(
            [V[0][0], V[0][1], V[0][2]],
            [V[1][0], V[1][1], V[1][2]],
            [V[2][0], V[2][1], V[2][2]]
        );
        gl.uniform3fv(program.lightPosition, mult(VRot, vec3(0.0, 0.0, -1.0)));
    }

    prevTimeStamp = timeStamp;
    
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.nElements, gl.UNSIGNED_SHORT, 0);

}

function animate(timeStamp) {
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
        // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, program, g_objDoc);
    }
    if (g_drawingInfo) {
        render(timeStamp);
    };

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

// Read a file
function readOBJFile(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, scale, reverse);
        }
    }
    request.open('GET', fileName, true); // Create a request to get file
    request.send(); // Send the request
}

    
// OBJ file has been read
function onReadOBJFile(fileString, fileName, scale, reverse) {
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse);
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
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

    console.log("test", gl.getAttribLocation(program, "color"))
    
    // uniforms
    program.P = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(program.P, false, flatten(P));

    program.V = gl.getUniformLocation(program, "V");

    program.lightPosition = gl.getUniformLocation(program, "lightPosition");

    program.emissionL = gl.getUniformLocation(program, "emissionL");
    gl.uniform1f(program.emissionL, 1.0);

    program.ambientK = gl.getUniformLocation(program, "ambientK");
    gl.uniform1f(program.ambientK, 0.5);

    program.diffuseK = gl.getUniformLocation(program, "diffuseK");
    gl.uniform1f(program.diffuseK, 0.5);

    program.specularK = gl.getUniformLocation(program, "specularK");
    gl.uniform1f(program.specularK, 0.5);

    program.shininess = gl.getUniformLocation(program, "shininess");
    gl.uniform1f(program.shininess, 100.0);


    // index buffer
    program.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.indexBuffer);

    // attributes
    program.vertexBuffer = setUpAttribute([], "position", 3);
    program.colorBuffer = setUpAttribute([], "color", 4);
    program.normalBuffer = setUpAttribute([], "normal", 3);
    
    program.M = setUpMatrixAttribute(M, "M", 4, divisor=1);


    var orbitingValueSpan = document.getElementById("orbitingValue");
    document.getElementById("toggleOrbit").addEventListener("click", (event) => {
        orbiting = !orbiting;
        orbitingValueSpan.textContent = orbiting.toString();
    })


    function addSliderCallback(name, uniformLoc) {
        var elem = document.getElementById(name + "SliderValue");
        document.getElementById(name + "Slider").addEventListener("input", (event) => {
            let newVal = event.target.value;
            gl.uniform1f(uniformLoc, newVal);
            elem.textContent = newVal;
        })
    }

    addSliderCallback("ambientK", program.ambientK);
    addSliderCallback("diffuseK", program.diffuseK);
    addSliderCallback("specularK", program.specularK);
    addSliderCallback("shininess", program.shininess);
    addSliderCallback("lightEmission", program.emissionL);
    
    // read object file
    readOBJFile("/common/assets/suzanne.obj", 1.0, false);    


    requestAnimationFrame(animate);
}

