import { makeTick3, newEntity, type Entity2 } from "./entities2";
import {
	newExponentialToggle,
	setTarget,
	tickExponentialToggle,
	type ExponentialToggle,
} from "./exponentialToggle";

const fadeSpeed = 10;
const alphaSpeed = 10;

export type ButtonT = Entity2<"idle"> & {
	alpha: ExponentialToggle;
	fade: ExponentialToggle;
};

export const newButton = (visible: boolean): ButtonT => ({
	...newEntity("idle"),
	alpha: newExponentialToggle(visible ? 1 : 0),
	fade: newExponentialToggle(1),
});

export const tickButton = makeTick3<ButtonT>((entity, delta) => {
	tickExponentialToggle(entity.alpha, delta);
	tickExponentialToggle(entity.fade, delta);
});

export const appearButton = (button: ButtonT, delay = 0) => {
	setTarget(button.alpha, 1, alphaSpeed, delay);
};

export const disappearButton = (button: ButtonT, delay = 0) => {
	setTarget(button.alpha, 0, alphaSpeed, delay);
};

export const fadeButtonOn = (button: ButtonT, delay = 0) => {
	setTarget(button.fade, 0, fadeSpeed, delay);
};

export const fadeButtonOff = (button: ButtonT, delay = 0) => {
	setTarget(button.fade, 1, fadeSpeed, delay);
};

export const isButtonOn = (button: ButtonT) =>
	button.alpha.target == 1 && button.alpha.value > 0.1;
