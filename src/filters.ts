import { ColorMatrixFilter } from "pixi.js";

export const darkFilter = new ColorMatrixFilter();
darkFilter.matrix = [
	0,
	0,
	0,
	0,
	0x41 / 256,
	0,
	0,
	0,
	0,
	0x29 / 256,
	0,
	0,
	0,
	0,
	0x56 / 256,
	0,
	0,
	0,
	1,
	0,
];

export const opponentFilter = new ColorMatrixFilter();
opponentFilter.hue(70, false);
