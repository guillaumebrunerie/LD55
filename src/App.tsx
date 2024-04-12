import { useState, type ReactNode, useEffect, useReducer } from "react";
import { Rectangle } from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import { useButton } from "./useButton";
import { newApp, startApp, startNewGame } from "./appLogic";
import { observable, action } from "mobx";
import { sound } from "@pixi/sound";
import {
	Bg,
	Font,
	Logo,
	SoundOff,
	SoundOn,
	StartButtonDefault,
	StartButtonPressed,
} from "./assets";
import { Game } from "./Game";

const StartButton = ({ onClick }: { onClick: () => void }) => {
	const { isActive, props } = useButton({ onClick });

	return (
		<Sprite
			texture={isActive ? StartButtonPressed : StartButtonDefault}
			anchor={0.5}
			position={[360, 960]}
			hitArea={new Rectangle(-200, -100, 400, 200)}
			{...props}
		/>
	);
};

const CustomText = ({ text, x, y }: { text: string; x: number; y: number }) => {
	const scale = 0.4;
	const kerning = 10;
	const space = 30;
	const result: ReactNode[] = [];
	text.split("").forEach((char, i) => {
		if (char == ":") {
			char = "collon";
		}
		if (char == ".") {
			char = "dot";
		}
		if (char == "!") {
			char = "ExMark";
		}
		if (char == " ") {
			x += space * scale;
			return;
		}
		const texture = Font.textures[char];
		if (!texture) {
			console.error(`Missing character ${char}`);
			return;
		}
		result.push(
			<Sprite
				anchor={[0, 1]}
				key={i}
				texture={texture}
				scale={scale}
				position={[x, y]}
			/>,
		);
		x += (texture.width + kerning) * scale;
	});
	return result;
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
			x={700}
			y={20}
			cursor="pointer"
			eventMode="static"
			pointerdown={toggleSound}
		/>
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
			<CustomText text={"SCORE: " + toTxt(game.score)} x={10} y={40} />
			{game.isGameOver && (
				<Sprite texture={Logo} x={360} y={450} anchor={0.5} />
			)}
			{game.isGameOver && app.highScore > 0 && (
				<CustomText
					x={10}
					y={90}
					text={`HIGHSCORE: ${toTxt(highScore)}`}
				/>
			)}
			{game.isGameOver && (
				<StartButton
					onClick={action(() => {
						startNewGame(app);
					})}
				/>
			)}
			<Game game={game} />
			<SoundButton />
		</Container>
	);
};
