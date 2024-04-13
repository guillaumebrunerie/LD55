import { Container, Sprite } from "@pixi/react";
import type { GameT as GameT, Item } from "./gameLogic";
import { CustomText } from "./CustomText";
import {
	Attack1,
	Attack2,
	Attack3,
	CloudFight,
	Defense1,
	Defense2,
	Defense3,
	Division,
	Hero,
	Mana1,
} from "./assets";
import { fightDuration } from "./configuration";

const cubicOut = (t: number) => {
	const f = t - 1.0;
	return f * f * f + 1.0;
};

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			<Sprite texture={Division} anchor={[0.5, 0]} x={1920 / 2} y={0} />
			<Container>
				<Player player={game.player} />
			</Container>
			<Container scale={[-1, 1]} x={1920}>
				<Player player={game.opponent} />
			</Container>
			<CustomText x={1920 / 2} y={100} text={game.timer.toFixed(2)} />
			<CustomText
				x={10}
				y={90}
				text={`MANA: ${game.player.mana.toFixed(0)}`}
			/>
			{game.phase == "attackFight" && (
				<Sprite
					anchor={0.5}
					x={1920 / 2}
					y={1080 / 2}
					texture={CloudFight}
					scale={cubicOut(1 - game.timer / fightDuration)}
				/>
			)}
			{game.phase == "defenseFight" && (
				<Sprite
					anchor={0.5}
					x={1920 / 2}
					y={1080 / 2}
					texture={CloudFight}
					scale={1 - cubicOut(1 - game.timer / fightDuration)}
				/>
			)}
			{game.phase == "defenseFight" && (
				<Sprite
					anchor={0.5}
					x={game.player.items.attack.length > 0 ? 1920 - 400 : 400}
					y={400}
					texture={CloudFight}
					scale={0.7 * cubicOut(1 - game.timer / fightDuration)}
				/>
			)}
			{game.phase == "finish" && (
				<Sprite
					anchor={0.5}
					x={game.player.items.attack.length > 0 ? 1920 - 400 : 400}
					y={400}
					texture={CloudFight}
					scale={0.7 * (1 - cubicOut(1 - game.timer / fightDuration))}
				/>
			)}
		</Container>
	);
};

const Player = ({ player }: { player: GameT["player"] }) => {
	return (
		<Container>
			<DefenseItems items={player.items.defense} />
			<ManaItems items={player.items.mana} />
			<AttackItems items={player.items.attack} />
			<Sprite texture={Hero} x={80} y={300} />
		</Container>
	);
};

const AttackTexture = {
	2: Attack1,
	3: Attack2,
	4: Attack3,
} as const;

const AttackItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => (
		<Sprite
			key={i}
			texture={AttackTexture[item.strength]}
			x={item.x}
			y={item.y}
		/>
	));
};

const ManaItems = ({ items }: { items: Item[] }) => {
	return items.map((item, i) => (
		<Sprite key={i} texture={Mana1} x={item.x} y={item.y} />
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
			texture={DefenseTexture[item.strength]}
			x={item.x}
			y={item.y}
		/>
	));
};
