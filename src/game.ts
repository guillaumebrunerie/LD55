import type { ReactMutation } from "convex/react";
import type { Id } from "../convex/_generated/dataModel";
import {
	MonsterAttacks,
	Music,
	WinMusic,
	WizardHit,
	WizardStart,
} from "./assets";
import { Button } from "./button";
import {
	chestBounds,
	fightDuration,
	manaBounds,
	shieldImpactBounds,
} from "./configuration";
import { Curtain } from "./curtain";
import { EntityC } from "./entitiesC";
import { Logo } from "./logo";
import { Monster } from "./monster";
import { Mushroom } from "./mushroom";
import { Player } from "./player";
import {
	initialDefense,
	initialMana,
	pickDefenseData,
	pickFighter,
	pickMonsterData,
	pickMushroomData,
} from "./rules";
import { Rune } from "./rune";
import { smartStrategy, type Strategy } from "./strategies";
import { pickPosition, type Point } from "./utils";
import type { api } from "../convex/_generated/api";

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

const delta = 150;

export type Credentials = {
	playerId: Id<"players">;
	token: string;
};

export class Game extends EntityC {
	state: GameState = "intro";
	player = new Player();
	opponent = new Player();

	logo = new Logo();
	curtain = new Curtain();
	manaButton = new Button(false);
	attackButton = new Button(false);
	defenseButton = new Button(false);
	restartButtons = new Button(false);
	startButtons = new Button(true);
	lobby = new Button(false);
	menuButton = new Button(false);

	credentials: Credentials | undefined;
	opponentId: Id<"players"> | undefined;
	gameId: Id<"games"> | undefined;
	round = 0;

	constructor() {
		super();
		this.state = "intro";
		this.addChildren(
			this.player,
			this.opponent,
			this.curtain,
			this.manaButton,
			this.attackButton,
			this.defenseButton,
			this.logo,
			this.restartButtons,
			this.startButtons,
			this.lobby,
			this.menuButton,
		);
		this.addTicker(() => {
			this.updateButtons();
		});
		this.addTicker(() => {
			switch (this.state) {
				case "transition": {
					if (this.isIdle) {
						this.state = "buildUp";
					}
					break;
				}
				case "restart": {
					if (this.isIdle) {
						this.state = "buildUp";
					}
					break;
				}
				case "buildUp": {
					if (
						this.player.manaPoints.entities.length == 0 &&
						this.player.isIdle
					) {
						this.state = "waiting";
						if (!this.gameId) {
							this.opponentMove(smartStrategy);
						}
					}
					break;
				}
				case "waiting": {
					if (
						!this.gameId &&
						this.opponent.manaPoints.entities.length == 0
					) {
						void this.startFight();
					}
					break;
				}
			}
		});
	}

	async start() {
		this.logo.appear(0.4);
		this.player.wizard.appear(1);
		await this.player.wizard.wait();
		this.player.wizard.lt = 0;
	}

	startGame() {
		void WinMusic.stop();
		if (!Music.isPlaying) {
			void Music.play({ loop: true, volume: 0.5 });
		}
		this.logo.hide();
		this.lobby.disappear();
		this.startButtons.disappear();
		this.restartButtons.disappear();
		this.curtain.show(0.7);
		this.manaButton.appear(1.2);
		this.attackButton.appear(1.2);
		this.defenseButton.appear(1.2);
		this.state = "transition";
		void WizardStart.play();
		const opponentWizard = this.opponent.wizard;
		void (async function () {
			opponentWizard.appear();
			await opponentWizard.wait();
			await opponentWizard.waitingStart(0.5);
		})();

		let t = 1;
		for (let i = 0; i < initialMana; i++) {
			t += 0.2;
			void this.player.spawnManaPointFromNothing(t);
			void this.opponent.spawnManaPointFromNothing(t, true);
		}

		for (let i = 0; i < initialDefense; i++) {
			if (i == 0) {
				this.player.protection.shield.appear();
				this.opponent.protection.shield.appear();
			} else {
				void this.player.appearRune();
				void this.opponent.appearRune();
			}
		}
	}

