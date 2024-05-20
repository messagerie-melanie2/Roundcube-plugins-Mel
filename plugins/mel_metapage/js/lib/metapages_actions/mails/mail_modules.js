import { MetapageModule } from '../metapage_module.js';

export class MailModule extends MetapageModule {
	constructor() {
		super();
	}

	main() {
		super.main();
	}

	folder_list_content() {
		return $('#folderlist-content');
	}

	current_folder() {
		return rcmail.env.mailbox;
	}

	balp() {
		return 'Boite partag&AOk-e';
	}

	has_mail_selected() {
		return this.rcmail().message_list.selection.length > 0;
	}

	static Start() {
		return new this();
	}
}
