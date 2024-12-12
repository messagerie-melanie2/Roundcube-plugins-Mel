import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { ISO_FORMAT_REGEX } from '../../../mel_metapage/js/lib/constants/regexp.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Manager } from './manager.js';

export { PostComment, PostCommentView };

class PostComment {
  constructor(
    id,
    uid,
    post_id,
    user_email,
    user_name,
    content,
    created,
    likes,
    dislikes,
    parent,
    children_number,
    current_user_reacted,
  ) {
    this._init()._setup(
      id,
      uid,
      post_id,
      user_email,
      user_name,
      content,
      created,
      likes,
      dislikes,
      parent,
      children_number,
      current_user_reacted,
    );
  }

  /**
   * Initialise un objet avec des valeurs par défaut.
   *
   * Cette fonction réinitialise toutes les propriétés de l'objet, telles que
   * `uid`, `post_id`, `user_uid`, `user_name`, `content`, `created`, `like`,
   * `dislike`, `parent`, `children_number` et `current_user_reacted` à des chaînes de caractères vides.
   * Elle retourne l'objet lui-même après l'initialisation.
   *
   * @return {Object} L'objet initialisé avec des valeurs par défaut.
   */
  _init() {
    this.id = '';
    this.uid = '';
    this.post_id = '';
    this.user_email = '';
    this.user_name = '';
    this.content = '';
    this.created = '';
    this.likes = 0;
    this.dislikes = 0;
    this.parent = '';
    this.children_number = 0;
    this.current_user_reacted = '';

    return this;
  }

  /**
   * Configure les propriétés de l'objet avec les valeurs spécifiées.
   *
   * Cette fonction utilise `Object.defineProperties` pour définir les propriétés
   * `uid`, `post_id`, `user_uid`, `user_name`, `content`, `created`, `like`,
   * `dislike`, `parent`, `children_number` et `current_user_reacted` de l'objet. Chaque propriété a un getter qui
   * retourne la valeur initiale passée en paramètre, et un setter qui permet
   * de mettre à jour cette valeur.
   *
   * @param {string} id - L'identifiant de l'objet.
   * @param {string} uid - L'identifiant unique de l'objet.
   * @param {string} post_id - L'identifiant du post associé.
   * @param {string} user_email - L'email de l'utilisateur.
   * @param {string} user_name - Le nom de l'utilisateur.
   * @param {string} content - Le contenu du commentaire ou du post.
   * @param {string} created - La date de création.
   * @param {string} likes - Le nombre de likes.
   * @param {string} dislikes - Le nombre de dislikes.
   * @param {string} parent - L'Id du commentaire parent s'il existe'.
   * @param {integer} children_number - Le nombre de réponse au commentaire parent
   * @param {string} current_user_reacted - reaction de l'utilisateur courant au commentaire
   */
  _setup(
    id,
    uid,
    post_id,
    user_email,
    user_name,
    content,
    created,
    likes,
    dislikes,
    parent,
    children_number,
    current_user_reacted,
  ) {
    this.id = id;
    this.uid = uid;
    this.post_id = post_id;
    this.user_email = user_email;
    this.user_name = user_name;
    this.content = content;
    this.created = created;
    this.likes = likes !== undefined ? likes : 0; // Utilisation de 0 par défaut
    this.dislikes = dislikes !== undefined ? dislikes : 0; // Utilisation de 0 par défaut
    this.parent = parent || ''; // Valeur par défaut à une chaîne vide
    this.children_number = children_number !== undefined ? children_number : 0; // Valeur par défaut
    this.current_user_reacted = current_user_reacted || ''; // Valeur par défaut à une chaîne vide
  }

