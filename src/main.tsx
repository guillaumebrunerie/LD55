import { App } from "./App.tsx";
import { StrictMode } from "react";
import { AppProvider, createRoot } from "@pixi/react";
import { Application } from "pixi.js";

// Setup PIXI app

const app = new Application({
	width: 1920,
	height: 1080,
	backgroundColor: 0x10bb99,
	view: document.getElementById("canvas") as HTMLCanvasElement,
});

const root = createRoot(app.stage);
root.render(
	<StrictMode>
		<AppProvider value={app}>
			<App />
		</AppProvider>
	</StrictMode>,
);
