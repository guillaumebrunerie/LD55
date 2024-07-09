import { getDuration } from "./Animation";
import { LogoStart } from "./assets";
import { makeTick, newEntity, type Entity } from "./entities2";
import {
	newLinearToggle,
	setTarget,
	tickLinearToggle,
	type LinearToggle,
} from "./linearToggle";

export type LogoT = Entity<"idle"> & {
	progress: LinearToggle;
	logoAppear: LinearToggle;
};

export const newLogo = (): LogoT => ({
	...newEntity("idle"),
	progress: newLinearToggle(0),
	logoAppear: newLinearToggle(0),
});

export const tickLogo = makeTick<LogoT>((logo, delta) => {
	tickLinearToggle(logo.progress, delta);
	tickLinearToggle(logo.logoAppear, delta);
});

export const hideLogo = (logo: LogoT) => {
	setTarget(logo.progress, 1, 0.5);
};

export const showLogo = (logo: LogoT) => {
	setTarget(logo.progress, 0, 0.5);
};

export const showLogoAppear = (logo: LogoT, delay?: number) => {
	setTarget(logo.logoAppear, 1, getDuration(LogoStart, 10), delay);
};
