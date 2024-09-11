import { runInAction } from "mobx";
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

	const onMouseOver = useCallback(() => setIsHovered(true), []);
	const onMouseOut = useCallback(() => setIsHovered(false), []);
	const onPointerDown = useCallback(() => setIsPressed(true), []);
	const onPointerUp = useCallback(() => {
		setIsPressed(false);
		runInAction(() => {
			onClick();
		});
	}, [onClick]);
	const onPointerUpOutside = useCallback(() => setIsPressed(false), []);
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
					onMouseOver,
					onMouseOut,
					onPointerDown,
					onPointerUp,
					onPointerUpOutside,
				}
			:	{},
	};
};
