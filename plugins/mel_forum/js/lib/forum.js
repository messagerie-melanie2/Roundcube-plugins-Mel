import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { CursorUtils } from '../../../mel_metapage/js/lib/helpers/cursorUtils.js';
import { formatPostDate } from './utils.js';

export class Forum extends MelObject {
  constructor() {
    super();
  }

  /**
   * initialise les variables et l'affichage
   */
  main() {
    super.main();
    this.workspace = this.get_env('workspace_uid');
    this.offset = 0;
    this.locked = false;
    this.limit = 20;
    this.sortBy = 'created';
    this.asc = false;
    this.tags = [];
    this.scrollPercentage = 0.7;
    this.handleScroll = this.checkScroll.bind(this);
    this.searchString = null;
    this.display_fav = false;
    this.display_draft = false;
    this.initButtons();
    this.initSortSelect();
    this.initPostDisplay();
  }

  /**
   * Initialise les actions de la page
   */
  initButtons() {
    //bouton d'ajout d'article
    $('#forum-button-add').click(() => {
      window.location.href = this.url('forum', {
        action: 'create_or_edit_post',
        params: { _workspace_uid: this.workspace },
      });
    });
    //affichage des boutons favoris
    $('.favorite').click((event) => {
      event.stopPropagation();
      if ($(this).text() === 'star_border') {
        // Si elle est vide, la remplir
        $(this).text('star');
      } else {
        // Sinon, la remettre en vide
        $(this).text('star_border');
      }
    });
    //affichage de tout les brouillons pour les admins
    if (this.get_env('is_admin')) {
      $('#forum-sort-select');
      let draftOption = MelHtml.start
        .option({ value: 'display_all_draft' })
        .text(rcmail.gettext('mel_forum.display_draft'))
        .end();
      $('#forum-display-select').append(draftOption.generate());
    }
    //gestion du scroll sur la page
    document
      .querySelector('.content')
      .addEventListener('scroll', this.handleScroll);
    //gestion de la recherche
    $('#post-search-input').on('keydown', (event) => {
      if (event.keyCode === 13) {
        this.searchPosts();
      }
    });
    //bouton recherche
    $('#post-search-button').on('click', () => {
      this.searchPosts();
    });

    //gestion du boutons de suprression de texte de la barre de recherche
    const searchInput = $('#post-search-input');
    const clearButton = $('#clear-button');
    if (searchInput.val() !== '') {
      this.toggleClearButton();
    }

    searchInput.on('input change', this.toggleClearButton);

    clearButton.click(() => {
      searchInput.val(''); // Vide la recherche
      clearButton.hide(); // Cache le bouton
      searchInput.focus();
      this.searchPosts();
    });

    //bouton refresh
    $('#refresh').on('click', () => {
      clearButton.click();
    });

    //gestion du scroll sur la page
    document.querySelector('.content').addEventListener('scroll', () => {
      const scrollPos = document.querySelector('.content').scrollTop;
      if (scrollPos === 0) {
        $('#backToTop').addClass('hidden');
      } else {
        $('#backToTop').removeClass('hidden');
      }
    });

    //action backToTop
    $('#backToTop').click(() => {
      document.querySelector('.content').scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  /**
   * Affiche ou non la croix pour supprimer le texte de la barre de recherche
   */
  toggleClearButton() {
    const searchInput = $('#post-search-input');
    const clearButton = $('#clear-button');
    if (searchInput.val()) {
      clearButton.show();
    } else {
      clearButton.hide();
    }
  }

  /**
   * met à jour les valeur de tri d'articles
   */
  updateSort() {
    switch ($('#forum-sort-select')[0].value) {
      case 'date_asc':
        this.sortBy = 'created';
        this.asc = true;
        break;
      case 'date_desc':
        this.sortBy = 'created';
        this.asc = false;
        break;
      case 'comment_desc':
        this.sortBy = 'comments';
        this.asc = false;
        break;
      case 'comment_asc':
        this.sortBy = 'comments';
        this.asc = true;
        break;
      case 'reaction_desc':
        this.sortBy = 'reactions';
        this.asc = false;
        break;
      case 'reaction_asc':
        this.sortBy = 'reactions';
        this.asc = true;
        break;
      default:
        console.log('Option non reconnue');
    }
  }

  /**
   * met à jour les valeur de tri d'articles
   */
  updateDisplay() {
    switch ($('#forum-display-select')[0].value) {
      case 'display_posts':
        this.draft = false;
        this.display_fav = false;
        this.display_draft = false;
        break;
      case 'display_fav_only':
        this.draft = false;
        this.display_fav = true;
        this.display_draft = false;
        break;
      case 'display_my_draft':
        this.draft = true;
        this.display_fav = false;
        this.display_draft = true;
        break;
      case 'display_all_draft':
        this.draft = 'all';
        this.display_fav = false;
        this.display_draft = true;
        break;
      default:
        console.log('Option non reconnue');
    }
  }

  /**
   * Charge les posts en fonction du mode de tri de l'ordre et de l'offset
   */
  loadPosts() {
    //On empêche de faire un appel tant que le précédent n'est pas finit
    this.lock = true;

    CursorUtils.SetLoadingCursor();

    BnumMessage.SetBusyLoading();
    this.http_internal_get({
      task: 'forum',
      action: 'get_posts_data',
      params: {
        _workspace_uid: this.workspace,
        _offset: this.offset,
        _order: this.sortBy,
        _asc: this.asc,
        _search: encodeURIComponent(this.searchString),
        _tags: this.tags,
        _fav_only: this.display_fav,
        _pin: true,
        _draft: this.draft,
      },
      processData: false,
      contentType: false,
      on_success: (datas) => {
        if (datas === '[]') {
          document
            .querySelector('.content')
            .removeEventListener('scroll', this.handleScroll);
        }
        let posts = JSON.parse(datas);
        this.displayPost(posts);
        BnumMessage.StopBusyLoading();
        this.lock = false;
        this.searchString = null;
        this.tags = [];

        CursorUtils.ResetCursor();
      },
      on_error: () => {
        this.lock = false;

        BnumMessage.StopBusyLoading();

        CursorUtils.ResetCursor();
      },
    });
  }

  /*
   * Initialise les actions du select de tri
   */
  initSortSelect() {
    $('#forum-sort-select').on('change', () => {
      //on reset l'event listenner du scroll
      document
        .querySelector('.content')
        .removeEventListener('scroll', this.handleScroll);
      document
        .querySelector('.content')
        .addEventListener('scroll', this.handleScroll);

      this.updateSort();
      this.updateDisplay();
      //vide l'affichage de posts actuel
      $('#post-area').empty();
      //on reset le offset car on recharge les posts du début
      this.offset = 0;
      this.loadPosts();
    });
    $('#forum-display-select').on('change', () => {
      //on reset l'event listenner du scroll
      document
        .querySelector('.content')
        .removeEventListener('scroll', this.handleScroll);
      document
        .querySelector('.content')
        .addEventListener('scroll', this.handleScroll);

      this.updateSort();
      this.updateDisplay();
      //vide l'affichage de posts actuel
      $('#post-area').empty();
      //on reset le offset car on recharge les posts du début
      this.offset = 0;
      this.loadPosts();
    });
  }

  /**
   * cherche les articles suivants au scroll
   */
  checkScroll() {
    const scrollHeight = document.querySelector('.content').scrollHeight;
    const scrollPos = document.querySelector('.content').scrollTop;

    if (scrollPos / scrollHeight >= this.scrollPercentage && !this.lock) {
      this.updateSort();
      this.updateDisplay();
      this.loadPosts();
    }
  }

  /**
   * Affiche les posts correspondant au champ recherche
   */
  searchPosts() {
    this.searchString = urlencode($('#post-search-input').val());
    this.offset = 0;
    $('#post-area').empty();
    this.updateSort();
    this.updateDisplay();
    this.loadPosts();
  }

  /**
   * Ajoute un article aux favoris
   *
   * fais un appel ajax pour ajouter aux user prefs le favori
   * @param {*} post_uid
   * @param {*} event
   */
  addToFavorite(post_uid, event) {
    if (event) {
      // Gestion des interactions clavier
      if (
        event.type === 'keydown' &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault(); // Empêche le défilement ou autre comportement par défaut
        event.stopPropagation();
      } else if (event.type === 'click') {
        event.preventDefault(); // Empêche l'action par défaut des clics
        event.stopPropagation();
      } else {
        // Si ce n'est ni un clic ni un clavier, ne pas continuer
        return;
      }
    }

    CursorUtils.SetLoadingCursor();

    let workspace = this.get_env('workspace_uid');
    this.http_internal_post({
      task: 'forum',
      action: 'manage_favorite',
      params: {
        _workspace_uid: workspace,
        _article_uid: post_uid,
      },
      processData: false,
      contentType: false,
      on_success: () => {
        let div = $('#favorite-' + post_uid);
        if (div.hasClass('filled')) {
          div.removeClass('filled');
        } else {
          div.addClass('filled');
        }
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.fav_updated'),
          eMessageType.Confirmation,
        );
        CursorUtils.ResetCursor();
      },
      on_error: () => {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.error_editing'),
          eMessageType.Error,
        );
      },
    });
  }

  /**
   * Affiche le menu d'un article.
   *
   * - Gère les événements clavier et souris pour assurer l'accessibilité.
   * - Empêche les comportements par défaut et la propagation de certains événements.
   * - Gère les écouteurs d'événements pour détecter les clics à l'extérieur et fermer le menu.
   *
   * @param {string} post_uid - Identifiant unique du post.
   * @param {Event} [event] - L'événement déclencheur du basculement, optionnel.
   * @returns {void}
   */
  toggleMenuPost(post_uid, event) {
    // Vérification si un événement est fourni
    if (event) {
      // Gestion des interactions clavier
      if (
        event.type === 'keydown' &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault(); // Empêche le défilement ou autre comportement par défaut
        event.stopPropagation();
      } else if (event.type === 'click') {
        event.preventDefault(); // Empêche l'action par défaut des clics
        event.stopPropagation();
      } else {
        // Si ce n'est ni un clic ni une interaction clavier valide, ne pas continuer
        return;
      }
    }

    let selectContainer = $('#post-context-menu-' + post_uid);
    let triggerButton = $('#trigger-' + post_uid); // Bouton more_vert

    // Vérifier si le conteneur du menu existe
    if (selectContainer.length) {
      // Basculer l'affichage du conteneur
      selectContainer.toggleClass('hidden');

      // Si le menu est visible, ajouter un écouteur pour détecter les clics extérieurs
      if (!selectContainer.hasClass('hidden')) {
        // Ajouter un écouteur de clic sur tout le document après un léger délai
        setTimeout(() => {
          $(document).on('click.menuOutside', function (e) {
            // Vérifier si le clic est en dehors du menu et du bouton trigger
            if (
              !$(e.target).closest(selectContainer).length &&
              !$(e.target).closest(triggerButton).length
            ) {
              selectContainer.addClass('hidden'); // Masquer le menu
              $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
            }
          });

          // Ajouter un écouteur d'événements pour chaque bouton du menu
          selectContainer.find('.post-options-button').on('click', function () {
            selectContainer.addClass('hidden'); // Fermer le menu
            $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
          });
        }, 0); // Délai de 0 pour que l'événement de clic sur le bouton soit géré en premier

        // Empêcher la propagation du clic sur le bouton trigger pour éviter la fermeture immédiate
        triggerButton.off('click').on('click', function (e) {
          e.stopPropagation(); // Empêche la propagation du clic vers l'écouteur du document
        });
      } else {
        // Si le menu est caché, retirer l'écouteur du document
        $(document).off('click.menuOutside');
      }
    }
  }

  /**
   * Permet d'éditer un post.
   *
   * - Empêche les comportements par défaut et la propagation de l'événement.
   * - Construit l'URL d'édition en utilisant l'uid du post.
   *
   * @param {string} post_uid - Identifiant unique du post.
   * @param {Event} event - L'événement déclencheur de l'action.
   * @returns {void}
   */
  editPost(post_uid, event) {
    event.preventDefault();
    event.stopPropagation();

    CursorUtils.SetLoadingCursor();

    // Rediriger vers la page d'édition avec l'UID du post
    window.location.href = this.url('forum', {
      action: 'create_or_edit_post',
      params: { _uid: post_uid, _workspace_uid: this.workspace },
    });
  }

  /**
   * Supprime un post spécifique après confirmation de l'utilisateur.
   *
   * - Empêche les comportements par défaut et la propagation de l'événement.
   * - Affiche une boîte de dialogue de confirmation avant de procéder.
   * - Envoie une requête HTTP pour supprimer le post.
   * - Gère les retours de succès ou d'erreur et met à jour l'affichage en conséquence.
   *
   * @param {string} post_uid - Identifiant unique du post à supprimer.
   * @param {Event} event - L'événement déclencheur de l'action.
   * @returns {void}
   */
  deletePost(post_uid, event) {
    event.preventDefault();
    event.stopPropagation();

    CursorUtils.SetLoadingCursor();

    // Demander confirmation à l'utilisateur avant de supprimer
    const confirmation = confirm(
      rcmail.gettext('mel_forum.delete_post_confirm'),
    );
    if (!confirmation) return; // Arrêter la fonction si l'utilisateur annule

    // Envoi d'une requête HTTP pour supprimer le post
    this.http_internal_post({
      task: 'forum',
      action: 'delete_post',
      params: {
        _uid: post_uid,
        _workspace_uid: this.workspace,
      },
      processData: false,
      contentType: false,
      on_success: (response) => {
        const parsedResponse = JSON.parse(response);

        if (parsedResponse.status === 'success') {
          // Affichage du message de succès
          BnumMessage.DisplayMessage(
            parsedResponse.message ||
              rcmail.gettext('mel_forum.delete_post_success'),
            eMessageType.Confirmation,
          );

          // Supprimer l'article de l'affichage
          const postElement = $('#post-' + post_uid);
          if (postElement.length > 0) {
            postElement.remove(); // Supprimer l'article du DOM
            rcmail.triggerEvent('forum.post.delete');
          }

          CursorUtils.ResetCursor();
        } else {
          // Affichage du message d'erreur en cas d'échec
          BnumMessage.DisplayMessage(
            parsedResponse.message ||
              rcmail.gettext('mel_forum.delete_post_failure'),
            eMessageType.Error,
          );
        }
      },
      on_error: () => {
        // Affichage du message d'erreur en cas de problème avec la requête
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.delete_post_failure'),
          eMessageType.Error,
        );
      },
    });
  }

