var gl;
var program;
var canvas;

var groundVertices = new Float32Array(flatten([
    // ground
    vec3(-2.0, -1.0, -1.0),
    vec3(2.0, -1.0, -1.0),
    vec3(2.0, -1.0, -5.0),
    vec3(-2.0, -1.0, -5.0),
    vec3(-2.0, -1.0, -1.0),
    vec3(2.0, -1.0, -5.0),

]));

const groundTextureCoords = new Float32Array(flatten([
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
]));

const nGroundVertices = 6;

const vertices = new Float32Array(flatten([
    // ground parallel quad
    vec3(0.25, -0.5, -1.25),
    vec3(0.75, -0.5, -1.25),
    vec3(0.75, -0.5, -1.75),
    vec3(0.25, -0.5, -1.75),
    vec3(0.25, -0.5, -1.25),
    vec3(0.75, -0.5, -1.75),
    // upright quad
    vec3(-1.0, -1.0, -2.5),
    vec3(-1.0, 0.0, -2.5),
    vec3(-1.0, 0.0, -3.0),
    vec3(-1.0, -1.0, -3.0),
    vec3(-1.0, -1.0, -2.5),
    vec3(-1.0, 0.0, -3.0),
]));

const textureCoords = new Float32Array(flatten([
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
]));

const nVertices = 12;


const P = perspective(45, 1, 1, 50);
const V = lookAt(vec3(0.0, 1.0, 2.0), vec3(0.0, 0.0, -3.2), vec3(0.0, 1.0, 0.0));
const Ms = mat4();
const I = mat4();

var theta = 0;
var prevTimeStamp = 0;

function render(timeStamp) {
    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);

    theta += (timeStamp - prevTimeStamp) / 2000;

    let lightPos = vec3(0.0, 2.0 + 2*Math.cos(theta), -2 + 2*Math.sin(theta));

    // draw ground
    // update buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, groundVertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, groundTextureCoords, gl.STATIC_DRAW);
    // update model matrix
    gl.uniformMatrix4fv(program.M, false, flatten(I));
    // set texture
    gl.uniform1i(gl.getUniformLocation(program, "textureMap"), 0);
    // draw
    gl.drawArrays(gl.TRIANGLES, 0, nGroundVertices);

    // draw shadows
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);
    gl.uniformMatrix4fv(program.M, false, flatten(Ms));
    gl.uniform1i(gl.getUniformLocation(program, "textureMap"), 1);
    gl.drawArrays(gl.TRIANGLES, 0, nVertices);

    // draw objects
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);
    gl.uniformMatrix4fv(program.M, false, flatten(I));
    gl.uniform1i(gl.getUniformLocation(program, "textureMap"), 1);
    gl.drawArrays(gl.TRIANGLES, 0, nVertices);

    prevTimeStamp = timeStamp;
}

function animate(timeStamp) {
    render(timeStamp);
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

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // buffers
    program.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexBuffer);

    program.vertexBuffer.loc = gl.getAttribLocation(program, "vertexPosition");
    gl.vertexAttribPointer(program.vertexBuffer.loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.vertexBuffer.loc);

    program.vertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexTextureCoordBuffer);

    program.vertexTextureCoordBuffer.loc = gl.getAttribLocation(program, "vertexTextureCoord");
    gl.vertexAttribPointer(program.vertexTextureCoordBuffer.loc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.vertexTextureCoordBuffer.loc);


    // uniforms
    program.P = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(program.P, false, flatten(P));

    program.V = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(program.V, false, flatten(V));

    program.M = gl.getUniformLocation(program, "M");

    // textures
    var redTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, redTexture);

    const redPixel = new Uint8Array([255, 0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, redPixel);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);


    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () {

        var groundTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, groundTexture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
        gl.generateMipmap(gl.TEXTURE_2D);
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    
    };
    image.src = '../xamp23.png';
    


    // start animation loop
    animate();
}