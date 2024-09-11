export default (api) => ({
	presets: ["@babel/preset-react", "@babel/preset-typescript"],
	plugins: [
		["./tools/babel-plugin-auto-observe.js"],
		["./tools/babel-plugin-auto-make-observable.js"],
	].concat(api.env("development") ? [["react-refresh/babel"]] : []),
});
