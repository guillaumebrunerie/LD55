import { TextStyle, type Text } from "pixi.js";
import type { ComponentProps, Ref } from "react";

export const CustomText = ({
	myRef,
	color,
	...rest
}: {
	myRef?: Ref<Text>;
	color?: string;
} & ComponentProps<"text">) => {
	return (
		<text
			ref={myRef}
			style={
				new TextStyle({
					fontFamily: "roboto condensed",
					fontSize: 50,
					fontWeight: "600",
					letterSpacing: 4,
					fill: color || "#FFFFFF",
				})
			}
			{...rest}
		/>
	);
};
