onload = function(){
  let c = document.getElementById('canvas')
  c.width = 500;
  c.height = 300;

  let gl = c.getContext('webgl') // || c.getContext('experimental-web-gl)
  gl.clearColor(.0,.0,.0,1.)  

  gl.clearDepth(1.)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  
  let v_shader = create_shader('vs')
  let f_shader = create_shader('fs')

  let prog = create_program(v_shader, f_shader)

  let attLocation = new Array(2)
  attLocation[0] = gl.getAttribLocation(prog, 'position')
  attLocation[1] = gl.getAttribLocation(prog, 'color')

  let attStride = new Array(2)
  attStride[0] = 3
  attStride[1] = 4

  let v_pos = [
    0., 1., 0.,
    1., 0., 0.,
    -1.,0.,0.,
    0.,-1.,0.
  ]

  let v_col = [
    1., 0., 0., 1.,
    0., 1., 0, 1.,
    0., 0., 1., 1.,
    1.,1.,1.,1.
  ]

  let index = [
    0,1,2,
    1,2,3
  ]

  let pos_vbo = create_vbo(v_pos)
  let col_vbo = create_vbo(v_col)

  let vbos = [pos_vbo, col_vbo]

  set_attribute(vbos, attLocation, attStride)

  let ibo = create_ibo(index)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

  let m = new matIV();

  let mMatrix = m.identity(m.create())
  let vMatrix = m.identity(m.create())
  let pMatrix = m.identity(m.create())
  let tmpMatrix = m.identity(m.create())
  let mvpMatrix = m.identity(m.create())

  m.lookAt([0.,0.,5.], [0.,0.,0.],[0.,1.,0.], vMatrix)
  m.perspective(45, c.width/ c.height, 0.1, 100, pMatrix)
  m.multiply(pMatrix, vMatrix, tmpMatrix)

  let uniLocation = gl.getUniformLocation(prog, 'mvpMatrix')

  let count = 0;

  (function(){
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    gl.clearColor(0., 0., 0., 1.)
    gl.clearDepth(1.)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  
    count++

    let rad = (count % 360) * Math.PI / 180
    let x = Math.cos(rad)*1.5
    let z = Math.sin(rad)*1.5

    // モデル座標変換行列の生成(Y軸による回転)
    m.identity(mMatrix);
    m.translate(mMatrix, [x, 0., z], mMatrix)
		m.rotate(mMatrix, rad*0.8, [1, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    
        // モデル座標変換行列の生成(Y軸による回転)
    m.identity(mMatrix);
    m.translate(mMatrix, [-x, 0., -z], mMatrix)    
		m.rotate(mMatrix, rad, [1, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
		
		// インデックスを用いた描画命令
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
		
		// コンテキストの再描画
		gl.flush();

    setTimeout(arguments.callee, 1000/30)
  })()
  
  function create_shader(id){
    let shader;
    let scriptElement = document.getElementById(id);
    if(!scriptElement){
      return;

    }

    switch(scriptElement.type){
      case 'x-shader/x-vertex':
        shader = gl.createShader(gl.VERTEX_SHADER);
        break;
      case 'x-shader/x-fragment':
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        break;
      default:
        return;
    }

    gl.shaderSource(shader, scriptElement.text);
    gl.compileShader(shader);
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      return shader;
    } else {
      alert(gl.getShaderInfoLog(shaer));
    }
  }

  function create_program(vs, fs){
    let program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
      gl.useProgram(program);
      return program;
    }  else {
      alert(gl.getProgramInfoLog(program));
    }
  }

  function create_vbo(data){
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
  }

  function set_attribute(vbo, attL, attS){
    for(var i in vbo){
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i])
      gl.enableVertexAttribArray(attL[i])
      gl.vertexAttribPointer(attL[i],attS[i],gl.FLOAT, false, 0, 0)
    }
  }

  function create_ibo(data){
    let ibo = gl.createBuffer()
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    return ibo
  }
}

