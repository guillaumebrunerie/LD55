import { flow } from "mobx";
import {
	clear,
	doTransition,
	makeTick,
	newEntity,
	type Entity,
} from "./entities";

export type Curtain = Entity<"hidden" | "appearing" | "idle" | "disappearing">;

export const newCurtain = (): Curtain => newEntity("hidden");

export const tickCurtain = makeTick<Curtain>();

export const showCurtain = flow(function* (curtain: Curtain) {
	yield doTransition(curtain, 0.5, "appearing", "idle");
});

export const hideCurtain = flow(function* (curtain: Curtain, nt: number) {
	yield doTransition(curtain, 0.5, "disappearing", "hidden", nt);
});

export const ensureHiddenCurtain = flow(function* (curtain: Curtain) {
	switch (curtain.state) {
		case "hidden":
		case "disappearing":
			clear(curtain);
			break;
		case "idle":
			yield hideCurtain(curtain, 0);
			break;
		case "appearing":
			yield hideCurtain(curtain, 1 - curtain.nt);
			break;
	}
});
