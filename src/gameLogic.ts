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
		mana: initialManaItems.map((_) => newItem(manaBounds)),
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

const manaRate = (player: Player) => {
	return player.items.mana.length; // Mana per second
};

const opponentMove = (opponent: Player) => {
	if (opponent.mana < itemCost(opponent)) {
		return;
	}
	const type = ["mana", "attack", "defense"][Math.floor(Math.random() * 3)];
	switch (type) {
		case "mana":
			buyManaItem(opponent);
			break;
		case "attack":
			buyAttackItem(opponent);
			break;
		case "defense":
			buyDefenseItem(opponent);
			break;
	}
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
	game.player.mana += deltaS * manaRate(game.player);
	game.opponent.mana += deltaS * manaRate(game.opponent);
	opponentMove(game.opponent);
};

export const itemCost = (player: Player) => {
	const items = player.items;
	return (items.mana.length + items.attack.length + items.defense.length) / 3;
};

export const buyManaItem = (player: Player) => {
	if (player.mana < itemCost(player)) {
		return;
	}
	player.mana -= itemCost(player);
	player.items.mana.push(newItem(manaBounds));
};

export const buyAttackItem = (player: Player) => {
	if (player.mana < itemCost(player)) {
		return;
	}
	player.mana -= itemCost(player);
	player.items.attack.push(newItem(attackBounds));
};

export const buyDefenseItem = (player: Player) => {
	if (player.mana < itemCost(player)) {
		return;
	}
	player.mana -= itemCost(player);
	player.items.defense.push(newItem(defenseBounds));
};
