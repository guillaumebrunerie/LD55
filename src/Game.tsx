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
import { Texture } from "pixi.js";
import { getFrame, getNtFrame } from "./Animation";
import { useGlobalTime } from "./useGlobalTime";
import { wave } from "./ease";
import { opponentFilter, opponentFilterAdd } from "./filters";
import type { Shield } from "./shield";
import type { Rune } from "./rune";
import type { Mushroom } from "./mushroom";
import type { Monster } from "./monster";
import type { Mana } from "./mana";
import type { Wizard } from "./wizard";
import type { Player } from "./player";
import type { Game } from "./game";

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

export const GameC = ({ game }: { game: Game }) => {
	return (
		<container>
			<container scale={{ x: -1, y: 1 }} x={1920}>
				<PlayerC
					game={game}
					player={game.opponent}
					monsterTint={0xffff00}
				/>
			</container>
			<container>
				<PlayerC
					game={game}
					player={game.player}
					monsterTint={0xffffff}
				/>
			</container>
		</container>
	);
};

export const WizardC = ({
	game,
	player,
	wizard,
}: {
	game: Game;
	player: Player;
	wizard: Wizard;
}) => {
	const props = {
		x: -15,
		y: 230,
		blendMode: "normal" as const,
		filters: player == game.opponent ? [opponentFilter] : [],
	};

	const { state, nt = 0 } = wizard.getState();

	const transition = (animation: Texture[], props2 = {}) => {
		return (
			<sprite
				texture={getNtFrame(animation, nt)}
				{...props}
				{...props2}
			/>
		);
	};
	const looping = (animation: Texture[], fps = 20, props2 = {}) => {
		return (
			<sprite
				texture={getFrame(animation, fps, wizard.lt)}
				{...props}
				{...props2}
			/>
		);
	};

	switch (state) {
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
			const addMode = nt <= 14 / 23;
			return transition(WizardAppear, {
				blendMode: addMode ? "add" : "normal",
				filters:
					player == game.opponent ?
						[addMode ? opponentFilterAdd : opponentFilter]
					:	[],
			});
		}
		case ">die":
			return transition(WizardDie, { x: -80, y: 170 });
		case ">disappear":
			return looping(WizardIdle, 10, { alpha: 1 - nt });
		case "hidden":
			break;
		default:
			console.error("Unhandled state: ", state);
	}
};

