import { EntityC } from "./entitiesC";

export class ExponentialToggle extends EntityC {
	value: number;
	target: number;
	speed = 0;
	delay = 0;

	constructor(value: number, target = value) {
		super();
		this.value = value;
		this.target = target;

		this.addTicker((delta) => {
			if (this.delay > 0) {
				this.delay = Math.max(0, this.delay - delta);
			}
			if (this.delay == 0) {
				this.value +=
					(this.target - this.value) *
					(1 - Math.exp(-this.speed * delta));
			}
		});
	}

	setTarget(target: number, speed: number, delay = 0) {
		this.target = target;
		this.speed = speed;
		this.delay = delay;
	}

	get isIdle() {
		return Math.abs(this.value - this.target) < 0.001;
	}
}
