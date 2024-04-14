import { useTick } from "@pixi/react";
import { Ticker } from "pixi.js";
import { useState } from "react";

export const useLocalTime = () => {
	const [t, setT] = useState(0);
	useTick(() => {
		setT((t) => t + Ticker.shared.deltaMS);
	});

	return t / 1000;
};
