import {
	initialAttackItems,
	initialDefenseItems,
	initialMana,
	initialManaItems,
	initialTimer,
	itemCost,
} from "./configuration";

type Player = {
	mana: number;
	items: {
		mana: number[];
		defense: number[];
		attack: number[];
	};
};

const newPlayer = (): Player => ({
	mana: initialMana,
	items: {
		mana: initialManaItems,
		defense: initialDefenseItems,
		attack: initialAttackItems,
	},
});

export const newGame = (isGameOver = false) => ({
	isGameOver,
	timer: initialTimer,
	player: newPlayer(),
	opponent: newPlayer(),
});

export type GameT = ReturnType<typeof newGame>;

export const startGame = (game: GameT) => {
	game.isGameOver = false;
};

const manaRate = (game: GameT) => {
	return game.player.items.mana.length + 1; // Mana per second
};

export const tickGame = (game: GameT, _gameOver: () => void, delta: number) => {
	if (game.isGameOver) {
		return;
	}
	const deltaS = delta / 60;
	game.timer -= deltaS;
	if (game.timer <= 0) {
		game.timer = 0;
		return;
	}
	game.player.mana += deltaS * manaRate(game);
};

export const buyManaItem = (game: GameT) => {
	if (game.player.mana < itemCost) {
		return;
	}
	game.player.mana -= itemCost;
	game.player.items.mana.push(1);
};

export const buyAttackItem = (game: GameT) => {
	if (game.player.mana < itemCost) {
		return;
	}
	game.player.mana -= itemCost;
	game.player.items.attack.push(1);
};

export const buyDefenseItem = (game: GameT) => {
	if (game.player.mana < itemCost) {
		return;
	}
	game.player.mana -= itemCost;
	game.player.items.defense.push(1);
};
