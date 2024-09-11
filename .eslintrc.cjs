module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		"eslint:recommended",
		"plugin:import/recommended",
		"plugin:import/typescript",
		"plugin:react/recommended",
		"plugin:react-hooks/recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/strict-type-checked",
		"plugin:@typescript-eslint/stylistic-type-checked",
	],
	ignorePatterns: ["dist", ".eslintrc.cjs", "vite.config.ts"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: "module",
		project: [
			"tsconfig.json",
			"tsconfig.node.json",
			"convex/tsconfig.json",
		],
		tsconfigRootDir: ".",
	},
	plugins: ["react-refresh", "react", "import", "@typescript-eslint"],
	settings: {
		react: {
			version: "detect",
		},
	},
	rules: {
		"react-refresh/only-export-components": ["warn"],

		"array-bracket-newline": ["warn", "consistent"],
		"array-bracket-spacing": "warn",
		"array-callback-return": "warn",
		curly: "warn",
		"no-debugger": "warn",
		"no-unneeded-ternary": "warn",
		"no-unused-vars": ["off"],
		"prefer-const": ["warn", { destructuring: "all" }],
		"no-warning-comments": ["warn"],
		"require-yield": "off",

		"react/display-name": "off",
		"react/prop-types": "off",
		"react/react-in-jsx-scope": "off",
		"react/no-unknown-property": "off",

		"react-hooks/exhaustive-deps": "error",
		"react-hooks/rules-of-hooks": "error",

		// "import/named": "error",
		// "import/no-duplicates": ["warn", { "prefer-inline": true }],
		// "import/no-named-as-default": "off",
		// "import/no-unused-modules": [1, { unusedExports: true }],
		"import/no-cycle": "warn",

		"@typescript-eslint/consistent-type-definitions": "off",
		"@typescript-eslint/dot-notation": "off",
		"@typescript-eslint/non-nullable-type-assertion-style": "off",
		"@typescript-eslint/no-confusing-void-expression": [
			"warn",
			{ ignoreArrowShorthand: true },
		],
		"@typescript-eslint/no-dynamic-delete": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-empty-interface": "off",
		"@typescript-eslint/no-extraneous-class": [
			"warn",
			{ allowEmpty: true },
		],
		"@typescript-eslint/no-invalid-void-type": "off",
		"@typescript-eslint/no-misused-promises": [
			"warn",
			{ checksVoidReturn: { arguments: false } },
		],
		"@typescript-eslint/no-unused-vars": [
			"off",
			{ argsIgnorePattern: "^_" },
		],
		"@typescript-eslint/prefer-nullish-coalescing": "off",

		"@typescript-eslint/no-unnecessary-condition": "off",
		"@typescript-eslint/no-unsafe-argument": "warn",
		"@typescript-eslint/no-unsafe-assignment": "off",
		"@typescript-eslint/no-unsafe-call": "warn",
		"@typescript-eslint/no-unsafe-member-access": "warn",
		"@typescript-eslint/no-unsafe-return": "warn",
		"@typescript-eslint/restrict-template-expressions": "off",
	},
};
