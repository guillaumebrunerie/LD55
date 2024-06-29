import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { pickName } from "./names";
import type { Doc } from "./_generated/dataModel";
import { initialDefense, initialMana } from "../src/rules";
import type { WithoutSystemFields } from "convex/server";

const pickToken = () => {
	return Math.random().toString(36).slice(2);
};

const newPlayer = (): WithoutSystemFields<Doc<"players">> => ({
	lastPing: 0,
	token: pickToken(),
	name: pickName(),
	mana: initialMana,
	defense: initialDefense,
	mushrooms: [],
	monsters: [],
});

export const createNewPlayer = mutation({
	handler: async (ctx) => {
		const player = newPlayer();
		const playerId = await ctx.db.insert("players", player);
		return { playerId, token: player.token };
	},
});

export const ping = mutation({
	args: {
		playerId: v.id("players"),
		token: v.string(),
	},
	handler: async (ctx, { playerId, token }) => {
		const player = await ctx.db.get(playerId);
		if (!player || player.token != token) {
			return;
		}
		await ctx.db.patch(playerId, { lastPing: Date.now() });
	},
});

export const disconnect = mutation({
	args: {
		playerId: v.id("players"),
		token: v.string(),
	},
	handler: async (ctx, { playerId, token }) => {
		const player = await ctx.db.get(playerId);
		if (!player || player.token != token) {
			return;
		}
		await ctx.db.delete(playerId);
	},
});

export const availablePlayers = query({
	handler: async (ctx) => {
		const players = await ctx.db
			.query("players")
			.filter((q) =>
				q.and(
					q.eq(q.field("gameId"), undefined),
					q.gt(q.add(q.field("lastPing"), 30_000), Date.now()),
				),
			)
			.collect();
		return players.map((player) => ({
			id: player._id,
			name: player.name,
			opponentId: player.opponentId,
			lastPing: player.lastPing,
		}));
	},
});

export const requestPlay = mutation({
	args: {
		playerId: v.id("players"),
		token: v.string(),
		opponentId: v.id("players"),
	},
	handler: async (ctx, { playerId, token, opponentId }) => {
		const player = await ctx.db.get(playerId);
		const opponent = await ctx.db.get(opponentId);
		if (
			!player ||
			player.gameId ||
			!opponent ||
			opponent.gameId ||
			player.token != token
		) {
			return;
		}
		if (opponent.opponentId == playerId) {
			// If the opponent already asked us to play, start a game
			const gameId = await ctx.db.insert("games", {
				playerId,
				opponentId,
				rounds: [],
			});
			await ctx.db.patch(playerId, { gameId });
			await ctx.db.patch(opponentId, { gameId });
			return;
		} else if (opponentId == player.opponentId) {
			// If we already asked them to play, cancel
			await ctx.db.patch(playerId, { opponentId: undefined });
		} else {
			// Otherwise, just remember that we asked them to play
			await ctx.db.patch(playerId, { opponentId });
		}
	},
});
