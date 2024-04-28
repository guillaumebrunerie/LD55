import { Container, Sprite } from "@pixi/react";
import {
	type GameT as GameT,
	type Mana,
	type Monster,
	type Rune,
	type Mushroom,
	type Player,
	type Shield,
	setupFight,
} from "./gameLogic";
import {
	Mana1,
	ManaPoint,
	ShieldLoop,
	ShieldHit,
	Mana2,
	Spawn,
	Mana1End,
	ManaPointBlurred,
	ManaPointStart,
	Mana2End,
	WizardIdle,
	WizardMagicLoop,
	WizardMagicEnd,
	RunesSheet,
	WizardMagicStart,
	WizardDie,
	WizardAppear,
	Monster1Idle,
	Monster2Idle,
	Monster3Idle,
	Monster1Die,
	Monster2Die,
	Monster3Die,
	WizardWin,
} from "./assets";
import { BLEND_MODES, ColorMatrixFilter } from "pixi.js";
import { getFrame, getNtFrame } from "./Animation";
import type { WizardT } from "./wizard";
import { useGlobalTime } from "./useGlobalTime";
import { wave } from "./ease";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";
import { runInAction } from "mobx";

const SyncLastFight = ({ game }: { game: GameT }) => {
	const lastFight = useQuery(api.functions.lastFight, {
		playerId: game.playerId,
	});
	useEffect(() => {
		runInAction(() => {
			if (lastFight) {
				console.log("Fight:", lastFight);
				setupFight(game, lastFight);
			}
		});
	}, [lastFight, game]);
	return null;
};

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			{game.playerId && <SyncLastFight game={game} />}
			<Container scale={[-1, 1]} x={1920}>
				<Player
					game={game}
					player={game.opponent}
					monsterTint={0xffff00}
				/>
			</Container>
			<Container>
				<Player
					game={game}
					player={game.player}
					monsterTint={0xffffff}
				/>
			</Container>
		</Container>
	);
};

const filter = new ColorMatrixFilter();
filter.hue(70, false);

