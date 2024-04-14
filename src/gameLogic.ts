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
	lt: number;
	position: Point;
	tmpPosition?: Point;
	strength: number;
	hp: number;
	state: "visible" | "hidden" | "fighting" | "preSpawning" | "spawning";
	nt?: number;
	scale?: number;
	offset?: number;
};

type Buys = {
	mana: number;
	attack: number;
	defense: number;
};

export type Player = {
	mana: Item[];
	items: {
		mana: Item[];
		defense: Item[];
		attack: Item[];
	};
	boughtThisRound: Buys;
	boughtPreviousRound: Buys;
};

const delta = 150;

let ITERATION_COUNT = 100;

const spawnManaPoint = (
	array: Item[],
	bounds: Bounds,
	strength: number,
	manaPoint: Item,
	props?: Partial<Item>,
) => {
	addItem(array, bounds, strength, {
		...props,
		tmpPosition: manaPoint?.position,
		manaPoint,
		state: "spawning",
		lt: 0,
		nt: 0,
	});
};

const spawnItem = (
	array: Item[],
	bounds: Bounds,
	strength: number,
	manaPoint: Item,
	props?: Partial<Item>,
) => {
	addItem(array, bounds, strength, {
		...props,
		tmpPosition: manaPoint?.position,
		manaPoint,
		state: "preSpawning",
	});
};

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
		lt: 0,
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
		boughtThisRound: {
			mana: 0,
			attack: 0,
			defense: 0,
		},
		boughtPreviousRound: {
			mana: 0,
			attack: 0,
			defense: 0,
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

const rebuildManaPoint = (player: Player) => {
	if (player.mana.length < initialMana) {
		spawnManaPoint(player.mana, manaPointsBounds, 1, null, {
			scale: 0.7 + Math.random() * 0.3,
			offset: Math.random() * 2 * Math.PI,
		});
	} else if (player.items.mana.length > 0) {
		const item = player.items.mana.pop() as Item;
		for (let i = 0; i < item.strength; i++) {
			spawnManaPoint(player.mana, manaPointsBounds, 1, item, {
				scale: 0.7 + Math.random() * 0.3,
				offset: Math.random() * 2 * Math.PI,
			});
		}
	}
};

const addManaPoints = (player: Player) => {
	for (let i = 0; i < initialMana; i++) {
		addItem(player.mana, manaPointsBounds, 1, {
			scale: 0.7 + Math.random() * 0.3,
			offset: Math.random() * 2 * Math.PI,
		});
	}
};

export type GameT = {
	isGameOver: boolean;
	phase: "buildUp" | "toAttack" | "attack" | "defense" | "rebuild" | "finish";
	nt: number;
	lt: number;
	timer: number;
	player: Player;
	opponent: Player;
	attackers?: [Item, Item];
};

export const newGame = (isGameOver = false): GameT => ({
	isGameOver,
	phase: "buildUp" as "buildUp" | "attack" | "defense" | "finish",
	nt: 0,
	lt: 0,
	timer: initialTimer,
	player: newPlayer(),
	opponent: newPlayer(),
});

export const startGame = (game: GameT) => {
	game.isGameOver = false;
};

const opponentMove = (game: GameT, opponent: Player, strategy: Strategy) => {
	while (opponent.mana.length > 0) {
		const type = strategy(
			game.opponent.boughtPreviousRound,
			game.player.boughtPreviousRound,
			game.opponent.items,
		);

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

const toAttackDuration = 0.5;
const rebuildDuration = 0.2;

export const tickGame = (game: GameT, _gameOver: () => void, delta: number) => {
	if (game.isGameOver) {
		return;
	}
	game.lt += delta;
	tickItems(game.player, delta);
	switch (game.phase) {
		case "buildUp":
			// if (game.timer <= 0) {
			// 	game.timer = fightDuration;
			// 	game.phase = "attack";
			// 	break;
			// }
			// opponentMove(game, game.player, 0.4);
			// opponentMove(game, game.opponent, 0.6);
			if (
				game.player.mana.length == 0 &&
				areAllItemsVisible(game.player)
			) {
				game.lt = 0;
				game.nt = 0;
				opponentMove(game, game.opponent, smartStrategy);
				game.phase = "toAttack";
			}
			break;
		case "toAttack":
			game.nt = game.lt / toAttackDuration;
			if (game.lt >= toAttackDuration) {
				game.lt = 0;
				game.nt = 0;
				pickAttackPair(game);
			}
			break;
		case "attack":
			game.timer -= delta;
			if (game.timer <= 0) {
				pickAttackPair(game);
				break;
			}
			moveAttack(game);
			break;
		case "defense":
			game.timer -= delta;
			if (game.timer <= 0) {
				pickDefensePair(game);
				break;
			}
			moveDefense(game);
			break;
		case "rebuild":
			game.nt = game.lt / rebuildDuration;
			if (game.lt >= rebuildDuration) {
				if (hasManaToSpawn(game.player)) {
					rebuildManaPoint(game.player);
					game.lt = 0;
				} else {
					game.timer = initialTimer;
					game.phase = "buildUp";
				}
				break;
			}
			break;
		case "finish":
			game.timer -= delta;
			if (game.timer <= 0) {
				game.timer = initialTimer;
				game.phase = "buildUp";
				break;
			}
			// moveBackAttack(game, deltaS);
			break;
	}
};

const tickItems = (player: Player, delta: number) => {
	for (const item of player.items.attack) {
		tickItem(item, delta);
	}
	for (const item of player.items.mana) {
		tickItem(item, delta);
	}
	for (const item of player.items.defense) {
		tickItem(item, delta);
	}
	for (const item of player.mana) {
		tickManaItem(item, delta);
	}
};

const areAllItemsVisible = (player: Player) => {
	return (
		player.items.attack.every((item) => item.state == "visible") &&
		player.items.defense.every((item) => item.state == "visible") &&
		player.items.mana.every((item) => item.state == "visible")
	);
};

const preSpawnDuration = 0.2;
const spawnDuration = 0.3;

const tickItem = (item: Item, delta: number) => {
	item.lt += delta;
	switch (item.state) {
		case "preSpawning": {
			if (item.lt >= preSpawnDuration) {
				item.state = "spawning";
				item.lt = 0;
				item.tmpPosition = undefined;
				break;
			}
			const nt = item.lt / preSpawnDuration;
			if (!item.manaPoint) {
				item.tmpPosition = item.position;
			} else {
				item.tmpPosition = {
					x:
						item.manaPoint.position.x +
						(item.position.x - item.manaPoint.position.x) * nt,
					y:
						item.manaPoint.position.y +
						(item.position.y - item.manaPoint.position.y) * nt,
				};
			}
			break;
		}
		case "spawning": {
			if (item.lt >= spawnDuration) {
				item.state = "visible";
				item.lt = 0;
				break;
			}
		}
	}
};

const manaSpawnDuration = 0.5;
const tickManaItem = (item: Item, delta: number) => {
	item.lt += delta;
	switch (item.state) {
		case "spawning": {
			item.nt = item.lt / manaSpawnDuration;
			if (item.lt >= manaSpawnDuration) {
				item.state = "visible";
				item.lt = 0;
				item.tmpPosition = undefined;
				break;
			}
			const nt = Math.max((item.lt - 0.2) / (manaSpawnDuration - 0.2), 0);
			if (!item.manaPoint) {
				item.tmpPosition = item.position;
			} else {
				item.tmpPosition = {
					x:
						item.manaPoint.position.x +
						(item.position.x - item.manaPoint.position.x) * nt,
					y:
						item.manaPoint.position.y +
						(item.position.y - item.manaPoint.position.y) * nt,
				};
			}
			break;
		}
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
	for (const item of game.player.items.defense) {
		if (item.state == "fighting") {
			item.state = "visible";
		}
	}
	for (const item of game.opponent.items.defense) {
		if (item.state == "fighting") {
			item.state = "visible";
		}
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
		game.phase = "defense";
		return;
	}
	game.timer = fightDuration + attackApproachDuration;
	game.phase = "attack";
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
		game.lt = 0;
		game.nt = 0;
		game.phase = "rebuild";
		nextRound(game);
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
	game.phase = "defense";
	const fighter = pickFighter(attacker.items.attack);
	let hasFought = false;
	while (fighter.hp > 0 && defender.items.defense.length > 0) {
		const shield =
			defender.items.defense[defender.items.defense.length - 1];
		game.attackers = [fighter, shield];
		const i = defender.items.defense.length;
		const superShield = i == 2 || i == 17;
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

const hasManaToSpawn = (player: Player) => {
	return player.mana.length < initialMana || player.items.mana.length > 0;
};

const nextRound = (game: GameT) => {
	game.player.boughtPreviousRound = game.player.boughtThisRound;
	game.opponent.boughtPreviousRound = game.opponent.boughtThisRound;
	game.player.boughtThisRound = {
		mana: 0,
		attack: 0,
		defense: 0,
	};
	game.opponent.boughtThisRound = {
		mana: 0,
		attack: 0,
		defense: 0,
	};
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
	player.boughtThisRound.mana++;
	const manaPoint = player.mana.pop();
	const strength = Math.random() < 0.6 ? 2 : 1;
	if (player == game.player) {
		spawnItem(player.items.mana, manaBounds, strength, manaPoint);
	} else {
		addItem(player.items.mana, manaBounds, strength);
	}
};

export const buyAttackItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	player.boughtThisRound.attack++;
	const manaPoint = player.mana.pop();
	let strength;
	if (Math.random() < 0.5) {
		strength = 1;
	} else if (
		Math.random() < 0.5 ||
		// false
		(player.items.mana.length > 0 && player.boughtThisRound.defense > 0)
	) {
		strength = 2;
	} else {
		strength = 3;
	}
	if (player == game.player) {
		spawnItem(player.items.attack, attackBounds, strength, manaPoint);
	} else {
		addItem(player.items.attack, attackBounds, strength);
	}
};

export const buyDefenseItem = (game: GameT, player: Player) => {
	if (
		!canBuy(game, player) ||
		player.items.defense.length >= 17 // ||
		// player.mana.length == 1
	) {
		return;
	}
	player.boughtThisRound.defense++;
	const manaPoint = player.mana.pop();
	const add = () => {
		if (player == game.player) {
			spawnItem(player.items.defense, defenseBounds, 4, manaPoint);
		} else {
			addItem(player.items.defense, defenseBounds, 4);
		}
	};
	add();
	if (player.items.attack.length > 0 && player.items.mana.length > 0) {
		return;
	}
	if (
		player.items.defense.length > 1 &&
		player.items.defense.length < 17 &&
		Math.random() < 0.5
	) {
		add();
		// addItem(player.items.defense, defenseBounds, 4);
		if (player.items.defense.length < 17 && Math.random() < 0.5) {
			add();
			// addItem(player.items.defense, defenseBounds, 4);
			// if (player.items.defense.length < 17 && Math.random() < 0.4) {
			// 	addItem(player.items.defense, defenseBounds, 4);
			// }
		}
	}
};

type Strategy = { strategy: string } & ((
	buys: Buys,
	opponentBuys: Buys,
	items: {
		mana: Item[];
		attack: Item[];
		defense: Item[];
	},
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

const smartStrategy: Strategy = (buys, opponentBuys, items) => {
	if (
		opponentBuys.attack >= opponentBuys.mana + 1 &&
		opponentBuys.attack >= opponentBuys.defense + 1
	) {
		return defenseStrategy(buys, opponentBuys, items);
	}
	if (
		opponentBuys.mana >= opponentBuys.attack + 1 &&
		opponentBuys.mana >= opponentBuys.defense + 1
	) {
		return attackStrategy(buys, opponentBuys, items);
	}
	return manaStrategy(buys, opponentBuys, items);
};
smartStrategy.strategy = "Smart  ";

const smart2Strategy: Strategy = (buys, opponentBuys, items) => {
	if (items.defense.length < 4) {
		return defenseStrategy(buys, opponentBuys, items);
	} else {
		return smartStrategy(buys, opponentBuys, items);
	}
};
smart2Strategy.strategy = "Smart2 ";

const naturalStrategy: Strategy = (buys, opponentBuys, items) => {
	// console.log(JSON.stringify(buys));
	if (buys.attack >= buys.mana + 1 && buys.attack >= buys.defense + 1) {
		return attackStrategy(buys, opponentBuys, items);
	}
	if (buys.mana >= buys.attack + 1 && buys.mana >= buys.defense + 1) {
		return manaStrategy(buys, opponentBuys, items);
	}
	if (buys.defense >= buys.attack + 1 && buys.defense >= buys.mana + 1) {
		return defenseStrategy(buys, opponentBuys, items);
	}
	return randomStrategy(buys, opponentBuys, items);
};
naturalStrategy.strategy = "Natural";

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
			const type = strategy(
				player.boughtPreviousRound,
				opponent.boughtPreviousRound,
				player.items,
			);
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
		} while (game.phase === "attack");
		do {
			pickDefensePair(game);
		} while (game.phase === "defense");
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

// console.log("");
// testStrategies(defenseStrategy, attackStrategy);
// testStrategies(attackStrategy, manaStrategy);
// testStrategies(manaStrategy, defenseStrategy);
// testStrategies(attackStrategy, randomStrategy);
// testStrategies(defenseStrategy, randomStrategy);
// testStrategies(manaStrategy, randomStrategy);
// testStrategies(smartStrategy, randomStrategy);
// testStrategies(smartStrategy, defenseStrategy);
// testStrategies(smartStrategy, attackStrategy);
// testStrategies(smartStrategy, manaStrategy);
// testStrategies(smart2Strategy, randomStrategy);
// testStrategies(smart2Strategy, defenseStrategy);
// testStrategies(smart2Strategy, attackStrategy);
// testStrategies(smart2Strategy, manaStrategy);
// testStrategies(smart2Strategy, smartStrategy);
// console.log("");
// // debugger;
