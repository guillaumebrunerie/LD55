import { useState, useEffect, useReducer, Fragment } from "react";
import {
	ColorMatrixFilter,
	FederatedPointerEvent,
	Filter,
	SpriteMaskFilter,
	Rectangle,
	Texture,
} from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import { useButton } from "./useButton";
import { newApp, startApp, startNewGame, type AppT } from "./appLogic";
import { observable, action } from "mobx";
import { sound } from "@pixi/sound";
import {
	Bg,
	BgFront,
	BtnAttack,
	BtnDefense,
	BtnMana,
	ClickAttack,
	ClickDefense,
	ClickMana,
	Cloud1,
	Cloud2,
	Cloud3,
	InactiveSide,
	InactiveSideWhite,
	Logo,
	Moon,
	SoundOff,
	SoundOn,
	StartVsComputerDefault,
	StartVsHumanOffDefault,
	TextBox,
} from "./assets";
import { buyMonster, buyDefense, buyMushroom, type GameT } from "./gameLogic";
import { Game } from "./Game";
import { wave } from "./ease";
import type { ButtonT } from "./button";
import { GlobalTimeContext } from "./globalTimeContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { CustomText } from "./CustomText";
import type { Id } from "../convex/_generated/dataModel";
import { Rectangle as Box } from "./Rectangle";

const left = 420;
const top = 170;
const lineHeight = 80;

const hitBoxAlpha = 0.01;
const hitBoxHeight = lineHeight * 0.8;
const hitBoxWidth = 1100;

const Lobby = ({ app, onClick }: { app: AppT; onClick: () => void }) => {
	const joinGameMutation = useMutation(api.functions.joinGame);
	const createNewGameMutation = useMutation(api.functions.createNewGame);
	const availableGames = useQuery(api.functions.availableGames, {
		playerId: app.game.playerId,
	});
	// const [availableGames, setAvailableGames] =
	// 	useState<typeof availableGamesQueryResult>();
	// if (
	// 	availableGamesQueryResult &&
	// 	availableGamesQueryResult !== availableGames
	// ) {
	// 	setAvailableGames(availableGamesQueryResult);
	// }
	// console.log({ availableGames });
	return (
		<>
			<Sprite
				texture={TextBox}
				position={[1920 / 2, 1080 / 2]}
				anchor={0.5}
				eventMode="static"
			/>
			<CustomText
				text="New game"
				anchor={[0, 0.5]}
				position={{
					x: left,
					y: top,
				}}
			/>
			<Box
				x={left}
				y={top - hitBoxHeight / 2}
				width={hitBoxWidth}
				height={hitBoxHeight}
				alpha={hitBoxAlpha}
				cursor="pointer"
				eventMode="static"
				pointerdown={action(() => {
					onClick();
					void startNewGame(app, false, createNewGameMutation);
				})}
			/>
			{!availableGames && (
				<CustomText
					text="Loading…"
					anchor={[0, 0.5]}
					position={{ x: left, y: top + lineHeight }}
				/>
			)}
			{availableGames?.map(({ gameId, playerName }, i) => (
				<Fragment key={gameId}>
					<CustomText
						key={gameId}
						text={"Join " + playerName}
						anchor={[0, 0.5]}
						position={{ x: left, y: top + (i + 1) * lineHeight }}
					/>
					<Box
						x={left}
						y={top + (i + 1) * lineHeight - hitBoxHeight / 2}
						width={hitBoxWidth}
						height={hitBoxHeight}
						alpha={hitBoxAlpha}
						cursor="pointer"
						eventMode="static"
						pointerdown={action(() => {
							onClick();
							void startNewGame(app, false, async () =>
								joinGameMutation({ gameId }),
							);
						})}
					/>
				</Fragment>
			))}
		</>
	);
};

