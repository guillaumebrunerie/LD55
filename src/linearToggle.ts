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

		this.addTicker((delta) => {
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
		this.speed = duration > 0 ? 1 / duration : 1000000;
		this.delay = delay;
	}

	async ensureTarget(
		target: number,
		duration: number,
		delay: number,
		callback: () => void,
	) {
		if (this.target == target) {
			return;
		}
		this.setTarget(target, duration, delay);
		await this.wait();
		callback();
	}

	play(duration: number, delay = 0) {
		this.value = 0;
		this.setTarget(1, duration, delay);
	}

	wait(delay = 0) {
		this.delay += delay;
		return new Promise<void>((resolve) => {
			const ticker = this.addTicker(() => {
				if (this.isIdle) {
					this.removeTicker(ticker);
					resolve();
				}
			});
		});
	}

	get isIdle() {
		return this.delay == 0 && Math.abs(this.value - this.target) < 0.001;
	}
}
