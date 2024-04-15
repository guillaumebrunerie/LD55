declare module "*.png?texture" {
	import type { Texture } from "pixi.js";
	const texture: Promise<Texture>;
	// eslint-disable-next-line import/no-unused-modules
	export default texture;
}

declare module "*.jpg?texture" {
	import type { Texture } from "pixi.js";
	const texture: Promise<Texture>;
	// eslint-disable-next-line import/no-unused-modules
	export default texture;
}

declare module "*.png?spritesheet" {
	import type { Spritesheet } from "pixi.js";
	const spritesheet: Promise<Spritesheet>;
	// eslint-disable-next-line import/no-unused-modules
	export default spritesheet;
}

declare module "*.mp3?sound" {
	import type { Sound } from "@pixi/sound";
	const sound: Promise<Sound>;
	// eslint-disable-next-line import/no-unused-modules
	export default sound;
}
