import {
	attackBounds,
	defenseBounds,
	initialAttackItems,
	initialDefenseItems,
	initialMana,
	initialManaItems,
	initialTimer,
	manaBounds,
	type Bounds,
} from "./configuration";

export type Item = {
	x: number;
	y: number;
};

type Player = {
	mana: number;
	items: {
		mana: Item[];
		defense: Item[];
		attack: Item[];
	};
};

const newItem = (bounds: Bounds): Item => ({
	x: bounds.x + Math.random() * bounds.width,
	y: bounds.y + Math.random() * bounds.height,
});

const newPlayer = (): Player => ({
	mana: initialMana,
	items: {
		mana: initialManaItems,
		defense: initialDefenseItems.map((_) => newItem(defenseBounds)),
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

export const itemCost = (game: GameT) => {
	const items = game.player.items;
	return (items.mana.length + items.attack.length + items.defense.length) / 3;
};

export const buyManaItem = (game: GameT) => {
	if (game.player.mana < itemCost(game)) {
		return;
	}
	game.player.mana -= itemCost(game);
	game.player.items.mana.push(newItem(manaBounds));
};

export const buyAttackItem = (game: GameT) => {
	if (game.player.mana < itemCost(game)) {
		return;
	}
	game.player.mana -= itemCost(game);
	game.player.items.attack.push(newItem(attackBounds));
};

export const buyDefenseItem = (game: GameT) => {
	if (game.player.mana < itemCost(game)) {
		return;
	}
	game.player.mana -= itemCost(game);
	game.player.items.defense.push(newItem(defenseBounds));
};
