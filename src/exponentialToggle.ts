export type ExponentialToggle = {
	value: number;
	target: number;
	speed: number;
	delay: number;
};

export const newExponentialToggle = (
	value: number,
	target = value,
): ExponentialToggle => ({
	value,
	target,
	speed: 0,
	delay: 0,
});

export const setTarget = (
	toggle: ExponentialToggle,
	target: number,
	speed: number,
	delay = 0,
) => {
	toggle.target = target;
	toggle.speed = speed;
	toggle.delay = delay;
};

export const tickExponentialToggle = (
	toggle: ExponentialToggle,
	delta: number,
) => {
	if (toggle.delay > 0) {
		toggle.delay = Math.max(0, toggle.delay - delta);
	}
	if (toggle.delay == 0) {
		toggle.value +=
			(toggle.target - toggle.value) *
			(1 - Math.exp(-toggle.speed * delta));
	}
};
