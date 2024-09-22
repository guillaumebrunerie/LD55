import { getDuration } from "./Animation";
import {
	WizardAppear,
	WizardDie,
	WizardIdle,
	WizardMagicEnd,
	WizardMagicLoop,
	WizardMagicStart,
	WizardWaitingEnd,
	WizardWaitingLoop,
	WizardWaitingStart,
} from "./assets";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";

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

export class Wizard extends EntityC {
	state: "hidden" | "magic" | "waiting" | "idle" = "hidden";

	isWinning = false;
	appearProgress = new LinearToggle();
	magicProgress = new LinearToggle();
	waitingProgress = new LinearToggle();
	isDying = false;

	constructor() {
		super();
		this.addChildren(
			this.appearProgress,
			this.magicProgress,
			this.waitingProgress,
		);
	}

	get isIdle() {
		return (
			this.appearProgress.isIdle &&
			this.magicProgress.isIdle &&
			this.waitingProgress.isIdle
		);
	}

	getState(): { state: WizardState; nt?: number } {
		if (this.isWinning) {
			return { state: "win" };
		} else if (this.isDying && this.appearProgress.value > 0) {
			return { state: ">die", nt: 1 - this.appearProgress.value };
		} else if (this.magicProgress.value == 1) {
			return { state: "magicLoop" };
		} else if (
			this.magicProgress.value > 0 &&
			this.magicProgress.target == 1
		) {
			return { state: ">magicStart", nt: this.magicProgress.value };
		} else if (
			this.magicProgress.value > 0 &&
			this.magicProgress.target == 0
		) {
			return { state: ">magicEnd", nt: 1 - this.magicProgress.value };
		} else if (this.waitingProgress.value == 1) {
			return { state: "waitingLoop" };
		} else if (
			this.waitingProgress.value > 0 &&
			this.waitingProgress.target == 1
		) {
			return { state: ">waitingStart", nt: this.waitingProgress.value };
		} else if (
			this.waitingProgress.value > 0 &&
			this.waitingProgress.target == 0
		) {
			return { state: ">waitingEnd", nt: 1 - this.waitingProgress.value };
		} else if (this.appearProgress.value == 1) {
			return { state: "idle" };
		} else if (
			this.appearProgress.value > 0 &&
			this.appearProgress.target == 1
		) {
			return { state: ">appear", nt: this.appearProgress.value };
		} else if (
			this.appearProgress.value > 0 &&
			this.appearProgress.target == 0
		) {
			return { state: ">disappear", nt: 1 - this.appearProgress.value };
		} else {
			return { state: "hidden" };
		}
	}

	appear(delay = 0) {
		this.appearProgress.setTarget(1, getDuration(WizardAppear, 15), delay);
		this.waitingProgress.setTarget(0, 0);
		this.magicProgress.setTarget(0, 0);
		this.isWinning = false;
		this.isDying = false;
	}

	async magicStart() {
		this.state = "magic";
		await this.magicProgress.ensureTarget(
			1,
			getDuration(WizardMagicStart, 20),
			0, // fullLoopDelay(this.lt, getDuration(WizardIdle, 10)), // Too long
			() => {
				this.magicLoop();
			},
		);
	}

	private magicLoop() {
		this.lt = 0;
	}

	async magicEnd() {
		await this.magicProgress.ensureTarget(
			0,
			getDuration(WizardMagicEnd, 20),
			fullLoopDelay(this.lt, getDuration(WizardMagicLoop, 20)),
			() => {
				this.idle();
			},
		);
	}

	async waitingStart(delay = 0) {
		this.state = "waiting";
		await this.waitingProgress.ensureTarget(
			1,
			getDuration(WizardWaitingStart, 20),
			delay,
			() => {
				this.waitingLoop();
			},
		);
	}

	private waitingLoop() {
		this.lt = 0;
	}

	async waitingEnd() {
		await this.waitingProgress.ensureTarget(
			0,
			getDuration(WizardWaitingEnd, 20),
			fullLoopDelay(this.lt, getDuration(WizardWaitingLoop, 20)),
			() => {
				this.idle();
			},
		);
	}

	private idle() {
		this.lt = 0;
		this.state = "idle";
	}

	die() {
		this.appearProgress.setTarget(0, getDuration(WizardDie, 20));
		this.waitingProgress.setTarget(0, 0);
		this.magicProgress.setTarget(0, 0);
		this.isWinning = false;
		this.isDying = true;
	}

	disappear() {
		this.appearProgress.setTarget(0, 0);
		this.waitingProgress.setTarget(0, 0);
		this.magicProgress.setTarget(0, 0);
		this.isWinning = false;
		this.isDying = false;
	}

	win() {
		this.isWinning = true;
	}

	async wait() {
		await Promise.all([
			this.appearProgress.wait(),
			this.magicProgress.wait(),
			this.waitingProgress.wait(),
		]);
	}
}

export const fullLoopDelay = (lt: number, loopDuration: number) => {
	return Math.ceil(lt / loopDuration) * loopDuration - lt;
};
