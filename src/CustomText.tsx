import { Sprite, Text, type _ReactPixi } from "@pixi/react";
import { Font2Sheet } from "./assets";
import type { Point } from "./gameLogic";
import { TextStyle, type Texture } from "pixi.js";

export const CustomText = ({
	text,
	position,
	anchor,
}: {
	text: string;
	position: Point;
	anchor: [number, number];
}) => {
	return (
		<Text
			text={text}
			position={position}
			anchor={anchor}
			style={
				new TextStyle({
					fontFamily: "monospace",
					fontSize: 50,
					fontWeight: "bold",
					fill: "#FFFFFF",
				})
			}
		/>
	);

	const scale = 0.4;
	const kerning = 15;
	const space = 30;
	let x = 0;
	const letters: { texture: Texture; x: number }[] = [];
	text.split("").forEach((char) => {
		char = char.toUpperCase();
		if (char == ":") {
			char = "Collon";
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
		const texture = Font2Sheet.textures[`${char}.png`];
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
