import { flow } from "mobx";
import {
	ClickAttack,
	ClickDefense,
	ClickMana,
	Flower5Mana,
	ManaCreated,
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
	shieldImpactBounds,
	manaBounds,
	manaPointsBounds,
	fightDuration,
	feetBounds,
	chestBounds,
} from "./configuration";
import { Curtain } from "./curtain";
import {
	idleState as idleStateOld,
	newEntity as newEntityOld,
	makeTick as makeTickOld,
	type Entity as EntityOld,
	schedule as scheduleOld,
	makeTick2 as makeTick2Old,
	clearTransitions as clearTransitionsOld,
} from "./entitiesOld";
import { smartStrategy, type Strategy } from "./strategies";
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
import type { AppT, Credentials } from "./appLogic";
import { Rune } from "./rune";
import { Protection } from "./protection";
import { Mushroom } from "./mushroom";
import { EntityArray } from "./entitiesArray";
import { Monster } from "./monster";
import { Mana } from "./mana";
import { Wizard } from "./wizard";

export type Player = EntityOld<"idle"> & {
	boughtSomething: boolean; // TODO: remove
	wizard: Wizard;
	manaPoints: EntityArray<Mana>;
	protection: Protection;
	mushrooms: EntityArray<Mushroom>;
	monsters: EntityArray<Monster>;
	previousStartData: PlayerData;
	previousEndData: PlayerData;
};

const resetPlayer = (player: Player, doIdle: boolean) => {
	player.boughtSomething = false;
	clearTransitionsOld(player);
	if (doIdle) {
		player.wizard.appear();
	} else {
		player.wizard.disappear();
	}
	player.manaPoints.clear();
	player.mushrooms.clear();
	player.protection.reset();
	player.monsters.clear();
	player.previousStartData = emptyPlayerData();
	player.previousEndData = emptyPlayerData();
};

const tickPlayer = makeTick2Old((player: Player, delta) => {
	player.wizard.tick(delta);
	tickItems(player, delta);
});

const delta = 150;

const spawnMonster = async (
	player: Player,
	strength: 1 | 2 | 3,
	position: Point,
	manaPoint: Mana,
) => {
	const monster = player.monsters.add(
		new Monster("waitingToAppear", position, strength),
	);
	manaPoint.travel(position);
	await manaPoint.wait();

	void ClickAttack.play();
	manaPoint.spawnOut();
	monster.setVisible();
	await manaPoint.wait();

	player.manaPoints.remove(manaPoint);
	if (player.manaPoints.entities.length == 0) {
		player.wizard.magicEnd();
	}
};

const spawnMushroom = async (
	player: Player,
	strength: 1 | 2,
	manaPoint: Mana,
) => {
	const position = pickPosition(player.mushrooms.entities, manaBounds, delta);
	const mushroom = player.mushrooms.add(
		new Mushroom(position, strength, false),
	);

	manaPoint.travel(position);
	await manaPoint.wait();

	void ClickMana.play();
	manaPoint.spawnOut();
	mushroom.setVisible();
	await manaPoint.wait();

	player.manaPoints.remove(manaPoint);
	if (player.manaPoints.entities.length == 0) {
		player.wizard.magicEnd();
	}
};

const spawnRunes = async (
	player: Player,
	manaPoint: Mana,
	runeCount: number,
) => {
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

	manaPoint.travel(position);
	await manaPoint.wait();

	void ClickDefense.play({ volume: 0.7 });
	manaPoint.spawnOut();
	protection.appearWaitingRunes();
	await manaPoint.wait();

	player.manaPoints.remove(manaPoint);
	if (player.manaPoints.entities.length == 0) {
		player.wizard.magicEnd();
	}
};

const addManaPoint = (manaPoints: EntityArray<Mana>) => {
	const position = pickPosition(manaPoints.entities, manaPointsBounds, delta);
	return manaPoints.add(
		new Mana(
			"visible",
			position,
			0.7 + Math.random() * 0.3,
			Math.random() * 2 * Math.PI,
			Math.random() > 0.5 ? 3 : -3,
		),
	);
};

const newPlayer = (): Player => ({
	...newEntityOld("idle"),
	boughtSomething: false,
	wizard: new Wizard(),
	manaPoints: new EntityArray<Mana>(),
	protection: new Protection(),
	mushrooms: new EntityArray<Mushroom>(),
	monsters: new EntityArray<Monster>(),
	previousStartData: emptyPlayerData(),
	previousEndData: emptyPlayerData(),
});

const spawnManaPointFromNothing = async (player: Player, silent = false) => {
	const manaPoint = addManaPoint(player.manaPoints);

	if (!silent) {
		void Flower5Mana.play({ volume: 1 });
	}

	manaPoint.spawn();
	await manaPoint.wait();
	manaPoint.setVisible();
};

