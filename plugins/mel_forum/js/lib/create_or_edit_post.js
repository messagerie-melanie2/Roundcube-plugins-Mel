import { JsHtml } from "../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js";
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelDialog, DialogPage, RcmailDialogButton } from "../../../mel_metapage/js/lib/classes/modal.js";

export class create_or_edit_post extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();

        let post = this.get_env('post');

        this.post_id = post.id;

        $("#reset-title-button").click(() => {
            $("#edit-title").val('');
        });
        $('#go-back-to-articles').click(() => {
            window.location.href = this.url('forum',{action:'index'});
        });
 
        
        let config = rcmail.env.editor_config;
        config.mode = 'forum';
        rcmail.addEventListener('editor-init',(args)=> {
            args.config.setup_callback = (editor) =>{
                    editor.on('init', function (e) {
                      editor.setContent(post.content);
                    });
            };
        })
        rcmail.editor_init(config, 'forum-content');
        rcmail.editor.file_picker_callback = (callback, value, meta) => {
            this.addImageDialog();
        };
        $("#edit-title").val(post.title);
        this.post_uid = post.uid;
        this.tags = post.tags || [];
        //TODO récupérer le workspaces via l'url ou le post
        this.workspace = 'workspace-test';
        this.displayTags();
        this.addTag();
        this.removeTag();
        this.saveButton();
        this.cancelButton();
    }

    //affiche les tags
    displayTags() {
        $('.tag-list').empty(); // Vide la liste de tags existante avant d'ajouter les nouveaux tags
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
        });
    }
    // gestion du bouton sauvegarder
    saveButton() {
        $('#submit-post').click(() => {
            this.http_internal_post(
                {
                    task: 'forum',
                    action: 'send_post',
                    params: {
                        _workspace: this.workspace,
                        _title: $("#edit-title").val(),
                        _content: tinymce.activeEditor.getContent(),
                        _uid: this.post_uid,
                        _settings: JSON.stringify({extwin: $('#rcmfd_message_extwin')[0].checked, comments: $('#enable_comment')[0].checked}),
                        _tags: this.tags,
                    },
                    processData: false,
                    contentType: false,
                    on_success: () => {
                        console.log('succès');
                        let postUid = this.post_uid;
                        // TODO Voir autre solution pour obtenir l'url
                        window.location.href = this.url('forum', {action:'post'}) + `&_uid=${postUid}` ;
                    },
                    on_error: (err) => {
                        console.log('Erreur d\'enregistrement');
                        window.location.href = this.url('forum', {action:'index'});
                    }
                }
            );
        });
    }
    cancelButton() {
        $('#cancel-post').click(() => {
            this.http_internal_post(
                {
                    task: 'forum',
                    action: 'delete_post',
                    params: {
                        _uid: this.post_uid,
                    },
                    processData: false,
                    contentType: false,
                    on_success: () => {
                        window.location.href = this.url('forum', {action:'index'});
                    },
                    on_error: (err) => {
                        console.log('Erreur d\'enregistrement');
                    }
                }
            );
        });
    }

    switchPageDialog(dialog_page) {
        this.dialog.switch_page(dialog_page);
    }

    addImageDialog() {
        debugger;
        // cacher la pop up de tiny mce le temps de faire le traitement avec notre modale 
        $('.tox-dialog-wrap').css("display","none");
        let dialog;
        //prettier-ignore
        let uploadimagehtml = JsHtml.start.input({id:"image-uploader", type:"file", accept:"image/png, image/jpeg"})
        let uploadImage = new DialogPage("upload-image", {
            content: uploadimagehtml,
            title: "Importer une image",
            buttons: [
                new RcmailDialogButton('Retour', {
                    click: (e) => {
                        dialog.hide();
                        $('.tox-dialog-wrap').css("display","flex");
                    }
                }), 
                new RcmailDialogButton('Importer', {
                    click: (e) => {
                        const fileInput = $('#image-uploader').get(0);
                        const files = fileInput.files;

                        if (files.length > 0) {

                            let fileReader = new FileReader();
                            fileReader.onload = () => {
                                this.http_internal_post(
                                    {
                                        task: 'forum',
                                        action: 'upload_image',
                                        params: {_file: fileReader.result, _post_id: this.post_id}, 
                                        processData: false, // Empêche jQuery de traiter les données
                                        contentType: false, // Empêche jQuery d'ajouter des headers incorrects
                                        on_success: (data) => {
                                            // Gérer la réponse du serveur ici
                                            let response = JSON.parse(data);
                                            $('input.tox-textfield').first().val(response.url);
                                            $('.tox-dialog-wrap').css("display","flex");
                                            // let uid = response.image_uid;
                                            dialog.hide();
                                        },
                                        on_error: (err) => {
                                            console.log('Erreur d\'upload', err);
                                        }
                                    }
                                );
                            }
                            fileReader.readAsDataURL(files[0]);
                            
                        }
                    }
                }),
            ]
        })
        dialog = new MelDialog(
            uploadImage,
            {
                height: 200,
                close: () => {$('.tox-dialog-wrap').css("display","flex");},
            } 
        );
        dialog.show();
        this.dialog = dialog;
    }
    
}