import { flow } from "mobx";
import {
	ClickAttack,
	ClickDefense,
	ClickMana,
	Flower5Mana,
	ManaCreated,
	Monster1Reacts,
	MonsterAttacks,
	Music,
	ShieldDefends,
	ShieldDown,
	WinMusic,
	WizardHit,
	WizardStart,
} from "./assets";
import { Button } from "./button";
import {
	type Bounds,
	shieldImpactBounds,
	manaBounds,
	manaPointsBounds,
	fightDuration,
	attackApproachDuration,
	feetBounds,
	chestBounds,
	lastAttackApproachDuration,
} from "./configuration";
import { Curtain } from "./curtain";
import {
	idleState as idleStateOld,
	newEntity as newEntityOld,
	makeTick as makeTickOld,
	type Entity as EntityOld,
	changeState as changeStateOld,
	schedule as scheduleOld,
	makeTick2 as makeTick2Old,
	clearTransitions as clearTransitionsOld,
} from "./entitiesOld";
import {
	areIdle2,
	scheduleX,
	type Entity,
	newEntity,
	idleState,
	makeTick,
	doTransition,
} from "./entities";
import { smartStrategy, type Strategy } from "./strategies";
import {
	appearWizard,
	dieWizard,
	hiddenWizard,
	idleWizard,
	maybeEndWizardMagic,
	newWizard,
	startWizardMagic,
	tickWizard,
	waitingEndWizard,
	waitingStartWizard,
	winWizard,
	type WizardT,
} from "./wizard";
import type { Id } from "../convex/_generated/dataModel";
import { pickPosition, type Point } from "./utils";
import type { api } from "../convex/_generated/api";
import type { ReactMutation } from "convex/react";
import {
	emptyPlayerData,
	initialDefense,
	initialMana,
	pickDefenseData,
	pickFighter,
	pickMonsterData,
	pickMushroomData,
	type PlayerData,
} from "./rules";
import { getDuration } from "./Animation";
import type { AppT, Credentials } from "./appLogic";
import { Rune } from "./rune";
import { Protection } from "./protection";
import { Mushroom } from "./mushroom";
import { EntityArray } from "./entitiesArray";

type ManaState =
	| "visible"
	| "anticipating"
	| "spawning"
	| "traveling"
	| "spawningOut";
export type Mana = EntityOld<ManaState> & {
	id: string;
	position: Point;
	prevPosition?: Point;
	scale: number;
	offset: number;
	rotationSpeed: number;
};

type MonsterState =
	| "waitingToAppear"
	| "visible"
	| "approach"
	| "fighting"
	| "winning";
export type Monster = Entity<MonsterState> & {
	id: string;
	position: Point;
	destination?: Point;
	finalApproach?: boolean;
	strength: 1 | 2 | 3;
	hp: number;
};

export type Player = EntityOld<"idle"> & {
	boughtSomething: boolean; // TODO: remove
	wizard: WizardT;
	manaPoints: Mana[];
	protection: Protection;
	mushrooms: EntityArray<Mushroom>;
	monsters: Monster[];
	previousStartData: PlayerData;
	previousEndData: PlayerData;
};

const resetPlayer = (player: Player, doIdle: boolean) => {
	player.boughtSomething = false;
	clearTransitionsOld(player);
	if (doIdle) {
		idleWizard(player.wizard);
	} else {
		hiddenWizard(player.wizard);
	}
	player.manaPoints = [];
	player.mushrooms.clear();
	player.protection.reset();
	player.monsters = [];
	player.previousStartData = emptyPlayerData();
	player.previousEndData = emptyPlayerData();
};

const tickPlayer = makeTick2Old((player: Player, delta) => {
	tickWizard(player.wizard, delta);
	tickItems(player, delta);
});

const delta = 150;

const generateId = () => {
	return Math.random().toString(36).slice(2);
};

