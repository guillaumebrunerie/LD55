import * as t from "@babel/types";
import * as c from "@babel/core";
import { addNamed } from "@babel/helper-module-imports";

/**
 * @param node {t.Expression}
 */
const getArrowExpression = (node) => {
	if (t.isArrowFunctionExpression(node)) {
		return node;
	}
	if (!t.isCallExpression(node)) {
		return null;
	}
	if (
		node.arguments.length != 1 ||
		!t.isArrowFunctionExpression(node.arguments[0])
	) {
		return null;
	}
	if (t.isIdentifier(node.callee) && node.callee.name == "memo") {
		return node.arguments[0];
	}
	if (
		t.isMemberExpression(node.callee) &&
		t.isIdentifier(node.callee.object) &&
		node.callee.object.name == "React" &&
		t.isIdentifier(node.callee.property) &&
		node.callee.property.name == "memo"
	) {
		return node.arguments[0];
	}
	return false;
};

/**
 * @param node {t.VariableDeclarator}
 */
const isAnonymousComponentDeclarator = (node) =>
	t.isIdentifier(node.id) &&
	/^[A-Z]/.test(node.id.name[0]) &&
	!!getArrowExpression(node.init);

/**
 * @returns {c.PluginObj}
 */
// eslint-disable-next-line import/no-unused-modules
export default () => ({
	visitor: {
		// Go through all variable declarations
		VariableDeclarator(path) {
			// Check if it is a declaration of an anonymous component
			if (!isAnonymousComponentDeclarator(path.node)) {
				return;
			}
			// Wrap the component with `observer`
			path.get("init").replaceWith(
				t.callExpression(
					addNamed(path, "observer", "mobx-react-lite"),
					[getArrowExpression(path.node.init)],
				),
			);
			// Add a displayName afterwards
			path.parentPath.insertAfter(
				t.expressionStatement(
					t.assignmentExpression(
						"=",
						t.memberExpression(
							path.node.id,
							t.identifier("displayName"),
						),
						t.stringLiteral(path.node.id.name),
					),
				),
			);
		},
	},
});