const PlayerC = ({
	game,
	player,
	monsterTint,
}: {
	game: Game;
	player: Player;
	monsterTint: number;
}) => {
	return (
		<container>
			<WizardC game={game} player={player} wizard={player.wizard} />
			<ShieldC shield={player.protection.shield} />
			<Runes runes={player.protection.runes.entities} />
			<Mushrooms items={player.mushrooms.entities} />
			<ManaPoints items={player.manaPoints.entities} />
			<Monsters items={player.monsters.entities} tint={monsterTint} />
		</container>
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
	switch (item.state) {
		case "anticipating": {
			const dx = (Math.random() - 0.5) * 20;
			const dy = (Math.random() - 0.5) * 20;
			return (
				<sprite
					anchor={0.5}
					scale={item.scale}
					rotation={item.lt * item.rotationSpeed + item.offset}
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
				<sprite
					anchor={0.5}
					scale={item.scale}
					rotation={item.lt * item.rotationSpeed + item.offset}
					texture={ManaPoint}
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
				<sprite
					anchor={0.5}
					scale={{ x: scaleX, y: scaleY }}
					rotation={angle + Math.PI / 2}
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
				<sprite
					anchor={0.5}
					scale={0.5}
					blendMode={"add"}
					texture={getNtFrame(Spawn, item.nt)}
					position={item.position}
				/>
			);
		case "spawning": {
			return (
				<>
					<sprite
						anchor={0.5}
						scale={item.scale}
						rotation={item.lt * item.rotationSpeed + item.offset}
						texture={getNtFrame(ManaPointStart, item.nt)}
						position={item.position}
					/>
				</>
			);
		}
	}
};

const Monsters = ({ items, tint }: { items: Monster[]; tint: number }) => {
	return items.map((item, i) => <MonsterC key={i} item={item} tint={tint} />);
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

const MonsterC = ({ item, tint }: { item: Monster; tint: number }) => {
	const gt = useGlobalTime();
	const visible = (
		<sprite
			anchor={0.5}
			tint={tint}
			rotation={0}
			scale={1}
			blendMode={"add"}
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
				<sprite
					anchor={0.5}
					tint={tint}
					rotation={0}
					scale={1}
					blendMode={"add"}
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
				<sprite
					anchor={0.5}
					tint={tint}
					rotation={0}
					scale={1}
					blendMode={"add"}
					texture={getNtFrame(MonsterDie[item.strength], item.nt)}
					position={item.position}
				/>
			);
		}
		case "winning":
			return (
				<sprite
					anchor={0.5}
					tint={tint}
					rotation={0}
					scale={1}
					blendMode={"add"}
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
		.map((item, i) => <MushroomC key={i} item={item} />);
};

const ManaTexture = {
	1: Mana1,
	2: Mana2,
} as const;

const MushroomC = ({ item }: { item: Mushroom }) => {
	if (item.nt == 0) {
		return null;
	}
	const texture =
		item.nt == 1 ?
			ManaTexture[item.strength]
		:	getNtFrame(manaEndAnimations[item.strength], 1 - item.nt);
	return <sprite texture={texture} anchor={0.5} position={item.position} />;
};

const Runes = ({ runes: items }: { runes: Rune[] }) => {
	return items.map((item, i) => <RuneC key={i} item={item} i={i} />);
};

const RuneC = ({ item, i }: { item: Rune; i: number }) => {
	return (
		<sprite
			texture={RunesSheet.animations.Rune[i + 1]}
			alpha={item.nt}
			x={-14}
			y={613}
		/>
	);
};

const ShieldC = ({ shield }: { shield: Shield }) => {
	switch (shield.state) {
		case "hidden":
		case "waitingToAppear":
			return null;

		case "fadeOut":
			return (
				<>
					<sprite
						texture={RunesSheet.animations.Rune[0]}
						alpha={shield.nt}
						position={{ x: -14, y: 613 }}
					/>
					<sprite
						texture={ShieldLoop}
						blendMode={"add"}
						position={{ x: 18, y: -70 }}
						scale={2}
						alpha={shield.nt}
					/>
				</>
			);

		case "appearing":
			return (
				<>
					<sprite
						texture={RunesSheet.animations.Rune[0]}
						alpha={shield.nt}
						position={{ x: -14, y: 613 }}
					/>
					<sprite
						texture={getNtFrame(ShieldStart, shield.nt)}
						blendMode={"add"}
						position={{ x: -270, y: -149 }}
						scale={2}
					/>
				</>
			);

		case "disappearing":
			return (
				<>
					<sprite
						texture={RunesSheet.animations.Rune[0]}
						alpha={1 - shield.nt}
						position={{ x: -14, y: 613 }}
					/>
					<sprite
						texture={getNtFrame(ShieldEnd, shield.nt)}
						blendMode={"add"}
						position={{ x: -270, y: -149 }}
						scale={2}
					/>
				</>
			);

		case "visible":
			return (
				<>
					<sprite
						texture={RunesSheet.animations.Rune[0]}
						position={{ x: -14, y: 613 }}
					/>
					<sprite
						texture={ShieldLoop}
						blendMode={"add"}
						position={{ x: 18, y: -70 }}
						scale={2}
					/>
				</>
			);

		case "fighting":
			return (
				<>
					<sprite
						texture={RunesSheet.animations.Rune[0]}
						position={{ x: -14, y: 613 }}
					/>
					<sprite
						texture={ShieldLoop}
						blendMode={"add"}
						position={{ x: 18, y: -70 }}
						scale={2}
					/>
					<sprite
						texture={getNtFrame(ShieldHit, shield.nt)}
						blendMode={"add"}
						position={{ x: 18, y: -70 }}
						anchor={0}
						scale={2}
					/>
				</>
			);
	}
};
