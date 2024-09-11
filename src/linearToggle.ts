import { EntityC } from "./entitiesC";

export class LinearToggle extends EntityC {
	value: number;
	target: number;
	speed = 0;
	delay = 0;

	constructor(value = 0, target = value) {
		super();
		this.value = value;
		this.target = target;

		this.addTickers((delta) => {
			if (this.delay > 0) {
				this.delay = Math.max(0, this.delay - delta);
			}
			if (this.delay == 0) {
				const diff = this.target - this.value;
				const deltaValue = this.speed * delta;
				if (Math.abs(diff) < deltaValue) {
					this.value = this.target;
				} else {
					this.value += deltaValue * Math.sign(diff);
				}
			}
		});
	}

	setTarget(target: number, duration: number, delay = 0) {
		this.target = target;
		this.speed = 1 / duration;
		this.delay = delay;
	}

	wait() {
		return new Promise<void>((resolve) => {
			const ticker = () => {
				if (this.isIdle) {
					resolve();
					this.removeTickers(ticker);
				}
			};
			this.addTickers(ticker);
		});
	}

	get isIdle() {
		return Math.abs(this.value - this.target) < 0.001;
	}
}