const spawnMonster = (
	player: Player,
	strength: 1 | 2 | 3,
	position: Point,
	manaPoint: Mana,
) => {
	const id = generateId();
	player.monsters.push({
		...newEntity("waitingToAppear"),
		id,
		position,
		strength,
		hp: strength,
	});
	const monster = player.monsters.find((m) => m.id == id);
	if (!monster) {
		throw new Error("IMPOSSIBLE");
	}

	manaPoint.prevPosition = manaPoint.position;
	manaPoint.position = position;
	changeStateOld(manaPoint, "traveling", manaTravelDuration, (manaPoint) => {
		void ClickAttack.play();
		changeStateOld(manaPoint, "spawningOut", spawnDuration, (manaPoint) => {
			player.manaPoints = player.manaPoints.filter(
				(item) => item != manaPoint,
			);
			void maybeEndWizardMagic(player);
		});
		idleState(monster, "visible");
	});
};

const spawnMushroom = (player: Player, strength: 1 | 2, manaPoint: Mana) => {
	const position = pickPosition(player.mushrooms.entities, manaBounds, delta);
	const id = generateId();
	player.mushrooms.add(new Mushroom(id, position, strength, false));
	const mushroom = player.mushrooms.entities.find((m) => m.id == id);
	if (!mushroom) {
		throw new Error("IMPOSSIBLE");
	}

	manaPoint.prevPosition = manaPoint.position;
	manaPoint.position = position;
	changeStateOld(manaPoint, "traveling", manaTravelDuration, (manaPoint) => {
		void ClickMana.play();
		changeStateOld(manaPoint, "spawningOut", spawnDuration, (manaPoint) => {
			player.manaPoints = player.manaPoints.filter(
				(item) => item != manaPoint,
			);
			void maybeEndWizardMagic(player);
		});
		mushroom.setVisible();
	});
};

const spawnRunes = (player: Player, manaPoint: Mana, runeCount: number) => {
	const { protection } = player;
	const { shield } = protection;
	const position = pickPosition([], feetBounds, delta);
	for (let i = 0; i < runeCount; i++) {
		if (!shield.isPresent) {
			shield.makeWaitToAppear();
		} else {
			protection.addRune(new Rune(false, true)); // Waiting to appear
		}
	}

	manaPoint.prevPosition = manaPoint.position;
	manaPoint.position = position;
	changeStateOld(manaPoint, "traveling", manaTravelDuration, (manaPoint) => {
		void ClickDefense.play({ volume: 0.7 });
		changeStateOld(manaPoint, "spawningOut", spawnDuration, (manaPoint) => {
			player.manaPoints = player.manaPoints.filter(
				(item) => item != manaPoint,
			);
			void maybeEndWizardMagic(player);
		});
		protection.appearWaitingRunes();
	});
};

const pickManaPointRotation = () => (Math.random() > 0.5 ? 3 : -3);

const addManaPoint = (
	array: Mana[],
	bounds: Bounds,
	scale: number,
	offset: number,
) => {
	const position = pickPosition(array, bounds, delta);
	array.push({
		id: generateId(),
		lt: 0,
		nt: 0,
		position,
		state: "visible",
		transitions: [],
		scale,
		offset,
		rotationSpeed: pickManaPointRotation(),
	});
};

const newPlayer = (): Player => ({
	...newEntityOld("idle"),
	boughtSomething: false,
	wizard: newWizard(),
	manaPoints: [],
	protection: new Protection(),
	mushrooms: new EntityArray<Mushroom>(),
	monsters: [],
	previousStartData: emptyPlayerData(),
	previousEndData: emptyPlayerData(),
});

