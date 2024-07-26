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
    $this->include_stylesheet($this->local_skin_path().'/mel_forum.css');

    // ajout de la tache
    $this->register_task('forum');
    
    if ($this->rc()->task === "forum"){
        $this->register_action('test', array($this,'test'));
        $this->register_action('elements', array($this, 'elements'));
        $this->register_action('test_create_tag', array($this, 'test_create_tag'));
        $this->register_action('test_get_all_tags_byWorkspace', array($this, 'test_get_all_tags_byWorkspace'));
        $this->register_action('test_get_all_tags_bypost', array($this, 'test_get_all_tags_bypost'));
        $this->register_action('test_update_tag', array($this, 'test_update_tag'));
        $this->register_action('test_delete_tag', array($this, 'test_delete_tag'));
        $this->register_action('test_create_post', array($this, 'test_create_post'));
        $this->register_action('test_update_post', array($this, 'test_update_post'));
        $this->register_action('test_delete_post', array($this, 'test_delete_post'));
        $this->register_action('test_get_post', array($this, 'test_get_post'));
        $this->register_action('test_get_all_posts_byworkspace', array($this, 'test_get_all_posts_byworkspace'));
        $this->register_action('test_create_comment', array($this, 'test_create_comment'));
        $this->register_action('test_reply_comment', array($this, 'test_reply_comment'));
        $this->register_action('test_update_comment', array($this, 'test_update_comment'));
        $this->register_action('test_delete_comment', array($this, 'test_delete_comment'));
        $this->register_action('test_like_comment', array($this, 'test_like_comment'));
        $this->register_action('test_get_all_comments_bypost', array($this, 'test_get_all_comments_bypost'));
        $this->register_action('test_count_comments', array($this, 'test_count_comments'));
        $this->register_action('test_delete_like', array($this, 'test_delete_like'));
        $this->register_action('test_create_reaction', array($this, 'test_create_reaction'));
        $this->register_action('test_delete_reaction', array($this, 'test_delete_reaction'));
        $this->register_action('test_get_all_reactions_bypost', array($this, 'test_get_all_reactions_bypost'));
        $this->register_action('test_count_reactions', array($this, 'test_count_reactions'));
        $this->register_action('test_create_image', array($this, 'test_create_image'));
        $this->register_action('test_delete_image', array($this, 'test_delete_image'));
        $this->register_action('test_delete_image', array($this, 'test_delete_image'));
        $this->register_action('test_get_image', array($this, 'test_get_image'));
        $this->register_action('test_unassociate_tag_from_post', array($this, 'test_unassociate_tag_from_post'));
        


        // Penser à modifier avec index au lieu de post pour afficher la page d'accueil
        $this->register_action('index', [$this, 'post']);
        //Affichage de la page d'un article
        $this->register_action('post', [$this, 'post']);
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
        $this->register_action('create_post', array($this, 'create_post'));
        //modifier un article
        $this->register_action('update_post', array($this, 'update_post'));
        //supprimer un article
        $this->register_action('delete_post', array($this, 'delete_post'));
        // récupérer un  article
        $this->register_action('get_one_post', array($this, 'get_one_post'));
        // récupérer tous les articles
        $this->register_action('get_all_posts_byworkspace', array($this, 'get_all_posts_byworkspace'));
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
        // Lister les comments d'un Post
        $this->register_action('get_all_comments_bypost', array($this, 'get_all_comments_bypost'));
        // Compter le nombre de commentaires pour un Post
        $this->register_action('count_comment', array($this, 'count_comment'));
        //Supprimer un Like
        $this->register_action('delete_like', array($this, 'delete_like'));
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
        // Créer une image
        $this->register_action('create_image', array($this, 'create_image'));
        // Supprimer une image
        $this->register_action('delete_image', array($this, 'delete_image'));
        
    }
}

function index(){
    $this->rc()->output->send('mel_forum.forum');

    $this->rc()->output->add_handlers(array('forum_post' => array($this, 'show_posts')));
}

function post(){
    $this->rc()->output->send('mel_forum.post');
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
function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    return $randomString;
}

/**
 * Envoie une réponse de type forum.
 */
function action()
{
    $rcmail = rcmail::get_instance();

    $rcmail->output->send('mel_forum.forum');
}

/**
 * Vérifie l'utilisateur en fonction de l'UID fourni.
 */
function check_user()
{
    $user;
    $val = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_GPC);
    $user = driver_mel::gi()->getUser($val);

    echo $user === null ? 'false' : json_encode(['uid' => $user->uid, 'html' => $user->fullname]);

    exit;
}

/**
 * Crée un nouvel article avec les données fournies.
 */
