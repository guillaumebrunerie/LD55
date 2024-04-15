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
	| "disappearing"
>;

export const newWizard = (): WizardT => newEntity("hidden");

export const tickWizard = tick<WizardT["state"], WizardT>(() => ({}));

export const appearWizard = (wizard: WizardT) => {
	changeState(wizard, "appearing", { duration: 1, state: "idle" });
};

export const magicStartWizard = (wizard: WizardT) => {
	changeState(wizard, "magicStart", { duration: 0.5, state: "magicLoop" });
};

export const magicEndWizard = (wizard: WizardT) => {
	changeState(wizard, "magicEnd", { duration: 0.5, state: "idle" });
};

export const disappearWizard = (wizard: WizardT) => {
	changeState(wizard, "disappearing", { duration: 1, state: "hidden" });
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
