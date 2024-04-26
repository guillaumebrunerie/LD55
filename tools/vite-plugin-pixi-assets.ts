import fs from "fs";
import type { Plugin, ResolvedConfig } from "vite";

export const pixiAssetPlugin = (): Plugin => {
	let config: ResolvedConfig;
	return {
		name: "pixi-asset",
		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},
		transform(_, id) {
			const isTexture = id.endsWith("?texture");
			const isSpriteSheet = id.endsWith("?spritesheet");
			const isSound = id.endsWith("?sound");
			if (!isTexture && !isSpriteSheet && !isSound) {
				return;
			}
			const fileName = id.split("/").pop()?.split("?")[0];
			if (!fileName) {
				return;
			}
			const baseName = fileName.split(".")[0];
			const dir = isSound ? "audio" : "gfx";

			if (config.command === "build") {
				this.emitFile({
					type: "asset",
					fileName: `${dir}/${fileName}`,
					source: fs.readFileSync(id.split("?")[0]),
				});
				if (isSpriteSheet) {
					this.emitFile({
						type: "asset",
						fileName: `${dir}/${baseName}.json`,
						source: fs.readFileSync(
							id.split("?")[0].replace(".png", ".json"),
						),
					});
				}
			}

			const code = `
import { Assets } from "pixi.js";
import "@pixi/sound";
const asset = Assets.load("${dir}/${isSpriteSheet ? baseName + ".json" : fileName}?t=${Date.now()}");
export default asset;
`;
			return code;
		},
		async handleHotUpdate({ modules, read }) {
			await read();
			return modules;
		},
		enforce: "pre",
	};
};
