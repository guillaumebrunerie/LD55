import { Container } from "@pixi/react";
import type { GameT as GameT } from "./gameLogic";
import { CustomText } from "./CustomText";

export const Game = ({ game }: { game: GameT }) => {
	return (
		<Container scale={0.9}>
			<CustomText
				x={10}
				y={90}
				text={`MANA: ${game.player.mana.toFixed(0)}`}
			/>
			<CustomText
				x={10}
				y={190}
				text={`DEFENSE: ${game.player.items.defense.length}`}
			/>
			<CustomText
				x={10}
				y={290}
				text={`MANA: ${game.player.items.mana.length}`}
			/>
			<CustomText
				x={10}
				y={390}
				text={`ATTACK: ${game.player.items.attack.length}`}
			/>
			<CustomText x={500} y={390} text={game.timer.toFixed(2)} />
		</Container>
	);
};
