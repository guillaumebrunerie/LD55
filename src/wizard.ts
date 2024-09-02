import { flow } from "mobx";
import { getDuration } from "./Animation";
import {
	WizardAppear,
	WizardDie,
	WizardMagicEnd,
	WizardMagicLoop,
	WizardMagicStart,
	WizardWaitingEnd,
	WizardWaitingLoop,
	WizardWaitingStart,
} from "./assets";
import {
	doTransition,
	idleState,
	makeTick,
	newEntity,
	waitUntilFullLoop,
	type Entity,
} from "./entities";
import type { Player } from "./gameLogic";

type WizardState =
	| "hidden"
	| ">appear"
	| "idle"
	| ">magicStart"
	| "magicLoop"
	| ">magicEnd"
	| ">waitingStart"
	| "waitingLoop"
	| ">waitingEnd"
	| "win"
	| ">die"
	| ">disappear";

export type WizardT = Entity<WizardState>;

export const newWizard = (): WizardT => newEntity<WizardState>("hidden");

export const tickWizard = makeTick<WizardT>();

export const appearWizard = flow(function* (wizard: WizardT, delay: number) {
	yield doTransition(wizard, delay, "hidden", "hidden");
	yield doTransition(
		wizard,
		getDuration(WizardAppear, 15),
		">appear",
		"idle",
	);
});

export const magicStartWizard = flow(function* (wizard: WizardT) {
	yield doTransition(
		wizard,
		getDuration(WizardMagicStart, 20),
		">magicStart",
		"magicLoop",
	);
});

export const magicEndWizard = flow(function* (wizard: WizardT) {
	yield waitUntilFullLoop(wizard, getDuration(WizardMagicLoop, 20));
	yield doTransition(
		wizard,
		getDuration(WizardMagicEnd, 20),
		">magicEnd",
		"idle",
	);
});

export const waitingStartWizard = flow(function* (wizard: WizardT) {
	yield doTransition(
		wizard,
		getDuration(WizardWaitingStart, 20),
		">waitingStart",
		"waitingLoop",
	);
});

export const waitingEndWizard = flow(function* (wizard: WizardT) {
	const loopDuration = getDuration(WizardWaitingLoop, 20);
	yield waitUntilFullLoop(wizard, loopDuration);
	const endDuration = getDuration(WizardWaitingEnd, 20);
	yield doTransition(wizard, endDuration, ">waitingEnd", "idle");
});

export const dieWizard = flow(function* (wizard: WizardT) {
	yield doTransition(wizard, getDuration(WizardDie, 20), ">die", "hidden");
});

export const winWizard = (wizard: WizardT) => {
	idleState(wizard, "win");
};

export const idleWizard = (wizard: WizardT) => {
	idleState(wizard, "idle");
};

export const hiddenWizard = (wizard: WizardT) => {
	idleState(wizard, "hidden");
};

export const startWizardMagic = async (player: Player) => {
	if (player.wizard.state == "idle") {
		await magicStartWizard(player.wizard);
	}
};

export const maybeEndWizardMagic = async (player: Player) => {
	if (player.manaPoints.length == 0) {
		await magicEndWizard(player.wizard);
	}
};