  /**
   * Enregistre ou met à jour une réaction (like ou dislike) sur un commentaire, et met à jour l'interface utilisateur.
   *
   * Cette fonction gère l'ajout ou la modification d'une réaction de l'utilisateur sur un commentaire.
   * Si une réaction (like ou dislike) est déjà présente, elle peut être annulée ou remplacée par une nouvelle réaction.
   * L'interface utilisateur est automatiquement mise à jour pour refléter le changement.
   *
   * Comportement :
   * - Envoie une requête au serveur pour enregistrer la réaction de l'utilisateur.
   * - Si l'utilisateur annule une réaction, la mise à jour visuelle correspondante est effectuée dans l'interface.
   * - Si l'utilisateur change de réaction (like vers dislike ou vice-versa), l'interface met à jour les compteurs.
   * - Les messages de confirmation ou d'erreur sont affichés en fonction de la réponse du serveur.
   *
   * @param {string} type - Le type de réaction, soit 'like' soit 'dislike'.
   * @param {string} uid - L'identifiant unique du commentaire sur lequel la réaction est appliquée.
   * @returns {Promise<Object>} Une promesse contenant la réponse du serveur, y compris le statut et le message.
   * @throws {Error} En cas d'échec lors de l'envoi de la requête ou de la mise à jour de la réaction.
   */
  async saveLikeOrDislike(type, uid) {
    try {
      // Fonction pour envoyer la requête
      const sendRequest = async (reactionType) =>
        await MelObject.Empty().http_internal_post({
          task: 'forum',
          action: 'like_comment',
          params: {
            _comment_id: this.id,
            _comment_uid: this.uid,
            _type: reactionType,
          },
        });

      // Envoie la requête avec le type de réaction (like ou dislike)
      let response = await sendRequest(type);

      // Vérifier si la réponse contient bien un message
      if (response && response.message) {
        // Afficher les autres messages spécifiques
        if (response.message === rcmail.gettext('mel_forum.like_cancelled')) {
          rcmail.display_message(response.message, 'confirmation');
        }

        if (
          response.message ===
          rcmail.gettext('mel_forum.like_cancelled_dislike_registered')
        ) {
          rcmail.display_message(response.message, 'confirmation');
        }

        if (
          response.message === rcmail.gettext('mel_forum.dislike_cancelled')
        ) {
          rcmail.display_message(response.message, 'confirmation');
        }

        if (
          response.message ===
          rcmail.gettext('mel_forum.dislike_cancelled_like_registered')
        ) {
          rcmail.display_message(response.message, 'confirmation');
        }

        // Mise à jour de l'UI en fonction de la réaction (like ou dislike)
        let likeCounterElement = $('[data-like-uid="' + uid + '"]').siblings(
          'span.ml-2',
        );
        let dislikeCounterElement = $(
          '[data-dislike-uid="' + uid + '"]',
        ).siblings('span.ml-2');
        let likeActionElement = $('[data-like-uid="' + uid + '"]');
        let dislikeActionElement = $('[data-dislike-uid="' + uid + '"]');

        // Gestion de l'annulation d'une réaction
        if (response.message.includes('annulé')) {
          if (type === 'like') {
            likeCounterElement.text(
              Math.max(0, parseInt(likeCounterElement.text()) - 1),
            );
            likeActionElement.parent().removeClass('active');
            this.current_user_reacted = '';
          } else if (type === 'dislike') {
            dislikeCounterElement.text(
              Math.max(0, parseInt(dislikeCounterElement.text()) - 1),
            );
            dislikeActionElement.parent().removeClass('active');
            this.current_user_reacted = '';
          }
        } else {
          // Gestion de l'ajout ou du changement de réaction
          if (type === 'like') {
            likeCounterElement.text(parseInt(likeCounterElement.text()) + 1);
            likeActionElement.parent().addClass('active');
            this.current_user_reacted = 'like';
            if (dislikeActionElement.parent().hasClass('active')) {
              dislikeCounterElement.text(
                Math.max(0, parseInt(dislikeCounterElement.text()) - 1),
              );
              dislikeActionElement.parent().removeClass('active');
            }
          } else if (type === 'dislike') {
            dislikeCounterElement.text(
              parseInt(dislikeCounterElement.text()) + 1,
            );
            dislikeActionElement.parent().addClass('active');
            this.current_user_reacted = 'dislike';
            if (likeActionElement.parent().hasClass('active')) {
              likeCounterElement.text(
                Math.max(0, parseInt(likeCounterElement.text()) - 1),
              );
              likeActionElement.parent().removeClass('active');
            }
          }
        }

        // Affichage des messages de succès ou d'erreur selon le statut général
        if (response.status === 'success') {
          rcmail.display_message(response.message, 'confirmation'); // message de succès
        } else {
          rcmail.display_message(response.message, 'error'); // message d'erreur
        }
      } else {
        // Si la réponse ne contient pas de message, afficher une erreur par défaut
        rcmail.display_message(
          rcmail.gettext('mel_forum.unexpected_error'),
          'error',
        );
      }

      return response;
    } catch (error) {
      // En cas d'erreur lors de la requête
      rcmail.display_message(
        rcmail.gettext('mel_forum.reaction_save_error'),
        'error',
      );
      console.error(
        rcmail.gettext('mel_forum.like_dislike_save_failure'),
        error,
      );
    }
  }

