<?php

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

    public $current_post;

    /**
     * (non-PHPdoc)
     * @see bnum_plugin::init()
     */
    function init()
    {
        // $this->rc()->output->send('mel_forum.forum');


        // Chargement de la conf
        // $this->load_config();
        // Gestion des différentes langues
        $this->add_texts('localization/', true);

        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/mel_forum.css');


        // ajout de la tache
        $this->register_task('forum');

        if ($this->rc()->task === "forum") {

            // Penser à modifier avec index au lieu de post pour afficher la page d'accueil
            $this->register_action('index', [$this, 'index']);
            //Affichage de la page d'un article
            $this->register_action('post', [$this, 'post']);
            // Affichage de la page qui permet de créer un article
            $this->register_action('create_or_edit_post', [$this, 'create_or_edit_post']);
            // Récupérer le User Connecté
            $this->register_action('check_user', array($this, 'check_user'));
            //Ajouter une réaction
            $this->register_action('add_reaction', array($this, 'add_reaction'));
            // Supprimer une réaction
            $this->register_action('delete_reaction', array($this, 'delete_reaction'));
            // Lister les Réactions d'un Post
            $this->register_action('get_all_reactions_bypost', array($this, 'get_all_reactions_bypost'));
            // Compter le nombre de réactions pour un Post
            $this->register_action('count_reactions', array($this, 'count_reactions'));
            // Créer un article
            $this->register_action('add_post', array($this, 'add_post'));
            //modifier un article
            $this->register_action('update_post', array($this, 'update_post'));
            //supprimer un article
            $this->register_action('delete_post', array($this, 'delete_post'));
            // récupérer un  article
            $this->register_action('get_post', array($this, 'get_post'));
            // récupérer tous les articles
            $this->register_action('get_posts_byworkspace', array($this, 'get_posts_byworkspace'));
            // Ajouter un commentaire ou une réponse
            $this->register_action('create_comment', array($this, 'create_comment'));
            // Répondre à un commentaire ou une réponse
            $this->register_action('reply_comment', array($this, 'reply_comment'));
            // Modifier un commentaire ou une réponse
            $this->register_action('update_comment', array($this, 'update_comment'));
            // Supprimer un commentaire ou une réponse
            $this->register_action('delete_comment', array($this, 'delete_comment'));
            // Liker un commentaire ou une réponse
            $this->register_action('like_comment', array($this, 'like_comment'));
            //Lister les comments d'un Post
            $this->register_action('get_all_comments_bypost', [$this, 'get_all_comments_bypost']);
            // Compter le nombre de commentaires pour un Post
            $this->register_action('count_comment', array($this, 'count_comment'));
            //Supprimer un Like
            $this->register_action('delete_like', array($this, 'delete_like'));
            // Compter le nombre de commentaires pour un Post
            $this->register_action('count_likes', array($this, 'count_likes'));
            //Gère les tags suite à la modification/création d'un post
            $this->register_action('send_post', array($this, 'send_post'));
            // Créer un tag
            $this->register_action('create_tag', array($this, 'create_tag'));
            // Modifier un tag
            $this->register_action('update_tag', array($this, 'update_tag'));
            // Supprimer un tag
            $this->register_action('delete_tag', array($this, 'delete_tag'));
            // Associer un tag à un Post
            $this->register_action('associate_tag_at_post', array($this, 'associate_tag_at_post'));
            // Enlever un Tag existant d'un post
            $this->register_action('unassociate_tag_from_post', array($this, 'unassociate_tag_from_post'));
            // récupérer tous les tags associés à un espace de travail
            $this->register_action('get_all_tags_byworkspace', array($this, 'get_all_tags_byworkspace'));
            // Récupérer tous les tags associés à un Post
            $this->register_action('get_all_tags_bypost', array($this, 'get_all_tags_bypost'));
            // afficher les articles par tag
            $this->register_action('all_posts_by_tag', array($this, 'all_posts_by_tag'));
            // Récupérer toutes les images associés à un Post
            $this->register_action('get_all_images_by_post', array($this, 'get_all_images_by_post'));
            // Créer une image
            $this->register_action('create_image', array($this, 'create_image'));
            // Supprimer une image
            $this->register_action('delete_image', array($this, 'delete_image'));
            // Import une image sur le serveur
            $this->register_action('upload_image', array($this, 'upload_image'));
            // affiche une image chargé sur le serveur
            $this->register_action('load_image', array($this, 'load_image'));
            // ajoute un article aux favoris de l'utilisateur courant
            $this->register_action('add_to_favorite', array($this, 'add_to_favorite'));
            // récupérer des posts au format Json
            $this->register_action('get_posts_data', array($this, 'get_posts_data'));
            //gestion des réaction aux posts
            $this->register_action('manage_reaction', array($this, 'manage_reaction'));
            //Affichage des nouveaux posts
            $this->register_action('new_posts', array($this, 'new_posts'));
        } else if ($this->get_current_task() === 'workspace') {
            $this->add_hook('workspace.services.set', [$this, 'workspace_services_set']);
            $this->add_hook('wsp.show', [$this, 'wsp_show']);
        }
    }

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
        $this->include_web_component()->Avatar();
        $this->load_script_module('forum');
        $this->show_posts();
        $workspace = rcube_utils::get_input_value('_worskpace_uid', rcube_utils::INPUT_POST);


        $this->rc()->output->send('mel_forum.forum');
    }



    // Fonctions nécessaires à l'affichage d'un article

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
        //TODO récupérer le Workspace

        mel_metapage::IncludeAvatar();
        //Récupérér uid avec GET
        $this->load_script_module('manager');

        $this->current_post = $this->get_post($uid);

        $this->rc()->output->add_handlers(array('show_post_title' => array($this, 'show_post_title')));
        $this->rc()->output->add_handlers(array('show_post_tags' => array($this, 'show_post_tags')));
        $this->rc()->output->add_handlers(array('show_post_creator_name' => array($this, 'show_post_creator_name')));
        $this->rc()->output->add_handlers(array('show_post_creator_email' => array($this, 'show_post_creator_email')));
        $this->rc()->output->add_handlers(array('show_post_date' => array($this, 'show_post_date')));
        $this->rc()->output->add_handlers(array('show_post_content' => array($this, 'show_post_content')));

        $this->rc()->output->set_env('post_uid', $this->current_post->uid);
        $this->rc()->output->set_env('post_id', $this->current_post->id);
        $this->rc()->output->set_env('show_comments', $this->current_post->settings["comments"]);

        $this->rc()->output->send('mel_forum.post');
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
        foreach ($tags as $tag) {
            $tags_html .= '<span class="tag" tabindex="0" role="button">#' . htmlspecialchars($tag) . '</span>';
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
        // TODO WORKSPACE

        $this->rc()->html_editor();
        $this->load_script_module('create_or_edit_post');

        // Initialisation de la variable de post et du mode édition
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $is_editing = false;

        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $current_user_uid = $user->uid;

        if ($uid) {
            // Mode édition : assigner l'UID et charger l'article existant
            $post->uid = $uid;
            if ($post->load()) {  // Charger les données de l'article existant
                $is_editing = true;

                // Vérifier si l'utilisateur connecté est bien le créateur de l'article
                if ($post->creator !== $current_user_uid) {
                    echo json_encode(['status' => 'error', 'message' => $this->gettext("creator_edit_only", "mel_forum")]);
                    exit; // Arrêter l'exécution si l'utilisateur n'est pas le créateur
                }

                // Récupérer les Tags liés au post
                $tags = $this->get_all_tags_bypost($post->uid);
            } else {
                // Si l'UID est fourni mais l'article n'existe pas, renvoyer une erreur
                return false;
            }
        }

        if (!$is_editing) {
            // Mode création : initialiser un nouvel article avec des valeurs par défaut
            $post->title = '';
            $post->content = '';
            $post->summary = $this->create_summary_from_content($post->content);
            $post->uid = $this->generateRandomString(24);
            $post->modified = date('Y-m-d H:i:s');
            $post->creator = driver_mel::gi()->getUser()->uid;
            $post->settings = '';
            $post->workspace = $this->get_input('_wsp_uid');
            // TODO : supprimer cette ligne de test si besoin
            $post->workspace = 'un-espace-2';

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
    }


    /**
     * Génère une chaîne de caractères aléatoire d'une longueur spécifiée.
     *
     * Cette fonction génère une chaîne de caractères aléatoire de la longueur spécifiée
     * en utilisant des caractères d'un ensemble prédéfini de caractères alphanumériques.
     *
     * @param int $length La longueur de la chaîne de caractères aléatoire à générer. La valeur par défaut est 10.
     * @return string La chaîne de caractères aléatoire générée.
     */
    protected function generateRandomString($length = 10)
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[random_int(0, $charactersLength - 1)];
        }
        return $randomString;
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
    protected function create_summary_from_content($content)
    {
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
    protected function save_post_history(&$post, $user_uid, $new_data)
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
        // TODO pas besoin de json_encode ?
        $post->history = json_encode($history);

        // TODO a tester
        //$post->save();
    }


    /**
     * Supprime un article existant en fonction de l'UID fourni.
     */
    public function delete_post()
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $current_user_uid = $user->uid;

        // Récupérer la valeur du champ POST
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

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

        // Vérifier si l'utilisateur connecté est bien le créateur de l'article
        if ($post->creator !== $current_user_uid) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("creator_delete_only", "mel_forum")]);
            exit; // Arrêter l'exécution si l'utilisateur n'est pas le créateur
        }

        // Supprimer l'article
        $ret = $post->delete();
        if (!is_null($ret)) {
            echo json_encode(['status' => 'success', 'message' => $this->gettext("the_article", "mel_forum") . $post->title . $this->gettext("has_been_deleted", "mel_forum")]);
        } else {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("delete_post_failure", "mel_forum") . $post->title . "."]);
        }

        // Arrêt de l'exécution du script
        exit;
    }

    /**
     * Récupère un article en fonction de son UID et renvoie les données en format JSON.
     *
     * @return void Cette méthode ne retourne rien mais affiche directement une réponse JSON.
     */
    public function get_post($uid)
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
     * TODO params
     *
     * @return array post tableau d'objet posts
     */
    protected function get_posts_byworkspace($workspace_uid = null, $limit = 20)
    {
        //récupérer les infos de chargement d'articles si aucune n'est fournie on met des valeurs par defaut
        $workspace_uid = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST) ?? $workspace_uid;
        $search = (rcube_utils::get_input_value('_offset', rcube_utils::INPUT_POST) !== null) ? (rcube_utils::get_input_value('_search', rcube_utils::INPUT_POST) === '' ? null : rcube_utils::get_input_value('_search', rcube_utils::INPUT_POST)) : null;
        $offset = (rcube_utils::get_input_value('_offset', rcube_utils::INPUT_POST) !== null) ? intval(rcube_utils::get_input_value('_offset', rcube_utils::INPUT_POST)) : 0;
        // valeur possible: created, comments, reactions
        $orderby = (rcube_utils::get_input_value('_order', rcube_utils::INPUT_POST) !== null) ? rcube_utils::get_input_value('_order', rcube_utils::INPUT_POST) : self::DEFAULTSORTBY;
        //on récupère un string si il y a une valeur donc on la convertie
        $asc = (rcube_utils::get_input_value('_asc', rcube_utils::INPUT_POST) !== null) ? (rcube_utils::get_input_value('_asc', rcube_utils::INPUT_POST) === 'true' ? true : false) : self::DEFAULTASC;
        $tags_uids = rcube_utils::get_input_value('_tags', rcube_utils::INPUT_POST);
        $tags = null;
        if ($tags_uids !== null) {
            foreach ($tags_uids as $tag_id) {
                $tag = new LibMelanie\Api\Defaut\Posts\Tag();
                $tag->id = $tag_id;
                $tag->workspace = $workspace_uid;
                $tag->load();
                $tags[] = $tag;
            }
        }
        $fav_posts_uid = null;
        $get_favorite = (rcube_utils::get_input_value('_fav_only', rcube_utils::INPUT_POST) !== null) ? (rcube_utils::get_input_value('_fav_only', rcube_utils::INPUT_POST) === 'true' ? true : false) : false;
        if ($get_favorite) {
            $fav_posts = $this->rc()->config->get('favorite_article', []);
            $fav_posts_uid = $fav_posts[$workspace_uid];
        }


        // Charger tous les posts en utilisant la méthode listPosts
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        // $post->workspace = $workspace_uid;
        $post->workspace = "un-espace-2";


        // $limit = 20;
        // Appel de la méthode listPosts
        $posts = $post->listPosts($search, $tags, $orderby, $asc, $limit, $offset, $fav_posts_uid);

        return $posts;

        // Arrêt de l'exécution du script
        exit;
    }

    /**
     * Gère les tags suite à la modification/création d'un post
     * @return void
     */
    public function send_post()
    {
        $result = $this->_add_post();
        if ($result !== null) {
            // le post est créé on passe aux tags
            $tags = rcube_utils::get_input_value('_tags', rcube_utils::INPUT_POST);
            if (is_null($tags)) $tags = [];
            $post_tags = $this->_get_tags_name_bypost(rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST));
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
    }

    /**
     * Crée un nouvel article dans l'espace de travail.
     *
     * Cette fonction récupère les valeurs des champs POST, valide les données saisies,
     * crée une nouvelle publication avec les propriétés définies, et sauvegarde l'article.
     * Elle extrait également les liens d'image du contenu et les enregistre.
     * La fonction retourne une réponse JSON indiquant le statut de la création de l'article.
     *
     * @return LibMelanie\Api\Defaut\Posts\Post $post 
     */
    protected function _add_post()
    {
        // récupérer les valeurs des champs POST
        $post_id = intval(rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST));
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);
        $title = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST);
        $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST, true);
        $content = mel_helper::wash_html($content);
        $workspace = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);
        // création du summary à l'aide d'une fonction qui récupère les 2 premières phrases du content
        $summary = $this->create_summary_from_content($content);
        $settings = rcube_utils::get_input_value('_settings', rcube_utils::INPUT_POST);

        // Validation des données saisies
        if (empty($title) || empty($content) || empty($summary) || empty($settings)) {
            return false;
        }

        // Détecter et sauvegarder les images en base64 dans le contenu
        $content = $this->process_base64_images($content, $post_id);

        //Créer un nouvel Article
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
        $this->save_post_history($post, $post->user_uid, $new_data);

        //Définition des propriétés de l'article
        $post->title = $title;
        $post->summary = $summary;
        $post->content = $content;
        $post->modified = date('Y-m-d H:i:s');
        $post->creator = driver_mel::gi()->getUser()->uid;
        $post->settings = $settings;
        $post->workspace = $workspace;
        //TODO supprimé 
        $post->workspace = 'un-espace-2';

        // Sauvegarde de l'article
        return $post->save();
    }

    /**
     * créer un tag dans l'espace de travail courant
     * @param string $name Nom du tag
     * @return bool $result
     */
    protected function _create_tag($name)
    {
        // Récupérer le Workspace
        $workspace_uid = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);

        //Créer un tag
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();

        //Définition des propriétés du tag
        $tag->name = str_replace(' ', '', $name);
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
        $workspace_uid = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);

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
    // TODO: ajouter post en parametre
    protected function _associate_tag_with_post($name)
    {
        $workspace_uid = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

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
     * Dessaocie un tag d'un post
     * @param string $name nom du tag
     */
    // TODO: ajouter post en parametre
    protected function _unsassociate_tags_from_post($name)
    {
        $workspace_uid = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

        // Récupérer le tag existant
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->name = $name;
        $tag->workspace = $workspace_uid;

        if ($tag->load() !== null) {
            $post = new LibMelanie\Api\Defaut\Posts\Post();
            $post->uid = $uid;

            if ($post->load() !== null) {
                // TODO return le removeTag
                if ($post->removeTag($tag)) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    /**
     * récupère tout les tags associé à un post
     * @param string $uid uid du post
     * 
     * @return string[] $tags tableau des noms des tags du post
     */
    // TODO: ajouter post en parametre
    protected function _get_tags_name_bypost($uid)
    {
        // Récupérer l'article
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;
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
    // TODO: ajouter workspace en parametre
    protected function _exist_tag($exist_tag)
    {
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->workspace = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);
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
    // TODO: ajouter workspace en parametre
    protected function _tag_is_associated_to_any_post($tag_name)
    {
        $tag = new LibMelanie\Api\Defaut\Posts\Tag();
        $tag->workspace = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);
        $tag->name = $tag_name;
        $tag->load();
        return (!($tag->countPosts() === 0));
    }

    /**
     * charge le post correspondant, et liste tous les tags associés à ce post.
     * Les tags sont ensuite renvoyés en réponse au format JSON.
     *
     * @return void
     */
    // TODO: passer le post en parametre a la place de l'uid
    public function get_all_tags_bypost($uid)
    {
        // Récupérer l'article
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;
        $rettags = [];

        if ($post->load()) {
            $tags = $post->listTags();

            foreach ($tags as $tag) {
                $rettags[] = ["name" => $tag->tag_name, "id" => $tag->id];
            }

            return $rettags;
            // Arrêt de l'exécution du script
            // exit;
        }
    }

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

        // Récupérer le contenu du commentaire et le post ID
        $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);
        $post = rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST);

        // Récupérer l'ID du commentaire parent s'il s'agit d'une réponse
        $parent = rcube_utils::get_input_value('_parent', rcube_utils::INPUT_POST, true);

        // Validation des données saisies
        if (empty($content)) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_field_required", "mel_forum")]);
            exit;
        }

        // Créer un nouveau commentaire
        $comment = new LibMelanie\Api\Defaut\Posts\Comment();
        $comment->content = $content;
        $comment->uid = $this->generateRandomString(24);
        $comment->created = date('Y-m-d H:i:s');
        $comment->modified = date('Y-m-d H:i:s');
        $comment->creator = $user->uid; // ID de l'utilisateur
        $comment->post = $post;

        // Si c'est une réponse, on associe le commentaire parent
        if (!empty($parent)) {
            $comment->parent = $parent;
        }

        // Sauvegarde du commentaire
        $ret = $comment->save();
        if (!is_null($ret)) {
            // Préparer les données du commentaire avec le nom d'utilisateur
            $commentData = [
                'uid' => $comment->uid,
                'content' => $comment->content,
                'created' => $comment->created,
                'creator' => $comment->creator,
                'post' => $comment->post,
                'parent' => !empty($comment->parent) ? $comment->parent : null,
                'user_name' => $user->name // Récupération du nom d'utilisateur
            ];

            // Réponse JSON avec les informations du commentaire
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'success',
                'message' => $this->gettext("comment_creation", "mel_forum"),
                'comment' => $commentData
            ]);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_creation_failed", "mel_forum")]);
        }

        exit;
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
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);
        $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);

        // Récupérer le commentaire existant
        $comment = new LibMelanie\Api\Defaut\Posts\Comment();
        $comment->uid = $uid;
        if (!$comment->load()) {

            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_unfindable", "mel_forum")]);
            exit;
        }

        // Vérifier si le commentaire existe
        if (!$comment) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_unfindable", "mel_forum")]);
            exit;
        }
        // Vérifier si l'utilisateur est bien l'auteur du commentaire
        if ($comment->user_uid !== $user->uid) { // Vérification si l'utilisateur est l'auteur
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => $this->gettext("cannot_edit_comment", "mel_forum")]);
            exit;
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
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'success',
                'message' => $this->gettext("comment_updated", "mel_forum"),
                'modify' => $modifyData
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_updated_failure", "mel_forum")]);
        }

        // Arrêt de l'exécution du script
        exit;
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
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

        // Récupérer l'ID du commentaire parent s'il s'agit d'une réponse
        $parent = rcube_utils::get_input_value('_parent', rcube_utils::INPUT_POST, true);

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

        // TODO: Suppression des enfants ?
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

        header('Content-Type: application/json');

        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $user_uid = $user->uid;

        // Récupérer les valeurs
        $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);
        $comment_id = rcube_utils::get_input_value('_comment_id', rcube_utils::INPUT_POST);
        $comment_uid = rcube_utils::get_input_value('_comment_uid', rcube_utils::INPUT_POST);

        // Validation des données saisies
        if (empty($type) || empty($comment_id)) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("every_field_required", "mel_forum")]);
            exit;
        }

        // Charger le commentaire pour récupérer son id et son créateur
        $comment = new LibMelanie\Api\Defaut\Posts\Comment();
        $comment->uid = $comment_uid;

        if (!$comment->load()) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("comment_unfindable", "mel_forum")]);
            exit;
        }

        $creator = $comment->creator;

        // Vérifier si le créateur du like/dislike est le même que le créateur du commentaire
        if ($creator === $user_uid) {
            echo json_encode(['status' => 'error', 'message' => $this->gettext("react_to_own_comment", "mel_forum")]);
            exit;
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
                    echo json_encode(['status' => 'error', 'message' => gettext("failed_to_save...", "mel_forum") . $type . '.']);
                    exit;
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
                        echo json_encode(['status' => 'error', 'message' => gettext("faild_to_save...", "mel_forum") . $type . '.']);
                        exit;
                    }
                    $message = ucfirst($type) . gettext("...saved", "mel_forum");
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
                    echo json_encode(['status' => 'error', 'message' => gettext("faild_to_save...", "mel_forum") . $type . '.']);
                    exit;
                }
                $message = ucfirst($type) . gettext("...saved", "mel_forum");
            }
        }

        // Retourner la réponse JSON avec le statut et le message approprié
        // header('Content-Type: application/json');
        echo json_encode(['status' => $status, 'message' => $message]);
        exit;
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
        $uid = rcube_utils::get_input_value('_post_uid', rcube_utils::INPUT_GPC);

        // Récupérer le paramètre de tri des commentaires
        $sort_order = rcube_utils::get_input_value('_sort_order', rcube_utils::INPUT_GPC, true);

        // Récupérer l'ID du commentaire pour obtenir ses enfants (réponses)
        $param_comment_id = rcube_utils::get_input_value('_comment_id', rcube_utils::INPUT_GPC, true);

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

    // /**
    //  * Traite les images encodées en base64 dans le contenu, les enregistre, 
    //  * et remplace les données base64 par les URL correspondantes.
    //  *
    //  * Cette fonction parcourt le contenu fourni pour détecter les images 
    //  * intégrées sous forme de données base64, les enregistre à un emplacement 
    //  * associé à l'ID du post donné, et remplace les balises `<img>` contenant 
    //  * des données base64 par des balises `<img>` avec les URLs des images sauvegardées.
    //  *
    //  * @param string $content Le contenu HTML contenant des images encodées en base64.
    //  * @param int    $post_id L'ID du post auquel associer les images sauvegardées.
    //  * 
    //  * @return string Le contenu mis à jour avec les images base64 remplacées par des URLs.
    //  */
    // protected function process_base64_images($content, $post_id)
    // {
    //     // Tableau pour collecter les URLs des images réellement utilisées
    //     $usedImageUrls = [];

    //     // Expression régulière pour trouver toutes les balises <img src="data:image/">
    //     preg_match_all('/<img src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/i', $content, $matches, PREG_SET_ORDER);

    //     foreach ($matches as $img) {
    //         $imageType = $img[1]; // Type de l'image (jpeg, png, etc.)
    //         $base64Data = $img[2]; // Données en base64

    //         // Reconstruire le préfixe de l'image
    //         $fullBase64Data = "data:image/{$imageType};base64,{$base64Data}";

    //         // Enregistrer l'image dans la base de données
    //         $imageSaved = $this->save_image($post_id, $fullBase64Data);  // Passer les données complètes à la fonction

    //         if ($imageSaved) {
    //             // Utiliser la fonction get_image_url pour générer l'URL de l'image
    //             $imageUrl = $this->get_image_url($imageSaved);

    //             // Collecter les URLs des images utilisées
    //             $usedImageUrls[] = $imageUrl;

    //             // Remplacer la balise <img> par la version avec URL
    //             $content = str_replace($img[0], '<img src="' . $imageUrl . '"', $content);
    //         }
    //     }

    //     return $content;
    // }

    protected function process_base64_images($content, $post_id)
    {
        // Récupérer les images existantes associées au post
        $existingImageUids = $this->get_all_images_by_post($post_id);

        // Tableau pour collecter les URLs des images réellement utilisées
        $usedImageUrls = [];
        $usedImageUids = []; // Collecter les UIDs des images utilisées

        // Expression régulière pour trouver toutes les balises <img src="data:image/">
        preg_match_all('/<img src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/i', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $img) {
            $imageType = $img[1]; // Type de l'image (jpeg, png, etc.)
            $base64Data = $img[2]; // Données en base64

            // Reconstruire le préfixe de l'image
            $fullBase64Data = "data:image/{$imageType};base64,{$base64Data}";

            // Enregistrer l'image dans la base de données
            $imageSaved = $this->save_image($post_id, $fullBase64Data); // Passer les données complètes à la fonction

            if ($imageSaved) {
                // Utiliser la fonction get_image_url pour générer l'URL de l'image
                $imageUrl = $this->get_image_url($imageSaved);

                // Collecter les URLs et les UIDs des images utilisées
                $usedImageUrls[] = $imageUrl;
                $usedImageUids[] = $imageSaved->uid; // Supposons que save_image retourne un objet avec un UID

                // Remplacer la balise <img> par la version avec URL
                $content = str_replace($img[0], '<img src="' . $imageUrl . '"', $content);
            }
        }

        // Identifier les images obsolètes (non utilisées dans le contenu)
        $obsoleteImageUids = array_diff($existingImageUids, $usedImageUids);

        // Supprimer les images obsolètes de la BDD
        foreach ($obsoleteImageUids as $uid) {
            $this->delete_image($uid);
        }

        return $content;
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
    protected function save_image($post_id, $data)
    {
        // Validation des données saisies
        if (empty($post_id) || empty($data)) {
            echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
            return false;
        }

        // Créer une nouvelle image
        $image = new LibMelanie\Api\Defaut\Posts\Image();
        $image->uid = $this->generateRandomString(24);
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
    public function get_all_images_by_post($post_id)
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
    protected function delete_image($uid)
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
        $post_id = rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST);
        // $post = new LibMelanie\Api\Defaut\Posts\Post();
        // $post->post = $post_id;
        $image = new LibMelanie\Api\Defaut\Posts\Image();
        $image->post = $post_id;
        $image->data = rcube_utils::get_input_value('_file', rcube_utils::INPUT_POST);
        $image->uid = $this->generateRandomString(24);
        // Sauvegarde de l'image
        $ret = $image->save();
        if (!is_null($ret)) {
            $url = $this->get_image_url($image->uid);
            echo json_encode(['status' => 'success', 'image_uid' => $image->uid, 'url' => $url]);
            exit;
        }
    }

    /**
     * Renvoie une url permettant d'afficher une image de la base de donnée
     * @param string $uid uid de l'image que l'on veut afficher
     * @return string url de l'image
     */
    protected function get_image_url($uid)
    {
        $rcmail = rcmail::get_instance();
        $url = $rcmail->url(array(
            "_task" => "forum",
            "_action" => "load_image",
            "_image_uid" => $uid,
        ), true, true, true);
        // $url = 'https://' . $_SERVER['PLUGIN_MEL_HTTP_HOST'] . '?_task=forum&_action=load_image';
        // $url = $url . '&_image_uid=' . $uid;
        return $url;
    }

    /**
     * Affiche l'image dont l'uid est passé dans les paramètres (POST)
     */
    public function load_image()
    {
        $image = new LibMelanie\Api\Defaut\Posts\Image();
        $image->uid = rcube_utils::get_input_value('_image_uid', rcube_utils::INPUT_GET);
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
            $this->rc()->output->sendExit('', ['HTTP/1.0 204 Photo not found']);
        }
        $this->rc()->output->sendExit(base64_decode(rcmail_output::BLANK_GIF), ['Content-Type: image/gif']);
    }


    /**
     * Met dans l'env roundcube une liste de post.
     *
     * Cette fonction récupère toutes les publications d'un espace de travail, 
     * formate chaque publication avec ses détails (créateur, date, titre, résumé, image, tags, 
     * et nombre de réactions et commentaires) et génère le HTML correspondant.
     */
    protected function show_posts()
    {
        $this->rc()->output->set_env('posts_data', $this->post_object_to_JSON());
    }

    /**
     * Retourne les données des posts sous forme de JSON
     */
    public function get_posts_data()
    {
        echo json_encode($this->post_object_to_JSON());
        exit;
    }

    /**
     * Prend en paramètre un tableau d'objet post et retourne un tableau au format JSON
     */
    protected function post_object_to_JSON($workspace_uid = null, $limit = 20)
    {
        $posts = $this->get_posts_byworkspace($workspace_uid, $limit);

        // Définir la locale en français pour le formatage de la date
        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);

        //TODO récupérer le workspace_uid au premier chargment
        $workspace_uid = rcube_utils::get_input_value('_workspace', rcube_utils::INPUT_POST);
        //TODO supprimer
        if ($workspace_uid === null) {
            $workspace_uid = "workspace-test";
        }

        $posts_data = [];

        foreach ($posts as $post) {
            // Convertit la date du post en un timestamp Unix
            $timestamp = strtotime($post->created);
            // Formate la date du post
            $formatted_date = $formatter->format($timestamp);

            $post_creator = driver_mel::gi()->getUser($post->creator);
            $tags = $this->get_all_tags_bypost($post->uid);
            // Récupérer le nombre de réaction pas pris en compte dans la v1
            //$reaction_count = $this->count_reactions($post->uid);
            // Récupérer le nombre de likes
            $isliked = $this->hasReaction('like', $post->id);
            $isdisliked = $this->hasReaction('dislike', $post->id);
            // Récupérer le nombre de commentaire
            $comment_count = $post->countComments();
            $is_fav = $this->is_fav($post->uid, $workspace_uid);
            $post_link = $this->rc()->url(array(
                "_task" => "forum",
                "_action" => "post",
                "_uid" => $post->uid,
            ), true, true, true);

            // Récupérer la première image du post et son URL
            $first_image = $post->firstImage();
            // TODO: checker le default_image_path ?
            $image_url = $first_image ? $this->get_image_url($first_image->uid) : 'default_image_path.jpg';

            $posts_data[$post->uid] = [
                'uid' => $post->uid,
                'id' => $post->id,
                'title' => $post->title,
                'creation_date' => $formatted_date,
                'post_creator' => $post_creator->name,
                'creator_email' => $post_creator->email,
                'tags' => $tags,
                'summary' => $post->summary,
                // 'reaction' => $reaction_count,
                'like_count' => $post->likes,
                'dislike_count' => $post->dislikes,
                'comment_count' => $comment_count,
                'favorite' => $is_fav,
                'isliked' => $isliked,
                'isdisliked' => $isdisliked,
                'post_link' => $post_link,
                'image_url' => $image_url,
            ];
        }
        return $posts_data;
    }

    /**
     * vérifie si un article est en favori
     */
    protected function is_fav($post_uid, $workspace_uid)
    {
        $fav_articles = $this->rc()->config->get('favorite_article', []);
        return isset($fav_articles[$workspace_uid]) && in_array($post_uid, $fav_articles[$workspace_uid]);
    }

    /**
     * ajoute un article aux favoris dans les user pref
     */
    public function add_to_favorite()
    {
        $new_fav_post_workspace_uid = rcube_utils::get_input_value('_workspace_uid', rcube_utils::INPUT_POST);
        $new_fav_post_uid = rcube_utils::get_input_value('_article_uid', rcube_utils::INPUT_POST);
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

    /**
     * Gestion des réactions aux posts
     */
    public function manage_reaction()
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $user_uid = $user->uid;

        $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);
        $post_id = intval(rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST));

        // TODO liker son propre commentaire ou post ?

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
     * @param string $post_id uid de l'article
     * 
     * @return boolean 
     */
    protected function hasReaction($type, $post_id)
    {
        // Récupérer l'utilisateur
        $user = driver_mel::gi()->getUser();
        $user_uid = $user->uid;

        $reaction = new LibMelanie\Api\Defaut\Posts\Reaction();
        $reaction->post = $post_id;
        $reaction->creator = $user_uid;
        $reaction->type = $type;
        return $reaction->load();
    }



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
        $this->include_web_component()->Avatar();
        $this->load_script_module('new_posts');
        $this->show_new_posts();
        $workspace = rcube_utils::get_input_value('_worskpace_uid', rcube_utils::INPUT_POST);

        // Envoyer le template approprié
        $this->rc()->output->send('mel_forum.new-posts');
    }

    /**
     * TODO: Docblock
     */
    public function show_new_posts()
    {
        // $posts = $this->get_new_posts_byworkspace();
        // $posts_data = $this->new_posts_object_to_Json($posts);

        // $this->rc()->output->set_env('posts_data', $posts_data);

        // TODO a changer
        $workspace_uid = "un-espace-2";

        $this->rc()->output->set_env('posts_data', $this->post_object_to_JSON($workspace_uid, 3));
    }

    /**
     * Bloquer les refresh
     * @param array $args
     */
    function refresh($args)
    {
        return array('abort' => true);
    }

    #region Espaces des travail
    /**
     * TODO: Docblock
     */
    public function workspace_services_set($args)
    {
        $services = $args['services'];

        if (array_search('forum', $services) !== null) {
            $workspace = $args['workspace'];

            if ($workspace->objects()->get('forum') === null) {
                $workspace->objects()->set('forum', true);
                $args['workspace'] = $workspace;
            }
        }

        return $args;
    }

    /**
     * TODO: Docblock
     */
    public function wsp_show($args)
    {
        if ($args['workspace']->objects()->get('forum') !== null) {
            $args['layout']->setNavBarSetting('forum', 'newspaper', true, 4);
            // $args['layout']->firstRow()->append(12, $args['layout']->htmlSmallModuleBlock(['id' => 'module-forum-news']));
            $args['layout']->secondRow()->append(8, $args['layout']->htmlModuleBlock(['id' => 'module-forum-last', 'data-title' => 'Derniers articles', 'data-button' => '']));

            $this->include_module('workspace.js');
        }

        return $args;
    }
    #endregion
}
