import { getDuration } from "./Animation";
import { Monster1Reacts } from "./assets";
import {
	attackApproachDuration,
	fightDuration,
	lastAttackApproachDuration,
} from "./configuration";
import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";
import type { Point } from "./utils";

type MonsterState =
	| "waitingToAppear"
	| "visible"
	| "approach"
	| "fighting"
	| "winning";

export class Monster extends EntityC {
	progress = new LinearToggle();

	constructor(
		public state: MonsterState,
		public position: Point,
		public strength: 1 | 2 | 3,
		public hp: number = strength,
		public destination?: Point,
		public finalApproach?: boolean,
	) {
		super();
		this.addChildren(this.progress);
	}

	setVisible() {
		this.state = "visible";
	}

	approach() {
		this.progress.value = 0;
		this.progress.setTarget(
			1,
			this.finalApproach ?
				lastAttackApproachDuration
			:	attackApproachDuration,
		);
		this.state = "approach";
	}

	fight() {
		this.progress.value = 0;
		this.progress.setTarget(1, fightDuration);
		this.state = "fighting";
	}

	winReact() {
		this.progress.value = 0;
		this.progress.setTarget(1, getDuration(Monster1Reacts, 40));
		this.state = "winning";
	}

	get nt() {
		return this.progress.value;
	}

	get isIdle() {
		return this.state == "visible";
	}

	async wait() {
		await this.progress.wait();
	}
}
// if (player.state == "fight") {
// 	item.position.x += delta * 25;
// }
