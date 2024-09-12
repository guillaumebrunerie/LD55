import { EntityArray } from "./entitiesArray";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";
import { Rune } from "./rune";
import { Shield } from "./shield";

export class Protection extends EntityC {
	shield = new Shield();
	runes = new EntityArray<Rune>();
	inTombola = false;
	tombolaTimer = new LinearToggle();

	constructor() {
		super();
		this.addChildren(this.shield, this.tombolaTimer, this.runes);
	}

	reset() {
		this.inTombola = false;
		this.runes.clear();
		this.shield.fadeOut();
	}

	async disappearRune(rune: Rune) {
		rune.disappear();
		await rune.wait();
		this.runes.remove(rune);
	}

	disappearNRunes(n: number) {
		this.runes.entities
			.toReversed()
			.slice(0, Math.min(n, this.runeCount))
			.forEach((rune) => this.disappearRune(rune));
	}

	appearWaitingRunes() {
		if (this.shield.isPresent) {
			this.shield.appear();
		}
		for (const rune of this.runes.entities) {
			if (rune.isWaitingToAppear) {
				rune.appear();
			}
		}
	}

	removeAllRunes() {
		this.removeChildren(...this.runes.entities);
		this.runes.clear();
	}

	addRune(rune: Rune) {
		this.runes.add(rune);
		this.children.push(rune);
	}

	startTombola() {
		this.inTombola = true;
		void this.runeTombola();
	}

	async runeTombola(previous: number[] = [1, 2, 0, 1]) {
		if (!this.inTombola) {
			return;
		}
		this.removeAllRunes();
		const { tombola, next } = this.pickTombola(previous);
		for (let i = 0; i < 15; i++) {
			this.addRune(new Rune(tombola[i]));
		}
		this.tombolaTimer.value = 0;
		this.tombolaTimer.setTarget(1, 0.12);
		await this.tombolaTimer.wait();
		await this.runeTombola(next);
	}

	pickTombola(previous: number[]) {
		const next = [];
		const tombola: boolean[] = Array(16).fill(false);
		for (let i = 0; i < 4; i++) {
			const v = [0, 1, 2, 3].filter((x) => x !== previous[i])[
				Math.floor(Math.random() * 3)
			];
			next.push(v);
			tombola[v + i * 4] = true;
		}
		return { next, tombola };
	}

	get isIdle() {
		return (
			this.shield.progress.isIdle &&
			this.runes.entities.every((rune) => rune.isIdle)
		);
	}

	get runeCount() {
		return this.runes.entities.length;
	}

	get defenseCount() {
		return this.runes.entities.length + (this.shield.isPresent ? 1 : 0);
	}
}
