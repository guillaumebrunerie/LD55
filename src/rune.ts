import { fightDuration } from "./configuration";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";

const spawnDuration = 0.3;

export class Rune extends EntityC {
	progress = new LinearToggle();
	isWaitingToAppear = false;

	constructor(visible = true, isWaitingToAppear = false) {
		super();
		this.isWaitingToAppear = isWaitingToAppear;
		this.progress = new LinearToggle(visible ? 1 : 0);
		this.addChildren(this.progress);
	}

	get nt() {
		return this.progress.value;
	}

	appear() {
		this.isWaitingToAppear = false;
		this.progress.setTarget(1, spawnDuration);
	}

	disappear() {
		this.progress.setTarget(0, fightDuration);
	}

	async wait() {
		await this.progress.wait();
	}

	get isIdle() {
		return this.progress.isIdle;
	}
}
