import { useState, useEffect, useReducer, type ComponentProps } from "react";
import {
	type FederatedPointerEvent,
	Filter,
	Rectangle,
	Sprite,
	Texture,
} from "pixi.js";
import {
	startNewGameAgainstPlayer,
	startNewGameAgainstComputer,
	type AppT,
	type Credentials,
	newApp,
	startApp,
} from "./appLogic";
import { action, observable, runInAction } from "mobx";
import { sound } from "@pixi/sound";
import {
	ArrowDown,
	ArrowUp,
	BackToMenuDefault,
	BackToMenuDefaultLeft,
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
	ExitGameBtn,
	InactiveSide,
	InactiveSideWhite,
	InviteButtonAccept,
	InviteButtonDefault,
	InviteButtonOn,
	LogoStart,
	Moon,
	PoofedAwayPost,
	RestartBtnDefault,
	RestartButtonComputer,
	SettingsBoxDefault,
	SettingsDefault,
	SettingsOn,
	SoundOffTxt,
	SoundOnTxt,
	StartVsComputerDefault,
	StartVsHumanOffDefault,
	TextBox,
	TextBoxAppear,
	WaitingDot,
} from "./assets";
import {
	buyMonster,
	buyDefense,
	buyMushroom,
	setupFight,
	resetGame,
} from "./gameLogic";
import { Game, Wizard } from "./Game";
import { wave } from "./ease";
import { Button } from "./button";
import { GlobalTimeContext } from "./globalTimeContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { CustomText } from "./CustomText";
import type { Id } from "../convex/_generated/dataModel";
import { Rectangle as Box } from "./Rectangle";
import { darkFilter } from "./filters";
import { useInterval } from "usehooks-ts";
import { Circle } from "./Circle";
import { getFrame, getNtFrame } from "./Animation";
import { useButton } from "./useButton";
import { Logo } from "./logo";
import { useDateNow } from "./useDateNow";

const left = 420;
const top = 105;
const lineHeight = 80;

const WaitingDots = ({ lt }: { lt: number }) => {
	const delay = 0.4;
	const dotsCount = Math.round(lt / delay) % 4;
	return Array(dotsCount)
		.fill(true)
		.map((_, i) => {
			return (
				<sprite key={i} texture={WaitingDot} x={-25 + i * 25} y={2} />
			);
		});
};

const OnlineDot = ({
	timeSinceLastPing,
	...props
}: {
	timeSinceLastPing: number;
	x: number;
	y: number;
}) => {
	let color = 0x00ff00;
	if (timeSinceLastPing > 15_000) {
		color = 0xff0000;
	} else if (timeSinceLastPing > 2_000) {
		color = 0xffff44;
	}

	return <Circle {...props} radius={8} color={color} />;
};

const PlayerLine = ({
	app,
	id,
	name,
	type,
	timeSinceLastPing,
}: {
	app: AppT;
	id: Id<"players">;
	name: string;
	type: "waiting" | "requested" | "default";
	timeSinceLastPing: number;
}) => {
	const requestPlay = useMutation(api.lobby.requestPlay);
	const [x, setX] = useState(0);
	const { credentials } = app;
	const icon = {
		default: InviteButtonDefault,
		waiting: InviteButtonOn,
		requested: InviteButtonAccept,
	}[type];
	return (
		<>
			<CustomText
				myRef={(node) => {
					if (node) {
						setX(node.width);
					}
				}}
				text={name}
				anchor={{ x: 0, y: 0.5 }}
				color={
					{
						waiting: "white",
						requested: "white",
						default: "grey",
					}[type]
				}
			/>
			<OnlineDot x={-20} y={5} timeSinceLastPing={timeSinceLastPing} />
			<container x={x + (icon.width * 0.75) / 2 + 15} y={5}>
				<sprite
					texture={icon}
					scale={
						type === "requested" ?
							0.75 + Math.sin(app.lt * 6) * 0.02
						:	0.75
					}
					anchor={0.5}
					cursor="pointer"
					eventMode="static"
					onPointerDown={action(() => {
						void ClickStart.play();
						if (!credentials) {
							return;
						}
						if (app.opponentId == id) {
							app.opponentId = undefined;
						} else {
							app.opponentId = id;
						}
						void requestPlay({
							...credentials,
							opponentId: id,
						});
					})}
				/>
				{type === "waiting" && <WaitingDots lt={app.lt} />}
			</container>
		</>
	);
};

