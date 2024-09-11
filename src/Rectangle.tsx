import { type ComponentProps, useCallback } from "react";

type RectangleProps = ComponentProps<"graphics"> & {
	x: number;
	y: number;
	width: number;
	height: number;
	alpha?: number;
};

type Draw = ComponentProps<"graphics">["draw"];

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
			g.rect(x, y, width, height);
			g.fill({ color: 0x222222, alpha });
		},
		[x, y, width, height, alpha],
	);

	return <graphics {...rest} draw={draw} />;
};