  /**
   * Bascule l'affichage des réponses d'un commentaire et met à jour l'icône de basculement.
   *
   * Cette fonction gère l'affichage des réponses d'un commentaire en les affichant ou en les masquant
   * selon leur état actuel. Elle met à jour l'icône associée pour indiquer visuellement si les réponses
   * sont visibles ou masquées. Si les réponses ne sont pas encore chargées, elles sont récupérées et
   * affichées dynamiquement.
   *
   * Comportement :
   * - Si les réponses sont masquées, elles sont chargées puis affichées, et l'icône est changée pour "arrow_drop_up".
   * - Si les réponses sont visibles, elles sont masquées et l'icône est changée pour "arrow_drop_down".
   * - Le title de la div de basculement est mis à jour pour indiquer l'action associée (voir/masquer les réponses).
   * - Les réponses ne sont chargées qu'une seule fois pour éviter les doublons.
   *
   * @param {string} id - L'identifiant unique du commentaire pour lequel les réponses doivent être basculées.
   * @returns {Promise<void>} Une promesse résolue une fois que l'opération de basculement est effectuée.
   * @throws {Error} En cas d'échec lors du chargement ou de l'affichage des réponses.
   */
  async toggleResponses(id) {
    try {
      let responseContainer = $('#responses-' + id);
      let toggleIcon = $('#toggle-icon-' + id);
      let responseDiv = $('#toggle-response-container-' + id); // Utilisation de l'ID unique pour la div complète
      this.children_number = $('#comment-id-' + this.uid).data(
        'number-children',
      );
      let numberOfResponses = this.children_number; // Nombre de réponses

      // Fonction pour mettre à jour le title au survol de la div
      const updateTitle = () => {
        let titleText = '';
        if (numberOfResponses === 1) {
          titleText = responseContainer.hasClass('hidden')
            ? rcmail.gettext('mel_forum.see_response_singular')
            : rcmail.gettext('mel_forum.hide_reply');
        } else {
          titleText = responseContainer.hasClass('hidden')
            ? `${rcmail.gettext('mel_forum.see_the')} ${numberOfResponses} ${rcmail.gettext('mel_forum.response_plural')}`
            : `${rcmail.gettext('mel_forum.hide_items')} ${numberOfResponses} ${rcmail.gettext('mel_forum.response_plural')}`;
        }
        responseDiv.attr('title', titleText);
      };

      // Ajouter un gestionnaire d'événements au survol de la div
      responseDiv.on('mouseenter', updateTitle);

      // Si le conteneur est caché, on veut l'afficher
      if (responseContainer.hasClass('hidden')) {
        BnumMessage.SetBusyLoading();

        // Charger les réponses seulement si elles ne sont pas déjà présentes
        if (!responseContainer.hasClass('loaded')) {
          responseContainer.empty(); // On vide le conteneur avant de charger pour éviter les doublons
          await Manager.displayComments(null, id); // Charger les réponses une seule fois
          responseContainer.addClass('loaded'); // Marquer les réponses comme déjà chargées
        }

        BnumMessage.StopBusyLoading();

        // Afficher les réponses
        responseContainer.removeClass('hidden');
        toggleIcon.attr('data-icon', 'arrow_drop_up'); // Changer l'icône en 'arrow_drop_up'
      } else {
        // Cacher les réponses
        responseContainer.addClass('hidden');
        toggleIcon.attr('data-icon', 'arrow_drop_down'); // Changer l'icône en 'arrow_drop_down'
      }
    } catch (error) {
      console.error(rcmail.gettext('mel_forum.toggle_replies_error'), error);
    }
  }

  /**
   * Bascule l'affichage du formulaire de réponse et gère l'état des autres formulaires de réponse.
   *
   * Cette fonction masque tous les autres formulaires de réponse et affiche ou masque celui spécifié par `uid`.
   * Lorsqu'un formulaire de réponse est affiché, elle réinitialise le contenu du textarea et met le focus dessus.
   * L'identifiant du commentaire parent est également stocké pour être utilisé lors de l'envoi de la réponse.
   *
   * @param {string|number} uid - L'identifiant unique utilisé pour cibler le formulaire de réponse à afficher/masquer.
   * @param {string|number} [parentId] - L'ID du commentaire parent auquel la réponse sera associée.
   *                                      Si non fourni, utilise l'ID du commentaire actuel.
   *
   * @async
   * @returns {Promise<void>} - Aucune valeur de retour spécifique.
   */
  async toggleReplyForm(uid, parentId) {
    let form = $('#reply-form-' + uid);
    let isVisible = !form.hasClass('hidden');

    // Masquer tous les autres formulaires de réponse
    $('#reply-form').not(form).addClass('hidden');

    // Afficher ou masquer le formulaire actuel
    form.toggleClass('hidden');

    // Stocker l'ID du parent pour l'utiliser lors de l'envoi de la réponse
    this.parent = parentId || this.id; // Enregistre l'ID du commentaire parent dans `this.parent`

    // Réinitialiser le textarea lorsque le formulaire est visible
    if (!isVisible) {
      form.find('textarea').val('').height('auto');
      form.find('.btn').show(); // Assurez-vous que les boutons sont visibles
    }

    // Focus sur le textarea lorsque le formulaire est visible
    if (!form.hasClass('hidden')) {
      form.find('textarea').focus();
    }
  }

