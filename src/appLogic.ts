import { action } from "mobx";
import { fadeVolume, musicVolume } from "./sounds";
import { Ticker } from "pixi.js";
import { sound } from "@pixi/sound";
import { Music, WinMusic } from "./assets";
import { newGame, startGame, tickGame, type GameT } from "./gameLogic";
import { wave } from "./ease";

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

export const startApp = (app: AppT) => {
	window.app = app;
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

export const startNewGame = (app: AppT) => {
	if (app.state == "intro") {
		app.state = "transition";
	}
	app.lt = 0;
	// fadeVolume(Music, musicVolume.high, musicVolume.low, 500);
	app.game = newGame(app.game.state == "intro" ? "intro" : "restart");
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
