import {
	appearButton,
	disappearButton,
	newButton,
	tickButton,
	type ButtonT,
} from "./button";
import {
	attackBounds,
	shieldImpactBounds,
	initialAttackItems,
	initialDefenseItems,
	initialMana,
	initialManaItems,
	manaBounds,
	manaPointsBounds,
	fightDuration,
	attackApproachDuration,
	type Bounds,
	playerBounds,
	feetBounds,
	chestBounds,
} from "./configuration";
import {
	hideCurtain,
	showCurtain,
	newCurtain,
	tickCurtain,
	type Curtain,
} from "./curtain";
import { wave } from "./ease";
import {
	areIdle,
	changeState,
	newEntity,
	schedule,
	tick,
	type Entity,
} from "./entities";
import { smartStrategy, type Strategy } from "./strategies";
import {
	actWizardWhenBuying,
	appearWizard,
	dieWizard,
	newWizard,
	tickWizard,
	winWizard,
	type WizardT,
} from "./wizard";

export type Point = {
	x: number;
	y: number;
};

type ItemState = "visible" | "hidden" | "fighting" | "preSpawning" | "spawning";
export type Item = Entity<ItemState> & {
	position: Point;
	tmpPosition?: Point;
	strength: number;
	hp: number;
	scale?: number;
	offset?: number;
	previousItem?: Item;
	hidden?: boolean;
};

export type Buys = {
	mana: number;
	attack: number;
	defense: number;
};

export type Player = Entity<""> & {
	wizard: WizardT;
	mana: Item[];
	items: {
		mana: Item[];
		defense: Item[];
		attack: Item[];
	};
	boughtThisRound: Buys;
	boughtPreviousRound: Buys;
};

const tickPlayer = tick<"", Player>(() => ({}));

const delta = 150;

const spawnItem = (
	array: Item[],
	bounds: Bounds,
	strength: number,
	manaPoint: Item | undefined,
	hidden: boolean,
) => {
	const position = pickPosition(array, bounds, delta);
	array.push({
		...newEntity("preSpawning", [
			{
				duration: preSpawnDuration,
				state: "spawning",
			},
			{
				duration: spawnDuration,
				state: "visible",
			},
		]),
		position,
		strength,
		hp: strength,
		tmpPosition: manaPoint?.position,
		previousItem: manaPoint,
		hidden,
	});
};

const ITERATION_COUNT = 100;

const pickPosition = (array: Item[], bounds: Bounds, delta: number) => {
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
	return bestPosition;
};

const addItem = (
	array: Item[],
	bounds: Bounds,
	strength: number,
	props?: Partial<Item>,
) => {
	const position = pickPosition(array, bounds, delta);
	array.push({
		lt: 0,
		nt: 0,
		position,
		strength,
		hp: strength,
		state: "visible",
		transitions: [],
		...props,
	});
};

