import { Text, type _ReactPixi } from "@pixi/react";
import { TextStyle } from "pixi.js";
import type { Point } from "./utils";

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
					fontFamily: "roboto condensed",
					fontSize: 50,
					fontWeight: "400",
					fill: color || "#FFFFFF",
				})
			}
		/>
	);
};