const StartButton = ({
	app,
	button,
	position,
}: {
	app: AppT;
	button: ButtonT;
	position: [number, number];
}) => {
	const [inLobby, setInLobby] = useState(false);

	if (button.alpha < 0.01) {
		return null;
	}

	return (
		<>
			{inLobby && (
				<Box
					x={0}
					y={0}
					width={1920}
					height={1080}
					alpha={hitBoxAlpha}
					cursor="pointer"
					eventMode="static"
					pointerdown={() => setInLobby(false)}
				/>
			)}
			<Sprite
				texture={StartVsComputerDefault}
				anchor={0.5}
				position={{
					x: position[0] - 200,
					y: position[1],
				}}
				alpha={button.alpha}
				hitArea={
					button.state == "idle" ?
						new Rectangle(-100, -100, 200, 200)
					:	null
				}
				cursor="pointer"
				eventMode="static"
				pointerdown={action(() => {
					setInLobby(false);
					void startNewGame(app, true, () => {
						throw new Error("Should not be called");
					});
				})}
			/>
			<Sprite
				texture={StartVsHumanOffDefault}
				anchor={0.5}
				position={{
					x: position[0] + 200,
					y: position[1],
				}}
				alpha={button.alpha}
				hitArea={
					button.state == "idle" ?
						new Rectangle(-100, -100, 200, 200)
					:	null
				}
				cursor="pointer"
				eventMode="static"
				pointerdown={() => setInLobby(true)}
			/>
			{inLobby && <Lobby app={app} onClick={() => setInLobby(false)} />}
		</>
	);
};

const useForceUpdate = () => {
	const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
	return forceUpdate;
};

const useSetVolumeAll = () => {
	const forceUpdate = useForceUpdate();
	return (setter: (volume: number) => number) => {
		sound.volumeAll = setter(sound.volumeAll);
		forceUpdate();
	};
};

const SoundButton = () => {
	const setVolumeAll = useSetVolumeAll();
	const toggleSound = () => {
		setVolumeAll((volume) => 1 - volume);
	};

	return (
		<Sprite
			texture={sound.volumeAll === 1 ? SoundOn : SoundOff}
			anchor={[1, 0]}
			x={1920 - 20}
			y={20}
			cursor="pointer"
			eventMode="static"
			pointerdown={toggleSound}
		/>
	);
};

const UIButton = ({
	button,
	onClick,
	texture,
	x,
}: {
	button: ButtonT;
	onClick: () => void;
	texture: Texture;
	x: number;
}) => {
	const enabled = button.alpha > 0.95 && button.fade < 0.05;

	return (
		<Container x={x} y={1080 - 120}>
			<Sprite
				texture={texture}
				anchor={0.5}
				cursor={enabled ? "pointer" : "auto"}
				eventMode="static"
				tint={0xffffff}
				pointerdown={enabled ? onClick : () => {}}
				alpha={button.alpha < button.fade ? 0 : 1}
			/>
			<Sprite
				texture={texture}
				anchor={0.5}
				tint={0x333333}
				alpha={button.fade * button.alpha}
			/>
		</Container>
	);
};

const UIButtons = ({ game }: { game: GameT }) => {
	const buyDefenseMutation = useMutation(api.functions.buyDefense);
	const buyMushroomMutation = useMutation(api.functions.buyMushroom);
	const buyMonsterMutation = useMutation(api.functions.buyMonster);
	return (
		<>
			<UIButton
				button={game.defenseButton}
				texture={BtnDefense}
				x={600}
				onClick={action(() => {
					void ClickDefense.play();
					void buyDefense(game, game.player, buyDefenseMutation);
				})}
			/>
			<UIButton
				button={game.manaButton}
				texture={BtnMana}
				x={960}
				onClick={action(() => {
					void ClickMana.play();
					void buyMushroom(game, game.player, buyMushroomMutation);
				})}
			/>
			<UIButton
				button={game.attackButton}
				texture={BtnAttack}
				x={1320}
				onClick={action(() => {
					void ClickAttack.play();
					void buyMonster(game, game.player, buyMonsterMutation);
				})}
			/>
		</>
	);
};

const PlayerNames = ({ playerId }: { playerId: Id<"players"> }) => {
	const playerName = useQuery(api.functions.playerName, { playerId });
	const opponentName = useQuery(api.functions.opponentName, { playerId });
	return (
		<>
			{playerName && (
				<CustomText
					text={playerName}
					position={{ x: 20, y: 1080 - 11 }}
					anchor={[0, 1]}
				/>
			)}
			{opponentName && (
				<CustomText
					text={opponentName}
					position={{ x: 1920 - 20, y: 1080 - 11 }}
					anchor={[1, 1]}
				/>
			)}
		</>
	);
};

const LogoMoon = ({
	app,
	filters = [],
	alpha = 1,
}: {
	app: AppT;
	filters?: Filter[];
	alpha?: number;
}) => {
	switch (app.state) {
		case "game":
			return (
				<Sprite
					texture={Moon}
					anchor={[0.5, 0.5]}
					x={1920 / 2}
					y={-100}
					filters={filters}
					alpha={alpha}
				/>
			);
		case "transition":
			return (
				<>
					<Sprite
						texture={Moon}
						anchor={[0.5, 0.5]}
						x={1920 / 2}
						y={300 - app.nt * 400}
						filters={filters}
						alpha={alpha}
					/>
					<Sprite
						texture={Logo}
						anchor={[0.5, 0.5]}
						x={1920 / 2}
						y={300 - app.nt * 400}
						alpha={1 - app.nt}
					/>
				</>
			);
		case "intro":
			return <Sprite texture={Logo} x={1920 / 2} y={300} anchor={0.5} />;
	}
};

