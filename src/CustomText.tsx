import { type ReactNode } from "react";
import { Sprite } from "@pixi/react";
import { Font } from "./assets";
import type { Point } from "./gameLogic";

export const CustomText = ({
	text,
	position,
}: {
	text: string;
	position: Point;
}) => {
	const scale = 0.4;
	const kerning = 10;
	const space = 30;
	const result: ReactNode[] = [];
	let { x, y } = position;
	text.split("").forEach((char, i) => {
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
		const texture = Font.textures[char];
		if (!texture) {
			console.error(`Missing character ${char}`);
			return;
		}
		result.push(
			<Sprite
				anchor={[0, 1]}
				key={i}
				texture={texture}
				scale={scale}
				position={[x, y]}
			/>,
		);
		x += (texture.width + kerning) * scale;
	});
	return result;
};
