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

	addTicker(ticker: Ticker) {
		this.tickers.push(ticker);
		return this.tickers[this.tickers.length - 1];
	}

	removeTicker(ticker: Ticker) {
		if (!this.tickers.includes(ticker)) {
			debugger;
		}
		this.tickers = this.tickers.filter((t) => t != ticker);
	}

	addChildren(...children: EntityC[]) {
		this.children.push(...children);
	}

	removeChildren(...children: EntityC[]) {
		this.children = this.children.filter((c) => !children.includes(c));
	}
}
