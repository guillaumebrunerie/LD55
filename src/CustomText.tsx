import { Text } from "@pixi/react";
import { TextStyle, type Text as TextT } from "pixi.js";
import type { Point } from "./utils";
import type { Ref } from "react";

export const CustomText = ({
	myRef,
	text,
	position,
	anchor,
	color,
}: {
	myRef: Ref<TextT>;
	text: string;
	position: Point;
	anchor: [number, number];
	color?: string;
}) => {
	return (
		<Text
			ref={myRef}
			text={text}
			position={position}
			anchor={anchor}
			style={
				new TextStyle({
					fontFamily: "roboto condensed",
					fontSize: 50,
					fontWeight: "600",
					letterSpacing: 4,
					fill: color || "#FFFFFF",
				})
			}
		/>
	);
};
