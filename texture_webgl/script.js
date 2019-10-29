onload = function() {
  // canvasエレメントを取得
  var c = document.getElementById("canvas");
  c.width = 500;
  c.height = 500;

  // webglコンテキストを取得
  const gl = canvas.getContext("webgl2");

  // シェーダを読み込みPromiseを返します。
  function loadShaders() {
    const loadVertexShader = fetch("vs.glsl").then(res =>
      res.text()
    );
    const loadFragmentShader = fetch("fs.glsl").then(res =>
      res.text()
    );
    return Promise.all([loadVertexShader, loadFragmentShader]);
  }

  // テクスチャを読み込みPromiseを返します。
  function loadTextureImage(srcUrl) {
    const texture = new Image();
    return new Promise((resolve, reject) => {
      texture.addEventListener("load", e => {
        resolve(texture);
      });
      texture.src = srcUrl;
    });
  }

  // シェーダのソースからシェーダプログラムを作成し、
  // Programを返します。
  function createShaderProgram(vsSource, fsSource) {
    // バーテックスシェーダをコンパイルします。
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

    const vShaderCompileStatus = gl.getShaderParameter(
      vertexShader,
      gl.COMPILE_STATUS
    );
    if (!vShaderCompileStatus) {
      const info = gl.getShaderInfoLog(vertexShader);
      console.log(info);
    }

    // フラグメントシェーダについても同様にします。
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

    const fShaderCompileStatus = gl.getShaderParameter(
      fragmentShader,
      gl.COMPILE_STATUS
    );
    if (!fShaderCompileStatus) {
      const info = gl.getShaderInfoLog(fragmentShader);
      console.log(info);
    }

    // シェーダプログラムを作成します。
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linkStatus) {
      const info = gl.getProgramInfoLog(program);
      console.log(info);
    }

    // プログラムを使用します。
    gl.useProgram(program);

    return program;
  }

  // バッファを作成し返します。
  function createBuffer(type, typedDataArray) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, typedDataArray, gl.STATIC_DRAW);
    gl.bindBuffer(type, null); // バインド解除

    return buffer;
  }

  // シェーダとテクスチャを読み込み終わったら開始します。
  Promise.all([loadShaders(), loadTextureImage("texture.png")])
  .then(assets => {
    this.console.log(assets);
    const shaderSources = assets[0];
    const textureImage = assets[1];

    const vertexShaderSource = shaderSources[0];
    const fragmentShaderSource = shaderSources[1];

    const program = createShaderProgram(
      vertexShaderSource,
      fragmentShaderSource
    );

    //
    // テクスチャの転送
    //
    const texture = gl.createTexture(); // テクスチャの作成
    gl.bindTexture(gl.TEXTURE_2D, texture); // テクスチャのバインド
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textureImage
    ); // テクスチャデータの転送
    gl.generateMipmap(gl.TEXTURE_2D); // ミップマップの作成
    gl.bindTexture(gl.TEXTURE_2D, null);


    const vertices = new Float32Array([
      -1.0, 1.0, 0.0, // 頂点座標
      0.0, 0.0, // テクスチャ座標
      -1.0,-1.0,0.0,
      0.0,1.0,
      1.0,1.0,0.0,
      1.0,0.0,
      1.0,-1.0,0.0,
      1.0,1.0
    ]);

    const indices = new Uint16Array([
      0, 
      1, 
      2, 
      1, 
      3, 
      2
    ]);

    const vertexBuffer = createBuffer(gl.ARRAY_BUFFER, vertices);
    const indexBuffer = createBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);

    const vertexAttribLocation = gl.getAttribLocation(
      program,
      "vertexPosition"
    );
    const textureAttribLocation = gl.getAttribLocation(
      program, 
      "texCoord"
    );
    
    const textureUniformLocation = gl.getUniformLocation(
      program, 
      "tex"
    );
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureUniformLocation,0);
    

    const VERTEX_SIZE = 3;
    const TEXTURE_SIZE = 2;
    const STRIDE =
      (VERTEX_SIZE + TEXTURE_SIZE) * Float32Array.BYTES_PER_ELEMENT;
    const VERTEX_OFFSET = 0;
    const TEXTURE_OFFSET = 3 * Float32Array.BYTES_PER_ELEMENT;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.enableVertexAttribArray(vertexAttribLocation);
    gl.enableVertexAttribArray(textureAttribLocation);

    gl.vertexAttribPointer(
      vertexAttribLocation,
      VERTEX_SIZE,
      gl.FLOAT,
      false,
      STRIDE,
      VERTEX_OFFSET
    );
    gl.vertexAttribPointer(
      textureAttribLocation,
      TEXTURE_SIZE,
      gl.FLOAT,
      false,
      STRIDE,
      TEXTURE_OFFSET
    );

    // 描画します。

      let m = new matIV();

      const uniLocation = gl.getUniformLocation(program, "mvpMatrix");

      let mMatrix = m.identity(m.create());
      let vMatrix = m.identity(m.create());
      let pMatrix = m.identity(m.create());
      let tmpMatrix = m.identity(m.create());
      let mvpMatrix = m.identity(m.create());

      m.lookAt([0.,2.,5.], [0.,0.,0.],[0,1,0],vMatrix);//view Matrix
      m.perspective(45, c.width/ c.height, 0.1, 100, pMatrix);//projection Matrix
      m.multiply(pMatrix, vMatrix, tmpMatrix);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      gl.activeTexture(gl.TEXTURE0);

      let count = 0;

    (function(){
      gl.clearColor(0.,0.,0.,1.);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

      count++;
      let rad = (count % 360) * Math.PI / 180;

      m.identity(mMatrix);
      m.rotate(mMatrix, rad, [0,1,0], mMatrix);
      m.multiply(tmpMatrix, mMatrix, mvpMatrix);

      gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

      const indexSize = indices.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0);
      gl.flush();
      
      setTimeout(arguments.callee, 1000 / 30);
    })();

  });
};