  /**
   * Récupère le lien a href le plus proche et le copie dans le presse papier
   * @param {*} event
   */
  copyPostLink(event) {
    event.preventDefault();
    event.stopPropagation();
    let url = event.currentTarget
      .closest('a')
      .getAttribute('href')
      .replaceAll('&_is_from=iframe', '&_force_bnum=1');
    navigator.clipboard.writeText(url).then(() => {
      BnumMessage.DisplayMessage(
        rcmail.gettext('mel_forum.link_copied'),
        eMessageType.Confirmation,
      );
    });
  }

  /**
   * met le post passé en paramètre en épingler / le désépingle
   * @param {string} post_uid
   * @param {event} event
   * @returns {void}
   */
  pinPost(post_uid, event) {
    event.preventDefault();
    event.stopPropagation();

    CursorUtils.SetLoadingCursor();

    this.http_internal_post({
      task: 'forum',
      action: 'pin_post',
      params: {
        _workspace_uid: this.get_env('workspace_uid'),
        _post_id: post_uid,
      },
      processData: false,
      contentType: false,
      on_success: () => {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.saved'),
          eMessageType.Confirmation,
        );
        //modifier l'apparence du bouton épingler
        let pin_button = $('#pin_' + post_uid);
        let iconSpan = pin_button.find('.icon');
        let textSpan = pin_button.find('.post-options-text');
        let currentIcon = iconSpan.attr('data-icon');
        let other_buttons = $('.pin-post');
        other_buttons.each(function () {
          //nettoyer les autres boutons
          var button = $(this);
          button.find('.icon').attr('data-icon', 'keep');
          button
            .find('.post-options-text')
            .text(rcmail.gettext('mel_forum.pin_article'));
        });
        //toggle le boutons sur lequel on cliqué
        if (currentIcon === 'keep_off') {
          iconSpan.attr('data-icon', 'keep');
          textSpan.text(rcmail.gettext('mel_forum.pin_article'));
          $('.pin').addClass('hidden');
          $('.post_pinned').removeClass('post_pinned');
        } else {
          iconSpan.attr('data-icon', 'keep_off');
          textSpan.text(rcmail.gettext('mel_forum.unpin_article'));
          //on passe le post en haut de la liste
          let post = $('#post-' + post_uid);
          $('#post-area').prepend(post);
          //on enlève le pin du post épinglé d'avant et on le met sur le nouveau
          $('.post_pinned').removeClass('post_pinned');
          post.addClass('post_pinned');
          $('.pin').addClass('hidden');
          post.find('.pin').removeClass('hidden');
        }

        CursorUtils.ResetCursor();
      },
      on_error: () => {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.error_editing'),
          eMessageType.Error,
        );
      },
    });
  }

  /**
   * Affiche les posts comportant un tag
   * @param {*} tag_id
   * @param {*} tag_name
   * @param {*} event
   */
  searchPostByTag(tag_id, tag_name, event) {
    event.preventDefault();
    event.stopPropagation();
    this.offset = 0;
    this.tags.push(tag_id);
    $('#post-area').empty();
    this.updateSort();
    this.updateDisplay();
    this.loadPosts();
    $('#post-search-input')
      .val('#' + tag_name)
      .change();
  }

  /**
   * Met à jour le compteur de like
   * @param {*} span élément html à mettre à jour
   * @param {*} value modification apportée au compteur
   */
  updateCounter(span, value) {
    let currentValue = parseInt(span.text()) || 0; // Récupérer la valeur actuelle
    let newValue = currentValue + value;
    span.text(newValue);
  }

  /**
   * Met à jour le title de la reaction
   * @param {external:jQuery} div élément html à mettre à jour
   * @param {external:jQuery} counter div du compteur de reaction
   * @param {'like' | 'dislike'} type type de la reaction (like ou dislike)
   * @param {boolean} add booleen true si on ajoute une reaction false si on l'enlève
   */
  updateTitle(div, counter, type, add) {
    let currentValue = +(counter.text() || 0);
    let newstring = div.attr('title');
    let dis = type === 'like' ? '' : 'dis';
    switch (currentValue) {
      case 0:
        newstring = this.gettext('mel_forum.' + dis + 'like_action');
        break;
      case 1:
        if (add) {
          newstring =
            this.get_env('user_fullname') +
            this.gettext('mel_forum.' + dis + 'liked_this_sing');
        } else {
          newstring = newstring
            .replace(this.get_env('user_fullname'), '')
            .replace(', ', '')
            .replace(
              this.gettext('mel_forum.' + dis + 'liked_this_plural'),
              this.gettext('mel_forum.' + dis + 'liked_this_sing'),
            );
        }
        break;
      default:
        if (add) {
          newstring =
            this.get_env('user_fullname') +
            ', ' +
            newstring.replace(
              this.gettext('mel_forum.' + dis + 'liked_this_sing'),
              this.gettext('mel_forum.' + dis + 'liked_this_plural'),
            );
        } else {
          newstring = newstring.replace(this.get_env('user_fullname'), '');
        }
        break;
    }
    div.attr('title', newstring);
  }

  /**
   * Gestion des likes et dislike des posts
   * @param {*} type type de la reaction
   * @param {*} post_id
   * @param {*} post_uid
   * @param {*} event
   */
  addLikeOrDislike(type, post_id, post_uid, event) {
    // Vérification si un événement est fourni
    if (event) {
      // Gestion des interactions clavier
      if (
        event.type === 'keydown' &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault(); // Empêche le défilement ou autre comportement par défaut
        event.stopPropagation();
      } else if (event.type === 'click') {
        event.preventDefault(); // Empêche l'action par défaut des clics
        event.stopPropagation();
      } else {
        // Si ce n'est ni un clic ni une interaction clavier, ne pas continuer
        return;
      }
    }
    this.http_internal_post({
      task: 'forum',
      action: 'manage_reaction',
      params: {
        _workspace_uid: this.get_env('workspace_uid'),
        _post_id: post_id,
        _type: type,
      },
      processData: false,
      contentType: false,
      on_success: (response) => {
        let like_div = $('#add_like-' + post_uid);
        let dislike_div = $('#add_dislike-' + post_uid);
        let like_counter = like_div.find('span.ml-2');
        let dislike_counter = dislike_div.find('span.ml-2');

        let opposite_type = type === 'like' ? 'dislike' : 'like';
        let target_div = type === 'like' ? like_div : dislike_div;
        let target_counter = type === 'like' ? like_counter : dislike_counter;
        let opposite_div = type === 'like' ? dislike_div : like_div;
        let opposite_counter = type === 'like' ? dislike_counter : like_counter;

        if (target_div.hasClass('filled')) {
          target_div.removeClass('filled');
          this.updateCounter(target_counter, -1);
          // true signifie qu'on ajoute la réaction
          this.updateTitle(target_div, target_counter, type, false);
        } else {
          target_div.addClass('filled');
          this.updateCounter(target_counter, 1);
          // true signifie qu'on ajoute la réaction
          this.updateTitle(target_div, target_counter, type, true);

          if (opposite_div.hasClass('filled')) {
            opposite_div.removeClass('filled');
            this.updateCounter(opposite_counter, -1);
            // false signifie qu'on enlève la réaction
            this.updateTitle(
              opposite_div,
              opposite_counter,
              opposite_type,
              false,
            );
          }
        }
      },
      on_error: (err) => {
        BnumMessage.DisplayMessage(
          rcmail.gettext('mel_forum.error_editing'),
          eMessageType.Error,
        );
      },
    });
  }

  /**
   * ouvre l'article sur la section commentaires
   * @param {*} post_link lien du post
   * @param {*} event
   * @returns
   */
  openComments(post_link, event) {
    if (event) {
      // Gestion des interactions clavier
      if (
        event.type === 'keydown' &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault(); // Empêche le défilement ou autre comportement par défaut
        event.stopPropagation();
      } else if (event.type === 'click') {
        event.preventDefault(); // Empêche l'action par défaut des clics
        event.stopPropagation();
      } else {
        // Si ce n'est ni un clic ni une interaction clavier, ne pas continuer
        return;
      }
    }
    window.location.href = post_link + '#comment-section';
  }

  //region AFFICHAGE des posts

  /**
   * initialise l'affichage des posts au chargement de la page
   * @param {*} event
   */
  initPostDisplay() {
    const posts = this.get_env('posts_data');
    if (posts.length === 0) {
      this.displayNoPost();
    }
    this.displayPost(posts);
  }

  /**
   * affiche les posts passés en paramètres dans la div post-area
   * @param {*} posts
   */
  displayPost(posts) {
    CursorUtils.SetLoadingCursor();

    // Vérifier si l'utilisateur souhaite afficher uniquement les favoris
    if (this.display_fav) {
      // Filtrer les posts pour ne garder que les favoris
      const favoritePosts = Object.values(posts).filter(
        (post) => post.favorite,
      );

      if (favoritePosts.length === 0) {
        // Si aucun favori, afficher un message
        this.displayNoFavorite();
        return; // Arrêter l'exécution ici
      }

      // Afficher uniquement les posts favoris
      posts = favoritePosts;
    }
    // Vérifier si l'utilisateur souhaite afficher uniquement les brouillons
    if (this.display_draft) {
      if (posts.length === 0) {
        // Si aucun brouillon, afficher un message
        this.displayNoDraft();
        return; // Arrêter l'exécution ici
      }
    }

    let post;
    let data;
    for (let postId in posts) {
      post = posts[postId];

      // Vérifiez si une image est présente
      const hasImage = post.image_url && post.image_url.trim() !== '';

      data = {
        POST_LINK: post.post_link,
        POST_CREATOR: post.post_creator,
        CREATOR_EMAIL: post.creator_email,
        POST_DATE: formatPostDate(post.creation_date),
        TITLE_FULL_DATE: post.formatted_full_date,
        UID: post.uid,
        POST_CONTENT_CLASS: hasImage
          ? 'col-md-8 col-xl-10'
          : 'col-12 no-image-padding',
        POST_TITLE: post.title,
        POST_SUMMARY: post.summary,
        POST_IMAGE: post.image_url,
        POST_IMAGE_SECTION: hasImage
          ? `<div class="col-12 col-md-4 col-xl-2">
                     <img src="${post.image_url}" alt="" class="post-image">
                   </div>`
          : '', // Vide si aucune image n'est présente
        //POST_COUNT_REACTION: post.reaction,
        POST_LIKE_NAMES:
          post.like_reactions.join(', ') +
          (post.like_count > 1
            ? this.gettext('mel_forum.liked_this_plural')
            : post.like_count === 1
              ? this.gettext('mel_forum.liked_this_sing')
              : this.gettext('mel_forum.like_action')),
        POST_DISLIKE_NAMES:
          post.dislike_reactions +
          (post.dislike_count > 1
            ? this.gettext('mel_forum.disliked_this_plural')
            : post.dislike_count === 1
              ? this.gettext('mel_forum.disliked_this_sing')
              : this.gettext('mel_forum.dislike_action')),
        POST_THUMB_UP: post.like_count.toString(),
        POST_THUMB_DOWN: post.dislike_count.toString(),
        POST_COMMENTS: post.comment_count.toString(),
        POST_FAVORITE: MelHtml.start
          .tag('i', {
            id: 'favorite-' + post.uid,
            tabindex: '0',
            title: post.favorite
              ? 'Supprimer de mes favoris'
              : 'Ajouter à mes favoris',
            class: `hoverable icon favorite material-symbols-outlined ${post.favorite ? 'filled' : ''}`,
          })
          .text('star_border')
          .end()
          .generate_html({}),
        POST_IS_LIKED: post.isliked ? 'filled' : '',
        POST_IS_DISLIKED: post.isdisliked ? 'filled' : '',
        HAS_OWNER_RIGHTS: post.has_owner_rights ? '' : 'hidden',
        IS_ADMIN: post.is_admin ? '' : 'hidden',
        COMMENTS_ENABLED: post.settings?.comments ? '' : 'hidden',
        IS_PINNED: post.pinned ? '' : 'hidden',
        POST_PINNED: post.pinned ? 'post_pinned' : '',
        POST_PINNED_LOGO: post.pinned ? 'keep_off' : 'keep',
        POST_PINNED_TEXT: post.pinned
          ? this.gettext('mel_forum.unpin_article')
          : this.gettext('mel_forum.pin_article'),
      };

      let template = new MelTemplate()
        .setTemplateSelector('#post_template')
        .setData(data)
        .addEvent(
          '#favorite-' + post.uid,
          'click',
          this.addToFavorite.bind(this, post.uid),
        )
        .addEvent(
          '#favorite-' + post.uid,
          'keydown',
          this.addToFavorite.bind(this, post.uid),
        ) // Gestion au Clavier
        .addEvent(
          '#add_like-' + post.uid,
          'click',
          this.addLikeOrDislike.bind(this, 'like', post.id, post.uid),
        )
        .addEvent(
          '#add_like-' + post.uid,
          'keydown',
          this.addLikeOrDislike.bind(this, 'like', post.id, post.uid),
        ) // Gestion au clavier
        .addEvent(
          '#add_dislike-' + post.uid,
          'click',
          this.addLikeOrDislike.bind(this, 'dislike', post.id, post.uid),
        )
        .addEvent(
          '#add_dislike-' + post.uid,
          'keydown',
          this.addLikeOrDislike.bind(this, 'dislike', post.id, post.uid),
        ) // Gestion au clavier
        .addEvent(
          '#add_comment-' + post.uid,
          'click',
          this.openComments.bind(this, post.post_link),
        )
        .addEvent(
          '#add_comment-' + post.uid,
          'keydown',
          this.openComments.bind(this, post.post_link),
        ) // Gestion au clavier
        .addEvent(
          '#more-' + post.uid,
          'click',
          this.toggleMenuPost.bind(this, post.uid),
        )
        .addEvent(
          '#more-' + post.uid,
          'keydown',
          this.toggleMenuPost.bind(this, post.uid),
        ) // Gestion au clavier
        .addEvent(
          '.post-options-button.edit-post',
          'click',
          this.editPost.bind(this, post.uid),
        ) // Ajout du gestionnaire pour "Modifier l'article"
        .addEvent(
          '.post-options-button.edit-post',
          'keydown',
          this.editPost.bind(this, post.uid),
        ) // Gestion au clavier
        .addEvent(
          '.post-options-button.delete-post',
          'click',
          this.deletePost.bind(this, post.uid),
        ) // Ajout du gestionnaire pour "Modifier l'article"
        .addEvent(
          '.post-options-button.delete-post',
          'keydown',
          this.deletePost.bind(this, post.uid),
        ) // Gestion au clavier
        .addEvent(
          '.post-options-button.copy-post',
          'click',
          this.copyPostLink.bind(this),
        )
        .addEvent(
          '.post-options-button.copy-post',
          'Keydown',
          this.copyPostLink.bind(this),
        ) // Gestion au clavier
        .addEvent(
          '.post-options-button.pin-post',
          'click',
          this.pinPost.bind(this, post.uid),
        )
        .addEvent(
          '.post-options-button.pin-post',
          'Keydown',
          this.pinPost.bind(this, post.uid),
        ); // Gestion au clavier
      //.addEvent(balise, action, fonction)

      $('#post-area').append(...template.render());

      // Rendre chaque post cliquable au clavier
      const postElement = document.getElementById(`post-${post.uid}`);
      postElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const link = postElement.querySelector('.post-card');
          if (link) {
            link.click(); // Simule un clic sur le lien
          }
        }
      });

      for (let tag in post.tags) {
        let tagName = post.tags[tag].name;
        tagName = tagName.charAt(0).toUpperCase() + tagName.slice(1);
        let tag_data = {
          TAG_NAME: '#' + post.tags[tag].name,
          TAG_ID: post.tags[tag].id,
        };
        let tag_template = new MelTemplate()
          .setTemplateSelector('#tag_template')
          .setData(tag_data)
          .addEvent(
            '.tag-' + post.tags[tag].id,
            'click',
            this.searchPostByTag.bind(
              this,
              post.tags[tag].id,
              post.tags[tag].name,
            ),
          );
        $('#tag-area-' + post.uid).append(...tag_template.render());
      }
      this.offset++;
    }

    CursorUtils.ResetCursor();
  }

  //endregion
  //region Absence de post

  /**
   * Affiche un message indiquant qu'il n'y a aucun post dans l'espace de travail
   */
  displayNoPost() {
    let noPostDiv = MelHtml.start
      .span({ class: 'ml-2' })
      .text(rcmail.gettext('mel_forum.no_post'))
      .end();
    $('#post-area').append(noPostDiv.generate());
  }

  /**
   * Affiche un message indiquant qu'il n'y a aucun favori
   */
  displayNoFavorite() {
    let noFavoriteDiv = MelHtml.start
      .span({ class: 'ml-2' })
      .text(rcmail.gettext('mel_forum.no_favorites'))
      .end();
    $('#post-area').append(noFavoriteDiv.generate());
  }

  /**
   * Affiche un message indiquant qu'il n'y a aucun brouillon
   */
  displayNoDraft() {
    let noDraftDiv = MelHtml.start
      .span({ class: 'ml-2' })
      .text(rcmail.gettext('mel_forum.no_draft'))
      .end();
    $('#post-area').append(noDraftDiv.generate());
  }

  //endregion
}
