import { Container, Sprite } from "@pixi/react";
import type { GameT as GameT, Item } from "./gameLogic";
import { CustomText } from "./CustomText";
import {
	Monster1,
	Monster2,
	Monster3,
	CloudFight,
	Defense1,
	Defense2,
	Defense3,
	Division,
	Hero,
	Mana1,
	Monster3Dies,
	Moon,
} from "./assets";
import { fightDuration, phase1Duration, phase2Duration } from "./configuration";
import { getFrame } from "./Animation";

const cubicOut = (t: number) => {
	const f = t - 1.0;
	return f * f * f + 1.0;
};

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
			<Sprite texture={Moon} anchor={[0.5, 0.5]} x={1920 / 2} y={-100} />
			{/* <Sprite texture={Division} anchor={[0.5, 0]} x={1920 / 2} y={0} /> */}
			<Container>
				<Player player={game.player} />
			</Container>
			<Container scale={[-1, 1]} x={1920}>
				<Player player={game.opponent} />
			</Container>
			{/* <CustomText x={1920 / 2} y={100} text={game.timer.toFixed(2)} /> */}
			{/* <CustomText */}
			{/* 	x={10} */}
			{/* 	y={90} */}
			{/* 	text={`MANA: ${game.player.mana.toFixed(0)}`} */}
			{/* /> */}
			{/* {game.phase == "attackFight" && ( */}
			{/* 	<Sprite */}
			{/* 		anchor={0.5} */}
			{/* 		x={1920 / 2} */}
			{/* 		y={1080 / 2} */}
			{/* 		texture={CloudFight} */}
			{/* 		scale={cubicOut(1 - game.timer / fightDuration)} */}
			{/* 	/> */}
			{/* )} */}
			{/* {game.phase == "defenseFight" && ( */}
			{/* 	<Sprite */}
			{/* 		anchor={0.5} */}
			{/* 		x={1920 / 2} */}
			{/* 		y={1080 / 2} */}
			{/* 		texture={CloudFight} */}
			{/* 		scale={1 - cubicOut(1 - game.timer / fightDuration)} */}
			{/* 	/> */}
			{/* )} */}
			{/* {game.phase == "defenseFight" && ( */}
			{/* 	<Sprite */}
			{/* 		anchor={0.5} */}
			{/* 		x={game.player.items.attack.length > 0 ? 1920 - 400 : 400} */}
			{/* 		y={400} */}
			{/* 		texture={CloudFight} */}
			{/* 		scale={0.7 * cubicOut(1 - game.timer / fightDuration)} */}
			{/* 	/> */}
			{/* )} */}
			{/* {game.phase == "finish" && ( */}
			{/* 	<Sprite */}
			{/* 		anchor={0.5} */}
			{/* 		x={game.player.items.attack.length > 0 ? 1920 - 400 : 400} */}
			{/* 		y={400} */}
			{/* 		texture={CloudFight} */}
			{/* 		scale={0.7 * (1 - cubicOut(1 - game.timer / fightDuration))} */}
			{/* 	/> */}
			{/* )} */}
		</Container>
	);
};

const Player = ({ player }: { player: GameT["player"] }) => {
	return (
		<Container>
			<DefenseItems items={player.items.defense} />
			<ManaItems items={player.items.mana} />
			<MonsterItems items={player.items.attack} />
			<Sprite texture={Hero} x={80} y={300} />
		</Container>
	);
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
			texture={DefenseTexture[item.strength]}
			position={item.position}
		/>
	));
};
