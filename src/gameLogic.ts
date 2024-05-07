import { runInAction } from "mobx";
import {
	ClickAttack,
	ClickDefense,
	ClickMana,
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
import {
	areIdle,
	idleState,
	newEntity,
	schedule,
	makeTick,
	type Entity,
	changeState,
} from "./entities";
import { smartStrategy, type Strategy } from "./strategies";
import {
	appearWizard,
	dieWizard,
	endWizardMagic,
	newWizard,
	startWizardMagic,
	tickWizard,
	waitingEndWizard,
	waitingStartWizard,
	winWizard,
	type WizardT,
} from "./wizard";
import type { Id } from "../convex/_generated/dataModel";
import { pickPosition } from "./utils";
import type { api } from "../convex/_generated/api";
import type { ReactMutation } from "convex/react";
import {
	initialDefense,
	initialMana,
	pickDefenseData,
	pickFighter,
	pickMonsterData,
	pickMushroomData,
	type PlayerData,
} from "./rules";
import { getDuration } from "./Animation";

export type Point = {
	x: number;
	y: number;
};

type ManaState = "visible" | "anticipating" | "spawning";
export type Mana = Entity<ManaState> & {
	position: Point;
	tmpPosition?: Point;
	scale: number;
	offset: number;
	previousItem?: Mushroom;
};

type ShieldState =
	| "appearing"
	| "visible"
	| "disappearing"
	| "hidden"
	| "fighting";
export type Shield = Entity<ShieldState> & {
	position: Point;
	tmpPosition?: Point;
	previousItem?: Mana;
	hidden?: boolean;
};

type RuneState =
	| "appearing"
	| "visible"
	| "disappearing"
	| "hidden"
	| "preSpawning"
	| "spawning";
export type Rune = Entity<RuneState> & {
	position: Point;
	tmpPosition?: Point;
	previousItem?: Mana;
	hidden?: boolean;
};

type MushroomState = "visible" | "preSpawning" | "spawning";
export type Mushroom = Entity<MushroomState> & {
	position: Point;
	tmpPosition?: Point;
	previousItem?: Mana;
	strength: 1 | 2;
};

type MonsterState =
	| "visible"
	| "approach"
	| "fighting"
	| "preSpawning"
	| "spawning";
export type Monster = Entity<MonsterState> & {
	id: string;
	position: Point;
	destination?: Point;
	strength: 1 | 2 | 3;
	hp: number;
	previousItem?: Mana;
};

type PlayerState = "idle" | "fight";
export type Player = Entity<PlayerState> & {
	wizard: WizardT;
	manaPoints: Mana[];
	items: {
		mushrooms: Mushroom[];
		shield: Shield;
		runes: Rune[];
		monsters: Monster[];
	};
	previousStartData: PlayerData;
	previousEndData: PlayerData;
};

const tickPlayer = makeTick<"idle" | "fight", Player>((player, delta) => {
	tickWizard(player.wizard, delta);
	tickItems(player, delta);
	return {};
});

const delta = 150;

const generateId = () => {
	return Math.random().toString(36).slice(2);
};

const spawnMonster = (
	array: Monster[],
	strength: 1 | 2 | 3,
	position: Point,
	manaPoint: Mana | undefined,
) => {
	const monster: Monster = {
		...newEntity("preSpawning"),
		id: generateId(),
		position,
		strength,
		hp: strength,
		destination: manaPoint?.position,
		previousItem: manaPoint,
	};
	changeState(monster, "preSpawning", preSpawnDuration, (monster) => {
		void ClickAttack.play();
		changeState(monster, "spawning", spawnDuration, (monster) => {
			idleState(monster, "visible");
		});
	});
	array.push(monster);
};

const spawnMushroom = (
	array: Mushroom[],
	bounds: Bounds,
	strength: 1 | 2,
	manaPoint: Mana | undefined,
) => {
	const position = pickPosition(array, bounds, delta);
	const mushroom: Mushroom = {
		...newEntity("preSpawning"),
		position,
		strength,
		tmpPosition: manaPoint?.position,
		previousItem: manaPoint,
	};
	changeState(mushroom, "preSpawning", preSpawnDuration, (mushroom) => {
		void ClickMana.play();
		changeState(mushroom, "spawning", spawnDuration, (mushroom) => {
			idleState(mushroom, "visible");
		});
	});
	array.push(mushroom);
};

const spawnRune = (
	array: Rune[],
	bounds: Bounds,
	manaPoint: Mana | undefined,
	hidden: boolean,
) => {
	const position = pickPosition(array, bounds, delta);
	const rune: Rune = {
		...newEntity("preSpawning"),
		position,
		tmpPosition: manaPoint?.position,
		previousItem: manaPoint,
		hidden,
	};
	changeState(rune, "preSpawning", preSpawnDuration, (rune) => {
		if (!hidden) {
			void ClickDefense.play({ volume: 0.7 });
		}
		changeState(rune, "spawning", spawnDuration, (rune) => {
			idleState(rune, "visible");
		});
	});
	array.push(rune);
};

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
	});
};

