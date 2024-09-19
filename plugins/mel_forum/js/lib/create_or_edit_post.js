import { JsHtml } from "../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js";
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelDialog, DialogPage, RcmailDialogButton } from "../../../mel_metapage/js/lib/classes/modal.js";

export class create_or_edit_post extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        $("#reset-title-button").click(() => {
            $("#edit-title").val('');
        });
        $('#go-back-to-articles').click(() => {
            window.location.href = this.url('forum',{action:'index'});
        });

        this.simplemde = new SimpleMDE({
        element: $("#MyID")[0],  // Utilisation de jQuery pour sélectionner l'élément
        toolbar: [
            "bold", "italic", "heading", "heading-smaller", "heading-bigger", "|",
            "quote", "code", "unordered-list", "ordered-list", "link", "image", "|",
            "preview", "side-by-side", "fullscreen",
            {
                name: "inserer Image",
                action: function imageuploader(editor) {
                    this.addImageDialog();
                }.bind(this),
                className: "fa fa-picture-o",
                title: "Insérer une image"
            }
        ],
        spellChecker: false
    });

        // let config = rcmail.env.editor_config;
        // rcmail.editor_init(config, 'forum-content');
        this.tags = [];
        this.displayTags();
        this.addTag();
        this.removeTag();
        this.save();
    }

    //affiche les tags
    displayTags() {
        for(var tag of this.tags) {
            let html = JsHtml.start
                    .span({class: 'tag', tabindex: 0}).text(`#${tag}`).span({class: 'icon-remove-tag'}).end().end();
                    $('.tag-list').append(html.generate());
        }
    }

    //ajoute un tag
    addTag() {
        $('#add-tag').on("keydown", (event) => {
            if(event.keyCode === 13) {
                let tagname = $('#add-tag').val();
                //si le tag éxiste déjà
                if (!this.tags.includes(tagname)) {
                    let html = JsHtml.start
                    .span({class: 'tag', tabindex: 0}).text(`#${tagname}`).span({class: 'icon-remove-tag'}).end().end();
                    $('.tag-list').append(html.generate());
                    this.tags.push(tagname);
                    $('#add-tag').val('');
                    this.removeTag();
                }
            }
        });

    }

    //enlève un tag
    removeTag() {
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
        $('.tag').on("keydown", (e) => {
            if(e.keyCode === 13) {
                e = $(e.currentTarget);
                let tagname = e.text().slice(1);
                e.remove();
                let index = this.tags.indexOf(tagname);
                if (index > -1) {
                    this.tags.splice(index,1);
                }
            }
        })
    }
    // gestion du bouton sauvegarder
    save() {
        $('#submit-post').click(() => {
            debugger;
            this.http_internal_post(
                {
                    task: 'forum',
                    action: 'send_post',
                    params: {
                        _title: $("#edit-title").val(),
                        _content: this.simplemde.value(),
                        _settings: JSON.stringify({extwin: $('#rcmfd_message_extwin')[0].checked}),
                        _tags: this.tags,
                    },
                    on_success: () => {},
                }
            );
        });
    }
    switchPageDialog(dialog_page) {
        this.dialog.switch_page(dialog_page);
    }

    addImageDialog() {
        let dialog;
        //prettier-ignore
        let addimagehtml = JsHtml.start 
        .input({id:"image-link", type:"text", placeholder:"Entrer le liens de l'image à ajouter"})
        .button({class:"upload-image-button", type:'button'}).attr('onclick', this.switchPageDialog.bind(this, 'upload-image'))
            .text('upload')
        .end();
        
        let addImage = new DialogPage("add-image", {
            content: addimagehtml,
            title: "Ajouter une image",
            buttons: [new RcmailDialogButton('Fermer', {
                click: (e) => {
                    dialog.hide();
                }
            })]
        })
        let uploadimagehtml = JsHtml.start.input({id:"image-uploader", type:"file", accept:"image/png, image/jpeg"})
        let uploadImage = new DialogPage("upload-image", {
            content: uploadimagehtml,
            title: "Importer une image",
            buttons: [
                new RcmailDialogButton('Retour', {
                    click: (e) => {
                        dialog.switch_page('add-image');
                    }
                }), 
                new RcmailDialogButton('Importer', {
                    click: (e) => {
                        this.http_internal_post(
                            {
                                task: 'forum',
                                action: 'upload_image',
                                params: {
                                    _image: $('#image-uploader').get(0).files,
                                },
                                on_success: () => {},
                            }
                        );
                    }
                }),
            ]
        })

        debugger;
        dialog = new MelDialog(
            addImage,
            {height: 200} 
        );
        dialog.add_page(uploadImage, {});
        dialog.show();
        this.dialog = dialog;
    }
}