import { EntityC } from "./entitiesC";

export class EntityArray<T extends EntityC> extends EntityC {
	entities: T[] = [];

	constructor() {
		super();
	}

	add(t: T) {
		this.entities.push(t);
		this.addChildren(t);
	}

	remove(t: T) {
		this.entities = this.entities.filter((e) => e != t);
		this.removeChildren(t);
	}

	clear() {
		this.removeChildren(...this.children);
		this.children = [];
		this.entities = [];
	}
}