const mod = (a: number, b: number) => (b + (a % b)) % b;

const filter2 = new ColorMatrixFilter();
filter2.brightness(1000, true);
filter2.matrix = [
	0,
	0,
	0,
	0,
	0x41 / 256,
	0,
	0,
	0,
	0,
	0x29 / 256,
	0,
	0,
	0,
	0,
	0x56 / 256,
	0,
	0,
	0,
	1,
	0,
];

export const App = () => {
	const [app] = useState(() => observable(newApp()));
	const { game } = app;
	useEffect(() => startApp(app), [app]);

	useEffect(() => {
		const callback = action((event: KeyboardEvent) => {
			if (event.key == "ArrowUp") {
				app.speed *= 2;
			} else if (event.key == "ArrowDown") {
				app.speed *= 1 / 2;
				if (app.speed == 0) {
					app.speed = 1 / 64;
				}
			} else if (event.key == "ArrowLeft") {
				app.speed = 0;
			} else if (event.key == "ArrowRight") {
				app.speed = 1;
			}
		});
		if (import.meta.env.DEV) {
			window.addEventListener("keydown", callback);
			return () => {
				window.removeEventListener("keydown", callback);
			};
		}
	}, [app, game.player]);

	let screenAlpha = 0;
	switch (game.curtain.state) {
		case "hidden":
			screenAlpha = 0;
			break;
		case "appearing":
			screenAlpha = wave(game.curtain.nt);
			break;
		case "disappearing":
			screenAlpha = wave(1 - game.curtain.nt);
			break;
		case "idle":
			screenAlpha = 1;
			break;
	}

	const cloud1 = {
		x: mod(21 * app.gt, 2800) - 800,
		y: 500,
	};

	const cloud2 = {
		x: mod(16 * app.gt + (2800 * 2) / 3, 2800) - 800,
		y: 200,
	};

	const cloud3 = {
		x: mod(13 * app.gt + 2800 / 3, 2800) - 800,
		y: 50,
	};

	const [filter, setFilter] = useState<Filter>();
	const filters = filter ? [filter, filter2] : [];

	return (
		<GlobalTimeContext.Provider value={app.gt}>
			<Container>
				<Sprite
					texture={Bg}
					x={0}
					y={0}
					eventMode="static"
					pointerdown={(e: FederatedPointerEvent) => {
						const { x, y } = e.global;
						console.log(`${Math.round(x)}, ${Math.round(y)}`);
					}}
				/>
				<LogoMoon app={app} />
				<Sprite texture={Cloud3} position={cloud3} />
				<Sprite texture={Cloud2} position={cloud2} />
				<Sprite texture={Cloud1} position={cloud1} />
				<Sprite texture={BgFront} x={0} y={0} />
				<Game game={game} />
				<Sprite
					texture={InactiveSideWhite}
					anchor={[1, 0]}
					x={1920}
					y={0}
					alpha={1}
					ref={(sprite) => {
						if (sprite && !filter) {
							const f = new SpriteMaskFilter(sprite);
							setFilter(f);
						}
					}}
				/>
				<Sprite
					texture={InactiveSide}
					anchor={[1, 0]}
					x={1920}
					y={0}
					alpha={screenAlpha}
				/>
				<Sprite
					texture={Cloud3}
					position={cloud3}
					filters={filters}
					alpha={screenAlpha}
				/>
				<Sprite
					texture={Cloud2}
					position={cloud2}
					filters={filters}
					alpha={screenAlpha}
				/>
				<Sprite
					texture={Cloud1}
					position={cloud1}
					filters={filters}
					alpha={screenAlpha}
				/>
				<LogoMoon app={app} filters={filters} alpha={screenAlpha} />
				<UIButtons game={game} />
				<StartButton
					app={app}
					button={game.startButton}
					position={[1920 / 2, 730]}
				/>
				{game.playerId && <PlayerNames playerId={game.playerId} />}
				<SoundButton />
				{/* <PolygonShape polygon={manaBounds.polygon} alpha={0.4} /> */}
			</Container>
		</GlobalTimeContext.Provider>
	);
};
