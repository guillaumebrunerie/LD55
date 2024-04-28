import {
	idleState,
	newEntity,
	makeTick,
	type Entity,
	changeState,
} from "./entities";

export type ButtonT = Entity<
	| "hidden"
	| "appearing"
	| "idle"
	| "fadingIn"
	| "faded"
	| "fadingOut"
	| "disappearing"
>;

export const newButton = (state: "idle" | "hidden"): ButtonT =>
	newEntity(state);

export const tickButton = makeTick<ButtonT["state"], ButtonT>();

export const appearButton = (button: ButtonT) => {
	changeState(button, "appearing", 0.2, () => {
		idleState(button, "idle");
	});
};

export const disappearButton = (button: ButtonT) => {
	changeState(button, "disappearing", 0.2, () => {
		idleState(button, "hidden");
	});
};

export const fadeButtonIn = (button: ButtonT) => {
	changeState(button, "fadingIn", 0.2, () => {
		idleState(button, "idle");
	});
};

export const fadeButtonOut = (button: ButtonT) => {
	changeState(button, "fadingOut", 0.2, () => {
		idleState(button, "faded");
	});
};
