export const newGame = (isGameOver = false) => ({
	score: 0,
	isGameOver,
});

export type Game = ReturnType<typeof newGame>;

export const startGame = (game: Game) => {
	game.isGameOver = false;
};

export const tickGame = (game: Game, _gameOver: () => void, delta: number) => {
	if (game.isGameOver) {
		return;
	}
	game.score += delta / 60;
};