const spawnManaPoint = (
	player: Player,
	mushroom: Mushroom | undefined = undefined,
	silent = false,
) => {
	const position = pickPosition(player.manaPoints, manaPointsBounds, delta);

	const id = generateId();
	player.manaPoints.push({
		...newEntityOld<ManaState>("visible"),
		id,
		position,
		scale: 0.7 + Math.random() * 0.3,
		offset: Math.random() * 2 * Math.PI,
		rotationSpeed: pickManaPointRotation(),
	});
	const manaPoint = player.manaPoints.find((m) => m.id == id);
	if (!manaPoint) {
		throw new Error("IMPOSSIBLE");
	}

	if (!silent) {
		if (!mushroom) {
			void Flower5Mana.play({ volume: 1 });
		} else {
			void ManaCreated.play({ volume: 0.5 });
		}
	}

	if (mushroom) {
		manaPoint.prevPosition = mushroom.position;
		void flow(function* () {
			yield mushroom.disappear();
			player.mushrooms.remove(mushroom);
		})();
		changeStateOld(
			manaPoint,
			"traveling",
			manaSpawnDuration,
			(manaPoint) => {
				if (!silent) {
					void ManaCreated.play({ volume: 0.5 });
				}
				idleStateOld(manaPoint, "visible");
			},
		);
	} else {
		changeStateOld(
			manaPoint,
			"spawning",
			manaSpawnDuration,
			(manaPoint) => {
				idleStateOld(manaPoint, "visible");
			},
		);
	}
};

const spawnManaPointSilent = (player: Player) => {
	spawnManaPoint(player, undefined, true);
};

const addManaPoints = (player: Player) => {
	for (let i = 0; i < initialMana; i++) {
		addManaPoint(
			player.manaPoints,
			manaPointsBounds,
			0.7 + Math.random() * 0.3,
			Math.random() * 2 * Math.PI,
		);
	}
	for (const item of player.mushrooms.entities) {
		for (let i = 0; i < item.strength; i++) {
			addManaPoint(
				player.manaPoints,
				manaPointsBounds,
				0.7 + Math.random() * 0.3,
				Math.random() * 2 * Math.PI,
			);
		}
	}
	player.mushrooms.clear();
};

type GameState =
	| "intro"
	| "transition"
	| "buildUp"
	| "waiting"
	| "attack"
	| "defense"
	| "rebuild"
	| "gameover"
	| "restart";

export type GameT = EntityOld<GameState> & {
	gameId?: Id<"games">;
	round: number;
	player: Player;
	opponent: Player;
	curtain: Curtain;
	manaButton: Button;
	attackButton: Button;
	defenseButton: Button;
};

export const resetGame = (app: AppT) => {
	const { game } = app;
	idleStateOld(game, "intro");
	app.logo.show();
	game.round = 0;
	game.curtain.hide();
	resetPlayer(game.player, true);
	resetPlayer(game.opponent, false);
	game.manaButton.disappear();
	game.attackButton.disappear();
	game.defenseButton.disappear();
};

export const newGame = (state: "intro" | "restart", buttons = true): GameT => ({
	...newEntityOld<GameState>(state),
	round: 0,
	player: newPlayer(),
	opponent: newPlayer(),
	curtain: new Curtain(),
	manaButton: new Button(buttons),
	attackButton: new Button(buttons),
	defenseButton: new Button(buttons),
});

export const startGame = (app: AppT) => {
	const { game } = app;
	void WinMusic.stop();
	void Music.play({ loop: true, volume: 0.5 });
	app.logo.hide();
	app.lobby.disappear();
	app.startButtons.disappear();
	app.restartButtons.disappear();
	game.curtain.show(0.7);
	game.manaButton.appear(1.2);
	game.attackButton.appear(1.2);
	game.defenseButton.appear(1.2);
	idleStateOld(game, "transition");
	void WizardStart.play();
	// idleState(game.player.wizard, "idle");
	// appearWizard(game.player.wizard);
	// appearWizard(game.opponent.wizard);
	// for (const player of [game.player, game.opponent]) {
	// }
	const opponentWizard = game.opponent.wizard;
	void flow(function* () {
		if (
			opponentWizard.state == ">die" ||
			opponentWizard.state == "hidden"
		) {
			yield appearWizard(opponentWizard, 0);
		} else {
			idleWizard(opponentWizard);
		}
		scheduleX(opponentWizard, 0.5, waitingStartWizard);
	})();

	let t = 1;
	for (let i = 0; i < initialMana; i++) {
		t += 0.2;
		scheduleOld(game.player, t, spawnManaPoint);
		scheduleOld(game.opponent, t, spawnManaPointSilent);
	}

	for (let i = 0; i < initialDefense; i++) {
		if (i == 0) {
			game.player.protection.shield.appear();
			game.opponent.protection.shield.appear();
		} else {
			void appearRune(game.player);
			void appearRune(game.opponent);
		}
	}
};

