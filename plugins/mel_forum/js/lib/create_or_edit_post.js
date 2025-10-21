import { JsHtml } from '../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import {
  MelDialog,
  DialogPage,
  RcmailDialogButton,
} from '../../../mel_metapage/js/lib/classes/modal.js';
import { CursorUtils } from '../../../mel_metapage/js/lib/helpers/cursorUtils.js';

export class create_or_edit_post extends MelObject {
  constructor() {
    super();

    this.post_id = rcmail.env.post_id; // Initialisation de `post_id` depuis l'environnement
  }

  // region MAIN

  main() {
    super.main();

    let post = this.get_env('post');

    this.workspace = post.workspace;

    this.post_id = post.id;

    if (this.get_env('is_editing') === true) {
      this.displayArticleThumbnail(post.image_url);
    }

    $('#reset-title-button').click(() => {
      $('#edit-title').val('');
    });
    $('#go-back-to-articles').on('keydown', (event) => {
      if (event.keyCode === 13) {
        // Touche "Entrée"
        $('#go-back-to-articles').click();
      }
    });
    $('#go-back-to-articles').click(() => {
      CursorUtils.SetLoadingCursor();
      $('#submit-post').click();
      $('#cancel-post').click();
      window.location.href = this.url('forum', {
        action: 'index',
        params: { _workspace_uid: this.workspace },
      });
    });

    let config = rcmail.env.editor_config;
    config.mode = 'forum';
    rcmail.addEventListener('editor-init', (args) => {
      args.config.setup_callback = (editor) => {
        editor.on('init', function () {
          editor.setContent(post.content);
        });
      };
    });
    rcmail.editor_init(config, 'forum-content');
    rcmail.editor.file_picker_callback = () => {
      this.addImageDialog();
    };
    $('#edit-title').val(post.title);
    $('#enable_comment').prop('checked', post.settings?.comments || false);
    this.post_uid = post.uid;
    this.tags = post.tags || [];
    this.displayTags();
    this.addTagListenner();
    this.removeTag();
    this.saveButton();
    this.publishButton();
    this.cancelButton();
  }

