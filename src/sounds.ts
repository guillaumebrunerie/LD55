import type { Sound } from "@pixi/sound";

export const fadeVolume = (
	sound: Sound,
	from: number,
	to: number,
	duration: number,
) => {
	const steps = 10;
	let step = 0;
	const interval = setInterval(() => {
		if (step > steps) {
			clearInterval(interval);
		}
		sound.volume = from + ((to - from) * step) / steps;
		step++;
	}, duration / steps);
};

export const musicVolume = {
	high: 0.2,
	low: 0.15,
};
