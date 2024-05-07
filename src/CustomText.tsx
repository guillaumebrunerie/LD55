import { Text, type _ReactPixi } from "@pixi/react";
import type { Point } from "./gameLogic";
import { TextStyle } from "pixi.js";

export const CustomText = ({
	text,
	position,
	anchor,
	color,
}: {
	text: string;
	position: Point;
	anchor: [number, number];
	color?: string;
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
					fill: color || "#FFFFFF",
				})
			}
		/>
	);
};
