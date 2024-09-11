import { getDuration } from "./Animation";
import { LogoStart } from "./assets";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";

export class Logo extends EntityC {
	progress = new LinearToggle(0);
	logoAppear = new LinearToggle(0);

	constructor() {
		super();
		this.addChildren(this.progress, this.logoAppear);
	}

	hide() {
		this.progress.setTarget(1, 0.5);
	}

	show() {
		this.progress.setTarget(0, 0.5);
	}

	appear(delay = 0) {
		this.logoAppear.setTarget(1, getDuration(LogoStart, 20), delay);
	}
}
