export const initialMana = 5;
export const initialManaItems = [];
export const initialDefenseItems = [4, 4, 4, 4, 4];
export const initialAttackItems = [];

export const initialTimer = 10;
export const fightDuration = 3;
export const attackSpeed = 150;

export type Bounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export const defenseBounds: Bounds = {
	x: 20,
	y: 20,
	width: 300,
	height: 500,
};

export const manaBounds: Bounds = {
	x: 20,
	y: 600,
	width: 500,
	height: 300,
};

export const attackBounds: Bounds = {
	x: 400,
	y: 120,
	width: 300,
	height: 500,
};