	startNewGameAgainstComputer() {
		this.logo.show();
		this.reset();
		this.startGame();
	}

	startNewGameAgainstPlayer(gameId: Id<"games">) {
		this.logo.show();
		this.reset();
		this.gameId = gameId;
		this.startGame();
	}

	async startFight() {
		this.state = "attack";
		await this.opponent.wizard.waitingEnd();
		await this.opponent.wizard.wait();
		this.curtain.hide();
		await this.curtain.wait();
		await this.pickAttackOrDefensePair();
	}

	async pickAttackOrDefensePair() {
		const playerMonsters = this.player.monsters.entities.filter(
			(m) => m.state == "visible" || m.state == "winning",
		).length;
		const opponentMonsters = this.opponent.monsters.entities.filter(
			(m) => m.state == "visible" || m.state == "winning",
		).length;

		if (playerMonsters == 0 && opponentMonsters == 0) {
			// No monsters, we move to the next round
			await this.rebuildMana();
			this.nextRound();
		} else if (playerMonsters > 0 && opponentMonsters > 0) {
			// Monsters on both sides, two monsters attack each other
			await this.pickAttackPair();
		} else {
			// Monsters on one side, a monster attacks the other player
			await this.pickDefensePair();
		}
	}

	async pickAttackPair() {
		const playerAttacker = pickFighter(this.player.monsters.entities);
		const opponentAttacker = pickFighter(this.opponent.monsters.entities);
		const fightStrength = Math.min(playerAttacker.hp, opponentAttacker.hp);

		const destination = {
			x:
				(1920 -
					opponentAttacker.position.x +
					playerAttacker.position.x) /
				2,
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

		await Promise.all([
			(async () => {
				playerAttacker.approach();
				await playerAttacker.wait();
				playerAttacker.position = { ...destination };
				playerAttacker.fight();
				await playerAttacker.wait();
				if (playerAttacker.hp == 0) {
					this.player.monsters.remove(playerAttacker);
				} else {
					playerAttacker.setVisible();
				}
			})(),
			(async () => {
				opponentAttacker.approach();
				await opponentAttacker.wait();
				opponentAttacker.position = { ...destination2 };
				opponentAttacker.fight();
				await opponentAttacker.wait();
				if (opponentAttacker.hp == 0) {
					this.opponent.monsters.remove(opponentAttacker);
				} else {
					opponentAttacker.setVisible();
				}
			})(),
		]);
		await this.pickAttackOrDefensePair();
	}

	async pickDefensePair() {
		const attacker =
			this.player.monsters.entities.length > 0 ?
				this.player
			:	this.opponent;
		const defender =
			this.player.monsters.entities.length > 0 ?
				this.opponent
			:	this.player;

		const fighter = pickFighter(
			attacker.monsters.entities.filter(
				(m) => m.state == "visible" || m.state == "winning",
			),
		);
		const runes = defender.protection.runeCount;
		const shield = defender.protection.shield;
		void MonsterAttacks.play({ volume: 0.5 });

		if (!shield.isPresent) {
			const doAttack = async (fighter: Monster) => {
				const destination = pickPosition([], chestBounds, 0);
				destination.x = 1920 - destination.x;
				fighter.destination = destination;
				fighter.finalApproach = true;
				fighter.approach();
				await fighter.wait();
				fighter.position = { ...destination };
				void attacker.removeMonster(fighter);
			};
			// Attack the player
			await Promise.all(
				attacker.monsters.entities
					.filter((m) => m.state == "visible" || m.state == "winning")
					.map(doAttack),
			);
			this.doWin(attacker, defender);
			return; // Do not continue the fight
		} else if (runes == 0) {
			// Destroy shield
			const destination = pickPosition([], shieldImpactBounds, 0);
			destination.x = 1920 - destination.x;
			fighter.destination = destination;
			fighter.approach();
			await fighter.wait();
			fighter.position = { ...destination };
			void attacker.removeMonster(fighter);
			shield.fighting();
			attacker.monsters.entities
				.filter((m) => m.state == "visible")
				.forEach((monster: Monster) => {
					monster.winReact();
				});
			await shield.wait();
			shield.disappear();
			await Promise.all([
				shield.wait(),
				attacker.monsters.entities
					.filter((m) => m.state == "visible")
					.map(async (monster: Monster) => {
						await monster.wait();
					}),
			]);
		} else {
			// Destroy runes
			const destination = pickPosition([], shieldImpactBounds, 0);
			destination.x = 1920 - destination.x;
			fighter.destination = destination;
			fighter.approach();
			await fighter.wait();
			fighter.position = { ...destination };
			defender.protection.disappearNRunes(fighter.hp);
			shield.fighting();
			await Promise.all([attacker.removeMonster(fighter), shield.wait()]);
		}

		await this.pickAttackOrDefensePair();
	}

	doWin(winner: Player, loser: Player) {
		loser.wizard.die();
		winner.wizard.win();
		void WizardHit.play({ volume: 2 });
		void Music.stop();
		void WinMusic.play({ loop: true, volume: 0.5 });
		this.manaButton.disappear();
		this.attackButton.disappear();
		this.defenseButton.disappear();
		winner.protection.startTombola();
		for (const item of winner.mushrooms.entities) {
			void winner.removeMushroom(item, fightDuration * 2);
		}
		for (const item of loser.mushrooms.entities) {
			void loser.removeMushroom(item, fightDuration * 2);
		}
		this.state = "gameover";
		this.restartButtons.appear(1);
	}

	get isIdle() {
		return (
			this.player.wizard.isIdle &&
			this.opponent.wizard.isIdle &&
			this.curtain.isIdle &&
			this.manaButton.isIdle &&
			this.attackButton.isIdle &&
			this.defenseButton.isIdle
		);
	}

	reset() {
		this.state = "intro";
		if (WinMusic.isPlaying) {
			void WinMusic.stop();
		}
		if (!Music.isPlaying) {
			void Music.play({ loop: true, volume: 0.5 });
		}
		this.round = 0;
		this.curtain.hide();
		this.player.reset(true);
		this.opponent.reset(false);
		this.manaButton.disappear();
		this.attackButton.disappear();
		this.defenseButton.disappear();
	}

	opponentMove(strategy: Strategy) {
		while (
			this.opponent.manaPoints.entities.some((p) => p.state == "visible")
		) {
			const type = strategy(
				this.opponent.playerData(),
				this.player.previousStartData,
				this.player.previousEndData,
			);

			switch (type) {
				case "mana": {
					const { strength } = pickMushroomData(
						this.opponent.playerData(),
					);
					this.opponent.mushrooms.add(
						new Mushroom(
							pickPosition(
								this.opponent.mushrooms.entities,
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
						this.opponent.playerData(),
					);
					const monster = new Monster("visible", position, strength);
					this.opponent.monsters.add(monster);
					break;
				}
				case "defense": {
					const result = pickDefenseData(this.opponent.playerData());
					if (!result) {
						continue;
					}
					const { strength } = result;

					const add = () => {
						if (!this.opponent.protection.shield.isPresent) {
							this.opponent.protection.shield.setVisible();
						} else {
							this.opponent.protection.addRune(new Rune());
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

			const manaPoint = this.opponent.manaPoints.entities.find(
				(item) => item.state == "visible",
			);
			if (manaPoint) {
				this.opponent.manaPoints.remove(manaPoint);
			} else {
				console.error("No mana point found");
			}
		}

		// Save the end data before the fight starts
		this.player.previousEndData = this.player.playerData();
		this.opponent.previousEndData = this.opponent.playerData();
	}

	async rebuildMana() {
		this.state = "rebuild";
		this.curtain.show();
		void this.opponent.wizard.waitingStart(0.5);

		await this.player.rebuildMana();
		// TODO: Wait 0.05 seconds?
	}

	nextRound() {
		this.state = "buildUp";
		this.opponent.rebuildManaInstant();
		this.player.previousStartData = this.player.playerData();
		this.opponent.previousStartData = this.opponent.playerData();
		this.player.boughtSomething = false;
	}

	updateButtons() {
		const player = this.player;
		const canBuy = player.manaPoints.entities.some(
			(p) => p.state == "visible",
		);
		const canBuyDefense =
			player.protection.defenseCount +
				player.manaPoints.entities.filter(
					(p) => p.state == "anticipating",
				).length <
			16;
		if (canBuy && canBuyDefense && this.state == "buildUp") {
			this.defenseButton.fadeOn();
			this.manaButton.fadeOn();
			this.attackButton.fadeOn();
		} else if (canBuy && this.state == "buildUp") {
			this.defenseButton.fadeOff();
			this.manaButton.fadeOn();
			this.attackButton.fadeOn();
		} else {
			this.defenseButton.fadeOff();
			this.manaButton.fadeOff();
			this.attackButton.fadeOff();
		}
	}

	setupFight(lastFight: LastFight) {
		if (lastFight.round != this.round + 1) {
			throw new Error("Invalid round");
		}

		// Set up monsters
		this.opponent.monsters.clear();
		for (const monsterData of lastFight.opponent.monsters) {
			const { hp, strength, position } = monsterData;
			const monster = new Monster("visible", position, strength, hp);
			this.opponent.monsters.add(monster);
		}
		// Set up defense
		this.opponent.protection.removeAllRunes();
		this.opponent.protection.shield.setHidden();
		for (let i = 0; i < lastFight.opponent.defense; i++) {
			if (i == 0) {
				this.opponent.protection.shield.setVisible();
			} else {
				this.opponent.protection.addRune(new Rune());
			}
		}
		// Set up mushrooms
		this.opponent.mushrooms.clear();
		for (const mushroomData of lastFight.opponent.mushrooms) {
			const { strength } = mushroomData;
			this.opponent.mushrooms.add(
				new Mushroom(
					pickPosition(
						this.opponent.mushrooms.entities,
						manaBounds,
						delta,
					),
					strength,
					true,
				),
			);
		}
		// Set up mana points
		this.opponent.manaPoints.clear();
		// Clear round data
		this.round = lastFight.round;

		// Start the fight
		void this.startFight();
	}

	// Buying

	async buyMushroom(
		player: Player,
		buyMushroomMutation: ReactMutation<typeof api.player.buyMushroom>,
	) {
		const manaPoint = player.lockManaPoint();
		const result: { strength: 1 | 2 } | null =
			this.gameId && this.credentials ?
				await buyMushroomMutation(this.credentials)
			:	pickMushroomData(player.playerData());
		if (!result) {
			return;
		}
		const strength = result.strength;

		if (player == this.player) {
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
	}

	async buyMonster(
		player: Player,
		buyMonsterMutation: (
			credentials: Credentials,
		) => Promise<{ strength: 1 | 2 | 3; position: Point } | null>,
	) {
		const manaPoint = player.lockManaPoint();
		const result: { strength: 1 | 2 | 3; position: Point } | null =
			this.gameId && this.credentials ?
				await buyMonsterMutation(this.credentials)
			:	pickMonsterData(player.playerData());
		if (!result) {
			return;
		}
		const { strength, position } = result;
		void player.spawnMonster(strength, position, manaPoint);
		player.boughtSomething = true;
	}

	async buyDefense(
		player: Player,
		buyDefenseMutation: ReactMutation<typeof api.player.buyDefense>,
	) {
		const manaPoint = player.lockManaPoint();
		const result: { strength: number } | null =
			this.gameId && this.credentials ?
				await buyDefenseMutation(this.credentials)
			:	pickDefenseData(player.playerData());
		if (!result) {
			manaPoint.unlock();
			return;
		}
		const { strength } = result;
		void player.spawnRunes(manaPoint, strength);
		player.boughtSomething = true;
	}
}

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