  /**
   * Enregistre une réponse à un commentaire et met à jour l'interface utilisateur en conséquence.
   *
   * Cette fonction récupère le contenu de la réponse à partir d'une zone de texte, vérifie qu'il n'est pas vide,
   * puis envoie une requête pour enregistrer la réponse. En cas de succès :
   * - Affiche un message de confirmation.
   * - Vide la zone de texte et cache le formulaire de réponse.
   * - Affiche la nouvelle réponse dans l'interface utilisateur et met à jour le nombre de réponses.
   *
   * En cas d'échec :
   * - Affiche un message d'erreur et consigne l'erreur dans la console.
   *
   * @async
   * @function saveReply
   * @returns {Promise<void>} - Une promesse qui se résout une fois la réponse enregistrée et l'interface mise à jour.
   * @throws {Error} Si une erreur survient lors de l'envoi de la requête ou de l'enregistrement de la réponse.
   */
  async saveReply() {
    const $textarea = $('#new-response-textarea-' + this.uid);
    const replyContent = $textarea.val(); // Récupérer le contenu du commentaire
    const submitButton = $('#submit-reply'); // Sélectionner le bouton de validation

    this.children_number = $('#comment-id-' + this.uid).data('number-children');

    if (replyContent && replyContent.trim() !== '') {
      // Vérifier si le commentaire n'est pas vide

      submitButton.prop('disabled', true); // Désactiver le bouton de validation pour éviter les clics multiples

      BnumMessage.SetBusyLoading();

      try {
        const response = await MelObject.Empty().http_internal_post({
          task: 'forum',
          action: 'create_comment',
          params: {
            _post_id: this.post_id, // L'ID du post
            _content: replyContent, // Le contenu de la réponse
            _parent: this.parent, // ID du commentaire parent
          },
        });

        if (response.status === 'success') {
          rcmail.display_message(response.message, 'confirmation');

          // Vider le textarea
          $textarea.val('');

          // Fermer le formulaire en ajoutant la classe 'hidden'
          $('#reply-form-' + this.uid).addClass('hidden');

          const parent_comment_id = this.parent; // ID du commentaire parent
          let $responseContainer = $(
            `#toggle-response-container-${parent_comment_id}`,
          );

          // Vérifier si le conteneur existe
          if (!$responseContainer.length) {
            // Si le conteneur n'existe pas, le créer avec MelHtml
            this.children_number = 0;
            const reponseText = 'réponse';
            const newContainerHtml = MelHtml.start
              .div({
                id: 'toggle-response-container-' + parent_comment_id,
                class: 'forum-comment-response',
                'data-comment-id': parent_comment_id,
                tabindex: '0',
                role: 'button',
                title:
                  this.children_number === 1
                    ? rcmail.gettext('mel_forum.see_response_singular')
                    : `${rcmail.gettext('mel_forum.see_the')} ${this.children_number} ${rcmail.gettext('mel_forum.response_plural')}`,
              })
              .span({
                id: 'toggle-icon-' + parent_comment_id,
                class: 'icon',
                'data-icon': 'arrow_drop_down',
              })
              .end('span')
              .span({ class: 'ml-2' })
              .text(this.children_number + ' ' + reponseText)
              .end('span')
              .end('div')
              .div({
                id: 'responses-' + parent_comment_id,
                class: 'responses ml-4 hidden',
              })
              .end('div')
              .generate_html(true);

            // Localiser la section où insérer le conteneur
            const $responseSection = $(`#comment-id-${this.uid}`).find(
              '.forum-comment-responses',
            );
            $responseSection.html(newContainerHtml);

            // Re-sélectionner le conteneur après sa création
            $responseContainer = $(
              `#toggle-response-container-${parent_comment_id}`,
            );
          }

          // Insérer la nouvelle réponse dans le conteneur
          await Manager.displaySingleComment(response.comment);

          // Mettre à jour le nombre de réponses dans l'interface
          const currentChildrenNumber = parseInt(this.children_number) + 1; // Incrémenter le nombre de réponses
          this.children_number = currentChildrenNumber; // Mettre à jour localement le nombre de réponses
          $('#comment-id-' + this.uid).data(
            'number-children',
            this.children_number,
          );

          // Mettre à jour le texte du nombre de réponses
          const reponseText =
            currentChildrenNumber === 1
              ? rcmail.gettext('response_singular')
              : rcmail.gettext('response_plural');
          $responseContainer
            .find('span.ml-2')
            .text(currentChildrenNumber + ' ' + reponseText);

          // Mettre à jour l'attribut `title`
          $responseContainer.attr(
            'title',
            currentChildrenNumber === 1
              ? rcmail.gettext('mel_forum.see_response_singular')
              : `${rcmail.gettext('mel_forum.see_the')} ${currentChildrenNumber} ${rcmail.gettext('mel_forum.response_plural')}`,
          );
        } else {
          rcmail.display_message(response.message, 'error');
        }
      } catch (error) {
        rcmail.display_message(
          rcmail.gettext('mel_forum.reply_save_error'),
          'error',
        );
        console.error(rcmail.gettext('mel_forum.reply_save_failure'), error);
      } finally {
        BnumMessage.StopBusyLoading();

        // Réactiver le bouton de validation une fois la requête terminée
        submitButton.prop('disabled', false);
      }
    } else {
      rcmail.display_message(
        rcmail.gettext('mel_forum.comment_content_empty'),
        'error',
      );
    }
  }

