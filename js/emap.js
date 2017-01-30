var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

var current = "london";

//-------------------------------------

/**
* Variables for teapot
*/

//string holding obj file
var data;

// Create a place to store teapot geometry
var teapotVertexPositionBuffer;

//Create a place to store normals for shading
var teapotVertexNormalBuffer;

//Stores teapot triangles
var teapotIndexTriBuffer;

var teapotTexture;

//stores number of images loaded into cubemap
var imageCount = 0;

//angle of teapot rotation
var rotTeapot = 0;

//stores opposite of skybox transform
var inverseViewTransform = mat3.create();

//-----------------------
/**
* Variables for skybox
*/

//pass to shader
var aCoords;
//store skybox geometry
var cube;
//texture skybox geometry
var cubeTexture;

//dictionary to store key entries
var keyPress = {};

//rotation angle for skybox
var rotSkyBox = degToRad(0.5);

var aVertexTextureCoords;

//----------------------------------------

// View parameters
var eyePt = vec3.fromValues(0.0,1.5,16.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

//---------------------------------------------------------------
/** 
* Populate buffers with data for teapot
*/

function setupTeapotBuffers(){
    
    //var loaded = false;
    var teapot = [];
    var teapotNormals = [];
    var teapotFaces = [];
    
    var numT = getTeapotGeometry(teapot, teapotNormals, teapotFaces, data);
    
    console.log("teapot values are: ")
    console.log(teapot[0]+" "+teapot[1]+" "+teapot[2]);
    
    teapotVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot), gl.STATIC_DRAW);
    teapotVertexPositionBuffer.itemSize = 3;
    teapotVertexPositionBuffer.numItems = teapot.length/3;
    
    console.log(teapot.length/9);
    
    //normals
    teapotVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotNormals), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = teapotNormals.length/3;
    
    console.log("vertices:"+teapot.length+" normals:"+teapotNormals.length);
    
    //faces
    teapotIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotFaces),
                  gl.STATIC_DRAW);
    teapotIndexTriBuffer.itemSize = 1;
    teapotIndexTriBuffer.numItems = teapotFaces.length;
    
}

//Draw teapot from teapot buffer
function drawTeapot() {
    
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, teapotVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //gl.enableVertexAttribArray(0);

    // Bind normal buffer
     gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
     gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           teapotVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
    
    //draw

   //  gl.drawArrays(gl.TRIANGLES, 0, teapotVertexPositionBuffer.numItems);
    
     //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, teapotIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0); 
    
}


//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//-----------------------------------
/**
* Sends invers view transform to shader
**/

function uploadInverseMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.inversViewTransformUniform, false, inverseViewTransform);
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function skyuploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(skyshaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

function skyuploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(skyshaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  nMatrix = mvMatrix
  mat4.transpose(nMatrix,nMatrix);
  mat4.invert(nMatrix,nMatrix);
    gl.useProgram(shaderProgram);
  gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
    gl.useProgram(skyshaderProgram)
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    //uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
   // uploadInverseMatrixToShader();
}

function setSkyMatrixUniforms() {
    
    skyuploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    //skyuploadInvereseMatrixToShader();
    skyuploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

function setupShaders() {
    
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}

function setupSkyShaders() {
    
  skyvertexShader = loadShaderFromDOM("skyshader-vs");
  skyfragmentShader = loadShaderFromDOM("skyshader-fs");
  
  skyshaderProgram = gl.createProgram();
  gl.attachShader(skyshaderProgram, skyvertexShader);
  gl.attachShader(skyshaderProgram, skyfragmentShader);
  gl.linkProgram(skyshaderProgram);

  if (!gl.getProgramParameter(skyshaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(skyshaderProgram);
    
    //SET UP SKY BOX COORDS
    aCoords = gl.getAttribLocation(skyshaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(aCoords);
    

  skyshaderProgram.vertexPositionAttribute = gl.getAttribLocation(skyshaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(skyshaderProgram.vertexPositionAttribute);

  /*shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);*/

  skyshaderProgram.mvMatrixUniform = gl.getUniformLocation(skyshaderProgram, "uMVMatrix");
  skyshaderProgram.pMatrixUniform = gl.getUniformLocation(skyshaderProgram, "uPMatrix");
  skyshaderProgram.nMatrixUniform = gl.getUniformLocation(skyshaderProgram, "uNMatrix");
    
}

function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//SET UP BUFFERS
function setupBuffers()
{
    
    setupTeapotBuffers();
    
    //aCoords = gl.getAttribLocation(shaderProgram,"aVertexPosition");
    //gl.enableVertexAttribArray(aCoords);
    //gl.enable(gl.DEPTH_TEST);
    //cube = createModel(cube(200));
    
	//quad_buffer = gl.createBuffer();
	//gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);
	//var vertices = [ 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0 ];
	//gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
}

function setupCubeBuffer()
{
    cubeVertexTexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTexBuffer);
}

/*CUBE MAP AND DRAW SETUP*/

function createModel(modelData){
    
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    
    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    
    model.render = function() { 
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(skyshaderProgram.uMVMatrix, false, mvMatrix );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        //console.log(this.count);
    }
    return model;
    
}

function setupSkyBox(urls) {
    
    cube = createModel(cube(420));
    
    var ct = 0;
    var img = new Array(6);
   /* var urls = [
       "res/pos-x.png", "res/neg-x.png", 
       "res/pos-y.png", "res/neg-y.png", 
       "res/pos-z.png", "res/neg-z.png"
    ];*/
    
    var sources = [];
    
    imageSelect(sources);
    
    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function() {
            ct++;
            if (ct == 6) {
                cubeTexture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
                
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

                var targets = [
                   gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z 
                ];
                for (var j = 0; j < 6; j++) {
                    gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }
        }
        img[i].src = sources[i];
    }
}

//----------------------------------------
/**
* Set up Cube Map
**/

function setupCubeMap() {
    
    var source = [];
    
    imageSelect(source);
    
    teapotTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, teapotTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
           gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                
    
    //load up each cube map face
   /* loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
      teapotTexture, "res/London/pos-x.png");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,    
     teapotTexture, "res/London/neg-x.png");    
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
    teapotTexture, "res/London/pos-y.png");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
   teapotTexture, "res/London/neg-y.png");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
   teapotTexture, "res/London/pos-z.png");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
   teapotTexture, "res/London/neg-z.png"); */
    
        loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
      teapotTexture, source[0]);  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,    
     teapotTexture, source[1]);    
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
    teapotTexture, source[2]);  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
   teapotTexture, source[3]);  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
   teapotTexture, source[4]);  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
   teapotTexture, source[5]); 
    
    
    
    
}

function loadCubeMapFace(gl, target, texture, url){
    
    var image = new Image();
    image.onload = function()
    {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        imageCount++;
        if(imageCount==6)
        {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            imageCount = 0;
        }
    }
    
    image.src = url;
    
}

//function to  chose which images are loaded
function imageSelect(urls){
    console.log("choosing");
    console.log(document.getElementById("london").checked);
    
    if(document.getElementById("london").checked)
    {
        urls.push("res/London/pos-x.png");
        urls.push("res/London/neg-x.png");
        urls.push("res/London/pos-y.png");
        urls.push("res/London/neg-y.png");
        urls.push("res/London/pos-z.png");
        urls.push("res/London/neg-z.png");
    }
    
    if(document.getElementById("volcano").checked)
    {
        urls.push("res/Volcano/pos-x.png");  
        urls.push("res/Volcano/neg-x.png");   
        urls.push("res/Volcano/pos-y.png");   
        urls.push("res/Volcano/neg-y.png");   
        urls.push("res/Volcano/pos-z.png");   
        urls.push("res/Volcano/neg-z.png");
    }
    
    if(document.getElementById("arctic").checked)
    {
        urls.push("res/ice/pos-x.png");
        urls.push("res/ice/neg-x.png");
        urls.push("res/ice/pos-y.png");
        urls.push("res/ice/neg-y.png");
        urls.push("res/ice/pos-z.png");
        urls.push("res/ice/neg-z.png");
    }
    
}


