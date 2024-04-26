import { useState, useEffect, useReducer } from "react";
import {
	ColorMatrixFilter,
	FederatedPointerEvent,
	Filter,
	Rectangle,
	SpriteMaskFilter,
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
	StartButtonDefault,
	StartButtonPressed,
} from "./assets";
import {
	buyMonster,
	buyDefense,
	buyMushroom,
	runeTombola,
	type GameT,
} from "./gameLogic";
import { Game } from "./Game";
import { wave } from "./ease";
import type { ButtonT } from "./button";
import { GlobalTimeContext } from "./globalTimeContext";

const StartButton = ({
	button,
	onClick,
	position,
}: {
	button: ButtonT;
	onClick: () => void;
	position: [number, number];
}) => {
	const { isActive, props } = useButton({
		onClick,
		enabled: button.state == "idle",
	});

	if (button.state == "hidden") {
		return null;
	}

	let alpha = 0;
	switch (button.state) {
		case "idle":
			alpha = 1;
			break;
		case "appearing":
			alpha = button.nt;
			break;
		case "disappearing":
			alpha = 1 - button.nt;
			break;
	}
	return (
		<Sprite
			texture={isActive ? StartButtonPressed : StartButtonDefault}
			anchor={0.5}
			position={position}
			alpha={alpha}
			hitArea={
				button.state == "idle" ?
					new Rectangle(-200, -100, 400, 200)
				:	null
			}
			{...props}
		/>
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
	const disabled = button.state !== "idle";

	let alpha = 0;
	let alphaTint = 0;
	switch (button.state) {
		case "idle":
			alpha = 1;
			break;
		case "faded":
			alpha = 1;
			alphaTint = 1;
			break;
		case "fadingIn":
			alpha = 1;
			alphaTint = 1 - button.nt;
			break;
		case "fadingOut":
			alpha = 1;
			alphaTint = button.nt;
			break;
		case "appearing":
			alpha = button.nt;
			break;
		case "disappearing":
			alpha = 1 - button.nt;
			break;
	}

	return (
		<Container x={x} y={1080 - 120}>
			<Sprite
				texture={texture}
				anchor={0.5}
				cursor={disabled ? "auto" : "pointer"}
				eventMode="static"
				tint={0xffffff}
				pointerdown={disabled ? () => {} : onClick}
				alpha={alpha}
			/>
			<Sprite
				texture={texture}
				anchor={0.5}
				tint={0x333333}
				alpha={alphaTint}
			/>
		</Container>
	);
};

const UIButtons = ({ game }: { game: GameT }) => {
	return (
		<>
			<UIButton
				button={game.defenseButton}
				texture={BtnDefense}
				x={600}
				onClick={action(() => {
					void ClickDefense.play();
					void buyDefense(game, game.player);
				})}
			/>
			<UIButton
				button={game.manaButton}
				texture={BtnMana}
				x={960}
				onClick={action(() => {
					void ClickMana.play();
					void buyMushroom(game, game.player);
				})}
			/>
			<UIButton
				button={game.attackButton}
				texture={BtnAttack}
				x={1320}
				onClick={action(() => {
					void ClickAttack.play();
					void buyMonster(game, game.player);
				})}
			/>
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
			} else if (event.key == "t") {
				runeTombola()(game.player);
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
					button={game.startButton}
					position={[1920 / 2, 780]}
					onClick={action(() => {
						startNewGame(app);
					})}
				/>
				<SoundButton />
				{/* <PolygonShape polygon={manaBounds.polygon} alpha={0.4} /> */}
			</Container>
		</GlobalTimeContext.Provider>
	);
};
