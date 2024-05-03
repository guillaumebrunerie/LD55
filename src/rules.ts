import type { Point } from "./gameLogic";

export const initialMana = 5;
export const initialDefense = 8;
export const maxDefense = 16;

type Monster = {
	hp: number;
	strength: number;
	position: Point;
};

export const pickFighter = <T extends Monster>(items: T[]): T => {
	const a = items.find((item) => item.hp != item.strength);
	const b = items.toSorted((a, b) => b.position.x - a.position.x)[0];
	return a || b;
};
