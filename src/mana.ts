import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";
import type { Point } from "./utils";

type ManaState =
	| "hidden"
	| "visible"
	| "anticipating"
	| "spawning"
	| "traveling"
	| "spawningOut";

const manaTravelDuration = 0.2;
const spawnDuration = 0.3;
const manaSpawnDuration = 0.5;

export class Mana extends EntityC {
	progress = new LinearToggle();
	state: ManaState = "hidden";

	get nt() {
		return this.progress.value;
	}

	constructor(
		public position: Point,
		public scale = 0.7 + Math.random() * 0.3,
		public offset = Math.random() * 2 * Math.PI,
		public rotationSpeed = Math.random() > 0.5 ? 3 : -3,
		public prevPosition?: Point,
	) {
		super();
		this.addChildren(this.progress);
	}

	travel(position: Point) {
		this.prevPosition = this.position;
		this.position = position;
		this.progress.value = 0;
		this.progress.setTarget(1, manaTravelDuration);
		this.state = "traveling";
	}

	travelFrom(position: Point, delay = 0) {
		this.prevPosition = position;
		this.progress.value = 0;
		this.progress.setTarget(1, manaSpawnDuration, delay);
		this.state = "traveling";
	}

	spawn(delay = 0) {
		this.progress.value = 0;
		this.progress.setTarget(1, manaSpawnDuration, delay);
		this.state = "spawning";
	}

	spawnOut() {
		this.progress.value = 0;
		this.progress.setTarget(1, spawnDuration);
		this.state = "spawningOut";
	}

	setVisible() {
		this.state = "visible";
	}

	anticipate() {
		this.state = "anticipating";
	}

	unlock() {
		this.setVisible();
	}

	async wait(delay = 0) {
		await this.progress.wait(delay);
	}
}
