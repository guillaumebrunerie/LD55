import { Graphics } from "@pixi/react";
import { type ComponentProps, useCallback } from "react";

type RectangleProps = Parameters<typeof Graphics>[0] & {
	x: number;
	y: number;
	width: number;
	height: number;
	alpha?: number;
};

type Draw = NonNullable<ComponentProps<typeof Graphics>["draw"]>;

export const Rectangle = ({
	x,
	y,
	width,
	height,
	alpha = 1,
	...rest
}: RectangleProps) => {
	const draw = useCallback<Draw>(
		(g) => {
			g.clear();
			g.beginFill(0x222222, alpha);
			g.drawRect(x, y, width, height);
			g.endFill();
		},
		[x, y, width, height, alpha],
	);

	return <Graphics draw={draw} {...rest} />;
};
