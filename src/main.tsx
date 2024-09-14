import { AppC } from "./App.tsx";
import { StrictMode } from "react";
import { Application, extend } from "@pixi/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Container, Graphics, NineSliceSprite, Sprite, Text } from "pixi.js";
import { createRoot } from "react-dom/client";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

extend({ Container, Sprite, Text, Graphics, NineSliceSprite });

const root = createRoot(document.getElementById("container") as never);
root.render(
	<StrictMode>
		<Application width={1920} height={1080} backgroundColor={0x2d293f}>
			<ConvexProvider client={convex}>
				<AppC />
			</ConvexProvider>
		</Application>
	</StrictMode>,
);
