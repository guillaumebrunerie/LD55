export default (api) => ({
	presets: ["@babel/preset-react"],
	plugins: [["./tools/babel-plugin-auto-observe.js"]].concat(
		api.env("development") ? [["react-refresh/babel"]] : [],
	),
});
