import { flow } from "mobx";
import {
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
	fightDuration,
	chestBounds,
} from "./configuration";
import { Curtain } from "./curtain";
import {
	idleState as idleStateOld,
	newEntity as newEntityOld,
	makeTick as makeTickOld,
	type Entity as EntityOld,
	schedule as scheduleOld,
} from "./entitiesOld";
import { smartStrategy, type Strategy } from "./strategies";
import type { Id } from "../convex/_generated/dataModel";
import { pickPosition, type Point } from "./utils";
import type { api } from "../convex/_generated/api";
import type { ReactMutation } from "convex/react";
import {
	initialDefense,
	initialMana,
	pickDefenseData,
	pickFighter,
	pickMonsterData,
	pickMushroomData,
} from "./rules";
import type { AppT, Credentials } from "./appLogic";
import { Rune } from "./rune";
import { Mushroom } from "./mushroom";
import { Monster } from "./monster";
import { Mana } from "./mana";
import { Player } from "./player";

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
	game.player.reset(true);
	game.opponent.reset(false);
	game.manaButton.disappear();
	game.attackButton.disappear();
	game.defenseButton.disappear();
};

export const newGame = (state: "intro" | "restart", buttons = true): GameT => ({
	...newEntityOld<GameState>(state),
	round: 0,
	player: new Player(),
	opponent: new Player(),
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
		void game.player.spawnManaPointFromNothing(t);
		void game.opponent.spawnManaPointFromNothing(t, true);
	}

	for (let i = 0; i < initialDefense; i++) {
		if (i == 0) {
			game.player.protection.shield.appear();
			game.opponent.protection.shield.appear();
		} else {
			void game.player.appearRune();
			void game.opponent.appearRune();
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

const delta = 150;

const opponentMove = (game: GameT, opponent: Player, strategy: Strategy) => {
	while (opponent.manaPoints.entities.some((p) => p.state == "visible")) {
		const type = strategy(
			game.opponent.playerData(),
			game.player.previousStartData,
			game.player.previousEndData,
		);

		switch (type) {
			case "mana": {
				const { strength } = pickMushroomData(opponent.playerData());
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
					opponent.playerData(),
				);
				const monster = new Monster("visible", position, strength);
				game.opponent.monsters.add(monster);
				break;
			}
			case "defense": {
				const result = pickDefenseData(opponent.playerData());
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
	game.player.previousEndData = game.player.playerData();
	game.opponent.previousEndData = game.opponent.playerData();
};

export const tickGame = makeTickOld<GameState, GameT, [AppT]>(
	(game: GameT, delta: number, app: AppT) => {
		game.player.tick(delta);
		game.opponent.tick(delta);
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

const areAllItemsVisible = (player: Player) => {
	return (
		player.monsters.entities.every((item) => item.isIdle) &&
		player.protection.isIdle &&
		player.mushrooms.entities.every((item) => item.progress.isIdle) &&
		player.boughtSomething
	);
};

const rebuildMana = (game: GameT, callback: () => void) => {
	idleStateOld(game, "rebuild");
	game.curtain.show();
	game.opponent.wizard.waitingStart(0.5);

	let time = 0;
	time = Math.max(time, game.player.rebuildMana());
	scheduleOld(game, time + 0.05, callback);
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
		void winner.removeMushroom(item, fightDuration * 2);
	}
	for (const item of loser.mushrooms.entities) {
		void loser.removeMushroom(item, fightDuration * 2);
	}
	idleStateOld(game, "gameover");
	app.restartButtons.appear(1);
};

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
			void attacker.removeMonster(fighter);
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
		void attacker.removeMonster(fighter);
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
		yield Promise.all([attacker.removeMonster(fighter), shield.wait()]);
	}

	yield pickAttackOrDefensePair(app);
});

const nextRound = (game: GameT) => {
	// game.opponent.addManaPoint();
	game.player.previousStartData = game.player.playerData();
	game.opponent.previousStartData = game.opponent.playerData();
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

const unlockManaPoint = (manaPoint: Mana) => {
	manaPoint.setVisible();
};

export const buyMushroom = flow(function* (
	app: AppT,
	player: Player,
	buyMushroomMutation: ReactMutation<typeof api.player.buyMushroom>,
) {
	const manaPoint = player.lockManaPoint();
	const {
		credentials,
		game: { gameId },
	} = app;
	const result: { strength: 1 | 2 } | null =
		gameId && credentials ?
			yield buyMushroomMutation(credentials)
		:	pickMushroomData(player.playerData());
	if (!result) {
		return;
	}
	const strength = result.strength;

	if (player == app.game.player) {
		void player.spawnMushroom(strength, manaPoint);
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

export const buyMonster = flow(function* (
	app: AppT,
	player: Player,
	buyMonsterMutation: (
		credentials: Credentials,
	) => Promise<{ strength: 1 | 2 | 3; position: Point } | null>,
) {
	const manaPoint = player.lockManaPoint();
	const {
		credentials,
		game: { gameId },
	} = app;
	const result: { strength: 1 | 2 | 3; position: Point } | null =
		gameId && credentials ?
			yield buyMonsterMutation(credentials)
		:	pickMonsterData(player.playerData());
	if (!result) {
		return;
	}
	const { strength, position } = result;
	void player.spawnMonster(strength, position, manaPoint);
	player.boughtSomething = true;
});

export const buyDefense = flow(function* (
	app: AppT,
	player: Player,
	buyDefenseMutation: ReactMutation<typeof api.player.buyDefense>,
) {
	const manaPoint = player.lockManaPoint();
	const {
		credentials,
		game: { gameId },
	} = app;
	const result: { strength: number } | null =
		gameId && credentials ?
			yield buyDefenseMutation(credentials)
		:	pickDefenseData(player.playerData());
	if (!result) {
		unlockManaPoint(manaPoint);
		return;
	}
	const { strength } = result;
	void player.spawnRunes(manaPoint, strength);
	player.boughtSomething = true;
});
