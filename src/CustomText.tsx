import { Text } from "@pixi/react";
import { TextStyle, type Text as TextT } from "pixi.js";
import type { Point } from "./utils";
import type { Ref } from "react";

export const CustomText = ({
	text,
	myRef,
	position,
	anchor,
	color,
}: {
	text: string;
	myRef?: Ref<TextT>;
	position?: Point;
	anchor?: [number, number] | number;
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
