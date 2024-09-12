import { EntityC } from "./entitiesC";
import { LinearToggle } from "./linearToggle";
import type { Point } from "./utils";

type ManaState =
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

	get nt() {
		return this.progress.value;
	}

	constructor(
		public state: ManaState,
		public position: Point,
		public scale: number,
		public offset: number,
		public rotationSpeed: number,
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

	travelFrom(position: Point) {
		this.prevPosition = position;
		this.progress.value = 0;
		this.progress.setTarget(1, manaSpawnDuration);
		this.state = "traveling";
	}

	spawn() {
		this.progress.value = 0;
		this.progress.setTarget(1, manaSpawnDuration);
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

	async wait() {
		await this.progress.wait();
	}
}
