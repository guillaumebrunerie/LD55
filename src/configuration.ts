import { Polygon } from "pixi.js";

export const initialMana = 5;
export const initialManaItems = [];
export const initialDefenseItems = Array(16)
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
	polygon: Polygon;
};

export const manaPointsBounds: Bounds = {
	polygon: new Polygon([
		20, 20, 20, 310, 121, 332, 311, 267, 168, 225, 309, 179, 436, 151, 508,
		252, 541, 185, 503, 116, 571, 142, 585, 195, 601, 186, 599, 128, 652,
		114, 654, 60, 708, 20,
	]),
};

export const defenseBounds: Bounds = {
	polygon: new Polygon([411, 404, 411, 641, 386, 640, 386, 422]),
};

export const manaBounds: Bounds = {
	polygon: new Polygon([24, 733, 241, 780, 465, 719, 711, 857, 20, 862]),
};

export const attackBounds: Bounds = {
	polygon: new Polygon([
		850, 211, 723, 174, 496, 294, 353, 310, 348, 593, 850, 850,
	]),
};
