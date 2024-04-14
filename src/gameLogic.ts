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
		hasBoughtDefense: boolean;
	};
};

const delta = 150;

let ITERATION_COUNT = 100;

const addItem = (
	array: Item[],
	bounds: Bounds,
	strength: number,
	props?: Partial<Item>,
) => {
	const { left, top, width, height, polygon } = bounds;
	let bestPosition = {
		x: left + Math.random() * width,
		y: top + Math.random() * height,
	};
	let bestDistance = 0;
	for (let iteration = 0; iteration < ITERATION_COUNT; iteration++) {
		const position = {
			x: left + Math.random() * width,
			y: top + Math.random() * height,
		};
		if (!polygon.contains(position.x, position.y)) {
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
			hasBoughtDefense: false,
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

const opponentMove = (game: GameT, opponent: Player, strategy: Strategy) => {
	while (opponent.mana.length > 0) {
		const type = strategy(game, opponent, game.player);

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
				opponentMove(game, game.opponent, randomStrategy);
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
		playerAttacker.position =
			playerAttacker.tmpPosition || playerAttacker.position;
		opponentAttacker.position =
			opponentAttacker.tmpPosition || opponentAttacker.position;
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
	let hasFought = false;
	while (fighter.hp > 0 && defender.items.defense.length > 0) {
		const shield =
			defender.items.defense[defender.items.defense.length - 1];
		game.attackers = [fighter, shield];
		const superShield =
			defender.items.defense.length == 2 ||
			defender.items.defense.length == 17;
		if (superShield) {
			fighter.hp = 0;
			if (!hasFought) {
				shield.hp = 0;
				defender.items.defense = defender.items.defense.filter(
					(item) => item.hp > 0,
				);
			}
			break;
		} else {
			shield.hp = 0;
			defender.items.defense = defender.items.defense.filter(
				(item) => item.hp > 0,
			);
			fighter.hp--;
		}
		hasFought = true;
	}
};

const nextRound = (game: GameT) => {
	game.phase = "buildUp";
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
	game.player.items.hasBoughtDefense = false;
	game.opponent.items.hasBoughtDefense = false;
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
	if (!canBuy(game, player) || player.mana.length == 0) {
		return;
	}
	player.mana.pop();
	// player.mana.pop();
	let strength = Math.random() < 0.6 ? 2 : 1;
	// if (player.items.attack.length > 5 && player.items.hasBoughtDefense) {
	// 	strength = 1;
	// }
	// if (player.items.mana.length > 10) {
	// 	strength = 1;
	// }
	addItem(player.items.mana, manaBounds, strength);
};

export const buyAttackItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.mana.pop();
	let strength;
	if (Math.random() < 0.5) {
		strength = 1;
	} else if (
		Math.random() < 0.5 ||
		// false
		(player.items.mana.length > 0 && player.items.hasBoughtDefense)
	) {
		strength = 2;
	} else {
		strength = 3;
	}
	addItem(player.items.attack, attackBounds, strength);
};

export const buyDefenseItem = (game: GameT, player: Player) => {
	if (
		!canBuy(game, player) ||
		player.items.defense.length >= 17 // ||
		// player.mana.length == 1
	) {
		return;
	}
	player.mana.pop();
	player.items.hasBoughtDefense = true;
	addItem(player.items.defense, defenseBounds, 4);
	if (player.items.attack.length > 0 && player.items.mana.length > 0) {
		return;
	}
	if (
		player.items.defense.length > 1 &&
		player.items.defense.length < 17 &&
		Math.random() < 0.5
	) {
		addItem(player.items.defense, defenseBounds, 4);
		if (player.items.defense.length < 17 && Math.random() < 0.5) {
			addItem(player.items.defense, defenseBounds, 4);
			// if (player.items.defense.length < 17 && Math.random() < 0.4) {
			// 	addItem(player.items.defense, defenseBounds, 4);
			// }
		}
	}
};

type Strategy = { strategy: string } & ((
	game: GameT,
	player: Player,
	opponent: Player,
) => "mana" | "attack" | "defense");

const attackStrategy: Strategy = () => {
	if (Math.random() < 0.8) {
		return "attack";
	} else if (Math.random() < 0.5) {
		return "mana";
	} else {
		return "defense";
	}
};
attackStrategy.strategy = "Attack ";

const manaStrategy: Strategy = () => {
	if (Math.random() < 0.8) {
		return "mana";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "defense";
	}
};
manaStrategy.strategy = "Mana   ";

const defenseStrategy: Strategy = () => {
	if (Math.random() < 0.8) {
		return "defense";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "mana";
	}
};
defenseStrategy.strategy = "Defense";

const randomStrategy: Strategy = () => {
	if (Math.random() < 1 / 3) {
		return "defense";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "mana";
	}
};
randomStrategy.strategy = "Random ";

export const testStrategiesOnce = (
	strategy1: Strategy,
	strategy2: Strategy,
) => {
	const playStrategy = (
		strategy: Strategy,
		game: GameT,
		player: Player,
		opponent: Player,
	) => {
		while (player.mana.length > 0) {
			const type = strategy(game, player, opponent);
			switch (type) {
				case "mana":
					buyManaItem(game, player);
					break;
				case "attack":
					buyAttackItem(game, player);
					break;
				case "defense":
					buyDefenseItem(game, player);
					break;
			}
		}
	};
	const playRound = (game: GameT) => {
		do {
			pickAttackPair(game);
		} while (game.phase === "attackFight");
		do {
			pickDefensePair(game);
		} while (game.phase === "defenseFight");
	};
	const printPlayer = (player: Player, label: string) => {
		console.log(label, "flowers", player.items.mana.length);
		console.log(label, "runes", player.items.defense.length);
		console.log(label, "ghosts", player.items.attack.length);
	};

	const game = newGame();
	let round = 1;
	do {
		// console.log();
		// console.log("Round", round);
		round++;
		playStrategy(strategy1, game, game.player, game.opponent);
		playStrategy(strategy2, game, game.opponent, game.player);
		// printPlayer(game.player, "Player");
		// printPlayer(game.opponent, "Opponent");
		playRound(game);
		// printPlayer(game.player, "> Player");
		// printPlayer(game.opponent, "> Opponent");
		nextRound(game);
		// debugger;
	} while (
		game.player.items.attack.length == 0 &&
		game.opponent.items.attack.length == 0
	);
	if (game.player.items.attack.length > 0) {
		// console.log("Player wins");
		return { rounds: round, winner: "player" };
	} else {
		// console.log("Opponent wins");
		return { rounds: round, winner: "opponent" };
	}
};

const testStrategies = (strategy1: Strategy, strategy2: Strategy) => {
	let playerWins = 0;
	let opponentWins = 0;
	let totalRounds = 0;
	ITERATION_COUNT = 0;
	for (let i = 0; i < 1000; i++) {
		const { rounds, winner } = testStrategiesOnce(strategy1, strategy2);
		if (winner === "player") {
			playerWins++;
		} else {
			opponentWins++;
		}
		totalRounds += rounds;
	}
	ITERATION_COUNT = 100;
	console.log(
		`${strategy1.strategy} wins: ${playerWins}, \t${strategy2.strategy} wins: ${opponentWins}, \tRounds: ${totalRounds / 1000}`,
	);
};

console.log("");
testStrategies(defenseStrategy, attackStrategy);
testStrategies(attackStrategy, manaStrategy);
testStrategies(manaStrategy, defenseStrategy);
testStrategies(attackStrategy, randomStrategy);
testStrategies(defenseStrategy, randomStrategy);
testStrategies(manaStrategy, randomStrategy);
console.log("");
// debugger;
