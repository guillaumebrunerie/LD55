type Player = {
	mana: number;
	items: {
		mana: number[];
		defense: number[];
		attack: number[];
	};
};

const newPlayer = (): Player => ({
	mana: 10,
	items: {
		mana: [],
		defense: [1, 1, 1],
		attack: [],
	},
});

export const newGame = (isGameOver = false) => ({
	isGameOver,
	timer: 60_000,
	player: newPlayer(),
	opponent: newPlayer(),
});

export type Game = ReturnType<typeof newGame>;

export const startGame = (game: Game) => {
	game.isGameOver = false;
};

export const tickGame = (game: Game, _gameOver: () => void, delta: number) => {
	if (game.isGameOver) {
		return;
	}
	game.timer -= delta / 60;
};
