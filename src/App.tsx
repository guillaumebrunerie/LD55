import { useState, useEffect, useReducer, Fragment } from "react";
import {
	FederatedPointerEvent,
	Filter,
	SpriteMaskFilter,
	Rectangle,
	Texture,
} from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import {
	newApp,
	startApp,
	startNewGameAgainstPlayer,
	startNewGameAgainstComputer,
	type AppT,
} from "./appLogic";
import { observable, action, runInAction } from "mobx";
import { sound } from "@pixi/sound";
import {
	Bg,
	BgFront,
	BtnAttack,
	BtnAttackOn,
	BtnDefense,
	BtnDefenseOn,
	BtnMana,
	BtnManaOn,
	ClickStart,
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
	TextBoxAppear,
} from "./assets";
import { buyMonster, buyDefense, buyMushroom, type GameT } from "./gameLogic";
import { Game, Wizard } from "./Game";
import { wave } from "./ease";
import { appearButton, disappearButton, type ButtonT } from "./button";
import { GlobalTimeContext } from "./globalTimeContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { CustomText } from "./CustomText";
import type { Id } from "../convex/_generated/dataModel";
import { Rectangle as Box } from "./Rectangle";
import { darkFilter } from "./filters";

const left = 420;
const top = 170;
const lineHeight = 80;

const hitBoxAlpha = 0.01;
const hitBoxHeight = lineHeight * 0.8;
const hitBoxWidth = 1100;

const Lobby = ({ app }: { app: AppT }) => {
	const createNewPlayer = useMutation(api.lobby.createNewPlayer);
	useEffect(() => {
		if (!app.game.playerId) {
			createNewPlayer()
				.then(({ id, token }) => {
					runInAction(() => {
						app.game.playerId = id;
						app.game.token = token;
					});
				})
				.catch(() => {
					console.error("Could not create new player");
				});
		}
	}, [app, createNewPlayer]);

	const { playerId, token, opponentId } = app.game;

	const gameId = useQuery(api.player.currentGameId, { playerId });
	useEffect(() => {
		if (gameId) {
			runInAction(() => {
				startNewGameAgainstPlayer(app, gameId);
			});
		}
	}, [gameId, app]);

	const availablePlayers = useQuery(api.lobby.availablePlayers);
	const requestPlay = useMutation(api.lobby.requestPlay);
	const players =
		(playerId &&
			availablePlayers
				?.filter(({ id }) => id !== app.game.playerId)
				.map(({ id, name, opponentId: theirOpponentId }) => {
					return {
						id,
						name,
						type:
							id == opponentId ? ("waiting" as const)
							: theirOpponentId == playerId ?
								("requested" as const)
							:	("default" as const),
					};
				})) ||
		[];
	return (
		<Container position={{ x: 0, y: -(1 - app.game.lobby.alpha) * 1000 }}>
			<Sprite
				texture={TextBox}
				position={[1920 / 2, 1080 / 2]}
				anchor={0.5}
				eventMode="static"
			/>
			{!availablePlayers && (
				<CustomText
					text="Loading…"
					anchor={[0, 0.5]}
					position={{ x: left, y: top + lineHeight }}
				/>
			)}
			{players.map(({ id, name, type }, i) => (
				<Fragment key={id}>
					<CustomText
						text={
							name +
							{
								waiting: " (waiting)",
								requested: " (wants to play)",
								default: "",
							}[type]
						}
						anchor={[0, 0.5]}
						position={{
							x: left,
							y: top + (i + 1) * lineHeight,
						}}
						color={
							{
								waiting: "white",
								requested: "lightblue",
								default: "grey",
							}[type]
						}
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
							void ClickStart.play();
							if (!playerId || !token) {
								return;
							}
							if (app.game.opponentId == id) {
								app.game.opponentId = undefined;
							} else {
								app.game.opponentId = id;
							}
							void requestPlay({
								playerId,
								token,
								opponentId: id,
							});
						})}
					/>
				</Fragment>
			))}
		</Container>
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
	const inLobby = app.game.lobby.alpha > 0.01;

	const disconnect = useMutation(api.lobby.disconnect);

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
					pointerdown={action(() => {
						disappearButton(app.game.lobby);
						const { playerId, token } = app.game;
						if (playerId && token) {
							void disconnect({ playerId, token });
							console.log("DISCONNECTING");
							app.game.playerId = undefined;
							app.game.token = undefined;
							app.game.opponentId = undefined;
						}
						void ClickStart.play();
						void TextBoxAppear.play();
					})}
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
					disappearButton(app.game.lobby);
					void ClickStart.play();
					startNewGameAgainstComputer(app);
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
				pointerdown={action(() => {
					void ClickStart.play();
					void TextBoxAppear.play();
					appearButton(app.game.lobby);
				})}
			/>
			{inLobby && <Lobby app={app} />}
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
	textureOff,
	textureOn,
	x,
}: {
	button: ButtonT;
	onClick: () => void;
	textureOff: Texture;
	textureOn: Texture;
	x: number;
}) => {
	const enabled = button.alpha > 0.95 && button.fade < 0.05;
	const [isPressed, setIsPressed] = useState(false);

	return (
		<Container x={x} y={1080 - 120}>
			<Sprite
				texture={isPressed ? textureOn : textureOff}
				anchor={0.5}
				cursor={enabled ? "pointer" : "auto"}
				eventMode="static"
				tint={0xffffff}
				pointerup={() => {
					setIsPressed(false);
				}}
				pointerdown={() => {
					if (enabled) {
						onClick();
						setIsPressed(true);
					}
				}}
				alpha={button.alpha < button.fade ? 0 : 1}
			/>
			<Sprite
				texture={isPressed ? textureOn : textureOff}
				anchor={0.5}
				tint={0x333333}
				alpha={button.fade * button.alpha}
			/>
		</Container>
	);
};