const appearRune = flow(function* (player: Player) {
	player.protection.addRune(new Rune(false));
	const rune = player.protection.runes.entities.at(-1);
	if (!rune) {
		throw new Error("IMPOSSIBLE");
	}
	rune.appear();
	yield rune.wait();
});

type LastFight = {
	round: number;
	opponent: {
		defense: number;
		mushrooms: { strength: 1 | 2 }[];
		monsters: {
			hp: number;
			strength: 1 | 2 | 3;
			position: { x: number; y: number };
		}[];
	};
};

export const setupFight = (app: AppT, lastFight: LastFight) => {
	const { game } = app;
	if (lastFight.round != game.round + 1) {
		throw new Error("Invalid round");
	}

	// Set up monsters
	game.opponent.monsters = [];
	for (const monsterData of lastFight.opponent.monsters) {
		const { hp, strength, position } = monsterData;
		const monster: Monster = {
			...newEntity("visible"),
			id: generateId(),
			position,
			strength,
			hp,
		};
		game.opponent.monsters.push(monster);
	}
	// Set up defense
	game.opponent.protection.removeAllRunes();
	game.opponent.protection.shield.setHidden();
	for (let i = 0; i < lastFight.opponent.defense; i++) {
		if (i == 0) {
			game.opponent.protection.shield.setVisible();
		} else {
			game.opponent.protection.addRune(new Rune());
		}
	}
	// Set up mushrooms
	game.opponent.mushrooms.clear();
	for (const mushroomData of lastFight.opponent.mushrooms) {
		const { strength } = mushroomData;
		game.opponent.mushrooms.add(
			new Mushroom(
				generateId(),
				pickPosition(
					game.opponent.mushrooms.entities,
					manaBounds,
					delta,
				),
				strength,
				true,
			),
		);
	}
	// Set up mana points
	game.opponent.manaPoints = [];
	// Clear round data
	game.round = lastFight.round;

	// Start the fight
	void startFight(app);
};

const startFight = flow(function* (app: AppT) {
	const { game } = app;
	idleStateOld(game, "attack");
	yield waitingEndWizard(game.opponent.wizard);
	game.curtain.hide();
	yield pickAttackOrDefensePair(app);
});

const opponentMove = (game: GameT, opponent: Player, strategy: Strategy) => {
	while (opponent.manaPoints.some((p) => p.state == "visible")) {
		const type = strategy(
			getPlayerData(game.opponent),
			game.player.previousStartData,
			game.player.previousEndData,
		);

		switch (type) {
			case "mana": {
				const { strength } = pickMushroomData(getPlayerData(opponent));
				game.opponent.mushrooms.add(
					new Mushroom(
						generateId(),
						pickPosition(
							game.opponent.mushrooms.entities,
							manaBounds,
							delta,
						),
						strength,
						true,
					),
				);
				break;
			}
			case "attack": {
				const { strength, position } = pickMonsterData(
					getPlayerData(opponent),
				);
				const monster: Monster = {
					...newEntity("visible"),
					id: generateId(),
					position,
					strength: strength,
					hp: strength,
				};
				game.opponent.monsters.push(monster);
				break;
			}
			case "defense": {
				const result = pickDefenseData(getPlayerData(opponent));
				if (!result) {
					continue;
				}
				const { strength } = result;

				const add = () => {
					if (!game.opponent.protection.shield.isPresent) {
						game.opponent.protection.shield.setVisible();
					} else {
						game.opponent.protection.addRune(new Rune());
					}
				};
				add();
				if (strength >= 2) {
					add();
				}
				if (strength >= 3) {
					add();
				}
				break;
			}
		}

		const manaPoint = opponent.manaPoints.find(
			(item) => item.state == "visible",
		);
		opponent.manaPoints = opponent.manaPoints.filter(
			(item) => item != manaPoint,
		);
	}

	// Save the end data before the fight starts
	game.player.previousEndData = getPlayerData(game.player);
	game.opponent.previousEndData = getPlayerData(game.opponent);
};

