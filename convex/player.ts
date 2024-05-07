import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import {
	maxDefense,
	pickMushroomData,
	pickDefenseData,
	type PlayerData,
	pickMonsterData,
} from "../src/rules";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { maybeFight } from "./fight";

export const playerName = query({
	args: {
		playerId: v.id("players"),
	},
	handler: async (ctx, { playerId }) => {
		const player = await getPlayer(ctx, playerId);
		return player.name;
	},
});

export const currentGameId = query({
	args: {
		playerId: v.optional(v.id("players")),
	},
	handler: async (ctx, { playerId }) => {
		if (!playerId) {
			return;
		}
		const player = await getPlayer(ctx, playerId);
		return player?.gameId;
	},
});

export const playerMana = query({
	args: {
		playerId: v.id("players"),
	},
	handler: async (ctx, { playerId }) => {
		const player = await getPlayer(ctx, playerId);
		return player.mana;
	},
});

const getPlayerData = (player: Doc<"players">): PlayerData => ({
	mana: player.mana,
	monsters: player.monsters,
	mushrooms: player.mushrooms,
	defense: player.defense,
});

export const buyMushroom = mutation({
	args: { playerId: v.id("players"), token: v.string() },
	handler: async (ctx, { playerId, token }) => {
		const player = await getPlayer(ctx, playerId);
		if (player.token !== token) {
			return null;
		}
		if (player.mana == 0) {
			return null;
		}
		const { strength } = pickMushroomData(getPlayerData(player));
		await ctx.db.patch(playerId, {
			mana: player.mana - 1,
			mushrooms: [...player.mushrooms, { strength }],
		});
		await maybeFight(ctx, player);
		return { strength };
	},
});

export const buyDefense = mutation({
	args: { playerId: v.id("players"), token: v.string() },
	handler: async (ctx, { playerId, token }) => {
		const player = await getPlayer(ctx, playerId);
		if (player.token !== token) {
			return null;
		}
		const data = pickDefenseData(getPlayerData(player));
		if (!data) {
			return null;
		}
		const { strength } = data;

		await ctx.db.patch(playerId, {
			mana: player.mana - 1,
			defense: player.defense + strength,
		});
		await maybeFight(ctx, player);
		return { strength };
	},
});

export const buyMonster = mutation({
	args: { playerId: v.id("players"), token: v.string() },
	handler: async (ctx, { playerId, token }) => {
		const player = await getPlayer(ctx, playerId);
		if (player.token !== token) {
			return null;
		}
		if (player.mana == 0) {
			return null;
		}

		const { position, strength } = pickMonsterData(getPlayerData(player));

		await ctx.db.patch(playerId, {
			mana: player.mana - 1,
			monsters: [
				...player.monsters,
				{ position, strength, hp: strength },
			],
		});
		await maybeFight(ctx, player);
		return { position, strength };
	},
});

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
