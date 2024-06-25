import { Graphics } from "@pixi/react";
import { type ComponentProps, useCallback } from "react";

type CircleProps = Parameters<typeof Graphics>[0] & {
	x: number;
	y: number;
	radius: number;
	color?: number;
	alpha?: number;
};

type Draw = NonNullable<ComponentProps<typeof Graphics>["draw"]>;

export const Circle = ({
	x,
	y,
	radius,
	color = 0xff00ff,
	alpha = 1,
	...rest
}: CircleProps) => {
	const draw = useCallback<Draw>(
		(g) => {
			g.clear();
			g.beginFill(color, alpha);
			g.drawCircle(x, y, radius);
			g.endFill();
		},
		[x, y, radius, color, alpha],
	);

	return <Graphics draw={draw} {...rest} />;
};
