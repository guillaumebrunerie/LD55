import { v } from "convex/values";
import { query } from "./_generated/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { pickFighter, initialMana, maxDefense } from "../src/rules";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

export const opponentManaPoints = query({
	args: {
		playerId: v.optional(v.id("players")),
		token: v.optional(v.string()),
	},
	handler: async (ctx, { playerId, token }) => {
		if (!playerId) {
			return null;
		}
		const player = await getPlayer(ctx, playerId);
		if (player.token !== token || !player.gameId) {
			return null;
		}
		const game = await getGame(ctx, player.gameId);
		const opponentId =
			game.playerId == playerId ? game.opponentId : game.playerId;
		const opponent = await getPlayer(ctx, opponentId);
		return opponent.mana;
	},
});

export const lastFight = query({
	args: {
		playerId: v.optional(v.id("players")),
		token: v.optional(v.string()),
	},
	handler: async (ctx, { playerId, token }) => {
		if (!playerId || !token) {
			return null;
		}
		const player = await getPlayer(ctx, playerId);
		if (player.token !== token || !player.gameId) {
			return null;
		}
		const game = await getGame(ctx, player.gameId);
		const roundCount = game.rounds.length;
		const round = game.rounds[roundCount - 1];
		if (!round) {
			return null;
		}
		const otherPlayer =
			game.playerId == playerId ? round.opponent : round.player;
		return { round: roundCount, opponent: otherPlayer };
	},
});

const getGame = async (
	ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
	gameId: Id<"games"> | undefined,
) => {
	if (!gameId) {
		throw new Error("No gameId found");
	}
	const game = await ctx.db.get(gameId);
	if (!game) {
		throw new Error("No game found");
	}
	return game;
};

const getGameAndPlayers = async (
	ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
	gameId: Id<"games"> | undefined,
) => {
	if (!gameId) {
		throw new Error("No gameId found");
	}
	const game = await ctx.db.get(gameId);
	if (!game) {
		throw new Error("No game found");
	}
	const { playerId, opponentId } = game;
	if (!playerId || !opponentId) {
		throw new Error("A playerId is missing");
	}
	const player = await ctx.db.get(playerId);
	const opponent = await ctx.db.get(opponentId);
	if (!player || !opponent) {
		throw new Error("A player is missing");
	}
	return { game, player, opponent };
};

const getPlayer = async (
	ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
	playerId: Id<"players">,
) => {
	const player = await ctx.db.get(playerId);
	if (!player) {
		throw new Error("No player found");
	}
	if (player.mana < 0) {
		throw new Error("Negative mana");
	}
	if (player.defense > maxDefense) {
		throw new Error("Too much defense");
	}
	return player;
};

const clonePlayer = (player: Doc<"players">) => ({
	mana: player.mana,
	defense: player.defense,
	mushrooms: player.mushrooms.map((mushroom) => ({ ...mushroom })),
	monsters: player.monsters.map((monster) => ({ ...monster })),
});

export const maybeFight = async (
	ctx: GenericMutationCtx<DataModel>,
	player_: Doc<"players">,
) => {
	const gameId = player_.gameId;
	const { game, player, opponent } = await getGameAndPlayers(ctx, gameId);
	if (player.mana > 0 || opponent.mana > 0) {
		// No fight yet
		return;
	}

	// Save the current state
	const oldPlayer = clonePlayer(player);
	const oldOpponent = clonePlayer(opponent);

	// Perform the fight
	doFight(player, opponent);
	resetState(player);
	resetState(opponent);

	// Save the results
	await ctx.db.patch(game._id, {
		rounds: [
			...game.rounds,
			{
				player: oldPlayer,
				opponent: oldOpponent,
			},
		],
	});
	await ctx.db.replace(player._id, player);
	await ctx.db.replace(opponent._id, opponent);
};

const doFight = (player: Doc<"players">, opponent: Doc<"players">) => {
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

const resetState = (player: Doc<"players">) => {
	player.mana = initialMana;
	for (const mushroom of player.mushrooms) {
		player.mana += mushroom.strength;
	}
	player.mushrooms = [];
};
