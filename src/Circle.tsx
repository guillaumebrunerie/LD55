import { type ComponentProps, useCallback } from "react";

type CircleProps = Omit<ComponentProps<"graphics">, "draw"> & {
	x: number;
	y: number;
	radius: number;
	color?: number;
	alpha?: number;
};

type Draw = ComponentProps<"graphics">["draw"];

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
			g.circle(x, y, radius);
			g.fill({ color, alpha });
		},
		[x, y, radius, color, alpha],
	);

	return <graphics {...rest} draw={draw} />;
};
