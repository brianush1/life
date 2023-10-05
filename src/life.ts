
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
let renderProgram: ProgramWrapper, interpolationProgram: ProgramWrapper, computeProgram: ProgramWrapper;
let chunkChecker: TextureWrapper;
let gl: WebGL2RenderingContext;

let prevMap = new Map<number, TextureWrapper>();
let currentMap = new Map<number, TextureWrapper>();

const CHUNK_SIZE = 96;
const NUM_PREALLOCATED_CHUNKS = 1024;
const EMPTY_CHUNK_CHECK_SIZE = 128;
const CHUNK_CHECK_SCALE = 16;

if (CHUNK_SIZE % CHUNK_CHECK_SCALE !== 0) throw 0;

function encodePosition(x: number, y: number) { return (x + 33_554_432) * 67_108_864 + (y + 33_554_432); }
function getX(pos: number) { return (pos / 67_108_864 | 0) - 33_554_432; }
function getY(pos: number) { return pos % 67_108_864 - 33_554_432; }

interface ProgramWrapper {
	program: WebGLProgram;
	getUniformLocation(name: string): WebGLUniformLocation | null;
}

function createProgram(sources: { type: number; source: string; }[]): ProgramWrapper {
	const shaders: WebGLShader[] = [];

	const program = gl.createProgram();
	if (!program)
		throw new Error("could not create shader program");

	for (const source of sources) {
		const shader = gl.createShader(source.type);
		if (!shader)
			throw new Error("could not create shader");

		shaders.push(shader);

		gl.shaderSource(shader, source.source);
		gl.compileShader(shader);
		const compileStatus: boolean = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!compileStatus)
			throw new Error("An error occurred while compiling: " + (gl.getShaderInfoLog(shader) ?? "<null>"));
	}

	for (const shader of shaders)
		gl.attachShader(program, shader);
	gl.linkProgram(program);
	const linkStatus: boolean = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!linkStatus)
		throw new Error("An error occurred while linking: " + (gl.getProgramInfoLog(program) ?? "<null>"));

	const locationCache = new Map<string, WebGLUniformLocation | null>();
	return {
		program,
		getUniformLocation(name) {
			if (locationCache.has(name))
				return locationCache.get(name)!;

			const result = gl.getUniformLocation(program, name);
			locationCache.set(name, result);
			return result;
		},
	};
}

interface TextureWrapper {
	texture: WebGLTexture;
	fbo: WebGLFramebuffer;
}

const chunkPool: TextureWrapper[] = [];
function deleteChunk(chunk: TextureWrapper, fill: boolean = false) {
	if (fill) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, chunk.fbo);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
	chunkPool.push(chunk);
}

function createTexture(width: number, height: number): TextureWrapper {
	const texture = gl.createTexture();
	if (!texture) throw 0;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(width * height));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.bindTexture(gl.TEXTURE_2D, null);

	const fbo = gl.createFramebuffer();
	if (!fbo) throw 0;
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return {
		texture,
		fbo,
	};
}

function createChunk(): TextureWrapper {
	if (chunkPool.length > 0)
		return chunkPool.pop()!;

	return createTexture(CHUNK_SIZE, CHUNK_SIZE);
}