const newPlayer = (): Player => {
	const player: Player = {
		...newEntity(""),
		wizard: newWizard(),
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
	// addManaPoints(player);
	// for (const manaItem of initialManaItems) {
	// 	addItem(player.items.mana, manaBounds, manaItem);
	// }
	addItem(player.items.defense, playerBounds, 1);
	for (const defenseItem of initialDefenseItems) {
		addItem(player.items.defense, feetBounds, defenseItem);
	}
	// for (const attackItem of initialAttackItems) {
	// 	addItem(player.items.attack, attackBounds, attackItem);
	// }
	return player;
};

const spawnManaPoint = (
	player: Player,
	previousItem: Item | undefined = undefined,
) => {
	const position = pickPosition(player.mana, manaPointsBounds, delta);

	player.mana.push({
		...newEntity("spawning", [
			{
				duration: manaSpawnDuration,
				state: "visible",
			},
		]),
		scale: 0.7 + Math.random() * 0.3,
		offset: Math.random() * 2 * Math.PI,
		previousItem,
		position,
		strength: 1,
		hp: 1,
	});
};

const rebuildManaPoint = (player: Player) => {
	if (player.mana.length < initialMana) {
		spawnManaPoint(player);
		// spawnManaPoint(player.mana, manaPointsBounds, 1, undefined, {
		// 	scale: 0.7 + Math.random() * 0.3,
		// 	offset: Math.random() * 2 * Math.PI,
		// });
	} else if (player.items.mana.length > 0) {
		const item = player.items.mana.pop() as Item;
		for (let i = 0; i < item.strength; i++) {
			spawnManaPoint(player, item);
			// spawnManaPoint(player.mana, manaPointsBounds, 1, item, {
			// 	scale: 0.7 + Math.random() * 0.3,
			// 	offset: Math.random() * 2 * Math.PI,
			// });
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
	while (player.items.mana.length > 0) {
		const item = player.items.mana.pop() as Item;
		for (let i = 0; i < item.strength; i++) {
			addItem(player.mana, manaPointsBounds, 1, {
				scale: 0.7 + Math.random() * 0.3,
				offset: Math.random() * 2 * Math.PI,
			});
		}
	}
};

type GameState =
	| "intro"
	| "transition"
	| "buildUp"
	| "toAttack"
	| "attack"
	| "defense"
	| "rebuild"
	| "gameover"
	| "restart";

export type GameT = Entity<GameState> & {
	player: Player;
	opponent: Player;
	attackers?: [Item, Item];
	curtain: Curtain;
	startButton: ButtonT;
	manaButton: ButtonT;
	attackButton: ButtonT;
	defenseButton: ButtonT;
};

export const newGame = (state: "intro" | "restart"): GameT => ({
	...newEntity(state),
	player: newPlayer(),
	opponent: newPlayer(),
	curtain: newCurtain(),
	startButton: newButton("idle"),
	manaButton: newButton("hidden"),
	attackButton: newButton("hidden"),
	defenseButton: newButton("hidden"),
});

export const startGame = (game: GameT) => {
	if (game.state == "gameover") {
		restartGame(game);
		return;
	}
	changeState(game, "transition");
	disappearButton(game.startButton);
	appearWizard(game.opponent.wizard);
	appearWizard(game.player.wizard);
	schedule(showCurtain, game.curtain, 0.7);
	schedule(appearButton, game.manaButton, 1.2);
	schedule(appearButton, game.attackButton, 1.2);
	schedule(appearButton, game.defenseButton, 1.2);

	for (let i = 0; i < 5; i++) {
		schedule(spawnManaPoint, game.player, i == 0 ? 1.2 : 0.2);
		schedule(spawnManaPoint, game.opponent, i == 0 ? 1.2 : 0.2);
	}
};

const restartGame = (game: GameT) => {
	changeState(game, "restart");
	disappearButton(game.startButton);
	for (const player of [game.player, game.opponent]) {
		if (player.wizard.state == "die") {
			appearWizard(player.wizard);
		} else {
			changeState(player.wizard, "idle");
		}
	}
	schedule(showCurtain, game.curtain, 0.7);
	schedule(appearButton, game.manaButton, 1.2);
	schedule(appearButton, game.attackButton, 1.2);
	schedule(appearButton, game.defenseButton, 1.2);

	for (let i = 0; i < 5; i++) {
		schedule(spawnManaPoint, game.player, i == 0 ? 1.2 : 0.2);
		schedule(spawnManaPoint, game.opponent, i == 0 ? 1.2 : 0.2);
	}
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

// const startAttack = (game: GameT) => {};

// export const tickGame = tick<GameState, GameT>((game: GameT, delta) => {
// 	tickItems(game, game.player, delta);
// 	tickWizard(game.wizard, delta);
// 	tickCurtain(game.curtain, delta);
// 	return {
// 		buildUp: () => {
// 			if (
// 				game.player.mana.length == 0 &&
// 				areAllItemsVisible(game.player)
// 			) {
// 				opponentMove(game, game.opponent, attackStrategy);
// 				changeState(game, "toAttack", {
// 					duration: toAttackDuration,
// 					state: "attack",
// 				});
// 				hideCurtain(game.curtain);
// 			}
// 		},
// 	};
// });

const toAttackDuration = 0.5;
const rebuildDuration = 0.2;

export const tickGame = (game: GameT, delta: number) => {
	game.lt += delta;
	tickItems(game, game.player, delta);
	tickWizard(game.player.wizard, delta);
	tickWizard(game.opponent.wizard, delta);
	tickCurtain(game.curtain, delta);
	tickButton(game.startButton, delta);
	tickButton(game.manaButton, delta);
	tickButton(game.attackButton, delta);
	tickButton(game.defenseButton, delta);
	tickPlayer(game.player, delta);
	tickPlayer(game.opponent, delta);
	switch (game.state) {
		case "transition":
		case "restart":
			if (
				areIdle(
					game.player.wizard,
					game.opponent.wizard,
					game.curtain,
					game.startButton,
					game.manaButton,
					game.attackButton,
					game.defenseButton,
				)
			) {
				changeState(game, "buildUp");
			}
			break;
		case "buildUp":
			if (
				game.player.mana.length == 0 &&
				areAllItemsVisible(game.player)
			) {
				game.lt = 0;
				game.nt = 0;
				opponentMove(game, game.opponent, smartStrategy);
				game.state = "toAttack";
				hideCurtain(game.curtain);
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
		case "attack": {
			if (game.lt >= attackApproachDuration + fightDuration) {
				pickAttackPair(game);
				break;
			}
			moveAttack(game);
			break;
		}
		case "defense": {
			const duration =
				isFinalHitGame(game) ?
					attackApproachDuration
				:	fightDuration + attackApproachDuration;
			if (game.lt >= duration) {
				pickDefensePair(game);
				break;
			}
			moveDefense(game);
			break;
		}
		case "rebuild":
			game.nt = game.lt / rebuildDuration;
			if (game.lt >= rebuildDuration) {
				if (hasManaToSpawn(game.player)) {
					rebuildManaPoint(game.player);
					game.lt = 0;
				} else {
					game.lt = 0;
					game.state = "buildUp";
					nextRound(game);
				}
				break;
			}
			break;
	}
};

const tickItems = (game: GameT, player: Player, delta: number) => {
	for (const item of game.opponent.items.attack) {
		if (game.state == "attack" || game.state == "defense") {
			item.position.x += delta * 25;
		}
	}
	for (const item of player.items.attack) {
		if (game.state == "attack" || game.state == "defense") {
			item.position.x += delta * 25;
		}
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

const tickItem = tick<ItemState, Item>((item) => {
	return {
		preSpawning: () => {
			if (!item.previousItem) {
				item.tmpPosition = item.position;
			} else {
				const prevPos = item.previousItem.position;
				item.tmpPosition = {
					x: prevPos.x + (item.position.x - prevPos.x) * item.nt,
					y: prevPos.y + (item.position.y - prevPos.y) * item.nt,
				};
			}
		},
		spawning: () => {
			item.tmpPosition = undefined;
		},
	};
});

// const tickItem = (item: Item, delta: number) => {
// 	item.lt += delta;
// 	switch (item.state) {
// 		case "fighting":
// 			item.nt = item.lt / (fightDuration + attackApproachDuration);
// 			break;
// 		case "preSpawning": {
// 			if (item.lt >= preSpawnDuration) {
// 				item.state = "spawning";
// 				item.lt = 0;
// 				item.tmpPosition = undefined;
// 				break;
// 			}
// 			const nt = item.lt / preSpawnDuration;
// 			if (!item.previousItem) {
// 				item.tmpPosition = item.position;
// 			} else {
// 				item.tmpPosition = {
// 					x:
// 						item.previousItem.position.x +
// 						(item.position.x - item.previousItem.position.x) * nt,
// 					y:
// 						item.previousItem.position.y +
// 						(item.position.y - item.previousItem.position.y) * nt,
// 				};
// 			}
// 			break;
// 		}
// 		case "spawning": {
// 			if (item.lt >= spawnDuration) {
// 				item.state = "visible";
// 				item.lt = 0;
// 				break;
// 			}
// 		}
// 	}
// };

const manaSpawnDuration = 0.5;

const tickManaItem = tick<ItemState, Item>((item) => {
	return {
		visible: () => {
			item.tmpPosition = undefined;
		},
		spawning: () => {
			const nt = Math.max((item.lt - 0.2) / (manaSpawnDuration - 0.2), 0);
			if (!item.previousItem) {
				item.tmpPosition = item.position;
			} else {
				item.tmpPosition = {
					x:
						item.previousItem.position.x +
						(item.position.x - item.previousItem.position.x) * nt,
					y:
						item.previousItem.position.y +
						(item.position.y - item.previousItem.position.y) * nt,
				};
			}
		},
	};
});

// const tickManaItem = (item: Item, delta: number) => {
// 	item.lt += delta;
// 	switch (item.state) {
// 		case "spawning": {
// 			item.nt = item.lt / manaSpawnDuration;
// 			if (item.lt >= manaSpawnDuration) {
// 				item.state = "visible";
// 				item.lt = 0;
// 				item.tmpPosition = undefined;
// 				break;
// 			}
// 			const nt = Math.max((item.lt - 0.2) / (manaSpawnDuration - 0.2), 0);
// 			if (!item.previousItem) {
// 				item.tmpPosition = item.position;
// 			} else {
// 				item.tmpPosition = {
// 					x:
// 						item.previousItem.position.x +
// 						(item.position.x - item.previousItem.position.x) * nt,
// 					y:
// 						item.previousItem.position.y +
// 						(item.position.y - item.previousItem.position.y) * nt,
// 				};
// 			}
// 			break;
// 		}
// 	}
// };

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
		game.state = "defense";
		game.lt = 0;
		pickDefensePair(game);
		return;
	}
	game.state = "attack";
	game.lt = 0;
	const playerAttacker = pickFighter(game.player.items.attack);
	const opponentAttacker = pickFighter(game.opponent.items.attack);
	game.attackers = [playerAttacker, opponentAttacker];
	const fightStrength = Math.min(playerAttacker.hp, opponentAttacker.hp);

	playerAttacker.hp -= fightStrength;
	opponentAttacker.hp -= fightStrength;

	return;
};

const lastShield = (player: Player) => {
	return player.items.defense.findLast((item) => item.hp > 0);
};

const isFinalHit = (player: Player) => {
	return player.items.defense.filter((item) => item.hp > 0).length <= 1;
};

const isFinalHitGame = (game: GameT) => {
	const defender =
		game.player.items.attack.length > 0 ? game.opponent : game.player;
	return defender.items.defense.filter((item) => item.hp > 0).length == 0;
};

const pickDefensePair = (game: GameT) => {
	cleanUp(game);
	if (
		game.player.items.attack.length == 0 &&
		game.opponent.items.attack.length == 0
	) {
		game.lt = 0;
		game.nt = 0;
		game.state = "rebuild";
		showCurtain(game.curtain);
		return;
	}

	const attacker =
		game.player.items.attack.length > 0 ? game.player : game.opponent;
	const defender =
		game.player.items.attack.length > 0 ? game.opponent : game.player;
	if (defender.items.defense.length == 0) {
		dieWizard(defender.wizard);
		winWizard(attacker.wizard);
		appearButton(game.startButton);
		runeTombola()(attacker);
		game.state = "gameover";
		game.lt = 0;
		game.nt = 0;
		return;
	}

	game.state = "defense";
	game.lt = 0;
	game.nt = 0;
	const fighter = pickFighter(attacker.items.attack);
	let hasFought = false;
	while (fighter.hp > 0) {
		const shield = lastShield(defender);
		if (!shield) {
			break;
		}
		game.attackers = [fighter, shield];
		shield.position = pickPosition(
			defender.items.defense,
			isFinalHit(defender) ? chestBounds : shieldImpactBounds,
			0,
		);
		const i = defender.items.defense.filter((i) => i.hp > 0).length;
		const superShield = i == 2 || i == 17;
		if (superShield) {
			fighter.hp = 0;
			if (!hasFought) {
				shield.hp = 0;
			}
			break;
		} else {
			shield.hp = 0;
			fighter.hp--;
		}
		hasFought = true;
	}
};

const pickTombola = (previous: number[]) => {
	const next = [];
	const tombola = Array(16).fill(false);
	for (let i = 0; i < 4; i++) {
		const v = [1, 2, 3, 4].filter((x) => x !== previous[i])[
			Math.floor(Math.random() * 3)
		];
		next.push(v);
		tombola[v + i * 4] = true;
	}
	return { next, tombola };
};

export const runeTombola =
	(previous: number[] = [1, 2, 3, 1]) =>
	(player: Player) => {
		player.items.defense = [];
		const { tombola, next } = pickTombola(previous);
		for (let i = 0; i < 17; i++) {
			addItem(player.items.defense, feetBounds, 4, {
				invisible: i == 1 ? false : !tombola[i],
			});
		}
		schedule(runeTombola(next), player, 0.12);
	};

const hasManaToSpawn = (player: Player) => {
	return player.mana.length < initialMana || player.items.mana.length > 0;
};

const nextRound = (game: GameT) => {
	addManaPoints(game.opponent);
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
	if (game.lt <= attackApproachDuration) {
		playerAttacker.state = "visible";
		opponentAttacker.state = "visible";
		t = wave(game.lt / attackApproachDuration);
	} else {
		playerAttacker.nt = opponentAttacker.nt =
			(game.lt - attackApproachDuration) / fightDuration;
		playerAttacker.state = playerAttacker.hp == 0 ? "fighting" : "visible";
		opponentAttacker.state =
			opponentAttacker.hp == 0 ? "fighting" : "visible";
		t = 1;
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
	if (game.lt <= attackApproachDuration) {
		playerAttacker.state = "visible";
		t = Math.pow(game.lt / attackApproachDuration, 2);
	} else {
		playerAttacker.nt = opponentAttacker.nt =
			(game.lt - attackApproachDuration) / fightDuration;
		playerAttacker.state = playerAttacker.hp == 0 ? "fighting" : "visible";
		opponentAttacker.state = "fighting";
		t = 1;
	}
	playerAttacker.tmpPosition = {
		x: playerAttacker.position.x + t * deltaX,
		y: playerAttacker.position.y + t * deltaY,
	};
};

const canBuy = (game: GameT, player: Player) => {
	return player.mana.length > 0 && game.state === "buildUp";
};

export const buyManaItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player) || player.mana.length == 0) {
		return;
	}
	actWizardWhenBuying(game, player);
	player.boughtThisRound.mana++;
	const manaPoint = player.mana.pop();
	const strength = Math.random() < 0.6 ? 2 : 1;
	if (player == game.player) {
		spawnItem(player.items.mana, manaBounds, strength, manaPoint, false);
	} else {
		addItem(player.items.mana, manaBounds, strength);
	}
};

export const buyAttackItem = (game: GameT, player: Player) => {
	if (!canBuy(game, player)) {
		return;
	}
	actWizardWhenBuying(game, player);
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
		spawnItem(
			player.items.attack,
			attackBounds,
			strength,
			manaPoint,
			false,
		);
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
	actWizardWhenBuying(game, player);
	player.boughtThisRound.defense++;
	const manaPoint = player.mana.pop();
	const add = (hidden: boolean) => {
		if (player == game.player) {
			spawnItem(player.items.defense, feetBounds, 4, manaPoint, hidden);
		} else {
			addItem(player.items.defense, feetBounds, 4);
		}
	};
	add(false);
	if (player.items.attack.length > 0 && player.items.mana.length > 0) {
		return;
	}
	if (
		player.items.defense.length > 1 &&
		player.items.defense.length < 17 &&
		Math.random() < 0.5
	) {
		add(true);
		// addItem(player.items.defense, defenseBounds, 4);
		if (player.items.defense.length < 17 && Math.random() < 0.5) {
			add(true);
			// addItem(player.items.defense, defenseBounds, 4);
			// if (player.items.defense.length < 17 && Math.random() < 0.4) {
			// 	addItem(player.items.defense, defenseBounds, 4);
			// }
		}
	}
};
