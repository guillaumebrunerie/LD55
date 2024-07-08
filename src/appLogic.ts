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
import { newButton, type ButtonT, tickButton } from "./button";
import { appearWizard } from "./wizard";
import { newLogo, showLogoAppear, tickLogo, type LogoT } from "./logo";

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
	logo: LogoT;
	restartButtons: ButtonT;
	startButtons: ButtonT;
	lobby: ButtonT;
	menuButton: ButtonT;
};

export const newApp = (): AppT => ({
	speed: 1,
	state: "intro",
	gt: 0,
	lt: 0,
	nt: 0,
	game: newGame("intro", false),
	logo: newLogo(),
	restartButtons: newButton(false),
	startButtons: newButton(true),
	lobby: newButton(false),
	menuButton: newButton(false),
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
	const tick = action((delta: number) => {
		tickApp(app, (delta / 60) * app.speed);
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
		showLogoAppear(app.logo, 0.4);
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
	tickLogo(app.logo, delta);
	tickButton(app.startButtons, delta);
	tickButton(app.restartButtons, delta);
	tickButton(app.lobby, delta);
	tickButton(app.menuButton, delta);
};
