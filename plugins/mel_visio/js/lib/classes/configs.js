/**
 * @module Visio/Configs
 * @local VisioConfigs
 * @local VoxifyConfig
 */

export { VisioConfigs };

/**
 * Configuration de la visioconférence
 * @mixin
 */
const VisioConfigs = {
	/**
	 * Url de la visioconférence
	 * @type {string}
	 * @member
	 */
	url: null,
	/**
	 * Configuration de Voxify
	 * @type {VoxifyConfig}
	 * @member
	 */
	voxify: null,
};

/**
 * Configuration de Voxify
 * @mixin
 * @package
 */
const VoxifyConfig = {
	/**
	 * Url de voxify
	 * @type {string}
	 * @member
	 */
	url: null,
	/**
	 * Indicatif de voxify
	 * @type {string}
	 * @member
	 */
	indicatif: null,
};

Object.defineProperties(VisioConfigs, {
	url: {
		get() {
			return rcmail.env['visio.url'];
		},
	},
	voxify: {
		value: VoxifyConfig,
		configurable: false,
		writable: false,
	},
});

Object.defineProperties(VoxifyConfig, {
	url: {
		get() {
			return rcmail.env['visio.voxify_url'];
		},
	},
	indicatif: {
		get() {
			return rcmail.env['visio.voxify_indicatif'];
		},
	},
});
