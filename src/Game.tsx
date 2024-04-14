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
} from "./assets";
import { BLEND_MODES } from "pixi.js";
import { Fragment } from "react/jsx-runtime";
import { CustomText } from "./CustomText";

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			<Sprite texture={Moon} anchor={[0.5, 0.5]} x={1920 / 2} y={-100} />
			<Container>
				<Player player={game.player} monsterTint={0xffffff} />
			</Container>
			<Container scale={[-1, 1]} x={1920}>
				<Player player={game.opponent} monsterTint={0xff4444} />
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
	return items.map((item, i) => {
		return (
			<Sprite
				key={i}
				anchor={0.5}
				scale={item.scale}
				blendMode={BLEND_MODES.NORMAL}
				texture={ManaPoint}
				position={item.position}
			/>
		);
	});
};

const MonsterTexture = {
	1: Monster1,
	2: Monster2,
	3: Monster3,
} as const;

const MonsterItems = ({ items, tint }: { items: Item[]; tint: number }) => {
	return items.map((item, i) => {
		switch (item.state) {
			case "visible":
				return (
					<Fragment key={i}>
						<Sprite
							anchor={0.5}
							tint={tint}
							blendMode={BLEND_MODES.NORMAL}
							// blendMode={BLEND_MODES.NORMAL}
							texture={MonsterTexture[item.strength]}
							position={item.tmpPosition || item.position}
						/>
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
						key={i}
						anchor={0.5}
						tint={0xffffff}
						blendMode={BLEND_MODES.ADD}
						texture={Monster3Dies.animations.Monster3Dies[j]}
						position={item.tmpPosition || item.position}
					/>
				);
			}
		}
		return null;
	});
};

const ManaItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => (
		<Sprite key={i} texture={Mana1} anchor={0.5} position={item.position} />
	));
};

const DefenseItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => {
		return (
			<Fragment key={i}>
				{i > 0 && (
					<Sprite
						key={i}
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
										(ShieldHit.animations.ShieldHit.length -
											1),
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
			</Fragment>
		);
	});
};
