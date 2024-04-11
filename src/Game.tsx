import { Container } from "@pixi/react";
import type { Game as GameT } from "./gameLogic";

export const Game = ({ game: _game }: { game: GameT }) => {
	return <Container scale={0.9}></Container>;
};
