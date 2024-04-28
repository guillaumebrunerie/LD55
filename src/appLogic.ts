import { action, runInAction } from "mobx";
import { Ticker } from "pixi.js";
import { sound } from "@pixi/sound";
import { newGame, startGame, tickGame, type GameT } from "./gameLogic";
import { wave } from "./ease";
import type { Id } from "../convex/_generated/dataModel";
import type { api } from "../convex/_generated/api";
import type { ReactMutation } from "convex/react";

export type AppT = {
	speed: number;
	state: "intro" | "transition" | "game";
	gt: number;
	lt: number;
	nt: number;
	game: GameT;
};

export const newApp = (): AppT => ({
	speed: 1,
	state: "intro",
	gt: 0,
	lt: 0,
	nt: 0,
	game: newGame("intro"),
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

export const startNewGame = async (
	app: AppT,
	playVsComputer: boolean,
	joinGameMutation: ReactMutation<typeof api.functions.joinGame>,
) => {
	const player = playVsComputer ? undefined : await joinGameMutation();
	runInAction(() => {
		if (app.state == "intro") {
			app.state = "transition";
		}
		app.lt = 0;
		app.game = newGame(app.game.state == "intro" ? "intro" : "restart");
		app.game.gameId = player?.gameId;
		app.game.playerId = player?._id;
		startGame(app.game);
	});
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
