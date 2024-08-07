import { Polygon } from "pixi.js";

export const fightDuration = 0.15;
export const attackApproachDuration = 0.25;
export const lastAttackApproachDuration = 0.35;

export type Bounds = {
	left: number;
	top: number;
	width: number;
	height: number;
	polygon: Polygon;
};

const makeBounds = (polygon: Polygon): Bounds => {
	const left = Math.min(...polygon.points.filter((_, i) => i % 2 == 0));
	const top = Math.min(...polygon.points.filter((_, i) => i % 2 == 1));
	const width =
		Math.max(...polygon.points.filter((_, i) => i % 2 == 0)) - left;
	const height =
		Math.max(...polygon.points.filter((_, i) => i % 2 == 1)) - top;

	return { left, top, width, height, polygon };
};

export const manaPointsBounds = makeBounds(
	new Polygon([
		20, 20, 20, 310, 121, 332, 311, 267, 168, 225, 309, 179, 436, 151, 508,
		252, 541, 185, 503, 116, 571, 142, 585, 195, 601, 186, 599, 128, 652,
		114, 654, 60, 708, 20,
	]),
);

export const shieldImpactBounds = makeBounds(
	new Polygon([411, 404, 411, 641, 386, 640, 386, 422]),
);

export const chestBounds = makeBounds(
	new Polygon([251, 467, 256, 532, 206, 527, 217, 470]),
);

export const feetBounds = makeBounds(
	new Polygon([191, 629, 189, 656, 261, 668, 258, 637]),
);

export const manaBounds = makeBounds(
	new Polygon([24, 733, 241, 780, 465, 719, 711, 857, 20, 862]),
);

export const attackBounds = makeBounds(
	new Polygon([850, 211, 723, 174, 496, 294, 453, 310, 448, 593, 850, 850]),
);
