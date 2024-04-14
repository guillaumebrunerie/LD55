import { action } from "mobx";
import { fadeVolume, musicVolume } from "./sounds";
import { Ticker } from "pixi.js";
import { sound } from "@pixi/sound";
import { Music, StartButton } from "./assets";
import { newGame, startGame, tickGame } from "./gameLogic";

export const newApp = () => ({
	highScore: 0,
	game: newGame(true),
	previousGame: newGame(true),
});

type App = ReturnType<typeof newApp>;

export const startApp = (app: App) => {
	sound.init();
	void Music.play();
	const tick = action((delta: number) => {
		tickApp(app, delta);
	});
	Ticker.shared.add(tick);
	return () => {
		Ticker.shared.remove(tick);
		sound.close();
	};
};

export const startNewGame = (app: App) => {
	fadeVolume(Music, musicVolume.high, musicVolume.low, 500);
	void StartButton.play();
	app.game = newGame();
	startGame(app.game);
};

const tickApp = (app: App, delta: number) => {
	tickGame(app.game, () => gameOver(app), delta);
};

const gameOver = (app: App) => {
	if (!app.game.isGameOver) {
		app.game.isGameOver = true;
		fadeVolume(Music, musicVolume.low, musicVolume.high, 500);
		app.highScore = Math.max(app.highScore, app.game.score);
	}
};
