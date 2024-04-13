import {
	attackBounds,
	attackSpeed,
	defenseBounds,
	fightDuration,
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

export type Player = {
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
	phase: "buildUp" as "buildUp" | "attackFight" | "defenseFight" | "finish",
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

const manaRateIfMataItemBought = (player: Player) => {
	return player.items.mana.length + 1;
};

const opponentMove = (game: GameT, opponent: Player) => {
	if (opponent.mana < itemCost(opponent)) {
		return;
	}

	const timeLeft = game.timer;
	const scoreNoMana = opponent.mana + manaRate(opponent) * timeLeft;
	const scoreMana =
		opponent.mana -
		itemCost(opponent) +
		manaRateIfMataItemBought(opponent) * timeLeft;

	let type;
	if (scoreMana > scoreNoMana && Math.random() < 0.8) {
		type = "mana";
	} else {
		if (Math.random() > 0.2) {
			type = "attack";
		} else {
			type = "defense";
		}
	}

	switch (type) {
		case "mana":
			buyManaItem(game, opponent);
			break;
		case "attack":
			buyAttackItem(game, opponent);
			break;
		case "defense":
			buyDefenseItem(game, opponent);
			break;
	}
};

export const tickGame = (game: GameT, _gameOver: () => void, delta: number) => {
	if (game.isGameOver) {
		return;
	}
	const deltaS = delta / 60;
	game.timer -= deltaS;
	game.player.mana += deltaS * manaRate(game.player);
	game.opponent.mana += deltaS * manaRate(game.opponent);
	switch (game.phase) {
		case "buildUp":
			if (game.timer <= 0) {
				game.timer = fightDuration;
				game.phase = "attackFight";
				break;
			}
			opponentMove(game, game.opponent);
			break;
		case "attackFight":
			if (game.timer <= 0) {
				game.timer = fightDuration;
				game.phase = "defenseFight";
				doAttackFight(game);
				break;
			}
			moveAttack(game, deltaS);
			break;
		case "defenseFight":
			if (game.timer <= 0) {
				game.timer = fightDuration;
				game.phase = "finish";
				doDefenseFight(game);
				break;
			}
			moveAttack(game, deltaS);
			break;
		case "finish":
			if (game.timer <= 0) {
				game.timer = initialTimer;
				game.phase = "buildUp";
				break;
			}
			moveBackAttack(game, deltaS);
			break;
	}
	if (game.timer <= 0) {
		game.timer = 0;
		return;
	}
};

const moveAttack = (game: GameT, delta: number) => {
	const player = game.player;
	const opponent = game.opponent;
	for (const item of player.items.attack) {
		item.x += delta * attackSpeed;
	}
	for (const item of opponent.items.attack) {
		item.x += delta * attackSpeed;
	}
};

const moveBackAttack = (game: GameT, delta: number) => {
	const player = game.player;
	const opponent = game.opponent;
	for (const item of player.items.attack) {
		item.x -= delta * 2 * attackSpeed;
	}
	for (const item of opponent.items.attack) {
		item.x -= delta * 2 * attackSpeed;
	}
};

const attackItems = (attack: Item[], defense: Item[]) => {
	const attackCount = attack.length;
	const defenseCount = defense.length;
	const totalAttack = Math.min(attackCount, defenseCount);
	attack.splice(0, totalAttack);
	defense.splice(0, totalAttack);
};

const doAttackFight = (game: GameT) => {
	attackItems(game.player.items.attack, game.opponent.items.attack);
};

const doDefenseFight = (game: GameT) => {
	const attack = game.player.items.attack.length;
	const opponentAttack = game.opponent.items.attack.length;
	if (attack > 0) {
		attackItems(game.player.items.attack, game.opponent.items.defense);
	} else if (opponentAttack > 0) {
		attackItems(game.opponent.items.attack, game.player.items.defense);
	} else {
		console.error("Nobody attacks");
	}
};

export const itemCost = (player: Player) => {
	const items = player.items;
	return (items.mana.length + items.attack.length + items.defense.length) / 3;
};

const canBuy = (game: GameT, player: Player) => {
	return player.mana >= itemCost(player) && game.phase === "buildUp";
};

export const buyManaItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana -= itemCost(player);
	player.items.mana.push(newItem(manaBounds));
};

export const buyAttackItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana -= itemCost(player);
	player.items.attack.push(newItem(attackBounds));
};

export const buyDefenseItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana -= itemCost(player);
	player.items.defense.push(newItem(defenseBounds));
};
