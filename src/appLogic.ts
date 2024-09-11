import { action, runInAction } from "mobx";
import { Ticker } from "pixi.js";
import { sound } from "@pixi/sound";
import {
	newGame,
	startGame,
	tickGame,
	type GameT,
	resetGame,
} from "./gameLogic";
import { wave } from "./ease";
import type { Id } from "../convex/_generated/dataModel";
import { Button } from "./button";
import { appearWizard } from "./wizard";
import { Logo } from "./logo";

export type Credentials = {
	playerId: Id<"players">;
	token: string;
};

export type AppT = {
	speed: number;
	state: "intro" | "transition" | "game";
	gt: number;
	lt: number;
	nt: number;
	credentials?: Credentials;
	opponentId?: Id<"players">;
	game: GameT;
	logo: Logo;
	restartButtons: Button;
	startButtons: Button;
	lobby: Button;
	menuButton: Button;
};

export const newApp = (): AppT => ({
	speed: 1,
	state: "intro",
	gt: 0,
	lt: 0,
	nt: 0,
	game: newGame("intro", false),
	logo: new Logo(),
	restartButtons: new Button(false),
	startButtons: new Button(true),
	lobby: new Button(false),
	menuButton: new Button(false),
});

declare global {
	interface Window {
		app: AppT;
		appR: AppT;
	}
}

const initApp = (app: AppT) => {
	if (import.meta.env.DEV) {
		window.appR = app;
		if (!window.app) {
			Object.defineProperty(window, "app", {
				get: () => JSON.parse(JSON.stringify(app)) as AppT,
			});
		}
	}
	sound.init();
	const tick = action((ticker: Ticker) => {
		tickApp(app, (ticker.deltaTime / 60) * app.speed);
	});
	Ticker.shared.add(tick);
	return () => {
		Ticker.shared.remove(tick);
		sound.close();
	};
};

export const startApp = (app: AppT) => {
	initApp(app);
	runInAction(() => {
		void appearWizard(app.game.player.wizard, 1);
		app.logo.appear(0.4);
	});
};

export const startNewGameAgainstComputer = (app: AppT) => {
	if (app.state == "intro") {
		app.state = "transition";
	}
	app.lt = 0;
	resetGame(app);
	startGame(app);
};

export const startNewGameAgainstPlayer = (app: AppT, gameId: Id<"games">) => {
	if (app.state == "intro") {
		app.state = "transition";
	}
	app.lt = 0;
	resetGame(app);
	app.game.gameId = gameId;
	startGame(app);
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
	tickGame(app.game, delta, app);
	app.logo.tick(delta);
	app.startButtons.tick(delta);
	app.restartButtons.tick(delta);
	app.lobby.tick(delta);
	app.menuButton.tick(delta);
};