const Wizard = ({
	game,
	player,
	wizard,
}: {
	game: GameT;
	player: Player;
	wizard: WizardT;
}) => {
	const gt = useGlobalTime();
	switch (wizard.state) {
		case "idle":
			return (
				<Sprite
					texture={getFrame(WizardIdle, 10, gt)}
					x={-15}
					y={230}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "winning":
			return (
				<Sprite
					texture={getFrame(WizardWin, 20, gt)}
					x={-15}
					y={230}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "magicStart":
			return (
				<Sprite
					texture={getNtFrame(WizardMagicStart, wizard.nt)}
					x={-15}
					y={230}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "magicLoop":
			return (
				<Sprite
					texture={getFrame(WizardMagicLoop, 20, wizard.lt)}
					x={-15}
					y={230}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "magicEnd":
			return (
				<Sprite
					texture={getNtFrame(WizardMagicEnd, wizard.nt)}
					x={-15}
					y={230}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "appearing":
			return (
				<Sprite
					texture={getNtFrame(WizardAppear, wizard.nt)}
					x={-15}
					y={230}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "die":
			return (
				<Sprite
					texture={getNtFrame(WizardDie, wizard.nt)}
					x={-80}
					y={170}
					alpha={1 - wizard.nt}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "hidden":
			break;
		default:
			console.error("Unhandled state: ", wizard.state);
	}
};

const Player = ({
	game,
	player,
	monsterTint,
}: {
	game: GameT;
	player: Player;
	monsterTint: number;
}) => {
	return (
		<Container>
			<ManaPoints items={player.manaPoints} />
			<Wizard game={game} player={player} wizard={player.wizard} />
			<Shield shield={player.items.shield} />
			<Runes runes={player.items.runes} />
			<Mushrooms items={player.items.mushrooms} />
			<MonsterItems items={player.items.monsters} tint={monsterTint} />
		</Container>
	);
};

const ManaPoints = ({ items }: { items: Mana[] }) => {
	return items.map((item, i) => <ManaPointC key={i} item={item} />);
};

const manaEndAnimations = {
	1: Mana1End,
	2: Mana2End,
} as const;

const ManaPointC = ({ item }: { item: Mana }) => {
	const lt = item.lt;
	switch (item.state) {
		case "anticipating": {
			const dx = (Math.random() - 0.5) * 20;
			const dy = (Math.random() - 0.5) * 20;
			return (
				<Sprite
					anchor={0.5}
					scale={item.scale}
					rotation={lt * 3 + item.offset}
					blendMode={BLEND_MODES.NORMAL}
					texture={ManaPoint}
					position={{
						x: item.position.x + dx,
						y: item.position.y + dy,
					}}
				/>
			);
		}
		case "visible":
			return (
				<Sprite
					anchor={0.5}
					scale={item.scale}
					rotation={lt * 3 + item.offset}
					blendMode={BLEND_MODES.NORMAL}
					texture={ManaPoint}
					position={item.position}
				/>
			);
		case "spawning": {
			if (item.previousItem) {
				return (
					<>
						<Sprite
							anchor={0.5}
							scale={1}
							rotation={0}
							blendMode={BLEND_MODES.NORMAL}
							texture={getNtFrame(
								manaEndAnimations[item.previousItem.strength],
								item.nt,
							)}
							position={item.previousItem.position}
						/>
						<Sprite
							anchor={0.5}
							scale={item.scale}
							rotation={lt * 3 + item.offset}
							blendMode={BLEND_MODES.NORMAL}
							alpha={
								item.nt < 0.2 ? 0 : Math.min(item.lt / 0.2, 1)
							}
							texture={ManaPoint}
							position={item.tmpPosition || item.position}
						/>
					</>
				);
			} else {
				return (
					<>
						<Sprite
							anchor={0.5}
							scale={item.scale}
							rotation={lt * 3 + item.offset}
							blendMode={BLEND_MODES.NORMAL}
							texture={getNtFrame(ManaPointStart, item.nt)}
							position={item.position}
						/>
					</>
				);
			}
		}
	}
};

const MonsterItems = ({ items, tint }: { items: Monster[]; tint: number }) => {
	return items.map((item, i) => (
		<MonsterItem key={i} item={item} tint={tint} />
	));
};

const MonsterIdle = {
	1: Monster1Idle,
	2: Monster2Idle,
	3: Monster3Idle,
} as const;

const MonsterDie = {
	1: Monster1Die,
	2: Monster2Die,
	3: Monster3Die,
} as const;

const MonsterItem = ({ item, tint }: { item: Monster; tint: number }) => {
	const gt = useGlobalTime();
	const visible = (
		<Sprite
			anchor={0.5}
			tint={tint}
			rotation={0}
			scale={1}
			blendMode={BLEND_MODES.ADD}
			texture={getFrame(MonsterIdle[item.strength], 20, gt)}
			position={{ ...item.position }}
		/>
	);
	switch (item.state) {
		case "approach": {
			if (!item.destination) {
				console.error("No destination");
				item.destination = item.position;
			}
			const nt = wave(item.nt);
			const position = {
				x: (1 - nt) * item.position.x + nt * item.destination.x,
				y: (1 - nt) * item.position.y + nt * item.destination.y,
			};
			return (
				<Sprite
					anchor={0.5}
					tint={tint}
					rotation={0}
					scale={1}
					blendMode={BLEND_MODES.ADD}
					texture={getFrame(MonsterIdle[item.strength], 20, gt)}
					position={position}
				/>
			);
		}
		case "visible":
			return visible;
		case "fighting": {
			if (item.hp > 0) {
				return visible;
			}
			return (
				<Sprite
					anchor={0.5}
					tint={tint}
					rotation={0}
					scale={1}
					blendMode={BLEND_MODES.ADD}
					texture={getNtFrame(
						MonsterDie[item.strength],
						item.nt || 0,
					)}
					position={item.position}
				/>
			);
		}
		case "preSpawning": {
			if (!item.previousItem) {
				console.log("No previous item");
				break;
			}
			const dx = item.previousItem.position.x - item.position.x;
			const dy = item.previousItem.position.y - item.position.y;
			const angle = Math.atan2(dy, dx);
			return (
				<Sprite
					anchor={0.5}
					scale={item.previousItem.scale}
					rotation={angle + Math.PI / 2}
					blendMode={BLEND_MODES.NORMAL}
					alpha={Math.min(item.nt * 3, 1)}
					texture={ManaPointBlurred}
					position={item.destination}
				/>
			);
		}
		case "spawning":
			return (
				<>
					{visible}
					<Sprite
						anchor={0.5}
						scale={0.5}
						blendMode={BLEND_MODES.ADD}
						texture={getFrame(Spawn, 30, item.lt)}
						position={item.position}
					/>
				</>
			);
	}
	return null;
};

const Mushrooms = ({ items }: { items: Mushroom[] }) => {
	return items
		.toSorted((a, b) => a.position.y - b.position.y)
		.map((item, i) => <Mushroom key={i} item={item} />);
};

const ManaTexture = {
	1: Mana1,
	2: Mana2,
} as const;

const Mushroom = ({ item }: { item: Mushroom }) => {
	const visible = (
		<Sprite
			texture={ManaTexture[item.strength]}
			rotation={0}
			blendMode={BLEND_MODES.NORMAL}
			scale={1}
			anchor={0.5}
			position={item.position}
		/>
	);
	switch (item.state) {
		case "visible":
			return visible;
		case "preSpawning": {
			if (!item.previousItem) {
				console.error("No previous item");
				break;
			}
			const dx = item.previousItem.position.x - item.position.x;
			const dy = item.previousItem.position.y - item.position.y;
			const angle = Math.atan2(dy, dx);
			return (
				<Sprite
					anchor={0.5}
					scale={item.previousItem.scale}
					rotation={angle + Math.PI / 2}
					blendMode={BLEND_MODES.NORMAL}
					alpha={Math.min(item.nt * 3, 1)}
					texture={ManaPointBlurred}
					position={item.tmpPosition}
				/>
			);
		}
		case "spawning":
			return (
				<>
					{visible}
					<Sprite
						anchor={0.5}
						scale={0.5}
						blendMode={BLEND_MODES.ADD}
						texture={getFrame(Spawn, 30, item.lt)}
						position={item.position}
					/>
				</>
			);
	}
	return null;
};

const Runes = ({ runes: items }: { runes: Rune[] }) => {
	return items.map((item, i) => <RuneC key={i} item={item} i={i} />);
};

const RuneC = ({ item, i }: { item: Rune; i: number }) => {
	const visible = (
		<Sprite
			texture={RunesSheet.animations.Rune[i + 1]}
			anchor={0}
			rotation={0}
			scale={1}
			alpha={1}
			position={[-14, 613]}
		/>
	);

	switch (item.state) {
		case "disappearing":
			return (
				<Sprite
					texture={RunesSheet.animations.Rune[i + 1]}
					anchor={0}
					rotation={0}
					scale={1}
					alpha={1 - item.nt}
					position={[-14, 613]}
				/>
			);

		case "visible":
			return visible;
		case "preSpawning": {
			if (item.hidden) {
				return null;
			}
			if (!item.previousItem) {
				console.error("No previous item");
				break;
			}
			const dx = item.previousItem.position.x - item.position.x;
			const dy = item.previousItem.position.y - item.position.y;
			const angle = Math.atan2(dy, dx);
			return (
				<Sprite
					anchor={0.5}
					scale={item.previousItem.scale}
					rotation={angle + Math.PI / 2}
					blendMode={BLEND_MODES.NORMAL}
					alpha={Math.min(item.nt * 3, 1)}
					texture={ManaPointBlurred}
					position={item.tmpPosition}
				/>
			);
		}
		case "spawning":
			if (item.hidden) {
				return visible;
			}
			return (
				<>
					{visible}
					<Sprite
						anchor={0.5}
						scale={0.5}
						blendMode={BLEND_MODES.ADD}
						texture={getFrame(Spawn, 30, item.lt)}
						position={item.position}
					/>
				</>
			);
	}
	return null;
};

const Shield = ({ shield }: { shield: Shield }) => {
	switch (shield.state) {
		case "visible":
			return (
				<>
					<Sprite
						texture={RunesSheet.animations.Rune[0]}
						anchor={0}
						rotation={0}
						scale={1}
						alpha={1}
						blendMode={BLEND_MODES.NORMAL}
						position={[-14, 613]}
					/>
					<Sprite
						texture={ShieldLoop}
						blendMode={BLEND_MODES.ADD}
						position={[18, -70]}
						anchor={0}
						scale={2}
					/>
				</>
			);

		case "fighting":
			return (
				<>
					<Sprite
						texture={RunesSheet.animations.Rune[0]}
						anchor={0}
						rotation={0}
						scale={1}
						alpha={1}
						blendMode={BLEND_MODES.NORMAL}
						position={[-14, 613]}
					/>
					<Sprite
						texture={ShieldLoop}
						blendMode={BLEND_MODES.ADD}
						position={[18, -70]}
						anchor={0}
						scale={2}
					/>
					<Sprite
						texture={getNtFrame(ShieldHit, shield.nt)}
						blendMode={BLEND_MODES.ADD}
						position={[18, -70]}
						anchor={0}
						scale={2}
					/>
				</>
			);
	}
	return null;
};
