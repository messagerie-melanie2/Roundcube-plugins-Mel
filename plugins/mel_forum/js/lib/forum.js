import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { BnumMessage, eMessageType } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

export class Forum extends MelObject {
    constructor() {
        super();
    }

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
        this.searchString = null
        this.display_fav = false;
        this.initButtons();
        this.initSortSelect();
        this.initPostDisplay();

    }

    /**
     * Initialise les actions de la page
     */
    initButtons() {
        $('#forum-button-add').click(() => {
            window.location.href = this.url('forum', {action:'create_or_edit_post', params:{'_workspace_uid':this.workspace}});
        });
        $('.favorite').click(() => {
            event.stopPropagation();
            if ($(this).text() === 'star_border') {
                // Si elle est vide, la remplir
                $(this).text('star');
            } else {
                // Sinon, la remettre en vide
                $(this).text('star_border');
            }
        });
        $('#display-fav-only').on('change', () => {
            this.offset = 0;
            if ($('#display-fav-only').is(':checked')) {
                this.display_fav = true;
            } else {
                this.display_fav = false;
            }
            this.updateSort();
            $('#post-area').empty();
            this.loadPosts();
        });

        document.querySelector('.content').addEventListener("scroll", this.handleScroll);
        $('#post-search-input').on("keydown", (event) => {
            if(event.keyCode === 13) {
                this.searchPosts();
            }
        });
        $('#post-search-button').on('click',() => {
            this.searchPosts();
        });
    }

    /**
     * met à jour les valeur de tri d'articles
     */
    updateSort() {
        switch ($("#forum-sort-select")[0].value){
            case "date_asc":
                this.sortBy = "created";
                this.asc = true;
                break;
            case "date_desc":
                this.sortBy = "created";
                this.asc = false;
                break;
            case "comment_desc":
                this.sortBy = "comments";
                this.asc = false;
                break;
            case "comment_asc":
                this.sortBy = "comments";
                this.asc = true;
                break;
            case "reaction_desc":
                this.sortBy = "reactions";
                this.asc = false;
                break;
            case "reaction_asc":
                this.sortBy = "reactions";
                this.asc = true;
                break;
            default:
                console.log("Option non reconnue");
        }
    }

    /**
     * Charge les posts en fonction du mode de tri de l'ordre et de l'offset
     */
    loadPosts() {
        //On empêche de faire un appel tant que le précédent n'est pas finit
        this.lock = true;
        BnumMessage.SetBusyLoading();
        this.http_internal_get(
            {
                task: 'forum',
                action: 'get_posts_data',
                params: {
                    _workspace_uid: this.workspace,
                    _offset: this.offset,
                    _order: this.sortBy,
                    _asc: this.asc,
                    _search: this.searchString,
                    _tags: this.tags,
                    _fav_only: this.display_fav,
                },
                processData: false,
                contentType: false,
                on_success: (datas) => {
                    if (datas == "[]"){
                        document.querySelector('.content').removeEventListener("scroll", this.handleScroll);
                    }
                    let posts = JSON.parse(datas);
                    this.displayPost(posts);
                    BnumMessage.StopBusyLoading();
                    this.lock = false;
                    this.searchString = null;
                    this.tags = [];
                },
                on_error: (err) => {
                    this.lock = false;
                }
            }
        );
    }

    /*
     * Initialise les actions du select de tri
     */
    initSortSelect() {
        $("#forum-sort-select").on("change", (event) => {
            //on reset l'event listenner du scroll
            document.querySelector('.content').removeEventListener("scroll", this.handleScroll);
            document.querySelector('.content').addEventListener("scroll", this.handleScroll);
        
           this.updateSort();
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

        if (scrollPos / scrollHeight >= this.scrollPercentage && !this.lock ) {
            this.updateSort();
            this.loadPosts();
        }
    }
    
    /**
     * Affiche les posts correspondant au champ recherche
     */
    searchPosts() {
        this.searchString = $('#post-search-input').val();
        this.offset = 0;
        $('#post-area').empty();
        this.updateSort();
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
            if (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' ')) {
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
        //TODO récupérer le workspaces via l'url ou le post
        let workspace = this.get_env('workspace_uid');
        this.http_internal_post(
            {
                task: 'forum',
                action: 'add_to_favorite',
                params: {
                    _workspace_uid: workspace,
                    _article_uid: post_uid,
                },
                processData: false,
                contentType: false,
                on_success: () => {
                    let div = $('#favorite-'+post_uid);
                    if (div.hasClass('filled')){
                        div.removeClass('filled');
                    }else{
                        div.addClass('filled');
                    }
                    BnumMessage.DisplayMessage(
                        rcmail.gettext('mel_forum.fav_updated'),
                        eMessageType.Confirmation,
                    );
                },
                on_error: (err) => {
                    BnumMessage.DisplayMessage(
                        rcmail.gettext('mel_forum.error_editing'),
                        eMessageType.Error,
                    );
                }
            }
        );
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
            if (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' ')) {
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
                $(document).on('click.menuOutside', function(event) {
                    // Vérifier si le clic est en dehors du menu et du bouton trigger
                    if (!$(event.target).closest(selectContainer).length && !$(event.target).closest(triggerButton).length) {
                        selectContainer.addClass('hidden');  // Masquer le menu
                        $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
                    }
                });
    
                // Ajouter un écouteur d'événements pour chaque bouton du menu
                selectContainer.find('.post-options-button').on('click', function() {
                    selectContainer.addClass('hidden'); // Fermer le menu
                    $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
                });
            }, 0);  // Délai de 0 pour que l'événement de clic sur le bouton soit géré en premier
    
            // Empêcher la propagation du clic sur le bouton trigger pour éviter la fermeture immédiate
            triggerButton.off('click').on('click', function(event) {
                event.stopPropagation(); // Empêche la propagation du clic vers l'écouteur du document
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
      // Rediriger vers la page d'édition avec l'UID du post
      window.location.href = this.url('forum', { action: 'create_or_edit_post', params:{'_uid': post_uid, '_workspace_uid': this.workspace}});
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
  
      // Demander confirmation à l'utilisateur avant de supprimer
      const confirmation = confirm(rcmail.gettext('mel_forum.delete_post_confirm'));
      if (!confirmation) return; // Arrêter la fonction si l'utilisateur annule
  
      // Envoi d'une requête HTTP pour supprimer le post
      this.http_internal_post({
          task: 'forum',
          action: 'delete_post',
          params: {
              _uid: post_uid,
          },
          processData: false,
          contentType: false,
          on_success: (response) => {
              const parsedResponse = JSON.parse(response);
  
              if (parsedResponse.status === 'success') {
                  // Affichage du message de succès
                  BnumMessage.DisplayMessage(
                      parsedResponse.message || rcmail.gettext('mel_forum.delete_post_success'),
                      eMessageType.Confirmation
                  );
  
                  // Supprimer l'article de l'affichage
                  const postElement = $('#post-' + post_uid);
                  if (postElement.length > 0) {
                      postElement.remove(); // Supprimer l'article du DOM
                      rcmail.triggerEvent('forum.post.delete');
                  }
              } else {
                  // Affichage du message d'erreur en cas d'échec
                  BnumMessage.DisplayMessage(
                        parsedResponse.message || rcmail.gettext('mel_forum.delete_post_failure'),
                        eMessageType.Error
                  );
              }
          },
          on_error: (err) => {
              // Affichage du message d'erreur en cas de problème avec la requête
              BnumMessage.DisplayMessage(
                    rcmail.gettext('mel_forum.delete_post_failure'),
                    eMessageType.Error
              );
          }
      });
    }

    /**
     * Récupère le lien a href le plus proche et le copie dans le presse papier
     * @param {*} event 
     */
    copyPostLink(event){
        event.preventDefault();
        event.stopPropagation();
        let url = event.currentTarget.closest("a").getAttribute('href').replaceAll("&_is_from=iframe", "&_force_bnum=1");
        navigator.clipboard.writeText(url).then(() => {
            BnumMessage.DisplayMessage(
                rcmail.gettext('mel_forum.link_copied'),
                eMessageType.Confirmation,
            );
        });
    }

    /**
     * initialise l'affichage des posts au chargement de la page
     * @param {*} event 
     */
    initPostDisplay () {
        const posts = this.get_env('posts_data');
        if(posts.length === 0){
            this.displayNoPost();
        }
        this.displayPost(posts);
    }

    /**
     * Affiche les posts comportant un tag
     * @param {*} tag_id 
     * @param {*} tag_name 
     * @param {*} event 
     */
    searchTag (tag_id, tag_name, event) {
        event.preventDefault();
        event.stopPropagation();
        this.offset = 0;
        this.tags.push(tag_id);
        $('#post-area').empty();
        this.updateSort();
        this.loadPosts();
        $('#post-search-input').val('#' + tag_name);
    }

    /**
     * Met à jour le compteur de like , si on est à 0 n'affiche rien
     * @param {*} span élément html à mettre à jour
     * @param {*} value modification apportée au compteur
     */
    updateCounter(span, value) {
        let currentValue = parseInt(span.text()) || 0; // Récupérer la valeur actuelle
        let newValue = currentValue + value;

        if (newValue <= 0) {
            span.text(''); // Si la valeur est 0 ou moins, on masque le compteur
        } else {
            span.text(newValue); // Sinon, on met à jour la valeur
        }
    }

    /**
     * Gestion des likes et dislike des posts
     * @param {*} type type de la reaction
     * @param {*} post_id 
     * @param {*} post_uid 
     * @param {*} event 
     */
    addLikeOrDislike(type, post_id, post_uid,event){
        // Vérification si un événement est fourni
        if (event) {
            // Gestion des interactions clavier
            if (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' ')) {
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
                _post_id: post_id,
                _type: type,
            },
            processData:false,
            contentType:false,
            on_success: (response) => {
                BnumMessage.DisplayMessage(
                    response.status,
                    eMessageType.Confirmation,
                );
                let like_div = $('#add_like-'+post_uid);
                let like_counter = like_div.find('span.ml-2');
                let dislike_div = $('#add_dislike-'+post_uid);
                let dislike_counter = dislike_div.find('span.ml-2');

                if (type ==='like'){
                    if (like_div.hasClass('filled')){
                        like_div.removeClass('filled');
                        this.updateCounter(like_counter, -1);
                    }else{
                        like_div.addClass('filled');
                        this.updateCounter(like_counter, 1);

                        if(dislike_div.hasClass('filled')) {
                            dislike_div.removeClass('filled');
                            this.updateCounter(dislike_counter, -1);
                        }
                    }
                } else if (type === 'dislike'){
                    if (dislike_div.hasClass('filled')){
                        dislike_div.removeClass('filled');
                        this.updateCounter(dislike_counter, -1);
                    }else{
                        dislike_div.addClass('filled');
                        this.updateCounter(dislike_counter, 1);

                        if(like_div.hasClass('filled')){
                            like_div.removeClass('filled');
                            this.updateCounter(like_counter, -1);
                        }
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

    openComments(post_link, event)
    {
        if (event) {
            // Gestion des interactions clavier
            if (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' ')) {
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
        window.location.href = post_link + "#comment-section";
    }

    /**
     * affiche les posts passés en paramètres dans la div post-area
     * @param {*} posts 
     */
    displayPost(posts) {
        let post;
        let data;
        for (let postId in posts) {
            post = posts[postId];
            data = {
                POST_LINK: post.post_link,
                POST_CREATOR: post.post_creator,
                CREATOR_EMAIL: post.creator_email,
                POST_DATE: post.creation_date,
                UID: post.uid,
                POST_TITLE: post.title,
                POST_SUMMARY: post.summary,
                POST_IMAGE: post.image_url,
                //POST_COUNT_REACTION: post.reaction,
                POST_THUMB_UP: post.like_count.toString(),
                POST_THUMB_DOWN: post.dislike_count.toString(),
                POST_COMMENTS: post.comment_count.toString(),
                POST_FAVORITE: 
                    MelHtml.start.tag('i',{id: 'favorite-'+post.uid, tabindex:'0', title: post.favorite ? "Supprimer de mes favoris" : "Ajouter à mes favoris", class:`hoverable icon favorite material-symbols-outlined ${post.favorite ? 'filled' : ''}`}).text('star_border').end().generate_html({}),
                POST_IS_LIKED: post.isliked ? "filled" : "",
                POST_IS_DISLIKED: post.isdisliked ? "filled" : "",
                HAS_OWNER_RIGHTS: post.has_owner_rights ? "" : "hidden",
                };

            let template = new MelTemplate()
            .setTemplateSelector('#post_template')
            .setData(data)
            .addEvent('#favorite-'+post.uid, 'click', this.addToFavorite.bind(this, post.uid))
            .addEvent('#favorite-'+post.uid, 'keydown', this.addToFavorite.bind(this, post.uid)) // Gestion au Clavier
            .addEvent('#add_like-'+post.uid,'click',this.addLikeOrDislike.bind(this, 'like', post.id, post.uid))
            .addEvent('#add_like-'+post.uid, 'keydown', this.addLikeOrDislike.bind(this, 'like', post.id, post.uid)) // Gestion au clavier
            .addEvent('#add_dislike-'+post.uid,'click',this.addLikeOrDislike.bind(this, 'dislike', post.id, post.uid))
            .addEvent('#add_dislike-'+post.uid, 'keydown', this.addLikeOrDislike.bind(this, 'dislike', post.id, post.uid)) // Gestion au clavier
            .addEvent('#add_comment-'+post.uid,'click',this.openComments.bind(this, post.post_link))
            .addEvent('#add_comment-'+post.uid, 'keydown', this.openComments.bind(this, post.post_link)) // Gestion au clavier
            .addEvent('#more-'+post.uid, 'click', this.toggleMenuPost.bind(this, post.uid))
            .addEvent('#more-'+post.uid, 'keydown', this.toggleMenuPost.bind(this, post.uid)) // Gestion au clavier
            .addEvent('.post-options-button.edit-post', 'click', this.editPost.bind(this, post.uid)) // Ajout du gestionnaire pour "Modifier l'article"
            .addEvent('.post-options-button.edit-post', 'keydown', this.editPost.bind(this, post.uid)) // Gestion au clavier
            .addEvent('.post-options-button.delete-post', 'click', this.deletePost.bind(this, post.uid)) // Ajout du gestionnaire pour "Modifier l'article"
            .addEvent('.post-options-button.delete-post', 'keydown', this.deletePost.bind(this, post.uid)) // Gestion au clavier
            .addEvent('.post-options-button.copy-post', 'click', this.copyPostLink.bind(this))
            .addEvent('.post-options-button.copy-post', 'Keydown', this.copyPostLink.bind(this)) // Gestion au clavier
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
                let tag_data = {
                    TAG_NAME: '#' + post.tags[tag].name,
                    TAG_ID: post.tags[tag].id,
                }
            let tag_template = new MelTemplate()
            .setTemplateSelector('#tag_template')
            .setData(tag_data)
            .addEvent('.tag-' + post.tags[tag].id, 'click', this.searchTag.bind(this, post.tags[tag].id, post.tags[tag].name));
            $('#tag-area-'+post.uid).append(...tag_template.render());
            }
            this.offset ++;
        }
    }

    /**
     * Affiche un message indiquant qu'il n'y a aucun post dans l'espace de travail
     */
    displayNoPost() {
        let noPostDiv = MelHtml.start.span({class: 'ml-2'}).text(rcmail.gettext('mel_forum.no_post')).end();
        $('#post-area').append(noPostDiv.generate());
    }

    
}