const clickOutsideLobby = (
	app: AppT,
	disconnect: (credentials: Credentials) => Promise<null>,
) => {
	app.lobby.disappear();
	const { credentials } = app;
	if (credentials) {
		void disconnect(credentials);
		delete app.credentials;
		app.opponentId = undefined;
	}
	void ClickStart.play();
	void TextBoxAppear.play();
};

const Lobby = ({ app }: { app: AppT }) => {
	const { credentials, opponentId } = app;

	const gameId = useQuery(api.player.currentGameId, {
		playerId: credentials?.playerId,
	});
	useEffect(() => {
		if (gameId) {
			runInAction(() => {
				startNewGameAgainstPlayer(app, gameId);
			});
		}
	}, [gameId, app]);

	const availablePlayers = useQuery(api.lobby.availablePlayers);
	const players =
		(credentials &&
			availablePlayers
				?.filter(({ id }) => id !== credentials.playerId)
				.map(({ id, name, opponentId: theirOpponentId, lastPing }) => {
					return {
						id,
						name,
						type:
							id == opponentId ? ("waiting" as const)
							: theirOpponentId == credentials.playerId ?
								("requested" as const)
							:	("default" as const),
						timeSinceLastPing: Date.now() - lastPing,
					};
				})) ||
		[];
	// Put players that requested to play at the top, but creates layout shifts.
	// players.sort((a, b) => {
	// 	if (a.type == "requested" && b.type !== "requested") {
	// 		return -1;
	// 	} else if (a.type !== "requested" && b.type == "requested") {
	// 		return 1;
	// 	} else {
	// 		return 0;
	// 	}
	// });

	const PLAYERS_PER_PAGE = 10;
	const [page, setPage] = useState(0);
	const visiblePlayers = players.slice(
		page * PLAYERS_PER_PAGE,
		(page + 1) * PLAYERS_PER_PAGE,
	);
	const hasPrevPage = page > 0;
	const hasNextPage = players.length > (page + 1) * PLAYERS_PER_PAGE;

	const disconnect = useMutation(api.lobby.disconnect);

	return (
		<>
			<Box
				draw={() => {}}
				x={0}
				y={0}
				width={1920}
				height={1080}
				alpha={app.lobby.alpha.value * 0.5}
				cursor="pointer"
				eventMode="static"
				onPointerDown={action(() => {
					clickOutsideLobby(app, disconnect);
				})}
			/>
			<container
				position={{ x: 0, y: -(1 - app.lobby.alpha.value) * 1000 }}
			>
				<sprite
					texture={TextBox}
					x={1920 / 2}
					y={1080 / 2}
					anchor={0.5}
					eventMode="static"
				/>
				{!availablePlayers && (
					<CustomText
						text="Loading…"
						anchor={{ x: 0, y: 0.5 }}
						position={{ x: left, y: top + lineHeight }}
					/>
				)}
				{players.length == 0 && (
					<CustomText
						text="(no wizard available, check again later)"
						anchor={{ x: 0, y: 0.5 }}
						position={{ x: left, y: top + lineHeight }}
						color="#666"
					/>
				)}
				{visiblePlayers.map(
					({ id, name, type, timeSinceLastPing }, i) => (
						<container
							key={id}
							x={left}
							y={top + (i + 1) * lineHeight}
						>
							<PlayerLine
								app={app}
								id={id}
								name={name}
								type={type}
								timeSinceLastPing={timeSinceLastPing}
							/>
						</container>
					),
				)}
				{hasPrevPage && (
					<sprite
						texture={ArrowUp}
						x={1440}
						y={210}
						anchor={0.5}
						cursor="pointer"
						eventMode="static"
						onPointerDown={() => setPage((page) => page - 1)}
					/>
				)}
				{hasNextPage && (
					<sprite
						texture={ArrowDown}
						x={1440}
						y={870}
						anchor={0.5}
						cursor="pointer"
						eventMode="static"
						onPointerDown={() => setPage((page) => page + 1)}
					/>
				)}
			</container>
		</>
	);
};

const clickOpenLobby = (app: AppT, createNewPlayer: () => void) => {
	void ClickStart.play();
	void TextBoxAppear.play();
	app.lobby.appear();
	createNewPlayer();
};

const buttonsLeftX = 1920 / 2 - 200;
const buttonsRightX = 1920 / 2 + 200;
const buttonsY = 730;

