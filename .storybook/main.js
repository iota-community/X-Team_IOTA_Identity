const CopyWebPlugin= require('copy-webpack-plugin');

module.exports = {
	stories: [
		'./*.stories.@(js|jsx|ts|tsx|mdx)',
		'../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
	],
	addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
	/**
	 * @param {import('webpack/index').Configuration} config
	 */
	webpackFinal: async (config, { configType }) => {
		// `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
		// You can change the configuration based on that.
		// 'PRODUCTION' is used when building the static version of storybook.
        // let copy =  new CopyWebPlugin({
        //     patterns: [
        //         {
        //           from: 'node_modules/iota-identity-wasm-test/web/iota_identity_wasm_bg.wasm',
        //           to: 'iota_identity_wasm_bg.wasm'
        //         }
        //     ]
        // })
        // config.plugins.push(copy)
		// // Make whatever fine-grained changes you need
		// const loaderIndex = config.module.rules.findIndex(
		// 	(val) => val.loader && val.loader.includes('svelte-loader')
		// );
		// config.module.rules[loaderIndex].options = {
		// 	// preprocess: require('svelte-preprocess')(
		// 	// 	require('../svelte-preprocess.config').sveltePreprocessConfig
		// 	// ),
		// };

  

		// Return the altered config
		return config;
	},
};