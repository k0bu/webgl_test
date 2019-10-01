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

  let attLocation = gl.getAttribLocation(prog, 'position')

  let attStride = 3

  let v_pos = [
    0., 1., 0.,
    1., 0., 0.,
    -1.,0.,0.
  ]

  let vbo = create_vbo(v_pos)

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.enableVertexAttribArray(attLocation)
  gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0)

  let m = new matIV();

  let mMatrix = m.identity(m.create())
  let vMatrix = m.identity(m.create())
  let pMatrix = m.identity(m.create())
  let mvpMatrix = m.identity(m.create())

  m.lookAt([0.,1.,3.], [0.,0.,0.],[0.,1.,0.], vMatrix)
  m.perspective(90, c.width/ c.height, 0.1, 100, pMatrix)

  m.multiply(pMatrix, vMatrix, mvpMatrix)
  m.multiply(mvpMatrix, mMatrix, mvpMatrix)

  let uniLocation = gl.getUniformLocation(prog, 'mvpMatrix')

  gl.uniformMatrix4fv(uniLocation, false, mvpMatrix)
  gl.drawArrays(gl.TRIANGLES,0,3)
  gl.flush()
  
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
}

