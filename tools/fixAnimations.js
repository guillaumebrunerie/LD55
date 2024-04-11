#!/usr/bin/node

import { readFileSync, writeFileSync } from "fs";

const processData = (data) => {
	const frames = data.frames;
	data.frames = Object.fromEntries(frames.map((f) => [f.filename, f]));
	data.animations = {
		animation: frames.map((f) => f.filename).toSorted(),
	};
};

const determinePath = () => {
	if (process.argv.length != 3) {
		return null;
	}

	return process.argv[2];
};

const readData = (path) => {
	const str = readFileSync(path || process.stdin.fd, "utf-8");
	return JSON.parse(str);
};

const writeData = (path, data) => {
	if (path) {
		const str = JSON.stringify(data);
		writeFileSync(path, str);
	} else {
		const str = JSON.stringify(data, null, 2);
		console.log(str);
	}
};

const path = determinePath();
const data = readData(path);
processData(data);
writeData(path, data);
