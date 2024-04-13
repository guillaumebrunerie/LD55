import { Container, Sprite } from "@pixi/react";
import type { GameT as GameT, Item } from "./gameLogic";
import { CustomText } from "./CustomText";
import { Attack1, Defense1, Division, Hero, Mana1 } from "./assets";

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			<Sprite texture={Division} anchor={[0.5, 0]} x={1920 / 2} y={0} />
			<DefenseItems items={game.player.items.defense} />
			<ManaItems items={game.player.items.mana} />
			<AttackItems items={game.player.items.attack} />
			<Sprite texture={Hero} x={200} y={400} />
			<CustomText x={1920 / 2} y={100} text={game.timer.toFixed(2)} />
			<CustomText
				x={10}
				y={90}
				text={`MANA: ${game.player.mana.toFixed(0)}`}
			/>
		</Container>
	);
};

const AttackItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => (
		<Sprite key={i} texture={Attack1} x={item.x} y={item.y} />
	));
};

const ManaItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => (
		<Sprite key={i} texture={Mana1} x={item.x} y={item.y} />
	));
};

const DefenseItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => (
		<Sprite key={i} texture={Defense1} x={item.x} y={item.y} />
	));
};