function draw() { 
    
    /**Decide which texture to use for environ mapping ***/
    
   /* if(document.getElementById("london").checked && current != "london")
    {
        current = "london";
        location.reload();        
    }
    
    if(document.getElementById("volcano").checked && current!= "volcano")
    {
        current = "volcano";
        location.reload();
    }
    
    if(document.getElementById("arctic").checked && current != "arctic")
    {
        current = "arctic";
        location.reload();
    }*/
    
    
  var transformVec = vec3.create();

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   gl.useProgram(skyshaderProgram);
    
  // We'll use perspective 
 mat4.perspective(pMatrix,degToRad(45), 1, 0.1, 450.0);

    
  // We want to look down -z, so create a lookat point in that direction    
  vec3.add(viewPt, eyePt, viewDir);
  // Then generate the lookat matrix and initialize the MV matrix to that view
  mat4.lookAt(mvMatrix,eyePt,viewPt,up);    

    
  //rotato skybox - sned normals only here through setSkyMatrix (nMatrix);

  mvPushMatrix();
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotSkyBox)); 
  setSkyMatrixUniforms();
 
  if(cubeTexture)
    cube.render();
    

    mvPopMatrix();
    
    //DRAWING TEAPOT
    
    gl.useProgram(shaderProgram);
    
    // We'll use perspective 
 mat4.perspective(pMatrix,degToRad(45), 1, 0.1, 450.0);
    
  // We want to look down -z, so create a lookat point in that direction    
  vec3.add(viewPt, eyePt, viewDir);
  // Then generate the lookat matrix and initialize the MV matrix to that view
  mat4.lookAt(mvMatrix,eyePt,viewPt,up); 
    
    
  //SET TEXTURE FOR THE CUBE MAP
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, teapotTexture);
    gl.uniform1i(shaderProgram.uCubeSampler, 0);
    
    gl.enableVertexAttribArray(teapotVertexPositionBuffer);
    gl.enableVertexAttribArray(teapotVertexNormalBuffer);

  //rotato teapot
    
 // mvPopMatrix();
    
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotSkyBox));
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotTeapot));
  //mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotTeapot));
  mat4.rotateZ(mvMatrix, mvMatrix, degToRad(10));
  setMatrixUniforms();    
    
  //create point light source  
  uploadLightsToShader([0,20,0],[0.9,0.90,0.9],[0.0,0.0,0.0],[1.0,1.0,1.0]);
     
  drawTeapot();
   // mvPopMatrix();
}

//animation code

function animate() {
    
    //update vars/matrices based off key presses
    handleKeys();

}

//remove released keys from keypress array
function handleKeyUp(event)
{
    keyPress[event.keyCode] = false;
}

//add pressed keys to keypress array
function handleKeyDown(event)
{
    keyPress[event.keyCode] = true;
}

//handle key entries
function handleKeys()
{
    //rotating viewpoint
    
    //left
    if(keyPress[37])
    {
            rotSkyBox = (rotSkyBox + 0.25) % 360; 
    }
    
    //right
    if(keyPress[39])
    {
            rotSkyBox = (rotSkyBox - 0.25) % 360;
    }

    //ROTATING TEAPOT
    
    //a
    if(keyPress[65])
    {
        rotTeapot = (rotTeapot + 0.25) % 360;
    }
    //d
    if(keyPress[68])
    {
        rotTeapot = (rotTeapot - 0.25) % 360;
    }
}


//STARTUP CODE

function load() {
    
    readTextFile("teapot_0.obj", loaded);
    
}

//Makes sure scripts dont run until the teapot.obj file has loaded

function loaded(potdata) {
    
    data = potdata;
    
}

function startup() {

  console.log("start");
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  
  setupShaders();
  setupCubeMap();
  setupBuffers();
  //setupCubeMap();
    
setupSkyShaders();
setupSkyBox();
    
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}
