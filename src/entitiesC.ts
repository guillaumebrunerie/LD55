type Ticker = (delta: number) => void;

export class EntityC {
	lt = 0;
	children: EntityC[] = [];
	tickers: Ticker[] = [];

	constructor() {}

	tick(delta: number) {
		this.lt += delta;
		for (const child of this.children) {
			child.tick(delta);
		}
		for (const ticker of this.tickers) {
			ticker(delta);
		}
	}

	addTickers(...tickers: Ticker[]) {
		this.tickers.push(...tickers);
	}

	removeTickers(...tickers: Ticker[]) {
		this.tickers = this.tickers.filter((t) => !tickers.includes(t));
	}

	addChildren(...children: EntityC[]) {
		this.children.push(...children);
	}

	removeChildren(...children: EntityC[]) {
		this.children = this.children.filter((c) => !children.includes(c));
	}
}
