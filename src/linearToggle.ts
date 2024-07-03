export type LinearToggle = {
	value: number;
	target: number;
	speed: number;
	delay: number;
};

export const newLinearToggle = (
	value: number,
	target = value,
): LinearToggle => ({
	value,
	target,
	speed: 0,
	delay: 0,
});

export const setTarget = (
	toggle: LinearToggle,
	target: number,
	duration: number,
	delay = 0,
) => {
	toggle.target = target;
	toggle.speed = 1 / duration;
	toggle.delay = delay;
};

export const tickLinearToggle = (toggle: LinearToggle, delta: number) => {
	if (toggle.delay > 0) {
		toggle.delay = Math.max(0, toggle.delay - delta);
	}
	if (toggle.delay == 0) {
		const diff = toggle.target - toggle.value;
		const deltaValue = toggle.speed * delta;
		if (Math.abs(diff) < deltaValue) {
			toggle.value = toggle.target;
		} else {
			toggle.value += deltaValue * Math.sign(diff);
		}
	}
};