  /**
   * Bascule l'affichage d'un menu contextuel et applique des actions spécifiques lorsque le menu devient visible.
   * Cette fonction permet d'afficher ou de masquer un conteneur de menu contextuel identifié par `uid`.
   * Lorsque le menu est visible, elle ajoute un écouteur d'événements pour détecter les clics extérieurs et fermer
   * le menu en conséquence. Elle gère également les événements liés aux options du menu.
   *
   * @param {string|number} uid - L'identifiant unique utilisé pour cibler le conteneur de menu.
   *
   * - Le conteneur ciblé est supposé avoir un identifiant au format `#context-menu-{uid}`.
   * - Si le conteneur devient visible, les clics en dehors du menu le referment automatiquement.
   * - Les événements sur les boutons du menu sont gérés pour fermer le menu après une sélection.
   */
  toggleMenu(uid) {
    let selectContainer = $('#context-menu-' + uid);
    let triggerButton = $('#trigger-' + uid); // Bouton more_horiz

    // Vérifier si le conteneur du menu existe
    if (selectContainer.length) {
      // Basculer l'affichage du conteneur
      selectContainer.toggleClass('hidden');

      // Si le menu est visible, ajouter un écouteur pour détecter les clics extérieurs
      if (!selectContainer.hasClass('hidden')) {
        // Ajouter un écouteur de clic sur tout le document après un léger délai
        setTimeout(() => {
          $(document).on('click.menuOutside', function (event) {
            // Vérifier si le clic est en dehors du menu et du bouton trigger
            if (
              !$(event.target).closest(selectContainer).length &&
              !$(event.target).closest(triggerButton).length
            ) {
              selectContainer.addClass('hidden'); // Masquer le menu
              $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
            }
          });

          // Ajouter un écouteur d'événements pour chaque bouton du menu
          selectContainer
            .find('.comment-options-button')
            .on('click', function () {
              selectContainer.addClass('hidden'); // Fermer le menu
              $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
            });
        }, 0); // Délai de 0 pour que l'événement de clic sur le bouton soit géré en premier

        // Empêcher la propagation du clic sur le bouton trigger pour éviter la fermeture immédiate
        triggerButton.off('click').on('click', function (event) {
          event.stopPropagation(); // Empêche la propagation du clic vers l'écouteur du document
        });
      } else {
        // Si le menu est caché, retirer l'écouteur du document
        $(document).off('click.menuOutside');
      }
    }
  }

  /**
   * Basculer l'affichage entre le texte du commentaire et le champ de texte de modification.
   *
   * Cette fonction permet d'afficher ou de masquer la section de modification du commentaire
   * en fonction de l'état actuel de l'affichage.
   *
   * @function toggleModifyComment
   * @param {string} uid - L'identifiant unique du commentaire à modifier.
   * @returns {void}
   */
  toggleModifyComment(uid) {
    let commentTextDiv = $('#comment-text-' + uid);
    let editTextDiv = $('#edit-comment-' + uid);

    // Basculer entre le content et le textarea de modification
    commentTextDiv.toggleClass('hidden');
    editTextDiv.toggleClass('hidden');
  }

  /**
   * Annule la modification du commentaire en rétablissant l'affichage initial.
   *
   * Cette fonction appelle `toggleModifyComment` pour basculer l'affichage
   * entre la section de texte et la section de modification.
   *
   * @function cancelModifyComment
   * @param {string} uid - L'identifiant unique du commentaire dont la modification est annulée.
   * @returns {void}
   */
  cancelModifyComment(uid) {
    this.toggleModifyComment(uid);
  }

  /**
   * Enregistre les modifications d'un commentaire et met à jour l'interface utilisateur en conséquence.
   *
   * @async
   * @returns {Promise<void>} - Une promesse qui se résout lorsque la modification est enregistrée et l'interface mise à jour.
   *
   * Cette fonction récupère le contenu modifié du commentaire à partir d'une zone de texte spécifique, vérifie que le contenu n'est pas vide,
   * puis envoie une requête pour enregistrer la modification. Si l'enregistrement est réussi :
   * - Affiche un message de confirmation.
   * - Cache le formulaire de modification.
   * - Met à jour le texte du commentaire dans l'interface utilisateur.
   *
   * En cas d'échec ou d'erreur lors de l'enregistrement :
   * - Affiche un message d'erreur.
   * - Enregistre l'erreur dans la console.
   */
  async modifyComment(uid) {
    const $textarea = $('#edit-comment-textarea-' + uid);
    const updatedContent = $textarea.val(); // Récupère le nouveau contenu du commentaire
    if (updatedContent && updatedContent.trim() !== '') {
      BnumMessage.SetBusyLoading();

      try {
        let response = await MelObject.Empty().http_internal_post({
          task: 'forum',
          action: 'update_comment',
          params: {
            _uid: uid, // L'ID du commentaire
            _content: updatedContent, // Le nouveau contenu
          },
        });

        if (response.status === 'success') {
          rcmail.display_message(response.message, 'confirmation');

          // Fermer le formulaire de modification en ajoutant la classe 'hidden'
          $('#edit-comment-' + uid).addClass('hidden');

          // Mettre à jour l'affichage du commentaire avec le nouveau contenu
          $('#comment-text-' + uid).replaceWith(
            '<div class="forum-comment-text" id="comment-text-' +
              uid +
              '"><p>' +
              updatedContent +
              '</p></div>',
          );
        } else if (response.status === 'error') {
          rcmail.display_message(response.message, 'error');
        }
      } catch (error) {
        rcmail.display_message(
          'Une erreur est survenue lors de la mise à jour du commentaire.',
          'error',
        );
        console.error('Erreur lors de la mise à jour du commentaire:', error);
      } finally {
        BnumMessage.StopBusyLoading();
      }
    } else {
      rcmail.display_message(
        'Le contenu du commentaire ne peut pas être vide.',
        'error',
      );
    }
  }

