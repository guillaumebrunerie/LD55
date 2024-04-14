import { Polygon } from "pixi.js";

export const initialMana = 5;
export const initialManaItems = [];
export const initialDefenseItems = Array(8)
	.fill(null)
	.map(() => 2);
export const initialAttackItems = Array(0)
	.fill(null)
	.map(() => [2, 3, 4][Math.floor(Math.random() * 3)]);

export const initialTimer = 10;
export const attackSpeed = 150;

const factor = 1;
export const fightDuration = 0.15 * factor;
export const attackApproachDuration = 0.3 * factor;

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

export const defenseBounds = makeBounds(
	new Polygon([411, 404, 411, 641, 386, 640, 386, 422]),
);

export const manaBounds = makeBounds(
	new Polygon([24, 733, 241, 780, 465, 719, 711, 857, 20, 862]),
);

export const attackBounds = makeBounds(
	new Polygon([850, 211, 723, 174, 496, 294, 453, 310, 448, 593, 850, 850]),
);

export const playerBounds = makeBounds(
	new Polygon([193, 625, 251, 626, 254, 439, 217, 436]),
);
