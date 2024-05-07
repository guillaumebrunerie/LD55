import type { Bounds } from "./configuration";

const ITERATION_COUNT = 100;

export type Point = {
	x: number;
	y: number;
};

export const pickPosition = (
	array: { position: Point }[],
	bounds: Bounds,
	delta: number,
) => {
	const { left, top, width, height, polygon } = bounds;
	let bestPosition = {
		x: left + Math.random() * width,
		y: top + Math.random() * height,
	};
	let bestDistance = 0;
	for (let iteration = 0; iteration < ITERATION_COUNT; iteration++) {
		const position = {
			x: left + Math.random() * width,
			y: top + Math.random() * height,
		};
		if (!polygon.contains(position.x, position.y)) {
			continue;
		}
		const distance = Math.min(
			...array.map((item) => {
				const dx = item.position.x - position.x;
				const dy = item.position.y - position.y;
				return Math.sqrt(dx * dx + dy * dy);
			}),
		);
		if (distance > delta) {
			bestPosition = position;
			bestDistance = distance;
			break;
		} else if (distance > bestDistance) {
			bestPosition = position;
			bestDistance = distance;
		}
	}
	return bestPosition;
};