  /**
   * Supprime un commentaire spécifique après confirmation de l'utilisateur.
   *
   * Cette fonction envoie une requête à l'API de suppression du commentaire,
   * puis met à jour l'affichage en retirant le commentaire supprimé.
   *
   * @async
   * @function deleteComment
   * @param {string} uid - L'identifiant unique du commentaire à supprimer.
   * @returns {void}
   * @throws {Error} En cas d'échec de la suppression ou d'une erreur réseau.
   */
  async deleteComment(uid) {
    // Demander confirmation à l'utilisateur avant de supprimer
    const confirmation = confirm(
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
    );

    if (!confirmation) return;

    BnumMessage.SetBusyLoading();

    try {
      const response = await MelObject.Empty().http_internal_post({
        task: 'forum',
        action: 'delete_comment',
        params: {
          _uid: uid, // L'ID du commentaire à supprimer
          _parent: this.parent, // ID du commentaire parent
        },
      });

      const parsedResponse = JSON.parse(response);

      if (parsedResponse.status === 'success') {
        rcmail.display_message(parsedResponse.message, 'confirmation');

        // Supprimer le commentaire de l'affichage
        const commentElement = $('#comment-id-' + uid);

        if (commentElement.length > 0) {
          commentElement.remove(); // Supprimer le commentaire du DOM
        }

        // Identifier le conteneur parent des réponses à partir de l'élément supprimé
        const parent_comment_id = this.parent; // ID du commentaire parent
        const $responseContainer = $(
          `#toggle-response-container-${parent_comment_id}`,
        );
        const $parentContainer = $responseContainer.parent().parent().parent();

        // Récupérer le nombre actuel de réponses du commentaire parent
        let currentChildrenNumber = $parentContainer.data('number-children');
        currentChildrenNumber = parseInt(currentChildrenNumber) - 1;
        $parentContainer.data('number-children', currentChildrenNumber);
        // const currentChildrenNumber = parseInt(this.children_number) - 1; // Décrémenter le nombre de réponses
        // this.children_number = currentChildrenNumber; // Mettre à jour localement le nombre de réponses

        // Mettre à jour l'affichage en fonction du nouveau nombre de réponses
        if (currentChildrenNumber > 0) {
          const reponseText =
            currentChildrenNumber === 1
              ? rcmail.gettext('mel_forum.response_singular')
              : rcmail.gettext('mel_forum.response_plural');
          $responseContainer
            .find('span.ml-2')
            .text(currentChildrenNumber + ' ' + reponseText);

          // Mettre à jour l'attribut `title`
          $responseContainer.attr(
            'title',
            currentChildrenNumber === 1
              ? rcmail.gettext('mel_forum.see_response_singular')
              : `${rcmail.gettext('mel_forum.see_the')} ${currentChildrenNumber} ${rcmail.gettext('mel_forum.response_plural')}`,
          );
          // on s'assure que le conteneur des réponses est visible
          $responseContainer.removeClass('hidden');
          $(`#responses-${parent_comment_id}`).removeClass('hidden'); // Afficher le conteneur des réponses
        } else {
          // S'il n'y a plus de réponses, masquer la section des réponses et l'icône
          $responseContainer.addClass('hidden'); // Masquer la section "Voir X réponses"
          $(`#responses-${parent_comment_id}`).addClass('hidden'); // Masquer le conteneur des réponses
        }
      } else {
        rcmail.display_message(parsedResponse.message, 'error');
      }
    } catch (error) {
      rcmail.display_message(
        rcmail.gettext('mel_forum.comment_delete_error'),
        'error',
      );
      console.error(rcmail.gettext('mel_forum.comment_delete_failure'), error);
    } finally {
      BnumMessage.StopBusyLoading();
    }
  }

