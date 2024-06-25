import { App } from "./App.tsx";
import { StrictMode } from "react";
import { AppProvider, createRoot } from "@pixi/react";
import { Application } from "pixi.js";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Setup PIXI app

const app = new Application({
	width: 1920,
	height: 1080,
	backgroundColor: 0x2d293f,
	view: document.getElementById("canvas") as HTMLCanvasElement,
});

const root = createRoot(app.stage);
root.render(
	<StrictMode>
		<AppProvider value={app}>
			<ConvexProvider client={convex}>
				<App />
			</ConvexProvider>
		</AppProvider>
	</StrictMode>,
);
