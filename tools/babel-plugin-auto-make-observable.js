import * as t from "@babel/types";
import * as c from "@babel/core";
import { addNamed } from "@babel/helper-module-imports";

/**
 * @returns {c.PluginObj}
 */
// eslint-disable-next-line import/no-unused-modules
export default () => ({
	visitor: {
		// Go through all class definitions
		ClassDeclaration(path) {
			// Collect all regular properties, methods, getters, and the constructor
			const properties = [];
			let constructorIndex;
			for (const prop of path.node.body.body) {
				switch (prop.type) {
					case "ClassProperty":
						properties.push(prop.key.name);
						break;
					case "ClassMethod":
						switch (prop.kind) {
							case "get":
							case "method":
								properties.push(prop.key.name);
								break;
							case "constructor":
								constructorIndex =
									path.node.body.body.indexOf(prop);
								break;
							default:
								throw new Error(
									`Class method of kind '${prop.kind}' unimplemented.`,
								);
						}
						break;
					default:
						throw new Error(
							`Class element '${prop.type}' unimplemented.`,
						);
				}
			}

			if (constructorIndex === undefined) {
				throw new Error("Missing constructor.");
			}
			const makeObservable = addNamed(path, "makeObservable", "mobx");
			if (!makeObservable) {
				throw new Error("makeObservable is falsy");
			}
			path.get(`body.body.${constructorIndex}.body`).pushContainer(
				"body",
				[
					t.callExpression(makeObservable, [
						t.thisExpression(),
						t.objectExpression(
							properties.map((prop) =>
								t.objectProperty(
									t.stringLiteral(prop),
									t.booleanLiteral(true),
								),
							),
						),
					]),
				],
			);
		},
	},
});
