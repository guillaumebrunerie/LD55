import { Sprite, type _ReactPixi } from "@pixi/react";
import { Font2Sheet } from "./assets";
import type { Point } from "./gameLogic";
import type { Texture } from "pixi.js";

export const CustomText = ({
	text,
	position,
	anchor,
}: {
	text: string;
	position: Point;
	anchor: [number, number];
}) => {
	const scale = 0.4;
	const kerning = 10;
	const space = 30;
	let x = 0;
	const letters: { texture: Texture; x: number }[] = [];
	text.split("").forEach((char) => {
		if (char == ":") {
			char = "collon";
		}
		if (char == ".") {
			char = "dot";
		}
		if (char == "!") {
			char = "ExMark";
		}
		if (char == " ") {
			x += space * scale;
			return;
		}
		const texture = Font2Sheet.textures[`${char.toUpperCase()}.png`];
		if (!texture) {
			console.error(`Missing character ${char}`);
			return;
		}
		letters.push({
			texture,
			x,
		});
		x += (texture.width + kerning) * scale;
	});
	const width = x;

	const deltaX = position.x - width * anchor[0];

	return letters.map(({ texture, x }, i) => (
		<Sprite
			anchor={[0, anchor[1]]}
			key={i}
			texture={texture}
			scale={scale}
			position={[x + deltaX, position.y]}
		/>
	));
};
