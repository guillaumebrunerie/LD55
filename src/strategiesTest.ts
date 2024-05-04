import {
	initialDefense,
	initialMana,
	pickDefenseData,
	pickFighter,
	pickMonsterData,
	pickMushroomData,
	setTesting,
	type PlayerData,
} from "./rules";
import {
	attackStrategy,
	defenseStrategy,
	manaStrategy,
	randomStrategy,
	smartStrategy,
	type Strategy,
} from "./strategies";

type Player = {
	current: PlayerData;
	previousStartData: PlayerData;
	previousEndData: PlayerData;
};

const emptyPlayerData = (): PlayerData => ({
	mana: 0,
	defense: 0,
	monsters: [],
	mushrooms: [],
});

const initialPlayerData = (): PlayerData => ({
	mana: initialMana,
	defense: initialDefense,
	monsters: [],
	mushrooms: [],
});

const newPlayer = (): Player => ({
	current: initialPlayerData(),
	previousStartData: emptyPlayerData(),
	previousEndData: emptyPlayerData(),
});

type Game = {
	player: Player;
	opponent: Player;
};

const newGame = (): Game => ({
	player: newPlayer(),
	opponent: newPlayer(),
});

const doFight = (player: PlayerData, opponent: PlayerData) => {
	// Attack
	while (player.monsters.length > 0 && opponent.monsters.length > 0) {
		const playerAttacker = pickFighter(player.monsters);
		const opponentAttacker = pickFighter(opponent.monsters);
		const fightStrength = Math.min(playerAttacker.hp, opponentAttacker.hp);

		const destination = {
			x:
				(1920 -
					opponentAttacker.position.x +
					playerAttacker.position.x) /
				2,
			y: (opponentAttacker.position.y + playerAttacker.position.y) / 2,
		};
		const destination2 = {
			x: 1920 - destination.x,
			y: destination.y,
		};

		playerAttacker.hp -= fightStrength;
		opponentAttacker.hp -= fightStrength;
		playerAttacker.position = destination;
		opponentAttacker.position = destination2;

		if (playerAttacker.hp == 0) {
			player.monsters = player.monsters.filter(
				(item) => item != playerAttacker,
			);
		}
		if (opponentAttacker.hp == 0) {
			opponent.monsters = opponent.monsters.filter(
				(item) => item != opponentAttacker,
			);
		}
	}

	// Defense
	while (player.monsters.length > 0 || opponent.monsters.length > 0) {
		const attacker = player.monsters.length > 0 ? player : opponent;
		const defender = player.monsters.length > 0 ? opponent : player;

		const fighter = pickFighter(attacker.monsters);
		const defense = defender.defense;
		if (defense == 0) {
			// Attack the player
			defender.defense = -1;
			return;
		} else if (defense == 1) {
			// Destroy shield
			defender.defense = 0;
		} else {
			// Destroy runes, ends up with at least 1 defense
			defender.defense -= Math.min(fighter.hp, defense - 1);
		}
		attacker.monsters = attacker.monsters.filter((item) => item != fighter);
	}
};

const resetPlayer = (player: Player) => {
	player.current.mana = initialMana;
	for (const mushroom of player.current.mushrooms) {
		player.current.mana += mushroom.strength;
	}
	player.current.mushrooms = [];
	player.current.monsters = [];
	player.previousStartData = structuredClone(player.current);
};

export const testStrategiesOnce = (
	strategy1: Strategy,
	strategy2: Strategy,
) => {
	const playStrategy = (
		strategy: Strategy,
		player: Player,
		opponent: Player,
	) => {
		while (player.current.mana > 0) {
			const type = strategy(
				player.current,
				opponent.previousStartData,
				opponent.previousEndData,
			);
			player.current.mana--;
			switch (type) {
				case "mana": {
					const mushroom = pickMushroomData(player.current);
					player.current.mushrooms.push(mushroom);
					break;
				}
				case "attack": {
					const monster = pickMonsterData(player.current);
					player.current.monsters.push(monster);
					break;
				}
				case "defense": {
					const defense = pickDefenseData(player.current);
					if (defense === null) {
						player.current.mana++;
						break;
					}
					player.current.defense += defense.strength;
					break;
				}
			}
		}
	};
	const printPlayer = (player: Player, label: string) => {
		console.log(label, "mushrooms", player.current.mushrooms.length);
		console.log(label, "runes", player.current.defense);
		console.log(label, "ghosts", player.current.monsters.length);
	};

	const game = newGame();
	let round = 1;
	do {
		// console.log();
		// console.log("Round", round);
		/* Both players play */
		playStrategy(strategy1, game.player, game.opponent);
		playStrategy(strategy2, game.opponent, game.player);

		// printPlayer(game.player, "Player");
		// printPlayer(game.opponent, "Opponent");
		/* Save previous data */
		game.player.previousEndData = structuredClone(game.player.current);
		game.opponent.previousEndData = structuredClone(game.opponent.current);

		/* Fight */
		doFight(game.player.current, game.opponent.current);

		resetPlayer(game.player);
		resetPlayer(game.opponent);
		round++;
	} while (
		game.player.current.defense >= 0 &&
		game.opponent.current.defense >= 0
	);
	if (game.opponent.current.defense < 0) {
		// console.log("Player wins");
		return { rounds: round, winner: "player" };
	} else {
		// console.log("Opponent wins");
		return { rounds: round, winner: "opponent" };
	}
};

setTesting(true);

const testStrategies = (strategy1: Strategy, strategy2: Strategy) => {
	let playerWins = 0;
	let opponentWins = 0;
	let totalRounds = 0;
	for (let i = 0; i < 1000; i++) {
		const { rounds, winner } = testStrategiesOnce(strategy1, strategy2);
		if (winner === "player") {
			playerWins++;
		} else {
			opponentWins++;
		}
		totalRounds += rounds;
	}
	console.log(
		`${strategy1.strategy} wins: ${playerWins}, \t${strategy2.strategy} wins: ${opponentWins}, \tRounds: ${totalRounds / 1000}`,
	);
};

const main = () => {
	// console.log("");
	// testStrategies(defenseStrategy, attackStrategy);
	// testStrategies(attackStrategy, manaStrategy);
	// testStrategies(manaStrategy, defenseStrategy);
	// testStrategies(attackStrategy, randomStrategy);
	// testStrategies(defenseStrategy, randomStrategy);
	// testStrategies(manaStrategy, randomStrategy);
	console.log("");
	testStrategies(smartStrategy, randomStrategy);
	testStrategies(smartStrategy, defenseStrategy);
	testStrategies(smartStrategy, attackStrategy);
	testStrategies(smartStrategy, manaStrategy);
	console.log("");
};

main();

// Bun.serve({
// 	fetch() {
// 		main();
// 		return new Response("Hello, world!");
// 	},
// });
