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
        //TODO récupéerer le workspace via l'url
        this.workspace = 'workspace-test';
        this.offset = 0;
        this.locked = false;
        this.handleScroll = this.checkScroll.bind(this);
        this.initButtons();
        this.initSortSelect();
        this.initPostDisplay();



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
        document.querySelector('.content').addEventListener("scroll", this.handleScroll);
    }

    /*
     * Initialise les actions du select de tri
     */
    initSortSelect() {
        $("#forum-sort-select").on("change", (event) => {
            // Initialiser les deux variables en fonction de la valeur choisie
            let sortBy;
            let asc;
        
            // Vérifier la valeur sélectionnée et définir les variables
            switch (event.target.value) {
                case "date_asc":
                    sortBy = "created";
                    asc = true;
                    break;
                case "date_desc":
                    sortBy = "created";
                    asc = false;
                    break;
                case "comment_desc":
                    sortBy = "comments";
                    asc = false;
                    break;
                case "comment_asc":
                    sortBy = "comments";
                    asc = true;
                    break;
                case "reaction_desc":
                    sortBy = "reactions";
                    asc = false;
                    break;
                case "reaction_asc":
                    sortBy = "reactions";
                    asc = true;
                    break;
                default:
                    console.log("Option non reconnue");
            }
            //appeler le back avec le nouveau tri puis render les posts
            $('#post-area').empty();
            this.offset = 0;
            BnumMessage.SetBusyLoading();
            this.http_internal_post(
                {
                    task: 'forum',
                    action: 'get_posts_data',
                    params: {
                        _workspace: this.workspace,
                        _offset: this.offset,
                        _order: sortBy,
                        _asc: asc,
                    },
                    processData: false,
                    contentType: false,
                    on_success: (datas) => {
                        let posts = JSON.parse(datas);
                        this.displayPost(posts);
                        BnumMessage.StopBusyLoading();
                        //on reset l'event listenner du scroll
                        document.querySelector('.content').removeEventListener("scroll", this.handleScroll);
                        document.querySelector('.content').addEventListener("scroll", this.handleScroll);
                    },
                    on_error: (err) => {

                    }
                }
            );
        });
    }

    checkScroll() {
        const scrollHeight = document.querySelector('.content').scrollHeight;
        const scrollPos = document.querySelector('.content').scrollTop;

        if (scrollPos / scrollHeight >= 0.7 && !this.lock ) {
            this.lock = true;
            //On récupère le mode d'affichage
            let sortBy;
            let asc;
            // Vérifier la valeur sélectionnée et définir les variables
            switch ($("#forum-sort-select")[0].value) {
                case "date_asc":
                    sortBy = "created";
                    asc = true;
                    break;
                case "date_desc":
                    sortBy = "created";
                    asc = false;
                    break;
                case "comment_desc":
                    sortBy = "comments";
                    asc = false;
                    break;
                case "comment_asc":
                    sortBy = "comments";
                    asc = true;
                    break;
                case "reaction_desc":
                    sortBy = "reactions";
                    asc = false;
                    break;
                case "reaction_asc":
                    sortBy = "reactions";
                    asc = true;
                    break;
                default:
                    console.log("Option non reconnue");
            }
            //On appelle le chargement de la suite des posts
            this.http_internal_post(
                {
                    task: 'forum',
                    action: 'get_posts_data',
                    params: {
                        _workspace: this.workspace,
                        _offset: this.offset,
                        _order: sortBy,
                        _asc: asc,
                    },
                    processData: false,
                    contentType: false,
                    on_success: (datas) => {
                        if (datas == "[]"){
                            document.querySelector('.content').removeEventListener("scroll", this.handleScroll);
                        }
                        let posts = JSON.parse(datas);
                        this.displayPost(posts);
                        this.lock = false;
                    },
                    on_error: (err) => {
                        this.lock = false;
                    }
                }
            );
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
    initPostDisplay () {
        const posts = this.get_env('posts_data');
        this.displayPost(posts);
    }

    displayPost(posts) {
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
            this.offset ++;
            console.log(this.offset);
        }
    }
}