const rebuildDuration = 0.2;

export const tickGame = makeTickOld<GameState, GameT, [AppT]>(
	(game: GameT, delta: number, app: AppT) => {
		tickPlayer(game.player, delta);
		tickPlayer(game.opponent, delta);
		game.curtain.tick(delta);
		updateButtons(game);
		game.manaButton.tick(delta);
		game.attackButton.tick(delta);
		game.defenseButton.tick(delta);
		const idle =
			areIdle2(game.player.wizard, game.opponent.wizard) &&
			game.curtain.isIdle &&
			game.manaButton.isIdle &&
			game.attackButton.isIdle &&
			game.defenseButton.isIdle;
		return {
			transition: () => {
				if (idle) {
					idleStateOld(game, "buildUp");
				}
			},
			restart: () => {
				if (idle) {
					idleStateOld(game, "buildUp");
				}
			},
			buildUp: () => {
				if (
					game.player.manaPoints.length == 0 &&
					areAllItemsVisible(game.player)
				) {
					idleStateOld(game, "waiting");
					if (!game.gameId) {
						opponentMove(game, game.opponent, smartStrategy);
					}
				}
			},
			waiting: () => {
				if (!game.gameId && game.opponent.manaPoints.length == 0) {
					void startFight(app);
				}
			},
		};
	},
);

const tickItems = (player: Player, delta: number) => {
	for (const item of player.monsters) {
		// if (player.state == "fight") {
		// 	item.position.x += delta * 25;
		// }
		tickMonster(item, delta);
	}
	player.mushrooms.tick(delta);
	player.protection.tick(delta);
	for (const item of player.manaPoints) {
		tickManaPoint(item, delta);
	}
};

const areAllItemsVisible = (player: Player) => {
	return (
		player.monsters.every((item) => item.state == "visible") &&
		player.protection.isIdle &&
		player.mushrooms.entities.every((item) => item.progress.isIdle) &&
		player.boughtSomething
	);
};

const manaTravelDuration = 0.2;
const spawnDuration = 0.3;

const tickMonster = makeTick<Monster>((_item) => {
	// if (item.state == "waitingForFight") {
	// 	item.position.x += delta * 25;
	// }

	return {};
});

const manaSpawnDuration = 0.5;

const tickManaPoint = makeTickOld<ManaState, Mana>();

const rebuildManaPoint = (player: Player) => {
	if (player.manaPoints.length < initialMana) {
		spawnManaPoint(player);
		return;
	}
	const item = player.mushrooms.entities.at(-1);
	if (item) {
		void ManaCreated.play({ volume: 0.5 });
		for (let i = 0; i < item.strength; i++) {
			spawnManaPoint(player, item);
		}
	}
};

const rebuildOne = (game: GameT) => {
	if (hasManaToSpawn(game.player)) {
		rebuildManaPoint(game.player);
		changeStateOld(game, "rebuild", rebuildDuration, () =>
			rebuildOne(game),
		);
	} else {
		idleStateOld(game, "buildUp");
		nextRound(game);
	}
};