const StartButtons = ({ app }: { app: AppT }) => {
	const inLobby = app.lobby.alpha.value > 0.01;

	const createNewPlayer = useCreateNewPlayer(app);

	const buttons = app.startButtons;

	const startVsComputer = useButton({
		onClick: () => {
			app.lobby.disappear();
			void ClickStart.play();
			startNewGameAgainstComputer(app);
		},
		enabled: buttons.isOn,
	});

	const startVsPlayer = useButton({
		onClick: () => {
			clickOpenLobby(app, createNewPlayer);
		},
		enabled: buttons.isOn,
	});

	return (
		<>
			<sprite
				texture={StartVsComputerDefault}
				anchor={0.5}
				position={{
					x: buttonsLeftX,
					y: buttonsY,
				}}
				alpha={buttons.alpha.value}
				hitArea={new Rectangle(-100, -100, 200, 200)}
				{...startVsComputer.props}
			/>
			<sprite
				texture={StartVsHumanOffDefault}
				anchor={0.5}
				position={{
					x: buttonsRightX,
					y: buttonsY,
				}}
				alpha={buttons.alpha.value}
				hitArea={new Rectangle(-100, -100, 200, 200)}
				{...startVsPlayer.props}
			/>
			{inLobby && <Lobby app={app} />}
		</>
	);
};

const RestartVsComputer = ({ app }: { app: AppT }) => {
	const buttons = app.restartButtons;
	return (
		<sprite
			texture={getFrame(RestartButtonComputer, 20, buttons.lt)}
			anchor={0.5}
			position={{
				x: buttonsLeftX,
				y: buttonsY,
			}}
			alpha={buttons.alpha.value}
			hitArea={new Rectangle(-100, -100, 200, 200)}
			cursor="pointer"
			eventMode="static"
			onPointerDown={action(() => {
				void ClickStart.play();
				startNewGameAgainstComputer(app);
			})}
		/>
	);
};

const RestartVsPlayer = ({ app }: { app: AppT }) => {
	const buttons = app.restartButtons;
	return (
		<sprite
			texture={RestartBtnDefault}
			anchor={0.5}
			position={{
				x: buttonsRightX,
				y: buttonsY,
			}}
			alpha={buttons.alpha.value}
			hitArea={new Rectangle(-100, -100, 200, 200)}
			cursor="pointer"
			eventMode="static"
			onPointerDown={action(() => {})}
		/>
	);
};

const backToMenu = (
	app: AppT,
	disconnect: (credentials: Credentials) => Promise<null>,
) => {
	void ClickStart.play();
	exitGame(app, disconnect);
	app.restartButtons.disappear();
	app.startButtons.appear(0.4);
};

const BackToMenuLeft = ({ app }: { app: AppT }) => {
	const disconnect = useMutation(api.lobby.disconnect);
	const buttons = app.restartButtons;

	return (
		<sprite
			texture={BackToMenuDefaultLeft}
			anchor={0.5}
			position={{
				x: buttonsLeftX,
				y: buttonsY,
			}}
			alpha={buttons.alpha.value}
			hitArea={new Rectangle(-100, -100, 200, 200)}
			cursor="pointer"
			eventMode="static"
			onPointerDown={action(() => {
				backToMenu(app, disconnect);
			})}
		/>
	);
};

const BackToMenuRight = ({ app }: { app: AppT }) => {
	const disconnect = useMutation(api.lobby.disconnect);
	const buttons = app.restartButtons;

	return (
		<sprite
			texture={BackToMenuDefault}
			anchor={0.5}
			position={{
				x: buttonsRightX,
				y: buttonsY,
			}}
			alpha={buttons.alpha.value}
			hitArea={new Rectangle(-100, -100, 200, 200)}
			cursor="pointer"
			eventMode="static"
			onPointerDown={action(() => {
				backToMenu(app, disconnect);
			})}
		/>
	);
};

