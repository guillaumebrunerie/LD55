import { changeState, newEntity, tick, type Entity } from "./entities";

export type ButtonT = Entity<"hidden" | "appearing" | "idle" | "disappearing">;

export const newButton = (state: "idle" | "hidden"): ButtonT =>
	newEntity(state);

export const tickButton = tick<ButtonT["state"], ButtonT>(() => ({}));

export const appearButton = (button: ButtonT) => {
	changeState(button, "appearing", { duration: 1, state: "idle" });
};

export const disappearButton = (button: ButtonT) => {
	changeState(button, "disappearing", { duration: 0.2, state: "hidden" });
};