const rebuildPlayerMana = (player: Player) => {
	let time = 0;
	for (let i = 0; i < initialMana; i++) {
		scheduleOld(player, i * rebuildDuration, (player) => {
			spawnManaPoint(player, undefined, undefined);
		});
		time = Math.max(time, i * rebuildDuration + manaSpawnDuration);
	}
	player.mushrooms.entities.forEach((mushroom, i) => {
		// void ManaCreated.play({ volume: 0.5 });
		for (let j = 0; j < mushroom.strength; j++) {
			scheduleOld(
				player,
				i * rebuildDuration + 4 * rebuildDuration,
				(player) => {
					spawnManaPoint(player, mushroom, j != 0);
				},
			);
			time = Math.max(
				time,
				i * rebuildDuration + 4 * rebuildDuration + manaSpawnDuration,
			);
		}
	});
	return time;
};

const rebuildMana = (game: GameT, callback: () => void) => {
	idleStateOld(game, "rebuild");
	game.curtain.show();
	scheduleX(game.opponent.wizard, 0.5, waitingStartWizard);

	let time = 0;
	time = Math.max(time, rebuildPlayerMana(game.player));
	// time = Math.max(time, rebuildPlayerMana(game.opponent));
	scheduleOld(game, time + 0.05, callback);
	// rebuildOne(game);
};

const pickAttackOrDefensePair = flow(function* (
	app: AppT,
): Generator<unknown, void, void> {
	const { game } = app;
	const playerMonsters = game.player.monsters.filter(
		(m) => m.state == "visible",
	).length;
	const opponentMonsters = game.opponent.monsters.filter(
		(m) => m.state == "visible",
	).length;

	if (playerMonsters == 0 && opponentMonsters == 0) {
		// No monsters, we move to the next round
		rebuildMana(game, () => {
			idleStateOld(game, "buildUp");
			nextRound(game);
		});
	} else if (playerMonsters > 0 && opponentMonsters > 0) {
		// Monsters on both sides, two monsters attack each other
		yield pickAttackPair(app);
	} else {
		// Monsters on one side, a monster attacks the other player
		yield pickDefensePair(app);
	}
});

const pickAttackPair = flow(function* (app: AppT) {
	const { game } = app;
	const playerAttacker = pickFighter(game.player.monsters);
	const opponentAttacker = pickFighter(game.opponent.monsters);
	const fightStrength = Math.min(playerAttacker.hp, opponentAttacker.hp);

	const destination = {
		x: (1920 - opponentAttacker.position.x + playerAttacker.position.x) / 2,
		y: (opponentAttacker.position.y + playerAttacker.position.y) / 2,
	};
	const destination2 = {
		x: 1920 - destination.x,
		y: destination.y,
	};

	playerAttacker.hp -= fightStrength;
	opponentAttacker.hp -= fightStrength;
	playerAttacker.destination = destination;
	opponentAttacker.destination = destination2;

	void MonsterAttacks.play({ volume: 0.5 });

	yield Promise.all([
		flow(function* () {
			yield doTransition(
				playerAttacker,
				attackApproachDuration,
				"approach",
				"fighting",
			);
			playerAttacker.position = { ...destination };
			yield doTransition(
				playerAttacker,
				fightDuration,
				"fighting",
				"visible",
			);
			if (playerAttacker.hp == 0) {
				game.player.monsters = game.player.monsters.filter(
					(item) => item != playerAttacker,
				);
			}
		})(),
		flow(function* () {
			yield doTransition(
				opponentAttacker,
				attackApproachDuration,
				"approach",
				"fighting",
			);
			opponentAttacker.position = { ...destination2 };
			yield doTransition(
				opponentAttacker,
				fightDuration,
				"fighting",
				"visible",
			);
			if (opponentAttacker.hp == 0) {
				game.opponent.monsters = game.opponent.monsters.filter(
					(item) => item != opponentAttacker,
				);
			}
		})(),
	]);
	yield pickAttackOrDefensePair(app);
});

