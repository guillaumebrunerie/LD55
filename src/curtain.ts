import {
	idleState,
	newEntity,
	makeTick,
	type Entity,
	changeState,
} from "./entities";

export type Curtain = Entity<"hidden" | "appearing" | "idle" | "disappearing">;

export const newCurtain = (): Curtain => newEntity("hidden");

export const tickCurtain = makeTick<Curtain["state"], Curtain>();

export const showCurtain = (curtain: Curtain) => {
	changeState(curtain, "appearing", 0.5, () => {
		idleState(curtain, "idle");
	});
};

export const hideCurtain = (curtain: Curtain) => {
	changeState(curtain, "disappearing", 0.5, () => {
		idleState(curtain, "hidden");
	});
};
