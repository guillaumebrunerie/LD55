import { EntityC } from "./entitiesC";

export class EntityArray<T extends EntityC> extends EntityC {
	entities: T[] = [];

	constructor() {
		super();
	}

	get isIdle() {
		return this.entities.every((entity) => entity.isIdle);
	}

	add(t: T) {
		this.entities.push(t);
		this.addChildren(t);
		return this.entities[this.entities.length - 1];
	}

	remove(t: T) {
		if (!this.entities.includes(t)) {
			debugger;
		}
		this.entities = this.entities.filter((e) => e != t);
		this.removeChildren(t);
	}

	clear() {
		this.removeChildren(...this.children);
		this.children = [];
		this.entities = [];
	}
}
