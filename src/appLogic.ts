import { action } from "mobx";
import { Ticker } from "pixi.js";
import { sound } from "@pixi/sound";
import { newGame, startGame, tickGame, type GameT } from "./gameLogic";
import { wave } from "./ease";
import type { Id } from "../convex/_generated/dataModel";

export type AppT = {
	speed: number;
	state: "intro" | "transition" | "game";
	gt: number;
	lt: number;
	nt: number;
	credentials?: {
		playerId: Id<"players">;
		token: string;
	};
	opponentId?: Id<"players">;
	game: GameT;
};

export const newApp = (): AppT => ({
	speed: 1,
	state: "intro",
	gt: 0,
	lt: 0,
	nt: 0,
	game: newGame("intro", false),
});

declare global {
	interface Window {
		app: AppT;
		appR: AppT;
	}
}

export const startApp = (app: AppT) => {
	if (import.meta.env.DEV) {
		window.appR = app;
		if (!window.app) {
			Object.defineProperty(window, "app", {
				get: () => JSON.parse(JSON.stringify(app)) as AppT,
			});
		}
	}
	sound.init();
	const tick = action((delta: number) => {
		tickApp(app, (delta / 60) * app.speed);
	});
	Ticker.shared.add(tick);
	return () => {
		Ticker.shared.remove(tick);
		sound.close();
	};
};

export const startNewGameAgainstComputer = (app: AppT) => {
	if (app.state == "intro") {
		app.state = "transition";
	}
	app.lt = 0;
	app.game = newGame(app.game.state == "intro" ? "intro" : "restart");
	startGame(app.game);
};

export const startNewGameAgainstPlayer = (app: AppT, gameId: Id<"games">) => {
	if (app.state == "intro") {
		app.state = "transition";
	}
	app.lt = 0;
	app.game = newGame(app.game.state == "intro" ? "intro" : "restart");
	app.game.gameId = gameId;
	startGame(app.game);
};

const transitionDuration = 0.5;

const tickApp = (app: AppT, delta: number) => {
	app.gt += delta;
	app.lt += delta;
	switch (app.state) {
		case "transition":
			app.nt = wave(app.lt / transitionDuration);
			if (app.lt >= transitionDuration) {
				app.lt = app.nt = 0;
				app.state = "game";
			}
	}
	tickGame(app.game, delta);
};
