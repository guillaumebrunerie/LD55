import { Graphics } from "@pixi/react";
import type { Polygon as PolygonT } from "pixi.js";
import { type ComponentProps, useCallback } from "react";

type PolygonProps = Parameters<typeof Graphics>[0] & {
	polygon: PolygonT;
	alpha: number;
};

type Draw = NonNullable<ComponentProps<typeof Graphics>["draw"]>;

export const PolygonShape = ({ polygon, alpha, ...rest }: PolygonProps) => {
	const draw = useCallback<Draw>(
		(g) => {
			g.clear();
			g.beginFill(0xff00ff, alpha);
			g.drawPolygon(polygon);
			g.endFill();
		},
		[polygon, alpha],
	);

	return <Graphics draw={draw} {...rest} />;
};
