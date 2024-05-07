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
	idleState,
	newEntity,
	makeTick,
	type Entity,
	changeState,
	schedule2,
} from "./entities";
import type { Player } from "./gameLogic";

type WizardState =
	| "hidden"
	| "appearing"
	| "idle"
	| "magicStart"
	| "magicLoop"
	| "magicEnd"
	| "winning"
	| "waitingStart"
	| "waitingLoop"
	| "waitingEnd"
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
	changeState(wizard, "magicStart", getDuration(WizardMagicStart, 20), () => {
		idleState(wizard, "magicLoop");
	});
};

export const magicEndWizard = (wizard: WizardT) => {
	const loopDuration = getDuration(WizardMagicLoop, 20);
	const loops = Math.ceil(wizard.lt / loopDuration);

	schedule2(wizard, loops * loopDuration - wizard.lt, () => {
		changeState(wizard, "magicEnd", getDuration(WizardMagicEnd, 20), () => {
			idleState(wizard, "idle");
		});
	});
};

export const waitingStartWizard = (wizard: WizardT) => {
	changeState(
		wizard,
		"waitingStart",
		getDuration(WizardWaitingStart, 20),
		() => {
			idleState(wizard, "waitingLoop");
		},
	);
};

export const waitingEndWizard = (wizard: WizardT, callback: () => void) => {
	const loopDuration = getDuration(WizardWaitingLoop, 20);
	const loops = Math.ceil(wizard.lt / loopDuration);

	schedule2(wizard, loops * loopDuration - wizard.lt, () => {
		changeState(
			wizard,
			"waitingEnd",
			getDuration(WizardWaitingEnd, 20),
			() => {
				idleState(wizard, "idle");
				callback();
			},
		);
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

export const startWizardMagic = (player: Player) => {
	if (player.wizard.state == "idle") {
		magicStartWizard(player.wizard);
	}
};

export const endWizardMagic = (player: Player) => {
	if (player.manaPoints.length == 0) {
		magicEndWizard(player.wizard);
	}
};
