import { Container, Sprite } from "@pixi/react";
import type { GameT as GameT, Item, Player } from "./gameLogic";
import {
	Monster1,
	Monster2,
	Monster3,
	Mana1,
	Monster3Dies,
	ManaPoint,
	ShieldLoop,
	ShieldHit,
	CloudFight,
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
} from "./assets";
import { BLEND_MODES, ColorMatrixFilter } from "pixi.js";
import { getFrame, getNtFrame } from "./Animation";
import type { WizardT } from "./wizard";

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			<Container scale={[-1, 1]} x={1920}>
				<Player
					game={game}
					player={game.opponent}
					monsterTint={0xff4444}
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
	switch (wizard.state) {
		case "idle":
			return (
				<Sprite
					texture={getFrame(WizardIdle, 10, wizard.lt)}
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
					texture={getFrame(WizardIdle, 30, wizard.lt)}
					x={-15}
					y={230}
					alpha={wizard.nt}
					filters={player == game.opponent ? [filter] : []}
				/>
			);
		case "disappearing":
			return (
				<Sprite
					texture={getFrame(WizardIdle, 30, wizard.lt)}
					x={-15}
					y={230}
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
			<ManaPoints items={player.mana} />
			<Wizard game={game} player={player} wizard={player.wizard} />
			<DefenseItems items={player.items.defense} />
			<ManaItems items={player.items.mana} />
			<MonsterItems items={player.items.attack} tint={monsterTint} />
		</Container>
	);
};

const ManaPoints = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => <ManaPointC key={i} item={item} />);
};

const manaEndAnimations = {
	1: Mana1End,
	2: Mana2End,
} as const;

const ManaPointC = ({ item }: { item: Item }) => {
	const lt = item.lt;
	switch (item.state) {
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

const MonsterItems = ({ items, tint }: { items: Item[]; tint: number }) => {
	return items.map((item, i) => (
		<MonsterItem key={i} item={item} tint={tint} />
	));
};

const MonsterTexture = {
	1: Monster1,
	2: Monster2,
	3: Monster3,
} as const;

const MonsterItem = ({ item, tint }: { item: Item; tint: number }) => {
	const visible = (
		<Sprite
			anchor={0.5}
			tint={tint}
			rotation={0}
			scale={1}
			blendMode={BLEND_MODES.NORMAL}
			texture={MonsterTexture[item.strength]}
			position={item.tmpPosition || { ...item.position }}
		/>
	);
	switch (item.state) {
		case "visible":
			return visible;
		case "fighting": {
			const j = Math.floor((item.nt || 0) * (Monster3Dies.length - 1));
			return (
				<Sprite
					anchor={0.5}
					tint={0xffffff}
					rotation={0}
					scale={1}
					blendMode={BLEND_MODES.ADD}
					texture={Monster3Dies[j]}
					position={item.tmpPosition || item.position}
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

const ManaItems = ({ items }: { items: Item[] }) => {
	return items
		.toSorted((a, b) => a.position.y - b.position.y)
		.map((item, i) => <ManaItem key={i} item={item} />);
};

const ManaTexture = {
	1: Mana1,
	2: Mana2,
} as const;

const ManaItem = ({ item }: { item: Item }) => {
	const visible = (
		<Sprite
			texture={ManaTexture[item.strength as 1 | 2]}
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

const DefenseItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => <DefenseItem key={i} item={item} i={i} />);
};

const DefenseItem = ({ item, i }: { item: Item; i: number }) => {
	const visible = (
		<>
			{i > 0 && (
				<Sprite
					texture={RunesSheet.animations.Rune[i - 1]}
					anchor={0}
					position={[-14, 613]}
				/>
			)}
			{i == 1 && (
				<Sprite
					texture={ShieldLoop}
					blendMode={BLEND_MODES.ADD}
					position={[18, -70]}
					anchor={0}
					scale={2}
				/>
			)}
			{item.state == "fighting" && i > 0 && (
				<Sprite
					texture={getNtFrame(ShieldHit, item.nt)}
					blendMode={BLEND_MODES.ADD}
					position={[18, -70]}
					anchor={0}
					scale={2}
				/>
			)}
			{item.state == "fighting" && i == 0 && (
				<Sprite
					texture={CloudFight}
					blendMode={BLEND_MODES.NORMAL}
					position={item.position}
					anchor={0.5}
				/>
			)}
		</>
	);

	switch (item.state) {
		case "visible":
		case "fighting":
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
