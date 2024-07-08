import { flow, runInAction } from "mobx";
import {
	ClickAttack,
	ClickDefense,
	ClickMana,
	Flower5Mana,
	ManaCreated,
	MonsterAttacks,
	MonstersClash,
	Music,
	ShieldDefends,
	ShieldDown,
	ShieldEnd,
	ShieldStart,
	WinMusic,
	WizardHit,
	WizardStart,
} from "./assets";
import {
	type ButtonT,
	appearButton,
	disappearButton,
	fadeButtonOff,
	fadeButtonOn,
	newButton,
	tickButton,
} from "./button";
import {
	type Bounds,
	shieldImpactBounds,
	manaBounds,
	manaPointsBounds,
	fightDuration,
	attackApproachDuration,
	feetBounds,
	chestBounds,
} from "./configuration";
import {
	showCurtain,
	newCurtain,
	tickCurtain,
	type Curtain,
	ensureHiddenCurtain,
} from "./curtain";
import {
	idleState as idleStateOld,
	newEntity as newEntityOld,
	makeTick as makeTickOld,
	type Entity as EntityOld,
	changeState,
	schedule,
	makeTick2 as makeTick2Old,
	clearTransitions,
} from "./entities";
import {
	areIdle2,
	scheduleX,
	type Entity2 as Entity,
	newEntity,
	idleState,
	makeTick3 as makeTick,
	doTransition,
} from "./entities2";
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
import { hideLogo, showLogo } from "./logo";

type ManaState =
	| "visible"
	| "anticipating"
	| "spawning"
	| "traveling"
	| "spawningOut";
export type Mana = EntityOld<ManaState> & {
	position: Point;
	tmpPosition?: Point;
	scale: number;
	offset: number;
	rotationSpeed: number;
	previousItem?: Mushroom;
};

type ShieldState =
	| "waitingToAppear"
	| "appearing"
	| "visible"
	| "disappearing"
	| "hidden"
	| "fadeOut"
	| "fighting";
export type Shield = EntityOld<ShieldState>;

type RuneState =
	| "waitingToAppear"
	| "appearing"
	| "visible"
	| "disappearing"
	| "hidden";
export type Rune = EntityOld<RuneState>;

type MushroomState = "hidden" | "visible" | "disappearing";
export type Mushroom = Entity<MushroomState> & {
	id: string;
	position: Point;
	strength: 1 | 2;
};

type MonsterState = "waitingToAppear" | "visible" | "approach" | "fighting";
export type Monster = EntityOld<MonsterState> & {
	id: string;
	position: Point;
	destination?: Point;
	strength: 1 | 2 | 3;
	hp: number;
};

export type Protection = Entity<"idle" | "tombola"> & {
	shield: Shield;
	runes: Rune[];
};

const resetProtection = (protection: Protection) => {
	idleState(protection, "idle");
	protection.runes = [];
	fadeOutShield(protection.shield);
};

export type Player = EntityOld<"idle"> & {
	boughtSomething: boolean; // TODO: remove
	wizard: WizardT;
	manaPoints: Mana[];
	protection: Protection;
	mushrooms: Mushroom[];
	monsters: Monster[];
	previousStartData: PlayerData;
	previousEndData: PlayerData;
};

const resetPlayer = (player: Player, doIdle: boolean) => {
	player.boughtSomething = false;
	clearTransitions(player);
	if (doIdle) {
		idleWizard(player.wizard);
	} else {
		hiddenWizard(player.wizard);
	}
	player.manaPoints = [];
	player.mushrooms = [];
	resetProtection(player.protection);
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
		...newEntityOld("waitingToAppear"),
		id,
		position,
		strength,
		hp: strength,
	});
	const monster = player.monsters.find((m) => m.id == id);
	if (!monster) {
		throw new Error("IMPOSSIBLE");
	}

	manaPoint.tmpPosition = manaPoint.position;
	manaPoint.position = position;
	changeState(manaPoint, "traveling", manaTravelDuration, (manaPoint) => {
		void ClickAttack.play();
		changeState(manaPoint, "spawningOut", spawnDuration, (manaPoint) => {
			player.manaPoints = player.manaPoints.filter(
				(item) => item != manaPoint,
			);
			void maybeEndWizardMagic(player);
		});
		idleStateOld(monster, "visible");
	});
};

