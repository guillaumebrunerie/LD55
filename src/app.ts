import { sound } from "@pixi/sound";
import { EntityC } from "./entitiesC";
import { Game } from "./game";
import { Ticker } from "pixi.js";
import { action } from "mobx";

// const transitionDuration = 0.5;

declare global {
	interface Window {
		app: App;
		appR: App;
	}
}

export class App extends EntityC {
	speed = 1;
	game = new Game();

	constructor() {
		super();
		this.addChildren(this.game);
		this.init();
	}

	init() {
		// Start game
		void this.game.start();

		// Put debugging informating in the window
		if (import.meta.env.DEV) {
			window.appR = this;
			if (!window.app) {
				Object.defineProperty(window, "app", {
					get: () => JSON.parse(JSON.stringify(this)) as App,
				});
			}
		}

		// Initialize sound and ticker
		sound.init();
		const tick = action((ticker: Ticker) => {
			this.tick((ticker.deltaTime / 60) * this.speed);
		});
		Ticker.shared.add(tick);
		return () => {
			Ticker.shared.remove(tick);
			sound.close();
		};
	}
}