const UIButtons = ({ game }: { game: GameT }) => {
	const buyDefenseMutation = useMutation(api.player.buyDefense);
	const buyMushroomMutation = useMutation(api.player.buyMushroom);
	const buyMonsterMutation = useMutation(api.player.buyMonster);
	return (
		<>
			<UIButton
				button={game.defenseButton}
				textureOn={BtnDefenseOn}
				textureOff={BtnDefense}
				x={600}
				onClick={action(() => {
					void ClickStart.play();
					void buyDefense(game, game.player, buyDefenseMutation);
				})}
			/>
			<UIButton
				button={game.manaButton}
				textureOn={BtnManaOn}
				textureOff={BtnMana}
				x={960}
				onClick={action(() => {
					void ClickStart.play();
					void buyMushroom(game, game.player, buyMushroomMutation);
				})}
			/>
			<UIButton
				button={game.attackButton}
				textureOn={BtnAttackOn}
				textureOff={BtnAttack}
				x={1320}
				onClick={action(() => {
					void ClickStart.play();
					void buyMonster(game, game.player, buyMonsterMutation);
				})}
			/>
		</>
	);
};

const PlayerName = ({ playerId }: { playerId: Id<"players"> }) => {
	const playerName = useQuery(api.player.playerName, { playerId });
	return (
		playerName && (
			<CustomText
				text={playerName}
				position={{ x: 20, y: 1080 - 11 }}
				anchor={[0, 1]}
			/>
		)
	);
};

const OpponentName = ({ playerId }: { playerId: Id<"players"> }) => {
	const playerName = useQuery(api.player.playerName, { playerId });
	return (
		playerName && (
			<CustomText
				text={playerName}
				position={{ x: 1920 - 20, y: 1080 - 11 }}
				anchor={[1, 1]}
			/>
		)
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
	const filters = filter ? [filter, darkFilter] : [];

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
				<Container
					scale={[-1, 1]}
					x={1920}
					filters={[darkFilter]}
					alpha={screenAlpha}
				>
					<Wizard
						game={game}
						player={game.opponent}
						wizard={game.opponent.wizard}
					/>
				</Container>
				<LogoMoon app={app} filters={filters} alpha={screenAlpha} />
				<UIButtons game={game} />
				<StartButton
					app={app}
					button={game.startButton}
					position={[1920 / 2, 730]}
				/>
				{game.playerId && <PlayerName playerId={game.playerId} />}
				{game.opponentId && <OpponentName playerId={game.opponentId} />}
				<SoundButton />
				{/* <PolygonShape polygon={manaBounds.polygon} alpha={0.4} /> */}
			</Container>
		</GlobalTimeContext.Provider>
	);
};
