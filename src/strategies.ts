import { type Buys, type Monster, type Mushroom, type Rune } from "./gameLogic";

export type Strategy = { strategy: string } & ((
	buys: Buys,
	opponentBuys: Buys,
	items: {
		mushrooms: Mushroom[];
		monsters: Monster[];
		runes: Rune[];
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

const defenseStrategy: Strategy = () => {
	if (Math.random() < 0.8) {
		return "defense";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "mana";
	}
};
defenseStrategy.strategy = "Defense";

const randomStrategy: Strategy = () => {
	if (Math.random() < 1 / 3) {
		return "defense";
	} else if (Math.random() < 0.5) {
		return "attack";
	} else {
		return "mana";
	}
};
randomStrategy.strategy = "Random ";

export const smartStrategy: Strategy = (buys, opponentBuys, items) => {
	if (
		opponentBuys.attack >= opponentBuys.mana + 1 &&
		opponentBuys.attack >= opponentBuys.defense + 1
	) {
		return defenseStrategy(buys, opponentBuys, items);
	}
	if (
		opponentBuys.mana >= opponentBuys.attack + 1 &&
		opponentBuys.mana >= opponentBuys.defense + 1
	) {
		return attackStrategy(buys, opponentBuys, items);
	}
	return manaStrategy(buys, opponentBuys, items);
};
smartStrategy.strategy = "Smart  ";

const smart2Strategy: Strategy = (buys, opponentBuys, items) => {
	if (items.runes.length < 4) {
		return defenseStrategy(buys, opponentBuys, items);
	} else {
		return smartStrategy(buys, opponentBuys, items);
	}
};
smart2Strategy.strategy = "Smart2 ";

const naturalStrategy: Strategy = (buys, opponentBuys, items) => {
	// console.log(JSON.stringify(buys));
	if (buys.attack >= buys.mana + 1 && buys.attack >= buys.defense + 1) {
		return attackStrategy(buys, opponentBuys, items);
	}
	if (buys.mana >= buys.attack + 1 && buys.mana >= buys.defense + 1) {
		return manaStrategy(buys, opponentBuys, items);
	}
	if (buys.defense >= buys.attack + 1 && buys.defense >= buys.mana + 1) {
		return defenseStrategy(buys, opponentBuys, items);
	}
	return randomStrategy(buys, opponentBuys, items);
};
naturalStrategy.strategy = "Natural";
