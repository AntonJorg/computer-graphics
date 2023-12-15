var gl;
var groundProgram;
var teapotProgram;
var canvas;

var groundVertices = flatten([
    vec3(-2.0, -1.0, -1.0),
    vec3(2.0, -1.0, -1.0),
    vec3(2.0, -1.0, -5.0),
    vec3(-2.0, -1.0, -5.0)
]);

const groundTextureCoords = flatten([
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0)
]);

const groundIndices = new Uint32Array([0, 1, 2, 3, 0, 2]);

var dummyTextureCoords;

const P = perspective(90, 1, 1, 50);
const V = lookAt(vec3(0.0, 0.5, 0.5), vec3(0.0, 0.0, -1.5), vec3(0.0, 1.0, 0.0));
const Mp = mat4();
Mp[0][0] = 1.0;
Mp[1][1] = 1.0;
Mp[2][2] = 1.0;
Mp[3][3] = 0.0;
Mp[3][1] = 1.0 / (-1 - 2 - 0.0001); // -(y_light - y_ground) = (y_ground - y_light)

const teapotDefaultM = translate(0.0, -1.0, -3.0);

const I = mat4();

var orbiting = true;
var bouncing = true;
var orbit_theta = 0;
var bounce_theta = 0;
var prevTimeStamp = 0;


function render(timeStamp) {
    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);

    let diff = (timeStamp - prevTimeStamp) / 1000;
    if (orbiting & (diff != undefined)) {
        orbit_theta += diff / 2;
    }

    if (bouncing & (diff != undefined)) {
        bounce_theta += diff * 2;
    }

    let lightPosition = vec4(2*Math.cos(orbit_theta), 2.0, -2.0 + 2*Math.sin(orbit_theta), 1.0);

    // draw ground
    gl.useProgram(groundProgram);
    // update buffers
    initAttributeVariable(groundProgram.vertexBuffer);
    initAttributeVariable(groundProgram.vertexTextureCoordBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundProgram.indexBuffer);
    
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);

    let teapotM = mult(teapotDefaultM, translate(0.0, 1.5 * Math.abs(Math.sin(bounce_theta)), 0.0))

    // draw objects
    gl.useProgram(teapotProgram);
    //gl.depthFunc(gl.LESS);
    initAttributeVariable(teapotProgram.vertexBuffer);
    initAttributeVariable(teapotProgram.colorBuffer);
    //initAttributeVariable(teapotProgram.normalBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotProgram.indexBuffer);

    gl.uniformMatrix4fv(teapotProgram.M, false, flatten(teapotM));

    gl.uniform4fv(teapotProgram.lightPosition, lightPosition);

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.nElements, gl.UNSIGNED_SHORT, 0);

    prevTimeStamp = timeStamp;
}

function animate(timeStamp) {
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
        // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, teapotProgram, g_objDoc);
    }
    if (g_drawingInfo) {
        render(timeStamp);
    };

    requestAnimationFrame(animate);
}

