import { Container, Sprite } from "@pixi/react";
import {
	type GameT as GameT,
	type Mana,
	type Monster,
	type Rune,
	type Mushroom,
	type Player,
	type Shield,
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
	Monster1Reacts,
	Monster2Reacts,
	Monster3Reacts,
	WizardWin,
	ShieldStart,
	ShieldEnd,
	WizardWaitingStart,
	WizardWaitingEnd,
	WizardWaitingLoop,
} from "./assets";
import { BLEND_MODES, Texture } from "pixi.js";
import { getFrame, getNtFrame } from "./Animation";
import type { WizardT } from "./wizard";
import { useGlobalTime } from "./useGlobalTime";
import { wave } from "./ease";
import { opponentFilter, opponentFilterAdd } from "./filters";

// const DisconnectOnClose = ({ game }: { game: GameT }) => {
// 	// Disconnect on close
// 	const disconnect = useMutation(api.lobby.disconnect);
// 	useEffect(() => {
// 		const listener = () => {
// 			const { credentials } = game;
// 			if (credentials) {
// 				void disconnect(credentials);
// 			} else {
// 				console.error("No credentials");
// 			}
// 		};
// 		window.addEventListener("pagehide", listener);
// 		return () => {
// 			window.removeEventListener("pagehide", listener);
// 		};
// 	}, [disconnect, game]);
// 	return null;
// };

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container>
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

export const Wizard = ({
	game,
	player,
	wizard,
}: {
	game: GameT;
	player: Player;
	wizard: WizardT;
}) => {
	const props = {
		x: -15,
		y: 230,
		blendMode: BLEND_MODES.NORMAL,
		filters: player == game.opponent ? [opponentFilter] : [],
	};

	const transition = (animation: Texture[], props2 = {}) => {
		return (
			<Sprite
				texture={getNtFrame(animation, wizard.nt)}
				{...props}
				{...props2}
			/>
		);
	};
	const looping = (animation: Texture[], fps = 20, time = wizard.lt) => {
		return <Sprite texture={getFrame(animation, fps, time)} {...props} />;
	};

	switch (wizard.state) {
		case "idle":
			return looping(WizardIdle, 10);
		case "win":
			return looping(WizardWin, 21);
		case ">magicStart":
			return transition(WizardMagicStart);
		case "magicLoop":
			return looping(WizardMagicLoop, 20);
		case ">magicEnd":
			return transition(WizardMagicEnd);
		case ">waitingStart":
			return transition(WizardWaitingStart);
		case "waitingLoop":
			return looping(WizardWaitingLoop, 20);
		case ">waitingEnd":
			return transition(WizardWaitingEnd);
		case ">appear": {
			const addMode = wizard.nt <= 14 / 23;
			return transition(WizardAppear, {
				blendMode: addMode ? BLEND_MODES.ADD : BLEND_MODES.NORMAL,
				filters:
					player == game.opponent ?
						[addMode ? opponentFilterAdd : opponentFilter]
					:	[],
			});
		}
		case ">die":
			return transition(WizardDie, { x: -80, y: 170 });
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
			<Wizard game={game} player={player} wizard={player.wizard} />
			<Shield shield={player.protection.shield} />
			<Runes runes={player.protection.runes} />
			<Mushrooms items={player.mushrooms} />
			<ManaPoints items={player.manaPoints} />
			<MonsterItems items={player.monsters} tint={monsterTint} />
		</Container>
	);
};

