import { useState, useEffect, useReducer } from "react";
import { Polygon, Rectangle, Texture } from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import { useButton } from "./useButton";
import { newApp, startApp, startNewGame, type AppT } from "./appLogic";
import { observable, action } from "mobx";
import { sound } from "@pixi/sound";
import {
	Bg,
	BgFront,
	BtnAttack,
	// BtnBar,
	BtnDefense,
	BtnMana,
	Cloud1,
	Cloud2,
	Cloud3,
	Logo,
	Moon,
	SoundOff,
	SoundOn,
	StartButtonDefault,
	StartButtonPressed,
} from "./assets";
import {
	buyAttackItem,
	buyDefenseItem,
	buyManaItem,
	type GameT,
	type Player,
} from "./gameLogic";
import { Game } from "./Game";
import { CustomText } from "./CustomText";
import { useLocalTime } from "./useLocalTime";

const StartButton = ({
	onClick,
	position,
	scale,
}: {
	onClick: () => void;
	position: [number, number];
	scale: number;
}) => {
	const { isActive, props } = useButton({ onClick });

	return (
		<Sprite
			texture={isActive ? StartButtonPressed : StartButtonDefault}
			anchor={0.5}
			position={position}
			scale={scale}
			hitArea={new Rectangle(-200, -100, 400, 200)}
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
	onClick,
	texture,
	x,
	game,
}: {
	onClick: () => void;
	texture: Texture;
	x: number;
	game: GameT;
}) => {
	const tint =
		game.player.mana.length == 0 || game.phase != "buildUp" ?
			0x333333
		:	0xffffff;
	// const proportion = (player.mana / itemCost(player)) * 100;
	// const i = Math.min(Math.round(proportion), 99);
	return (
		<Container x={x} y={1080 - 120}>
			<Sprite
				texture={texture}
				anchor={0.5}
				cursor="pointer"
				eventMode="static"
				tint={tint}
				pointerdown={onClick}
			/>
			{/* <Sprite texture={BtnBar.animations.BtnBar[i]} anchor={0.5} /> */}
		</Container>
	);
};

const UIButtons = ({ game }: { game: GameT }) => {
	return (
		<>
			<UIButton
				texture={BtnDefense}
				x={600}
				onClick={action(() => buyDefenseItem(game, game.player))}
				game={game}
			/>
			<UIButton
				texture={BtnMana}
				x={960}
				onClick={action(() => buyManaItem(game, game.player))}
				game={game}
			/>
			<UIButton
				texture={BtnAttack}
				x={1320}
				onClick={action(() => buyAttackItem(game, game.player))}
				game={game}
			/>
		</>
	);
};

const requestFullScreen = async () => {
	const canvas = document.getElementById("canvas") as HTMLCanvasElement;
	// await canvas.requestFullscreen();
	// await screen.orientation.lock("landscape");
};

const LogoMoon = ({ app }: { app: AppT }) => {
	switch (app.state) {
		case "game":
			return (
				<Sprite
					texture={Moon}
					anchor={[0.5, 0.5]}
					x={1920 / 2}
					y={-100}
				/>
			);
		case "transition":
			return (
				<>
					<Sprite
						texture={Moon}
						anchor={[0.5, 0.5]}
						x={1920 / 2}
						y={400 - app.nt * 500}
					/>
					<Sprite
						texture={Logo}
						anchor={[0.5, 0.5]}
						x={1920 / 2}
						y={400 - app.nt * 500}
						alpha={1 - app.nt}
					/>
				</>
			);
		case "intro":
			return <Sprite texture={Logo} x={1920 / 2} y={400} anchor={0.5} />;
	}
};

const mod = (a: number, b: number) => (b + (a % b)) % b;

export const App = () => {
	const [app] = useState(() => observable(newApp()));
	const { game } = app;
	useEffect(() => startApp(app), [app]);

	const lt = app.lt;

	useEffect(() => {
		const callback = action((event: KeyboardEvent) => {
			if (event.key == "ArrowUp") {
				app.speed *= 2;
			} else if (event.key == "ArrowDown") {
				app.speed *= 1 / 2;
			} else if (event.key == "ArrowLeft") {
				app.speed = 0;
			} else if (event.key == "ArrowRight") {
				app.speed = 1;
			}
		});
		window.addEventListener("keydown", callback);
		return () => {
			window.removeEventListener("keydown", callback);
		};
	}, [app]);

	const startButtonInCenter = game.isGameOver || game.phase == "gameover";

	return (
		<Container>
			<Sprite
				texture={Bg}
				x={0}
				y={0}
				eventMode="static"
				pointerdown={(e) => {
					const { x, y } = e.global;
					console.log(`${Math.round(x)}, ${Math.round(y)}`);
				}}
			/>
			<LogoMoon app={app} />
			<Sprite
				texture={Cloud3}
				x={mod(13 * lt + 2800 / 3, 2800) - 800}
				y={50}
			/>
			<Sprite
				texture={Cloud2}
				x={mod(16 * lt + (2800 * 2) / 3, 2800) - 800}
				y={200}
			/>
			<Sprite texture={Cloud1} x={mod(21 * lt, 2800) - 800} y={500} />
			<Sprite texture={BgFront} x={0} y={0} />
			{!game.isGameOver && <Game game={game} />}
			{!game.isGameOver && <UIButtons game={game} />}
			<StartButton
				position={
					startButtonInCenter ? [1920 / 2, 800] : [1920 - 100, 1030]
				}
				scale={startButtonInCenter ? 1 : 0.5}
				onClick={action(() => {
					void requestFullScreen();
					startNewGame(app);
				})}
			/>
			<SoundButton />
			{/* <PolygonShape polygon={manaBounds.polygon} alpha={0.4} /> */}
		</Container>
	);
};
