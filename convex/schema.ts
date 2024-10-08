import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const player = {
	lastPing: v.number(),
	mana: v.number(),
	defense: v.number(),
	mushrooms: v.array(
		v.object({
			strength: v.union(v.literal(1), v.literal(2)),
		}),
	),
	monsters: v.array(
		v.object({
			hp: v.number(),
			strength: v.union(v.literal(1), v.literal(2), v.literal(3)),
			position: v.object({
				x: v.number(),
				y: v.number(),
			}),
		}),
	),
};

export default defineSchema({
	players: defineTable({
		token: v.string(),
		gameId: v.optional(v.id("games")),
		proposals: v.array(v.id("players")),
		opponentId: v.optional(v.id("players")),
		name: v.string(),
		...player,
	}),
	games: defineTable({
		playerId: v.id("players"),
		opponentId: v.id("players"),
		rounds: v.array(
			v.object({
				player: v.object(player),
				opponent: v.object(player),
			}),
		),
	}),
});
