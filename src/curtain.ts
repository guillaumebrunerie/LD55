import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";

export class Curtain extends EntityC {
	alpha: LinearToggle;

	constructor() {
		super();
		this.alpha = new LinearToggle(0);
		this.addChildren(this.alpha);
	}

	show(delay = 0) {
		this.alpha.setTarget(1, 0.5, delay);
	}

	hide(delay = 0) {
		this.alpha.setTarget(0, 0.5, delay);
	}

	get isIdle() {
		return this.alpha.isIdle;
	}
}
