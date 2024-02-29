import { MelObject } from "../mel_metapage/js/lib/mel_object.js";
import { Mel_Promise } from "../mel_metapage/js/lib/mel_promise.js";

export class tchap_manager extends MelObject { 
	constructor(){
		super();
	}
	async main() {
		const url = rcmail.env.tchap_startup_url != null && rcmail.env.tchap_startup_url !== undefined ? rcmail.env.tchap_startup_url : rcmail.env.tchap_url;
		let $tchap = $('#tchap_frame').attr('src', url);
		if (navigator.appName == "Microsoft Internet Explorer") $tchap[0].contentWindow.location.reload(true);

		await Mel_Promise.wait(() => 
			$('#tchap_frame')[0].contentWindow.document.querySelector('.mx_QuickSettingsButton') !== null, 60
		);
		if ($('#tchap_frame')[0].contentWindow.document.querySelector('.mx_QuickSettingsButton') !== null) {
			this.change_theme();
		}
		$('#tchap_frame')[0].contentWindow.document.querySelector('.mx_SpacePanel').style.display = 'none';
		$("#wait_box").hide();

		this.rcmail().addEventListener('switched_color_theme', this.change_theme.bind(this));
		this.rcmail().addEventListener('tchap.options', this.tchap_options.bind(this));
		this.rcmail().addEventListener('tchap.disconnect', this.tchap_disconnect.bind(this));
	}

	change_theme() {
		let frame_doc = $('#tchap_frame')[0].contentWindow.document;
		frame_doc.querySelector('.mx_QuickSettingsButton').click();  
		frame_doc.querySelector('.mx_QuickThemeSwitcher .mx_Dropdown_input').click();  
		frame_doc.querySelector(`#mx_QuickSettingsButton_themePickerDropdown__${this.get_skin().color_mode()}`).click();
	}

	tchap_options() {
		let frame_doc = $('#tchap_frame')[0].contentWindow.document;
		frame_doc.querySelector('.mx_QuickSettingsButton').click();
		frame_doc.querySelector('.mx_ContextualMenu > div > .mx_AccessibleButton_kind_primary_outline').click();
	}

	tchap_disconnect() {
		let frame_doc = $('#tchap_frame')[0].contentWindow.document;
		frame_doc.querySelector('.mx_UserMenu_contextMenuButton').click();
		frame_doc.querySelector('.mx_UserMenu_iconSignOut').click();
	}
}