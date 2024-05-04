import { attackBounds } from "./configuration";
import type { Point } from "./gameLogic";
import { pickPosition } from "./utils";

export const initialMana = 5;
export const initialDefense = 8;
export const maxDefense = 16;

type MonsterData = {
	hp: number;
	strength: 1 | 2 | 3;
	position: Point;
};

export const pickFighter = <T extends MonsterData>(items: T[]): T => {
	const a = items.find((item) => item.hp != item.strength);
	const b = items.toSorted((a, b) => b.position.x - a.position.x)[0];
	return a || b;
};

type MushroomData = {
	strength: 1 | 2;
};

export const pickMushroomData = (): MushroomData => {
	return { strength: Math.random() < 0.6 ? 2 : 1 };
};

export type PlayerData = {
	monsters: MonsterData[];
	mushrooms: MushroomData[];
	defense: number;
	boughtThisRound: {
		defense: number;
	};
};

export const pickMonsterData = (player: PlayerData): MonsterData => {
	const position = pickPosition(player.monsters, attackBounds, 150);

	if (Math.random() < 0.5) {
		return { position, strength: 1, hp: 1 };
	} else if (
		Math.random() < 0.5 ||
		(player.mushrooms.length > 0 && player.boughtThisRound.defense > 0)
	) {
		return { position, strength: 2, hp: 2 };
	} else {
		return { position, strength: 3, hp: 3 };
	}
};

export const pickDefenseData = (player: PlayerData) => {
	if (player.defense == 16) {
		return null;
	}
	if (player.monsters.length > 0 && player.mushrooms.length > 0) {
		return { strength: 1 };
	}
	let strength = 1;
	if (player.defense > 0 && player.defense < 15 && Math.random() < 0.5) {
		strength++;
		if (player.defense < 14 && Math.random() < 0.5) {
			strength++;
		}
	}
	return { strength };
};