export function initializeLife() {
	const wgl = canvas.getContext("webgl2", { antialias: false, depth: false });
	if (!wgl)
		return;
	gl = wgl;

	// create programs

	renderProgram = createProgram([
		{ type: gl.VERTEX_SHADER, source: `#version 300 es
			precision highp float;

			layout(location = 0) in vec2 pos;
			layout(location = 1) in vec2 uvInput;

			out vec2 uv;

			void main() {
				gl_Position = vec4(pos, 0.0, 1.0);
				uv = uvInput;
			}
		`},
		{ type: gl.FRAGMENT_SHADER, source: `#version 300 es
			precision highp float;

			in vec2 uv;

			uniform sampler2D curr;

			out vec4 fragColor;

			void main() {
				fragColor = vec4(vec3(texture(curr, uv).r), 1.0);
			}
		`},
	]);
	interpolationProgram = createProgram([
		{ type: gl.VERTEX_SHADER, source: `#version 300 es
			precision highp float;

			layout(location = 0) in vec2 pos;
			layout(location = 1) in vec2 uvInput;

			out vec2 uv;

			void main() {
				gl_Position = vec4(pos, 0.0, 1.0);
				uv = uvInput;
			}
		`},
		{ type: gl.FRAGMENT_SHADER, source: `#version 300 es
			precision highp float;

			in vec2 uv;

			uniform sampler2D prev, curr;
			uniform float interpolation;

			out vec4 fragColor;

			void main() {
				fragColor = vec4(vec3(mix(texture(prev, uv).r, texture(curr, uv).r, interpolation)), 1.0);
			}
		`},
	]);
	computeProgram = createProgram([
		{ type: gl.VERTEX_SHADER, source: `#version 300 es
			precision highp float;

			layout(location = 0) in vec2 pos;
			layout(location = 1) in vec2 uvInput;

			out vec2 uv;

			void main() {
				gl_Position = vec4(pos, 0.0, 1.0);
				uv = uvInput;
			}
		`},
		{ type: gl.FRAGMENT_SHADER, source: `#version 300 es
			precision highp float;

			in vec2 uv;

			uniform sampler2D[9] images;
			uniform vec2 viewportSize;

			out vec4 fragColor;

			bool getSample(vec2 point) {
				int x = point.x < 0.0 ? -1 : point.x >= 1.0 ? 1 : 0;
				int y = point.y < 0.0 ? -1 : point.y >= 1.0 ? 1 : 0;
				int idx = (x + 1) * 3 + (y + 1);
				point.x -= float(x);
				point.y -= float(y);
				switch (idx) {
					case 0: return texture(images[0], point).r != 0.0;
					case 1: return texture(images[1], point).r != 0.0;
					case 2: return texture(images[2], point).r != 0.0;
					case 3: return texture(images[3], point).r != 0.0;
					case 4: return texture(images[4], point).r != 0.0;
					case 5: return texture(images[5], point).r != 0.0;
					case 6: return texture(images[6], point).r != 0.0;
					case 7: return texture(images[7], point).r != 0.0;
					case 8: return texture(images[8], point).r != 0.0;
				}
			}

			void main() {
				int countNeighbors = 0;
				for (float dx = -1.0; dx <= 1.0; ++dx) {
					for (float dy = -1.0; dy <= 1.0; ++dy) {
						if (dx == 0.0 && dy == 0.0)
							continue;
						if (getSample(uv + vec2(dx, dy) / viewportSize))
							countNeighbors += 1;
					}
				}
				bool alive = texture(images[4], uv).r != 0.0;
				bool nextAlive = alive && countNeighbors == 2 || countNeighbors == 3;
				fragColor = nextAlive ? vec4(1.0) : vec4(0.0, 0.0, 0.0, 1.0);
			}
		`},
	]);

	// create quad VBO

	const vao = gl.createVertexArray();
	if (!vao) throw 0;

	gl.bindVertexArray(vao);

	const buf = gl.createBuffer();
	if (!buf) throw 0;

	const vertices = new Float32Array([
		// pos      uv
		  -1, -1,   0, 0,
		   1, -1,   1, 0,
		   1,  1,   1, 1,
		  -1,  1,   0, 1,
	]);

	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 4 * 4, 0);
	gl.enableVertexAttribArray(0);

	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
	gl.enableVertexAttribArray(1);

	// preallocate chunks

	for (let i = 0; i < NUM_PREALLOCATED_CHUNKS; ++i)
		chunkPool.push(createChunk());

	chunkChecker = createTexture(CHUNK_SIZE / CHUNK_CHECK_SCALE, CHUNK_SIZE / CHUNK_CHECK_SCALE * EMPTY_CHUNK_CHECK_SIZE);
}

