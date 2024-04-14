import {
	attackBounds,
	defenseBounds,
	initialAttackItems,
	initialDefenseItems,
	initialMana,
	initialManaItems,
	initialTimer,
	manaBounds,
	manaPointsBounds,
	fightDuration,
	attackApproachDuration,
	type Bounds,
	playerBounds,
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
	const left = Math.min(
		...bounds.polygon.points.filter((_, i) => i % 2 == 0),
	);
	const top = Math.min(...bounds.polygon.points.filter((_, i) => i % 2 == 1));
	const width =
		Math.max(...bounds.polygon.points.filter((_, i) => i % 2 == 0)) - left;
	const height =
		Math.max(...bounds.polygon.points.filter((_, i) => i % 2 == 1)) - top;
	for (let iteration = 0; iteration < 100; iteration++) {
		const position = {
			x: left + Math.random() * width,
			y: top + Math.random() * height,
		};
		if (!bounds.polygon.contains(position.x, position.y)) {
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
	addItem(player.items.defense, playerBounds, 1);
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
				pickAttackPair(game);
			}
			break;
		case "attackFight":
			game.timer -= deltaS;
			if (game.timer <= 0) {
				pickAttackPair(game);
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
			moveDefense(game);
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

const pickFighter = (items: Item[]): Item => {
	const a = items.find((item) => item.hp != item.strength);
	const b = items.toSorted((a, b) => b.position.x - a.position.x)[0];
	return a || b;
};

const cleanUp = (game: GameT) => {
	if (game.attackers) {
		const [playerAttacker, opponentAttacker] = game.attackers;
		playerAttacker.position = playerAttacker.tmpPosition;
		opponentAttacker.position = opponentAttacker.tmpPosition;
	}

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

const pickAttackPair = (game: GameT) => {
	cleanUp(game);
	if (
		game.player.items.attack.length == 0 ||
		game.opponent.items.attack.length == 0
	) {
		game.timer = -1;
		game.phase = "defenseFight";
		return;
	}
	game.timer = fightDuration + attackApproachDuration;
	game.phase = "attackFight";
	const playerAttacker = pickFighter(game.player.items.attack);
	const opponentAttacker = pickFighter(game.opponent.items.attack);
	game.attackers = [playerAttacker, opponentAttacker];
	const fightStrength = Math.min(playerAttacker.hp, opponentAttacker.hp);

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
		return;
	}

	const attacker =
		game.player.items.attack.length > 0 ? game.player : game.opponent;
	const defender =
		game.player.items.attack.length > 0 ? game.opponent : game.player;
	if (defender.items.defense.length == 0) {
		game.timer = -1;
		game.phase = "finish";
		return;
	}

	game.timer = fightDuration + attackApproachDuration;
	game.phase = "defenseFight";
	const fighter = pickFighter(attacker.items.attack);
	const shield = defender.items.defense[defender.items.defense.length - 1];
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
	if (game.timer <= fightDuration) {
		playerAttacker.nt = opponentAttacker.nt =
			(fightDuration - game.timer) / fightDuration;
		playerAttacker.state = playerAttacker.hp == 0 ? "fighting" : "visible";
		opponentAttacker.state =
			opponentAttacker.hp == 0 ? "fighting" : "visible";
		t = 1;
	} else {
		playerAttacker.state = "visible";
		opponentAttacker.state = "visible";
		t = Math.pow(
			1 - (game.timer - fightDuration) / attackApproachDuration,
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

const moveDefense = (game: GameT) => {
	if (!game.attackers) {
		return;
	}
	const [playerAttacker, opponentAttacker] = game.attackers;
	const deltaX =
		1920 - opponentAttacker.position.x - playerAttacker.position.x;
	const deltaY = opponentAttacker.position.y - playerAttacker.position.y;
	let t;
	if (game.timer <= fightDuration) {
		playerAttacker.nt = opponentAttacker.nt =
			(fightDuration - game.timer) / fightDuration;
		playerAttacker.state = playerAttacker.hp == 0 ? "fighting" : "visible";
		opponentAttacker.state = "fighting";
		t = 1;
	} else {
		playerAttacker.state = "visible";
		t = Math.pow(
			1 - (game.timer - fightDuration) / attackApproachDuration,
			2,
		);
	}
	playerAttacker.tmpPosition = {
		x: playerAttacker.position.x + t * deltaX,
		y: playerAttacker.position.y + t * deltaY,
	};
};

const canBuy = (game: GameT, player: Player) => {
	return player.mana.length > 0 && game.phase === "buildUp";
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
	if (!canBuy(game, player) || player.items.defense.length == 17) {
		return;
	}
	player.mana.pop();
	const strength = [2, 3, 4][Math.floor(Math.random() * 3)];
	addItem(player.items.defense, defenseBounds, strength);
};
