/**
 * @namespace Tchap
 * @property {module:TchapManager} Manager
 */

/**
 * @module TchapManager
 */

import { MelObject } from "../mel_metapage/js/lib/mel_object.js";
import { Mel_Promise } from "../mel_metapage/js/lib/mel_promise.js";
export {tchap_manager};

/**
 * @class
 * @classdesc Classe de gestion de tchap en JS
 * @extends {MelObject}
 */
class tchap_manager extends MelObject { 
	constructor(){
		super();
	}

	/**
	 * @async
	 * @package
	 */
	async main() {
		const url = rcmail.env.tchap_startup_url != null && rcmail.env.tchap_startup_url !== undefined ? rcmail.env.tchap_startup_url : rcmail.env.tchap_url;
		let $tchap = $('#tchap_frame').attr('src', url);
		if (navigator.appName == "Microsoft Internet Explorer") $tchap[0].contentWindow.location.reload(true);
		
		MEL_ELASTIC_UI.create_loader('tchaploader', true)[0].outerHTML;
		$("body").append('#tchaploader');
		$("#wait_box").hide();
		await Mel_Promise.wait(() => 
			$('#tchap_frame')[0].contentWindow.document.querySelector('.mx_QuickSettingsButton') !== null, 60
		);
		if ($('#tchap_frame')[0].contentWindow.document.querySelector('.mx_QuickSettingsButton') !== null) {
			this.change_theme();
		}
		$('#tchap_frame')[0].contentWindow.document.querySelector('.mx_SpacePanel').style.display = 'none';
		$("#tchaploader").hide();

		this.rcmail().addEventListener('switched_color_theme', this.change_theme.bind(this));
		this.rcmail().addEventListener('tchap.options', this.tchap_options.bind(this));
		this.rcmail().addEventListener('tchap.disconnect', this.tchap_disconnect.bind(this));
	}

	/**
	 * Change le thème de tchap
	 * @public
	 * @method
	 */
	change_theme() {
		let frame_doc = $('#tchap_frame')[0].contentWindow.document;
		frame_doc.querySelector('.mx_QuickSettingsButton').click();  
		frame_doc.querySelector('.mx_QuickThemeSwitcher .mx_Dropdown_input').click();  
		frame_doc.querySelector(`#mx_QuickSettingsButton_themePickerDropdown__${this.get_skin().color_mode()}`).click();
	}

	/**
	 * Ouvre les paramètres de tchap
	 * @public
	 * @method
	 */
	tchap_options() {
		let frame_doc = $('#tchap_frame')[0].contentWindow.document;
		frame_doc.querySelector('.mx_QuickSettingsButton').click();
		frame_doc.querySelector('.mx_ContextualMenu > div > .mx_AccessibleButton_kind_primary_outline').click();
	}

	/**
	 * Deconnecte de tchap
	 * @public
	 * @method
	 */
	tchap_disconnect() {
		let frame_doc = $('#tchap_frame')[0].contentWindow.document;
		frame_doc.querySelector('.mx_UserMenu_contextMenuButton').click();
		frame_doc.querySelector('.mx_UserMenu_iconSignOut').click();
	}
}