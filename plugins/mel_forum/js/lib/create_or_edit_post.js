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
        let config = rcmail.env.editor_config;
        rcmail.editor_init(config, 'forum-content');
        this.tags = [];
        this.displayTags();
        this.addtag();
        this.removetag();
    }

    //affiche les tags
    displayTags() {
        for(var tag of this.tags) {
            let html = JsHtml.start
                    .span({class: 'tag'}).text(`#${tag}`).span({class: 'icon-remove-tag'}).end().end();
                    $('.tag-list').append(html.generate());
        }
    }

    //ajoute un tag
    addtag() {
        $('#add-tag').on("keydown", (event) => {
            if(event.keyCode === 13) {
                let tagname = $('#add-tag').val();
                //si le tag éxiste déjà
                if (!this.tags.includes(tagname)) {
                    let html = JsHtml.start
                    .span({class: 'tag'}).text(`#${tagname}`).span({class: 'icon-remove-tag'}).end().end();
                    $('.tag-list').append(html.generate());
                    this.tags.push(tagname);
                    $('#add-tag').val('');
                    this.removetag();
                }
            }
        });

    }

    //enlève un tag
    removetag() {
        $('.icon-remove-tag').click((e) => {
            e = $(e.currentTarget);
            let parentDiv = e.closest('.tag');
            let tagname = parentDiv.text().slice(1);
            parentDiv.remove();
            let index = this.tags.indexOf(tagname);
            if (index > -1) {
                this.tags.splice(index,1);
            }
        });
    }
}