const spawnMushroom = (player: Player, strength: 1 | 2, manaPoint: Mana) => {
	const position = pickPosition(player.mushrooms, manaBounds, delta);
	const id = generateId();
	player.mushrooms.push({
		...newEntity("hidden"),
		id,
		position,
		strength,
	});
	const mushroom = player.mushrooms.find((m) => m.id == id);
	if (!mushroom) {
		throw new Error("IMPOSSIBLE");
	}

	manaPoint.tmpPosition = manaPoint.position;
	manaPoint.position = position;
	changeState(manaPoint, "traveling", manaTravelDuration, (manaPoint) => {
		void ClickMana.play();
		changeState(manaPoint, "spawningOut", spawnDuration, (manaPoint) => {
			player.manaPoints = player.manaPoints.filter(
				(item) => item != manaPoint,
			);
			void maybeEndWizardMagic(player);
		});
		idleState(mushroom, "visible");
	});
};

const spawnRunes = (player: Player, manaPoint: Mana, runeCount: number) => {
	const { protection } = player;
	const { runes, shield } = protection;
	const position = pickPosition([], feetBounds, delta);
	for (let i = 0; i < runeCount; i++) {
		if (!hasShield(shield)) {
			makeWaitToAppearShield(shield);
		} else {
			const rune: Rune = newEntityOld("waitingToAppear");
			runes.push(rune);
		}
	}

	manaPoint.tmpPosition = manaPoint.position;
	manaPoint.position = position;
	changeState(manaPoint, "traveling", manaTravelDuration, (manaPoint) => {
		void ClickDefense.play({ volume: 0.7 });
		changeState(manaPoint, "spawningOut", spawnDuration, (manaPoint) => {
			player.manaPoints = player.manaPoints.filter(
				(item) => item != manaPoint,
			);
			void maybeEndWizardMagic(player);
		});
		if (shield.state == "waitingToAppear") {
			appearShield(shield);
		}
		for (const rune of runes) {
			if (rune.state == "waitingToAppear") {
				idleStateOld(rune, "visible");
			}
		}
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

const addRune = (array: Rune[], props?: Partial<Rune>) => {
	array.push({
		lt: 0,
		nt: 0,
		state: "visible",
		transitions: [],
		...props,
	});
};

const addMushroom = (array: Mushroom[], bounds: Bounds, strength: 1 | 2) => {
	const position = pickPosition(array, bounds, delta);
	array.push({
		...newEntity("visible"),
		id: generateId(),
		position,
		strength,
	});
};

const newPlayer = (): Player => ({
	...newEntityOld("idle"),
	wizard: newWizard(),
	manaPoints: [],
	protection: {
		...newEntity<"idle" | "tombola">("idle"),
		shield: newEntityOld<ShieldState>("hidden"),
		runes: [],
	},
	mushrooms: [],
	monsters: [],
	previousStartData: emptyPlayerData(),
	previousEndData: emptyPlayerData(),
});

const spawnManaPoint = (
	player: Player,
	previousItem: Mushroom | undefined = undefined,
	silent = false,
	callback?: () => void,
) => {
	const position = pickPosition(player.manaPoints, manaPointsBounds, delta);

	const manaPoint: Mana = {
		...newEntityOld<ManaState>("spawning"),
		position,
		scale: 0.7 + Math.random() * 0.3,
		offset: Math.random() * 2 * Math.PI,
		rotationSpeed: pickManaPointRotation(),
		previousItem,
	};
	if (!silent) {
		if (previousItem) {
			void Flower5Mana.play({ volume: 1 });
		} else {
			void ManaCreated.play({ volume: 0.5 });
		}
	}
	changeState(manaPoint, "spawning", manaSpawnDuration, (manaPoint) => {
		if (!silent && previousItem) {
			void ManaCreated.play({ volume: 0.5 });
		}
		idleStateOld(manaPoint, "visible");
		callback?.();
	});

	player.manaPoints.push(manaPoint);
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
	for (const item of player.mushrooms) {
		for (let i = 0; i < item.strength; i++) {
			addManaPoint(
				player.manaPoints,
				manaPointsBounds,
				0.7 + Math.random() * 0.3,
				Math.random() * 2 * Math.PI,
			);
		}
	}
	player.mushrooms = [];
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
	manaButton: ButtonT;
	attackButton: ButtonT;
	defenseButton: ButtonT;
};

export const resetGame = (app: AppT) => {
	const { game } = app;
	idleStateOld(game, "intro");
	showLogo(app.logo);
	game.round = 0;
	void ensureHiddenCurtain(game.curtain);
	resetPlayer(game.player, true);
	resetPlayer(game.opponent, false);
	disappearButton(game.manaButton);
	disappearButton(game.attackButton);
	disappearButton(game.defenseButton);
};

export const newGame = (state: "intro" | "restart", buttons = true): GameT => ({
	...newEntityOld<GameState>(state),
	round: 0,
	player: newPlayer(),
	opponent: newPlayer(),
	curtain: newCurtain(),
	manaButton: newButton(buttons),
	attackButton: newButton(buttons),
	defenseButton: newButton(buttons),
});

export const startGame = (app: AppT) => {
	const { game } = app;
	void WinMusic.stop();
	void Music.play({ loop: true, volume: 0.5 });
	hideLogo(app.logo);
	disappearButton(app.lobby);
	disappearButton(app.startButtons);
	disappearButton(app.restartButtons);
	scheduleX(game.curtain, 0.7, showCurtain);
	appearButton(game.manaButton, 1.2);
	appearButton(game.attackButton, 1.2);
	appearButton(game.defenseButton, 1.2);
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
			yield appearWizard(opponentWizard);
		} else {
			idleWizard(opponentWizard);
		}
		scheduleX(opponentWizard, 0.5, waitingStartWizard);
	})();

	let t = 1;
	for (let i = 0; i < initialMana; i++) {
		t += 0.2;
		schedule(game.player, t, spawnManaPoint);
		schedule(game.opponent, t, spawnManaPointSilent);
	}

	for (let i = 0; i < initialDefense; i++) {
		if (i == 0) {
			appearShield(game.player.protection.shield);
			appearShield(game.opponent.protection.shield);
		} else {
			appearRune(game.player);
			appearRune(game.opponent);
		}
	}
};

