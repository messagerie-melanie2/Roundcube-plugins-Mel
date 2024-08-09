import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class Manager extends MelObject {
    constructor() {

    }

    main() {
        this.displayComments();

        this.blindActions();

        window.manager = this;
    }

    displayComments() {
        const postUid = $('#post-uid').val();
    }

    openCommentModal(uid) {
        const html = MelHtml.start
            .div({ class: 'modal-content' })
            .row({ class: 'mx-2'})
            .label({ class: 'span-mel t1 first', for: '' })
            .span({ class: 'text-danger' })
            .text('*')
            .end()
            .text(rcmail.gettext('required_fields', 'mel_forum'))
            .end()
            .
    }
}