export function loadObject(offsetX: number, offsetY: number, data: boolean[][]) {
	if (data.length === 0)
		return;

	const width = data[0].length;
	const height = data.length;

	const chunkOffsetX = Math.floor(offsetX / CHUNK_SIZE);
	const chunkOffsetY = Math.floor(offsetY / CHUNK_SIZE);
	const chunkWidth = Math.ceil((offsetX + width) / CHUNK_SIZE) - chunkOffsetX;
	const chunkHeight = Math.ceil((offsetY + height) / CHUNK_SIZE) - chunkOffsetY;

	for (let cx = 0; cx < chunkWidth; ++cx) {
		for (let cy = 0; cy < chunkHeight; ++cy) {
			const chunkX = chunkOffsetX + cx;
			const chunkY = chunkOffsetY + cy;

			const pos = encodePosition(chunkX, chunkY);
			const chunk = createChunk();
			prevMap.set(pos, createChunk());
			currentMap.set(pos, chunk);

			const bitmap = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
			for (let i = 0, y = 0; y < CHUNK_SIZE; ++y) {
				for (let x = 0; x < CHUNK_SIZE; ++x, ++i) {
					const localX = chunkX * CHUNK_SIZE + x - offsetX;
					const localY = chunkY * CHUNK_SIZE + y - offsetY;
					if (localX >= 0 && localY >= 0 && localX < width && localY < height && data[localY][localX])
						bitmap[i] = 0xFF;
				}
			}

			gl.bindTexture(gl.TEXTURE_2D, chunk.texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, CHUNK_SIZE, CHUNK_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, bitmap);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
	}
}

let generation = 0;
const contentChunks = new Set<number>();
const keepChunks = new Set<number>();
const readPixelsBuffer = new Uint8Array((CHUNK_SIZE * CHUNK_SIZE) / (CHUNK_CHECK_SCALE * CHUNK_CHECK_SCALE) * EMPTY_CHUNK_CHECK_SIZE * 4);

function stepSetup() {
	gl.viewport(0, 0, CHUNK_SIZE, CHUNK_SIZE);
	gl.useProgram(computeProgram.program);
	gl.uniform2f(computeProgram.getUniformLocation("viewportSize"), CHUNK_SIZE, CHUNK_SIZE);
	for (let i = 0; i < 9; ++i)
		gl.uniform1i(computeProgram.getUniformLocation(`images[${i}]`), i);
}

function stepFinalize() {
	document.getElementById("generation")!.innerText = `Gen: ${generation}`;
}

function bindNeighbors(x: number, y: number) {
	for (let dx = -1; dx <= 1; ++dx) {
		for (let dy = -1; dy <= 1; ++dy) {
			const textureIndex = (dx + 1) * 3 + (dy + 1);
			const neighbor = prevMap.get(encodePosition(x + dx, y + dy));
			gl.activeTexture(gl.TEXTURE0 + textureIndex);
			gl.bindTexture(gl.TEXTURE_2D, neighbor ? neighbor.texture : null);
		}
	}
}

function chunkEmptinessCheck(chunks: TextureWrapper[]): boolean[] {
	const result: boolean[] = [];

	gl.bindFramebuffer(gl.FRAMEBUFFER, chunkChecker.fbo);
	gl.useProgram(renderProgram.program);
	gl.uniform1i(renderProgram.getUniformLocation("curr"), 0);
	gl.activeTexture(gl.TEXTURE0);
	for (let i = 0; i < chunks.length; ++i) {
		const chunk = chunks[i];
		gl.bindTexture(gl.TEXTURE_2D, chunk.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.viewport(0, CHUNK_SIZE * i / CHUNK_CHECK_SCALE, CHUNK_SIZE / CHUNK_CHECK_SCALE, CHUNK_SIZE / CHUNK_CHECK_SCALE);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}

	const chunkCheckArea = (CHUNK_SIZE * CHUNK_SIZE) / (CHUNK_CHECK_SCALE * CHUNK_CHECK_SCALE);
	gl.readPixels(0, 0, CHUNK_SIZE / CHUNK_CHECK_SCALE, CHUNK_SIZE / CHUNK_CHECK_SCALE * EMPTY_CHUNK_CHECK_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, readPixelsBuffer);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	let index = 0;
	for (let chunkIndex = 0; chunkIndex < chunks.length; ++chunkIndex) {
		let filled = false;
		for (let i = 0; i < chunkCheckArea; ++i) {
			if (readPixelsBuffer[index + i * 4] !== 0) {
				filled = true;
				break;
			}
		}
		result.push(filled);
		index += chunkCheckArea * 4;
	}

	return result;
}

function step() {
	const temp = prevMap;
	prevMap = currentMap;
	currentMap = temp;

	if (generation % CHUNK_SIZE === 0)
		contentChunks.clear();
	if (generation % CHUNK_SIZE === 0)
		keepChunks.clear();

	for (const pos of prevMap.keys()) {
		const x = getX(pos);
		const y = getY(pos);
		const newChunk = currentMap.get(pos)!;

		gl.bindFramebuffer(gl.FRAMEBUFFER, newChunk.fbo);
		bindNeighbors(x, y);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}

	if (generation % CHUNK_SIZE === 0) {
		const chunkPositions: number[] = [];
		for (const pos of prevMap.keys())
			chunkPositions.push(pos);
		const chunksToCheck = chunkPositions.map(i => currentMap.get(i)!);
		for (let i = 0; i < chunksToCheck.length; i += EMPTY_CHUNK_CHECK_SIZE) {
			const checked = chunkEmptinessCheck(chunksToCheck.slice(i, Math.min(chunksToCheck.length, i + EMPTY_CHUNK_CHECK_SIZE)));
			for (let j = 0; j < checked.length; ++j)
				if (checked[j])
					contentChunks.add(chunkPositions[i + j]);
		}

		gl.viewport(0, 0, CHUNK_SIZE, CHUNK_SIZE);
		gl.useProgram(computeProgram.program);

		for (const pos of contentChunks) {
			const x = getX(pos);
			const y = getY(pos);
			for (let dx = -1; dx <= 1; ++dx) {
				for (let dy = -1; dy <= 1; ++dy) {
					const neighborPos = encodePosition(x + dx, y + dy);
					keepChunks.add(neighborPos);
					if (!prevMap.has(neighborPos)) {
						const newChunk = createChunk();
						prevMap.set(neighborPos, createChunk());
						currentMap.set(neighborPos, newChunk);

						gl.bindFramebuffer(gl.FRAMEBUFFER, newChunk.fbo);
						bindNeighbors(x + dx, y + dy);
						gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
					}
				}
			}
		}

		for (const pos of currentMap.keys()) {
			if (!keepChunks.has(pos)) {
				deleteChunk(currentMap.get(pos)!);
				deleteChunk(prevMap.get(pos)!);
				currentMap.delete(pos);
				prevMap.delete(pos);
			}
		}
	}

	generation += 1;
}

export function manualStep() {
	stepSetup();
	step();
	stepFinalize();
}

export function isUniverseEmpty() {
	return currentMap.size === 0;
}

export function clearUniverse() {
	for (const chunk of currentMap.values())
		deleteChunk(chunk, true);
	currentMap.clear();

	for (const chunk of prevMap.values())
		deleteChunk(chunk, true);
	prevMap.clear();

	generation = 0;
	running = false;

	targetViewX = viewX = 0;
	targetViewY = viewY = 0;
	targetZoomFactor = zoomFactor = 2;
}

export let speed = 1;
export let running = false;

let zoomFactor = 2, targetZoomFactor = 2;
let viewX = 0, viewY = 0, targetViewX = 0, targetViewY = 0;
let lastTime: number | undefined = undefined, lastGeneration = performance.now();
let lag = 0;
// const smoothingSpeed = 10;
const MAX_TICKS_PER_FRAME = 128;

export function setSpeed(newSpeed: number) {
	speed = newSpeed;
	lag = 0;
}

export function toggleRunning() {
	running = !running;
	lag = 0;
}

export function render() {
	const effectiveSpeed = running ? speed * 30 : 0;

	requestAnimationFrame(render);

	const now = performance.now();
	if (lastTime === undefined)
		lastTime = now;
	const dt = (now - lastTime) / 1000;
	lastTime = now;

	lag += dt;

	zoomFactor += (targetZoomFactor - zoomFactor) * (1 - Math.exp(-dt * 20));
	viewX += (targetViewX - viewX) * (1 - Math.exp(-dt * 20));
	viewY += (targetViewY - viewY) * (1 - Math.exp(-dt * 20));

	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	stepSetup();
	const ticks = lag * effectiveSpeed | 0;
	lag %= 1 / effectiveSpeed;
	for (let i = 0; i < Math.min(ticks, MAX_TICKS_PER_FRAME); ++i) {
		lastGeneration = now;
		step();
	}
	stepFinalize();

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// if (effectiveSpeed >= 60) {
	gl.useProgram(renderProgram.program);
	gl.uniform1i(renderProgram.getUniformLocation("curr"), 1);
	// }
	// else {
	// 	gl.useProgram(interpolationProgram.program);
	// 	gl.uniform1i(interpolationProgram.getUniformLocation("prev"), 0);
	// 	gl.uniform1i(interpolationProgram.getUniformLocation("curr"), 1);
	// 	gl.uniform1f(interpolationProgram.getUniformLocation("interpolation"), Math.min(Math.max((now - lastGeneration) / 1000 * Math.max(speed, smoothingSpeed), 0), 1));
	// }

	for (const pos of currentMap.keys()) {
		const x = getX(pos);
		const y = getY(pos);
		const prevChunk = prevMap.get(pos)!;
		const currentChunk = currentMap.get(pos)!;
		gl.viewport(
			Math.round(x * CHUNK_SIZE * zoomFactor) + viewX + Math.floor(canvas.width / 2),
			Math.round(y * CHUNK_SIZE * zoomFactor) + viewY + Math.floor(canvas.height / 2),
			Math.round((x + 1) * CHUNK_SIZE * zoomFactor) - Math.round(x * CHUNK_SIZE * zoomFactor),
			Math.round((y + 1) * CHUNK_SIZE * zoomFactor) - Math.round(y * CHUNK_SIZE * zoomFactor),
		);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, prevChunk.texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, currentChunk.texture);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}
}

function put(value: boolean, clientX: number, clientY: number) {
	const worldX = Math.floor((clientX - viewX - Math.floor(canvas.width / 2)) / zoomFactor);
	const worldY = Math.floor((clientY - viewY - Math.floor(canvas.height / 2)) / zoomFactor);

	const chunkX = Math.floor(worldX / CHUNK_SIZE);
	const chunkY = Math.floor(worldY / CHUNK_SIZE);
	const localX = worldX - chunkX * CHUNK_SIZE;
	const localY = worldY - chunkY * CHUNK_SIZE;

	const pos = encodePosition(chunkX, chunkY);
	let chunk: TextureWrapper | undefined = currentMap.get(pos);
	if (!chunk) {
		chunk = createChunk();
		prevMap.set(pos, createChunk());
		currentMap.set(pos, chunk);
	}

	gl.enable(gl.SCISSOR_TEST);
	gl.bindFramebuffer(gl.FRAMEBUFFER, chunk.fbo);
	gl.viewport(0, 0, CHUNK_SIZE, CHUNK_SIZE);
	gl.scissor(localX, localY, 1, 1);
	const a = value ? 1 : 0;
	gl.clearColor(a, a, a, a);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.disable(gl.SCISSOR_TEST);
}

function read(clientX: number, clientY: number) {
	const worldX = Math.floor((clientX - viewX - Math.floor(canvas.width / 2)) / zoomFactor);
	const worldY = Math.floor((clientY - viewY - Math.floor(canvas.height / 2)) / zoomFactor);

	const chunkX = Math.floor(worldX / CHUNK_SIZE);
	const chunkY = Math.floor(worldY / CHUNK_SIZE);
	const localX = worldX - chunkX * CHUNK_SIZE;
	const localY = worldY - chunkY * CHUNK_SIZE;

	const pos = encodePosition(chunkX, chunkY);
	let chunk: TextureWrapper | undefined = currentMap.get(pos);
	if (!chunk)
		return false;

	gl.bindFramebuffer(gl.FRAMEBUFFER, chunk.fbo);
	const pixelData = new Uint8Array(4);
	gl.readPixels(localX, localY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return pixelData[0] !== 0;
}

let panX = 0, panY = 0, panning = false;
let putting: boolean | undefined = undefined;
canvas.addEventListener("mousedown", e => {
	if (e.button === 0 || e.button === 1) {
		panX = e.clientX;
		panY = e.clientY;
		panning = true;
	}
	else if (e.button === 2) {
		putting = !read(e.clientX, e.clientY);
		put(putting, e.clientX, e.clientY);
	}
});
document.addEventListener("mousemove", e => {
	if (putting !== undefined) {
		put(putting, e.clientX, e.clientY);
	}

	if (panning) {
		viewX += e.clientX - panX;
		viewY += e.clientY - panY;
		targetViewX += e.clientX - panX;
		targetViewY += e.clientY - panY;
		panX = e.clientX;
		panY = e.clientY;
	}
});
document.addEventListener("mouseup", e => {
	if (e.button === 2) {
		putting = undefined;
	}
	else if (e.button === 0 || e.button === 1) {
		panning = false;
	}
});

canvas.addEventListener("wheel", e => {
	e.preventDefault();

	if (!e.shiftKey) {
		const oldZoom = targetZoomFactor;
		targetZoomFactor = Math.min(Math.max(targetZoomFactor * 1.25 ** -(e.deltaY / 120), 0.01), 128);

		const clientX = e.clientX - Math.floor(canvas.width / 2);
		const clientY = e.clientY - Math.floor(canvas.height / 2);
		targetViewX = -(clientX - targetViewX) / oldZoom * targetZoomFactor + clientX;
		targetViewY = -(clientY - targetViewY) / oldZoom * targetZoomFactor + clientY;
	}
	else {
		targetViewX -= e.deltaX;
		targetViewY -= e.deltaY;
	}
});