const addRune = (array: Rune[], props?: Partial<Rune>) => {
	const position = { x: 230, y: 644 };
	array.push({
		lt: 0,
		nt: 0,
		position,
		state: "visible",
		transitions: [],
		...props,
	});
};

const addMushroom = (array: Mushroom[], bounds: Bounds, strength: 1 | 2) => {
	const position = pickPosition(array, bounds, delta);
	array.push({
		lt: 0,
		nt: 0,
		position,
		strength,
		state: "visible",
		transitions: [],
	});
};

const newPlayer = (): Player => {
	const player: Player = {
		...newEntity<PlayerState>("idle"),
		wizard: newWizard(),
		manaPoints: [],
		items: {
			mushrooms: [],
			shield: {
				...newEntity<ShieldState>("hidden"),
				position: pickPosition([], playerBounds, 0),
			},
			runes: [],
			monsters: [],
		},
		previousStartData: {
			mana: 0,
			monsters: [],
			mushrooms: [],
			defense: 0,
		},
		previousEndData: {
			mana: 0,
			monsters: [],
			mushrooms: [],
			defense: 0,
		},
	};
	return player;
};

const spawnManaPoint = (
	player: Player,
	previousItem: Mushroom | undefined = undefined,
	silent = false,
) => {
	const position = pickPosition(player.manaPoints, manaPointsBounds, delta);

	const manaPoint: Mana = {
		...newEntity<ManaState>("spawning"),
		position,
		scale: 0.7 + Math.random() * 0.3,
		offset: Math.random() * 2 * Math.PI,
		previousItem,
	};
	if (!previousItem && !silent) {
		void ManaCreated.play({ volume: 0.5 });
	}
	changeState(manaPoint, "spawning", manaSpawnDuration, (manaPoint) => {
		idleState(manaPoint, "visible");
	});

	player.manaPoints.push(manaPoint);
};

const spawnManaPointSilent = (player: Player) => {
	spawnManaPoint(player, undefined, true);
};

