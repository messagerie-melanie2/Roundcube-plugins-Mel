import { MailModule } from './mail_modules.js';

export class MailActionsModifiers extends MailModule {
	constructor() {
		super();
	}

	main() {
		super.main();

		this.modify_open_command();
	}

	modify_open_command() {
		const rcmail_command = rcmail.command_handler;

		rcmail.command_handler = function (command, props, obj, event) {
			var uid = this.get_single_uid();
			if (command === 'open' && (uid || uid === 0)) {
				window.open(
					this.url('show', this.params_from_uid(uid, { _extwin: 1 })),
					'_blank',
					'popup',
				);
				return;
			}

			rcmail_command.call(this, command, props, obj, event);
		}.bind(rcmail);
	}
}
