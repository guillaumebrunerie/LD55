export const initialMana = 0;
export const initialManaItems = [];
export const initialDefenseItems = [1, 1, 1];
export const initialAttackItems = [];

export const initialTimer = 30;

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
	y: 20,
	width: 300,
	height: 700,
};
