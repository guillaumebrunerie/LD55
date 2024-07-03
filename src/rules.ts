import { attackBounds } from "./configuration";
import { pickPosition, type Point } from "./utils";

export const initialMana = 5;
export const initialDefense = 8;
export const maxDefense = 16;

export type MonsterData = {
	hp: number;
	strength: 1 | 2 | 3;
	position: Point;
};

type MushroomData = {
	strength: 1 | 2;
};

export type PlayerData = {
	mana: number;
	monsters: MonsterData[];
	mushrooms: MushroomData[];
	defense: number;
};

export const emptyPlayerData = (): PlayerData => ({
	mana: 0,
	monsters: [],
	mushrooms: [],
	defense: 0,
});

export const pickFighter = <T extends MonsterData>(items: T[]): T => {
	const a = items.find((item) => item.hp != item.strength);
	const b = items.toSorted((a, b) => b.position.x - a.position.x)[0];
	return a || b;
};

let TESTING = false;
export const setTesting = (value: boolean) => {
	TESTING = value;
};

export const pickMushroomData = (player: PlayerData): MushroomData => {
	const threshold = Math.min(0.75, 0.3 + player.mushrooms.length * 0.02);

	let strength: 1 | 2 = 1;
	if (Math.random() < threshold) {
		strength = 2;
	}
	return { strength };
};

const pickMonsterPosition = (player: PlayerData) => {
	if (TESTING) {
		return {
			x: Math.random() * 500,
			y: 0,
		};
	} else {
		return pickPosition(player.monsters, attackBounds, 150);
	}
};

const pickMonsterStrength = (player: PlayerData) => {
	const threshold = Math.min(0.75, 0.3 + player.monsters.length * 0.02);

	let strength: 1 | 2 | 3 = 1;
	if (Math.random() < threshold) {
		strength = 2;
		if (Math.random() < threshold) {
			strength = 3;
		}
	}
	return strength;
};

export const pickMonsterData = (player: PlayerData): MonsterData => {
	const position = pickMonsterPosition(player);
	const strength = pickMonsterStrength(player);
	return { position, strength, hp: strength };
};

export const pickDefenseData = (player: PlayerData) => {
	if (player.defense == 16) {
		return null;
	}

	const penalty = player.monsters.length + player.mushrooms.length;

	// if (player.monsters.length > 0 && player.mushrooms.length > 0) {
	// 	return { strength: 1 };
	// }

	// if (player.defense >= 13) {
	// 	return { strength: 16 - player.defense };
	// }

	const threshold = Math.min(0.75, 0.3 + player.defense * 0.02);
	// const threshold = 0.5; //  -
	// player.monsters.length * 0.02 -
	// player.mushrooms.length * 0.02 +
	// (player.defense - 8) * 0.03;

	let strength = 1;
	if (
		player.defense > 0 &&
		player.defense < 15 &&
		Math.random() < threshold &&
		penalty < 2
	) {
		strength++;
		if (player.defense < 14 && Math.random() < threshold && penalty < 4) {
			strength++;
		}
	}
	return { strength };
};
