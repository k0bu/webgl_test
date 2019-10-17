// sample_011
//
// WebGLで拡散光(ディレクショナルライト)＋環境光(アンビエントライト)＋反射光(スペキュラライト)

onload = function(){
	// canvasエレメントを取得
	const c = document.getElementById('canvas');
	c.width = 500;
	c.height = 300;
	
	// webglコンテキストを取得
	const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	
	// 頂点シェーダとフラグメントシェーダの生成
	//const v_shader = create_shader('vs');
	//const f_shader = create_shader('fs');
	
	const loadVertexShader = fetch('vs.glsl');
	const loadFragmentShader = fetch('fs.glsl');

	Promise.all([loadVertexShader, loadFragmentShader])
		.then((responses) => Promise.all([responses[0].text(), responses[1].text()]))
		.then((shaderSources) => {
			const v_shaderSource = shaderSources[0];
			const f_shaderSource = shaderSources[1];
			
			const v_shader = gl.createShader(gl.VERTEX_SHADER);

			gl.shaderSource(v_shader, v_shaderSource);
			gl.compileShader(v_shader);

			if(gl.getShaderParameter(v_shader, gl.COMPILE_STATUS)){
				const info = gl.getShaderInfoLog(v_shader);
				console.log(info);
			}

			const f_shader = gl.createShader(gl.FRAGMENT_SHADER);

			gl.shaderSource(f_shader, f_shaderSource);
			gl.compileShader(f_shader);

			if(gl.getShaderParameter(f_shader, gl.COMPILE_STATUS)){
				const info = gl.getShaderInfoLog(f_shader);
				console.log(info);
			}
			
			// プログラムオブジェクトの生成とリンク
			const prg = create_program(v_shader, f_shader);
			
			// attributeLocationを配列に取得
			const attLocation = new Array();
			attLocation[0] = gl.getAttribLocation(prg, 'position');
			attLocation[1] = gl.getAttribLocation(prg, 'normal');
			attLocation[2] = gl.getAttribLocation(prg, 'color');
			
			// attributeの要素数を配列に格納
			const attStride = new Array();
			attStride[0] = 3;
			attStride[1] = 3;
			attStride[2] = 4;
			
			// トーラスの頂点データを生成
			const torusData = torus(32, 32, 1.0, 2.0);
			const position = torusData[0];
			const normal = torusData[1];
			const color = torusData[2];
			const index = torusData[3];
			
			// VBOの生成
			const pos_vbo = create_vbo(position);
			const nor_vbo = create_vbo(normal);
			const col_vbo = create_vbo(color);
			
			// VBO を登録する
			set_attribute([pos_vbo, nor_vbo, col_vbo], attLocation, attStride);
			
			// IBOの生成
			const ibo = create_ibo(index);
			
			// IBOをバインドして登録する
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
			
			// uniformLocationを配列に取得
			const uniLocation = new Array();
			uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
			uniLocation[1] = gl.getUniformLocation(prg, 'invMatrix');
			uniLocation[2] = gl.getUniformLocation(prg, 'lightDirection');
			uniLocation[3] = gl.getUniformLocation(prg, 'eyeDirection');
			uniLocation[4] = gl.getUniformLocation(prg, 'ambientColor');
			
			// minMatrix.js を用いた行列関連処理
			// matIVオブジェクトを生成
			const m = new matIV();
			
			// 各種行列の生成と初期化
			const mMatrix = m.identity(m.create());
			const vMatrix = m.identity(m.create());
			const pMatrix = m.identity(m.create());
			const tmpMatrix = m.identity(m.create());
			const mvpMatrix = m.identity(m.create());
			const invMatrix = m.identity(m.create());
			
			// ビュー×プロジェクション座標変換行列
			m.lookAt([0.0, 0.0, 20.0], [0, 0, 0], [0, 1, 0], vMatrix);
			m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
			m.multiply(pMatrix, vMatrix, tmpMatrix);
			
			// 平行光源の向き
			const lightDirection = [-0.5, 0.5, 0.5];
			
			// 視点ベクトル
			const eyeDirection = [0.0, 0.0, 20.0];
			
			// 環境光の色
			const ambientColor = [0.1, 0.1, 0.1, 1.0];
			
			// カウンタの宣言
			let count = 0;
			
			// カリングと深度テストを有効にする
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			gl.enable(gl.CULL_FACE);
			
			// 恒常ループ
			(function(){
				// canvasを初期化
				gl.clearColor(0.0, 0.0, 0.0, 1.0);
				gl.clearDepth(1.0);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				
				// カウンタをインクリメントする
				count++;
				
				// カウンタを元にラジアンを算出
				const rad = (count % 360) * Math.PI / 180;
				
				// モデル座標変換行列の生成
				m.identity(mMatrix);
				m.rotate(mMatrix, rad, [0, 1, 1], mMatrix);
				m.multiply(tmpMatrix, mMatrix, mvpMatrix);
				
				// モデル座標変換行列から逆行列を生成
				m.inverse(mMatrix, invMatrix);
				
				// uniform変数の登録
				gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
				gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);
				gl.uniform3fv(uniLocation[2], lightDirection);
				gl.uniform3fv(uniLocation[3], eyeDirection);
				gl.uniform4fv(uniLocation[4], ambientColor);
				
				// モデルの描画
				gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
				
				// コンテキストの再描画
				gl.flush();
				
				// ループのために再帰呼び出し
				setTimeout(arguments.callee, 1000 / 30);
			})();
		});


	function loadTextFile(url, callback){
		let request = new XMLHttpRequest();
		
		request.open('GET', url, true);

		request.setRequestHeader('Pragma', 'no-cache');
		request.setRequestHeader('Cache-Control', 'no-cache');
		request.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00');

		request.responseType = "text";
		request.onload = function () {
				if (request.readyState == 4 || request.status == 200) {
						console.log("Successfully '" + url + "' loaded.");
						console.log(request.responseText)
				} else { 
						console.log("Error while loading '" + url + "'.");
				}
		};
		request.onerror = callback;
		request.send(null);
	}

	function create_shaders(){
		const loadVertexShader = fetch('vs.glsl');
		const loadFragmentShader = fetch('fs.glsl');

		Promise.all([loadVertexShader, loadFragmentShader])
    	.then((responses) => Promise.all([responses[0].text(), responses[1].text()]))
    	.then((shaderSources) => {
        const vertexShaderSource = shaderSources[0];
				const fragmentShaderSource = shaderSources[1];
				
				const vertexShader = gl.createShader(gl.VERTEX_SHADER);

				gl.shaderSource(vertexShader, vertexShaderSource);
				gl.compileShader(vertexShader);

				if(gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
					const info = gl.getShaderInfoLog(vertexShader);
        	console.log(info);
				}

				const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

				gl.shaderSource(fragmentShader, fragmentShaderSource);
				gl.compileShader(fragmentShader);

				return [vertexShader,fragmentShader];
			});
	}
		

	
	// プログラムオブジェクトを生成しシェーダをリンクする関数
	function create_program(vs, fs){
		// プログラムオブジェクトの生成
		const program = gl.createProgram();
		
		// プログラムオブジェクトにシェーダを割り当てる
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		
		// シェーダをリンク
		gl.linkProgram(program);
		
		// シェーダのリンクが正しく行なわれたかチェック
		if(gl.getProgramParameter(program, gl.LINK_STATUS)){
		
			// 成功していたらプログラムオブジェクトを有効にする
			gl.useProgram(program);
			
			// プログラムオブジェクトを返して終了
			return program;
		}else{
			
			// 失敗していたらエラーログをアラートする
			alert(gl.getProgramInfoLog(program));
		}
	}
	
	// VBOを生成する関数
	function create_vbo(data){
		// バッファオブジェクトの生成
		const vbo = gl.createBuffer();
		
		// バッファをバインドする
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		
		// バッファにデータをセット
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		// 生成した VBO を返して終了
		return vbo;
	}
	
	// VBOをバインドし登録する関数
	function set_attribute(vbo, attL, attS){
		// 引数として受け取った配列を処理する
		for(const i in vbo){
			// バッファをバインドする
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
			
			// attributeLocationを有効にする
			gl.enableVertexAttribArray(attL[i]);
			
			// attributeLocationを通知し登録する
			gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
		}
	}
	
	// IBOを生成する関数
	function create_ibo(data){
		// バッファオブジェクトの生成
		const ibo = gl.createBuffer();
		
		// バッファをバインドする
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		
		// バッファにデータをセット
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		
		// 生成したIBOを返して終了
		return ibo;
	}
	
	// トーラスを生成する関数
	function torus(row, column, irad, orad){
		const pos = new Array(), nor = new Array(),
		    col = new Array(), idx = new Array();
		for(let i = 0; i <= row; i++){
			const r = Math.PI * 2 / row * i;
			const rr = Math.cos(r);
			const ry = Math.sin(r);
			for(let ii = 0; ii <= column; ii++){
				const tr = Math.PI * 2 / column * ii;
				const tx = (rr * irad + orad) * Math.cos(tr);
				const ty = ry * irad;
				const tz = (rr * irad + orad) * Math.sin(tr);
				const rx = rr * Math.cos(tr);
				const rz = rr * Math.sin(tr);
				pos.push(tx, ty, tz);
				nor.push(rx, ry, rz);
				const tc = hsva(360 / column * ii, 1, 1, 1);
				col.push(tc[0], tc[1], tc[2], tc[3]);
			}
		}
		for(i = 0; i < row; i++){
			for(ii = 0; ii < column; ii++){
				r = (column + 1) * i + ii;
				idx.push(r, r + column + 1, r + 1);
				idx.push(r + column + 1, r + column + 2, r + 1);
			}
		}
		return [pos, nor, col, idx];
	}
	
	// HSVカラー取得用関数
	function hsva(h, s, v, a){
		if(s > 1 || v > 1 || a > 1){return;}
		const th = h % 360;
		const i = Math.floor(th / 60);
		const f = th / 60 - i;
		const m = v * (1 - s);
		const n = v * (1 - s * f);
		const k = v * (1 - s * (1 - f));
		const color = new Array();
		if(!s > 0 && !s < 0){
			color.push(v, v, v, a); 
		} else {
			const r = new Array(v, n, m, m, k, v);
			const g = new Array(k, v, v, n, m, m);
			const b = new Array(m, m, k, v, v, n);
			color.push(r[i], g[i], b[i], a);
		}
		return color;
	}
	
	};