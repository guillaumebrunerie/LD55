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
	manaPointsBounds,
	phase1Duration,
	phase2Duration,
	phase3Duration,
	type Bounds,
} from "./configuration";

export type Point = {
	x: number;
	y: number;
};

export type Item = {
	position: Point;
	tmpPosition?: Point;
	strength: number;
	hp: number;
	state: "visible" | "hidden" | "fighting";
	nt?: number;
	scale?: number;
};

export type Player = {
	mana: Item[];
	items: {
		mana: Item[];
		defense: Item[];
		attack: Item[];
	};
};

const delta = 150;

const addItem = (
	array: Item[],
	bounds: Bounds,
	strength: number,
	props?: Partial<Item>,
) => {
	let bestPosition = { x: 0, y: 0 };
	let bestDistance = 0;
	const left =
		bounds.x ??
		Math.min(...bounds.polygon.points.filter((_, i) => i % 2 == 0));
	const top =
		bounds.y ??
		Math.min(...bounds.polygon.points.filter((_, i) => i % 2 == 1));
	const width =
		bounds.width ??
		Math.max(...bounds.polygon.points.filter((_, i) => i % 2 == 0)) - left;
	const height =
		bounds.height ??
		Math.max(...bounds.polygon.points.filter((_, i) => i % 2 == 1)) - top;
	for (let iteration = 0; iteration < 100; iteration++) {
		const position = {
			x: left + Math.random() * width,
			y: top + Math.random() * height,
		};
		if (
			bounds.polygon &&
			!bounds.polygon.contains(position.x, position.y)
		) {
			continue;
		}
		const distance = Math.min(
			...array.map((item) => {
				const dx = item.position.x - position.x;
				const dy = item.position.y - position.y;
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
		position: bestPosition,
		strength,
		hp: strength,
		state: "visible",
		...props,
	});
};

const newPlayer = (): Player => {
	const player: Player = {
		mana: [],
		items: {
			mana: [],
			defense: [],
			attack: [],
		},
	};
	addManaPoints(player, initialMana);
	for (const manaItem of initialManaItems) {
		addItem(player.items.mana, manaBounds, manaItem);
	}
	for (const defenseItem of initialDefenseItems) {
		addItem(player.items.defense, defenseBounds, defenseItem);
	}
	for (const attackItem of initialAttackItems) {
		addItem(player.items.attack, attackBounds, attackItem);
	}
	return player;
};

const addManaPoints = (player: Player, points: number) => {
	for (let i = 0; i < points; i++) {
		addItem(player.mana, manaPointsBounds, 1, {
			scale: 0.7 + Math.random() * 0.3,
		});
	}
};

export type GameT = {
	isGameOver: boolean;
	phase: "buildUp" | "attackFight" | "defenseFight" | "finish";
	timer: number;
	player: Player;
	opponent: Player;
	attackers?: [Item, Item];
};

export const newGame = (isGameOver = false): GameT => ({
	isGameOver,
	phase: "buildUp" as "buildUp" | "attackFight" | "defenseFight" | "finish",
	timer: initialTimer,
	player: newPlayer(),
	opponent: newPlayer(),
});

export const startGame = (game: GameT) => {
	game.isGameOver = false;
};

// const manaRate = (player: Player) => {
// 	return player.items.mana.length; // Mana per second
// };

// const manaRateIfMataItemBought = (player: Player) => {
// 	return player.items.mana.length + 1;
// };

const opponentMove = (
	game: GameT,
	opponent: Player,
	manaChance: number,
	attackChance: number,
) => {
	while (opponent.mana.length > 0) {
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
			if (game.player.mana.length == 0) {
				opponentMove(game, game.opponent, 0.25, 0.75);
				pickFightingPair(game);
			}
			break;
		case "attackFight":
			game.timer -= deltaS;
			if (game.timer <= 0) {
				pickFightingPair(game);
				break;
			}
			moveAttack(game);
			break;
		case "defenseFight":
			game.timer -= deltaS;
			if (game.timer <= 0) {
				pickDefensePair(game);
				break;
			}
			moveAttack(game);
			break;
		case "finish":
			game.timer -= deltaS;
			if (game.timer <= 0) {
				game.timer = initialTimer;
				game.phase = "buildUp";
				nextRound(game);
				break;
			}
			// moveBackAttack(game, deltaS);
			break;
	}
};

const pickFighter = (items: Item[]) => {
	return (
		items.find((item) => item.hp != item.strength) ||
		items[Math.floor(Math.random() * items.length)]
	);
};

const cleanUp = (game: GameT) => {
	game.player.items.attack = game.player.items.attack.filter(
		(item) => item.hp > 0,
	);
	game.opponent.items.attack = game.opponent.items.attack.filter(
		(item) => item.hp > 0,
	);
	game.player.items.defense = game.player.items.defense.filter(
		(item) => item.hp > 0,
	);
	game.opponent.items.defense = game.opponent.items.defense.filter(
		(item) => item.hp > 0,
	);
};

const pickFightingPair = (game: GameT) => {
	cleanUp(game);
	if (
		game.player.items.attack.length == 0 ||
		game.opponent.items.attack.length == 0
	) {
		game.timer = -1;
		game.phase = "defenseFight";
		console.log("NOT fighting");
		return;
	}
	game.timer = phase1Duration + phase2Duration + phase3Duration;
	game.phase = "attackFight";
	console.log("Fighting");
	const playerAttacker = pickFighter(game.player.items.attack);
	const opponentAttacker = pickFighter(game.opponent.items.attack);
	game.attackers = [playerAttacker, opponentAttacker];
	const fightStrength = Math.min(playerAttacker.hp, opponentAttacker.hp);

	// playerAttacker.hp =
	// 	playerAttacker.hp == fightStrength ? 0 : playerAttacker.hp;
	// opponentAttacker.hp =
	// 	opponentAttacker.hp == fightStrength ? 0 : opponentAttacker.hp;

	playerAttacker.hp -= fightStrength;
	opponentAttacker.hp -= fightStrength;
};

const pickDefensePair = (game: GameT) => {
	cleanUp(game);
	if (
		game.player.items.attack.length == 0 &&
		game.opponent.items.attack.length == 0
	) {
		game.timer = -1;
		game.phase = "finish";
		console.log("NOT defending");
		return;
	}

	const attacker =
		game.player.items.attack.length > 0 ? game.player : game.opponent;
	const defender =
		game.player.items.attack.length > 0 ? game.opponent : game.player;
	if (defender.items.defense.length == 0) {
		game.timer = -1;
		game.phase = "finish";
		console.log("Game over");
		return;
	}

	game.timer = phase1Duration + phase2Duration + phase3Duration;
	game.phase = "defenseFight";
	console.log("Fighting");
	const fighter = pickFighter(attacker.items.attack);
	const shield = defender.items.defense[0];
	game.attackers = [fighter, shield];
	fighter.hp = 0;
	shield.hp = 0;
};

const nextRound = (game: GameT) => {
	game.player.mana = [];
	addManaPoints(
		game.player,
		initialMana +
			game.player.items.mana.reduce(
				(acc, item) => acc + item.strength,
				0,
			),
	);
	game.opponent.mana = [];
	addManaPoints(
		game.opponent,
		initialMana +
			game.opponent.items.mana.reduce(
				(acc, item) => acc + item.strength,
				0,
			),
	);
	game.player.items.mana = [];
	game.opponent.items.mana = [];
};

const moveAttack = (game: GameT) => {
	if (!game.attackers) {
		return;
	}
	const [playerAttacker, opponentAttacker] = game.attackers;
	const deltaX =
		(1920 - opponentAttacker.position.x - playerAttacker.position.x) / 2;
	const deltaY =
		(opponentAttacker.position.y - playerAttacker.position.y) / 2;
	let t;
	if (game.timer <= phase1Duration) {
		playerAttacker.state = playerAttacker.hp == 0 ? "hidden" : "visible";
		opponentAttacker.state =
			opponentAttacker.hp == 0 ? "hidden" : "visible";
		t = Math.pow(game.timer / phase1Duration, 2);
	} else if (game.timer <= phase1Duration + phase2Duration) {
		playerAttacker.state = "fighting";
		playerAttacker.nt =
			(phase1Duration + phase2Duration - game.timer) / phase2Duration;
		opponentAttacker.state = "hidden";
		t = 1;
	} else {
		playerAttacker.state = "visible";
		opponentAttacker.state = "visible";
		t =
			1 -
			Math.pow(
				(game.timer - phase1Duration - phase2Duration) / phase3Duration,
				2,
			);
	}
	playerAttacker.tmpPosition = {
		x: playerAttacker.position.x + t * deltaX,
		y: playerAttacker.position.y + t * deltaY,
	};
	opponentAttacker.tmpPosition = {
		x: opponentAttacker.position.x + t * deltaX,
		y: opponentAttacker.position.y - t * deltaY,
	};
};

// const moveAttack = (game: GameT, delta: number) => {
// 	const player = game.player;
// 	const opponent = game.opponent;
// 	for (const item of player.items.attack) {
// 		item.x += delta * attackSpeed;
// 	}
// 	for (const item of opponent.items.attack) {
// 		item.x += delta * attackSpeed;
// 	}
// };

// const moveBackAttack = (game: GameT, delta: number) => {
// 	const player = game.player;
// 	const opponent = game.opponent;
// 	for (const item of player.items.attack) {
// 		item.x -= delta * 2 * attackSpeed;
// 	}
// 	for (const item of opponent.items.attack) {
// 		item.x -= delta * 2 * attackSpeed;
// 	}
// };

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

// const doAttackFight = (game: GameT) => {
// 	attackItems(game.player.items.attack, game.opponent.items.attack);
// };

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

// const clearDefense = (game: GameT) => {
// 	game.player.items.defense = [];
// 	game.opponent.items.defense = [];
// };

export const itemCost = (_player: Player) => {
	return 1;
	// const items = player.items;
	// return (items.mana.length + items.attack.length + items.defense.length) / 3;
};

const canBuy = (game: GameT, player: Player) => {
	return player.mana.length >= itemCost(player) && game.phase === "buildUp";
};

export const buyManaItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana.pop();
	const strength = [1, 2][Math.floor(Math.random() * 2)];
	addItem(player.items.mana, manaBounds, strength);
};

export const buyAttackItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana.pop();
	const strength = [2, 3, 4][Math.floor(Math.random() * 3)];
	addItem(player.items.attack, attackBounds, strength);
};

export const buyDefenseItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana.pop();
	const strength = [2, 3, 4][Math.floor(Math.random() * 3)];
	addItem(player.items.defense, defenseBounds, strength);
};