  // endregion
  // region TAG

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
    for (let tag of this.tags) {
      let html = JsHtml.start
        .span({ class: 'tag', tabindex: 0 })
        .text(`#${tag}`)
        .span({ class: 'icon-remove-tag' })
        .end()
        .end();
      $('.tag-list').append(html.generate());
    }
  }

  /**
   * bind l'action d'ajout de tag à son boutton.
   *
   * - Surveille l'événement `keydown` sur le champ d'ajout de tag (`#add-tag`).
   * - Si le tag n'existe pas déjà, il est ajouté à la liste et affiché.
   * - Le champ de saisie est réinitialisé après l'ajout du tag.
   * - Permet la suppression de tags via la fonction `removeTag`.
   *
   * @returns {void}
   */
  addTagListenner() {
    this.autocompleDatalist('#suggestions', this.get_env('wsp_tags'));
    $('#add-tag').on('keydown', (event) => {
      if (event.keyCode === 13) {
        // Touche "Entrée"
        this._addTag();
      }
    });
    $('#add-tag').on('focusout', () => {
      this._addTag();
    });
    $('#add-tag-button').on('click', () => {
      this._addTag();
    });
  }

  /**
   * Ajoute un tag à la liste si il existe déjà il n'est pas ajouté
   */
  _addTag() {
    let tagname = $('#add-tag').val().trim();
    if (tagname) {
      // Forcer la première lettre en majuscule
      tagname = tagname.charAt(0).toUpperCase() + tagname.slice(1);
      tagname = mel_metapage.Functions.remove_accents(tagname);
      tagname = tagname.split(' ').join('_');

      // Vérifie si le tag existe déjà
      if (!this.tags.includes(tagname)) {
        let html = JsHtml.start
          .span({ class: 'tag', tabindex: 0 })
          .text(`#${tagname}`)
          .span({ class: 'icon-remove-tag' })
          .end()
          .end();
        $('.tag-list').append(html.generate());
        this.tags.push(tagname);
        $('#add-tag').val(''); // Réinitialise le champ de saisie
        this.removeTag(); // Ajoute l'événement de suppression au tag
      } else {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.tag_already_exists'),
          eMessageType.Error,
        );
      }
    }
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
        this.tags.splice(index, 1);
      }
    });
    $('.tag').on('keydown', (e) => {
      if (e.keyCode === 13) {
        e = $(e.currentTarget);
        let tagname = e.text().slice(1);
        e.remove();
        let index = this.tags.indexOf(tagname);
        if (index > -1) {
          this.tags.splice(index, 1);
        }
      }
    });
  }

  /**
   * Autocomplétion pour la création de tag
   * @param {string} datalistSelector selecteur jquery de la div de suggestion
   * @param {string[]} dataList tableau de référence
   */
  autocompleDatalist(datalistSelector, dataList) {
    const datalist = $(datalistSelector);

    // Vider l'ancienne liste et ajouter les nouvelles suggestions
    datalist.empty();
    for (const item of dataList) {
      datalist.append(`<option value="${item}">`);
    }
  }
  // endregion

  // region Boutons principaux

  /**
   * Met les boutons de sauvegarde, de publication et d'annulation en mode "chargement".
   * @private
   */
  #_setButtonsLoading() {
    $('#cancel-post').attr('loading', 1);
    $('#submit-post').attr('loading', 1);
    $('#publish-post').attr('loading', 1);
  }

  /**
   * Désactive le mode "chargement" des boutons de sauvegarde, de publication et d'annulation.
   * @private
   */
  #_unsetButtonLoading() {
    $('#cancel-post').removeAttr('loading');
    $('#submit-post').removeAttr('loading');
    $('#publish-post').removeAttr('loading');
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

      // Récupérer l'URL de la miniature actuelle
      const thumbnailContainer = document.getElementById('article-thumbnail-container');
      const currentThumbnail = thumbnailContainer?.querySelector('img')?.src || '';

      // Vérifier s'il s'agit d'une création ou d'une modification
      const isModification = !!this.post_id; // true si post_id est défini (modification)
      let content = tinymce.activeEditor.getContent();
      let title = $('#edit-title').val().trim();
      if (title !== '' && content !== '') {
        CursorUtils.SetLoadingCursor();
        this.#_setButtonsLoading();
        this.http_internal_post({
          task: 'forum',
          action: 'send_post',
          params: {
            _workspace_uid: this.workspace,
            _workspace: this.workspace,
            _title: title,
            _content: content,
            _uid: this.post_uid,
            _isdraft: true,
            _settings: JSON.stringify({
              extwin: true,
              comments: $('#enable_comment')[0].checked,
              miniature_url: currentThumbnail // AJOUT: Inclure la miniature
            }),
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

            BnumMessage.DisplayMessage(message, eMessageType.Success);
            rcmail.triggerEvent('forum.post.updated');
          },
          on_error: () => {
            BnumMessage.DisplayMessage(
              rcmail.gettext('mel_forum.article_save_error'),
              eMessageType.Error,
            );
            window.location.href = this.url('forum', {
              action: 'post',
              params: { _uid: postUid, _workspace_uid: this.workspace },
            });
          },
        }).always(() => {
          CursorUtils.ResetCursor();
          this.#_unsetButtonLoading();
        });
      } else {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.fields_required'),
          eMessageType.Error,
        );
      }
    });
  }

  /**
   * Publie le post.
   *
   * - Récupère les données du post (titre, contenu, tags, etc.) et vérifie si c'est une création ou une modification.
   * - Envoie les données du post via une requête HTTP interne.
   * - Affiche un message de succès ou d'erreur en fonction du résultat.
   * - Redirige l'utilisateur vers la page appropriée en fonction de l'action effectuée (création ou modification).
   *
   * @returns {void}
   */
  publishButton() {
    $('#publish-post').click(() => {
      this.post_id = this.get_env('post').id;
      this.post_uid = this.get_env('post').uid;

      // Récupérer l'URL de la miniature actuelle
      const thumbnailContainer = document.getElementById('article-thumbnail-container');
      const currentThumbnail = thumbnailContainer?.querySelector('img')?.src || '';

      // Vérifier s'il s'agit d'une création ou d'une modification
      const isModification = !!this.post_id; // true si un identifiant existe (modification)
      const isEditing = this.get_env('is_editing');
      const wasDraft = this.get_env('post')?.isdraft ?? false; // Vérifie si c'était un brouillon
      let content = tinymce.activeEditor.getContent();
      let title = $('#edit-title').val().trim();
      if (title !== '' && content !== '') {
        CursorUtils.SetLoadingCursor();
        this.#_setButtonsLoading();
        this.http_internal_post({
          task: 'forum',
          action: 'send_post',
          params: {
            _workspace_uid: this.workspace,
            _workspace: this.workspace,
            _title: title,
            _content: content,
            _uid: this.post_uid,
            _isdraft: false,
            _is_editing: isEditing,
            _was_draft: wasDraft,
            _settings: JSON.stringify({
              extwin: true,
              comments: $('#enable_comment')[0].checked,
              miniature_url: currentThumbnail // AJOUT: Inclure la miniature
            }),
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

            BnumMessage.DisplayMessage(message, eMessageType.Success);

            let postUid = this.post_uid;
            rcmail.triggerEvent('forum.post.updated');
            window.location.href = this.url('forum', {
              action: 'post',
              params: { _uid: postUid, _workspace_uid: this.workspace },
            });
          },
          on_error: () => {
            BnumMessage.DisplayMessage(
              rcmail.gettext('mel_forum.article_save_error'),
              eMessageType.Error,
            );
            window.location.href = this.url('forum', {
              action: 'post',
              params: { _uid: postUid, _workspace_uid: this.workspace },
            });
          },
        }).always(() => {
          this.#_unsetButtonLoading();
        });
      } else {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.fields_required'),
          eMessageType.Error,
        );
      }
    });
  }

  /**
   * Gère l'annulation de la création ou modification d'un post.
   *
   * - Vérifie si les champs titre et contenu sont vides.
   * - Si les champs sont vides, le post est supprimé via une requête HTTP interne et l'utilisateur est redirigé vers la page d'accueil.
   * - Si les champs ne sont pas vides, l'utilisateur est simplement redirigé vers la page d'accueil sans suppression du post.
   *
   * @returns {void}
   */
  cancelButton() {
    $('#cancel-post').click(() => {
      // Récupérer les valeurs des champs
      const _title = $('#edit-title').val();
      const _content = tinymce.activeEditor.getContent();
      const _uid = this.post_uid;

      CursorUtils.SetLoadingCursor();
      if (!_title.trim() && !_content.trim()) {
        // Les champs sont vides, suppression du post

        this.http_internal_post({
          task: 'forum',
          action: 'delete_post',
          params: {
            _uid: _uid,
            _workspace_uid: this.workspace,
          },
          processData: false,
          contentType: false,
        })
          .then(() => {
            // Redirection vers la page d'accueil après la suppression
            window.location.href = this.url('forum', {
              action: 'index',
              params: { _workspace_uid: this.workspace },
            });
          })
          .catch((error) => {
            console.error(
              rcmail.gettext('mel_forum.delete_post_failure'),
              error,
            );
          });
      } else {
        // Redirige directement vers la page d'accueil sans suppression
        window.location.href = this.url('forum', {
          action: 'index',
          params: { _workspace_uid: this.workspace },
        });
      }
    });
  }

  // endregion
  // region Modale import image

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
    $('.tox-dialog-wrap').css('display', 'none');
    let dialog;
    //prettier-ignore
    let uploadimagehtml = JsHtml.start.input({ id:'image-uploader', type:'file', accept:'image/png, image/jpeg' });
    let uploadImage = new DialogPage('upload-image', {
      content: uploadimagehtml,
      title: 'Importer une image',
      buttons: [
        new RcmailDialogButton('Retour', {
          click: () => {
            dialog.hide();
            $('.tox-dialog-wrap').css('display', 'flex');
          },
        }),
        new RcmailDialogButton('Importer', {
          click: () => {
            const fileInput = $('#image-uploader').get(0);
            const files = fileInput.files;

            if (files.length > 0) {
              let fileReader = new FileReader();
              fileReader.onload = () => {
                this.http_internal_post({
                  task: 'forum',
                  action: 'upload_image',
                  params: {
                    _file: fileReader.result,
                    _post_id: this.post_id,
                    _workspace_uid: this.workspace,
                  },
                  processData: false, // Empêche jQuery de traiter les données
                  contentType: false, // Empêche jQuery d'ajouter des headers incorrects
                  on_success: (data) => {
                    // Gérer la réponse du serveur ici
                    let response = JSON.parse(data);
                    $('input.tox-textfield').first().val(response.url);
                    $('.tox-dialog-wrap').css('display', 'flex');
                    // let uid = response.image_uid;
                    dialog.hide();
                  },
                  on_error: (err) => {
                    console.log("Erreur d'upload", err);
                  },
                });
              };
              fileReader.readAsDataURL(files[0]);
            }
          },
        }),
      ],
    });
    dialog = new MelDialog(uploadImage, {
      height: 200,
      close: () => {
        $('.tox-dialog-wrap').css('display', 'flex');
      },
    });
    dialog.show();
    this.dialog = dialog;
  }

  // endregion
  // region Choix de la miniature

  /**
   * Affiche (ou masque) la miniature de l'article
   * @param {string} imageUrl - L'URL de l'image de l'article
   */
  displayArticleThumbnail(imageUrl) {
    const container = document.getElementById('article-thumbnail-container');
    const col = document.getElementById('thumbnail-col');
    
    if (!container || !col) return;

    container.innerHTML = '';

    if (imageUrl && imageUrl.trim() !== '') {
      col.style.display = 'block';
      
      const imageHtml = `
        <div class="thumbnail-wrapper position-relative d-inline-block">
          <img src="${imageUrl}" alt="Miniature de l'article"
              class="img-thumbnail post-image clickable-thumbnail w-100"
              style="cursor:pointer;"
              title="Cliquer pour changer la miniature">
          <!-- Icône visible en permanence -->
          <div class="thumbnail-icon position-absolute" style="bottom: 8px; left: 8px;">
            <span class="material-symbols-outlined text-dark bg-white bg-opacity-90 rounded-circle p-1 shadow-lg">
              edit
            </span>
          </div>
        </div>
      `;
      container.innerHTML = imageHtml;
      
      const img = container.querySelector('.clickable-thumbnail');
      if (img) {
        img.addEventListener('click', () => {
          this.openThumbnailModal();
        });
      }
    } 
  }

  /**
   * Ouvre une modale MelDialog pour sélectionner la miniature
   */
  openThumbnailModal() {
    const postData = this.get_env('post');
    const imgs = postData.images || [];

    let picturesDialog;

    const gallery = this._buildGallery(imgs);

    const thumbPage = new DialogPage('thumbnail-selection', {
      content: gallery,
      title: rcmail.gettext('mel_forum.change_thumbnail'),
      buttons: [
        new RcmailDialogButton('Fermer', {
          click: () => picturesDialog.hide(),
        }),
        new RcmailDialogButton('Valider', {
          click: () => {
            this._confirmThumbnailSelection();
            picturesDialog.hide();
          },
        }),
      ],
    });

    picturesDialog = new MelDialog(thumbPage, { height: 400, width: 600 });
    picturesDialog.show();
    this.dialog = picturesDialog;

    setTimeout(() => {
      this._setupThumbnailSelection();
    }, 100);
  }

  /**
   * Construit la galerie d'images avec JsHtml et retourne builder
   */
  _buildGallery(imgs) {
    if (!imgs || imgs.length === 0) {
      return JsHtml.start
        .div({ class: 'text-center p-4' })
          .p({ class: 'text-muted' })
            .text(rcmail.gettext('mel_forum.no_picture'))
          .end()
        .end();
    }

    let html = JsHtml.start
      .div({ class: 'p-3' })
        .p({ class: 'text-center mb-3' })
          .text(rcmail.gettext('mel_forum.select_picture'))
        .end()
        .div({ class: 'row' });

    imgs.forEach((img, i) => {
      html = html
        .div({ class: 'col-6 col-md-4 mb-3' })
          .div({
            class: 'thumbnail-item text-center border rounded p-2',
            style: 'cursor: pointer;',
            'data-image-url': img.url,
            'data-image-index': i
          })
            .img({
              src: img.url,
              alt: `Image ${i + 1}`,
              style: 'max-width: 100%; max-height: 100px; object-fit: cover;'
            })
          .end()
          .div({ class: 'small text-muted mt-1' })
            .text(`Image ${i + 1}`)
          .end()
        .end();
    });

    return html
          .end()
        .end();
  }

  /**
   * Configure la sélection des miniatures dans la modale
   */
  _setupThumbnailSelection() {
    const thumbnailItems = document.querySelectorAll('.thumbnail-item');
    this.selectedThumbnail = null;

    thumbnailItems.forEach(item => {
      item.addEventListener('click', () => {
        // Retirer la sélection précédente
        thumbnailItems.forEach(i => {
          i.classList.remove('border-primary', 'selected');
          i.style.borderWidth = '1px';
        });
        
        // Ajouter la sélection actuelle
        item.classList.add('border-primary', 'selected');
        item.style.borderWidth = '2px';
        
        // Stocker l'URL sélectionnée
        this.selectedThumbnail = item.dataset.imageUrl;
      });
    });
  }

  /**
   * Confirme la sélection et met à jour la miniature
   */
  _confirmThumbnailSelection() {
    if (this.selectedThumbnail) {
      
      // Mettre à jour l'affichage
      this.displayArticleThumbnail(this.selectedThumbnail);
      
      // Message de confirmation
      BnumMessage.DisplayMessage(
        rcmail.gettext('mel_forum.thumbnail_updated'),
        eMessageType.Confirmation,
      );
      
    } else {
      BnumMessage.DisplayMessage(
        rcmail.gettext('mel_forum.error_select_picture'),
        eMessageType.Warning,
      );
    }
  }
}
