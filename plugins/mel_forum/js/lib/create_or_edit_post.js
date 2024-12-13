import { JsHtml } from "../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js";
import { BnumMessage, eMessageType } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelDialog, DialogPage, RcmailDialogButton } from "../../../mel_metapage/js/lib/classes/modal.js";

export class create_or_edit_post extends MelObject {
    constructor() {
        super();

        this.post_id = rcmail.env.post_id;    // Initialisation de `post_id` depuis l'environnement
    }

    main() {
        super.main();

        let post = this.get_env('post');
        
        this.workspace = post.workspace;

        this.post_id = post.id;

        $("#reset-title-button").click(() => {
            $("#edit-title").val('');
        });
        $('#go-back-to-articles').click(() => {
            window.location.href = this.url('forum',{action:'index', params:{'workspace_uid': this.workspace}});
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
        $('#enable_comment').prop('checked', post.settings.comments);
        this.post_uid = post.uid;
        this.tags = post.tags || [];
        this.displayTags();
        this.addTag();
        this.removeTag();
        this.saveButton();
        this.cancelButton();
    }

    /**
     * Affiche la liste des tags dans l'élément HTML avec la classe "tag-list".
     *
     * - Vide d'abord la liste existante de tags.
     * - Ajoute chaque tag de la liste `this.tags` sous forme d'élément HTML.
     * - Chaque tag est affiché avec un symbole de suppression.
     *
     * @returns {void}
     */
    displayTags() {
        $('.tag-list').empty(); // Vide la liste de tags existante avant d'ajouter les nouveaux tags
        for(var tag of this.tags) {
            let html = JsHtml.start
                    .span({class: 'tag', tabindex: 0}).text(`#${tag}`).span({class: 'icon-remove-tag'}).end().end();
                    $('.tag-list').append(html.generate());
        }
    }

    /**
     * Ajoute un nouveau tag à la liste lorsque la touche "Entrée" est pressée.
     *
     * - Surveille l'événement `keydown` sur le champ d'ajout de tag (`#add-tag`).
     * - Si le tag n'existe pas déjà, il est ajouté à la liste et affiché.
     * - Le champ de saisie est réinitialisé après l'ajout du tag.
     * - Permet la suppression de tags via la fonction `removeTag`.
     *
     * @returns {void}
     */
    addTag() {
        $('#add-tag').on("keydown", (event) => {
            if(event.keyCode === 13) {
                let tagname = $('#add-tag').val();
                // vérifie si le tag éxiste déjà
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

    /**
     * Supprimer un tag de la liste, soit en cliquant sur l'icône de suppression, soit en appuyant sur la touche "Entrée".
     *
     * - Surveille l'événement `click` sur les icônes de suppression des tags et les supprime de l'affichage et de la liste `this.tags`.
     * - Permet également de supprimer un tag en appuyant sur la touche "Entrée" tout en étant sur un tag.
     *
     * @returns {void}
     */
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

    /**
     * Gère l'envoi du post, soit pour la création, soit pour la modification.
     *
     * - Récupère les données du post (titre, contenu, tags, etc.) et vérifie si c'est une création ou une modification.
     * - Envoie les données du post via une requête HTTP interne.
     * - Affiche un message de succès ou d'erreur en fonction du résultat.
     * - Redirige l'utilisateur vers la page appropriée en fonction de l'action effectuée (création ou modification).
     *
     * @returns {void}
     */
    saveButton() {
        $('#submit-post').click(() => {
            this.post_id = this.get_env('post').id;

            // Vérifier s'il s'agit d'une création ou d'une modification
        const isModification = !!this.post_id; // true si post_id est défini (modification)

            this.http_internal_post(
                {
                    task: 'forum',
                    action: 'send_post',
                    params: {
                        _workspace: this.workspace,
                        _title: $("#edit-title").val(),
                        _content: tinymce.activeEditor.getContent(),
                        _uid: this.post_uid,
                        _settings: JSON.stringify({extwin: true, comments: $('#enable_comment')[0].checked}),
                        _tags: this.tags,
                        _post_id: this.post_id,
                    },
                    processData: false,
                    contentType: false,
                    on_success: () => {
                        // Message différent selon le type d'action
                        const message = isModification
                        ? rcmail.gettext('mel_forum.edit_saved_success')
                        : rcmail.gettext('mel_forum.article_created_success');
                    
                        BnumMessage.DisplayMessage(
                            message,
                            eMessageType.Success,
                        );

                        let postUid = this.post_uid;
                        rcmail.triggerEvent('forum.post.updated');
                        window.location.href = this.url('forum', {action:'post',params:{'_uid' : postUid, '_workspace_uid' : this.workspace}});
                    },
                    on_error: (err) => {
                        BnumMessage.DisplayMessage(
                            rcmail.gettext('mel_forum.article_save_error'),
                        eMessageType.Error,
                        );
                        window.location.href = this.url('forum', {action:'post',params:{'_uid' : postUid, '_workspace_uid' : this.workspace}});
                    }
                }
            );
        });
    }

    /**
     * Gère l'annulation de la création ou modification d'un post.
     *
     * - Vérifie si les champs titre et contenu sont vides.
     * - Si les champs sont vides, le post est supprimé via une requête HTTP interne et l'utilisateur est redirigé vers la page d'accueil.
     * - Si les champs ne sont pas vides, l'utilisateur est simplement redirigé vers la page d'accueil sans suppression du post.
     *
     * @param {string} post_uid - Identifiant unique du post à supprimer en cas de suppression.
     * @returns {void}
     */
    cancelButton(post_uid) {
        $('#cancel-post').click(() => {
            // Récupérer les valeurs des champs
            const _title = $("#edit-title").val();
            const _content = tinymce.activeEditor.getContent();
            const _uid = this.post_uid
            
            if (!_title.trim() && !_content.trim()) {
                // Les champs sont vides, suppression du post
                
                this.http_internal_post({
                    task: 'forum',
                    action: 'delete_post',
                    params: {
                        _uid: _uid
                    },
                    processData: false,
                    contentType: false,
                }).then(() => {
                    // Supprimer l'article de l'affichage
                    const postElement = $('#post-' + post_uid);
                    if (postElement.length > 0) {
                        postElement.remove(); // Supprimer l'article du DOM
                    }
                    // Redirection vers la page d'accueil après la suppression
                    window.location.href = this.url('forum', {action: 'index'});
                }).catch(error => {
                    console.error(rcmail.gettext('mel_forum.delete_post_failure'), error);
                });
            } else {
                // Redirige directement vers la page d'accueil sans suppression
                window.location.href = this.url('forum', {action: 'index',params: {'_workspace_uid': this.workspace}});
            }
        });
    }

    /**
     * Bascule vers une nouvelle page de dialogue.
     *
     * - Utilise la méthode `switch_page` pour changer la page du dialogue actuel.
     *
     * @param {string} dialog_page - Identifiant de la page du dialogue à afficher.
     * @returns {void}
     */
    switchPageDialog(dialog_page) {
        this.dialog.switch_page(dialog_page);
    }

    /**
     * Ouvre une boîte de dialogue pour importer une image dans un post.
     *
     * - Cache la pop-up de TinyMCE pendant l'importation de l'image.
     * - Permet à l'utilisateur de sélectionner une image à importer.
     * - Envoie l'image au serveur via une requête HTTP interne.
     * - En cas de succès, insère l'URL de l'image dans le champ de texte et affiche la pop-up TinyMCE.
     * - Fournit des boutons pour annuler ou importer l'image.
     *
     * @returns {void}
     */
    addImageDialog() {
        this.post_id = this.get_env('post').id;
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