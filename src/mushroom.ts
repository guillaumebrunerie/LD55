import { fightDuration } from "./configuration";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";
import type { Point } from "./utils";

export class Mushroom extends EntityC {
	progress: LinearToggle;

	constructor(
		public position: Point,
		public strength: 1 | 2,
		visible: boolean,
	) {
		super();
		this.progress = new LinearToggle(visible ? 1 : 0);
		this.addChildren(this.progress);
	}

	setVisible() {
		this.progress.setTarget(1, 1);
		this.progress.value = 1;
	}

	disappear(delay = 0) {
		this.progress.setTarget(0, fightDuration, delay);
	}

	async wait() {
		await this.progress.wait();
	}

	get nt() {
		return this.progress.value;
	}
}
