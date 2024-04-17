import { Mel_Promise } from '../mel_promise.js';
import { MailActionsModifiers } from './mails/actions_modifiers.js';
import { MailFavoriteFolder } from './mails/favorite_folder.js';
import { FolderColor } from './mails/folder_color.js';
import { FolderIcon } from './mails/folder_icon.js';
import { UIMailHeaderManager } from './mails/header_manager.js';
import { MetapageMailDelayedModule } from './mails/mail_delayed.js';
import { MetapageModule } from './metapage_module.js';

export class MetapageMailModule extends MetapageModule {
	constructor() {
		super();
	}

	/**
	 * @protected
	 * @async Actions principales
	 */
	async main() {
		super.main();

		MailActionsModifiers.Start();
		MetapageMailDelayedModule.Start();
		let favorites = MailFavoriteFolder.Start();

		Mel_Promise.wait(() => favorites.load_finished === true, 60).always(() => {
			FolderColor.Start();
			FolderIcon.Start();
		});
		UIMailHeaderManager.Start();
	}
}
