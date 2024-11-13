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
        this.limit = 20;
        this.sortBy = 'created';
        this.asc = false;
        this.tags = [];
        this.scrollPercentage = 0.7;
        this.handleScroll = this.checkScroll.bind(this);
        this.search = null
        this.display_fav = false;
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
        this.http_internal_post(
            {
                task: 'forum',
                action: 'get_posts_data',
                params: {
                    _workspace: this.workspace,
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
                    this.search = null;
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
        event.preventDefault();
        event.stopPropagation();
        //TODO récupérer le workspaces via l'url ou le post
        let workspace = 'workspace-test';
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
}