public function create_post()
{
    //récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    //récupérer le Workspace
    $workspace = driver_mel::gi()->workspace();

    // récupérer les valeurs des champs POST
    $title = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST);
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);
    $summary = rcube_utils::get_input_value('_summary', rcube_utils::INPUT_POST);
    $settings = rcube_utils::get_input_value('_settings', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($title) || empty($content) || empty($description) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    //Créer un nouvel Article
    $post = new LibMelanie\Api\Defaut\Posts\Post();

    //Définition des propriétés de l'article
    $post->post_title = $title;
    $post->post_summary = $summary;
    $post->post_content = $content;
    $post->post_uid = $this-> generateRandomString(24);
    $post->created = date('Y-m-d H:i:s');
    $post->updated = date('Y-m-d H:i:s');
    $post->user_uid = $user->uid;
    $post->post_settings = $settings;
    $post->workspace_uid = $workspace;

    // Sauvegarde de l'article
    $ret = $post->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Article créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Met à jour un article existant avec les données fournies.
 */
public function update_post()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer les valeurs des champs POST
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);
    $title = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST);
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);
    $summary = rcube_utils::get_input_value('_description', rcube_utils::INPUT_POST);
    $settings = rcube_utils::get_input_value('_settings', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($uid) || empty($title) || empty($content) || empty($description) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Préparer les nouvelles données
    $new_data = [
        'title' => $title,
        'content' => $content,
        'summary' => $summary,
        'settings' => $settings
    ];
    
    // Enregistrer les modifications dans l'historique
    $this->save_post_history($post, $user->uid, $new_data);

    // Définir les nouvelles propriétés de l'article
    $post->post_title = $title;
    $post->post_content = $content;
    $post->post_summary = $summary;
    $post->post_settings = $settings;
    $post->updated = date('Y-m-d H:i:s');
    $post->user_uid = $user->uid;

    // Sauvegarde de l'article
    $ret = $post->save();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Article mis à jour avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de mise à jour de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Enregistre l'historique des modifications d'un article.
 * 
 * @param object $post L'article modifié.
 * @param string $user_uid L'UID de l'utilisateur effectuant la modification.
 * @param array $new_data Les nouvelles données de l'article.
 */
private function save_post_history($post, $user_uid, $new_data)
{
    // Charger l'historique actuel
    $history = json_decode($post->history, true);
    if (!is_array($history)) {
        $history = [];
    }

    // Accumuler les champs modifiés
    $modified_fields = [];
    foreach ($new_data as $field => $new_value) {
        $old_value = $post->$field;
        if ($old_value !== $new_value) {
            $modified_fields[] = $field;
        }
    }

    // Si des champs ont été modifiés, ajouter une seule entrée à l'historique
    if (!empty($modified_fields)) {
        $history[] = [
            'field' => $modified_fields,
            'user_id' => $user_uid,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    // Enregistrer l'historique mis à jour dans le champ `history`
    $post->history = json_encode($history);
}

/**
 * Supprime un article existant en fonction de l'UID fourni.
 */
public function delete_post()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer la valeur du champ POST
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'identifiant de l\'article est requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Supprimer l'article
    $ret = $post->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => "L'article " . $post->title . " a été supprimé avec succès."]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "Echec de suppression de l'article " . $post->title ."."]);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Récupère un article en fonction de son UID et renvoie les données en format JSON.
 *
 * @return void Cette méthode ne retourne rien mais affiche directement une réponse JSON.
 */
