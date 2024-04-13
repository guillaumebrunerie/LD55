import { useState, useEffect, useReducer } from "react";
import { Polygon, Rectangle, Texture } from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import { useButton } from "./useButton";
import { newApp, startApp, startNewGame } from "./appLogic";
import { observable, action } from "mobx";
import { sound } from "@pixi/sound";
import {
	Bg,
	BtnAttack,
	// BtnBar,
	BtnDefense,
	BtnMana,
	Logo,
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

const StartButton = ({
	onClick,
	position,
}: {
	onClick: () => void;
	position: [number, number];
}) => {
	const { isActive, props } = useButton({ onClick });

	return (
		<Sprite
			texture={isActive ? StartButtonPressed : StartButtonDefault}
			anchor={0.5}
			position={position}
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
	player,
}: {
	onClick: () => void;
	texture: Texture;
	x: number;
	player: Player;
}) => {
	const tint = player.mana.length == 0 ? 0x333333 : 0xffffff;
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
				x={120}
				onClick={action(() => buyDefenseItem(game, game.player))}
				player={game.player}
			/>
			<UIButton
				texture={BtnMana}
				x={350}
				onClick={action(() => buyManaItem(game, game.player))}
				player={game.player}
			/>
			<UIButton
				texture={BtnAttack}
				x={580}
				onClick={action(() => buyAttackItem(game, game.player))}
				player={game.player}
			/>
		</>
	);
};

export const App = () => {
	const [app] = useState(() => observable(newApp()));
	const { highScore, game } = app;
	useEffect(() => startApp(app), [app]);
	const toTxt = (score: number) => score.toFixed(1);

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
			{/* <CustomText text={"SCORE: " + toTxt(game.score)} x={10} y={40} /> */}
			{game.isGameOver && (
				<Sprite texture={Logo} x={1920 / 2} y={400} anchor={0.5} />
			)}
			{game.isGameOver && app.highScore > 0 && (
				<CustomText
					x={10}
					y={90}
					text={`HIGHSCORE: ${toTxt(highScore)}`}
				/>
			)}
			{!game.isGameOver && <Game game={game} />}
			{!game.isGameOver && <UIButtons game={game} />}
			<StartButton
				position={game.isGameOver ? [1920 / 2, 800] : [1920 / 2, 1000]}
				onClick={action(() => {
					startNewGame(app);
				})}
			/>
			<SoundButton />
			{/* <PolygonShape polygon={manaBounds.polygon} alpha={0.4} /> */}
		</Container>
	);
};
