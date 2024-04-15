import { getDuration } from "./Animation";
import { WizardAppear, WizardDie } from "./assets";
import { changeState, newEntity, tick, type Entity } from "./entities";
import type { GameT, Player } from "./gameLogic";

export type WizardT = Entity<
	| "hidden"
	| "appearing"
	| "idle"
	| "magicStart"
	| "magicLoop"
	| "magicEnd"
	| "winning"
	| "die"
>;

export const newWizard = (): WizardT => newEntity("hidden");

export const tickWizard = tick<WizardT["state"], WizardT>(() => ({}));

export const appearWizard = (wizard: WizardT) => {
	changeState(wizard, "appearing", {
		duration: getDuration(WizardAppear, 20),
		state: "idle",
	});
};

export const magicStartWizard = (wizard: WizardT) => {
	changeState(wizard, "magicStart", { duration: 0.5, state: "magicLoop" });
};

export const magicEndWizard = (wizard: WizardT) => {
	changeState(wizard, "magicEnd", { duration: 0.5, state: "idle" });
};

export const dieWizard = (wizard: WizardT) => {
	changeState(wizard, "die", {
		duration: getDuration(WizardDie, 20),
		state: "hidden",
	});
};

export const winWizard = (wizard: WizardT) => {
	changeState(wizard, "winning");
};

export const actWizardWhenBuying = (game: GameT, player: Player) => {
	if (player == game.opponent) {
		return;
	}
	if (player.wizard.state == "idle") {
		magicStartWizard(player.wizard);
	} else if (player.mana.length == 1) {
		magicEndWizard(player.wizard);
	}
};