const rebuildManaPoint = (player: Player) => {
	if (player.manaPoints.length < initialMana) {
		spawnManaPoint(player);
		return;
	}
	const item = player.items.mushrooms.pop();
	if (item) {
		void ManaCreated.play({ volume: 0.5 });
		for (let i = 0; i < item.strength; i++) {
			spawnManaPoint(player, item);
		}
	}
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
	for (const item of player.items.mushrooms) {
		for (let i = 0; i < item.strength; i++) {
			addManaPoint(
				player.manaPoints,
				manaPointsBounds,
				0.7 + Math.random() * 0.3,
				Math.random() * 2 * Math.PI,
			);
		}
	}
	player.items.mushrooms = [];
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

export type GameT = Entity<GameState> & {
	gameId?: Id<"games">;
	playerId?: Id<"players">;
	round: number;
	player: Player;
	opponent: Player;
	curtain: Curtain;
	startButton: ButtonT;
	lobby: ButtonT;
	manaButton: ButtonT;
	attackButton: ButtonT;
	defenseButton: ButtonT;
};

export const newGame = (state: "intro" | "restart", buttons = true): GameT => ({
	...newEntity<GameState>(state),
	round: 0,
	player: newPlayer(),
	opponent: newPlayer(),
	curtain: newCurtain(),
	startButton: newButton(true),
	lobby: newButton(false),
	manaButton: newButton(buttons),
	attackButton: newButton(buttons),
	defenseButton: newButton(buttons),
});

export const startGame = (game: GameT) => {
	void WinMusic.stop();
	void Music.play({ loop: true, volume: 0.5 });
	if (game.state == "gameover") {
		restartGame(game);
		return;
	}
	idleState(game, "transition");
	disappearButton(game.startButton);
	void WizardStart.play();
	appearWizard(game.opponent.wizard);
	appearWizard(game.player.wizard);
	schedule(showCurtain, game.curtain, 0.7);
	schedule(waitingStartWizard, game.opponent.wizard, 0);
	schedule(appearButton, game.manaButton, 1.2);
	schedule(appearButton, game.attackButton, 1.2);
	schedule(appearButton, game.defenseButton, 1.2);

	let t = 1;
	for (let i = 0; i < initialMana; i++) {
		t += 0.1;
		schedule(spawnManaPoint, game.player, i == 0 ? 1.1 : 0.1);
		schedule(spawnManaPointSilent, game.opponent, i == 0 ? 1.1 : 0.1);
	}

	for (let i = 0; i < initialDefense; i++) {
		if (i == 0) {
			appearShield(game.player);
			appearShield(game.opponent);
		} else {
			appearRune(game.player);
			appearRune(game.opponent);
		}
	}
};

const appearShield = (player: Player) => {
	changeState(
		player.items.shield,
		"appearing",
		getDuration(ShieldStart, 20),
		(shield) => {
			idleState(shield, "visible");
		},
	);
};

const disappearShield = (player: Player) => {
	changeState(
		player.items.shield,
		"disappearing",
		getDuration(ShieldEnd, 20),
		(shield) => {
			idleState(shield, "hidden");
		},
	);
};

const hasShield = (player: Player) => {
	return ["visible", "appearing", "fighting"].includes(
		player.items.shield.state,
	);
};

const appearRune = (player: Player) => {
	const position = { x: 230, y: 644 };
	const rune: Rune = {
		...newEntity("hidden"),
		position,
		hidden: false,
	};
	changeState(rune, "appearing", spawnDuration, (rune) => {
		idleState(rune, "visible");
	});
	player.items.runes.push(rune);
};

const restartGame = (game: GameT) => {
	idleState(game, "restart");
	disappearButton(game.startButton);
	for (const player of [game.player, game.opponent]) {
		if (player.wizard.state == "die") {
			appearWizard(player.wizard);
		} else {
			idleState(player.wizard, "idle");
		}
	}
	schedule(showCurtain, game.curtain, 0.7);
	schedule(waitingStartWizard, game.opponent.wizard, 0);
	schedule(appearButton, game.manaButton, 1.2);
	schedule(appearButton, game.attackButton, 1.2);
	schedule(appearButton, game.defenseButton, 1.2);

	for (let i = 0; i < initialMana; i++) {
		schedule(spawnManaPoint, game.player, i == 0 ? 1.2 : 0.2);
		schedule(spawnManaPointSilent, game.opponent, i == 0 ? 1.2 : 0.2);
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

export const setupFight = (game: GameT, lastFight: LastFight) => {
	if (lastFight.round != game.round + 1) {
		throw new Error("Invalid round");
	}

	// Set up monsters
	game.opponent.items.monsters = [];
	for (const monsterData of lastFight.opponent.monsters) {
		const { hp, strength, position } = monsterData;
		const monster: Monster = {
			...newEntity("visible"),
			id: generateId(),
			position,
			strength,
			hp,
		};
		game.opponent.items.monsters.push(monster);
	}
	// Set up defense
	game.opponent.items.runes = [];
	idleState(game.opponent.items.shield, "hidden");
	for (let i = 0; i < lastFight.opponent.defense; i++) {
		if (i == 0) {
			idleState(game.opponent.items.shield, "visible");
		} else {
			addRune(game.opponent.items.runes);
		}
	}
	// Set up mushrooms
	game.opponent.items.mushrooms = [];
	for (const mushroomData of lastFight.opponent.mushrooms) {
		const { strength } = mushroomData;
		const mushroom: Mushroom = {
			...newEntity("visible"),
			position: pickPosition(
				game.opponent.items.mushrooms,
				manaBounds,
				delta,
			),
			strength,
		};
		game.opponent.items.mushrooms.push(mushroom);
	}
	// Set up mana points
	game.opponent.manaPoints = [];
	// Clear round data
	game.round = lastFight.round;

	// Start the fight
	idleState(game, "attack");
	waitingEndWizard(game.opponent.wizard, () => {
		hideCurtain(game.curtain, () => {
			pickAttackOrDefensePair(game);
		});
	});
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
					position: pickPosition(
						game.opponent.items.mushrooms,
						manaBounds,
						delta,
					),
					strength,
				};
				game.opponent.items.mushrooms.push(mushroom);
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
				game.opponent.items.monsters.push(monster);
				break;
			}
			case "defense": {
				const result = pickDefenseData(getPlayerData(opponent));
				if (!result) {
					continue;
				}
				const { strength } = result;

				const add = () => {
					if (!hasShield(game.opponent)) {
						idleState(game.opponent.items.shield, "visible");
					} else {
						addRune(game.opponent.items.runes);
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

const rebuildDuration = 0.1;

export const tickGame = makeTick<GameState, GameT>(
	(game: GameT, delta: number) => {
		tickPlayer(game.player, delta);
		tickPlayer(game.opponent, delta);
		tickCurtain(game.curtain, delta);
		tickButton(game.startButton, delta);
		tickButton(game.lobby, delta);
		updateButtons(game);
		tickButton(game.manaButton, delta);
		tickButton(game.attackButton, delta);
		tickButton(game.defenseButton, delta);
		const idle = areIdle(
			game.player.wizard,
			game.opponent.wizard,
			game.curtain,
			game.startButton,
			game.manaButton,
			game.attackButton,
			game.defenseButton,
		);
		return {
			transition: () => {
				if (idle) {
					idleState(game, "buildUp");
				}
			},
			restart: () => {
				if (idle) {
					idleState(game, "buildUp");
				}
			},
			buildUp: () => {
				if (
					game.player.manaPoints.length == 0 &&
					areAllItemsVisible(game.player)
				) {
					idleState(game, "waiting");
					if (!game.gameId) {
						opponentMove(game, game.opponent, smartStrategy);
					}
				}
			},
			waiting: () => {
				if (!game.gameId && game.opponent.manaPoints.length == 0) {
					idleState(game, "attack");
					waitingEndWizard(game.opponent.wizard, () => {
						hideCurtain(game.curtain, () => {
							pickAttackOrDefensePair(game);
						});
					});
				}
			},
			attack: () => {
				// if (areAllItemsVisible(game.player)) {
				// 	pickAttackOrDefensePair(game);
				// }
			},
		};
	},
);

const rebuildOne = (game: GameT) => {
	if (hasManaToSpawn(game.player)) {
		rebuildManaPoint(game.player);
		changeState(game, "rebuild", rebuildDuration, () => rebuildOne(game));
	} else {
		idleState(game, "buildUp");
		nextRound(game);
	}
};

const tickItems = (player: Player, delta: number) => {
	for (const item of player.items.monsters) {
		if (player.state == "fight") {
			item.position.x += delta * 25;
		}
		tickMonster(item, delta);
	}
	for (const item of player.items.mushrooms) {
		tickMushroom(item, delta);
	}
	tickShield(player.items.shield, delta);
	for (const item of player.items.runes) {
		tickRune(item, delta);
	}
	for (const item of player.manaPoints) {
		tickManaPoint(item, delta);
	}
};

const areAllItemsVisible = (player: Player) => {
	return (
		player.items.monsters.every((item) => item.state == "visible") &&
		player.items.runes.every((item) => item.state == "visible") &&
		player.items.mushrooms.every((item) => item.state == "visible")
	);
};

const preSpawnDuration = 0.2;
const spawnDuration = 0.3;

const tickMonster = makeTick<MonsterState, Monster>((item) => {
	return {
		preSpawning: () => {
			if (!item.previousItem) {
				item.destination = item.position;
			} else {
				const prevPos = item.previousItem.position;
				item.destination = {
					x: prevPos.x + (item.position.x - prevPos.x) * item.nt,
					y: prevPos.y + (item.position.y - prevPos.y) * item.nt,
				};
			}
		},
		spawning: () => {
			item.destination = undefined;
		},
	};
});

const tickShield = makeTick<ShieldState, Shield>();

const tickRune = makeTick<RuneState, Rune>((item) => {
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

const tickMushroom = makeTick<MushroomState, Mushroom>((item) => {
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

const manaSpawnDuration = 0.5;

const tickManaPoint = makeTick<ManaState, Mana>((item) => {
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

const pickAttackOrDefensePair = (game: GameT) => {
	const playerMonsters = game.player.items.monsters.filter(
		(m) => m.state == "visible",
	).length;
	const opponentMonsters = game.opponent.items.monsters.filter(
		(m) => m.state == "visible",
	).length;
	if (playerMonsters == 0 && opponentMonsters == 0) {
		// No monsters, we move to the next round
		showCurtain(game.curtain);
		schedule(waitingStartWizard, game.opponent.wizard, 0.5);
		rebuildOne(game);
		return;
	}
	if (playerMonsters > 0 && opponentMonsters > 0) {
		// Monsters on both sides, we attack
		pickAttackPair(game);
		return;
	}
	pickDefensePair(game);
};

const pickAttackPair = (game: GameT) => {
	const playerAttacker = pickFighter(game.player.items.monsters);
	const opponentAttacker = pickFighter(game.opponent.items.monsters);
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
				game.player.items.monsters = game.player.items.monsters.filter(
					(item) => item != playerAttacker,
				);
			} else {
				idleState(playerAttacker, "visible");
			}
			count--;
			if (count == 0) {
				pickAttackOrDefensePair(game);
			}
		});
	});

	changeState(opponentAttacker, "approach", attackApproachDuration, () => {
		opponentAttacker.position = { ...destination2 };
		changeState(opponentAttacker, "fighting", fightDuration, () => {
			if (opponentAttacker.hp == 0) {
				game.opponent.items.monsters =
					game.opponent.items.monsters.filter(
						(item) => item != opponentAttacker,
					);
			} else {
				idleState(opponentAttacker, "visible");
			}
			count--;
			if (count == 0) {
				pickAttackOrDefensePair(game);
			}
		});
	});
};

const doWin = (game: GameT, winner: Player, loser: Player) => {
	dieWizard(loser.wizard);
	winWizard(winner.wizard);
	void WizardHit.play({ volume: 2 });
	void Music.stop();
	void WinMusic.play({ loop: true, volume: 0.5 });
	disappearButton(game.manaButton);
	disappearButton(game.attackButton);
	disappearButton(game.defenseButton);
	runeTombola()(winner);
	for (const item of winner.items.monsters) {
		if (item.state == "visible") {
			changeState(item, "visible", fightDuration * 2, () => {
				removeMonster(winner, item);
			});
		}
	}
	idleState(game, "gameover");
	schedule(appearButton, game.startButton, 1);
};

const removeRune = (player: Player, rune: Rune) => {
	changeState(rune, "disappearing", fightDuration, (rune) => {
		player.items.runes = player.items.runes.filter((item) => item != rune);
	});
};

const removeMonster = (player: Player, monster: Monster) => {
	monster.hp = 0;
	changeState(monster, "fighting", fightDuration, (monster) => {
		player.items.monsters = player.items.monsters.filter(
			(item) => item.id != monster.id,
		);
	});
};

const pickDefensePair = (game: GameT) => {
	const attacker =
		game.player.items.monsters.length > 0 ? game.player : game.opponent;
	const defender =
		game.player.items.monsters.length > 0 ? game.opponent : game.player;

	const fighter = pickFighter(
		attacker.items.monsters.filter((m) => m.state == "visible"),
	);
	const runes = defender.items.runes.filter(
		(r) => r.state == "visible",
	).length;
	const shield = defender.items.shield;
	void MonsterAttacks.play({ volume: 0.5 });
	if (!hasShield(defender)) {
		// Attack the player
		const destination = pickPosition(defender.items.runes, chestBounds, 0);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		changeState(fighter, "approach", attackApproachDuration, () => {
			fighter.position = { ...destination };
			removeMonster(attacker, fighter);
			doWin(game, attacker, defender);
		});
		return; // Do not continue the fight
	} else if (runes == 0) {
		// Destroy shield
		const destination = pickPosition(
			defender.items.runes,
			shieldImpactBounds,
			0,
		);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		changeState(fighter, "approach", attackApproachDuration, () => {
			fighter.position = { ...destination };
			removeMonster(attacker, fighter);
			disappearShield(defender);
			void ShieldDown.play();
		});
	} else {
		// Destroy runes
		const destination = pickPosition(
			defender.items.runes,
			shieldImpactBounds,
			0,
		);
		destination.x = 1920 - destination.x;
		fighter.destination = destination;
		changeState(fighter, "approach", attackApproachDuration, () => {
			fighter.position = { ...destination };
			defender.items.runes
				.toReversed()
				.slice(0, Math.min(fighter.hp, runes))
				.forEach((rune) => {
					removeRune(defender, rune);
				});
			removeMonster(attacker, fighter);
			changeState(shield, "fighting", fightDuration, () => {
				idleState(shield, "visible");
			});
			void ShieldDefends.play({ volume: 0.4 });
		});
	}

	changeState(game, "defense", attackApproachDuration + fightDuration, () => {
		pickAttackOrDefensePair(game);
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
		player.items.runes = [];
		const { tombola, next } = pickTombola(previous);
		for (let i = 0; i < 15; i++) {
			addRune(player.items.runes, {
				state: tombola[i] ? "visible" : "hidden",
			});
		}
		schedule(runeTombola(next), player, 0.12);
	};

const hasManaToSpawn = (player: Player) => {
	return (
		player.manaPoints.length < initialMana ||
		player.items.mushrooms.length > 0
	);
};

const nextRound = (game: GameT) => {
	addManaPoints(game.opponent);
	game.player.previousStartData = getPlayerData(game.player);
	game.opponent.previousStartData = getPlayerData(game.opponent);
};

////// Buying

const updateButtons = (game: GameT) => {
	const player = game.player;
	const canBuy = player.manaPoints.some((p) => p.state == "visible");
	const canBuyDefense =
		player.items.runes.length +
			(hasShield(player) ? 1 : 0) +
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
	startWizardMagic(player);
	const manaPoint = player.manaPoints.find((item) => item.state == "visible");
	if (!manaPoint) {
		return;
	}
	idleState(manaPoint, "anticipating");
	return manaPoint;
};

const unlockManaPoint = (_game: GameT, manaPoint: Mana) => {
	idleState(manaPoint, "visible");
};

const spendManaPoint = (player: Player, manaPoint: Mana | undefined) => {
	if (!manaPoint) {
		return;
	}
	player.manaPoints = player.manaPoints.filter((item) => item != manaPoint);
	endWizardMagic(player);
};

export const buyMushroom = async (
	game: GameT,
	player: Player,
	buyMushroomMutation: ReactMutation<typeof api.functions.buyMushroom>,
) => {
	const manaPoint = lockManaPoint(player);
	const playerId = game.playerId;
	const result =
		playerId ?
			await buyMushroomMutation({
				playerId,
			})
		:	pickMushroomData(getPlayerData(player));
	if (!result) {
		return;
	}
	const strength = result.strength;
	runInAction(() => {
		spendManaPoint(player, manaPoint);
		if (player == game.player) {
			spawnMushroom(
				player.items.mushrooms,
				manaBounds,
				strength,
				manaPoint,
			);
		} else {
			addMushroom(player.items.mushrooms, manaBounds, strength);
		}
	});
};

const getPlayerData = (player: Player): PlayerData => {
	return {
		mana: player.manaPoints.length,
		monsters: player.items.monsters.map((monster) => ({
			strength: monster.strength,
			hp: monster.hp,
			position: monster.position,
		})),
		mushrooms: player.items.mushrooms.map((mushroom) => ({
			strength: mushroom.strength,
		})),
		defense: player.items.runes.length + (hasShield(player) ? 1 : 0),
	};
};

export const buyMonster = async (
	game: GameT,
	player: Player,
	buyMonsterMutation: ReactMutation<typeof api.functions.buyMonster>,
) => {
	const manaPoint = lockManaPoint(player);
	const playerId = game.playerId;
	const result =
		playerId ?
			await buyMonsterMutation({ playerId })
		:	pickMonsterData(getPlayerData(player));
	if (!result) {
		return;
	}
	runInAction(() => {
		const { strength, position } = result;
		spendManaPoint(player, manaPoint);
		spawnMonster(player.items.monsters, strength, position, manaPoint);
	});
};

export const buyDefense = async (
	game: GameT,
	player: Player,
	buyDefenseMutation: ReactMutation<typeof api.functions.buyDefense>,
) => {
	const manaPoint = lockManaPoint(player);
	if (!manaPoint) {
		console.error("No mana point");
		return;
	}
	const playerId = game.playerId;
	const result =
		playerId ?
			await buyDefenseMutation({ playerId })
		:	pickDefenseData(getPlayerData(player));
	runInAction(() => {
		if (!result) {
			unlockManaPoint(game, manaPoint);
			return;
		}
		const { strength } = result;
		spendManaPoint(player, manaPoint);
		const add = (hidden: boolean) => {
			if (!hasShield(player)) {
				if (!hidden) {
					void ClickDefense.play({ volume: 0.7 });
				}
				appearShield(player);
			} else {
				if (player == game.player) {
					spawnRune(
						player.items.runes,
						feetBounds,
						manaPoint,
						hidden,
					);
				} else {
					addRune(player.items.runes);
				}
			}
		};
		add(false);
		if (strength >= 2) {
			add(true);
		}
		if (strength >= 3) {
			add(true);
		}
	});
};
