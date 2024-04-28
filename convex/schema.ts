import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const player = {
	mana: v.number(),
	defense: v.number(),
	mushrooms: v.array(
		v.object({
			strength: v.number(),
		}),
	),
	monsters: v.array(
		v.object({
			hp: v.number(),
			strength: v.number(),
			position: v.object({
				x: v.number(),
				y: v.number(),
			}),
		}),
	),
};

export default defineSchema({
	players: defineTable({
		gameId: v.optional(v.id("games")),
		...player,
	}),
	games: defineTable({
		playerId: v.optional(v.id("players")),
		opponentId: v.optional(v.id("players")),
		rounds: v.array(
			v.object({
				player: v.object(player),
				opponent: v.object(player),
			}),
		),
	}),
});
