import { getDuration } from "./Animation";
import { ShieldEnd, ShieldStart } from "./assets";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";

type ShieldState =
	| "waitingToAppear"
	| "appearing"
	| "visible"
	| "disappearing"
	| "hidden"
	| "fadeOut"
	| "fighting";

export class Shield extends EntityC {
	state: ShieldState = "hidden";
	progress = new LinearToggle(0);
	isPresent = true;

	constructor() {
		super();
		this.addChildren(this.progress);
	}

	get nt() {
		return this.progress.value;
	}

	appear() {
		this.state = "appearing";
		this.isPresent = true;
		this.progress.setTarget(1, getDuration(ShieldStart, 20));
	}

	makeWaitToAppear() {
		this.isPresent = true;
	}

	fadeOut() {
		this.state = "fadeOut";
		this.isPresent = false;
		const fadeOutDuration = 0.2;
		this.progress.setTarget(0, fadeOutDuration);
	}

	fighting() {
		this.state = "fighting";
		this.progress.value = 0;
		const fightDuration = 0.15;
		this.progress.setTarget(1, fightDuration);
	}

	disappear() {
		this.state = "disappearing";
		this.isPresent = false;
		this.progress.value = 0;
		this.progress.setTarget(1, getDuration(ShieldEnd, 20));
	}

	setVisible() {
		this.state = "visible";
		this.isPresent = true;
		this.progress.value = 1;
		this.progress.target = 1;
	}

	setHidden() {
		this.state = "visible";
		this.isPresent = false;
		this.progress.value = 1;
		this.progress.target = 1;
	}

	async wait() {
		await this.progress.wait();
	}
}