const appearShield = (shield: Shield) => {
	changeState(shield, "appearing", getDuration(ShieldStart, 20), (shield) => {
		idleStateOld(shield, "visible");
	});
};

const makeWaitToAppearShield = (shield: Shield) => {
	idleStateOld(shield, "waitingToAppear");
};

const disappearShield = (shield: Shield) => {
	changeState(
		shield,
		"disappearing",
		getDuration(ShieldEnd, 20),
		(shield) => {
			idleStateOld(shield, "hidden");
		},
	);
};

const fadeOutDuration = 0.2;
const fadeOutShield = (shield: Shield) => {
	changeState(shield, "fadeOut", fadeOutDuration, (shield) => {
		idleStateOld(shield, "hidden");
	});
};

const hasShield = (shield: Shield) => {
	return ["waitingToAppear", "visible", "appearing", "fighting"].includes(
		shield.state,
	);
};

const appearRune = (player: Player) => {
	const rune: Rune = newEntityOld("hidden");
	changeState(rune, "appearing", spawnDuration, (rune) => {
		idleStateOld(rune, "visible");
	});
	player.protection.runes.push(rune);
};

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
			...newEntityOld("visible"),
			id: generateId(),
			position,
			strength,
			hp,
		};
		game.opponent.monsters.push(monster);
	}
	// Set up defense
	game.opponent.protection.runes = [];
	idleStateOld(game.opponent.protection.shield, "hidden");
	for (let i = 0; i < lastFight.opponent.defense; i++) {
		if (i == 0) {
			idleStateOld(game.opponent.protection.shield, "visible");
		} else {
			addRune(game.opponent.protection.runes);
		}
	}
	// Set up mushrooms
	game.opponent.mushrooms = [];
	for (const mushroomData of lastFight.opponent.mushrooms) {
		const { strength } = mushroomData;
		const mushroom: Mushroom = {
			...newEntity("visible"),
			id: generateId(),
			position: pickPosition(game.opponent.mushrooms, manaBounds, delta),
			strength,
		};
		game.opponent.mushrooms.push(mushroom);
	}
	// Set up mana points
	game.opponent.manaPoints = [];
	// Clear round data
	game.round = lastFight.round;

	// Start the fight
	idleStateOld(game, "attack");
	// for (const monster of game.player.monsters) {
	// 	idleState(monster, "waitingForFight");
	// }
	// for (const monster of game.opponent.monsters) {
	// 	idleState(monster, "waitingForFight");
	// }
	void flow(function* () {
		yield waitingEndWizard(game.opponent.wizard);
		yield ensureHiddenCurtain(game.curtain);
		pickAttackOrDefensePair(app);
	})();
};

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
				const mushroom: Mushroom = {
					...newEntity("visible"),
					id: generateId(),
					position: pickPosition(
						game.opponent.mushrooms,
						manaBounds,
						delta,
					),
					strength,
				};
				game.opponent.mushrooms.push(mushroom);
				break;
			}
			case "attack": {
				const { strength, position } = pickMonsterData(
					getPlayerData(opponent),
				);
				const monster: Monster = {
					...newEntityOld("visible"),
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
					if (!hasShield(game.opponent.protection.shield)) {
						idleStateOld(
							game.opponent.protection.shield,
							"visible",
						);
					} else {
						addRune(game.opponent.protection.runes);
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
		tickCurtain(game.curtain, delta);
		updateButtons(game);
		tickButton(game.manaButton, delta);
		tickButton(game.attackButton, delta);
		tickButton(game.defenseButton, delta);
		const idle = areIdle2(
			game.player.wizard,
			game.opponent.wizard,
			game.curtain,
			game.manaButton,
			game.attackButton,
			game.defenseButton,
		);
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
					idleStateOld(game, "attack");
					// for (const monster of game.player.monsters) {
					// 	idleState(monster, "waitingForFight");
					// }
					// for (const monster of game.opponent.monsters) {
					// 	idleState(monster, "waitingForFight");
					// }
					// await backToIdle(game.opponent.wizard);
					// await hideCurtain(game.curtain);
					// pickAttackOrDefensePair(app);
					void flow(function* () {
						yield waitingEndWizard(game.opponent.wizard);
						yield ensureHiddenCurtain(game.curtain);
						pickAttackOrDefensePair(app);
					})();
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
	for (const item of player.mushrooms) {
		tickMushroom(item, delta);
	}
	tickShield(player.protection.shield, delta);
	for (const item of player.protection.runes) {
		tickRune(item, delta);
	}
	for (const item of player.manaPoints) {
		tickManaPoint(item, delta);
	}
};

const areAllItemsVisible = (player: Player) => {
	return (
		player.monsters.every((item) => item.state == "visible") &&
		player.protection.runes.every((item) => item.state == "visible") &&
		player.mushrooms.every((item) => item.state == "visible") &&
		player.boughtSomething
	);
};

const manaTravelDuration = 0.2;
const spawnDuration = 0.3;

const tickMonster = makeTickOld<MonsterState, Monster>((_item) => {
	// if (item.state == "waitingForFight") {
	// 	item.position.x += delta * 25;
	// }

	return {};
});

const tickShield = makeTickOld<ShieldState, Shield>();

const tickRune = makeTickOld<RuneState, Rune>();

const tickMushroom = makeTick<Mushroom>();

const manaSpawnDuration = 0.5;

const tickManaPoint = makeTickOld<ManaState, Mana>((item) => {
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

const rebuildManaPoint = (player: Player) => {
	if (player.manaPoints.length < initialMana) {
		spawnManaPoint(player);
		return;
	}
	const item = player.mushrooms.pop();
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
		changeState(game, "rebuild", rebuildDuration, () => rebuildOne(game));
	} else {
		idleStateOld(game, "buildUp");
		nextRound(game);
	}
};

const rebuildPlayerMana = (player: Player) => {
	let time = 0;
	for (let i = 0; i < initialMana; i++) {
		schedule(player, i * rebuildDuration, (player) => {
			spawnManaPoint(player, undefined, undefined);
		});
		time = Math.max(time, i * rebuildDuration + manaSpawnDuration);
	}
	player.mushrooms.forEach((mushroom, i) => {
		// void ManaCreated.play({ volume: 0.5 });
		for (let j = 0; j < mushroom.strength; j++) {
			schedule(
				player,
				i * rebuildDuration + 4 * rebuildDuration,
				(player) => {
					player.mushrooms = player.mushrooms.filter(
						(m) => m.id !== mushroom.id,
					);
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
	void showCurtain(game.curtain);
	scheduleX(game.opponent.wizard, 0.5, waitingStartWizard);

	let time = 0;
	time = Math.max(time, rebuildPlayerMana(game.player));
	// time = Math.max(time, rebuildPlayerMana(game.opponent));
	schedule(game, time + 0.05, callback);
	// rebuildOne(game);
};

const pickAttackOrDefensePair = (app: AppT) => {
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
		return;
	}
	if (playerMonsters > 0 && opponentMonsters > 0) {
		// Monsters on both sides, we attack
		pickAttackPair(app);
		return;
	}
	pickDefensePair(app);
};

const pickAttackPair = (app: AppT) => {
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

	let count = 2;
	changeState(playerAttacker, "approach", attackApproachDuration, () => {
		void MonstersClash.play({ volume: 1 });
		playerAttacker.position = { ...destination };
		changeState(playerAttacker, "fighting", fightDuration, () => {
			if (playerAttacker.hp == 0) {
				game.player.monsters = game.player.monsters.filter(
					(item) => item != playerAttacker,
				);
			} else {
				idleStateOld(playerAttacker, "visible");
			}
			count--;
			if (count == 0) {
				pickAttackOrDefensePair(app);
			}
		});
	});

	changeState(opponentAttacker, "approach", attackApproachDuration, () => {
		opponentAttacker.position = { ...destination2 };
		changeState(opponentAttacker, "fighting", fightDuration, () => {
			if (opponentAttacker.hp == 0) {
				game.opponent.monsters = game.opponent.monsters.filter(
					(item) => item != opponentAttacker,
				);
			} else {
				idleStateOld(opponentAttacker, "visible");
			}
			count--;
			if (count == 0) {
				pickAttackOrDefensePair(app);
			}
		});
	});
};

const doWin = (app: AppT, winner: Player, loser: Player) => {
	const { game } = app;
	void dieWizard(loser.wizard);
	winWizard(winner.wizard);
	void WizardHit.play({ volume: 2 });
	void Music.stop();
	void WinMusic.play({ loop: true, volume: 0.5 });
	disappearButton(game.manaButton);
	disappearButton(game.attackButton);
	disappearButton(game.defenseButton);
	idleState(winner.protection, "tombola");
	runeTombola()(winner);
	for (const item of winner.monsters) {
		if (item.state == "visible") {
			changeState(item, "visible", fightDuration * 2, () => {
				removeMonster(winner, item);
			});
		}
	}
	for (const item of winner.mushrooms) {
		void removeMushroom(winner, item, fightDuration * 2);
	}
	for (const item of loser.mushrooms) {
		void removeMushroom(loser, item, fightDuration * 2);
	}
	idleStateOld(game, "gameover");
	appearButton(app.restartButtons, 1);
};

const removeRune = (player: Player, rune: Rune) => {
	changeState(rune, "disappearing", fightDuration, (rune) => {
		player.protection.runes = player.protection.runes.filter(
			(item) => item != rune,
		);
	});
};

const removeMonster = (player: Player, monster: Monster) => {
	monster.hp = 0;
	changeState(monster, "fighting", fightDuration, (monster) => {
		player.monsters = player.monsters.filter(
			(item) => item.id != monster.id,
		);
	});
};

const removeMushroom = flow(function* (
	player: Player,
	mushroom: Mushroom,
	delay: number,
) {
	if (mushroom.state != "visible") {
		return;
	}
	yield doTransition(mushroom, delay, "visible", "visible");
	yield doTransition(mushroom, fightDuration, "disappearing", "hidden");
	player.mushrooms = player.mushrooms.filter(
		(item) => item.id != mushroom.id,
	);
});

const pickDefensePair = (app: AppT) => {
	const { game } = app;
	const attacker =
		game.player.monsters.length > 0 ? game.player : game.opponent;
	const defender =
		game.player.monsters.length > 0 ? game.opponent : game.player;

	const fighter = pickFighter(
		attacker.monsters.filter((m) => m.state == "visible"),
	);
	const runes = defender.protection.runes.filter(
		(r) => r.state == "visible",
	).length;
	const shield = defender.protection.shield;
	void MonsterAttacks.play({ volume: 0.5 });
	if (!hasShield(shield)) {
		// Attack the player
		const destination = pickPosition([], chestBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		changeState(fighter, "approach", attackApproachDuration, () => {
			fighter.position = { ...destination };
			removeMonster(attacker, fighter);
			doWin(app, attacker, defender);
		});
		return; // Do not continue the fight
	} else if (runes == 0) {
		// Destroy shield
		const destination = pickPosition([], shieldImpactBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		changeState(fighter, "approach", attackApproachDuration, () => {
			fighter.position = { ...destination };
			removeMonster(attacker, fighter);
			disappearShield(shield);
			void ShieldDown.play();
		});
	} else {
		// Destroy runes
		const destination = pickPosition([], shieldImpactBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		changeState(fighter, "approach", attackApproachDuration, () => {
			fighter.position = { ...destination };
			defender.protection.runes
				.toReversed()
				.slice(0, Math.min(fighter.hp, runes))
				.forEach((rune) => {
					removeRune(defender, rune);
				});
			removeMonster(attacker, fighter);
			changeState(shield, "fighting", fightDuration, () => {
				idleStateOld(shield, "visible");
			});
			void ShieldDefends.play({ volume: 0.4 });
		});
	}

	changeState(game, "defense", attackApproachDuration + fightDuration, () => {
		pickAttackOrDefensePair(app);
	});
};

const pickTombola = (previous: number[]) => {
	const next = [];
	const tombola = Array(16).fill(false);
	for (let i = 0; i < 4; i++) {
		const v = [0, 1, 2, 3].filter((x) => x !== previous[i])[
			Math.floor(Math.random() * 3)
		];
		next.push(v);
		tombola[v + i * 4] = true;
	}
	return { next, tombola };
};

export const runeTombola =
	(previous: number[] = [1, 2, 0, 1]) =>
	(player: Player) => {
		if (player.protection.state !== "tombola") {
			return;
		}
		player.protection.runes = [];
		const { tombola, next } = pickTombola(previous);
		for (let i = 0; i < 15; i++) {
			addRune(player.protection.runes, {
				state: tombola[i] ? "visible" : "hidden",
			});
		}
		schedule(player, 0.12, runeTombola(next));
	};

const hasManaToSpawn = (player: Player) => {
	return (
		player.manaPoints.length < initialMana || player.mushrooms.length > 0
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
		player.protection.runes.length +
			(hasShield(player.protection.shield) ? 1 : 0) +
			player.manaPoints.filter((p) => p.state == "anticipating").length <
		16;
	if (canBuy && canBuyDefense && game.state == "buildUp") {
		fadeButtonOn(game.defenseButton);
		fadeButtonOn(game.manaButton);
		fadeButtonOn(game.attackButton);
	} else if (canBuy && game.state == "buildUp") {
		fadeButtonOff(game.defenseButton);
		fadeButtonOn(game.manaButton);
		fadeButtonOn(game.attackButton);
	} else {
		fadeButtonOff(game.defenseButton);
		fadeButtonOff(game.manaButton);
		fadeButtonOff(game.attackButton);
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

export const buyMushroom = async (
	app: AppT,
	player: Player,
	buyMushroomMutation: ReactMutation<typeof api.player.buyMushroom>,
) => {
	const manaPoint = lockManaPoint(player);
	const {
		credentials,
		game: { gameId },
	} = app;
	const result =
		gameId && credentials ?
			await buyMushroomMutation(credentials)
		:	pickMushroomData(getPlayerData(player));
	if (!result) {
		return;
	}
	const strength = result.strength;
	runInAction(() => {
		if (!manaPoint) {
			console.error("No mana point in buyMonster");
			return;
		}

		if (player == app.game.player) {
			spawnMushroom(player, strength, manaPoint);
		} else {
			addMushroom(player.mushrooms, manaBounds, strength);
		}
		player.boughtSomething = true;
	});
};

const getPlayerData = (player: Player): PlayerData => {
	return {
		mana: player.manaPoints.length,
		monsters: player.monsters.map((monster) => ({
			strength: monster.strength,
			hp: monster.hp,
			position: monster.position,
		})),
		mushrooms: player.mushrooms.map((mushroom) => ({
			strength: mushroom.strength,
		})),
		defense:
			player.protection.runes.length +
			(hasShield(player.protection.shield) ? 1 : 0),
	};
};

export const buyMonster = async (
	app: AppT,
	player: Player,
	buyMonsterMutation: (
		credentials: Credentials,
	) => Promise<{ strength: 1 | 2 | 3; position: Point } | null>,
) => {
	const manaPoint = lockManaPoint(player);
	const {
		credentials,
		game: { gameId },
	} = app;
	const result =
		gameId && credentials ?
			await buyMonsterMutation(credentials)
		:	pickMonsterData(getPlayerData(player));
	if (!result) {
		return;
	}
	runInAction(() => {
		const { strength, position } = result;
		if (!manaPoint) {
			console.error("No mana point in buyMonster");
			return;
		}
		spawnMonster(player, strength, position, manaPoint);
		player.boughtSomething = true;
	});
};

export const buyDefense = async (
	app: AppT,
	player: Player,
	buyDefenseMutation: ReactMutation<typeof api.player.buyDefense>,
) => {
	const manaPoint = lockManaPoint(player);
	if (!manaPoint) {
		console.error("No mana point");
		return;
	}
	const {
		credentials,
		game: { gameId },
	} = app;
	const result =
		gameId && credentials ?
			await buyDefenseMutation(credentials)
		:	pickDefenseData(getPlayerData(player));
	runInAction(() => {
		if (!result) {
			unlockManaPoint(manaPoint);
			return;
		}
		const { strength } = result;
		spawnRunes(player, manaPoint, strength);
		player.boughtSomething = true;
	});
};
