// import { buyAttackItem, buyDefenseItem, buyManaItem, newGame, type GameT, type Player } from "./gameLogic";
// import type { Strategy } from "./strategies";

// export const testStrategiesOnce = (
// 	strategy1: Strategy,
// 	strategy2: Strategy,
// ) => {
// 	const playStrategy = (
// 		strategy: Strategy,
// 		game: GameT,
// 		player: Player,
// 		opponent: Player,
// 	) => {
// 		while (player.mana.length > 0) {
// 			const type = strategy(
// 				player.boughtPreviousRound,
// 				opponent.boughtPreviousRound,
// 				player.items,
// 			);
// 			switch (type) {
// 				case "mana":
// 					buyManaItem(game, player);
// 					break;
// 				case "attack":
// 					buyAttackItem(game, player);
// 					break;
// 				case "defense":
// 					buyDefenseItem(game, player);
// 					break;
// 			}
// 		}
// 	};
// 	const playRound = (game: GameT) => {
// 		do {
// 			pickAttackPair(game);
// 		} while (game.state === "attack");
// 		do {
// 			pickDefensePair(game);
// 		} while (game.state === "defense");
// 	};
// 	const printPlayer = (player: Player, label: string) => {
// 		console.log(label, "flowers", player.items.mana.length);
// 		console.log(label, "runes", player.items.defense.length);
// 		console.log(label, "ghosts", player.items.attack.length);
// 	};

// 	const game = newGame();
// 	let round = 1;
// 	do {
// 		// console.log();
// 		// console.log("Round", round);
// 		round++;
// 		playStrategy(strategy1, game, game.player, game.opponent);
// 		playStrategy(strategy2, game, game.opponent, game.player);
// 		// printPlayer(game.player, "Player");
// 		// printPlayer(game.opponent, "Opponent");
// 		playRound(game);
// 		// printPlayer(game.player, "> Player");
// 		// printPlayer(game.opponent, "> Opponent");
// 		nextRound(game);
// 		// debugger;
// 	} while (
// 		game.player.items.attack.length == 0 &&
// 		game.opponent.items.attack.length == 0
// 	);
// 	if (game.player.items.attack.length > 0) {
// 		// console.log("Player wins");
// 		return { rounds: round, winner: "player" };
// 	} else {
// 		// console.log("Opponent wins");
// 		return { rounds: round, winner: "opponent" };
// 	}
// };

// const testStrategies = (strategy1: Strategy, strategy2: Strategy) => {
// 	let playerWins = 0;
// 	let opponentWins = 0;
// 	let totalRounds = 0;
// 	ITERATION_COUNT = 0;
// 	for (let i = 0; i < 1000; i++) {
// 		const { rounds, winner } = testStrategiesOnce(strategy1, strategy2);
// 		if (winner === "player") {
// 			playerWins++;
// 		} else {
// 			opponentWins++;
// 		}
// 		totalRounds += rounds;
// 	}
// 	ITERATION_COUNT = 100;
// 	console.log(
// 		`${strategy1.strategy} wins: ${playerWins}, \t${strategy2.strategy} wins: ${opponentWins}, \tRounds: ${totalRounds / 1000}`,
// 	);
// };

// console.log("");
// testStrategies(defenseStrategy, attackStrategy);
// testStrategies(attackStrategy, manaStrategy);
// testStrategies(manaStrategy, defenseStrategy);
// testStrategies(attackStrategy, randomStrategy);
// testStrategies(defenseStrategy, randomStrategy);
// testStrategies(manaStrategy, randomStrategy);
// testStrategies(smartStrategy, randomStrategy);
// testStrategies(smartStrategy, defenseStrategy);
// testStrategies(smartStrategy, attackStrategy);
// testStrategies(smartStrategy, manaStrategy);
// testStrategies(smart2Strategy, randomStrategy);
// testStrategies(smart2Strategy, defenseStrategy);
// testStrategies(smart2Strategy, attackStrategy);
// testStrategies(smart2Strategy, manaStrategy);
// testStrategies(smart2Strategy, smartStrategy);
// console.log("");
// // debugger;