const spawnManaPointFromNothingSilent = async (player: Player) => {
	await spawnManaPointFromNothing(player, true);
};

const spawnManaPointFromMushroom = async (
	player: Player,
	mushroom: Mushroom,
	silent = false,
) => {
	const manaPoint = addManaPoint(player.manaPoints);

	if (!silent) {
		void ManaCreated.play({ volume: 0.5 });
	}

	manaPoint.travelFrom(mushroom.position);
	await manaPoint.wait();
	if (!silent) {
		void ManaCreated.play({ volume: 0.5 });
	}
	manaPoint.setVisible();
};

const addManaPoints = (player: Player) => {
	for (let i = 0; i < initialMana; i++) {
		addManaPoint(player.manaPoints);
	}
	for (const item of player.mushrooms.entities) {
		for (let i = 0; i < item.strength; i++) {
			addManaPoint(player.manaPoints);
		}
	}
	player.mushrooms.clear();
};

const appearRune = async (player: Player) => {
	player.protection.addRune(new Rune(false));
	const rune = player.protection.runes.entities.at(-1);
	if (!rune) {
		throw new Error("IMPOSSIBLE");
	}
	rune.appear();
	await rune.wait();
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
	void (async function () {
		opponentWizard.appear();
		await opponentWizard.wait();
		opponentWizard.waitingStart(0.5);
		await opponentWizard.wait();
	})();

	let t = 1;
	for (let i = 0; i < initialMana; i++) {
		t += 0.2;
		scheduleOld(game.player, t, spawnManaPointFromNothing);
		scheduleOld(game.opponent, t, spawnManaPointFromNothingSilent);
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
	game.opponent.monsters.clear();
	for (const monsterData of lastFight.opponent.monsters) {
		const { hp, strength, position } = monsterData;
		const monster = new Monster("visible", position, strength, hp);
		game.opponent.monsters.add(monster);
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
	game.opponent.manaPoints.clear();
	// Clear round data
	game.round = lastFight.round;

	// Start the fight
	void startFight(app);
};

const startFight = flow(function* (app: AppT) {
	const { game } = app;
	idleStateOld(game, "attack");
	game.opponent.wizard.waitingEnd();
	yield game.opponent.wizard.wait();
	game.curtain.hide();
	yield game.curtain.wait();
	yield pickAttackOrDefensePair(app);
});

const opponentMove = (game: GameT, opponent: Player, strategy: Strategy) => {
	while (opponent.manaPoints.entities.some((p) => p.state == "visible")) {
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
				const monster = new Monster("visible", position, strength);
				game.opponent.monsters.add(monster);
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

		const manaPoint = opponent.manaPoints.entities.find(
			(item) => item.state == "visible",
		);
		if (manaPoint) {
			opponent.manaPoints.remove(manaPoint);
		} else {
			console.error("No mana point found");
		}
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
			game.player.wizard.isIdle &&
			game.opponent.wizard.isIdle &&
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
					game.player.manaPoints.entities.length == 0 &&
					areAllItemsVisible(game.player)
				) {
					idleStateOld(game, "waiting");
					if (!game.gameId) {
						opponentMove(game, game.opponent, smartStrategy);
					}
				}
			},
			waiting: () => {
				if (
					!game.gameId &&
					game.opponent.manaPoints.entities.length == 0
				) {
					void startFight(app);
				}
			},
		};
	},
);

const tickItems = (player: Player, delta: number) => {
	player.monsters.tick(delta);
	player.mushrooms.tick(delta);
	player.protection.tick(delta);
	player.manaPoints.tick(delta);
};

const areAllItemsVisible = (player: Player) => {
	return (
		player.monsters.entities.every((item) => item.isIdle) &&
		player.protection.isIdle &&
		player.mushrooms.entities.every((item) => item.progress.isIdle) &&
		player.boughtSomething
	);
};

const manaSpawnDuration = 0.5;

