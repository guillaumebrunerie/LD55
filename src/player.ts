import {
	ClickAttack,
	ClickDefense,
	ClickMana,
	Flower5Mana,
	ManaCreated,
} from "./assets";
import { feetBounds, manaBounds, manaPointsBounds } from "./configuration";
import { EntityArray } from "./entitiesArray";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";
import { Mana } from "./mana";
import { Monster } from "./monster";
import { Mushroom } from "./mushroom";
import { Protection } from "./protection";
import { emptyPlayerData, initialMana, type PlayerData } from "./rules";
import { Rune } from "./rune";
import { pickPosition, type Point } from "./utils";
import { Wizard } from "./wizard";

const delta = 150;

export class Player extends EntityC {
	boughtSomething = false; // TODO: remove
	wizard = new Wizard();
	manaPoints = new EntityArray<Mana>();
	protection = new Protection();
	mushrooms = new EntityArray<Mushroom>();
	monsters = new EntityArray<Monster>();
	previousStartData = emptyPlayerData();
	previousEndData = emptyPlayerData();
	delay = new LinearToggle();

	constructor() {
		super();
		this.addChildren(
			this.wizard,
			this.manaPoints,
			this.protection,
			this.mushrooms,
			this.monsters,
			this.delay,
		);
	}

	reset(doIdle: boolean) {
		this.boughtSomething = false;
		if (doIdle) {
			this.wizard.appear();
		} else {
			this.wizard.disappear();
		}
		this.manaPoints.clear();
		this.protection.reset();
		this.mushrooms.clear();
		this.monsters.clear();
		this.previousStartData = emptyPlayerData();
		this.previousEndData = emptyPlayerData();
	}

	async spawnMonster(strength: 1 | 2 | 3, position: Point, manaPoint: Mana) {
		const monster = this.monsters.add(
			new Monster("waitingToAppear", position, strength),
		);
		manaPoint.travel(position);
		await manaPoint.wait();

		void ClickAttack.play();
		manaPoint.spawnOut();
		monster.setVisible();
		await manaPoint.wait();

		this.manaPoints.remove(manaPoint);
		if (this.manaPoints.entities.length == 0) {
			this.wizard.magicEnd();
		}
	}

	async spawnMushroom(strength: 1 | 2, manaPoint: Mana) {
		const position = pickPosition(
			this.mushrooms.entities,
			manaBounds,
			delta,
		);
		const mushroom = this.mushrooms.add(
			new Mushroom(position, strength, false),
		);

		manaPoint.travel(position);
		await manaPoint.wait();

		void ClickMana.play();
		manaPoint.spawnOut();
		mushroom.setVisible();
		await manaPoint.wait();

		this.manaPoints.remove(manaPoint);
		if (this.manaPoints.entities.length == 0) {
			this.wizard.magicEnd();
		}
	}

	async spawnRunes(manaPoint: Mana, runeCount: number) {
		const { shield } = this.protection;
		const position = pickPosition([], feetBounds, delta);
		for (let i = 0; i < runeCount; i++) {
			if (!shield.isPresent) {
				shield.makeWaitToAppear();
			} else {
				this.protection.addRune(new Rune(false, true)); // Waiting to appear
			}
		}

		manaPoint.travel(position);
		await manaPoint.wait();

		void ClickDefense.play({ volume: 0.7 });
		manaPoint.spawnOut();
		this.protection.appearWaitingRunes();
		await manaPoint.wait();

		this.manaPoints.remove(manaPoint);
		if (this.manaPoints.entities.length == 0) {
			this.wizard.magicEnd();
		}
	}

	addManaPoint() {
		return this.manaPoints.add(
			new Mana(
				pickPosition(this.manaPoints.entities, manaPointsBounds, delta),
			),
		);
	}

	async spawnManaPointFromNothing(delay: number, silent = false) {
		const manaPoint = this.addManaPoint();
		if (!silent) {
			void Flower5Mana.play({ volume: 1 });
		}
		manaPoint.spawn(delay);
		await manaPoint.wait();

		manaPoint.setVisible();
	}

	async spawnSingleManaPointFromMushroom(mushroom: Mushroom, delay = 0) {
		const manaPoint = this.addManaPoint();
		manaPoint.travelFrom(mushroom.position, delay);
		await manaPoint.wait();

		manaPoint.setVisible();
	}

	async spawnManaPointsFromMushroom(mushroom: Mushroom, delay: number) {
		void ManaCreated.play({ volume: 0.5 });

		for (let j = 0; j < mushroom.strength; j++) {
			void this.spawnSingleManaPointFromMushroom(mushroom, delay);
		}
		mushroom.disappear(delay);
		await mushroom.wait();
		this.mushrooms.remove(mushroom);
	}

	rebuildMana() {
		const manaSpawnDuration = 0.5;
		const rebuildDuration = 0.2;
		for (let i = 0; i < initialMana; i++) {
			void this.spawnManaPointFromNothing(i * rebuildDuration);
		}
		this.mushrooms.entities.forEach((mushroom, i) => {
			void this.spawnManaPointsFromMushroom(
				mushroom,
				i * rebuildDuration + 4 * rebuildDuration,
			);
		});
		return (
			(initialMana + this.mushrooms.entities.length) * rebuildDuration +
			manaSpawnDuration
		);
	}

	async appearRune() {
		const rune = this.protection.addRune(new Rune(false));
		rune.appear();
		await rune.wait();
	}

	async removeMonster(monster: Monster) {
		monster.hp = 0;
		monster.fight();
		await monster.wait();
		this.monsters.remove(monster);
	}

	async removeMushroom(mushroom: Mushroom, delay: number) {
		mushroom.disappear(delay);
		await mushroom.wait();
		this.mushrooms.remove(mushroom);
	}

	lockManaPoint() {
		this.wizard.magicStart();
		const manaPoint = this.manaPoints.entities.find(
			(item) => item.state == "visible",
		);
		if (!manaPoint) {
			throw new Error("no mana point to lock");
		}
		manaPoint.anticipate();
		return manaPoint;
	}

	playerData(): PlayerData {
		return {
			mana: this.manaPoints.entities.length,
			monsters: this.monsters.entities.map((monster) => ({
				strength: monster.strength,
				hp: monster.hp,
				position: monster.position,
			})),
			mushrooms: this.mushrooms.entities.map((mushroom) => ({
				strength: mushroom.strength,
			})),
			defense: this.protection.defenseCount,
		};
	}
}
