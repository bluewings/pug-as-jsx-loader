/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned.
 *
 * @param {object} config - original webpack config.
 * @param {object} env - options passed to CLI.
 * @param {WebpackConfigHelpers} helpers - object with useful helpers when working with config.
 **/
export default function (config, env, helpers) {

	/** you can change config here **/
	config.module.loaders.push({
		test: /\.pug$/,
		use: [{
			loader: 'babel-loader',
			options: {
				presets: ['react']
			}
		}, {
			loader: 'pug-as-jsx-loader',
			options: {
				autoUpdateJsFile: true,
				transpiledFile: true
			}
		}]
	});

	return config;
}