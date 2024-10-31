import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { BnumMessage, eMessageType } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
// import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

export class Forum extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        this.initButtons();
        this.displayPost();

    }


    initButtons() {
        $('#forum-button-add').click(() => {
            window.location.href = this.url('forum', {action:'create_or_edit_post'});
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
        $('#display-fav-only').on('change', function() {
            if ($(this).is(':checked')) {
              // Affiche seulement les cartes qui ont la classe 'filled' sur l'icône étoile
              $('.post-card').each(function() {
                if ($(this).find('.favorite').hasClass('filled')) {
                  $(this).show();  // Affiche les favoris
                } else {
                  $(this).hide();  // Masque les non-favoris
                }
              });
            } else {
              // Affiche toutes les cartes si la checkbox est décochée
              $('.post-card').show();
            }
        });

        // Initialisation de l'écouteur de recherche
        const $searchInput = $('#forum-search-input');
        const $searchIcon = $('.icon-mel-search');

        // Appel de la fonction de recherche lorsque l'icône est cliquée ou lors de l'appui sur "Entrée"
        $searchIcon.on('click', () => this.searchPosts());
        $searchInput.on('keydown', (event) => {
            if (event.key === 'Enter') this.searchPosts();
        });
    }

    searchPosts() {
        const searchTerm = $('#forum-search-input').val().trim().toLowerCase();
        
        // Si le champ de recherche est vide, on réaffiche tous les posts
        if (!searchTerm) {
            $('#post-area').empty();  // Vider l'affichage actuel
            this.displayPost();       // Appeler displayPost pour réafficher tous les posts
            return;
        }

        // Exemple de filtrage des posts (à adapter selon vos besoins)
        const posts = this.get_env('posts_data');
        const filteredPosts = {};

        for (const postId in posts) {
            const post = posts[postId];
            // Filtre par titre et résumé (à ajuster selon vos critères de recherche)
            if (post.title.toLowerCase().includes(searchTerm) || post.summary.toLowerCase().includes(searchTerm)) {
                filteredPosts[postId] = post;
            }
        }

        // Effacer les anciens posts affichés et afficher les résultats filtrés
        $('#post-area').empty();
        this.displayFilteredPosts(filteredPosts);
    }

    displayFilteredPosts(filteredPosts) {
        for (let postId in filteredPosts) {
            const post = filteredPosts[postId];
            const data = {
                POST_LINK: post.post_link,
                POST_CREATOR: post.post_creator,
                POST_DATE: post.creation_date,
                UID: post.uid,
                POST_TITLE: post.title,
                POST_SUMMARY: post.summary,
                POST_IMAGE: "lentilles",
                POST_COUNT_REACTION: post.reaction,
                POST_THUMB_UP: post.like_count,
                POST_THUMB_DOWN: post.like_count,
                POST_COMMENTS: post.comment_count,
                POST_FAVORITE: 
                    MelHtml.start.tag('i',{id: 'favorite-'+post.uid, class:`favorite material-symbols-outlined ${post.favorite ? 'filled' : ''}`}).text('star_border').end().generate_html({}),
            };
    
            let template = new MelTemplate()
                .setTemplateSelector('#post_template')
                .setData(data)
                .addEvent('#favorite-'+post.uid, 'click', this.addToFavorite.bind(this, post.uid));
    
            $('#post-area').append(...template.render());
    
            // Affichage des tags associés au post
            for (let tag in post.tags) {
                let tag_data = {
                    TAG_NAME: '#' + post.tags[tag],
                };
                let tag_template = new MelTemplate()
                    .setTemplateSelector('#tag_template')
                    .setData(tag_data);
                $('#tag-area-'+post.uid).append(...tag_template.render());
            }
        }
    }

    addToFavorite(post_uid, event) {
        event.preventDefault();
        event.stopPropagation();
        //TODO récupérer le workspaces via l'url ou le post
        let workspace = 'workspace-test';
        this.http_internal_post(
            {
                task: 'forum',
                action: 'add_to_favorite',
                params: {
                    _workspace: workspace,
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
                        'Vos articles favoris ont été mis à jour',
                        eMessageType.Confirmation,
                    );
                },
                on_error: (err) => {
                    BnumMessage.DisplayMessage(
                        'Erreur lors de la modification',
                        eMessageType.Error,
                    );
                }
            }
        );
    }

    displayPost() {
        const posts = this.get_env('posts_data');
        let post;
        let data;
        for (let postId in posts) {
            post = posts[postId];
            data = {
                POST_LINK: post.post_link,
                POST_CREATOR: post.post_creator,
                POST_DATE: post.creation_date,
                UID: post.uid,
                POST_TITLE: post.title,
                POST_SUMMARY: post.summary,
                POST_IMAGE: "lentilles",
                POST_COUNT_REACTION: post.reaction,
                POST_THUMB_UP: post.like_count,
                POST_THUMB_DOWN: post.like_count,
                POST_COMMENTS: post.comment_count,
                POST_FAVORITE: 
                    MelHtml.start.tag('i',{id: 'favorite-'+post.uid, class:`favorite material-symbols-outlined ${post.favorite ? 'filled' : ''}`}).text('star_border').end().generate_html({}),
            };

            let template = new MelTemplate()
            .setTemplateSelector('#post_template')
            .setData(data)
            .addEvent('#favorite-'+post.uid, 'click', this.addToFavorite.bind(this, post.uid));
            //.addEvent(balise, action, fonction)

            $('#post-area').append(...template.render());

            for (let tag in post.tags) {
                let tag_data = {
                    TAG_NAME: '#' + post.tags[tag],
                }
            let tag_template = new MelTemplate()
            .setTemplateSelector('#tag_template')
            .setData(tag_data);
            $('#tag-area-'+post.uid).append(...tag_template.render());
            }

        }
    }
}