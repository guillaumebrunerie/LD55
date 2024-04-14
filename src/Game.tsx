import { Container, Sprite } from "@pixi/react";
import type { GameT as GameT, Item } from "./gameLogic";
import {
	Monster1,
	Monster2,
	Monster3,
	Hero,
	Mana1,
	Monster3Dies,
	Moon,
	ManaPoint,
	Runes,
	ShieldLoop,
	ShieldHit,
	CloudFight,
	Mana2,
	Spawn,
} from "./assets";
import { BLEND_MODES } from "pixi.js";
import { Fragment } from "react/jsx-runtime";
import { useLocalTime } from "./useLocalTime";
import { getFrame } from "./Animation";
import { Rectangle } from "./Rectangle";
import { wave } from "./ease";

export const Game = ({ game }: { game: GameT }) => {
	let screenAlpha = 0;
	switch (game.phase) {
		case "buildUp":
			screenAlpha = 1;
			break;
		case "toAttack":
			screenAlpha = wave(1 - game.nt);
			break;
		case "rebuild":
			screenAlpha = wave(game.nt);
			break;
	}
	return (
		<Container>
			<Container scale={[-1, 1]} x={1920}>
				<Player player={game.opponent} monsterTint={0xff4444} />
			</Container>
			<Rectangle
				x={1920 / 2}
				y={0}
				width={1920 / 2}
				height={1080}
				alpha={screenAlpha}
			/>
			<Container>
				<Player player={game.player} monsterTint={0xffffff} />
			</Container>
		</Container>
	);
};

const Player = ({
	player,
	monsterTint,
}: {
	player: GameT["player"];
	monsterTint: number;
}) => {
	return (
		<Container>
			<ManaPoints items={player.mana} />
			<Sprite texture={Hero} x={180} y={290} />
			<DefenseItems items={player.items.defense} />
			<ManaItems items={player.items.mana} />
			<MonsterItems items={player.items.attack} tint={monsterTint} />
		</Container>
	);
};

const ManaPoints = ({ items }: { items: Item[] }) => {
	const lt = useLocalTime();
	return items.map((item, i) => {
		return (
			<Sprite
				key={i}
				anchor={0.5}
				scale={item.scale}
				rotation={lt * 3 + item.offset}
				blendMode={BLEND_MODES.NORMAL}
				texture={ManaPoint}
				position={item.position}
			/>
		);
	});
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
	const lt = useLocalTime();
	const visible = (
		<Sprite
			anchor={0.5}
			tint={tint}
			rotation={0}
			scale={1}
			blendMode={BLEND_MODES.NORMAL}
			texture={MonsterTexture[item.strength]}
			position={item.tmpPosition || item.position}
		/>
	);
	switch (item.state) {
		case "visible":
			return (
				<Fragment>
					{visible}
					{/* <CustomText */}
					{/* 	text={String(item.hp)} */}
					{/* 	position={item.tmpPosition || item.position} */}
					{/* /> */}
				</Fragment>
			);
		case "fighting": {
			const j = Math.floor(
				(item.nt || 0) *
					(Monster3Dies.animations.Monster3Dies.length - 1),
			);
			return (
				<Sprite
					anchor={0.5}
					tint={0xffffff}
					rotation={0}
					scale={1}
					blendMode={BLEND_MODES.ADD}
					texture={Monster3Dies.animations.Monster3Dies[j]}
					position={item.tmpPosition || item.position}
				/>
			);
		}
		case "preSpawning":
			return (
				<Sprite
					anchor={0.5}
					scale={item.manaPoint.scale}
					rotation={lt * 3 + item.manaPoint.offset}
					blendMode={BLEND_MODES.NORMAL}
					texture={ManaPoint}
					position={item.tmpPosition}
				/>
			);
		case "spawning":
			return (
				<>
					{visible}
					<Sprite
						anchor={0.5}
						scale={0.5}
						blendMode={BLEND_MODES.ADD}
						texture={getFrame(Spawn.animations.Spawn, 30, item.lt)}
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
	const lt = useLocalTime();
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
		case "preSpawning":
			return (
				<Sprite
					anchor={0.5}
					scale={item.manaPoint.scale}
					rotation={lt * 3 + item.manaPoint.offset}
					blendMode={BLEND_MODES.NORMAL}
					texture={ManaPoint}
					position={item.tmpPosition}
				/>
			);
		case "spawning":
			return (
				<>
					{visible}
					<Sprite
						anchor={0.5}
						scale={0.5}
						blendMode={BLEND_MODES.ADD}
						texture={getFrame(Spawn.animations.Spawn, 30, item.lt)}
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
					texture={Runes.animations.Rune[i - 1]}
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
					texture={
						ShieldHit.animations.ShieldHit[
							Math.floor(
								item.nt *
									(ShieldHit.animations.ShieldHit.length - 1),
							)
						]
					}
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

	const lt = useLocalTime();
	switch (item.state) {
		case "visible":
			return visible;
		case "preSpawning":
			return (
				<Sprite
					anchor={0.5}
					scale={item.manaPoint.scale}
					rotation={lt * 3 + item.manaPoint.offset}
					blendMode={BLEND_MODES.NORMAL}
					texture={ManaPoint}
					position={item.tmpPosition}
				/>
			);
		case "spawning":
			return (
				<>
					{visible}
					<Sprite
						anchor={0.5}
						scale={0.5}
						blendMode={BLEND_MODES.ADD}
						texture={getFrame(Spawn.animations.Spawn, 30, item.lt)}
						position={item.position}
					/>
				</>
			);
	}
	return null;
};
