<?php

use League\HTMLToMarkdown\HtmlConverter;

/**
 * Plugin Forum
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

class mel_forum extends bnum_plugin
{
    /**
     *
     * @var string
     */
    public $task = '.*';

    const DEFAULTSORTBY = 'created';
    const DEFAULTASC = false;
    const POST_DEFAULT_LIMIT = 20;

    public $current_post;

    /**
     * (non-PHPdoc)
     * @see bnum_plugin::init()
     */
    function init()
    {
        
        // Gestion des différentes langues
        $this->add_texts('localization/', true);

        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/mel_forum.css');


        // ajout de la tache
        $this->register_task('forum');

        if ($this->rc()->task === "forum") {
            $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GP);
            if (driver_mel::gi()->getUser()->isWorkspaceMember($workspace_uid)) {

                // Penser à modifier avec index au lieu de post pour afficher la page d'accueil
                $this->register_action('index', [$this, 'index']);
                //Affichage de la page d'un article
                $this->register_action('post', [$this, 'post']);
                // Affichage de la page qui permet de créer un article
                $this->register_action('create_or_edit_post', [$this, 'create_or_edit_post']);
                // Créer/Modifier un article
                $this->register_action('add_post', [$this, 'add_post']);
                //supprimer un article
                $this->register_action('delete_post', [$this, 'delete_post']);
                // Ajouter un commentaire ou une réponse
                $this->register_action('create_comment', [$this, 'create_comment']);
                // Modifier un commentaire ou une réponse
                $this->register_action('update_comment', [$this, 'update_comment']);
                // Supprimer un commentaire ou une réponse
                $this->register_action('delete_comment', [$this, 'delete_comment']);
                // Liker un commentaire ou une réponse
                $this->register_action('like_comment', [$this, 'like_comment']);
                //Lister les comments d'un Post
                $this->register_action('get_all_comments_bypost', [$this, 'get_all_comments_bypost']);
                //Gère la modification/création d'un post
                $this->register_action('send_post', [$this, 'send_post']);
                // Import une image sur le serveur
                $this->register_action('upload_image', [$this, 'upload_image']);
                // affiche une image chargé sur le serveur
                $this->register_action('load_image', [$this, 'load_image']);
                // ajoute un article aux favoris de l'utilisateur courant
                $this->register_action('manage_favorite', [$this, 'manage_favorite']);
                // récupérer des posts au format Json
                $this->register_action('get_posts_data', [$this, 'get_posts_data']);
                // gestion des réaction aux posts
                $this->register_action('manage_reaction', [$this, 'manage_reaction']);
                // Affichage des nouveaux posts
                $this->register_action('new_posts', [$this, 'new_posts']);
                //Affichage du post à la une
                $this->register_action('front_page_post', [$this, 'front_page_post']);
                //Reload du post à la une
                $this->register_action('refresh_front_page_post', [$this, 'refresh_front_page_post']);
                //Épingler un post
                $this->register_action('pin_post', [$this, 'pin_post']);
                // Conversion d'un article en Markdown
                $this->register_action('convert_post_in_markdown', [$this, 'convert_post_in_markdown']);
                $this->register_action('download_article', [$this, 'download_article']);

                $this->register_action('create_zip_with_md_and_images', [$this, 'create_zip_with_md_and_images']);
            } else {
                $this->_display_error_page();
            }
        } else if ($this->get_current_task() === 'workspace') {
            $this->add_hook('workspace.services.set', [$this, 'workspace_services_set']);
            $this->add_hook('wsp.show', [$this, 'wsp_show']);
            $this->add_hook('workspace.params.services.show', [$this, 'workspace_params_services_show']);
            $this->add_hook('workspace.service.get', [$this, 'workspace_service_get']);
        }
        $this->add_hook('workspace.service.delete', [$this, 'workspace_deleted']);
    }

    #region Liste d'articles

    /**
     * Affiche la page d'accueil du forum.
     *
     * Cette fonction enregistre un template pour afficher les publications du forum
     * et envoie le modèle 'mel_forum.forum' à la page qui affiche les articles.
     *
     * @return void
     */
    public function index()
    {
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        $this->include_web_component()->Avatar();
        $this->load_script_module('forum');
        $this->_show_posts();
        $this->rc()->output->set_env('workspace_uid', $workspace_uid);
        $this->rc()->output->set_env('user_fullname', driver_mel::gi()->getUser()->name);
        $this->rc()->output->add_handlers(['post_search' => [$this, '_show_search']]);
        $this->rc()->output->send('mel_forum.forum');
    }

    // Fonctions nécessaires à l'affichage d'un article

    /**
     * Affiche la recherche dans la barre de recherche .
     *
     * @return string La recherche.
     */
    protected function _show_search()
    {
        $search = '""';
        if ($this->get_input('_from_other_frame', rcube_utils::INPUT_GET)) {
            $search = urldecode($this->get_input('_search', rcube_utils::INPUT_GET));
        }
        return $search;
    }

    #endregion
    #region AFFICHAGE POST

    /**
     * Affiche un article du forum.
     *
     * Cette fonction récupère l'identifiant de l'article via une méthode GET,
     * charge la publication actuelle, et enregistre plusieurs gestionnaires pour 
     * afficher le titre, le créateur, la date et le contenu de la publication.
     * Ensuite, elle envoie le modèle 'mel_forum.post' à la page.
     *
     * @return void
     */
    public function post()
    {
        $uid = $this->get_input('_uid', rcube_utils::INPUT_GET);
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        $this->current_post = $this->_get_post($uid);
        if (driver_mel::gi()->getUser()->isWorkspaceMember($workspace_uid) && !is_null($this->current_post)) {
            mel_metapage::IncludeAvatar();
            //Récupérér uid avec GET
            $this->load_script_module('manager');

            $reactions = $this->current_post->listReactions();

            $likes_name = $this->_get_names_by_reaction($this->current_post, 'like');
            $dislikes_name = $this->_get_names_by_reaction($this->current_post, 'dislike');


            $this->rc()->output->add_handlers(['show_post_title' => [$this, 'show_post_title']]);
            $this->rc()->output->add_handlers(['show_post_tags' => [$this, 'show_post_tags']]);
            $this->rc()->output->add_handlers(['show_post_creator_name' => [$this, 'show_post_creator_name']]);
            $this->rc()->output->add_handlers(['show_post_creator_email' => [$this, 'show_post_creator_email']]);
            $this->rc()->output->add_handlers(['show_post_date' => [$this, 'show_post_date']]);
            $this->rc()->output->add_handlers(['show_post_content' => [$this, 'show_post_content']]);
            $this->rc()->output->add_handlers(['show_post_like' => [$this, 'show_post_like']]);
            $this->rc()->output->add_handlers(['show_post_dislike' => [$this, 'show_post_dislike']]);

            $this->rc()->output->set_env('post_uid', $this->current_post->uid);
            $this->rc()->output->set_env('post_id', $this->current_post->id);
            $this->rc()->output->set_env('workspace_uid', $workspace_uid);
            $this->rc()->output->set_env('show_comments', $this->current_post->settings["comments"]);
            $this->rc()->output->set_env('has_owner_rights', $this->_has_owner_rights($this->current_post, $workspace_uid));
            $this->rc()->output->set_env('has_liked', $this->_has_Reacted('like', $reactions));
            $this->rc()->output->set_env('has_disliked', $this->_has_Reacted('dislike', $reactions));
            $this->rc()->output->set_env('like_reactions', $likes_name);
            $this->rc()->output->set_env('like_count', $this->current_post->likes);
            $this->rc()->output->set_env('dislike_reactions', $dislikes_name);
            $this->rc()->output->set_env('dislike_count', $this->current_post->dislikes);
            $this->rc()->output->set_env('user_fullname', driver_mel::gi()->getUser()->name);

            $this->rc()->output->send('mel_forum.post');
        } else {
            $this->_display_error_page();
        }
    }

    /**
     * Affiche le titre de la publication actuelle.
     *
     * Cette fonction retourne le titre de la publication chargée dans 
     * l'attribut `current_post`.
     *
     * @return string Le titre de la publication actuelle.
     */
    public function show_post_title()
    {

        return $this->current_post->title;
    }

    /**
     * Affiche les tags associés à la publication actuelle.
     *
     * Cette fonction récupère les tags associés à la publication chargée 
     * dans l'attribut `current_post`, génère des éléments HTML pour chaque tag 
     * et les intègre dans le contenu HTML de la publication.
     *
     * @return string Le HTML contenant les tags formatés et le contenu de la publication.
     */
    public function show_post_tags()
    {
        // Récupérer les tags associés au post actuel
        $tags = $this->_get_tags_name_bypost($this->current_post->uid);

        // Création des éléments HTML pour les tags
        $tags_html = '';

        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        foreach ($tags as $tag) {
            $url = $this->rc()->url(array(
                "_task" => "forum",
                "_action" => "index",
                "workspace_uid" => $workspace_uid,
                "_search" => urlencode('#' . $tag),
                "_offset" => 0,
                "_from_other_frame" => true,
            ), false, false, true);
            $tags_html .= '<a href= "' . $url . '" data-spied="false" class="tag" tabindex="0" role="button">#' . htmlspecialchars($tag) . '</a>';
        }

        return $tags_html;
    }

    /**
     * Affiche le nom du créateur de la publication actuelle.
     *
     * Cette fonction retourne le nom de l'utilisateur qui a créé la publication 
     * chargée dans l'attribut `current_post`, en utilisant l'identifiant utilisateur 
     * pour récupérer les informations de l'utilisateur via le driver `driver_mel`.
     *
     * @return string Le nom du créateur de la publication actuelle.
     */
    public function show_post_creator_name()
    {
        return $this->get_user($this->current_post->user_uid)->name;
    }

    /**
     * Affiche l'email du créateur de la publication actuelle.
     *
     * Cette fonction retourne le nom de l'utilisateur qui a créé la publication 
     * chargée dans l'attribut `current_post`, en utilisant l'identifiant utilisateur 
     * pour récupérer les informations de l'utilisateur via le driver `driver_mel`.
     *
     * @return string Le nom du créateur de la publication actuelle.
     */
    public function show_post_creator_email()
    {
        return $this->get_user($this->current_post->user_uid)->email;
    }

    /**
     * Affiche la date de création de la publication actuelle.
     *
     * Cette fonction récupère la date de création de la publication chargée 
     * dans l'attribut `current_post`, puis la formate en français en utilisant 
     * le `IntlDateFormatter` pour l'affichage.
     *
     * @return string La date formatée de la publication actuelle.
     */
    public function show_post_date()
    {

        $post_date = $this->current_post->created;

        // Définir la locale en français pour le formatage de la date
        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);

        // Convertir la date du post en un timestamp Unix
        $timestamp = strtotime($post_date);

        // Formater la date du post
        $formatted_date = $formatter->format($timestamp);

        return $formatted_date;
    }

    /**
     * Affiche le contenu de la publication actuelle.
     *
     * Cette fonction retourne le contenu de la publication chargée 
     * dans l'attribut `current_post`.
     *
     * @return string Le contenu de la publication actuelle.
     */
    public function show_post_content()
    {
        $content = $this->current_post->content;

        return $content;
    }

    /**
     * Affiche le nombre de like de la publication actuelle
     * @return string le nombre de like de la publication actuelle
     */
    public function show_post_like()
    {
        return strval($this->current_post->likes);
    }
    /**
     * Affiche le nombre de dislike de la publication actuelle
     * @return string le nombre de dislike de la publication actuelle
     */
    public function show_post_dislike()
    {
        return strval($this->current_post->dislikes);
    }

    #endregion
    #region Page création

    /**
     * Gère la création ou la modification d'un article.
     *
     * Cette fonction initialise l'éditeur HTML et détermine si un nouvel article 
     * doit être créé ou si un article existant doit être modifié, en fonction de 
     * l'UID fourni. Elle assure également la validation des permissions, 
     * le chargement ou la sauvegarde des données de l'article, et prépare 
     * les données pour le frontend.
     *
     * @return void
     */
    public function create_or_edit_post()
    {
        // Récupérer l'UID pour déterminer s'il s'agit d'une création ou d'une modification
        $uid = $this->get_input('_uid', rcube_utils::INPUT_GET);
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();

        //vérification des droits d'accès
        if ($user->isWorkspaceMember($this->get_input('_workspace_uid'))) {
            $this->rc()->html_editor();
            $this->load_script_module('create_or_edit_post');

            // Initialisation de la variable de post et du mode édition
            $post = new LibMelanie\Api\Defaut\Posts\Post();
            $is_editing = false;

            if ($uid) {
                // Mode édition : assigner l'UID et charger l'article existant
                $post->uid = $uid;
                if ($post->load()) {  // Charger les données de l'article existant
                    $is_editing = true;

                    // Vérifier si l'utilisateur connecté est bien le créateur de l'article
                    if (!$this->_has_owner_rights($post, $this->get_input('_workspace_uid'))) {
                        //afficher une page d'erreur
                        $this->_display_error_page();
                        exit; // Arrêter l'exécution si l'utilisateur n'est pas le créateur
                    }

                    // Récupérer les Tags liés au post
                    $tags = $this->_get_tags_name_bypost($post->uid);
                } else {
                    // Si l'UID est fourni mais l'article n'existe pas, renvoyer une erreur
                    return false;
                }
            }

            if (!$is_editing) {
                // Mode création : initialiser un nouvel article avec des valeurs par défaut
                $post->title = '';
                $post->content = '';
                $post->summary = $this->_create_summary_from_content($post->content);
                $post->uid = $this->_generateRandomString(24);
                $post->modified = date('Y-m-d H:i:s');
                $post->creator = driver_mel::gi()->getUser()->uid;
                $post->settings = json_encode(['extwin' => true, 'comments' => true]);
                $post->workspace = $this->get_input('_workspace_uid');

                // Sauvegarde initiale du nouvel article
                $ret = $post->save();
                if (is_null($ret)) {
                    return false; // Retourner false si la sauvegarde échoue
                }
                $post->load(); // Charger les données de l'article créé
            }

            // Préparer les données de l'article pour le frontend
            $post_data = [
                'title' => $post->title,
                'summary' => $post->summary,
                'content' => $post->content,
                'uid' => $post->uid,
                'creator' => $post->creator,
                'tags' => $tags,
                'settings' => $post->settings,
                'workspace' => $post->workspace,
                'id' => $post->id
            ];
            $this->rc()->output->set_env('post', $post_data);
            $this->rc()->output->set_env('is_editing', $is_editing);

            // Envoyer le template approprié
            $this->rc()->output->send('mel_forum.create-post');
        } else {
            $this->_display_error_page();
        }
    }

    #endregion
    #region Suppression de post

    /**
     * Supprime un article existant en fonction de l'UID fourni.
     */
    public function delete_post()
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $current_user_uid = $user->uid;

        // Récupérer la valeur du champ POST
        $uid = $this->get_input('_uid', rcube_utils::INPUT_POST);

        // Validation de la donnée saisie
        if (empty($uid)) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("article_id_required", "mel_forum")]);
            exit;
        }

        // Récupérer l'article existant
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;

        // Vérifier si l'article existe
        if (!$post->load()) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("article_unfindable", "mel_forum")]);
            exit;
        }

        // Vérifier si l'utilisateur connecté a les droits
        if (!$this->_has_owner_rights($post, $post->workspace)) {
            $this->_display_error_page();
        }

        // Supprimer l'article
        $ret = $post->delete();
        if (mel_logs::is(mel_logs::TRACE))
            mel_logs::get_instance()->log(mel_logs::TRACE, "mel_forum:: post : $uid deleted from workspace : $post->workspace by : $current_user_uid");
        if (!is_null($ret)) {
            echo json_encode(['status' => 'success', 'message' => $this->gettext("the_article", "mel_forum") . $post->title . $this->gettext("has_been_deleted", "mel_forum")]);
        } else {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("delete_post_failure", "mel_forum") . $post->title . "."]);
        }

        // Arrêt de l'exécution du script
        exit;
    }

    #endregion
    #region Récupération de post

    /**
     * Récupère un article en fonction de son UID.
     *
     * @return LibMelanie\Api\Defaut\Posts\Post objet post.
     */
    protected function _get_post($uid)
    {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;

        $ret = $post->load();
        if (!is_null($ret)) {
            return $post;
        } else {
            return null;
        }
    }

    /**
     * Retourne les posts en fonction des paramètres passés en POST.
     * 
     * @param string $workspace_uid l'uid de l'espace de travail
     * @param int $limit nombre d'article à charger
     * @param bool $pin_post doit-on récupérer le post épinglé
     *
     * @return array post tableau d'objet posts
     */
    protected function _get_posts_byworkspace($workspace_uid = null, $limit = self::POST_DEFAULT_LIMIT, $pin_post = false)
    {
        //récupérer les infos de chargement d'articles si aucune n'est fournie on met des valeurs par defaut
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET) ?? $workspace_uid;
        $search = ($this->get_input('_offset', rcube_utils::INPUT_GET) !== null) ? ($this->get_input('_search', rcube_utils::INPUT_GET) === 'null' ? null : urldecode($this->get_input('_search', rcube_utils::INPUT_GET))) : null;
        $offset = ($this->get_input('_offset', rcube_utils::INPUT_GET) !== null) ? intval($this->get_input('_offset', rcube_utils::INPUT_GET)) : 0;
        // valeur possible: created, comments, reactions
        $orderby = ($this->get_input('_order', rcube_utils::INPUT_GET) !== null) ? $this->get_input('_order', rcube_utils::INPUT_GET) : self::DEFAULTSORTBY;
        //on récupère un string si il y a une valeur donc on la convertie
        $asc = ($this->get_input('_asc', rcube_utils::INPUT_GET) !== null) ? ($this->get_input('_asc', rcube_utils::INPUT_GET) === 'true' ? true : false) : self::DEFAULTASC;
        $tags_uids = $this->get_input('_tags', rcube_utils::INPUT_GET);
        $tags = null;
        if ($tags_uids !== null && $tags_uids !== "") {
            $tag = new LibMelanie\Api\Defaut\Posts\Tag();
            $tag->id = $tags_uids;
            $tag->workspace = $workspace_uid;
            $tag->load();
            $tags[] = $tag;
        }
        $fav_posts_uid = null;
        $get_favorite = ($this->get_input('_fav_only', rcube_utils::INPUT_GET) !== null) ? ($this->get_input('_fav_only', rcube_utils::INPUT_GET) === 'true' ? true : false) : false;
        if ($get_favorite) {
            $fav_posts = $this->rc()->config->get('favorite_article', []);
            $fav_posts_uid = $fav_posts[$workspace_uid];
        }
        //Gestion de si on veut un post spécifique
        if ($pin_post) {
            $workspace = mel_workspace::Workspace($workspace_uid);
            $pins = [$workspace->settings()->get('forum_pinned_post')];
            if ($pins[0] === null) {
                $pins = null;
            }
        }

        // Charger tous les posts en utilisant la méthode listPosts
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->workspace = $workspace_uid;

        // Appel de la méthode listPosts
        $posts = $post->listPosts($search, $tags, $orderby, $asc, $limit, $offset, $fav_posts_uid, $pins);

        return $posts;
    }

    #endregion
    #region Envois des posts

    /**
     * Prend en paramètre un tableau d'objet post et retourne un tableau au format JSON
     * @param string $workspace_uid uid de l'espace du travail est overide par la valeur passer en GET
     * @param int $limit nombre de post à charger
     * @param bool $pin_post true si on veut charger le post épinglé
     * @return array $post_data tableau de tableau contenant les infos des posts
     */
    protected function _post_object_to_JSON($workspace_uid = null, $limit = 20, $pin_post = false)
    {
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        $posts = $this->_get_posts_byworkspace($workspace_uid, $limit, $pin_post);
        $is_admin = driver_mel::gi()->getUser()->isWorkspaceOwner($workspace_uid);

        $workspace = mel_workspace::Workspace($workspace_uid);
        $pinned_post_uid = $workspace->settings()->get('forum_pinned_post');

        // Définir la locale en français pour le formatage de la date
        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);

        $posts_data = [];

        foreach ($posts as $post) {
            // Convertit la date du post en un timestamp Unix
            $timestamp = strtotime($post->created);
            // Formate la date du post
            $formatted_date = $formatter->format($timestamp);

            $post_creator = driver_mel::gi()->getUser($post->creator);
            $tags = $this->_get_all_tags_bypost($post);
            // Récupérer le nombre de likes
            $reactions = $post->listReactions();
            $likes_name = $this->_get_names_by_reaction($post, 'like');
            $isliked = $this->_has_Reacted('like', $reactions);
            $dislikes_name = $this->_get_names_by_reaction($post, 'dislike');
            $isdisliked = $this->_has_Reacted('dislike', $reactions);
            // Récupérer le nombre de commentaire
            $comment_count = $post->countComments();
            $is_fav = $this->_is_fav($post->uid, $workspace_uid);
            $post_link = $this->rc()->url(array(
                "_task" => "forum",
                "_action" => "post",
                "_uid" => $post->uid,
                "workspace_uid" => $workspace_uid,
            ), false, true, true);

            // Récupérer la première image du post et son URL
            $first_image = $post->firstImage();
            $image_url = $first_image ? $this->_get_image_url($first_image->uid) : null;
            if ($post->settings['miniature_url'] !== null) {
                $image_url = $post->settings['miniature_url'];
            }

            $posts_data[$post->uid] = [
                'uid' => $post->uid,
                'id' => $post->id,
                'title' => $post->title,
                'creation_date' => $formatted_date,
                'post_creator' => $post_creator->name,
                'creator_email' => $post_creator->email,
                'tags' => $tags,
                'summary' => $post->summary,
                'like_reactions' => $likes_name,
                'like_count' => $post->likes,
                'dislike_reactions' => $dislikes_name,
                'dislike_count' => $post->dislikes,
                'comment_count' => $comment_count,
                'favorite' => $is_fav,
                'isliked' => $isliked,
                'isdisliked' => $isdisliked,
                'post_link' => $post_link,
                'image_url' => $image_url,
                'has_owner_rights' => $this->_has_owner_rights($post, $workspace_uid),
                'settings' => $post->settings,
                'is_admin' => $is_admin,
                'pinned' =>  $pinned_post_uid === $post->uid,
            ];
        }
        return $posts_data;
    }

    /**
     * Met dans l'env roundcube une liste de post.
     *
     * Cette fonction récupère toutes les publications d'un espace de travail, 
     * formate chaque publication avec ses détails (créateur, date, titre, résumé, image, tags, 
     * et nombre de réactions et commentaires) et génère le HTML correspondant.
     */
    protected function _show_posts()
    {
        $this->rc()->output->set_env('posts_data', $this->_post_object_to_JSON(null, self::POST_DEFAULT_LIMIT, true));
    }

    /**
     * Retourne les données des posts sous forme de JSON
     */
    public function get_posts_data()
    {
        $input = $this->get_input('_limit', rcube_utils::INPUT_GET);
        $limit = $input !== null ? intval($input) : null;
        $pin = $this->get_input('_pin', rcube_utils::INPUT_GET) === "true";
        echo json_encode($this->_post_object_to_JSON(null, $limit ?? self::POST_DEFAULT_LIMIT, $pin));
        exit;
    }

    #endregion

    #region Enregistrement

    /**
     * Gère l'enregistrement d'un article et des tags qui lui sont associés
     * @return void
     */
    public function send_post()
    {
        $result = $this->_add_post();
        if ($result !== null) {
            // Le post est créé, notifier les utilisateurs
            $this->notify();  // Appel à la fonction de notification

            // Ensuite, passer à la gestion des tags
            $this->_manage_tags();
            //on notifie les utilisateur via le salon tchap associé si il éxiste
            tchap::send_message($this->get_input('_workspace', rcube_utils::INPUT_POST), $this->gettext("a_post_has_been_published", "mel_forum"));
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "mel_forum:: erreur de lors de la modification du post");
        }
    }

    /**
     * Crée un nouvel article dans l'espace de travail.
     *
     * Cette fonction récupère les valeurs des champs POST, valide les données saisies,
     * crée une nouvelle publication avec les propriétés définies, et sauvegarde l'article.
     * Elle extrait également les liens d'image du contenu et les enregistre.
     * La fonction retourne une réponse JSON indiquant le statut de la création de l'article.
     *
     * @return bool true si creation false si modif null si echec
     */
    protected function _add_post()
    {
        // récupérer les valeurs des champs POST
        $post_id = intval($this->get_input('_post_id', rcube_utils::INPUT_POST));
        $uid = $this->get_input('_uid', rcube_utils::INPUT_POST);
        $title = $this->get_input('_title', rcube_utils::INPUT_POST);
        $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST, true);
        $content = mel_helper::wash_html($content);
        $workspace_uid = $this->get_input('_workspace', rcube_utils::INPUT_POST);
        // création du summary à l'aide d'une fonction qui récupère les 2 premières phrases du content
        $summary = $this->_create_summary_from_content($content);
        $settings = $this->get_input('_settings', rcube_utils::INPUT_POST);

        // Validation des données saisies
        if (empty($title) || empty($content) || empty($summary) || empty($settings)) {
            return false;
        }

        // Détecter et sauvegarder les images en base64 dans le contenu
        $content = $this->_process_base64_images($content, $post_id);

        //charge l'article en bdd
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;
        $post->load();

        // Préparer les nouvelles données pour l'historique
        $new_data = [
            'title' => $title,
            'content' => $content,
            'settings' => $settings
        ];

        // Enregistrer les modifications dans l'historique
        $this->_save_post_history($post, $post->user_uid, $new_data);

        //gestion de miniature url
        preg_match_all('/<img[^>]+src="([^"]+)"[^>]*>/i', $content, $matches);
        $settings = json_decode($settings);
        $settings->miniature_url = $matches[1][0];
        $settings = json_encode($settings);

        //Définition des propriétés de l'article
        $post->title = $title;
        $post->summary = $summary;
        $post->content = $content;
        $post->modified = date('Y-m-d H:i:s');
        $post->settings = $settings;
        $post->workspace = $workspace_uid;

        // Sauvegarde de l'article
        if (mel_logs::is(mel_logs::TRACE))
            mel_logs::get_instance()->log(mel_logs::TRACE, "mel_forum:: post : $uid modified from workspace : $post->workspace by" . driver_mel::gi()->getUser()->uid);
        return $post->save();

    }

    /**
     * Crée un résumé à partir du contenu fourni.
     *
     * Cette fonction extrait les deux premières phrases du contenu, en ignorant
     * les balises images et en supprimant les espaces inutiles avant le texte.
     *
     * @param string $content Le contenu HTML complet.
     * @return string Le résumé généré à partir des deux premières phrases du contenu.
     */
    protected function _create_summary_from_content($content)
    {
        //TODO couper au saut de ligne

        // Suppression des balises <img> pour ne pas les prendre en compte
        $content = preg_replace('/<img[^>]*>/i', '', $content);

        // Suppression des balises HTML restantes pour ne garder que le texte brut
        $content = strip_tags($content);

        // Suppression des espaces inutiles (espaces multiples, tabulations, retours à la ligne)
        $content = preg_replace('/\s+/', ' ', $content);

        // Supprimer les espaces en début et fin de chaîne
        $content = trim($content);

        // Extraction des phrases en utilisant un délimiteur de phrase
        $sentences = preg_split('/(\. |\? |\! )/', $content, -1, PREG_SPLIT_NO_EMPTY);

        // Prendre les deux premières phrases
        $summary_sentences = array_slice($sentences, 0, 2);
        $summary = implode('. ', $summary_sentences);

        // Vérifier si le dernier caractère est un point final ou équivalent
        if (!preg_match('/[.!?]$/', $summary)) {
            $summary .= '.';
        }

        return $summary;
    }

    /**
     * Enregistre l'historique des modifications d'un article.
     * 
     * @param object $post L'article modifié.
     * @param string $user_uid L'UID de l'utilisateur effectuant la modification.
     * @param array $new_data Les nouvelles données de l'article.
     */
    protected function _save_post_history(&$post, $user_uid, $new_data)
    {
        // Charger l'historique actuel
        $history = $post->history;
        if (!is_array($history)) {
            $history = [];
        }

        // Accumuler les champs modifiés
        $modified_fields = [];
        foreach ($new_data as $field => $new_value) {
            $old_value = $post->$field;

            // Vérifier si le champ est `settings` et normaliser pour comparaison
            if ($field === 'settings') {
                // Encoder l'ancien tableau en JSON pour le comparer à la nouvelle chaîne
                $old_value = json_encode($old_value);
            }

            if ($old_value !== $new_value) {
                $modified_fields[] = $field;
            }
        }

        // Si des champs ont été modifiés, ajouter une seule entrée à l'historique
        if (!empty($modified_fields)) {
            // Ajouter l'entrée à l'historique
            $history[] = [
                'field' => $modified_fields,
                'user_id' => $user_uid,
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }

        // Supprimer les éléments `null` dans l'historique
        $history = array_filter($history, function ($entry) {
            return !is_null($entry);
        });

        // Réindexer l'historique (supprime les indices vides)
        $history = array_values($history);

        // Enregistrer l'historique mis à jour dans le champ `history`
        $post->history = json_encode($history);

        $post->save();
    }

    #endregion
    #region TAGS

    /**
     * fait le traitement de création suppression des tags
     */
    protected function _manage_tags()
    {
        $tags = $this->get_input('_tags', rcube_utils::INPUT_POST);
        if (is_null($tags)) $tags = [];
        $post_tags = $this->_get_tags_name_bypost($this->get_input('_uid', rcube_utils::INPUT_POST));
        if (empty(array_diff($tags, $post_tags))) {
            if (!empty(array_diff($post_tags, $tags))) {
                //il y a moins de tags suite à la modifs décorellé les tags
                $unlink_tags = array_diff($post_tags, $tags);
                foreach ($unlink_tags as $tag) {
                    $this->_unsassociate_tags_from_post($tag);
                    // si le tag est associé à aucun post le supprimer
                    if (!$this->_tag_is_associated_to_any_post($tag)) {
                        $this->_delete_tag($tag);
                    }
                }
            }
        } else {
            //il y plus de tag que dans la bdd
            $new_tags = array_diff($tags, $post_tags);
            foreach ($new_tags as $tag) {
                if (!$this->_exist_tag($tag)) {
                    //le tag n'éxiste pas encore il faut le créer
                    $this->_create_tag($tag);
                }
                //associé le tag au post
                $this->_associate_tag_with_post($tag);
            }
        }
    }

    /**
     * créer un tag dans l'espace de travail courant
     * @param string $name Nom du tag
     * @return bool $result
     */
    protected function _create_tag($name)
    {
        // Récupérer le Workspace
        $workspace_uid = $this->get_input('_workspace', rcube_utils::INPUT_POST);

        //Créer un tag
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();

        //Définition des propriétés du tag
        $tag->name = ucfirst(str_replace(' ', '', $name));
        mel_helper::load_helper($this->rc())->include_utilities();
        $tag->name = mel_utils::remove_accents($tag->name);

        $tag->workspace = $workspace_uid;

        // Sauvegarde du tag
        $ret = $tag->save();
        return (!is_null($ret));
    }

    /**
     * Supprime un tag de l'espace de travail courant
     * @param string $name Nom du tag
     * @return bool $result
     */
    private function _delete_tag($name)
    {
        // Récupérer le Workspace
        $workspace_uid = $this->get_input('_workspace', rcube_utils::INPUT_POST);

        // Récupérer le tag existant
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->name = $name;
        $tag->workspace = $workspace_uid;

        // Vérifier si le tag existe
        if (!$tag->load()) {
            return false;
        }
        // Supprimer le tag
        $ret = $tag->delete();
        return (!is_null($ret));
    }

    /**
     * Associe un tag à un post
     * @param string $name nom du tag
     */
    protected function _associate_tag_with_post($name)
    {
        $workspace_uid = $this->get_input('_workspace', rcube_utils::INPUT_POST);
        $uid = $this->get_input('_uid', rcube_utils::INPUT_POST);

        // Récupérer le tag existant
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->name = $name;
        $tag->workspace = $workspace_uid;

        if ($tag->load()) {
            $post = new LibMelanie\Api\Defaut\Posts\Post();
            $post->uid = $uid;

            if ($post->load()) {
                return $post->addTag($tag);
            }
        }
    }

    /**
     * Dessassocie un tag d'un post
     * @param string $name nom du tag
     */
    protected function _unsassociate_tags_from_post($name)
    {
        $workspace_uid = $this->get_input('_workspace', rcube_utils::INPUT_POST);
        $uid = $this->get_input('_uid', rcube_utils::INPUT_POST);

        // Récupérer le tag existant
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->name = $name;
        $tag->workspace = $workspace_uid;

        if ($tag->load() !== null) {
            $post = new LibMelanie\Api\Defaut\Posts\Post();
            $post->uid = $uid;

            if ($post->load() !== null) {
                return $post->removeTag($tag);
            }
        }
    }

    /**
     * récupère tout les tags associé à un post
     * @param string $uid uid du post
     * 
     * @return string[] $tags tableau des noms des tags du post
     */
    protected function _get_tags_name_bypost($post_uid)
    {
        // Récupérer l'article
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $post_uid;
        $tags = [];

        if ($post->load()) {
            $tags_objects = $post->listTags();
            foreach ($tags_objects as $tag) {
                $tags[] = $tag->name;
            }
        }
        return $tags;
    }

    /**
     * vérifie si un tag existe dans le workspace courant
     * @param string $exist_tag nom du tag à vérifie
     * @return bool le tag existe
     */
    protected function _exist_tag($exist_tag)
    {
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->workspace = $this->get_input('_workspace', rcube_utils::INPUT_POST);
        $tags = $tag->listTags();
        foreach ($tags as $tag) {
            if ($tag->name === $exist_tag) {
                return true;
            }
        }
        return false;
    }

    /**
     * vérifie si un tag est associé à un post dans le workspace
     * @param string $tag_name nom du tag à chercher
     * @return bool 
     */
    protected function _tag_is_associated_to_any_post($tag_name)
    {
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->workspace = $this->get_input('_workspace', rcube_utils::INPUT_POST);
        $tag->name = $tag_name;
        $tag->load();
        return (!($tag->countPosts() === 0));
    }

    /**
     * charge le post correspondant, et liste tous les tags associés à ce post.
     * Les tags sont ensuite renvoyés en réponse au format JSON.
     * 
     * @param \LibMelanie\Api\Defaut\Posts\Post $post objet post dont on veut récupérer les tags
     * @return void
     */
    protected function _get_all_tags_bypost($post)
    {
        $rettags = [];

        $tags = $post->listTags();

        foreach ($tags as $tag) {
            $rettags[] = ["name" => $tag->tag_name, "id" => $tag->id];
        }

        return $rettags;
    }
    #endregion
    #region COMMENTS

    /**
     * Crée un commentaire.
     *
     * Cette fonction récupère l'utilisateur actuel, le contenu du commentaire 
     * depuis la requête POST, valide le contenu, et crée un nouveau commentaire.
     * Elle retourne un message JSON indiquant le succès ou l'échec de l'opération.
     *
     * @return void
     */
    public function create_comment()
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();

        // Récupérer les données d'entrée
        $content = $this->get_input('_content', rcube_utils::INPUT_POST);
        $post = $this->get_input('_post_id', rcube_utils::INPUT_POST);
        $parent = $this->get_input('_parent', rcube_utils::INPUT_POST, true);
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_POST);
        $post_uid = $this->get_input('_post_uid', rcube_utils::INPUT_POST);

        // Validation des données
        if (empty($content)) {
            $this->sendEncodedExit([
                'status' => 'error',
                'message' => $this->gettext("comment_field_required", "mel_forum")
            ]);
        }

        // Création du commentaire
        $comment = new LibMelanie\Api\Defaut\Posts\Comment();
        $comment->content = $content;
        $comment->uid = $this->_generateRandomString(24);
        $comment->created = date('Y-m-d H:i:s');
        $comment->modified = date('Y-m-d H:i:s');
        $comment->creator = $user->uid;
        $comment->post = $post;

        // Associer le parent si fourni
        if (!empty($parent)) {
            $comment->parent = $parent;
        }

        // Sauvegarde du commentaire
        $ret = $comment->save(); // Appel à la méthode de sauvegarde
        if ($ret) {
            // Charger les données du commentaire pour récupérer l'ID
            if ($comment->load(['uid' => $comment->uid])) {
                $id = $comment->id; // Récupérer l'ID après le chargement
            } else {
                // Gestion si le chargement échoue
                $this->sendEncodedExit([
                    'status' => 'error',
                    'message' => $this->gettext("comment_creation_failed", "mel_forum")
                ]);
            }
            // Appel de la fonction de notification d'ajout d'un commentaire ou d'une réponse
            $this->notify_comment($workspace_uid, $parent, $post_uid);

        } else {
            // Gestion d'une erreur de sauvegarde
            $this->sendEncodedExit([
                'status' => 'error',
                'message' => $this->gettext("comment_creation_failed", "mel_forum")
            ]);
        }

        // Préparer les données du commentaire pour la réponse JSON
        $commentData = [
            'id' => $id, // Inclure l'ID récupéré
            'uid' => $comment->uid,
            'content' => $comment->content,
            'created' => $comment->created,
            'creator' => $comment->creator,
            'post' => $comment->post,
            'parent' => !empty($comment->parent) ? $comment->parent : null,
            'user_name' => $user->name,
            'workspace_uid' => $workspace_uid,
            'post_uid' => $post_uid,
        ];

        // Réponse JSON avec succès
        $this->sendEncodedExit([
            'status' => 'success',
            'message' => $this->gettext("comment_creation", "mel_forum"),
            'comment' => $commentData
        ]);
    }

    /**
     * Met à jour un commentaire existant.
     *
     * Cette fonction récupère l'utilisateur actuel, les nouvelles données du commentaire 
     * depuis la requête POST, charge le commentaire existant, et met à jour ses données.
     * Elle retourne un message JSON indiquant le succès ou l'échec de l'opération.
     *
     * @return void
     */
    public function update_comment()
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();

        // Récupérer les valeurs des champs POST
        $uid = $this->get_input('_uid', rcube_utils::INPUT_POST);
        $content = $this->get_input('_content', rcube_utils::INPUT_POST);

        // Récupérer le commentaire existant
        $comment = new LibMelanie\Api\Defaut\Posts\Comment();
        $comment->uid = $uid;

        if (!$comment->load()) {
            $this->sendEncodedExit([
                'status' => 'error',
                'message' => $this->gettext("comment_unfindable", "mel_forum")
            ]);
        }

        // Vérifier si le commentaire existe
        if (!$comment) {
            $this->sendEncodedExit([
                'status' => 'error',
                'message' => $this->gettext("comment_unfindable", "mel_forum")
            ]);
        }
        // Vérifier si l'utilisateur est bien l'auteur du commentaire
        if ($comment->user_uid !== $user->uid) { // Vérification si l'utilisateur est l'auteur
            $this->sendEncodedExit([
            'status' => 'error',
            'message' => $this->gettext("cannot_edit_comment", "mel_forum")
            ]);
        }

        // Définir les nouvelles données
        $comment->content = $content;
        $comment->modified = date('Y-m-d H:i:s');

        // Sauvegarde du commentaire
        $ret = $comment->save();
        if (!is_null($ret)) {
            $modifyData = [
                'content' => $comment->content,
                'modified' => $comment->modified,
                'user_name' => $user->name
            ];

            // Réponse JSON avec les modifications apportées au commentaire
            $this->sendEncodedExit([
                'status' => 'success',
                'message' => $this->gettext("comment_updated", "mel_forum"),
                'comment' => $modifyData
            ]);
        } else {
            $this->sendEncodedExit([
                'status' => 'error',
                'message' => $this->gettext("comment_updated_failure", "mel_forum")
                ]);
        }
    }

    /**
     * Supprime un commentaire existant.
     *
     * Cette fonction récupère l'utilisateur actuel, l'UID du commentaire depuis la requête POST,
     * charge le commentaire existant, et le supprime. Elle retourne un message JSON indiquant 
     * le succès ou l'échec de l'opération.
     *
     * @return void
     */
    public function delete_comment()
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();

        // Récupérer la valeur du champ POST
        $uid = $this->get_input('_uid', rcube_utils::INPUT_POST);

        // Récupérer l'ID du commentaire parent s'il s'agit d'une réponse
        $parent = $this->get_input('_parent', rcube_utils::INPUT_POST, true);

        // Validation de la donnée saisie
        if (empty($uid)) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_uid_required", "mel_forum")]);
            exit;
        }

        // Récupérer le commentaire existant
        $comment = new LibMelanie\Api\Defaut\Posts\Comment();
        $comment->uid = $uid;

        // Si c'est une réponse, on associe le commentaire parent
        if (!empty($parent)) {
            $comment->parent = $parent;
        }

        // Vérifier si le commentaire existe
        if (!$comment->load()) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_unfindable", "mel_forum")]);
            exit;
        }

        // Vérifier si l'utilisateur est bien l'auteur du commentaire
        if ($comment->user_uid !== $user->uid) { // Vérification si l'utilisateur est l'auteur
            echo json_encode(['status' => 'error', 'message' => $this->gettext("cannot_delete_comment", "mel_forum")]);
            exit;
        }

        // Supprimer le commentaire
        $ret = $comment->delete();
        if (!is_null($ret)) {
            echo json_encode(['status' => 'success', 'message' => $this->gettext("comment_deleted", "mel_forum")]);
        } else {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_deleted_failure", "mel_forum")]);
        }

        // Arrêt de l'exécution du script
        exit;
    }

    /**
     * Gère les actions de like et dislike sur un commentaire.
     *
     * Cette fonction permet à un utilisateur de liker ou disliker un commentaire, 
     * d'annuler une réaction existante, ou de changer sa réaction d'un like à un dislike, ou inversement. 
     * L'utilisateur ne peut pas réagir à ses propres commentaires.
     *
     * @return void Renvoie une réponse JSON avec un statut et un message correspondant au résultat de l'opération.
     */
    public function like_comment()
    {
        //TODO utiliser la même méthodo que les reactions aux posts

        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $user_uid = $user->uid;

        // Récupérer les valeurs
        $type = $this->get_input('_type', rcube_utils::INPUT_POST);
        $comment_id = $this->get_input('_comment_id', rcube_utils::INPUT_POST);
        $comment_uid = $this->get_input('_comment_uid', rcube_utils::INPUT_POST);

        // Validation des données saisies
        if (empty($type) || empty($comment_id)) {
            $this->sendEncodedExit(['status' => 'error', 'message' => $this->gettext("every_field_required", "mel_forum")]);
        }

        // Charger le commentaire pour récupérer son id et son créateur
        $comment = new LibMelanie\Api\Defaut\Posts\Comment();
        $comment->uid = $comment_uid;

        if (!$comment->load()) {
            $this->sendEncodedExit(['status' => 'error', 'message' => $this->gettext("comment_unfindable", "mel_forum")]);
        }

        // Vérifier si un like ou dislike existe déjà
        $existing_reaction = new LibMelanie\Api\Defaut\Posts\Comments\Like();
        $existing_reaction->comment = $comment_id;
        $existing_reaction->creator = $user_uid;

        // Initialiser la variable de message et de status
        $message = '';
        $status = 'success';

        // Tester si le type est "like"
        $existing_reaction->type = 'like';
        if ($existing_reaction->load()) {
            // Si le type est le même, l'utilisateur essaie d'annuler sa réaction
            if ($type === 'like') {
                $existing_reaction->delete();
                $message = $this->gettext("unlike", "mel_forum");
            } else {
                // Sinon, l'utilisateur change de réaction (like -> dislike)
                $existing_reaction->delete();
                $message = $this->gettext("like_to_dislike", "mel_forum");

                $reaction = new LibMelanie\Api\Defaut\Posts\Comments\Like();
                $reaction->comment = $comment_id;
                $reaction->creator = $user_uid;
                $reaction->type = $type;

                // Sauvegarde de la nouvelle réaction
                $ret = $reaction->save();
                if (is_null($ret)) {
                    $this->sendEncodedExit(['status' => 'error', 'message' => gettext("failed_to_save...", "mel_forum") . $type . '.']);
                }
                $message = ucfirst($type) . gettext("...saved", "mel_forum");
            }
        } else {
            // Si aucun like n'existe, tester pour le dislike
            $existing_reaction->type = 'dislike';
            if ($existing_reaction->load()) {
                // Si le type est le même, l'utilisateur essaie d'annuler sa réaction
                if ($type === 'dislike') {
                    $existing_reaction->delete();
                    $message = gettext("undislike", "mel_forum");
                } else {
                    // Sinon, l'utilisateur change de réaction (dislike -> like)
                    $existing_reaction->delete();
                    $message = gettext("dislike_to_like", "mel_forum");

                    $reaction = new LibMelanie\Api\Defaut\Posts\Comments\Like();
                    $reaction->comment = $comment_id;
                    $reaction->creator = $user_uid;
                    $reaction->type = $type;

                    // Sauvegarde de la nouvelle réaction
                    $ret = $reaction->save();
                    if (is_null($ret)) {
                        $this->sendEncodedExit(['status' => 'error', 'message' => gettext("failed_to_save...", "mel_forum") . $type . '.']);
                    }
                    $message = ucfirst($type) . $this->gettext("...saved", "mel_forum");
                }
            } else {
                // Si aucune réaction n'existe, on va créer une nouvelle réaction
                $reaction = new LibMelanie\Api\Defaut\Posts\Comments\Like();
                $reaction->comment = $comment_id;
                $reaction->creator = $user_uid;
                $reaction->type = $type;

                // Sauvegarde de la nouvelle réaction
                $ret = $reaction->save();
                if (is_null($ret)) {
                    $this->sendEncodedExit(['status' => 'error', 'message' => gettext("failed_to_save...", "mel_forum") . $type . '.']);
                }
                $message = ucfirst($type) . $this->gettext("...saved", "mel_forum");
            }
        }

        // Retourner la réponse JSON avec le statut et le message approprié
        $this->sendEncodedExit(['status' => $status, 'message' => $message]);
    }

    /**
     * Récupère tous les commentaires associés à un article spécifique ou les réponses d'un commentaire.
     *
     * Cette méthode récupère les paramètres d'entrée pour l'UID de l'article, l'ordre de tri des commentaires,
     * et l'ID d'un commentaire spécifique si les réponses sont requises. Elle instancie l'objet `Post` pour 
     * charger les commentaires associés. Les commentaires sont triés selon le paramètre spécifié et retournés 
     * au format JSON.
     *
     * Les commentaires sont également enrichis d'informations sur l'utilisateur, le formatage de la date, 
     * ainsi que le nombre de réactions (likes et dislikes) et les interactions de l'utilisateur courant.
     *
     * @return void Affiche un tableau JSON contenant les commentaires associés à l'article, 
     *               ou les réponses à un commentaire spécifique, et termine le script.
     */
    public function get_all_comments_bypost()
    {
        // Récupérer l'uid de l'article
        $uid = $this->get_input('_post_uid', rcube_utils::INPUT_GPC);

        // Récupérer le paramètre de tri des commentaires
        $sort_order = $this->get_input('_sort_order', rcube_utils::INPUT_GPC, true);

        // Récupérer l'ID du commentaire pour obtenir ses enfants (réponses)
        $param_comment_id = $this->get_input('_comment_id', rcube_utils::INPUT_GPC, true);

        // Initialisation des variables de tri
        $orderby = 'created';
        $asc = false; // Par défaut, tri descendant

        // Définir l'ordre et le tri en fonction du paramètre choisi
        if ($sort_order === 'date_asc') {
            $orderby = 'created';
            $asc = true; // Tri ascendant
        } elseif ($sort_order === 'reactions') {
            $orderby = 'likes'; // Tri par nombre de réactions
        } elseif ($sort_order === 'replies') {
            $orderby = 'children'; // Tri par nombre de réponses
        }

        // Instancier l'objet Post
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;

        $comments_array = [];

        if ($post->load()) {
            // Si un ID de commentaire est fourni, récupérer les réponses de ce commentaire
            if ($param_comment_id) {
                $comment = new LibMelanie\Api\Defaut\Posts\Comment();
                $comment->id = $param_comment_id;
                $comments = $comment->listChildren(null, $orderby, $asc);

                // Récupérer les réponses triées
            } else {
                // Sinon, récupérer tous les commentaires du post
                $comments = $post->listComments(true, null, $orderby, $asc);
            }

            // Traitement des commentaires récupérés
            if (!empty($comments)) {
                foreach ($comments as $comment) {
                    // Récupérer l'utilisateur associé au commentaire
                    $user = driver_mel::gi()->getUser($comment->user_uid);

                    // S'il y a un utilisateur et un nom, utiliser le nom ; sinon utiliser une valeur par défaut
                    $user_name = ($user !== null && !empty($user->name)) ? $user->name : '? ?';

                    // Définir la locale en français pour le formatage de la date
                    $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::SHORT);

                    // Convertir la date du commentaire en timestamp Unix
                    $timestamp = strtotime($comment->created);

                    // Formater la date
                    $formatted_date = $formatter->format($timestamp);

                    $count = ['like' => 0, 'dislike' => 0];

                    // Test si l'utilisateur courant a réagi au commentaire
                    $comment_reactions = $comment->listLikes();
                    $current_user_reacted = '';
                    foreach ($comment_reactions as $reaction) {
                        if ($reaction->user_uid === driver_mel::gi()->getUser()->uid) {
                            $current_user_reacted = $reaction->like_type;
                        }

                        $count[$reaction->like_type]++;
                    }

                    // Ajouter le commentaire au tableau des commentaires
                    $comments_array[$comment->uid] = [
                        'id' => $comment->id,
                        'uid' => $comment->uid,
                        'post_id' => $comment->post_id,
                        'user_id' => $comment->user_uid,
                        'user_email' => $user->email,
                        'user_name' => $user_name, // Utiliser le nom ou la valeur par défaut
                        'content' => $comment->content,
                        'created' => $formatted_date,
                        'parent' => $comment->parent,
                        'children_number' => $comment->countChildren(),
                        'likes' => $count['like'],
                        'dislikes' => $count['dislike'],
                        'current_user_reacted' => $current_user_reacted,
                    ];
                }
            }

            // Retourner le tableau des commentaires
            echo json_encode($comments_array);
        }
        exit;
    }

    #endregion
    #region Images

    /**
     * Traite les images en base64 dans le contenu fourni et les associe au post donné.
     *
     * Cette fonction effectue les étapes suivantes :
     * 1. Récupère les images existantes associées au post.
     * 2. Extrait les balises `<img>` du contenu et vérifie la présence d'images encodées en base64.
     * 3. Valide les images en base64, les enregistre et remplace leurs balises `<img>` par des URLs correspondantes.
     * 4. Identifie les images non utilisées et les supprime de la base de données.
     *
     * @param string $content Le contenu contenant éventuellement des images en base64.
     * @param int $post_id L'identifiant du post auquel les images sont associées.
     * @return string Le contenu modifié avec les images traitées.
     */
    protected function _process_base64_images($content, $post_id)
    {
        // Récupérer les images existantes associées au post
        $existingImageUids = $this->_get_all_images_by_post($post_id);

        // Tableau pour collecter les URLs des images réellement utilisées
        $usedImageUrls = [];
        $usedImageUids = []; // Collecter les UIDs des images utilisées

        // Expression régulière pour détecter les balises <img>
        preg_match_all('/<img[^>]+src="([^"]+)"[^>]*>/i', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $img) {
            $src = $img[1]; // Source de l'image (base64 ou URL)

            if (strpos($src, 'data:image/') === 0) {
                // C'est déjà une image en base64, on vérifie sa validité
                if (!$this->_is_valid_base64_image($src)) {
                    //TODO utiliser le plugin mel_logs en debug
                    error_log("Invalid base64 image, skipping.");
                    continue;
                }

                $imageUid = $this->_save_image($post_id, $src);

                if ($imageUid) {
                    // Générer l'URL contenant l'UID de l'image
                    $imageUrl = $this->_get_image_url($imageUid);

                    // Collecter les URLs et les UIDs des images utilisées
                    $usedImageUrls[] = $imageUrl;
                    $usedImageUids[] = $imageUid;

                    // Remplacer la balise <img> par celle avec l'URL
                    $content = str_replace($img[0], '<img src="' . $imageUrl . '" />', $content);
                }
            }
        }

        foreach ($existingImageUids as $existingImageUid) {
            if (strpos($content, $existingImageUid) !== false) {
                $usedImageUids[] = $existingImageUid;
            }
        }

        // Identifier les images obsolètes (non utilisées dans le contenu)
        $obsoleteImageUids = array_diff($existingImageUids, $usedImageUids);

        // Supprimer les images obsolètes de la BDD
        foreach ($obsoleteImageUids as $uid) {
            $this->_delete_image($uid);
        }

        return $content;
    }

    /**
     * Vérifie si une chaîne Base64 représente une image valide.
     *
     * Cette fonction analyse la chaîne pour s'assurer qu'elle suit le format attendu 
     * (`data:image/<type>;base64,<data>`), puis tente de décoder la partie Base64 pour confirmer 
     * qu'elle contient des données valides.
     *
     * @param string $base64 La chaîne Base64 à valider.
     * 
     * @return bool Retourne `true` si la chaîne est une image Base64 valide, sinon `false`.
     *
     * @throws Exception Peut générer une erreur si la chaîne n'est pas correctement formatée.
     *
     * @example $isValid = $this->_is_valid_base64_image('data:image/png;base64,iVBORw...');
     */
    protected function _is_valid_base64_image($base64)
    {
        // Vérifiez si le format correspond à data:image/<type>;base64,<data>
        if (!preg_match('/^data:image\/[a-zA-Z]+;base64,/', $base64)) {
            return false;
        }

        // Extraire la partie base64 et la décoder
        $data = explode(',', $base64)[1] ?? '';
        $decodedData = base64_decode($data, true);

        return $decodedData !== false; // Retourne true si les données sont décodables
    }

    /**
     * Enregistre une image associée à un post, avec ses données encodées.
     *
     * Cette fonction valide les données fournies, crée une nouvelle image 
     * associée à l'ID du post donné, et tente de la sauvegarder. 
     * Si la sauvegarde réussit, l'UID de l'image est retourné pour permettre 
     * la génération d'une URL associée.
     *
     * @param int    $post_id L'ID du post auquel associer l'image.
     * @param string $data    Les données de l'image encodées en base64.
     * 
     * @return string|false L'UID de l'image en cas de succès, ou false en cas d'échec.
     */
    protected function _save_image($post_id, $data)
    {
        // Validation des données saisies
        if (empty($post_id) || empty($data)) {
            echo json_encode(['status' => 'error', 'message' => gettext("image_field_required", "mel_forum")]);
            return false;
        }

        // Créer une nouvelle image
        $image = new LibMelanie\Api\Defaut\Posts\Image();
        $image->uid = $this->_generateRandomString(24);
        $image->post_id = $post_id;
        $image->data = $data;

        // Sauvegarde de l'image
        if ($image->save()) {
            return $image->uid;  // Retourner l'UID de l'image pour créer une URL
        }

        return false;
    }

    /**
     * Récupère toutes les images associées à une publication.
     *
     * Cette fonction instancie un objet Post et utilise la méthode `listImages()`
     * pour récupérer les images associées au post identifié par `$post_id`.
     * Elle retourne un tableau contenant les données de toutes les images ou un
     * tableau vide si aucune image n'est trouvée.
     *
     * @param string $post_id L'identifiant de la publication pour laquelle les images doivent être récupérées.
     * @return array Un tableau contenant les données des images associées à la publication, ou un tableau vide si aucune image n'est trouvée.
     */
    protected function _get_all_images_by_post($post_id)
    {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->post_id = $post_id;

        $images = $post->listImages();
        if (empty($images)) {
            error_log("Aucune image trouvée pour le post_id: $post_id");
            return [];
        }

        $uids = [];
        foreach ($images as $image) {
            if (isset($image->uid)) {
                $uids[] = $image->uid;
            } else {
                error_log("Image sans 'uid' pour le post_id: $post_id");
            }
        }

        return $uids; // Retourner les UIDs des images
    }

    /**
     * Supprime une image associée à un post.
     *
     * Cette fonction charge l'image en fonction de son UID et, si elle existe,
     * la supprime. Elle retourne un booléen indiquant si l'opération a réussi.
     *
     * @param string $image_uid L'UID de l'image à supprimer.
     * @return bool True si l'image a été supprimée, false sinon.
     */
    protected function _delete_image($uid)
    {
        // Récupérer l'image existante
        $image = new LibMelanie\Api\Defaut\Posts\Image();
        $image->uid = $uid;

        // Vérifier si l'image existe
        if (!$image->load()) {
            return false; // Image non trouvée
        }

        // Supprimer l'image
        $ret = $image->delete();
        return (!is_null($ret)); // Retourne true si l'image a été supprimée, false sinon
    }

    /**
     * Upload une image dont les paramètre sont passé dans le post
     */
    public function upload_image()
    {
        $post_id = $this->get_input('_post_id', rcube_utils::INPUT_POST);
        // $post = new LibMelanie\Api\Defaut\Posts\Post();
        // $post->post = $post_id;
        $image = new LibMelanie\Api\Defaut\Posts\Image();
        $image->post = $post_id;
        $image->data = $this->get_input('_file', rcube_utils::INPUT_POST);
        $image->uid = $this->_generateRandomString(24);
        // Sauvegarde de l'image
        $ret = $image->save();
        if (!is_null($ret)) {
            $url = $this->_get_image_url($image->uid);
            echo json_encode(['status' => 'success', 'image_uid' => $image->uid, 'url' => $url]);
            exit;
        }
    }

    /**
     * Renvoie une url permettant d'afficher une image de la base de donnée
     * @param string $uid uid de l'image que l'on veut afficher
     * @return string url de l'image
     */
    protected function _get_image_url($uid)
    {
        $rcmail = rcmail::get_instance();
        $url = $rcmail->url(array(
            "_task" => "forum",
            "_action" => "load_image",
            "_image_uid" => $uid,
        ), false, true, true);
        return $url;
    }

    /**
     * Affiche l'image dont l'uid est passé dans les paramètres (POST)
     */
    public function load_image()
    {
        $image = new LibMelanie\Api\Defaut\Posts\Image();
        $image->uid = $this->get_input('_image_uid', rcube_utils::INPUT_GET);
        $ret = $image->load();
        if (!is_null($ret)) {
            $img = $image->data;
            $this->rc()->output->sendExit(base64_decode(explode(',', $img)[1]), ['Content-Type: ' . rcube_mime::image_content_type($img)]);
        } else {
            // TODO tester les erreurs
            echo json_encode(['status' => 'error', 'message' => $this->gettext("failed_to_load_image", "mel_forum")]);
            exit;
        }
        if (!empty($_GET['_error'])) {
            $this->rc()->output->sendExit('', ['HTTP/1.0 404 Photo not found']);
        }
        $this->rc()->output->sendExit(base64_decode(rcmail_output::BLANK_GIF), ['Content-Type: image/gif']);
    }

    #endregion
    #region Post Épinglé

    /**
     * Affiche la page post à la une
     * @return void
     */
    public function front_page_post()
    {
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        if (driver_mel::gi()->getUser()->isWorkspaceMember($workspace_uid)) {
            $this->include_web_component()->Avatar();
            $this->load_script_module('front_page_post');
            $this->rc()->output->set_env('_workspace_uid', $workspace_uid);
            $this->rc()->output->set_env('posts_data', $this->_post_object_to_JSON(null, 0, true));
            // Envoyer le template approprié
            $this->rc()->output->send('mel_forum.front-page-post');
        } else {
            $this->_display_error_page();
        }
    }

    /**
     * rafraichis la page post à la une en renvoyant les données au format json
     * @return void
     */
    public function refresh_front_page_post()
    {
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        if (driver_mel::gi()->getUser()->isWorkspaceMember($workspace_uid)) {
            echo json_encode($this->_post_object_to_JSON(null, 0, true));
            exit;
        } else {
            $this->_display_error_page();
        }
    }

    /**
     * épingle/désépingle le post passé en paramètre du POST
     * @return void
     */
    public function pin_post()
    {
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_POST);
        if (driver_mel::gi()->getUser()->isWorkspaceOwner($workspace_uid)) {
            $post_uid = $this->get_input('_post_id', rcube_utils::INPUT_POST);
            $workspace = mel_workspace::Workspace($workspace_uid);
            if ($workspace->settings()->get('forum_pinned_post') === $post_uid) {
                $workspace->settings()->set('forum_pinned_post', '');
            } else {
                $workspace->settings()->set('forum_pinned_post', $post_uid);
            }
            $workspace->save();
        }
    }

    #endregion
    #region Favoris

    /**
     * vérifie si un article est en favori
     * @param string $post_uid 
     * @param string $workspace_uid 
     * @return bool si l'article est en favori
     */
    protected function _is_fav($post_uid, $workspace_uid)
    {
        $fav_articles = $this->rc()->config->get('favorite_article', []);
        return isset($fav_articles[$workspace_uid]) && in_array($post_uid, $fav_articles[$workspace_uid]);
    }


    /**
     * ajoute un article aux favoris dans les user pref ou le suprime
     * @return void
     */
    public function manage_favorite()
    {
        $new_fav_post_workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_POST);
        $new_fav_post_uid = $this->get_input('_article_uid', rcube_utils::INPUT_POST);
        $fav_articles = $this->rc()->config->get('favorite_article', []);
        if (!in_array($new_fav_post_uid, $fav_articles[$new_fav_post_workspace_uid])) {
            if (!isset($fav_articles[$new_fav_post_workspace_uid])) {
                $fav_articles[$new_fav_post_workspace_uid] = [];
            }
            $fav_articles[$new_fav_post_workspace_uid][] = $new_fav_post_uid;
            $this->rc()->user->save_prefs(array('favorite_article' => $fav_articles));
        } else {
            $this->_remove_from_favorite($new_fav_post_uid, $fav_articles, $new_fav_post_workspace_uid);
        }
    }


    /**
     * retire un article des favoris dans les user pref
     * @param string $article_uid uid de l'article à retirer des favori
     * @param array $fav_articles tableau des favoris
     * @param string $workspace_uid uid du workspace
     */
    protected function _remove_from_favorite($article_uid, $fav_articles, $workspace_uid)
    {
        if (isset($fav_articles[$workspace_uid])) {
            $index = array_search($article_uid, $fav_articles[$workspace_uid]);
            if ($index !== false) {
                unset($fav_articles[$workspace_uid][$index]);
                // Ré-indexe le tableau pour éviter les trous dans les indices
                $fav_articles[$workspace_uid] = array_values($fav_articles[$workspace_uid]);
                $this->rc()->user->save_prefs(array('favorite_article' => $fav_articles));
            }
        }
    }

    #endregion
    #region Posts Reactions 

    /**
     * Gestion des réactions aux posts
     */
    public function manage_reaction()
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $user_uid = $user->uid;

        $type = $this->get_input('_type', rcube_utils::INPUT_POST);
        $post_id = intval($this->get_input('_post_id', rcube_utils::INPUT_POST));

        $reaction = new LibMelanie\Api\Defaut\Posts\Reaction();
        $reaction->post = $post_id;
        $reaction->creator = $user_uid;
        $reaction->type = $type;
        switch ($type) {
            case "like":
                $opposite_type = "dislike";
                break;
            case "dislike":
                $opposite_type = "like";
                break;
            default:
                $opposite_type = null;
        }

        //on vérifie si la réaction existe déjà
        if ($reaction->load()) {
            //la réaction existe déjà on la supprime
            $reaction->delete();
        } else {
            //elle n'existe pas on la créé
            $reaction->save();
            //on vérifie qu'une réaction contraire n'éxiste pas déjà pour cette utilisateur
            if (!is_null($opposite_type)) {
                $opposite_reaction = new LibMelanie\Api\Defaut\Posts\Reaction();
                $opposite_reaction->post = $post_id;
                $opposite_reaction->creator = $user_uid;
                $opposite_reaction->type = $opposite_type;
                if ($opposite_reaction->load()) {
                    //on supprime la réaction opposée
                    $opposite_reaction->delete();
                }
            }
        }
        echo json_encode(["status" => "success"]);
        exit;
    }

    /**
     * Vérifie si l'utilisateur courant à mit la réaction passée en paramètre au post passé en paramètre
     * @param string $type type de la reaction
     * @param Reaction[] $reactions uid de l'article
     * 
     * @return boolean 
     */
    protected function _has_Reacted($type, $reactions)
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $user_uid = $user->uid;

        foreach ($reactions as $reaction) {
            if ($reaction->user_uid === $user_uid && $reaction->type === $type) {
                return true;
            }
        }
        return false;
    }

    /**
     * retourne un tableau avec les noms des personnes qui ont réagit au post passé en paramètre avec la réaction 
     * @param \LibMelanie\Api\Defaut\Posts\Post $post objet post
     * @param string $type type de la reaction
     * 
     */
    protected function _get_names_by_reaction($post, $type) {
        $type_reactions = $post->listReactions($type);
        $type_name = [];
        foreach($type_reactions as $type_reaction)
        {
            $type_name[] = driver_mel::gi()->getUser($type_reaction->creator)->name;
        }
        return $type_name;
    }

    #endregion
    #region Derniers articles

    /**
     * Affiche la page des 3 posts du workspace.
     *
     * Cette fonction enregistre un template pour afficher les publications du forum
     * et envoie le modèle 'mel_forum.forum' à la page qui affiche les articles.
     *
     * @return void
     */
    public function new_posts()
    {
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        if (driver_mel::gi()->getUser()->isWorkspaceMember($workspace_uid)) {
            $this->include_web_component()->Avatar();
            $this->load_script_module('new_posts');
            $this->_show_new_posts();
            $this->rc()->output->set_env('workspace_uid', $workspace_uid);
            // Envoyer le template approprié
            $this->rc()->output->send('mel_forum.new-posts');
        } else {
            $this->_display_error_page();
        }
    }

    /**
     * Affiche les 3 derniers posts dans le Workspace.
     *
     * - Récupère les nouveaux posts pour un espace de travail donné.
     * - Convertit les objets de post en format JSON.
     * - Définit les données des posts dans l'environnement de sortie pour les utiliser dans la vue.
     *
     * @returns {void}
     */
    protected function _show_new_posts()
    {
        $this->rc()->output->set_env('posts_data', $this->_post_object_to_JSON(null, 3, false));
    }


    /**
     * Bloquer les refresh
     * @param array $args
     */
    function refresh($args)
    {
        return array('abort' => true);
    }

    #region Téléchargements

    /**
     * Télécharge un article sous forme de fichier dans le format spécifié (html ou markdown).
     *
     * @return void
     */
    public function download_article()
    {
        // Récupérer l'UID de l'article et le format depuis la requête HTTP
        $uid = $this->get_input('_uid', rcube_utils::INPUT_GPC);
        $format = $this->get_input('_format', rcube_utils::INPUT_GPC); // paramètre pour le format

        // Récupérer l'article à partir de son UID
        $post = $this->_get_post($uid);

        // Traiter en fonction du format
        switch (strtolower($format)) {
            case 'markdown':
                $markdownContent = $this->convert_post_in_markdown($post); // Convertir en Markdown
                $this->download_zip($post->title, $markdownContent, $post); // Télécharger sous forme de ZIP
                break;

            case 'html':
                $htmlContent = $this->convert_post_in_html($post); // Convertir en HTML

                // Remplacer les URLs d'images par leurs données base64
                $htmlContent = $this->replace_image_urls_with_base64($htmlContent, $post->id);

                $fileName = $post->title . '.html';
                $mimeType = 'text/html';
                $this->send_file($fileName, $htmlContent, $mimeType); // Télécharger directement le fichier HTML
                break;
        }
    }

    /**
     * Récupère les commentaires d'un post, ainsi que leurs sous-commentaires si spécifié.
     *
     * @param string $post_uid L'identifiant unique du post pour lequel récupérer les commentaires.
     * @param int|null $param_comment_id (Optionnel) L'identifiant d'un commentaire spécifique pour lequel récupérer les sous-commentaires.
     * 
     * @return array Un tableau contenant les structures des commentaires associés au post. Si aucun commentaire n'est trouvé, retourne un tableau vide.
     */
    protected function get_comments_for_post($post_uid, $param_comment_id = null)
    {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $post_uid;

        $comments_array = [];

        if ($post->load()) {
            if ($param_comment_id) {
                $comment = new LibMelanie\Api\Defaut\Posts\Comment();
                $comment->id = $param_comment_id;
                $comments = $comment->listChildren(null, 'created', false);
            } else {
                $comments = $post->listComments(true, null, 'created', false);
            }

            foreach ($comments as $comment) {
                $comments_array[] = $this->build_comment_structure($comment);
            }
        }

        return $comments_array;
    }

    /**
     * Convertit un post en format Markdown avec auteur et date formatée.
     *
     * Cette méthode effectue les opérations suivantes :
     * 1. Convertit le titre du post en Markdown en le précédant d'un symbole `#` pour en faire un titre de premier niveau.
     * 2. Ajoute le nom de l'auteur du post.
     * 3. Ajoute la date de création du post, formatée.
     * 4. Récupère le contenu HTML du post et le convertit en Markdown en utilisant un convertisseur HTML-to-Markdown.
     * 5. Combine le titre Markdown, l'auteur, la date et le contenu Markdown pour créer le post complet.
     *
     * @param object $post L'objet représentant le post à convertir, contenant les propriétés `title`, `content`, et `created`.
     * 
     * @return string Le post complet au format Markdown.
     */
    public function convert_post_in_markdown($post)
    {
        // Vérifier si le post est introuvable
        if (!$post || empty($post->title) || empty($post->content)) {
            return $this->gettext("article_unfindable", "mel_forum");
        }

        // Convertir le titre en Markdown
        $markdown_title = "# " . $post->title . "\n\n";  // Ajouter un saut de ligne après le titre

        // Récupérer le nom de l'auteur
        $author_name = $this->show_post_creator_name();
        $markdown_author = $this->gettext("author_md", "mel_forum") . $author_name . "*\n\n";  // Ajouter un saut de ligne après l'auteur

        // Récupérer et formater la date de création
        $date = new DateTime($post->created);
        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);
        $formatted_date_localized = $formatter->format($date);

        // Inclure la date formatée dans le Markdown
        $markdown_date = $this->gettext("create_date_md", "mel_forum") . $formatted_date_localized . "*\n\n";  // Ajouter un saut de ligne après la date
        $separator = "\n" . str_repeat('-', 35) . "\n\n";  // Séparateur similaire à celui utilisé pour les sections

        // Ajouter un séparateur après la date de création
        $markdown_date .= $separator;

        // Récupérer le contenu HTML
        $html_content = $post->content;

        // Convertir le contenu HTML en Markdown sans nettoyage préalable
        $converter = new HtmlConverter([
            'strip_tags' => true,  // Supprime les balises non prises en charge
            'hard_break' => true,  // Convertit les <br> en retour à la ligne
        ]);
        $markdown_content = $converter->convert($html_content);

        // Nettoyer le contenu Markdown pour les sauts de ligne excessifs
        $markdown_content = $this->clean_markdown_content($markdown_content);

        // Ajouter le titre de second niveau "Commentaires et réponses"
        $comments_section_title = $this->gettext("##_comments_and_responses", "mel_forum") . "\n\n";

        // Récupérer les commentaires et les réponses
        $uid = $post->uid; // Assurez-vous que vous avez l'UID du post
        $comments_array = $this->get_comments_for_post($uid);

        // Convertir les commentaires en Markdown
        $comments_markdown = $this->format_comments_in_markdown($comments_array);

        // Combiner le titre, l'auteur, la date, le contenu et les commentaires avec des retours à la ligne appropriés
        $complete_markdown = implode("\n", [
            $markdown_title,
            $markdown_author,
            $markdown_date,
            $markdown_content,
            $comments_section_title,
            $comments_markdown
        ]);

        return $complete_markdown;
    }

    /**
     * Nettoie et formate le contenu Markdown en appliquant diverses règles de mise en forme.
     *
     * Cette méthode effectue les opérations suivantes sur le contenu Markdown :
     * 1. Remplace les retours à la ligne multiples par un seul retour à la ligne.
     * 2. Ajoute un espace supplémentaire après les titres et entre les sections, notamment avant les lignes de soulignement.
     * 3. Ajoute un double saut de ligne entre chaque paragraphe.
     * 4. Remplace les lignes de séparation (---) par un nombre fixe d'espaces pour une séparation uniforme.
     *
     * @param string $content Le contenu Markdown à nettoyer et formater.
     *
     * @return string Le contenu nettoyé et correctement formaté.
     */
    protected function clean_markdown_content($content)
    {
        // Remplacer les retours à la ligne multiples par un seul
        $content = preg_replace('/\n+/', "\n", $content);
    
        // Ajouter un espace après les titres et entre les sections (avant les lignes de soulignement)
        $content = preg_replace('/([a-zA-Z0-9])(\n)([-=]+)(\n)/', '$1\n\n$3\n', $content);  // Assurer un bon espacement entre les sections
    
        // Ajouter un saut de ligne entre chaque paragraphe
        $content = preg_replace('/([^\n])\n([^\n])/', "$1\n\n$2", $content);  // Ajoute un double saut de ligne entre les paragraphes
    
        // Remplacer les lignes de séparation (---) qui suivent les titres de sections par un nombre fixe d'espaces
        $content = preg_replace('/^-{5,}/', '-----', $content);  // Unifié pour une séparation propre
    
        return $content;
    }

    /**
     * Convertit un post en HTML avec auteur, date de création, commentaires et réponses.
     *
     * @param object $post Objet contenant les données du post
     * @return string Contenu en HTML
     */
    /**
     * Convertit un post en HTML avec auteur, date de création, commentaires et réponses.
     *
     * @param object $post Objet contenant les données du post
     * @return string Contenu en HTML
     */
    protected function convert_post_in_html($post)
    {
        // Construire une structure HTML complète
        $html = "<!DOCTYPE html>";
        $html .= "<html lang='fr'>";
        $html .= "<head>";
        $html .= "<meta charset='UTF-8'>";
        $html .= "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
        $html .= "<title>" . htmlspecialchars($post->title) . "</title>";
        $html .= "<style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #202122; background-color: #ffffff; margin: 20px; }
            h1, h2, h3 { color: #333; }
            p { margin-bottom: 1em; }
            a { color: #36c; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .metadata { font-size: 0.9em; color: #555; margin-bottom: 20px; }
            .comments-section { margin-top: 40px; }
            .comment { margin-bottom: 20px; padding-left: 20px; border-left: 2px solid #ddd; }
            .reply { margin-top: 10px; padding-left: 20px; border-left: 2px dashed #ccc; }
          </style>";
        $html .= "</head>";
        $html .= "<body>";

        // Titre de l'article
        $html .= "<h1>" . htmlspecialchars($post->title) . "</h1>";

        // Ajout de l'auteur et de la date de création
        $author_name = $this->show_post_creator_name(); // Récupère le nom de l'auteur
        $date = new DateTime($post->created);
        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);
        $formatted_date_localized = $formatter->format($date);
        $html .= "<div class='metadata'>" . $this->gettext("author_html", "mel_forum") . htmlspecialchars($author_name) . "<br>" . $this->gettext("create_date_html", "mel_forum") . htmlspecialchars($formatted_date_localized) . "</div>";

        // Contenu de l'article
        $html .= "<div>" . $this->sanitize_content($post->content) . "</div>";

        // Récupération des commentaires et sous-commentaires
        $uid = $post->uid; // UID de l'article
        $comments_array = $this->get_comments_for_post($uid);

        if (!empty($comments_array)) {
            $html .= "<div class='comments-section'>";
            $html .= "<h2>" . $this->gettext("comments_and_responses", "mel_forum") . "</h2>";
            $html .= $this->format_comments_in_html($comments_array);
            $html .= "</div>"; // Fin de la section des commentaires
        }

        $html .= "</body>";
        $html .= "</html>";

        return $html;
    }

    /**
     * Nettoie le contenu en supprimant les balises HTML non autorisées, en remplaçant les espaces multiples et les retours à la ligne inutiles.
     * 
     * Cette fonction permet de conserver certaines balises HTML de base (comme <p>, <a>, <ul>, <li>, <h1>, <h2>, <h3>, <img>, <br>, <strong>, <em>),
     * remplace les espaces multiples par un seul espace, gère les retours à la ligne excessifs, et ajoute un retour à la ligne pour chaque paragraphe.
     * Elle nettoie également les espaces en début et fin de chaîne.
     *
     * @param string $content Le contenu brut à nettoyer
     * @return string Le contenu nettoyé
     */
    protected function sanitize_content($content)
    {
        // Permet de conserver les balises HTML de base
        $content = strip_tags($content, '<p><a><ul><li><h1><h2><h3><img><br><strong><em>');

        // Remplacer les espaces multiples par un seul espace
        $content = preg_replace('/\s+/', ' ', $content);

        // Enlever les retours à la ligne inutiles
        $content = preg_replace('/(\s*\n\s*)+/', '<br>', $content); // Remplacer les retours à la ligne multiples par <br>

        // Ajouter un retour à la ligne pour chaque nouveau paragraphe
        $content = nl2br($content);

        // Nettoyer les espaces en début et fin de chaîne
        $content = trim($content);

        return $content;
    }

    /**
     * Formate les commentaires en texte Markdown, avec gestion des niveaux d'indentation pour les réponses.
     *
     * @param array $comments_array Un tableau de commentaires à formater. Chaque commentaire doit inclure les informations suivantes :
     *                              - 'user_name' : Le nom de l'utilisateur ayant posté le commentaire.
     *                              - 'created' : La date de création du commentaire.
     *                              - 'content' : Le contenu du commentaire.
     *                              - 'children' : Un tableau des sous-commentaires.
     * @param int $indent_level (Optionnel) Le niveau d'indentation actuel pour structurer les réponses. Par défaut : 0.
     * 
     * @return string Une chaîne de caractères contenant les commentaires formatés en Markdown.
     */
    protected function format_comments_in_markdown($comments_array, $indent_level = 0)
    {
        $comments_markdown = "";
        $total_comments = count($comments_array); // Compter le nombre de commentaires à ce niveau
        $counter = 0; // Initialiser le compteur

        foreach ($comments_array as $comment) {
            $counter++; // Incrémenter le compteur pour chaque commentaire

            // Déterminer si c'est un commentaire principal ou une réponse
            $is_comment = $indent_level === 0;
            $label = $is_comment ? $this->gettext("md_comment", "mel_forum") : $this->gettext("md_response", "mel_forum");

            // Texte pour "Publié(e)"
            $published_label = $is_comment ? $this->gettext("created_m", "mel_forum") : $this->gettext("created_f", "mel_forum");

            // Gérer l'indentation en fonction du niveau
            $indent = str_repeat("    ", $indent_level);
            $comments_markdown .= $indent . "$label de " . $comment['user_name'] . "\n\n";
            $comments_markdown .= $indent . $published_label . $comment['created'] . "\n\n";
            $comments_markdown .= $indent . $comment['content'] . "\n\n";

            // Appeler récursivement pour formater les réponses (enfants)
            if (!empty($comment['children'])) {
                $comments_markdown .= $this->format_comments_in_markdown($comment['children'], $indent_level + 1);
            }

            // Ajouter un séparateur si ce n'est pas le dernier commentaire de ce niveau
            if ($counter < $total_comments) {
                $comments_markdown .= $indent . "---\n\n";
            }
        }

        return $comments_markdown;
    }

    /**
     * Construit la structure d'un commentaire avec ses informations associées.
     *
     * @param object $comment L'objet représentant le commentaire à structurer.
     * 
     * @return array Un tableau associatif contenant les informations du commentaire, y compris :
     *               - 'id' : L'identifiant du commentaire.
     *               - 'uid' : L'identifiant unique du commentaire.
     *               - 'user_name' : Le nom de l'utilisateur ayant créé le commentaire.
     *               - 'content' : Le contenu du commentaire.
     *               - 'created' : La date de création formatée du commentaire.
     *               - 'parent' : L'identifiant du commentaire parent.
     *               - 'children_number' : Le nombre d'enfants (sous-commentaires) du commentaire.
     *               - 'children' : Un tableau des structures des sous-commentaires.
     */
    protected function build_comment_structure($comment)
    {
        $user = driver_mel::gi()->getUser($comment->user_uid);
        $user_name = ($user !== null && !empty($user->name)) ? $user->name : '? ?';

        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::SHORT);
        $timestamp = strtotime($comment->created);
        $formatted_date = $formatter->format($timestamp);

        $comment_data = [
            'id' => $comment->id,
            'uid' => $comment->uid,
            'user_name' => $user_name,
            'content' => $comment->content,
            'created' => $formatted_date,
            'parent' => $comment->parent,
            'children_number' => $comment->countChildren(),
            'children' => [], // Stocker les enfants ici
        ];

        if ($comment->countChildren() > 0) {
            $children_comments = $comment->listChildren(null, 'created', false);
            foreach ($children_comments as $child_comment) {
                $comment_data['children'][] = $this->build_comment_structure($child_comment);
            }
        }

        return $comment_data;
    }

    /**
     * Formate les commentaires et réponses en HTML.
     *
     * @param array $comments_array Tableau des commentaires avec leurs réponses.
     * @param int $indent_level Niveau d'indentation pour structurer les réponses.
     * @return string HTML formatté des commentaires et réponses.
     */
    protected function format_comments_in_html($comments_array, $indent_level = 0)
    {
        $comments_html = "";

        foreach ($comments_array as $comment) {
            // Commentaire principal
            $comments_html .= "<div class='comment'>";
            $comments_html .= "<strong>" . htmlspecialchars($comment['user_name']) . "</strong> - ";
            $comments_html .= "<em>" . $this->gettext("created_m", "mel_forum") . htmlspecialchars($comment['created']) . "</em>";
            $comments_html .= "<p>" . htmlspecialchars($comment['content']) . "</p>";

            // Sous-commentaires (réponses)
            if (!empty($comment['children'])) {
                $comments_html .= "<div class='reply'>";
                $comments_html .= $this->format_comments_in_html($comment['children'], $indent_level + 1);
                $comments_html .= "</div>";
            }

            $comments_html .= "</div>";
        }

        return $comments_html;
    }

    /**
     * Crée un fichier ZIP contenant le contenu Markdown et les images associées, puis le livre au client pour téléchargement.
     *
     * Cette méthode effectue les opérations suivantes :
     * 1. Extrait les UID des images à partir du contenu Markdown.
     * 2. Récupère les données des images en base64.
     * 3. Nettoie et remplace les URLs d'images par des chemins relatifs.
     * 4. Crée un fichier ZIP contenant un dossier "image/" pour les images et le fichier Markdown.
     * 5. Envoie le fichier ZIP généré au client pour téléchargement.
     *
     * @param string $title Le titre du fichier ZIP (nom du fichier).
     * @param string $content Le contenu du post au format Markdown.
     * @param object $post L'objet du post contenant les informations sur le post, y compris son ID.
     * 
     * @return void
     */
    public function download_zip($title, $content, $post)
    {
        $temp_dir = $this->rc()->config->get('temp_dir_shared', $this->rc()->config->get('temp_dir'));
        $tmpfname = tempnam($temp_dir, 'mel_forum');

        // Extraire les UIDs des images du contenu
        $uids = $this->extract_image_uids($content);

        // Récupérer les données des images en base64
        $images_base64 = $this->get_images_base64_by_post($post->post_id);

        // Nettoyer les URLs et remplacer par des chemins relatifs
        $content = $this->clean_and_replace_image_urls($content, $uids);

        // Créer le fichier ZIP
        $zip = new ZipArchive();
        if ($zip->open($tmpfname, ZIPARCHIVE::OVERWRITE) === TRUE) {
            // Ajouter un dossier 'image/' dans le ZIP
            $zip->addEmptyDir('image');

            // Ajouter les images au ZIP
            foreach ($uids as $uid) {
                if (isset($images_base64[$uid])) {
                    // Décoder l'image base64
                    $data = explode(',', $images_base64[$uid]);
                    $image_data = base64_decode(end($data));

                    // Ajouter l'image au ZIP
                    $relative_path = "image/$uid.jpg";
                    $zip->addFromString($relative_path, $image_data);
                }
            }

            // Ajouter le fichier Markdown
            $zip->addFromString('post.md', $content);

            $zip->close();

            // Vérifier si le fichier ZIP a bien été créé
            if (file_exists($tmpfname)) {
                $this->_deliver_zipfile($tmpfname, $title . '.zip');
            } else {
                echo json_encode(['status' => 'error', 'message' => $this->gettext("no_created_zip", "mel_forum")]);
            }
        }
    }

    /**
     * Envoie un fichier ZIP au client pour téléchargement.
     *
     * Cette méthode configure les en-têtes HTTP nécessaires pour un téléchargement
     * de fichier, lit le contenu du fichier ZIP temporaire, puis le supprime une fois envoyé.
     *
     * @param string $tmpfname Le chemin du fichier ZIP temporaire à envoyer.
     * @param string $filename Le nom du fichier ZIP proposé pour le téléchargement.
     * 
     * @return void
     */
    protected function _deliver_zipfile($tmpfname, $filename)
    {
        $this->rc()->output->nocacheing_headers();

        $this->rc()->output->download_headers($filename, ['length' => filesize($tmpfname)]);
        readfile($tmpfname);
        unlink($tmpfname);
    }

    /**
     * Envoie un fichier au client pour téléchargement.
     *
     * @param string $file_name Nom du fichier à télécharger.
     * @param string $content Contenu du fichier.
     * @param string $mime_type Type MIME du fichier (par défaut : text/html).
     * @return void
     */
    protected function send_file($file_name, $content, $mime_type = 'text/html')
    {
        // Définir les en-têtes HTTP pour le téléchargement
        header('Content-Description: File Transfer');
        header('Content-Type: ' . $mime_type);
        header('Content-Disposition: attachment; filename="' . basename($file_name) . '"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . strlen($content));

        // Envoyer le contenu du fichier
        echo $content;

        // Terminer l'exécution pour s'assurer qu'aucun contenu supplémentaire n'est envoyé
        exit;
    }

    /**
     * Récupère les données des images associées à un post sous forme de chaînes base64 encodées.
     *
     * @param string $post_id L'identifiant du post pour lequel récupérer les images.
     * 
     * @return array Tableau associatif des UIDs d'images avec leurs données base64 encodées.
     *               Exemple : ['UID1' => 'data:image/jpeg;base64,...', 'UID2' => 'data:image/png;base64,...']
     */
    public function get_images_base64_by_post($post_id)
    {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->post_id = $post_id;

        $images = $post->listImages(true);
        $images_base64 = [];

        if (empty($images)) {
            //error_log("Aucune image trouvée pour le post_id: $post_id");
            error_log($this->gettext("no_image_found", "mel_forum") . $post_id);
            return [];
        }

        foreach ($images as $image) {
            if ($image->load()) {
                $base64_data = $image->data;

                // Vérifier si le préfixe est déjà présent
                if (strpos($base64_data, 'data:image/') === 0) {
                    // Utiliser directement les données si elles contiennent déjà le préfixe
                    $images_base64[$image->uid] = $base64_data;
                } else {
                    // Ajouter le préfixe manuellement si nécessaire
                    $mime_type = $image->getExtension() === 'png' ? 'image/png' : 'image/jpeg';
                    $images_base64[$image->uid] = "data:$mime_type;base64,$base64_data";
                }
            } else {
                error_log($this->gettext("image_load_error", "mel_forum") . $image->uid);
            }
        }

        return $images_base64;
    }

    /**
     * Extrait les UIDs des images à partir du contenu Markdown.
     *
     * Recherche les UIDs d'images présents dans le contenu à l'aide d'une expression régulière.
     *
     * @param string $content Le contenu Markdown contenant les URLs des images.
     * 
     * @return array Tableau des UIDs extraits depuis les URLs d'images.
     */
    protected function extract_image_uids($content)
    {
        $uids = [];
        $pattern = '/_image_uid=([\w]+)/'; // Regex pour capturer les UID
        if (preg_match_all($pattern, $content, $matches)) {
            $uids = $matches[1]; // Récupère tous les UIDs
        }
        return $uids;
    }

    /**
     * Remplace les URLs des images dans le contenu Markdown par des chemins relatifs.
     *
     * @param string $content Le contenu Markdown contenant les URLs d'images à nettoyer.
     * @param array $uids Tableau des UID des images associées.
     * 
     * @return string Le contenu modifié avec les chemins relatifs des images.
     */
    public function clean_and_replace_image_urls($content, $uids)
    {
        foreach ($uids as &$uid) {
            // Corrige les préfixes incorrects dans les UID si nécessaire
            $uid = preg_replace('/^data:image\/jpeg;base64,data:image\/jpeg;base64,/', 'data:image/jpeg;base64,', $uid);
        }
        unset($uid);

        // Parcourir les UIDs corrigés pour remplacer dans le contenu
        foreach ($uids as $uid) {
            // Regex pour capturer l'URL Markdown en acceptant n'importe quel domaine et token
            $pattern = '/!\[\]\(https?:\/\/[^\/]+\/\?_task=forum&_action=load_image&_image_uid=' . preg_quote($uid, '/') . '(?:&[^&\s]*)*&_token=[^&\s]+\)/';

            // Remplacement par le chemin relatif
            $replacement = '![](image/' . $uid . '.jpg)';

            // Mettre à jour le contenu avec chaque remplacement
            $content = preg_replace($pattern, $replacement, $content);
        }

        return $content;
    }

    /**
     * Remplace les URLs des images dans le contenu HTML par des données encodées en base64.
     *
     * @param string $html Contenu HTML contenant les balises <img>.
     * @param string $post_id L'identifiant du post pour lequel récupérer les images.
     *
     * @return string Contenu HTML avec les URLs d'images remplacées par les données base64.
     */
    private function replace_image_urls_with_base64($html, $post_id)
    {
        // Récupérer les données base64 des images associées au post
        $images_base64 = $this->get_images_base64_by_post($post_id);

        // Si aucune image n'est trouvée, retourner le contenu inchangé
        if (empty($images_base64)) {
            error_log($this->gettext("no_image_to_replace", "mel_forum") . $post_id);
            return $html;
        }

        // Remplacer les URLs d'images dans le contenu HTML (sans récupérer dynamiquement le domaine)
        $html = preg_replace_callback(
            '/<img\s+[^>]*src=["\']https?:\/\/[^\/]+\/\?_task=forum&amp;_action=load_image&amp;_image_uid=([^"&]+)[^>]*>/i',
            function ($matches) use ($images_base64) {
                // Extraire l'UID de l'image depuis l'URL
                $image_uid = $matches[1];

                // Si l'UID est trouvé dans les données base64
                if (isset($images_base64[$image_uid])) {
                    // Remplacer l'URL par l'image en base64
                    return '<img src="' . $images_base64[$image_uid] . '" />';
                }

                // Si l'UID n'est pas trouvé, garder l'URL d'origine
                return $matches[0];
            },
            $html
        );

        return $html;
    }

    #endregion

    #region Espaces des travail

    /**
     * Définit les services disponibles pour un espace de travail, y compris le service "forum".
     *
     * - Vérifie si le service "forum" est inclus dans les services fournis.
     * - Si le service "forum" n'est pas déjà défini dans l'espace de travail, il est ajouté.
     * - Retourne les arguments modifiés, y compris l'espace de travail mis à jour.
     *
     * @param array $args - Les arguments contenant les services et l'espace de travail.
     * @returns array - Les arguments modifiés avec l'espace de travail mis à jour si nécessaire.
     */
    public function workspace_services_set($args)
    {
        $services = $args['services'];

        if (array_search('forum', $services) !== null && array_search('forum', $services) !== false) {
            $workspace = $args['workspace'];

            if ($workspace->objects()->get('forum') === null) {
                $workspace->objects()->set('forum', true);
                $args['workspace'] = $workspace;
            }
        }

        return $args;
    }

    /**
     * Affiche le module de forum dans la vue de l'espace de travail si le service est activé.
     *
     * - Vérifie si l'espace de travail dispose du service "forum".
     * - Si le service est présent, configure la barre de navigation et ajoute le bloc de module "Derniers articles" à la mise en page.
     * - Inclut le fichier JavaScript nécessaire pour le module de l'espace de travail.
     *
     * @param array $args - Les arguments contenant l'espace de travail et la mise en page.
     * @return array - Les arguments modifiés avec la mise en page mise à jour.
     */
    public function wsp_show($args)
    {
        if ($args['workspace']->objects()->get('forum') !== null) {
            $args['layout']->setNavBarSetting('forum', 'newspaper', true, 4);
            $args['layout']->firstRow()->append(12, $args['layout']->htmlSmallModuleBlock(['id' => 'module-forum-news', 'data-title' => $this->gettext("front_page", "mel_forum"),]));
            $args['layout']->secondRow()->prepend(8, $args['layout']->htmlModuleBlock(['id' => 'module-forum-last', 'data-title' => $this->gettext("workspace_news", "mel_forum"), 'data-button' => 'forum']), 6, 6);

            $this->include_module('workspace_pin.js');
            $this->include_module('workspace.js');
        }

        return $args;
    }

    /**
     * Affiche le service dans le workspace
     * 
     * @param array $args - Les arguments contenant l'espace de travail et la mise en page.
     * @return array - Les arguments modifiés avec la mise en page mise à jour.
     */
    public function workspace_params_services_show($args)
    {
        if ($args['app'] === 'forum') $args['continue'] = false;

        return $args;
    }

    /**
     * Récupère le service du workspace
     * @param array $args - Les arguments contenant l'espace de travail et la mise en page.
     * @return array - Les arguments modifiés avec la mise en page mise à jour.
     */
    public function workspace_service_get($args)
    {
        if ($args['services']['forum'] === null) $args['services']['forum'] = false;

        return $args;
    }

    /**
     * Supprime tout les articles suites à la supression d'un espace de travail
     */
    public function workspace_deleted($args)
    {
        $workspace = $args['workspace'];
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->workspace = $workspace->uid;
        $posts = $post->listPosts();
        foreach ($posts as $post) {
            $post->delete();
        }
    }

    #endregion

    #region Notifications

    /**
     * Envoie une notification aux utilisateurs d'un espace de travail lorsqu'un nouvel article est publié.
     *
     * Cette fonction vérifie si la classe "mel_notification" existe, puis récupère l'identifiant de 
     * l'espace de travail depuis la requête POST. Si un espace de travail est trouvé, elle récupère 
     * la liste des utilisateurs associés et envoie une notification à chacun d'eux, à l'exception de 
     * l'utilisateur actuel, pour les informer de la publication d'un nouvel article.
     *
     * @return void
     */
    public function notify()
    {
        if (class_exists("mel_notification")) {
            $workspace_uid = $this->get_input('_workspace', rcube_utils::INPUT_POST);
            $post_uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

            if ($workspace_uid !== null && $post_uid !== null) {
                $workspace = mel_workspace::Workspace($workspace_uid);

                $current_user = driver_mel::gi()->getUser();
                $users = $workspace->users(); // Liste des utilisateurs de l'espace de travail

                $post_title = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST);

                foreach ($users as $user) {
                    if ($user->user !== $current_user->uid) { 
                        $notification_title = sprintf(
                            $this->gettext("mel_forum.notification_title"),
                            $current_user->name,
                            $workspace->title()
                        );
                
                        $notification_message = sprintf(
                            $this->gettext("mel_forum.post_published_message"),
                            $post_title
                        );
                
                        mel_notification::notify(
                            'workspace',
                            $notification_title,
                            $notification_message,
                            [
                                [
                                    'href' => "./?_task=forum&_action=post&_uid=" . $post_uid . "&_workspace_uid=" . $workspace_uid . "&_force_bnum=1",
                                    'text' => $this->gettext("mel_forum.read_article"),
                                    'title' => $this->gettext("mel_forum.read_article_title"),
                                    'command' => "event.click"
                                ]
                            ],
                            $user->user
                        );
                    }
                }
            }
        }
    }

    /**
     * Envoie une notification lors de l'ajout d'un commentaire ou d'une réponse à un commentaire.
     *
     * Cette fonction notifie les utilisateurs concernés lorsqu'un nouveau commentaire est ajouté à un post
     * ou lorsqu'une réponse est faite à un commentaire existant. Les notifications sont envoyées au créateur
     * du post et en cas de réponse, également au créateur du commentaire parent.
     *
     * @param string $workspace_uid L'identifiant unique de l'espace de travail.
     * @param string|null $parent_id L'identifiant du commentaire parent (null si c'est un nouveau commentaire).
     * @param string $post_uid L'identifiant unique du post associé au commentaire.
     *
     * @return void
     */
    public function notify_comment($workspace_uid, $parent_id, $post_uid) {
        if (class_exists("mel_notification")) {
            $post_id = rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST);
    
            if ($workspace_uid !== null && $post_id !== null) {
                $workspace = mel_workspace::Workspace($workspace_uid);
                $current_user = driver_mel::gi()->getUser();
    
                // Récupérer les infos du post
                $post = $this->_get_post($post_uid);
                $post_title = $post->title;
                $post_creator = $post->creator; // UID du créateur du post
    
                // Récupération du créateur du commentaire parent
                $parent_creator = null;
                if (!empty($parent_id)) {  // Vérifie si un parent existe
                    $parent_comment = new LibMelanie\Api\Defaut\Posts\Comment();
                    $parent_comment->id = $parent_id;
                    $parent_comments = $parent_comment->getList();
    
                    if (count($parent_comments)) {  
                        $parent_comment = array_pop($parent_comments);
                        $parent_creator = $parent_comment->user_uid; // UID du créateur du commentaire parent
                    }
                }
    
                // Initialisation de la liste des utilisateurs à notifier
                $users_to_notify = [];
    
                if (empty($parent_id)) {
                    // *** NOUVEAU COMMENTAIRE sur l'article ***
                    $notification_comment_title = sprintf(
                        $this->gettext("mel_forum.notification_comment_title"),
                        $current_user->name,
                        $post_title
                    );
    
                    $notification_comment_message = sprintf(
                        $this->gettext("mel_forum.notification_comment_message"),
                        $current_user->name
                    );
    
                    // Ajouter le créateur du post à la liste des notifications (sauf si c'est lui qui commente)
                    if ($post_creator !== $current_user->uid) {
                        $users_to_notify[$post_creator] = [
                            'title' => $notification_comment_title,
                            'message' => $notification_comment_message
                        ];
                    }
                } else {
                    // *** RÉPONSE à un commentaire existant ***
                    if (!empty($parent_creator)) {
                        // Notification pour le créateur de l'article
                        if ($post_creator !== $current_user->uid) {
                            $users_to_notify[$post_creator] = [
                                'title' => sprintf(
                                    $this->gettext("mel_forum.notification_response_title_for_author"),
                                    $current_user->name,
                                    $parent_creator,
                                    $post_title
                                ),
                                'message' => sprintf(
                                    $this->gettext("mel_forum.notification_response_message_for_author"),
                                    $current_user->name,
                                    $parent_creator
                                )
                            ];
                        }
    
                        // Notification pour le créateur du commentaire
                        if ($parent_creator !== $current_user->uid) {
                            $users_to_notify[$parent_creator] = [
                                'title' => sprintf(
                                    $this->gettext("mel_forum.notification_response_title_for_commenter"),
                                    $current_user->name,
                                    $post_title
                                ),
                                'message' => sprintf(
                                    $this->gettext("mel_forum.notification_response_message_for_commenter"),
                                    $current_user->name
                                )
                            ];
                        }
                    }
                }
    
                // Envoyer les notifications uniquement aux utilisateurs concernés
                foreach ($users_to_notify as $user_uid => $notification) {
                    mel_notification::notify(
                        'workspace',
                        $notification['title'],
                        $notification['message'],
                        [
                            [
                                'href' => "./?_task=forum&_action=post&_uid=" . $post_uid . "&_workspace_uid=" . $workspace_uid . "#comment-section",
                                'text' => $this->gettext("mel_forum.read_response"),
                                'title' => $this->gettext("mel_forum.read_response_title"),
                                'command' => "event.click"
                            ]
                        ],
                        $user_uid
                    );
                }
            }
        }
    }

    #endregion

    #region Droits et Page d'Erreur

    /**
     * Retourne si l'utilisateur a le droit de modifier/effacer un article
     * (propriétaire ou admin)
     * 
     * @param \LibMelanie\Api\Defaut\Posts\Post $post post à vérifier
     * @param string|WorkspaceMelanie $workspace Workspace
     * 
     * @return boolean
     */
    protected function _has_owner_rights($post, $workspace)
    {
        $current_user = driver_mel::gi()->getUser();
        $return = false;

        if ($current_user->isWorkspaceOwner($workspace))
            $return = true;
        if ($current_user->uid === $post->creator)
            $return = true;

        return $return;
    }

    /**
     * affichage la page d'erreur de forum
     */
    protected function _display_error_page()
    {
        $workspace_uid = $this->get_input('_workspace_uid', rcube_utils::INPUT_GET);
        $workspace = mel_workspace::Workspace($workspace_uid);
        if ($workspace->isPublic()) {
            $this->rc()->output->set_env('workspace_uid', $workspace_uid);
        }
        $this->load_script_module('access_error');
        $this->rc()->output->send('mel_forum.access-error');
    }

    #endregion
    #region Utils

    /**
     * Génère une chaîne de caractères aléatoire d'une longueur spécifiée.
     *
     * Cette fonction génère une chaîne de caractères aléatoire de la longueur spécifiée
     * en utilisant des caractères d'un ensemble prédéfini de caractères alphanumériques.
     *
     * @param int $length La longueur de la chaîne de caractères aléatoire à générer. La valeur par défaut est 10.
     * @return string La chaîne de caractères aléatoire générée.
     */
    protected function _generateRandomString($length = 10)
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[random_int(0, $charactersLength - 1)];
        }
        return $randomString;
    }

    #endregion
}
