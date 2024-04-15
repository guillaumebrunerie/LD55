import { changeState, newEntity, tick, type Entity } from "./entities";

export type Curtain = Entity<"hidden" | "appearing" | "idle" | "disappearing">;

export const newCurtain = (): Curtain => newEntity("hidden");

export const tickCurtain = tick<Curtain["state"], Curtain>(() => ({}));

export const showCurtain = (curtain: Curtain) => {
	changeState(curtain, "appearing", { duration: 0.5, state: "idle" });
};

export const hideCurtain = (curtain: Curtain) => {
	changeState(curtain, "disappearing", { duration: 0.5, state: "hidden" });
};
