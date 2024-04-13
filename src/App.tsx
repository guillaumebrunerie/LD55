import { useState, useEffect, useReducer } from "react";
import { Rectangle } from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import { useButton } from "./useButton";
import { newApp, startApp, startNewGame } from "./appLogic";
import { observable, action } from "mobx";
import { sound } from "@pixi/sound";
import {
	Bg,
	BtnAttack,
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
	itemCost,
	type GameT,
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

const UIButtons = ({ game }: { game: GameT }) => {
	const tint = game.player.mana < itemCost(game.player) ? 0x333333 : 0xffffff;
	return (
		<>
			<Sprite
				texture={BtnDefense}
				anchor={[0, 1]}
				x={20}
				y={1080 - 20}
				cursor="pointer"
				eventMode="static"
				tint={tint}
				pointerdown={action(() => buyDefenseItem(game.player))}
			/>
			<Sprite
				texture={BtnMana}
				anchor={[0, 1]}
				x={220}
				y={1080 - 20}
				cursor="pointer"
				eventMode="static"
				tint={tint}
				pointerdown={action(() => buyManaItem(game.player))}
			/>
			<Sprite
				texture={BtnAttack}
				anchor={[0, 1]}
				x={420}
				y={1080 - 20}
				cursor="pointer"
				eventMode="static"
				tint={tint}
				pointerdown={action(() => buyAttackItem(game.player))}
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
			<Sprite texture={Bg} x={0} y={0} />
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
		</Container>
	);
};