const rebuildPlayerMana = (player: Player) => {
	let time = 0;
	for (let i = 0; i < initialMana; i++) {
		scheduleOld(player, i * rebuildDuration, (player) => {
			void spawnManaPointFromNothing(player);
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
					if (j == 0) {
						void spawnManaPointFromMushroom(player, mushroom);
						void flow(function* () {
							mushroom.disappear();
							yield mushroom.wait();
							player.mushrooms.remove(mushroom);
						})();
					} else {
						void spawnManaPointFromMushroom(player, mushroom, true);
					}
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
	game.opponent.wizard.waitingStart(0.5);

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
	const playerMonsters = game.player.monsters.entities.filter(
		(m) => m.state == "visible",
	).length;
	const opponentMonsters = game.opponent.monsters.entities.filter(
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
	const playerAttacker = pickFighter(game.player.monsters.entities);
	const opponentAttacker = pickFighter(game.opponent.monsters.entities);
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
			playerAttacker.approach();
			yield playerAttacker.wait();
			playerAttacker.position = { ...destination };
			playerAttacker.fight();
			yield playerAttacker.wait();
			if (playerAttacker.hp == 0) {
				game.player.monsters.remove(playerAttacker);
			} else {
				playerAttacker.setVisible();
			}
		})(),
		flow(function* () {
			opponentAttacker.approach();
			yield opponentAttacker.wait();
			opponentAttacker.position = { ...destination2 };
			opponentAttacker.fight();
			yield opponentAttacker.wait();
			if (opponentAttacker.hp == 0) {
				game.opponent.monsters.remove(opponentAttacker);
			} else {
				opponentAttacker.setVisible();
			}
		})(),
	]);
	yield pickAttackOrDefensePair(app);
});

const doWin = (app: AppT, winner: Player, loser: Player) => {
	const { game } = app;
	loser.wizard.die();
	winner.wizard.win();
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
	monster.fight();
	yield monster.wait();
	player.monsters.remove(monster);
});

const removeMushroom = flow(function* (
	player: Player,
	mushroom: Mushroom,
	delay: number,
) {
	mushroom.disappear(delay);
	yield mushroom.wait();
	player.mushrooms.remove(mushroom);
});

const pickDefensePair = flow(function* (app: AppT) {
	const { game } = app;
	const attacker =
		game.player.monsters.entities.length > 0 ? game.player : game.opponent;
	const defender =
		game.player.monsters.entities.length > 0 ? game.opponent : game.player;

	const fighter = pickFighter(
		attacker.monsters.entities.filter((m) => m.state == "visible"),
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
			fighter.approach();
			yield fighter.wait();
			fighter.position = { ...destination };
			void removeMonster(attacker, fighter);
		});
		// Attack the player
		yield Promise.all(
			attacker.monsters.entities
				.filter((m) => m.state == "visible")
				.map(doAttack),
		);
		doWin(app, attacker, defender);
		return; // Do not continue the fight
	} else if (runes == 0) {
		// Destroy shield
		const destination = pickPosition([], shieldImpactBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		fighter.approach();
		yield fighter.wait();
		fighter.position = { ...destination };
		void removeMonster(attacker, fighter);
		shield.fighting();
		yield shield.wait();
		shield.disappear();
		yield Promise.all([
			shield.wait(),
			attacker.monsters.entities
				.filter((m) => m.state == "visible")
				.map(
					flow(function* (monster: Monster) {
						monster.winReact();
						yield monster.wait();
						monster.setVisible();
					}),
				),
		]);
		void ShieldDown.play();
	} else {
		// Destroy runes
		const destination = pickPosition([], shieldImpactBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		fighter.approach();
		yield fighter.wait();
		fighter.position = { ...destination };
		defender.protection.disappearNRunes(fighter.hp);
		void ShieldDefends.play({ volume: 0.4 });
		shield.fighting();
		yield Promise.all([removeMonster(attacker, fighter), shield.wait()]);
	}

	yield pickAttackOrDefensePair(app);
});

const nextRound = (game: GameT) => {
	addManaPoints(game.opponent);
	game.player.previousStartData = getPlayerData(game.player);
	game.opponent.previousStartData = getPlayerData(game.opponent);
	game.player.boughtSomething = false;
};

////// Buying

const updateButtons = (game: GameT) => {
	const player = game.player;
	const canBuy = player.manaPoints.entities.some((p) => p.state == "visible");
	const canBuyDefense =
		player.protection.defenseCount +
			player.manaPoints.entities.filter((p) => p.state == "anticipating")
				.length <
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
	player.wizard.magicStart();
	const manaPoint = player.manaPoints.entities.find(
		(item) => item.state == "visible",
	);
	if (!manaPoint) {
		return;
	}
	manaPoint.anticipate();
	return manaPoint;
};

const unlockManaPoint = (manaPoint: Mana) => {
	manaPoint.setVisible();
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
		void spawnMushroom(player, strength, manaPoint);
	} else {
		player.mushrooms.add(
			new Mushroom(
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
		mana: player.manaPoints.entities.length,
		monsters: player.monsters.entities.map((monster) => ({
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
	void spawnMonster(player, strength, position, manaPoint);
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
	void spawnRunes(player, manaPoint, strength);
	player.boughtSomething = true;
});