export const ManaPoints = ({ items }: { items: Mana[] }) => {
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
					alpha={1}
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
					rotation={lt * item.rotationSpeed + item.offset}
					blendMode={BLEND_MODES.NORMAL}
					texture={ManaPoint}
					alpha={1}
					position={item.position}
				/>
			);
		case "traveling": {
			if (!item.prevPosition) {
				console.error("No prevPosition in traveling");
				return null;
			}
			const dx = item.prevPosition.x - item.position.x;
			const dy = item.prevPosition.y - item.position.y;
			const angle = Math.atan2(dy, dx);
			const scaleX = item.scale;
			const scaleY = Math.min(1, 5 * (0.5 - Math.abs(0.5 - item.nt)));
			return (
				<Sprite
					anchor={0.5}
					scale={[scaleX, scaleY]}
					rotation={angle + Math.PI / 2}
					blendMode={BLEND_MODES.NORMAL}
					alpha={Math.min(item.nt * 3, 1)}
					texture={ManaPointBlurred}
					x={
						item.prevPosition.x * (1 - item.nt) +
						item.position.x * item.nt
					}
					y={
						item.prevPosition.y * (1 - item.nt) +
						item.position.y * item.nt
					}
				/>
			);
		}
		case "spawningOut":
			return (
				<Sprite
					anchor={0.5}
					scale={0.5}
					blendMode={BLEND_MODES.ADD}
					texture={getFrame(Spawn, 30, item.lt)}
					alpha={1}
					position={item.position}
				/>
			);
		case "spawning": {
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

const MonsterReacts = {
	1: Monster1Reacts,
	2: Monster2Reacts,
	3: Monster3Reacts,
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
			const nt =
				item.finalApproach ? Math.pow(item.nt, 3) : wave(item.nt);
			const texture =
				item.finalApproach ?
					getNtFrame(MonsterReacts[item.strength], 0.5)
				:	getFrame(MonsterIdle[item.strength], 20, gt);
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
					texture={texture}
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
					texture={getNtFrame(MonsterDie[item.strength], item.nt)}
					position={item.position}
				/>
			);
		}
		case "winning":
			return (
				<Sprite
					anchor={0.5}
					tint={tint}
					rotation={0}
					scale={1}
					blendMode={BLEND_MODES.ADD}
					texture={getNtFrame(
						MonsterReacts[item.strength],
						item.nt / 2,
					)}
					position={item.position}
				/>
			);
	}
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
	switch (item.state) {
		case "visible":
			return (
				<Sprite
					texture={ManaTexture[item.strength]}
					rotation={0}
					blendMode={BLEND_MODES.NORMAL}
					scale={1}
					anchor={0.5}
					position={item.position}
				/>
			);
		case "disappearing":
			return (
				<Sprite
					anchor={0.5}
					scale={1}
					rotation={0}
					blendMode={BLEND_MODES.NORMAL}
					texture={getNtFrame(
						manaEndAnimations[item.strength],
						item.nt,
					)}
					position={item.position}
				/>
			);
	}
	return null;
};

const Runes = ({ runes: items }: { runes: Rune[] }) => {
	return items.map((item, i) => <RuneC key={i} item={item} i={i} />);
};

const RuneC = ({ item, i }: { item: Rune; i: number }) => {
	switch (item.state) {
		case "appearing":
			return (
				<Sprite
					texture={RunesSheet.animations.Rune[i + 1]}
					anchor={0}
					rotation={0}
					scale={1}
					alpha={Math.min(item.nt * 2, 1)}
					position={[-14, 613]}
				/>
			);

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
			return (
				<Sprite
					texture={RunesSheet.animations.Rune[i + 1]}
					anchor={0}
					rotation={0}
					scale={1}
					alpha={1}
					position={[-14, 613]}
				/>
			);
	}
};

const Shield = ({ shield }: { shield: Shield }) => {
	switch (shield.state) {
		case "hidden":
		case "waitingToAppear":
			return null;

		case "fadeOut":
			return (
				<>
					<Sprite
						texture={RunesSheet.animations.Rune[0]}
						anchor={0}
						rotation={0}
						scale={1}
						alpha={1 - shield.nt}
						blendMode={BLEND_MODES.NORMAL}
						position={[-14, 613]}
					/>
					<Sprite
						texture={ShieldLoop}
						blendMode={BLEND_MODES.ADD}
						position={[18, -70]}
						anchor={0}
						scale={2}
						alpha={1 - shield.nt}
					/>
				</>
			);

		case "appearing":
			return (
				<>
					<Sprite
						texture={RunesSheet.animations.Rune[0]}
						anchor={0}
						rotation={0}
						scale={1}
						alpha={shield.nt}
						blendMode={BLEND_MODES.NORMAL}
						position={[-14, 613]}
					/>
					<Sprite
						texture={getNtFrame(ShieldStart, shield.nt)}
						blendMode={BLEND_MODES.ADD}
						position={[-270, -149]}
						anchor={0}
						scale={2}
					/>
				</>
			);

		case "disappearing":
			return (
				<>
					<Sprite
						texture={RunesSheet.animations.Rune[0]}
						anchor={0}
						rotation={0}
						scale={1}
						alpha={1 - shield.nt}
						blendMode={BLEND_MODES.NORMAL}
						position={[-14, 613]}
					/>
					<Sprite
						texture={getNtFrame(ShieldEnd, shield.nt)}
						blendMode={BLEND_MODES.ADD}
						position={[-270, -149]}
						anchor={0}
						scale={2}
					/>
				</>
			);

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
};
