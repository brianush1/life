const MAX_PATTERN_AREA = 1e6;

export interface PatternInfo {
	filename: string;
	name?: string;
	author?: string;
	description: string[];
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
	data: boolean[][];
}

function parseRLEPattern(filename: string, data: string): PatternInfo | undefined {
	const pattern: PatternInfo = {
		filename,
		description: [],
		width: 0, height: 0,
		offsetX: 0, offsetY: 0,
		data: [],
	};

	let cursorX = 0, cursorY = 0;
	for (const rawLine of data.split("\n")) {
		const line = rawLine.trim();
		let matches: RegExpMatchArray | null;
		if (matches = line.match(/^x\s*=\s*(\d+),\s*y\s*=\s*(\d+)(|, .*)$/)) {
			pattern.width = parseInt(matches[1]);
			pattern.height = parseInt(matches[2]);
			if (pattern.width * pattern.height > MAX_PATTERN_AREA)
				return undefined;
			pattern.data = Array(pattern.height).fill(0).map(() => Array(pattern.width).fill(false));
		}
		else if (matches = line.match(/^#\s*(N|n)\s*(.*)$/)) {
			pattern.name = matches[2];
		}
		else if (matches = line.match(/^#\s*(O|o)\s*(.*)$/)) {
			pattern.author = matches[2];
		}
		else if (matches = line.match(/^#\s*(C|c)\s*(.*)$/)) {
			pattern.description.push(matches[2]);
		}
		else if (matches = line.match(/^#\s*(R|r|P|p)\s*(.*)\s*(.*)$/)) {
			pattern.offsetX = parseInt(matches[2]);
			pattern.offsetY = parseInt(matches[3]);
		}
		else {
			for (const match of line.matchAll(/(\d*)([bo\$!])/g)) {
				const count = match[1] === "" ? 1 : parseInt(match[1]);
				const type = match[2];
				if (type === "b") {
					cursorX += count;
				}
				else if (type === "o") {
					if (cursorY >= pattern.data.length)
						return undefined;
					for (let i = 0; i < count; ++i, ++cursorX) {
						pattern.data[cursorY][cursorX] = true;
					}
				}
				else if (type === "$") {
					cursorY += count;
					cursorX = 0;
				}
				else if (type === "!") {
					break;
				}
			}
		}
	}

	return pattern;
}

export const patterns: PatternInfo[] = [];

const utfDecoder = new TextDecoder();
function readTar(tar: Uint8Array, target: Map<string, Uint8Array>) {
	for (let index = 0; tar[index + 257] !== 0;) {
		if (utfDecoder.decode(tar.subarray(index + 257, index + 262)) !== "ustar")
			throw new Error("malformed tar");
		let fileNameEnd = index;
		while (tar[fileNameEnd] !== 0)
			fileNameEnd += 1;
		let fileName = utfDecoder.decode(tar.subarray(index, fileNameEnd));
		let fileSize = 0;
		for (let i = index + 124;; i += 1) {
			const ch = tar[i];
			if (ch >= 48)
				fileSize = fileSize * 8 + ch - 48;
			else
				break;
		}
		if (fileName.startsWith("./"))
			fileName = fileName.substring(2);
		if (fileName.endsWith(".rle"))
			fileName = fileName.substring(0, fileName.length - 4);
		target.set(fileName, tar.subarray(index + 512, index + 512 + fileSize));
		index += 512 * (1 + (fileSize + 511) / 512 | 0);
	}
}

export function displayPatternInfo(info: PatternInfo | undefined) {
	if (!info) {
		history.replaceState(undefined, "", location.pathname);
		document.getElementById("pattern-info")!.style.display = "none";
		return;
	}

	history.replaceState(undefined, "", `#${encodeURIComponent(info.filename)}`);
	document.getElementById("pattern-info")!.style.display = "block";
	document.getElementById("pattern-name")!.innerText = info.name ?? "Untitled";
	document.getElementById("author")!.innerText = "by " + (info.author ?? "unknown author");
	document.getElementById("description")!.innerHTML = info.description
		.map(x => x.replace(/&/g, "&amp;"))
		.map(x => x.replace(/</g, "&lt;"))
		.map(x => x.replace(/>/g, "&gt;"))
		.map(x => x.replace(/"/g, "&quot;"))
		.map(x => x.replace(/'/g, "&apos;"))
		.map(x => {
			if (x.match(/^(http(s|):\/\/|)[a-z\-\.]+\.com\/[\S]+$/g)) {
				return `<a href="${!x.startsWith("http") ? "https://" + x : x}">${x}</a><br>`;
			}
			else {
				return `<span>${x}</span><br>`;
			}
		})
		.join("");
}

document.getElementById("pattern-close")!.addEventListener("click", () => {
	document.getElementById("pattern-info")!.style.display = "none";
});

const patternFiles = new Map<string, Uint8Array>();
let patternFilesPromise: Promise<void> | undefined;
function loadPatternFiles() {
	if (patternFilesPromise)
		return patternFilesPromise;
	return patternFilesPromise = (async () => {
		const tar = await fetch("patterns.tar").then(x => x.arrayBuffer());
		readTar(new Uint8Array(tar), patternFiles);
	})();
}

export async function loadRandomPattern() {
	await loadPatternFiles();
	if (patternFiles.size == 0)
		throw 0;
	const fileEntries = [...patternFiles.entries()];
	let sum = 0;
	for (const [_, data] of fileEntries)
		sum += data.length;
	let pattern: PatternInfo | undefined;
	while (pattern === undefined || pattern.author === undefined) {
		const rand = Math.random() * sum;
		let at = 0;
		for (const [filename, data] of fileEntries) {
			at += data.length;
			if (rand < at) {
				pattern = parseRLEPattern(filename, utfDecoder.decode(data));
				break;
			}
		}
	}
	return pattern;
}

export async function loadPatternByName(targetName: string) {
	await loadPatternFiles();
	if (patternFiles.size == 0 || targetName === "")
		return await loadRandomPattern();
	for (const [filename, data] of patternFiles.entries()) {
		if (filename === targetName) {
			const pattern = parseRLEPattern(filename, utfDecoder.decode(data));
			if (pattern)
				return pattern;
			else
				return await loadRandomPattern();
		}
	}
	return await loadRandomPattern();
}
