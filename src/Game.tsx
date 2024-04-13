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
} from "./assets";
import { BLEND_MODES } from "pixi.js";
import { Fragment } from "react/jsx-runtime";
import { getFrame } from "./Animation";

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			<Sprite texture={Moon} anchor={[0.5, 0.5]} x={1920 / 2} y={-100} />
			<Container>
				<Player player={game.player} monsterTint={0xffffff} />
			</Container>
			<Container scale={[-1, 1]} x={1920}>
				<Player
					player={game.opponent}
					flipRunes
					monsterTint={0xff4444}
				/>
			</Container>
		</Container>
	);
};

const Player = ({
	player,
	flipRunes,
	monsterTint,
}: {
	player: GameT["player"];
	flipRunes?: boolean;
	monsterTint: number;
}) => {
	return (
		<Container>
			<ManaPoints items={player.mana} />
			<Container scale={flipRunes ? [-1, 1] : 1} x={flipRunes ? 456 : 0}>
				<DefenseItems
					items={player.items.defense}
					flipRunes={flipRunes}
				/>
			</Container>
			<ManaItems items={player.items.mana} />
			<MonsterItems items={player.items.attack} tint={monsterTint} />
			<Sprite texture={Hero} x={180} y={290} />
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
	2: Monster1,
	3: Monster2,
	4: Monster3,
} as const;

const MonsterItems = ({ items, tint }: { items: Item[]; tint: number }) => {
	return items.map((item, i) => {
		switch (item.state) {
			case "visible":
				return (
					<Sprite
						key={i}
						anchor={0.5}
						tint={tint}
						blendMode={BLEND_MODES.NORMAL}
						// blendMode={BLEND_MODES.NORMAL}
						texture={MonsterTexture[item.strength]}
						position={item.tmpPosition || item.position}
					/>
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

const DefenseItems = ({
	items,
	flipRunes,
}: {
	items: Item[];
	flipRunes: boolean;
}) => {
	return items.map((item, i) => {
		return (
			<Fragment key={i}>
				<Sprite
					key={i}
					texture={Runes.animations.Rune[i]}
					anchor={0}
					position={[-14, 613]}
				/>
				{i == 0 && (
					<Sprite
						texture={ShieldLoop}
						blendMode={BLEND_MODES.ADD}
						position={[18, -70]}
						anchor={0}
						scale={2}
					/>
				)}
				{item.state == "fighting" && (
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
						anchor={flipRunes ? [1, 0] : 0}
						scale={flipRunes ? [-2, 2] : 2}
					/>
				)}
			</Fragment>
		);
	});
};
