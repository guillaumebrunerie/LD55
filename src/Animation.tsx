import { Spritesheet, Texture } from "pixi.js";

const duration = (spritesheet: Spritesheet, fps: number) =>
	((spritesheet.animations.animation?.length || 0) * 1000) / fps;

export const getFrame = (
	spritesheet: Spritesheet,
	fps: number,
	t: number,
	time: "hold" | "loop" | "remove" = "loop",
) => {
	const textures = spritesheet.animations.animation;
	switch (time) {
		case "loop":
			return textures?.[Math.floor((t * fps) / 1000) % textures.length];
		case "hold":
			return textures?.[
				Math.min(Math.floor((t * fps) / 1000), textures.length - 1)
			];
		case "remove": {
			const i = Math.floor((t * fps) / 1000);
			if (!textures || i >= textures.length) {
				return Texture.EMPTY;
			} else {
				return textures[i];
			}
		}
	}
};

export const getFrameMultiple = (
	spritesheet1: Spritesheet,
	fps1: number,
	spritesheet2: Spritesheet,
	fps2: number,
	t: number,
	time: "hold" | "loop" | "remove" = "loop",
) => {
	const d1 = duration(spritesheet1, fps1);
	if (t < d1) {
		return getFrame(spritesheet1, fps1, t, time);
	} else {
		return getFrame(spritesheet2, fps2, t - d1, time);
	}
};
