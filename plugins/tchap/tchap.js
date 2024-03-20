/**
 * @namespace Tchap
 * @property {module:Tchap} Module
 */

/**
 * @module Tchap
 */

import { MainNav } from "../mel_metapage/js/lib/classes/main_nav.js";
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
			this.tchap_frame().querySelector('.mx_QuickSettingsButton') !== null, 60
		);

		if (this.tchap_frame().querySelector('.mx_QuickSettingsButton') !== null) {
			this.change_theme();
		}
		
		this.tchap_frame().querySelector('.mx_SpacePanel').style.display = 'none';
		$("#tchaploader").hide();

		this.rcmail().addEventListener('switched_color_theme', this.change_theme.bind(this));
		this.rcmail().addEventListener('tchap.options', this.tchap_options.bind(this));
		this.rcmail().addEventListener('tchap.disconnect', this.tchap_disconnect.bind(this));
		this._notificationhandler();
	}

	/**
	 * Gestion des notifications sur la barre de gauche
	 * @private
	 * @return {Promise<void>}
	 */
	async _notificationhandler() {
		while (true) {
			MainNav.try_add_round('.button-tchap','tchap_badge');
			if(this.tchap_frame().querySelector('.mx_NotificationBadge_count') !== null && this.tchap_frame().querySelector('.mx_NotificationBadge_count').innerHTML !== ''){
				MainNav.update_badge(+this.tchap_frame().querySelector('.mx_NotificationBadge_count').innerHTML, 'tchap_badge');
			} else if(this.tchap_frame().querySelector('.mx_NotificationBadge') !== null){
				MainNav.update_badge_text( '●', 'tchap_badge');
			} else {
				MainNav.update_badge( 0, 'tchap_badge');
			}
			if (this.get_env('current_frame_name') === 'tchap'){
				await delay(10000);
			}else{
				await delay(30000);
			}
			
		}
	}
	
	/**
	 * Retourne la frame de tchap
	 * @public
	 * @returns {Document}
	 */
	tchap_frame(){
		return $('#tchap_frame')[0].contentWindow.document;
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
		top.m_mp_ToggleGroupOptionsUser();

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
		top.m_mp_ToggleGroupOptionsUser();

	}
}