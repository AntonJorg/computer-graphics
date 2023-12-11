var gl;
var program;
var canvas;

var vBuffer;
var cBuffer;
var iBuffer;

const vertices = [
    vec3(-4.0, -1.0, -1.0),
    vec3(4.0, -1.0, -1.0),
    vec3(4.0, -1.0, -21.0),
    vec3(-4.0, -1.0, -21.0)
];

const textureCoords = [
    vec2(-1.5, 0.0),
    vec2(2.5, 0.0),
    vec2(2.5, 10.0),
    vec2(-1.5, 10.0)
];

const indices = new Uint32Array([
    0, 1, 2, 3, 0, 2
]);

const texSize = 64;

const N = length(indices);

const P = perspective(45, 1, 1, 50);
const V = lookAt(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0))


function buildTexels() {
    var numRows = 8;
    var numCols = 8;
    var myTexels = new Uint8Array(4*texSize*texSize);
    for (var i = 0; i < texSize; ++i) {
        for (var j = 0; j < texSize; ++j) {
            var patchx = Math.floor(i/(texSize/numRows));
            var patchy = Math.floor(j/(texSize/numCols));
            var c = (patchx%2 !== patchy%2 ? 255 : 0);
            myTexels[4*i*texSize+4*j] = c;
            myTexels[4*i*texSize+4*j+1] = c;
            myTexels[4*i*texSize+4*j+2] = c;
            myTexels[4*i*texSize+4*j+3] = 255;
        }
    }

    return myTexels;
}

function render() {
    // clear screen (color set during setup)
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
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

    var vertexPosition = gl.getAttribLocation(program, "vertexPosition");
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);

    var Vloc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(Vloc, false, flatten(V));

    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    var texels = buildTexels();

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA,
        gl.UNSIGNED_BYTE, texels);

    
    var textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);

    var vertexTextureCoord = gl.getAttribLocation(program, "vertexTextureCoord");
    gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexTextureCoord);

    gl.uniform1i(gl.getUniformLocation(program, "textureMap"), 0);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // start animation loop
    animate();
}