public function get_post()
{
    // Récuperer l'Uid de l'article
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_GET);

    // Validation des données
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'Uid de l\'article et requis.']);
        exit;
    }

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    $ret = $post->load();
    if (!is_null($ret)) {

        echo json_encode([
            'status' => 'success',
            'titre' => $post->title,
            'summary' => $post->summary,
            'content' => $post->content,
            'creator' => driver_mel::gi()->getUser()->name,
            'date de création' => $post->created,
        ]);
    } else {
        header('Content-Type : application/json');
        echo json_encode(['status' => 'error', 'message' => 'Echec de chargement de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Affiche tous les posts d'un workspace au format JSON.
 *
 * Cette fonction récupère le groupe de workspace en cours d'utilisation
 * et charge tous les posts associés en utilisant la méthode listPosts.
 * Les posts sont ensuite renvoyés en réponse au format JSON.
 *
 * @return void
 */
public function get_all_posts_byworkspace()
{
    //récupérer le Workspace
    $workspace_uid = driver_mel::gi()->workspace();

    // Charger tous les posts en utilisant la méthode listPosts
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->workspace = $workspace_uid;

    // Appel de la méthode listPosts
    $posts = $post->listPosts();

    if (!empty($posts)) {
        header('Content-Type: application/json');
        // Préparer les données des tags pour la réponse JSON
        $posts_array = [];
        foreach ($posts as $post) {
            $posts_array[] = [
                'id' => $post->id,
                'title' => $post->title,
                'summary'=> $post->summary,
                'content' => $post->content,
                'created' => $post->created,
                'author' => driver_mel::gi()->getUser()->name,
                'settings' => $post->settings,
                'workspace' => $post->workspace
            ];
        }
        echo json_encode([
            'status' => 'success',
            'tags' => $posts_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun post trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Crée un nouveau tag sous forme de réponse JSON.
 *
 * Cette fonction récupère le groupe de workspace, le nom du tag depuis une requête POST,
 * crée un nouveau tag en utilisant la classe `LibMelanie\Api\Defaut\Posts\Tag`,
 * et renvoie le résultat de l'opération sous forme de réponse JSON.
 * Si la création du tag est réussie, elle renvoie un message de succès en JSON.
 * En cas d'échec, elle renvoie un message d'erreur en JSON.
 *
 * @return void
 */
public function create_tag()
{
    // Récupérer le Workspace
    $workspace_uid = driver_mel::gi()->workspace();

    // Récupérer le nom du champ POST
    $name = rcube_utils::get_input_value('_name', rcube_utils::INPUT_POST);

    //Créer un tag
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();

    //Définition des propriétés du tag
    $tag->tag_name = $name;
    $tag->workspace_uid = $workspace;

    // Sauvegarde du tag
    $ret = $tag->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Tag créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création du Tag.']);
    }

    // Arrêt de l'exécution du script
    exit;

}

/**
 * Affiche tous les tags sous forme de réponse JSON.
 *
 * Cette fonction récupère le groupe de workspace, charge tous les tags
 * disponibles en utilisant la méthode `listTags` de la classe `LibMelanie\Api\Defaut\Posts\Tag`,
 * et renvoie les tags sous forme de réponse JSON. Si aucun tag n'est trouvé,
 * elle renvoie un message d'erreur en JSON.
 *
 * @return void
 */
public function get_all_tags_byworkspace()
{
    // Récupérer le Workspace
    $workspace_uid = driver_mel::gi()->workspace();

    // Charger tous les tags en utilisant la méthode listTags
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->workspace_uid = $workspace;
    
    // Pour ajouter une recherche, définir une variable $search ici
    $search = null; // ou une valeur de recherche comme 'exemple'

    // Appeler la méthode listTags avec le paramètre de recherche
    $tags = $tag->listTags($search);
        
    if (!empty($tags)) {
        header('Content-Type: application/json');
        // Préparer les données des tags pour la réponse JSON
        $tags_array = [];
        foreach ($tags as $tag) {
            $tags_array[] = [
                'tag_name' => $tag->name,
                'workspace_uid' => $tag->workspace,
                'tag_id' => $tag->id
            ];
        }
        echo json_encode([
            'status' => 'success',
            'tags' => $tags_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun tag trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Affiche tous les tags associés à un post au format JSON.
 *
 * Cette fonction récupère l'UID du post envoyé via un formulaire POST,
 * charge le post correspondant, et liste tous les tags associés à ce post.
 * Les tags sont ensuite renvoyés en réponse au format JSON.
 *
 * @return void
 */
public function get_all_tags_bypost()
{
    // Récupérer l'uid de l'article du champ POST
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    if ($post->load()) {
    $tags = $post->listTags();

    if (!empty($tags)) {
        header('Content-Type: application/json');
        // Préparer les données des tags pour la réponse JSON
        $tags_array = [];
        foreach ($tags as $tag) {
            $tags_array[] = [
                'tag_name' => $tag->name,
                'workspace_uid' => $tag->workspace,
                'tag_id' => $tag->id
            ];
        }
        echo json_encode([
            'status' => 'success',
            'tags' => $tags_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun tag trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
    }
}

/**
 * Supprime un tag spécifique.
 *
 * Cette fonction récupère l'utilisateur courant, le workspace associé, 
 * et le nom du tag à supprimer à partir des données POST. 
 * Elle valide ensuite les données, vérifie si le tag existe, et le supprime si c'est le cas.
 *
 * @return void
 */
public function delete_tag()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer le Workspace
    $workspace = driver_mel::gi()->get_workspace_group();

    // Récupérer la valeur du champ POST
    $name = rcube_utils::get_input_value('_name', rcube_utils::INPUT_POST);

    // Validation de la donnée saisie
    if (empty($name)) {
        echo json_encode(['status' => 'error', 'message' => 'Le nom du tag est requis.']);
        exit;
    }

    // Récupérer le tag existant
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->tag_name = $name;
    $tag->workspace_uid = $workspace;

    // Vérifier si le tag existe
    if (!$tag->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Tag introuvable.']);
        exit;
    }

    // Supprimer le tag
    $ret = $tag->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => "Le Tag " . $tag->name . " a été supprimé avec succès."]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "Echec de suppression du Tag " . $tag->name ."."]);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Associe un tag à un post et renvoie le résultat au format JSON.
 *
 * Cette fonction récupère les valeurs des champs POST pour le nom du tag,
 * l'UID du workspace et l'UID du post, valide ces données, charge le tag
 * et le post correspondants, puis associe le tag au post.
 * Le résultat de l'opération est renvoyé au format JSON.
 *
 * @return void
 */
public function associate_tag_at_post()
{
    // Récupérer la valeur des champs POST
    $name = rcube_utils::get_input_value('_name', rcube_utils::INPUT_POST);
    $workspace_uid = rcube_utils::get_input_value('_workspace_uid', rcube_utils::INPUT_POST);
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($name) || empty($workspace_uid) || empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer le tag existant
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->name = $name;
    $tag->workspace = $workspace_uid;

    if ($tag->load()) {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;

        if ($post->load()) {
            if ($post->addTag($tag)) {
                echo json_encode(['status' => 'success', 'message' => 'Tag associé au post avec succès.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Echec de l\'association du tag avec le post.']);
            }
        }

        // Arrêt de l'exécution du script
    exit;
    }
}

/**
 * Dissocie un tag d'un post et renvoie le résultat au format JSON.
 *
 * Cette fonction récupère les valeurs des champs POST pour le nom du tag,
 * l'UID du workspace et l'UID du post, valide ces données, charge le tag
 * et le post correspondants, puis dissocie le tag du post.
 * Le résultat de l'opération est renvoyé au format JSON.
 *
 * @return void
 */
public function unassociate_tag_from_post()
{
    // Récupérer la valeur des champs POST
    $name = rcube_utils::get_input_value('_name', rcube_utils::INPUT_POST);
    $workspace_uid = rcube_utils::get_input_value('_workspace_uid', rcube_utils::INPUT_POST);
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($name) || empty($workspace_uid) || empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer le tag existant
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->name = $name;
    $tag->workspace = $workspace_uid;

    if ($tag->load()) {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;

        if ($post->load()) {
            if ($post->removeTag($tag)) {
                echo json_encode(['status' => 'success', 'message' => 'Tag dissocié du post avec succès.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Echec de la suppression du tag lié au post.']);
            }
        }

        // Arrêt de l'exécution du script
    exit;
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

    // Récupérer le nom du champ POST
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'Le champ commentaire est requis.']);
        exit;
    }

    // Créer un nouveau commentaire
    $comment = new LibMelanie\Api\Defaut\Posts\Comment();
    $comment->comment_content = $content;
    $comment->comment_uid = $this->generateRandomString(24);
    $comment->created = date('Y-m-d H:i:s');
    $comment->updated = date('Y-m-d H:i:s');
    $comment->user_uid = $user->uid;
    $comment->post_id = $post->id;

    // Sauvegarde du commentaire
    $ret = $comment->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Commentaire créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création du commentaire.']);
    }

    // Arrêt de l'exécution du script
    exit;
}


/**
 * Répond à un commentaire ou à une réponse à un commentaire.
 *
 * Cette fonction récupère l'utilisateur actuel, le contenu de la réponse et l'ID du commentaire parent
 * depuis la requête POST, valide le contenu, et crée une nouvelle réponse.
 * Elle retourne un message JSON indiquant le succès ou l'échec de l'opération.
 *
 * @return void
 */
public function reply_comment()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer les valeurs post
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($user->uid) || empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouveau commentaire
    $reply = new LibMelanie\Api\Defaut\Posts\Comment();
    $reply->comment_content = $content;
    $reply->comment_uid = $this->generateRandomString(24);
    $reply->created = date('Y-m-d H:i:s');
    $reply->updated = date('Y-m-d H:i:s');
    $reply->user_uid = $user->uid;
    $reply->post_id = $post->id;
    $reply->parent_comment_id = $comment_parent->id;

    // Sauvegarde du commentaire
    $ret = $reply->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Réponse créée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de la réponse.']);
    }

    // Arrêt de l'exécution du script
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

        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    // Vérifier si le commentaire existe
    if (!$comment) {
        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    // Définir les nouvelles données
    $comment->comment_content = $content;
    $comment->updated = date('Y-m-d H:i:s');

    // Sauvegarde du commentaire
    $ret = $comment->save();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Commentaire mis à jour avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de mise à jour du commentaire.']);
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

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'uid du commentaire est requis.']);
        exit;
    }

    // Récupérer le commentaire existant
    $comment = new LibMelanie\Api\Defaut\Posts\Comment();
    $comment->uid = $uid;

    // Vérifier si le commentaire existe
    if (!$comment->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    // Supprimer le commentaire
    $ret = $comment->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Le commentaire a été supprimé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression du commentaire.']);
    }

    // Arrêt de l'exécution du script
    exit; 
}


/**
 * Gère l'ajout d'un like à un commentaire.
 *
 * Cette fonction récupère l'utilisateur actuel ainsi que les valeurs pour le type de like et l'ID du commentaire
 * depuis la requête POST. Elle valide les données saisies, charge le commentaire pour obtenir son créateur,
 * et s'assure que l'utilisateur ne peut pas liker son propre commentaire. Si la validation est réussie, 
 * un nouveau like est créé et sauvegardé.
 *
 * @return void
 */
public function like_comment()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();
    $user_uid = $user->getName();

    // Récupérer les valeurs
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);
    $comment_id = rcube_utils::get_input_value('_comment_id', rcube_utils::INPUT_POST);
    

    // Validation des données saisies
    if (empty($type) || empty($comment_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Charger le commentaire pour récupérer son id et son créateur
    $comment = new LibMelanie\Api\Defaut\Posts\Comment();
    $comment->uid = $comment_id;

    if (!$comment->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    $creator = $comment->creator;

    // Vérifier si le créateur du like est le même que le créateur du commentaire
    if ($creator === $user_uid) {
        echo json_encode(['status' => 'error', 'message' => 'Vous ne pouvez pas liker votre propre commentaire.']);
        exit;
    }

    // Création d'un Like
    $like = new LibMelanie\Api\Defaut\Posts\Comments\Like();
    $like->comment = $comment_id;
    $like->creator = $creator;
    $like->type = $type;

    // Sauvegarde du Like
    $ret = $like->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Like créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création du Like.']);
    }

    // Arrêt de l'exécution du script
    exit;

}

/**
 * Affiche tous les commentaires associés à un post au format JSON.
 *
 * Cette fonction récupère l'UID du post envoyé via un formulaire POST,
 * charge le post correspondant, et liste tous les commentaires associés à ce post.
 * Les commentaires sont ensuite renvoyés en réponse au format JSON.
 *
 * @return void
 */
public function get_all_comments_bypost()
{
    // Récupérer l'uid de l'article du champ POST
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    if ($post->load()) {
    $comments = $post->listComments();

    if (!empty($comments)) {
        header('Content-Type: application/json');
        // Préparer les données des réactions pour la réponse JSON
        $comments_array = [];
        foreach ($comments as $comment) {
            $comments_array[] = [
                'content' => $comment->content,
                'uid' => $comment->uid,
                'date de création' => $comment->created,
            ];
        }
        echo json_encode([
            'status' => 'success',
            'reactions' => $comments_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun commentaire trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
    }
}

/**
 * Compte le nombre de commentaires pour un article donné.
 *
 * Cette fonction récupère l'identifiant de l'article depuis la requête POST,
 * valide l'identifiant, charge l'article correspondant, et obtient le nombre
 * de commentaires pour cet article. Le résultat est renvoyé sous forme de JSON.
 *
 * @return void
 *
 * @throws Exception Si l'identifiant de l'article n'est pas fourni ou si l'article n'existe pas.
 */
public function count_comments()
{
    // Récupérer la valeur du champ POST
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'identifiant de l\'article est requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Obtenir le nombre de commentaires
    $commentCount = $post->countComments();

    // Vérifier si la méthode retourne un résultat valide
    if ($commentCount !== false) {
        echo json_encode(['status' => 'success', 'message' => "Nombre de commentaires : $commentCount"]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Impossible de récupérer le nombre de commentaires.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Supprime un "like" d'un commentaire.
 *
 * Cette fonction récupère les informations nécessaires depuis les variables POST,
 * valide les données reçues, et supprime le "like" associé au commentaire spécifié.
 *
 * @return void
 */
public function delete_like()
{
    // Récupérer la valeur du champ POST
    $comment = rcube_utils::get_input_value('_comment', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($creator) || empty($type) || empty($comment)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer le like existant
    $like = new LibMelanie\Api\Defaut\Posts\Comments\Like();
    $like->comment = $comment->id;
    $like->creator = driver_mel::gi()->getUser()->name;
    $like->type = $type;

    // Supprimer le Like
    $ret = $like->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Le commentaire a été supprimé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression du commentaire.']);
    }

    // Arrêt de l'exécution du script
    exit; 
}

/**
 * Crée une réaction à un post.
 *
 * Cette fonction récupère les informations nécessaires depuis les variables POST,
 * valide les données reçues, et crée une nouvelle réaction associée au post spécifié.
 *
 * @return void
 */
public function add_reaction()
{
    // Récupérer les valeurs
    $post_id = rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($post_id) || empty($creator) || empty($type)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouveau commentaire
    $reaction = new LibMelanie\Api\Defaut\Posts\Reaction();
    $reaction->post = $post_id;
    $reaction->creator = driver_mel::gi()->getUser()->name;
    $reaction->type = $type;

    // Sauvegarde du commentaire
    $ret = $reaction->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Réaction créée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de la réaction.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Supprime une réaction d'un post.
 *
 * Cette fonction récupère les informations nécessaires depuis les variables POST,
 * valide les données reçues, et supprime la réaction associée au post spécifié.
 *
 * @return void
 */
public function delete_reaction()
{
    // Récupérer la valeur du champ POST
    $post = rcube_utils::get_input_value('_post', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);
    
    // Validation des données saisies
    if (empty($creator) || empty($type) || empty($post_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer la réaction existante
    $reaction = new LibMelanie\Api\Defaut\Posts\Reaction();
    $reaction->post = $post->id;
    $reaction->creator = driver_mel::gi()->getUser()->name;
    $reaction->type = $type;

    // Supprimer la réaction
    $ret = $reaction->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'La réaction a été supprimée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression de la réaction.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Affiche toutes les réactions associées à un post au format JSON.
 *
 * Cette fonction récupère l'UID du post envoyé via un formulaire POST,
 * charge le post correspondant, et liste toutes les réactions associées à ce post.
 * Les réactions sont ensuite renvoyées en réponse au format JSON.
 *
 * @return void
 */
public function get_all_reactions_bypost()
{
    // Récupérer l'uid de l'article du champ POST
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    if ($post->load()) {
    $reactions = $post->listReactions();

    if (!empty($reactions)) {
        header('Content-Type: application/json');
        // Préparer les données des réactions pour la réponse JSON
        $reactions_array = [];
        foreach ($reactions as $reaction) {
            $reactions_array[] = [
                'reaction_type' => $reaction->type,
                'reaction_id' => $reaction->id
            ];
        }
        echo json_encode([
            'status' => 'success',
            'reactions' => $reactions_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucune réaction trouvée.']);
    }

    // Arrêt de l'exécution du script
    exit;
    }
}

/**
 * Compte le nombre de réactions pour un article donné.
 *
 * Cette fonction récupère l'identifiant de l'article depuis la requête POST,
 * valide l'identifiant, charge l'article correspondant, et obtient le nombre
 * de réactions pour cet article. Le résultat est renvoyé sous forme de JSON.
 *
 * @return void
 *
 * @throws Exception Si l'identifiant de l'article n'est pas fourni ou si l'article n'existe pas.
 */
public function count_reactions()
{
    // Récupérer la valeur du champ POST
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'identifiant de l\'article est requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Obtenir le nombre de commentaires
    $reactionCount = $post->countReactions();

    // Vérifier si la méthode retourne un résultat valide
    if ($reactionCount !== false) {
        echo json_encode(['status' => 'success', 'message' => "Nombre de réactions : $reactionCount"]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Impossible de récupérer le nombre de réactions.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Crée une nouvelle image et renvoie le résultat au format JSON.
 *
 * Cette fonction récupère les données d'image envoyées via un formulaire POST,
 * valide les données, crée une nouvelle image, et sauvegarde cette image.
 * Le résultat de l'opération est renvoyé au format JSON.
 *
 * @return void
 */
public function create_image()
{
    // Récupérer la data du champ POST
    $data = rcube_utils::get_input_value('_data', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($data)) {
        echo json_encode(['status' => 'error', 'message' => 'Le champ Data est requis.']);
        exit;
    }

    // Créer une nouvelle image
    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $this-> generateRandomString(24);
    $image->post = $post->id;
    $image->data = $data;

    // Sauvegarde de l'image
    $ret = $image->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Image créée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de l\'image.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Supprime une image et renvoie le résultat au format JSON.
 *
 * Cette fonction récupère l'UID de l'image à supprimer envoyé via un formulaire POST,
 * valide l'UID, récupère l'image correspondante et la supprime.
 * Le résultat de l'opération est renvoyé au format JSON.
 *
 * @return void
 */
public function delete_image()
{
    // Récuperer l'Uid de l'image
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'UID est requis.']);
        exit;
    }

    // Récupérer l'image existante
    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $uid;

    // Supprimer l'image
    $ret = $image->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'L\'image a été supprimée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression de l\'image.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Récupère une image en fonction de son UID et renvoie les données en format JSON.
 *
 * @return void Cette méthode ne retourne rien mais affiche directement une réponse JSON.
 */
public function get_image()
{
    // Récuperer l'Uid de l'image
    $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

    // Validation des données
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'Uid de l\'image et requis.']);
        exit;
    }

    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $uid;

    $ret = $image->load();
    if (!is_null($ret)) {

        echo json_encode([
            'status' => 'success',
            'image' => $image->data,
        ]);
    } else {
        header('Content-Type : application/json');
        echo json_encode(['status' => 'error', 'message' => 'Echec de chargement de l\'image.']);
    }

    // Arrêt de l'exécution du script
    exit;
}










/**
 * Affiche une liste de posts en générant du HTML à partir d'un modèle.
 *
 * @param array $posts Un tableau d'objets post à afficher.
 * @return string Le HTML généré pour la liste des posts.
 */
function show_posts($posts) {
    
    $html = "";
    $html_post = $this->rc->output->parse("mel_forum.model-post", false, false);

    $posts = $this->get_all_posts_byworkspace();

    foreach ($posts as $post) {
        $html_post_copy = $html_post;

        $html_post_copy = str_replace("<creator/>", $post->creator, $html_post_copy);
        $html_post_copy = str_replace("<date/>", $post->create, $html_post_copy);
        $html_post_copy = str_replace("<title/>", $post->title, $html_post_copy);
        $html_post_copy = str_replace("<summary/>", $post->summary, $html_post_copy);

        $html .= $html_post_copy;

    }

    return $html;
}










// TESTS

function test()
{
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->workspace = 'un-espace-2';
    $posts = $post->list();

    foreach ($posts as $post) {
        echo "Post trouvé: " . $post->title . " | reactions : " . $post->countReactions() . " | comments : " . $post->countComments() . "\r\n";
    }

    exit;
}

function elements()
{
// Les données à envoyer en JSON
$data = ['dorian', 'arnaud', 'thomas', 'julien', 'stéphanie'];

// Ajout d'un en-tête pour spécifier que la réponse est en JSON
header('Content-Type: application/json');

// Envoie de la réponse JSON
echo json_encode($data);

// Arrêt de l'exécution du script
exit;
}

public function test_create_post()
{
    $workspace = 'un-espace-2';

    $title = 'Metal Gear Solid'; // Valeur en dur pour le test
    $content = 'Metal Gear Solid est un jeu d\infiltration sorti en 1998 qui a redéfini le genre avec son approche cinématographique et son gameplay innovant. Le jeu suit Solid Snake, un agent infiltré, qui doit empêcher un groupe terroriste de lancer des armes nucléaires. Avec ses mécanismes de furtivité, ses combats de boss mémorables et son histoire complexe, Metal Gear Solid a été acclamé pour son design et sa narration.'; // Valeur en dur pour le test
    $summary = 'Metal Gear Solid suit Solid Snake, qui doit empêcher un lancement nucléaire, avec des mécanismes de furtivité innovants, des combats de boss mémorables et une histoire complexe.'; // Valeur en dur pour le test
    $settings = 'Modifiable'; // Valeur en dur pour le test

    // Validation des données saisies
    if (empty($user->uid) || empty($title) || empty($content) || empty($summary) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    //Créer un nouvel Article
    $post = new LibMelanie\Api\Defaut\Posts\Post();

    //Définition des propriétés de l'article
    $post->post_title = $title;
    $post->post_summary = $summary;
    $post->post_content = $content;
    $post->post_uid = $this->generateRandomString(24);
    $post->created = date('Y-m-d H:i:s');
    $post->updated = date('Y-m-d H:i:s');
    $post->user_uid = driver_mel::gi()->getUser()->name;
    $post->post_settings = $settings;
    $post->workspace_uid = $workspace;

    // Sauvegarde de l'article
    $ret = $post->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Article créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_update_post()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer les valeurs des champs POST
    $uid = 'BnuDKo6D8Kd2xABa2TgaVFpf'; // UID de l'article à mettre à jour
    $title = 'Vingt Mille Lieues sous les Mers'; // Valeur en dur pour le test
    $content = 'Vingt Mille Lieues sous les Mers plonge les lecteurs dans une aventure sous-marine à bord du Nautilus, le sous-marin du capitaine Nemo. Le narrateur, le professeur Aronnax, accompagné de son domestique Conseil et du harponneur Ned Land, explore les profondeurs des océans, rencontrant des créatures marines fascinantes et découvrant des trésors engloutis. Le capitaine Nemo, mystérieux et complexe, ajoute une dimension intrigante à cette odyssée.'; // Valeur en dur pour le test
    $summary = 'L\'histoire de Vingt Mille Lieues sous les Mers suit le professeur Aronnax et ses compagnons à bord du Nautilus, explorant les merveilles et les mystères des océans avec le capitaine Nemo.'; // Valeur en dur pour le test
    $workspace = 'un-espace-2';
    $settings = 'Modifiable'; // Valeur en dur pour le test

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;
    if (!$post->load()) {
        
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Vérifier si l'article existe
    if (!$post) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Préparer les nouvelles données
    $new_data = [
        'title' => $title,
        'content' => $content,
        'summary' => $summary,
        'workspace' => $workspace,
        'settings' => $settings
    ];
    
    // Enregistrer les modifications dans l'historique
    $this->save_post_history($post, $user->uid, $new_data);

    // Définir les nouvelles propriétés de l'article
    $post->post_title = $title;
    $post->post_content = $content;
    $post->post_summary = $summary;
    $post->workspace_uid = $workspace;
    $post->post_settings = $settings;
    $post->updated = date('Y-m-d H:i:s');
    $post->user_uid = $user->uid;

    // Sauvegarde de l'article
    $ret = $post->save();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Article mis à jour avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de mise à jour de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_delete_post()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer la valeur du champ POST
    $uid = 'lflwbSZvF1MbK6qntjIBY36c';

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'identifiant de l\'article est requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Supprimer l'article
    $ret = $post->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => "L'article " . $post->title . " a été supprimé avec succès."]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "Echec de suppression de l'article " . $post->title ."."]);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_get_post()
{
    $uid ='iDaeXxkems6Ize9DH8TrZMDh';

    // Validation des données
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'Uid de l\'article et requis.']);
        exit;
    }

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    $ret = $post->load();
    if (!is_null($ret)) {

        echo json_encode([
            'status' => 'success',
            'titre' => $post->title,
            'summary' => $post->summary,
            'content' => $post->content,
            'auteur' => driver_mel::gi()->getUser()->name,
            'date de création' => $post->created,
        ]);
    } else {
        header('Content-Type : application/json');
        echo json_encode(['status' => 'error', 'message' => 'Echec de chargement de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_get_all_posts_byworkspace()
{
    // Charger tous les posts en utilisant la méthode listPosts
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->workspace = 'un-espace-2';

    // Appel de la méthode listPosts
    $posts = $post->listPosts();

    if (!empty($posts)) {
        header('Content-Type: application/json');
        // Préparer les données des tags pour la réponse JSON
        $posts_array = [];
        foreach ($posts as $post) {
            $posts_array[] = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'workspace' => $post->workspace
            ];
        }
        echo json_encode([
            'status' => 'success',
            'tags' => $posts_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun post trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_create_tag()
{
    
    //Créer un tag
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();

    //Définition des propriétés du tag
    $tag->name = 'Survie';
    $tag->workspace = 'un-espace-2';

    // Sauvegarde du tag
    $ret = $tag->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Tag créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création du Tag.']);
    }

    // Arrêt de l'exécution du script
    exit;

}

public function test_get_all_tags_byWorkspace()
{
    // Charger tous les tags en utilisant la méthode listTags
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->workspace = 'un-espace-2';
    
    // Si vous voulez ajouter une recherche, vous pouvez définir une variable $search ici
    $search = null; // ou une valeur de recherche comme 'exemple'

    // Appeler la méthode listTags avec le paramètre de recherche
    $tags = $tag->listTags($search);
        
    if (!empty($tags)) {
        header('Content-Type: application/json');
        // Préparer les données des tags pour la réponse JSON
        $tags_array = [];
        foreach ($tags as $tag) {
            $tags_array[] = [
                'tag_name' => $tag->name,
                'workspace_uid' => $tag->workspace,
                'tag_id' => $tag->id
            ];
        }
        echo json_encode([
            'status' => 'success',
            'tags' => $tags_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun tag trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_get_all_tags_bypost()
{
    // Définir la valeur uid d'un post
    $uid = '0VEBPgVgzEPVr4dQYygH9dvj';

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    if ($post->load()) {
    $tags = $post->listTags();

    if (!empty($tags)) {
        header('Content-Type: application/json');
        // Préparer les données des tags pour la réponse JSON
        $tags_array = [];
        foreach ($tags as $tag) {
            $tags_array[] = [
                'tag_name' => $tag->name,
                'workspace_uid' => $tag->workspace,
                'tag_id' => $tag->id
            ];
        }
        echo json_encode([
            'status' => 'success',
            'tags' => $tags_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun tag trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
    }
}

public function test_update_tag()
{
    // Récupérer les valeurs des champs POST
    $name = 'testtag4';
    $workspace = 'un-espace-1';
    $newname = 'testtag5';

    // Validation de la donnée saisie
    if (empty($name) || empty($workspace)) {
        echo json_encode(['status' => 'error', 'message' => 'Le nom du tag et le workspace du tag sont requis.']);
        exit;
    }

    // Récupérer le tag existant
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->name = $name;
    $tag->workspace = $workspace;

    // Vérifier si l'article existe
    if (!$tag->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Tag introuvable.']);
        exit;
    }

    // Définir le nouveau nom du tag
    $tag->name = $newname;

    // Sauvegarde du nom du tag
    $ret = $tag->save();

    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Tag mis à jour avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de la mise à jour du tag.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_delete_tag()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer la valeur du champ POST
    $name = 'testtag5';
    $workspace = 'un-espace-1';

    // Validation de la donnée saisie
    if (empty($name) || empty($workspace)) {
        echo json_encode(['status' => 'error', 'message' => 'Le nom du tag et le workspace du tag sont requis.']);
        exit;
    }

    // Récupérer le tag existant
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->name = $name;
    $tag->workspace = $workspace;

    // Vérifier si le tag existe
    if (!$tag->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Tag introuvable.']);
        exit;
    }

    // Supprimer le tag
    $ret = $tag->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => "Le Tag " . $tag->name . " a été supprimé avec succès."]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "Echec de suppression du Tag " . $tag->name ."."]);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_associate_tag_at_post()
{
    // Récupérer la valeur du champ POST
    $name = 'Survie';
    $workspace_uid = 'un-espace-2';
    $uid = 'Wnc5qDqCJ89kszI6Th7xPH7D';

    // Validation des données saisies
    if (empty($name) || empty($workspace_uid) || empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer le tag existant
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->name = $name;
    $tag->workspace = $workspace_uid;

    if ($tag->load()) {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;

        if ($post->load()) {
            if ($post->addTag($tag)) {
                echo json_encode(['status' => 'success', 'message' => "Le tag " . $tag->name . " a été associé au post " . $post->title . " avec succès."]);
            } else {
                echo json_encode(['status' => 'error', 'message' => "Echec de l\'association du tag " . $tag->name . " avec le post " . $post->title . "."]);
            }
        }

        // Arrêt de l'exécution du script
    exit;
    }
}

public function test_unassociate_tag_from_post()
{
    // Récupérer la valeur du champ POST
    $name = 'Livre';
    $workspace_uid = 'un-espace-2';
    $uid = 'BQasb31PcxMzC4TyroeHkwHZ';

    // Validation des données saisies
    if (empty($name) || empty($workspace_uid) || empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer le tag existant
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->name = $name;
    $tag->workspace = $workspace_uid;

    if ($tag->load()) {
        $post = new LibMelanie\Api\Defaut\Posts\Post();
        $post->uid = $uid;

        if ($post->load()) {
            if ($post->removeTag($tag)) {
                echo json_encode(['status' => 'success', 'message' => 'Tag dissocié du post avec succès.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Echec de la suppression du tag lié au post.']);
            }
        }

        // Arrêt de l'exécution du script
    exit;
    }
}

public function test_create_comment()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    $content = 'Commentaire test à supprimer';

    // Validation des données saisies
    if (empty($user->uid) || empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouveau commentaire
    $comment = new LibMelanie\Api\Defaut\Posts\Comment();
    $comment->comment_content = $content;
    $comment->comment_uid = $this->generateRandomString(24);
    $comment->created = date('Y-m-d H:i:s');
    $comment->updated = date('Y-m-d H:i:s');
    $comment->user_uid = $user->uid;
    $comment->post_id = '11';

    // Sauvegarde du commentaire
    $ret = $comment->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Commentaire créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création du commentaire.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_reply_comment()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    $content = 'Je suis comme vous, j\'adore ce roman.';

    // Validation des données saisies
    if (empty($user->uid) || empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouveau commentaire
    $reply = new LibMelanie\Api\Defaut\Posts\Comment();
    $reply->comment_content = $content;
    $reply->comment_uid = $this->generateRandomString(24);
    $reply->created = date('Y-m-d H:i:s');
    $reply->updated = date('Y-m-d H:i:s');
    $reply->user_uid = $user->uid;
    $reply->post_id = '6';
    $reply->parent_comment_id = '10';

    // Sauvegarde du commentaire
    $ret = $reply->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Réponse créée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de la réponse.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_update_comment()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer les valeurs des champs POST
    $uid ='P4Akl07laJ7he6ewafyKEqPD';
    $content = 'Ce roman est génial, je ne me lasse pas de le lire et de le relire ! Modification OK';

    // Récupérer le commentaire existant
    $comment = new LibMelanie\Api\Defaut\Posts\Comment();
    $comment->uid = $uid;
    if (!$comment->load()) {

        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    // Vérifier si le commentaire existe
    if (!$comment) {
        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    // Définir les nouvelles données
    $comment->comment_content = $content;
    $comment->updated = date('Y-m-d H:i:s');

    // Sauvegarde du commentaire
    $ret = $comment->save();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Commentaire mis à jour avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de mise à jour du commentaire.']);
    }

    // Arrêt de l'exécution du script
    exit;

}

public function test_delete_comment()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer la valeur du champ POST
    $uid = 'OkusCpTW36IOcDlzudEQosCR';

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'uid du commentaire est requis.']);
        exit;
    }

    // Récupérer le tag existant
    $comment = new LibMelanie\Api\Defaut\Posts\Comment();
    $comment->uid = $uid;

    // Vérifier si le commentaire existe
    if (!$comment->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    // Supprimer le commentaire
    $ret = $comment->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Le commentaire a été supprimé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression du commentaire.']);
    }

    // Arrêt de l'exécution du script
    exit; 
}

public function test_like_comment()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer les valeurs
    $creator = 'DamienTest4';
    $type = 'Like à supprimer';
    $comment_id = '10';

    // Validation des données saisies
    if (empty($creator) || empty($type) || empty($comment_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Vérifier si le créateur du like est le même que le créateur du commentaire
    if ($creator === $user->uid) {
        echo json_encode(['status' => 'error', 'message' => 'Vous ne pouvez pas liker votre propre commentaire.']);
        exit;
    }

    // Création d'un Like
    $like = new LibMelanie\Api\Defaut\Posts\Comments\Like();
    $like->comment = $comment_id;
    $like->creator = $creator;
    $like->type = $type;

    // Sauvegarde du Like
    $ret = $like->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Like créé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création du Like.']);
    }

    // Arrêt de l'exécution du script
    exit;

}

public function test_get_all_comments_bypost()
{
    // Définir la valeur uid d'un post
    $uid = 'ndWtChyQ4IwabbWjWwlM7Qo9';

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    if ($post->load()) {
    $comments = $post->listComments();

    if (!empty($comments)) {
        header('Content-Type: application/json');
        // Préparer les données des réactions pour la réponse JSON
        $comments_array = [];
        foreach ($comments as $comment) {
            $comments_array[] = [
                'content' => $comment->content,
                'uid' => $comment->uid,
                'date de création' => $comment->created,
            ];
        }
        echo json_encode([
            'status' => 'success',
            'reactions' => $comments_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucun commentaire trouvé.']);
    }

    // Arrêt de l'exécution du script
    exit;
    }
}

public function test_count_comments()
{
    // Récupérer la valeur du champ POST
    $uid = 'ndWtChyQ4IwabbWjWwlM7Qo9';

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'identifiant de l\'article est requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Obtenir le nombre de commentaires
    $commentCount = $post->countComments();

    // Vérifier si la méthode retourne un résultat valide
    if ($commentCount !== false) {
        echo json_encode(['status' => 'success', 'message' => "Nombre de commentaires : $commentCount"]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Impossible de récupérer le nombre de commentaires.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_delete_like()
{
    // Récupérer les valeurs
    $creator = 'DamienTest';
    $type = 'Like à supprimer 3';
    $comment_id = '10';
    
    // Validation des données saisies
    if (empty($creator) || empty($type) || empty($comment_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer le like existant
    $like = new LibMelanie\Api\Defaut\Posts\Comments\Like();
    $like->comment = $comment_id;
    $like->creator = $creator;
    $like->type = $type;

    // Supprimer le Like
    $ret = $like->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'Le commentaire a été supprimé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression du commentaire.']);
    }

    // Arrêt de l'exécution du script
    exit; 
}

public function test_create_reaction()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    $post_id = '16';
    $creator = 'DamienTest 6';
    $type = 'Happy';

    // Validation des données saisies
    if (empty($post_id) || empty($creator) || empty($type)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouveau commentaire
    $reaction = new LibMelanie\Api\Defaut\Posts\Reaction();
    $reaction->post = $post_id;
    $reaction->creator = $creator;
    $reaction->type = $type;

    // Sauvegarde du commentaire
    $ret = $reaction->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Réaction créée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de la réaction.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_delete_reaction()
{
    // Récupérer les valeurs
    $creator = 'DamienTest 3';
    $type = 'Surprised';
    $post_id = '11';
    
    // Validation des données saisies
    if (empty($creator) || empty($type) || empty($post_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer la réaction existante
    $reaction = new LibMelanie\Api\Defaut\Posts\Reaction();
    $reaction->post = $post_id;
    $reaction->creator = $creator;
    $reaction->type = $type;

    // Supprimer la réaction
    $ret = $reaction->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'La réaction a été supprimée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression de la réaction.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_get_all_reactions_bypost()
{
    // Définir la valeur uid d'un post
    $uid = 'ntihLzawLev7MF82lZZKC93N';

    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    if ($post->load()) {
    $reactions = $post->listReactions();

    if (!empty($reactions)) {
        header('Content-Type: application/json');
        // Préparer les données des réactions pour la réponse JSON
        $reactions_array = [];
        foreach ($reactions as $reaction) {
            $reactions_array[] = [
                'reaction_type' => $reaction->type,
                'reaction_id' => $reaction->id
            ];
        }
        echo json_encode([
            'status' => 'success',
            'reactions' => $reactions_array
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Aucune réaction trouvée.']);
    }

    // Arrêt de l'exécution du script
    exit;
    }
}

public function test_count_reactions()
{
    // Récupérer la valeur du champ POST
    $uid = 'hiXJayua2jFhoAoQIeVUC4NN';

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'identifiant de l\'article est requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Obtenir le nombre de commentaires
    $reactionCount = $post->countReactions();

    // Vérifier si la méthode retourne un résultat valide
    if ($reactionCount !== false) {
        echo json_encode(['status' => 'success', 'message' => "Nombre de réactions : $reactionCount"]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Impossible de récupérer le nombre de réactions.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_create_image()
{
    $post_id ='14';
    $data ='https://images-eu.ssl-images-amazon.com/images/I/81o3TrIUwXL._AC_UL600_SR600,600_.jpg';

    // Validation des données saisies
    if (empty($post_id) || empty($data)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer une nouvelle image
    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $this-> generateRandomString(24);
    $image->post = $post_id;
    $image->data = $data;

    // Sauvegarde de l'image
    $ret = $image->save();
    if (!is_null($ret)) {

        header('Content-Type: application/json');

        echo json_encode(['status' => 'success', 'message' => 'Image créée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de création de l\'image.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_delete_image()
{
    // Récuperer l'Uid de l'image
    $uid ='QSmzqMVy2cfQZD3pNLhB5O9c';

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'UID est requis.']);
        exit;
    }

    // Récupérer l'image existante
    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $uid;

    // Supprimer l'image
    $ret = $image->delete();
    if (!is_null($ret)) {
        echo json_encode(['status' => 'success', 'message' => 'L\'image a été supprimée avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression de l\'image.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_get_image()
{
    $uid ='H00NX329lkJ9lyS7Si20Q7Ig';

    // Validation des données
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'Uid de l\'image et requis.']);
        exit;
    }

    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $uid;

    $ret = $image->load();
    if (!is_null($ret)) {

        echo json_encode([
            'status' => 'success',
            'image' => $image->data,
        ]);
    } else {
        header('Content-Type : application/json');
        echo json_encode(['status' => 'error', 'message' => 'Echec de chargement de l\'image.']);
    }

    // Arrêt de l'exécution du script
    exit;
}



/**
 * Gestion de la frame
 * @param array $attrib
 * @return string
 */
function tchap_frame($attrib)
{
    if (!$attrib['id'])
        $attrib['id'] = 'rcmtchapframe';

    $rcmail = rcmail::get_instance();

    $attrib['name'] = $attrib['id'];

    $rcmail->output->set_env('contentframe', $attrib['name']);
    $rcmail->output->set_env('blankpage', $attrib['src'] ?
    $rcmail->output->abs_url($attrib['src']) : 'program/resources/blank.gif');
    $rcmail->output->set_env('display_tchap_sidebar', $rcmail->config->get('display_tchap_sidebar', null));

    return $rcmail->output->frame($attrib);
}
/**
 * Bloquer les refresh
 * @param array $args
 */
function refresh($args) {
    return array('abort' => true);
}
function sidebar()
{
    $data = $this->get_input_post('_showsidebar');
    $this->rc()->user->save_prefs(['display_tchap_sidebar' => $data]);
}

}