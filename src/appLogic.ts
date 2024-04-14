import { action } from "mobx";
import { fadeVolume, musicVolume } from "./sounds";
import { Ticker } from "pixi.js";
import { sound } from "@pixi/sound";
import { Music, StartButton } from "./assets";
import { newGame, startGame, tickGame, type GameT } from "./gameLogic";
import { wave } from "./ease";

export type AppT = {
	speed: number;
	state: "intro" | "transition" | "game";
	lt: number;
	nt: number;
	game: GameT;
};

export const newApp = (): AppT => ({
	speed: 1,
	state: "intro",
	lt: 0,
	nt: 0,
	game: newGame(true),
});

export const startApp = (app: AppT) => {
	sound.init();
	void Music.play();
	const tick = action((delta: number) => {
		tickApp(app, delta / 60 / app.speed);
	});
	Ticker.shared.add(tick);
	return () => {
		Ticker.shared.remove(tick);
		sound.close();
	};
};

export const startNewGame = (app: AppT) => {
	app.state = "transition";
	app.lt = 0;
	// fadeVolume(Music, musicVolume.high, musicVolume.low, 500);
	// void StartButton.play();
	app.game = newGame();
	startGame(app.game);
};

const transitionDuration = 0.5;

const tickApp = (app: AppT, delta: number) => {
	app.lt += delta;
	switch (app.state) {
		case "transition":
			app.nt = wave(app.lt / transitionDuration);
			if (app.lt >= transitionDuration) {
				app.lt = app.nt = 0;
				app.state = "game";
			}
	}
	tickGame(app.game, () => gameOver(app), delta);
};

const gameOver = (app: AppT) => {
	if (!app.game.isGameOver) {
		app.game.isGameOver = true;
		fadeVolume(Music, musicVolume.low, musicVolume.high, 500);
		app.highScore = Math.max(app.highScore, app.game.score);
	}
};
