import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { pixiAssetPlugin } from "./tools/vite-plugin-pixi-assets";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		pixiAssetPlugin(),
		react({
			babel: {
				plugins: [
					"./tools/babel-plugin-auto-observe.js",
					"./tools/babel-plugin-auto-make-observable.js",
				],
			},
		}),
	],
	build: {
		target: "es2022",
		assetsInlineLimit: Infinity,
	},
});