  /**
   * Génère le code HTML pour afficher un commentaire avec ses réactions et options associées.
   *
   * Cette fonction crée dynamiquement le HTML pour un commentaire, en intégrant des informations
   * comme l'auteur, le contenu, la date de création, ainsi que les boutons d'interaction (like, dislike, répondre).
   * Elle adapte le HTML en fonction des données spécifiques du commentaire, notamment le nombre de likes, dislikes,
   * et réponses.
   *
   * - Les classes CSS sont ajustées en fonction de la réaction de l'utilisateur (like/dislike).
   * - Le texte des réponses est singularisé ou pluralisé selon leur nombre.
   * - Un élément interactif pour afficher ou masquer les réponses est ajouté si le commentaire en contient.
   *
   * @returns {Object} - Un objet HTML généré, prêt à être inséré dans le DOM.
   */
  generateHtmlFromTemplate() {
    let likeClass =
      this.current_user_reacted === 'like'
        ? 'reaction-item active mr-3'
        : 'reaction-item mr-3';
    let dislikeClass =
      this.current_user_reacted === 'dislike'
        ? 'reaction-item active mr-3'
        : 'reaction-item mr-3';

    // Détermination du pluriel ou du singulier pour "réponse(s)"
    let reponseText =
      this.children_number > 1
        ? rcmail.gettext('mel_forum.response_plural')
        : rcmail.gettext('mel_forum.response_singular');

    // Fonction pour parser une date en français
    function parseFrenchDate(dateString) {
      // Vérifiez si la date est au format ISO (ex: "2024-10-23 12:55:47")
      const isoFormatRegex = ISO_FORMAT_REGEX;

      if (isoFormatRegex.test(dateString)) {
        // Convertir directement la chaîne ISO en objet Date
        return new Date(dateString.replace(' ', 'T')); // Remplacer l'espace par 'T' pour le format ISO
      }
      const moisFrancais = {
        janvier: 0,
        février: 1,
        mars: 2,
        avril: 3,
        mai: 4,
        juin: 5,
        juillet: 6,
        août: 7,
        septembre: 8,
        octobre: 9,
        novembre: 10,
        décembre: 11,
      };

      // Séparer la date et l'heure si une heure est incluse
      const [datePart, timePart] = dateString.split(' à ');

      // Séparer la partie date en jour, mois et année
      const dateParts = datePart.trim().split(' ');

      if (dateParts.length !== 3) {
        console.error(
          rcmail.gettext('mel_forum.invalid_date_format'),
          dateString,
        );
        return null;
      }

      const jour = parseInt(dateParts[0], 10);
      const mois = dateParts[1].toLowerCase();
      const annee = parseInt(dateParts[2], 10);

      const moisIndex = moisFrancais[mois];

      if (moisIndex === undefined) {
        console.error(rcmail.gettext('mel_forum.invalid_date_month'), mois);
        return null;
      }

      // Initialiser l'heure et les minutes à 0
      let heures = 0,
        minutes = 0;

      // Si l'heure est présente, extraire l'heure et les minutes
      if (timePart) {
        const [heuresStr, minutesStr] = timePart.split(':');
        heures = parseInt(heuresStr, 10) || 0;
        minutes = parseInt(minutesStr, 10) || 0;
      }

      // Créer l'objet Date avec la date et l'heure
      return new Date(annee, moisIndex, jour, heures, minutes);
    }

    // Fonction pour parser une date en français
    function formatCommentDate(createdDate) {
      const commentDate = parseFrenchDate(createdDate);

      // Vérifier si la date est valide
      if (!commentDate || isNaN(commentDate.getTime())) {
        console.error(rcmail.gettext('mel_forum.invalid_date'), createdDate);
        return rcmail.gettext('mel_forum.invalid_date_simple');
      }

      const currentDate = new Date();

      // Ne comparer que les jours, mois, années (ignorer heures, minutes)
      const commentDateOnly = new Date(
        commentDate.getFullYear(),
        commentDate.getMonth(),
        commentDate.getDate(),
      );
      const currentDateOnly = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
      );

      // Calculer la différence en jours uniquement
      const diffTime = currentDateOnly.getTime() - commentDateOnly.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

      const hours = commentDate.getHours().toString().padStart(2, '0');
      const minutes = commentDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}h${minutes}`;

      if (diffDays === 0) {
        return `${rcmail.gettext('mel_forum.today_at')} ${timeString}`;
      } else if (diffDays === 1) {
        return `${rcmail.gettext('mel_forum.yesterday_at')} ${timeString}`;
      } else {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = commentDate.toLocaleDateString('fr-FR', options);
        return `${dateString}`;
      }
    }

    // Préparez les données à insérer dans le template
    const data = {
      UID: this.uid,
      USER_EMAIL: this.user_email,
      USER_NAME: this.user_name,
      COMMENT_DATE: formatCommentDate(this.created),
      COMMENT_CONTENT: this.content,
      COMMENT_ID: this.id,
      LIKE_CLASS: likeClass,
      DISLIKE_CLASS: dislikeClass,
      LIKES: this.likes.toString(),
      DISLIKES: this.dislikes.toString(),
      NUMBER_CHILDREN: this.children_number,
      RESPONSE_SECTION:
        this.children_number > 0
          ? MelHtml.start
              .div({
                id: 'toggle-response-container-' + this.id,
                class: 'forum-comment-response',
                'data-comment-id': this.id,
                tabindex: '0',
                role: 'button',
                title:
                  this.children_number === 1
                    ? rcmail.gettext('mel_forum.see_response_singular')
                    : `${rcmail.gettext('mel_forum.see_the')} ${this.children_number} ${rcmail.gettext('mel_forum.response_plural')}`,
              })
              .span({
                id: 'toggle-icon-' + this.id,
                class: 'icon',
                'data-icon': 'arrow_drop_down',
              })
              .end('span')
              .span({ class: 'ml-2' })
              .text(this.children_number + ' ' + reponseText)
              .end('span')
              .end('div')
              .div({
                id: 'responses-' + this.id,
                class: 'responses ml-4 hidden',
              })
              .end('div')
              .generate_html(true)
          : '',
    };

    // Utilisation de MelTemplate
    let template = new MelTemplate()
      .setTemplateSelector('#comment-template')
      .setData(data)
      .addEvent(
        '#cancel-modify-comment',
        'click',
        this.cancelModifyComment.bind(this, this.uid),
      )
      .addEvent(
        '#submit-modify-comment',
        'click',
        this.modifyComment.bind(this, this.uid),
      )
      .addEvent(
        '.icon[data-icon="thumb_up"]',
        'click',
        this.saveLikeOrDislike.bind(this, 'like', this.uid),
      )
      .addEvent(
        '.icon[data-icon="thumb_down"]',
        'click',
        this.saveLikeOrDislike.bind(this, 'dislike', this.uid),
      )
      .addEvent(
        '.reaction-item.response',
        'click',
        this.toggleReplyForm.bind(this, this.uid, this.id),
      )
      .addEvent(
        '.icon[data-icon="more_horiz"]',
        'click',
        this.toggleMenu.bind(this, this.uid),
      )
      .addEvent(
        '.comment-options-button.edit-comment',
        'click',
        this.toggleModifyComment.bind(this, this.uid),
      )
      .addEvent(
        '.comment-options-button.delete-comment',
        'click',
        this.deleteComment.bind(this, this.uid),
      )
      .addEvent(
        '#cancel-reply',
        'click',
        this.toggleReplyForm.bind(this, this.uid, this.id),
      )
      .addEvent(
        '#submit-reply',
        'click',
        this.saveReply.bind(this, this.content),
      );

    // Ajouter l'événement pour '.forum-comment-response' seulement si elle existe
    if (this.children_number > 0) {
      template.addEvent(
        '.forum-comment-response',
        'click',
        this.toggleResponses.bind(this, this.id),
      );
    }

    // Retourner le rendu complet sans l'ajouter au DOM
    return template.render();
  }
}

class PostCommentView {
  constructor(
    post_uid,
    post_id,
    sort_order = 'date_asc',
    parent_comment_id = null,
  ) {
    this._init()._setup(post_uid, post_id, sort_order, parent_comment_id);
  }

  /**
   * Initialise l'objet avec des valeurs par défaut pour les propriétés `post_uid`, `post_id`,
   * `sort_order` et `parent_comment_id`.
   *
   * Cette fonction réinitialise les propriétés de l'objet avec des valeurs par défaut :
   * une chaîne vide pour `post_uid` et `post_id`, un tri par date ascendante pour `sort_order`,
   * et `null` pour `parent_comment_id`. Elle retourne l'objet lui-même après initialisation.
   *
   * @returns {Object} - L'objet initialisé avec les valeurs par défaut.
   */
  _init() {
    this.post_uid = '';
    this.post_id = '';
    this.sort_order = 'date_asc';
    this.parent_comment_id = null;

    return this;
  }

  /**
   * Configure les propriétés `post_uid`, `post_id`, `sort_order` et `parent_comment_id` de l'objet.
   *
   * Cette fonction initialise les propriétés de l'objet en définissant l'UID du post,
   * l'identifiant du post, l'ordre de tri des commentaires, ainsi que l'ID du commentaire parent
   * si fourni. Ces propriétés peuvent ensuite être utilisées dans d'autres méthodes.
   *
   * @param {string} post_uid - L'UID du post à configurer.
   * @param {string} post_id - L'identifiant du post à configurer.
   * @param {string} sort_order - L'ordre de tri à appliquer aux commentaires.
   * @param {string} [parent_comment_id] - L'ID du commentaire parent, si applicable.
   */
  _setup(post_uid, post_id, sort_order, parent_comment_id) {
    this.post_uid = post_uid;
    this.post_id = post_id;
    this.sort_order = sort_order;
    this.parent_comment_id = parent_comment_id;
  }

  /**
   * Récupère le commentaire associé à un post spécifique.
   *
   * Cette fonction envoie une requête asynchrone pour récupérer le commentaire
   * d'un post donné, en tenant compte de l'ordre de tri et éventuellement d'un
   * commentaire parent si fourni. Les données de réponse sont analysées et renvoyées.
   *
   * @async
   * @function getCommentByPost
   * @returns {Promise<Object>} - Les données du commentaire du post, après analyse de la réponse.
   */
  async getCommentByPost() {
    BnumMessage.SetBusyLoading();

    let return_data;

    // Préparer les données à envoyer
    let postData = {
      _post_uid: this.post_uid,
      _sort_order: this.sort_order, // Envoi du paramètre 'sort_order' au serveur
    };

    // Si un ID de commentaire parent est fourni, l'ajouter aux données
    if (this.parent_comment_id) {
      postData._comment_id = this.parent_comment_id; // Envoi de l'ID du commentaire parent si disponible
    }

    try {
      // Effectuer la requête avec les données préparées
      const datas = await MelObject.Empty().http_internal_post({
        task: 'forum',
        action: 'get_all_comments_bypost',
        params: postData, // Les données incluent l'ID du parent si fourni
      });

      return_data = JSON.parse(datas);
    } catch (error) {
      console.error(rcmail.gettext('mel_forum.comments_fetch_error'), error);
    } finally {
      BnumMessage.StopBusyLoading();
    }

    return return_data;
  }
}
