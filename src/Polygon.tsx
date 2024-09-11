import type { PointData } from "pixi.js";
import { type ComponentProps, useCallback } from "react";

type PolygonProps = Omit<ComponentProps<"graphics">, "draw"> & {
	polygon: PointData[];
	alpha: number;
};

type Draw = ComponentProps<"graphics">["draw"];

export const PolygonShape = ({ polygon, alpha, ...rest }: PolygonProps) => {
	const draw = useCallback<Draw>(
		(g) => {
			g.clear();
			g.poly(polygon);
			g.fill({ color: 0xff00ff, alpha });
		},
		[polygon, alpha],
	);

	return <graphics {...rest} draw={draw} />;
};
