declare module "*.png?texture" {
	import type { Texture } from "pixi.js";
	const texture: Promise<Texture>;
	export default texture;
}

declare module "*.jpg?texture" {
	import type { Texture } from "pixi.js";
	const texture: Promise<Texture>;
	export default texture;
}

declare module "*.png?spritesheet" {
	import type { Spritesheet } from "pixi.js";
	const spritesheet: Promise<Spritesheet>;
	export default spritesheet;
}

declare module "*.mp3?sound" {
	import type { Sound } from "@pixi/sound";
	const sound: Promise<Sound>;
	export default sound;
}
