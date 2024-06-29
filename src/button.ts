import { makeAutoObservable } from "mobx";
import { makeTick } from "./entities";

// class EntityClass {
// 	state;
// 	lt = 0;
// 	nt = 0;
// 	transitions = [];

// 	constructor(state: string) {
// 		this.state = state;
// 	}

// 	tick(_delta: number) {
// 		throw new Error("Abstract method");
// 	}
// }

const fadeSpeed = 10;
const alphaSpeed = 10;

class Toggle {
	value;
	targetValue;
	speed;
	constructor(initialValue: number, speed: number) {
		this.value = initialValue;
		this.targetValue = initialValue;
		this.speed = speed;
		makeAutoObservable(this);
	}

	set(value: number) {
		this.targetValue = value;
	}

	tick(delta: number) {
		this.value +=
			(this.targetValue - this.value) *
			(1 - Math.exp(-this.speed * delta));
	}
}

export class Button {
	state;
	lt = 0;
	nt = 0;
	transitions = [];
	fade = new Toggle(1, fadeSpeed);
	alpha = new Toggle(0, alphaSpeed);
	constructor(visible: boolean) {
		this.state = "idle";
		makeAutoObservable(this);
		this.alpha.targetValue = visible ? 1 : 0;
	}

	tick(delta: number) {
		this.fade.tick(delta);
		this.alpha.tick(delta);
	}

	appear() {
		this.alpha.set(1);
	}

	disappear() {
		this.alpha.set(0);
	}

	fadeButtonOn() {
		this.fade.set(0);
	}

	fadeButtonOff() {
		this.fade.set(1);
	}
}

export type ButtonT = Button;

export const newButton = (visible: boolean): ButtonT => new Button(visible);

export const tickButton = makeTick<ButtonT["state"], ButtonT>(
	(entity, delta) => {
		entity.tick(delta);
		return {};
	},
);

export const appearButton = (button: ButtonT) => {
	button.appear();
};

export const disappearButton = (button: ButtonT) => {
	button.disappear();
};

export const fadeButtonOn = (button: ButtonT) => {
	button.fadeButtonOn();
};

export const fadeButtonOff = (button: ButtonT) => {
	button.fadeButtonOff();
};
