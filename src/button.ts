import { newEntity, makeTick, type Entity } from "./entities";

export type ButtonT = Entity<"idle"> & {
	fade: number;
	targetFade: number;
	alpha: number;
	targetAlpha: number;
};

export const newButton = (visible: boolean): ButtonT => ({
	...newEntity("idle"),
	fade: 1,
	targetFade: 1,
	alpha: 0,
	targetAlpha: visible ? 1 : 0,
});

const fadeSpeed = 10;
const alphaSpeed = 10;

export const tickButton = makeTick<ButtonT["state"], ButtonT>(
	(entity, delta) => {
		entity.fade +=
			(entity.targetFade - entity.fade) *
			(1 - Math.exp(-fadeSpeed * delta));
		entity.alpha +=
			(entity.targetAlpha - entity.alpha) *
			(1 - Math.exp(-alphaSpeed * delta));
		return {};
	},
);

export const appearButton = (button: ButtonT) => {
	button.targetAlpha = 1;
};

export const disappearButton = (button: ButtonT) => {
	button.targetAlpha = 0;
};

export const fadeButtonOn = (button: ButtonT) => {
	button.targetFade = 0;
};

export const fadeButtonOff = (button: ButtonT) => {
	button.targetFade = 1;
};
