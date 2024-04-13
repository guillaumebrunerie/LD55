import {
	attackBounds,
	attackSpeed,
	defenseBounds,
	fightDuration,
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
	strength: number;
};

export type Player = {
	mana: number;
	items: {
		mana: Item[];
		defense: Item[];
		attack: Item[];
	};
};

const delta = 150;

const addItem = (array: Item[], bounds: Bounds, strength: number) => {
	let bestPosition = { x: 0, y: 0 };
	let bestDistance = 0;
	for (let iteration = 0; iteration < 100; iteration++) {
		const position = {
			x: bounds.x + Math.random() * bounds.width,
			y: bounds.y + Math.random() * bounds.height,
		};
		const distance = Math.min(
			...array.map((item) => {
				const dx = item.x - position.x;
				const dy = item.y - position.y;
				return Math.sqrt(dx * dx + dy * dy);
			}),
		);
		if (distance > delta) {
			bestPosition = position;
			bestDistance = distance;
			break;
		} else if (distance > bestDistance) {
			bestPosition = position;
			bestDistance = distance;
		}
	}
	array.push({
		...bestPosition,
		strength,
	});
};

const newPlayer = (): Player => {
	const player: Player = {
		mana: initialMana,
		items: {
			mana: [],
			defense: [],
			attack: [],
		},
	};
	for (const manaItem of initialManaItems) {
		addItem(player.items.mana, manaBounds, manaItem);
	}
	for (const defenseItem of initialDefenseItems) {
		addItem(player.items.defense, defenseBounds, defenseItem);
	}
	return player;
};

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

const opponentMove = (
	game: GameT,
	opponent: Player,
	manaChance: number,
	attackChance: number,
) => {
	while (opponent.mana > 0) {
		let type;
		if (Math.random() < manaChance) {
			type = "mana";
		} else if (Math.random() < attackChance) {
			type = "attack";
		} else {
			type = "defense";
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
	}
};

// const opponentMove = (game: GameT, opponent: Player, defenseChance: number) => {
// 	if (opponent.mana < itemCost(opponent)) {
// 		return;
// 	}

// 	const timeLeft = game.timer;
// 	const scoreNoMana = opponent.mana + manaRate(opponent) * timeLeft;
// 	const scoreMana =
// 		opponent.mana -
// 		itemCost(opponent) +
// 		manaRateIfMataItemBought(opponent) * timeLeft;

// 	let type;
// 	if (scoreMana > scoreNoMana && Math.random() < 0.8) {
// 		type = "mana";
// 	} else {
// 		if (Math.random() > defenseChance) {
// 			type = "attack";
// 		} else {
// 			type = "defense";
// 		}
// 	}

// 	switch (type) {
// 		case "mana":
// 			buyManaItem(game, opponent);
// 			break;
// 		case "attack":
// 			buyAttackItem(game, opponent);
// 			break;
// 		case "defense":
// 			buyDefenseItem(game, opponent);
// 			break;
// 	}
// };

export const tickGame = (game: GameT, _gameOver: () => void, delta: number) => {
	if (game.isGameOver) {
		return;
	}
	const deltaS = delta / 60;
	// game.player.mana += deltaS * manaRate(game.player);
	// game.opponent.mana += deltaS * manaRate(game.opponent);
	switch (game.phase) {
		case "buildUp":
			// if (game.timer <= 0) {
			// 	game.timer = fightDuration;
			// 	game.phase = "attackFight";
			// 	break;
			// }
			// opponentMove(game, game.player, 0.4);
			// opponentMove(game, game.opponent, 0.6);
			if (game.player.mana == 0) {
				opponentMove(game, game.opponent, 0.2, 0.5);
				game.timer = fightDuration;
				game.phase = "attackFight";
			}
			break;
		case "attackFight":
			game.timer -= deltaS;
			if (game.timer <= 0) {
				game.timer = fightDuration;
				game.phase = "defenseFight";
				doAttackFight(game);
				break;
			}
			moveAttack(game, deltaS);
			break;
		case "defenseFight":
			game.timer -= deltaS;
			if (game.timer <= 0) {
				game.timer = fightDuration;
				game.phase = "finish";
				doDefenseFight(game);
				break;
			}
			moveAttack(game, deltaS);
			break;
		case "finish":
			game.timer -= deltaS;
			if (game.timer <= 0) {
				game.timer = initialTimer;
				game.phase = "buildUp";
				nextRound(game);
				break;
			}
			moveBackAttack(game, deltaS);
			break;
	}
};

const nextRound = (game: GameT) => {
	game.player.mana =
		initialMana +
		game.player.items.mana.reduce((acc, item) => acc + item.strength, 0);
	game.opponent.mana =
		initialMana +
		game.opponent.items.mana.reduce((acc, item) => acc + item.strength, 0);
	game.player.items.mana = [];
	game.opponent.items.mana = [];
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

const shaveItems = (items: Item[], strength: number) => {
	let removedStrength = 0;
	while (items.length > 0 && removedStrength < strength) {
		const item = items.shift();
		if (!item) {
			break;
		}
		removedStrength += item.strength;
	}
};

const attackItems = (attack: Item[], defense: Item[]) => {
	const attackStrength = attack.reduce((acc, item) => acc + item.strength, 0);
	const defenseStrength = defense.reduce(
		(acc, item) => acc + item.strength,
		0,
	);
	const strength = Math.min(attackStrength, defenseStrength);
	shaveItems(attack, strength);
	shaveItems(defense, strength);
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

const clearDefense = (game: GameT) => {
	game.player.items.defense = [];
	game.opponent.items.defense = [];
};

export const itemCost = (_player: Player) => {
	return 1;
	// const items = player.items;
	// return (items.mana.length + items.attack.length + items.defense.length) / 3;
};

const canBuy = (game: GameT, player: Player) => {
	return player.mana >= itemCost(player) && game.phase === "buildUp";
};

export const buyManaItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana -= itemCost(player);
	const strength = [1, 2][Math.floor(Math.random() * 2)];
	addItem(player.items.mana, manaBounds, strength);
};

export const buyAttackItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana -= itemCost(player);
	const strength = [2, 3, 4][Math.floor(Math.random() * 3)];
	addItem(player.items.attack, attackBounds, strength);
};

export const buyDefenseItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana -= itemCost(player);
	const strength = [2, 3, 4][Math.floor(Math.random() * 3)];
	addItem(player.items.defense, defenseBounds, strength);
};