const RestartButtons = ({ app }: { app: AppT }) => {
	const buttons = app.restartButtons;
	if (buttons.alpha.value < 0.01) {
		return null;
	}

	if (app.credentials) {
		return (
			<>
				<BackToMenuLeft app={app} />
				<RestartVsPlayer app={app} />
			</>
		);
	} else {
		return (
			<>
				<RestartVsComputer app={app} />
				<BackToMenuRight app={app} />
			</>
		);
	}
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

type SpriteProps = ComponentProps<"sprite">;

const SoundButton = (props: SpriteProps) => {
	const setVolumeAll = useSetVolumeAll();
	const toggleSound = () => {
		setVolumeAll((volume) => 1 - volume);
	};

	return (
		<sprite
			{...props}
			texture={sound.volumeAll === 1 ? SoundOnTxt : SoundOffTxt}
			cursor="pointer"
			eventMode="static"
			onPointerDown={toggleSound}
		/>
	);
};

const exitGame = (
	app: AppT,
	disconnect: (credentials: Credentials) => Promise<null>,
) => {
	app.state = "intro";
	resetGame(app);
	// app.game = newGame("intro", false);
	app.menuButton.disappear();
	if (app.credentials) {
		void disconnect(app.credentials);
		delete app.credentials;
		delete app.opponentId;
	}
};

const clickExitGame = (
	app: AppT,
	disconnect: (credentials: Credentials) => Promise<null>,
) => {
	app.restartButtons.disappear();
	app.startButtons.appear();
	exitGame(app, disconnect);
};

const ExitButton = (props: SpriteProps & { app: AppT }) => {
	const { app, ...spriteProps } = props;
	const disconnect = useMutation(api.lobby.disconnect);
	return (
		<sprite
			{...spriteProps}
			texture={ExitGameBtn}
			cursor="pointer"
			eventMode="static"
			onPointerDown={action(() => {
				clickExitGame(app, disconnect);
			})}
		/>
	);
};

const Menu = ({ app }: { app: AppT }) => {
	const button = app.menuButton;
	const alpha = button.alpha.value;
	const hasExitGame = app.state != "intro" && app.game.state != "gameover";
	return (
		<container>
			{alpha > 0.1 && (
				<Box
					draw={() => {}}
					x={0}
					y={0}
					width={1920}
					height={1080}
					alpha={alpha * 0.5}
					cursor="pointer"
					eventMode="static"
					onPointerDown={action(() => {
						button.disappear();
					})}
				/>
			)}
			<sprite
				texture={SettingsDefault}
				anchor={{ x: 1, y: 0 }}
				x={1920 - 30}
				y={30}
			/>
			<sprite
				texture={SettingsOn}
				x={1920 - 30}
				y={30}
				anchor={{ x: 1, y: 0 }}
				alpha={alpha}
				cursor="pointer"
				eventMode="static"
				onPointerDown={() => {
					if (button.alpha.target == 1) {
						button.disappear();
					} else {
						button.appear();
					}
				}}
			/>
			<nineSliceSprite
				texture={SettingsBoxDefault}
				x={1920 - 25 - 190 * alpha * 1.5}
				y={25}
				width={190 * alpha}
				height={(hasExitGame ? 130 : 80) * alpha}
				scale={1.5}
				alpha={alpha}
			/>
			<container x={1920 - 30} y={30} scale={alpha} alpha={alpha}>
				<SoundButton
					x={-280 + 282 / 2}
					y={13 + 85 / 2}
					anchor={0.5}
					scale={0.85}
				/>
				{hasExitGame && (
					<ExitButton
						x={-283 + 282 / 2}
						y={85 + 85 / 2}
						anchor={0.5}
						scale={0.85}
						app={app}
					/>
				)}
			</container>
		</container>
	);
};

const UIButton = ({
	button,
	onClick,
	textureOff,
	textureOn,
	x,
}: {
	button: Button;
	onClick: () => void;
	textureOff: Texture;
	textureOn: Texture;
	x: number;
}) => {
	const enabled = button.alpha.value > 0.95 && button.fade.value < 0.05;
	const [isPressed, setIsPressed] = useState(false);

	return (
		<container x={x} y={1080 - 120}>
			<sprite
				texture={isPressed ? textureOn : textureOff}
				anchor={0.5}
				cursor={enabled ? "pointer" : "auto"}
				eventMode="static"
				tint={0xffffff}
				onPointerUp={() => {
					setIsPressed(false);
				}}
				onPointerDown={() => {
					if (enabled) {
						onClick();
						setIsPressed(true);
					}
				}}
				alpha={button.alpha.value < button.fade.value ? 0 : 1}
			/>
			<sprite
				texture={isPressed ? textureOn : textureOff}
				anchor={0.5}
				tint={0x333333}
				alpha={button.fade.value * button.alpha.value}
			/>
		</container>
	);
};

const UIButtons = ({ app }: { app: AppT }) => {
	const buyDefenseMutation = useMutation(api.player.buyDefense);
	const buyMushroomMutation = useMutation(api.player.buyMushroom);
	const buyMonsterMutation = useMutation(api.player.buyMonster);
	const { game } = app;
	return (
		<>
			<UIButton
				button={game.defenseButton}
				textureOn={BtnDefenseOn}
				textureOff={BtnDefense}
				x={600}
				onClick={action(() => {
					void ClickStart.play();
					void buyDefense(app, game.player, buyDefenseMutation);
				})}
			/>
			<UIButton
				button={game.manaButton}
				textureOn={BtnManaOn}
				textureOff={BtnMana}
				x={960}
				onClick={action(() => {
					void ClickStart.play();
					void buyMushroom(app, game.player, buyMushroomMutation);
				})}
			/>
			<UIButton
				button={game.attackButton}
				textureOn={BtnAttackOn}
				textureOff={BtnAttack}
				x={1320}
				onClick={action(() => {
					void ClickStart.play();
					void buyMonster(app, game.player, buyMonsterMutation);
				})}
			/>
		</>
	);
};

const PlayerName = ({ playerId }: { playerId: Id<"players"> }) => {
	const playerName = useQuery(api.player.playerName, { playerId });
	return (
		playerName && (
			<container x={40} y={1080 - 40}>
				<OnlineDot x={-20} y={5} timeSinceLastPing={0} />
				<CustomText text={playerName} anchor={{ x: 0, y: 0.5 }} />
			</container>
		)
	);
};

const OpponentName = ({ playerId }: { playerId: Id<"players"> }) => {
	const playerName = useQuery(api.player.playerName, { playerId });
	const lastPing = useQuery(api.player.lastPing, { playerId }) || 0;
	const dateNow = useDateNow(1000);
	const timeSinceLastPing = dateNow - lastPing;
	return (
		<container x={1920 - 40} y={1080 - 40}>
			<CustomText
				text={playerName ?? "(disconnected)"}
				anchor={{ x: 1, y: 0.5 }}
				color={playerName ? undefined : "#666"}
			/>
			<OnlineDot x={20} y={5} timeSinceLastPing={timeSinceLastPing} />
		</container>
	);
};

const LogoMoon = ({
	logo,
	alpha = 1,
	...rest
}: {
	logo: Logo;
	filters?: Filter[];
	alpha?: number;
} & ComponentProps<"sprite">) => {
	return (
		<>
			<sprite
				texture={Moon}
				anchor={{ x: 0.5, y: 0.5 }}
				x={1920 / 2}
				y={300 - logo.progress.value * 400}
				alpha={logo.logoAppear.value < 1 ? 0 : alpha}
				{...rest}
			/>
			{logo.logoAppear.value > 0 && (
				<sprite
					texture={getNtFrame(LogoStart, logo.logoAppear.value)}
					anchor={{ x: 0.5, y: 0.5 }}
					x={1920 / 2}
					y={300 - logo.progress.value * 400}
					alpha={1 - logo.progress.value}
					scale={1.7}
				/>
			)}
		</>
	);
};

const PoofedAway = ({ app }: { app: AppT }) => {
	const disconnect = useMutation(api.lobby.disconnect);
	return (
		<>
			<Box
				draw={() => {}}
				x={0}
				y={0}
				width={1920}
				height={1080}
				alpha={0.7}
				cursor="pointer"
				eventMode="static"
				onPointerDown={action(() => {
					backToMenu(app, disconnect);
				})}
			/>
			<sprite
				texture={PoofedAwayPost}
				anchor={0.5}
				x={1920 / 2}
				y={1080 / 2}
			/>
			<container x={1920 / 2} y={1080 / 2}>
				<CustomText
					text={"Your opponent"}
					position={{ x: 0, y: 10 }}
					anchor={0.5}
				/>
				<CustomText
					text={"has poofed away!"}
					position={{ x: 0, y: 70 }}
					anchor={0.5}
				/>
			</container>
		</>
	);
};

const mod = (a: number, b: number) => (b + (a % b)) % b;

const useCreateNewPlayer = (app: AppT) => {
	const createNewPlayer = useMutation(api.lobby.createNewPlayer);
	return () => {
		if (app.credentials) {
			console.error(
				"Should not create new player when we already have credentials",
			);
		}
		createNewPlayer()
			.then((credentials) => {
				runInAction(() => {
					app.credentials = credentials;
				});
			})
			.catch(() => {
				console.error("Could not create new player");
			});
	};
};

const usePing = (app: AppT) => {
	const ping = useMutation(api.lobby.ping);
	useInterval(() => {
		const { credentials } = app;
		if (credentials) {
			void ping(credentials);
		}
	}, 2000);
};

const useConnection = (app: AppT) => {
	const lastFight = useQuery(api.fight.lastFight, app.credentials || {});
	useEffect(() => {
		runInAction(() => {
			if (lastFight && app.game.gameId) {
				setupFight(app, lastFight);
			}
		});
	}, [lastFight, app]);
};

const useWarnBeforeClosing = (condition: boolean) => {
	useEffect(() => {
		const listener = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		if (condition) {
			window.addEventListener("beforeunload", listener);
			return () => {
				window.removeEventListener("beforeunload", listener);
			};
		}
	}, [condition]);
};

const usePoofedAway = (app: AppT) => {
	const playerExists = useQuery(api.player.playerExists, {
		playerId: app.opponentId,
	});
	const inLobby = app.lobby.alpha.value > 0.01;

	const lastPing =
		useQuery(api.player.lastPing, { playerId: app.opponentId }) || 0;
	const dateNow = useDateNow(1000);
	const timeSinceLastPing = lastPing == 0 ? 0 : dateNow - lastPing;

	return (
		!inLobby &&
		((app.opponentId !== undefined && !playerExists) ||
			timeSinceLastPing > 15_000)
	);
};

const useApp = () => {
	const [app] = useState(() => observable(newApp()));
	useEffect(() => startApp(app), [app]);
	return app;
};

export const App = () => {
	const app = useApp();

	const { game } = app;

	usePing(app);
	useConnection(app);
	useWarnBeforeClosing(app.state != "intro");
	const hasPoofedAway = usePoofedAway(app);

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

	const screenAlpha = wave(game.curtain.alpha.value);

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

	const [mask, setMask] = useState<Sprite>();
	const filters = mask ? [darkFilter] : [];

	return (
		<GlobalTimeContext.Provider value={app.gt}>
			<container>
				<sprite
					texture={Bg}
					x={0}
					y={0}
					eventMode="static"
					onPointerDown={(e: FederatedPointerEvent) => {
						const { x, y } = e.global;
						console.log(`${Math.round(x)}, ${Math.round(y)}`);
					}}
				/>
				<LogoMoon logo={app.logo} />
				<sprite texture={Cloud3} position={cloud3} />
				<sprite texture={Cloud2} position={cloud2} />
				<sprite texture={Cloud1} position={cloud1} />
				<sprite texture={BgFront} x={0} y={0} />
				<Game game={game} />
				<sprite
					texture={InactiveSideWhite}
					anchor={{ x: 1, y: 0 }}
					x={1920}
					y={0}
					alpha={1}
					ref={(sprite: Sprite) => {
						if (sprite && !mask) {
							setMask(sprite);
						}
					}}
				/>
				<sprite
					texture={InactiveSide}
					anchor={{ x: 1, y: 0 }}
					x={1920}
					y={0}
					alpha={screenAlpha}
				/>
				<sprite
					texture={Cloud3}
					position={cloud3}
					mask={mask}
					filters={filters}
					alpha={screenAlpha}
				/>
				<sprite
					texture={Cloud2}
					position={cloud2}
					mask={mask}
					filters={filters}
					alpha={screenAlpha}
				/>
				<sprite
					texture={Cloud1}
					position={cloud1}
					mask={mask}
					filters={filters}
					alpha={screenAlpha}
				/>
				<container
					scale={{ x: -1, y: 1 }}
					x={1920}
					filters={[darkFilter]}
					alpha={screenAlpha}
				>
					<Wizard
						game={game}
						player={game.opponent}
						wizard={game.opponent.wizard}
					/>
				</container>
				{/* <container */}
				{/* 	scale={[-1, 1]} */}
				{/* 	x={1920} */}
				{/* 	filters={[]} */}
				{/* 	alpha={screenAlpha * 0.4} */}
				{/* > */}
				{/* 	<ManaPoints items={game.opponent.manaPoints} /> */}
				{/* </container> */}
				<LogoMoon
					logo={app.logo}
					mask={mask}
					filters={filters}
					alpha={screenAlpha}
				/>
				<UIButtons app={app} />
				<StartButtons app={app} />
				<RestartButtons app={app} />
				{app.credentials && (
					<PlayerName playerId={app.credentials.playerId} />
				)}
				{app.opponentId && <OpponentName playerId={app.opponentId} />}
				<Menu app={app} />
				{/* <PolygonShape polygon={manaBounds.polygon} alpha={0.4} /> */}
				{hasPoofedAway && <PoofedAway app={app} />}
			</container>
		</GlobalTimeContext.Provider>
	);
};
