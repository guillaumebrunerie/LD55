export type Strategy = { strategy: string } & ((
	player: {
		// Current state of the player
		mana: number;
		monsters: { strength: 1 | 2 | 3 }[];
		mushrooms: { strength: 1 | 2 }[];
		defense: number;
	},
	opponent: {
		// State of the opponent at the beginning of this round
		mana: number;
		defense: number;
	},
	opponentLastRound: {
		// State of the opponent at the end of the last round
		monsters: { strength: 1 | 2 | 3 }[];
		mushrooms: { strength: 1 | 2 }[];
		defense: number;
	},
) => "mana" | "attack" | "defense");

export const attackStrategy: Strategy = () => {
	if (Math.random() < 0.8) {
		return "attack";
	} else if (Math.random() < 0.5) {
		return "mana";
	} else {
		return "defense";
	}
};
attackStrategy.strategy = "Attack ";

export const manaStrategy: Strategy = () => {
	if (Math.random() < 0.8) {
		return "mana";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "defense";
	}
};
manaStrategy.strategy = "Mana   ";

export const defenseStrategy: Strategy = () => {
	if (Math.random() < 0.8) {
		return "defense";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "mana";
	}
};
defenseStrategy.strategy = "Defense";

export const randomStrategy: Strategy = () => {
	if (Math.random() < 1 / 3) {
		return "defense";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "mana";
	}
};
randomStrategy.strategy = "Random ";

export const smartStrategy: Strategy = (
	player,
	opponent,
	opponentLastRound,
) => {
	const opponentStrength = opponent.defense;
	const strength =
		player.defense +
		player.monsters.reduce((acc, m) => acc + m.strength, 0);
	if (opponentStrength > strength) {
		if (player.defense == 16) {
			return attackStrategy(player, opponent, opponentLastRound);
		}
		return defenseStrategy(player, opponent, opponentLastRound);
	}

	const attack = opponentLastRound.monsters.length;
	const mushrooms = opponentLastRound.mushrooms.length;
	const defense = opponentLastRound.defense - attack - mushrooms - 6;

	if (attack >= mushrooms + 1 && attack >= defense + 1) {
		return defenseStrategy(player, opponent, opponentLastRound);
	}
	if (mushrooms >= attack + 1 && mushrooms >= defense + 1) {
		return attackStrategy(player, opponent, opponentLastRound);
	}
	return manaStrategy(player, opponent, opponentLastRound);
};
smartStrategy.strategy = "Smart  ";

// export const smart2Strategy: Strategy = (
// 	player,
// 	opponent,
// 	opponentLastRound,
// ) => {
// 	if (player.defense < 4) {
// 		return defenseStrategy(playerStart, player, opponent, opponentLastRound);
// 	} else {
// 		return smartStrategy(playerStart, player, opponent, opponentLastRound);
// 	}
// };
// smart2Strategy.strategy = "Smart2 ";

// const naturalStrategy: Strategy = (player, opponent, opponentLastRound) => {
// 	const attack = player.monsters.length;
// 	const mushrooms = player.mushrooms.length;
// 	const defense = player.defense - attack - mushrooms;

// 	if (attack >= mushrooms + 1 && attack >= defense + 1) {
// 		return attackStrategy(player, opponent, opponentLastRound);
// 	}
// 	if (mushrooms >= attack + 1 && mushrooms >= defense + 1) {
// 		return manaStrategy(player, opponent, opponentLastRound);
// 	}
// 	if (defense >= attack + 1 && defense >= mushrooms + 1) {
// 		return defenseStrategy(player, opponent, opponentLastRound);
// 	}
// 	return randomStrategy(player, opponent, opponentLastRound);
// };
// naturalStrategy.strategy = "Natural";