const doWin = (app: AppT, winner: Player, loser: Player) => {
	const { game } = app;
	void dieWizard(loser.wizard);
	winWizard(winner.wizard);
	void WizardHit.play({ volume: 2 });
	void Music.stop();
	void WinMusic.play({ loop: true, volume: 0.5 });
	game.manaButton.disappear();
	game.attackButton.disappear();
	game.defenseButton.disappear();
	winner.protection.startTombola();
	for (const item of winner.mushrooms.entities) {
		void removeMushroom(winner, item, fightDuration * 2);
	}
	for (const item of loser.mushrooms.entities) {
		void removeMushroom(loser, item, fightDuration * 2);
	}
	idleStateOld(game, "gameover");
	app.restartButtons.appear(1);
};

const removeMonster = flow(function* (player: Player, monster: Monster) {
	monster.hp = 0;
	yield doTransition(monster, fightDuration, "fighting", "visible");
	player.monsters = player.monsters.filter((item) => item.id != monster.id);
});

const removeMushroom = flow(function* (
	player: Player,
	mushroom: Mushroom,
	delay: number,
) {
	yield mushroom.disappear(delay);
	player.mushrooms.remove(mushroom);
});

const pickDefensePair = flow(function* (app: AppT) {
	const { game } = app;
	const attacker =
		game.player.monsters.length > 0 ? game.player : game.opponent;
	const defender =
		game.player.monsters.length > 0 ? game.opponent : game.player;

	const fighter = pickFighter(
		attacker.monsters.filter((m) => m.state == "visible"),
	);
	const runes = defender.protection.runeCount;
	const shield = defender.protection.shield;
	void MonsterAttacks.play({ volume: 0.5 });

	if (!shield.isPresent) {
		const doAttack = flow(function* (fighter: Monster) {
			const destination = pickPosition([], chestBounds, 0);
			destination.x = 1920 - destination.x;
			fighter.destination = destination;
			fighter.finalApproach = true;
			yield doTransition(
				fighter,
				lastAttackApproachDuration,
				"approach",
				"visible",
			);
			fighter.position = { ...destination };
			void removeMonster(attacker, fighter);
		});
		// Attack the player
		yield Promise.all(
			attacker.monsters.filter((m) => m.state == "visible").map(doAttack),
		);
		doWin(app, attacker, defender);
		return; // Do not continue the fight
	} else if (runes == 0) {
		// Destroy shield
		const destination = pickPosition([], shieldImpactBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		yield doTransition(
			fighter,
			attackApproachDuration,
			"approach",
			"visible",
		);
		fighter.position = { ...destination };
		void removeMonster(attacker, fighter);
		shield.fighting();
		yield shield.wait();
		shield.disappear();
		yield Promise.all([
			shield.wait(),
			attacker.monsters
				.filter((m) => m.state == "visible")
				.map(
					flow(function* (monster: Monster) {
						yield doTransition(
							monster,
							getDuration(Monster1Reacts, 40),
							"winning",
							"visible",
						);
					}),
				),
		]);
		void ShieldDown.play();
	} else {
		// Destroy runes
		const destination = pickPosition([], shieldImpactBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		yield doTransition(
			fighter,
			attackApproachDuration,
			"approach",
			"visible",
		);
		fighter.position = { ...destination };
		defender.protection.disappearNRunes(fighter.hp);
		void ShieldDefends.play({ volume: 0.4 });
		shield.fighting();
		yield Promise.all([removeMonster(attacker, fighter), shield.wait()]);
	}

	yield pickAttackOrDefensePair(app);
});

const hasManaToSpawn = (player: Player) => {
	return (
		player.manaPoints.length < initialMana ||
		player.mushrooms.entities.length > 0
	);
};

const nextRound = (game: GameT) => {
	addManaPoints(game.opponent);
	game.player.previousStartData = getPlayerData(game.player);
	game.opponent.previousStartData = getPlayerData(game.opponent);
	game.player.boughtSomething = false;
};

////// Buying

const updateButtons = (game: GameT) => {
	const player = game.player;
	const canBuy = player.manaPoints.some((p) => p.state == "visible");
	const canBuyDefense =
		player.protection.defenseCount +
			player.manaPoints.filter((p) => p.state == "anticipating").length <
		16;
	if (canBuy && canBuyDefense && game.state == "buildUp") {
		game.defenseButton.fadeOn();
		game.manaButton.fadeOn();
		game.attackButton.fadeOn();
	} else if (canBuy && game.state == "buildUp") {
		game.defenseButton.fadeOff();
		game.manaButton.fadeOn();
		game.attackButton.fadeOn();
	} else {
		game.defenseButton.fadeOff();
		game.manaButton.fadeOff();
		game.attackButton.fadeOff();
	}
};

const lockManaPoint = (player: Player) => {
	void startWizardMagic(player);
	const manaPoint = player.manaPoints.find((item) => item.state == "visible");
	if (!manaPoint) {
		return;
	}
	idleStateOld(manaPoint, "anticipating");
	return manaPoint;
};

const unlockManaPoint = (manaPoint: Mana) => {
	idleStateOld(manaPoint, "visible");
};

export const buyMushroom = flow(function* (
	app: AppT,
	player: Player,
	buyMushroomMutation: ReactMutation<typeof api.player.buyMushroom>,
) {
	const manaPoint = lockManaPoint(player);
	const {
		credentials,
		game: { gameId },
	} = app;
	const result: { strength: 1 | 2 } | null =
		gameId && credentials ?
			yield buyMushroomMutation(credentials)
		:	pickMushroomData(getPlayerData(player));
	if (!result) {
		return;
	}
	const strength = result.strength;
	if (!manaPoint) {
		console.error("No mana point in buyMonster");
		return;
	}

	if (player == app.game.player) {
		spawnMushroom(player, strength, manaPoint);
	} else {
		player.mushrooms.add(
			new Mushroom(
				generateId(),
				pickPosition(player.mushrooms.entities, manaBounds, delta),
				strength,
				true,
			),
		);
	}
	player.boughtSomething = true;
});

const getPlayerData = (player: Player): PlayerData => {
	return {
		mana: player.manaPoints.length,
		monsters: player.monsters.map((monster) => ({
			strength: monster.strength,
			hp: monster.hp,
			position: monster.position,
		})),
		mushrooms: player.mushrooms.entities.map((mushroom) => ({
			strength: mushroom.strength,
		})),
		defense: player.protection.defenseCount,
	};
};

export const buyMonster = flow(function* (
	app: AppT,
	player: Player,
	buyMonsterMutation: (
		credentials: Credentials,
	) => Promise<{ strength: 1 | 2 | 3; position: Point } | null>,
) {
	const manaPoint = lockManaPoint(player);
	const {
		credentials,
		game: { gameId },
	} = app;
	const result: { strength: 1 | 2 | 3; position: Point } | null =
		gameId && credentials ?
			yield buyMonsterMutation(credentials)
		:	pickMonsterData(getPlayerData(player));
	if (!result) {
		return;
	}
	const { strength, position } = result;
	if (!manaPoint) {
		console.error("No mana point in buyMonster");
		return;
	}
	spawnMonster(player, strength, position, manaPoint);
	player.boughtSomething = true;
});

export const buyDefense = flow(function* (
	app: AppT,
	player: Player,
	buyDefenseMutation: ReactMutation<typeof api.player.buyDefense>,
) {
	const manaPoint = lockManaPoint(player);
	if (!manaPoint) {
		console.error("No mana point");
		return;
	}
	const {
		credentials,
		game: { gameId },
	} = app;
	const result: { strength: number } | null =
		gameId && credentials ?
			yield buyDefenseMutation(credentials)
		:	pickDefenseData(getPlayerData(player));
	if (!result) {
		unlockManaPoint(manaPoint);
		return;
	}
	const { strength } = result;
	spawnRunes(player, manaPoint, strength);
	player.boughtSomething = true;
});
