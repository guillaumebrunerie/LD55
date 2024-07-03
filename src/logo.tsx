import { makeTick3, newEntity, type Entity2 } from "./entities2";
import {
	newLinearToggle,
	setTarget,
	tickLinearToggle,
	type LinearToggle,
} from "./linearToggle";

export type LogoT = Entity2<"idle"> & {
	progress: LinearToggle;
};

export const newLogo = (): LogoT => ({
	...newEntity("idle"),
	progress: newLinearToggle(0),
});

export const tickLogo = makeTick3<LogoT>((logo, delta) => {
	tickLinearToggle(logo.progress, delta);
});

export const hideLogo = (logo: LogoT) => {
	setTarget(logo.progress, 1, 0.5);
};

export const showLogo = (logo: LogoT) => {
	setTarget(logo.progress, 0, 0.5);
};
