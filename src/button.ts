import { EntityC } from "./entitiesC";
import { ExponentialToggle } from "./exponentialToggle";

const fadeSpeed = 10;
const alphaSpeed = 10;

export class Button extends EntityC {
	alpha: ExponentialToggle;
	fade: ExponentialToggle;

	constructor(visible: boolean) {
		super();
		this.alpha = new ExponentialToggle(visible ? 1 : 0);
		this.fade = new ExponentialToggle(1);
		this.addChildren(this.alpha, this.fade);
	}

	appear(delay = 0) {
		this.alpha.setTarget(1, alphaSpeed, delay);
	}

	disappear(delay = 0) {
		this.alpha.setTarget(0, alphaSpeed, delay);
	}

	fadeOn(delay = 0) {
		this.fade.setTarget(0, fadeSpeed, delay);
	}

	fadeOff(delay = 0) {
		this.fade.setTarget(1, fadeSpeed, delay);
	}

	get isOn() {
		return this.alpha.target == 1 && this.alpha.value > 0.1;
	}

	get isIdle() {
		return this.alpha.isIdle && this.fade.isIdle;
	}
}
