import { JsHtml } from "../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js";
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class create_or_edit_post extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        // let config = rcmail.env.editor_config;
        // rcmail.editor_init(config, 'forum-content');
        $("#reset-title-button").click(() => {
            $("#edit-title").val('');
        });
        $('#go-back-to-articles').click(() => {
            window.location.href = this.url('forum',{action:'index'});
        })
    }
}