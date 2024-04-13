import { Container, Sprite } from "@pixi/react";
import type { GameT as GameT, Item } from "./gameLogic";
import {
	Monster1,
	Monster2,
	Monster3,
	Defense1,
	Defense2,
	Defense3,
	Hero,
	Mana1,
	Monster3Dies,
	Moon,
	ManaPoint,
	Runes,
} from "./assets";

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			<Sprite texture={Moon} anchor={[0.5, 0.5]} x={1920 / 2} y={-100} />
			<Container>
				<Player player={game.player} />
			</Container>
			<Container scale={[-1, 1]} x={1920}>
				<Player player={game.opponent} />
			</Container>
		</Container>
	);
};

const Player = ({ player }: { player: GameT["player"] }) => {
	return (
		<Container>
			<ManaPoints items={player.mana} />
			<DefenseItems items={player.items.defense} />
			<ManaItems items={player.items.mana} />
			<MonsterItems items={player.items.attack} />
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

const MonsterItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => {
		switch (item.state) {
			case "visible":
				return (
					<Sprite
						key={i}
						anchor={0.5}
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
		<Sprite key={i} texture={Mana1} position={item.position} />
	));
};

const DefenseTexture = {
	2: Defense1,
	3: Defense2,
	4: Defense3,
} as const;

const DefenseItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => (
		<Sprite
			key={i}
			texture={Runes.animations.Rune[i]}
			anchor={0}
			position={[-14, 612]}
		/>
	));
};
