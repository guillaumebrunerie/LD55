import type { EventMode } from "pixi.js";
import { useCallback, useState } from "react";

export const useButton = ({
	onClick,
	enabled,
}: {
	onClick: () => void;
	enabled: boolean;
}) => {
	const [isPressed, setIsPressed] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const mouseover = useCallback(() => setIsHovered(true), []);
	const mouseout = useCallback(() => setIsHovered(false), []);
	const pointerdown = useCallback(() => setIsPressed(true), []);
	const pointerup = useCallback(() => {
		onClick();
		setIsPressed(false);
	}, [onClick]);
	const pointerupoutside = useCallback(() => setIsPressed(false), []);
	const eventMode: EventMode = "static";

	return {
		isHovered,
		isPressed,
		isPending: isHovered || isPressed,
		isActive: isHovered && isPressed,
		props:
			enabled ?
				{
					eventMode,
					cursor: "pointer",
					mouseover,
					mouseout,
					pointerdown,
					pointerup,
					pointerupoutside,
				}
			:	{},
	};
};