function initAttributeVariable(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(buffer.loc, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(buffer.loc);
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

    dummyTextureCoords = new Float32Array(Array(drawingInfo.nElements * 2).fill(0.0))

    return drawingInfo;
}


function createBuffer(program, attributeName, num, type) {
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    buffer.loc = gl.getAttribLocation(program, attributeName);
    buffer.attributeName = attributeName;
    buffer.num = num;
    buffer.type = type;
    gl.vertexAttribPointer(buffer.loc, num, type, false, 0, 0);
    gl.enableVertexAttribArray(buffer.loc);

    return buffer;
}


function initGroundProgram() {
    groundProgram = initShaders(gl, "ground-vertex-shader", "ground-fragment-shader");
    gl.useProgram(groundProgram);

    // buffers
    groundProgram.vertexBuffer = createBuffer(groundProgram, "vertexPosition", 3, gl.FLOAT);
    gl.bufferData(gl.ARRAY_BUFFER, groundVertices, gl.STATIC_DRAW);
    groundProgram.vertexTextureCoordBuffer = createBuffer(groundProgram, "vertexTextureCoord", 2, gl.FLOAT);
    gl.bufferData(gl.ARRAY_BUFFER, groundTextureCoords, gl.STATIC_DRAW);

    groundProgram.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundProgram.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, groundIndices, gl.STATIC_DRAW);

    // uniforms
    groundProgram.P = gl.getUniformLocation(groundProgram, "P");
    gl.uniformMatrix4fv(groundProgram.P, false, flatten(P));

    groundProgram.V = gl.getUniformLocation(groundProgram, "V");
    gl.uniformMatrix4fv(groundProgram.V, false, flatten(V));

    groundProgram.M = gl.getUniformLocation(groundProgram, "M");
    gl.uniformMatrix4fv(groundProgram.M, false, flatten(I));


    //groundProgram.visibility = gl.getUniformLocation(groundProgram, "visibility");

    groundProgram.textureMap = gl.getUniformLocation(groundProgram, "textureMap");

    // textures

    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () {

        gl.useProgram(groundProgram);
        var groundTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, groundTexture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
        gl.generateMipmap(gl.TEXTURE_2D);
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

        gl.uniform1i(groundProgram.textureMap, 0);
    
    };
    image.src = '../xamp23.png';
}


function initTeapotProgram() {
    teapotProgram = initShaders(gl, "teapot-vertex-shader", "teapot-fragment-shader");
    gl.useProgram(teapotProgram);

    // attributes
    teapotProgram.vertexBuffer = createBuffer(teapotProgram, "vertexPosition", 3, gl.FLOAT);
    teapotProgram.colorBuffer = createBuffer(teapotProgram, "vertexColor", 4, gl.FLOAT);
    teapotProgram.normalBuffer = createBuffer(teapotProgram, "vertexNormal", 3, gl.FLOAT);
    
    teapotProgram.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotProgram.indexBuffer);

    // uniforms
    teapotProgram.P = gl.getUniformLocation(teapotProgram, "P");
    gl.uniformMatrix4fv(teapotProgram.P, false, flatten(P));

    teapotProgram.V = gl.getUniformLocation(teapotProgram, "V");
    gl.uniformMatrix4fv(teapotProgram.V, false, flatten(V));

    teapotProgram.M = gl.getUniformLocation(teapotProgram, "M");
    gl.uniformMatrix4fv(teapotProgram.M, false, flatten(I));

    teapotProgram.emissionL = gl.getUniformLocation(teapotProgram, "emissionL");
    gl.uniform1f(teapotProgram.emissionL, 1.0);

    teapotProgram.ambientK = gl.getUniformLocation(teapotProgram, "ambientK");
    gl.uniform1f(teapotProgram.ambientK, 0.5);
    
    teapotProgram.diffuseK = gl.getUniformLocation(teapotProgram, "diffuseK");
    gl.uniform1f(teapotProgram.diffuseK, 0.5);
    
    teapotProgram.specularK = gl.getUniformLocation(teapotProgram, "specularK");
    gl.uniform1f(teapotProgram.specularK, 0.5);
    
    teapotProgram.shininess = gl.getUniformLocation(teapotProgram, "shininess");
    gl.uniform1f(teapotProgram.shininess, 100.0);

    teapotProgram.lightPosition = gl.getUniformLocation(teapotProgram, "lightPosition");

    // read object file
    readOBJFile("../teapot.obj", 0.25, false);  
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

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);

    // init both groundPrograms
    initGroundProgram();    
    initTeapotProgram();

    var bouncingValueSpan = document.getElementById("bouncingValue");
    document.getElementById("toggleBounce").addEventListener("click", (event) => {
        bouncing = !bouncing;
        bouncingValueSpan.textContent = bouncing.toString();
    })

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

    addSliderCallback("ambientK", teapotProgram.ambientK);
    addSliderCallback("diffuseK", teapotProgram.diffuseK);
    addSliderCallback("specularK", teapotProgram.specularK);
    addSliderCallback("shininess", teapotProgram.shininess);
    addSliderCallback("lightEmission", teapotProgram.lightEmission);

    // start animation loop
    animate();
}