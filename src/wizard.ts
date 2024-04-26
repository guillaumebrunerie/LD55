import { getDuration } from "./Animation";
import { WizardAppear, WizardDie } from "./assets";
import {
	idleState,
	newEntity,
	makeTick,
	type Entity,
	changeState,
} from "./entities";
import type { GameT, Player } from "./gameLogic";

type WizardState =
	| "hidden"
	| "appearing"
	| "idle"
	| "magicStart"
	| "magicLoop"
	| "magicEnd"
	| "winning"
	| "die";

export type WizardT = Entity<WizardState>;

export const newWizard = (): WizardT => newEntity<WizardState>("hidden");

export const tickWizard = makeTick<WizardState, WizardT>();

export const appearWizard = (wizard: WizardT) => {
	changeState(wizard, "appearing", getDuration(WizardAppear, 20), () => {
		idleState(wizard, "idle");
	});
};

export const magicStartWizard = (wizard: WizardT) => {
	changeState(wizard, "magicStart", 0.5, () => {
		idleState(wizard, "magicLoop");
	});
};

export const magicEndWizard = (wizard: WizardT) => {
	changeState(wizard, "magicEnd", 0.5, () => {
		idleState(wizard, "idle");
	});
};

export const dieWizard = (wizard: WizardT) => {
	changeState(wizard, "die", getDuration(WizardDie, 20), () => {
		idleState(wizard, "hidden");
	});
};

export const winWizard = (wizard: WizardT) => {
	idleState(wizard, "winning");
};

export const actWizardWhenBuying = (game: GameT, player: Player) => {
	if (player == game.opponent) {
		return;
	}
	if (player.wizard.state == "idle") {
		magicStartWizard(player.wizard);
	} else if (player.manaPoints.length == 1) {
		magicEndWizard(player.wizard);
	}
};
