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
        //Lister les comments d'un Post
        $this->register_action('get_all_comments_bypost', [$this, 'get_all_comments_bypost']);
        // Compter le nombre de commentaires pour un Post
        $this->register_action('count_comment', array($this, 'count_comment'));
        //Supprimer un Like
        $this->register_action('delete_like', array($this, 'delete_like'));
        // Compter le nombre de commentaires pour un Post
        $this->register_action('count_likes', array($this, 'count_likes'));
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

/**
 * Affiche la page d'accueil du forum.
 *
 * Cette fonction enregistre un template pour afficher les publications du forum
 * et envoie le modèle 'mel_forum.forum' à la page qui affiche les articles.
 *
 * @return void
 */
public function index(){
    $this->rc()->output->add_handlers(array('forum_post' => array($this, 'show_posts')));
    
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
public function post(){
    //Récupérér uid avec GET
    $this->load_script_module('manager');
    $uid = 'VOszRaUI1dQRuQGs2NzKiKZ0';
    $this->current_post = $this->get_post($uid);

    $this->rc()->output->add_handlers(array('show_post_title' => array($this, 'show_post_title')));
    $this->rc()->output->add_handlers(array('show_post_tags' => array($this, 'show_post_tags')));
    $this->rc()->output->add_handlers(array('show_post_creator' => array($this, 'show_post_creator')));
    $this->rc()->output->add_handlers(array('show_post_date' => array($this, 'show_post_date')));
    $this->rc()->output->add_handlers(array('show_post_content' => array($this, 'show_post_content')));
    
    $this->rc()->output->set_env('post_uid', $this->current_post->uid);
    $this->rc()->output->set_env('post_id', $this->current_post->id);

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
public function show_post_title(){
      
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
public function show_post_tags() {
    // Récupérer les tags associés au post actuel
    $tags = $this->get_all_tags_bypost($this->current_post->uid);

    // Création des éléments HTML pour les tags
    $tags_html = '';
    foreach ($tags as $tag) {
        $tags_html .= '<span class="tag">#' . htmlspecialchars($tag->tag_name) . '</span>';
    }

    $tags_html .= $html_post_copy;

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
public function show_post_creator(){

    return $this->get_user($this->current_post->user_uid)->name;

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
public function show_post_date(){

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

 public function show_post_content() {
    $content = $this->current_post->content;

    return $content;
}

public function create_or_edit_post() {

    $this->rc()->html_editor();
    $this->load_script_module('manager');
    $this->rc()->output->add_handlers(array('create_or_edit_post' => array($this, 'create_or_edit_post')));
    
    $this->rc()->output->add_handlers(array('show_tag_manager' => array($this, 'show_tag_manager')));
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
 * Extrait les liens des images d'un contenu HTML.
 *
 * Cette fonction analyse le contenu HTML fourni, extrait tous les liens 
 * des balises <img> et les retourne sous forme de tableau.
 *
 * @param string $content Le contenu HTML à analyser.
 * @return array Un tableau contenant les liens des images trouvées dans le contenu HTML.
 */
private function extractImageLinks($content) {
    $imageLinks = [];
    $dom = new DOMDocument();
    
    // Supprimer les erreurs HTML malformées
    libxml_use_internal_errors(true);
    $dom->loadHTML($content);
    libxml_clear_errors();
    
    $images = $dom->getElementsByTagName('img');
    
    foreach ($images as $img) {
        $imageLinks[] = $img->getAttribute('src');
    }
    
    return $imageLinks;
}

/**
 * Crée un résumé à partir du contenu fourni.
 *
 * Cette fonction supprime les balises HTML du contenu, extrait les phrases 
 * en utilisant des délimiteurs de phrase, et retourne les deux premières phrases 
 * sous forme de résumé.
 *
 * @param string $content Le contenu à partir duquel le résumé est créé.
 * @return string Le résumé généré à partir des deux premières phrases du contenu.
 */
private function create_summary_from_content($content)
    {
        // Suppression des balises HTML pour éviter des erreurs d'extraction
        $content = strip_tags($content);
        // Extraction des phrases en utilisant un délimiteur de phrase
        $sentences = preg_split('/(\. |\? |\! )/', $content);
        // Prend les deux premières phrases
        $summary = implode('. ', array_slice($sentences, 0, 2));
        return $summary;
    }

/**
 * Crée une nouvelle image associée à une publication.
 *
 * Cette fonction valide les données saisies, crée une nouvelle image avec les
 * propriétés définies, et la sauvegarde. Elle retourne un booléen indiquant
 * si l'image a été sauvegardée avec succès.
 *
 * @param string $post_id L'identifiant de la publication à laquelle l'image est associée.
 * @param string $data Les données de l'image à enregistrer.
 * @return bool True si l'image a été sauvegardée avec succès, sinon false.
 */
public function save_image($post_id, $data)
{
    // Validation des données saisies
    if (empty($post_id) || empty($data)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        return false;
    }

    // Créer une nouvelle image
    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $this->generateRandomString(24);
    $image->post = $post_id;
    $image->data = $data;

    // Sauvegarde de l'image
    $ret = $image->save();
    return !is_null($ret);
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

// Fonctions qui sont nécessaires à la création d'un article.

/**
 * Crée un nouvel article dans l'espace de travail.
 *
 * Cette fonction récupère les valeurs des champs POST, valide les données saisies,
 * crée une nouvelle publication avec les propriétés définies, et sauvegarde l'article.
 * Elle extrait également les liens d'image du contenu et les enregistre.
 * La fonction retourne une réponse JSON indiquant le statut de la création de l'article.
 *
 * @return void
 */
public function add_post()
{
    //récupérer le Workspace
    $workspace = driver_mel::gi()->workspace();

    // récupérer les valeurs des champs POST
    $title = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST);
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);
    // création du summary à l'aide d'une fonction qui récupère les 2 premières phrases du content
    $summary = $this->create_summary_from_content($content);
    $settings = rcube_utils::get_input_value('_settings', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($title) || empty($content) || empty($description) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    //Créer un nouvel Article
    $post = new LibMelanie\Api\Defaut\Posts\Post();

    //Définition des propriétés de l'article
    $post->title = $title;
    $post->summary = $summary;
    $post->content = $content;
    $post->uid = $this-> generateRandomString(24);
    $post->created = date('Y-m-d H:i:s');
    $post->modified = date('Y-m-d H:i:s');
    $post->creator = driver_mel::gi()->getUser()->uid;
    $post->settings = $settings;
    $post->workspace = $workspace;

    // Sauvegarde de l'article
    $post_id = $post->save();
    if ($post_id) {
        $post->load();
        // Extraire les liens d'image et les enregistrer
        $imageLinks = $this->extractImageLinks($content);
        $imageSaved = true;
        foreach ($imageLinks as $link) {
            if (!$this->save_image($post->id, $link)) {
                $imageSaved = false;
                break; // On arrête si une image échoue à être enregistrée
            }
        }

        // Réponse JSON en fonction de la sauvegarde des images
        if ($imageSaved) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Article créé avec succès.']);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Article créé, mais échec de l\'enregistrement de certaines images.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Échec de création de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Met à jour un article existant avec de nouvelles données.
 *
 * Cette fonction récupère les valeurs des champs POST, charge la publication existante,
 * génère un résumé à partir du contenu, et met à jour les propriétés de la publication.
 * Elle supprime les images existantes liées à la publication, enregistre les nouvelles images,
 * et sauvegarde les modifications. La fonction retourne une réponse JSON indiquant 
 * le statut de la mise à jour de l'article.
 *
 * @return void
 */
public function update_post()
{
    // Récupérer les valeurs
    $uid = '';
    $this->current_post = $this->get_post($uid);
    $title = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST);
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);
    $summary = $this->create_summary_from_content($content);
    // TODO Paramétrage du bouton settings
    $settings = rcube_utils::get_input_value('_settings', rcube_utils::INPUT_POST);

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Récupérer les images existantes liées au post
    $images = $post->listImages();
    foreach ($images as $image) {
        if (!$image->delete()) {
            echo json_encode(['status' => 'error', 'message' => 'Echec de suppression de l\'image existante.']);
            exit;
        }
    }

    // Préparer les nouvelles données
    $new_data = [
        'title' => $title,
        'content' => $content,
        'summary' => $summary,
        'settings' => $settings
    ];
    
    // Enregistrer les modifications dans l'historique
    $this->save_post_history($post, $post->user_uid, $new_data);

    // Définir les nouvelles propriétés de l'article
    $post->post_title = $title;
    $post->post_content = $content;
    $post->post_summary = $summary;
    $post->post_settings = $settings;
    $post->updated = date('Y-m-d H:i:s');
    $post->user_uid = driver_mel::gi()->getUser()->uid;

    // Sauvegarde de l'article
    $post_id = $post->save();
    if (!$post_id) {
        $post->load();
        // Extraire les liens d'image et les enregistrer
        $imageLinks = $this->extractImageLinks($content);
        $imageSaved = true;
        $errors = [];

        foreach ($imageLinks as $link) {
            if (!$this->save_image($post->id, $link)) {
                $imageSaved = false;
                $errors[] = "Echec de l'enregistrement de l'image: $link";
            }
        }

        // Réponse JSON en fonction de la sauvegarde des images
        if ($imageSaved) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Article mis à jour avec succès.']);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Article mis à jour, mais échec de l\'enregistrement de certaines images.', 'errors' => $errors]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Échec de mise à jour de l\'article.']);
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
    // $post->workspace = $workspace_uid;
    $post->workspace = "un-espace-2";

    // Appel de la méthode listPosts
    $posts = $post->listPosts();

    return $posts;

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
    $tag->name = $name;
    $tag->workspace = $workspace_uid;

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
public function get_all_tags_bypost($uid)
{
    // Récupérer l'article
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    if ($post->load()) {
    $tags = $post->listTags();

    return $tags;

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

    // Récupérer le contenu du commentaire et le post ID
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);
    $post = rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST);

    // Récupérer l'ID du commentaire parent s'il s'agit d'une réponse
    $parent = rcube_utils::get_input_value('_parent', rcube_utils::INPUT_POST, true);

    // Validation des données saisies
    if (empty($content)) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Le champ commentaire est requis.']);
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
            'message' => 'Commentaire créé avec succès.',
            'comment' => $commentData
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Echec de création du commentaire.']);
    }

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
    $post = rcube_utils::get_input_value('_post_id', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($user->uid) || empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouveau commentaire
    $reply = new LibMelanie\Api\Defaut\Posts\Comment();
    $reply->content = $content;
    $reply->uid = $this->generateRandomString(24);
    $reply->created = date('Y-m-d H:i:s');
    $reply->modified = date('Y-m-d H:i:s');
    $reply->creator = $user->uid;
    $reply->post = $post;
    $reply->parent = $comment_parent->id;

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

    // Vérifier si l'utilisateur est bien l'auteur du commentaire
    if ($comment->user_uid !== $user->uid) { // Vérification si l'utilisateur est l'auteur
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Vous n\'êtes pas autorisé à modifier ce commentaire.']);
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
            'message' => 'Commentaire mis à jour avec succès.',
            'modify' => $modifyData
        ]);
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

    // Récupérer l'ID du commentaire parent s'il s'agit d'une réponse
    $parent = rcube_utils::get_input_value('_parent', rcube_utils::INPUT_POST, true);

    // Validation de la donnée saisie
    if (empty($uid)) {
        echo json_encode(['status' => 'error', 'message' => 'L\'uid du commentaire est requis.']);
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
        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    // Vérifier si l'utilisateur est bien l'auteur du commentaire
    if ($comment->user_uid !== $user->uid) { // Vérification si l'utilisateur est l'auteur
        echo json_encode(['status' => 'error', 'message' => 'Vous n\'êtes pas autorisé à supprimer ce commentaire.']);
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
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Charger le commentaire pour récupérer son id et son créateur
    $comment = new LibMelanie\Api\Defaut\Posts\Comment();
    $comment->uid = $comment_uid;

    if (!$comment->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Commentaire introuvable.']);
        exit;
    }

    $creator = $comment->creator;

    // Vérifier si le créateur du like/dislike est le même que le créateur du commentaire
    if ($creator === $user_uid) {
        echo json_encode(['status' => 'error', 'message' => 'Vous ne pouvez pas réagir à votre propre commentaire.']);
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
            $message = 'Like annulé avec succès.';
        } else {
            // Sinon, l'utilisateur change de réaction (like -> dislike)
            $existing_reaction->delete();
            $message = 'Like annulé, dislike enregistré avec succès.';

            $reaction = new LibMelanie\Api\Defaut\Posts\Comments\Like();
            $reaction->comment = $comment_id;
            $reaction->creator = $user_uid;
            $reaction->type = $type;

            // Sauvegarde de la nouvelle réaction
            $ret = $reaction->save();
            if (is_null($ret)) {
                echo json_encode(['status' => 'error', 'message' => 'Échec de l\'enregistrement du ' . $type . '.']);
                exit;
            }
            $message = ucfirst($type) . ' enregistré avec succès.';
        }
    } else {
        // Si aucun like n'existe, tester pour le dislike
        $existing_reaction->type = 'dislike';
        if ($existing_reaction->load()) {
            // Si le type est le même, l'utilisateur essaie d'annuler sa réaction
            if ($type === 'dislike') {
                $existing_reaction->delete();
                $message = 'Dislike annulé avec succès.';
            } else {
                // Sinon, l'utilisateur change de réaction (dislike -> like)
                $existing_reaction->delete();
                $message = 'Dislike annulé, like enregistré avec succès.';

                $reaction = new LibMelanie\Api\Defaut\Posts\Comments\Like();
                $reaction->comment = $comment_id;
                $reaction->creator = $user_uid;
                $reaction->type = $type;

                // Sauvegarde de la nouvelle réaction
                $ret = $reaction->save();
                if (is_null($ret)) {
                    echo json_encode(['status' => 'error', 'message' => 'Échec de l\'enregistrement du ' . $type . '.']);
                    exit;
                }
                $message = ucfirst($type) . ' enregistré avec succès.';
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
                echo json_encode(['status' => 'error', 'message' => 'Échec de l\'enregistrement du ' . $type . '.']);
                exit;
            }
            $message = ucfirst($type) . ' enregistré avec succès.';
        }
    }

    // Retourner la réponse JSON avec le statut et le message approprié
    header('Content-Type: application/json');
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

/**
 * Compte le nombre de commentaires pour un article donné.
 *
 * Cette fonction récupère l'identifiant de l'article
 * charge l'article correspondant, et obtient le nombre
 * de commentaires pour cet article. Le résultat est retourné.
 *
 * @return void
 *
 * @throws Exception Si l'identifiant de l'article n'est pas fourni ou si l'article n'existe pas.
 */
public function count_comments($id)
{
    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->id = $id;

    // Obtenir le nombre de commentaires
    $commentCount = $post->countComments();

    return $commentCount;

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
 * Compte le nombre de likes pour un article donné.
 *
 * Cette fonction récupère l'uid de l'article,
 * charge l'article correspondant, et obtient le nombre
 * de likes pour cet article. Le résultat est retourné.
 *
 * @return void
 *
 * @throws Exception Si l'identifiant de l'article n'est pas fourni ou si l'article n'existe pas.
 */
public function count_Likes($uid)
{
    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;

    // Vérifier si l'article existe
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Obtenir le nombre de commentaires
    $likeCount = $post->countLikes();

    return $likeCount;

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
                'reaction_post_id' => $reaction->post,
                'reaction_creator' => $reaction->creator
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
 * Cette fonction récupère l'uid de l'article,
 * charge l'article correspondant, et obtient le nombre
 * de réactions pour cet article. Le résultat est retourné.
 *
 * @return void
 *
 * @throws Exception Si l'identifiant de l'article n'est pas fourni ou si l'article n'existe pas.
 */
public function count_reactions($uid)
{
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

    return $reactionCount;

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
 * Récupère l'image associée à une publication spécifique.
 *
 * Cette fonction simule un appel à une API interne ou utilise une autre méthode 
 * pour obtenir l'image associée à l'identifiant de la publication fourni. 
 * Si une image est trouvée, elle retourne les données de l'image, sinon elle retourne null.
 *
 * @param string $post_id L'identifiant de la publication pour laquelle récupérer l'image.
 * @return string|null Les données de l'image si elle est trouvée, sinon null.
 */
public function get_image($post_id) {
    // Appeler la fonction get_image pour récupérer l'image
    // Simuler un appel à une API interne ou une autre méthode pour obtenir l'image
    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->post_id = $post_id; // Associer l'image au post par son ID

    $ret = $image->load();
    if (!is_null($ret)) {
        return $image->image_data; // Retourner le lien de l'image
    } else {
        return null;
    }
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
public function get_images($post_id) {
    // Instancier un objet Post pour utiliser la méthode listImages()
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->post_id = $post_id; // Associer le post_id à l'objet Post

    // Récupérer toutes les images associées à ce post
    $images = $post->listImages(); // Utiliser listImages() pour récupérer la liste des images

    // Vérifier si des images ont été trouvées
    if (!empty($images)) {
        $image_data_list = [];
        foreach ($images as $image) {
            $image_data_list[] = $image->image_data; // Ajouter les données de chaque image à la liste
        }
        return $image_data_list; // Retourner un tableau contenant les données de toutes les images
    } else {
        return []; // Retourner un tableau vide si aucune image n'est trouvée
    }
}

/**
 * Affiche une liste de publications avec leurs détails formatés en HTML.
 *
 * Cette fonction récupère toutes les publications d'un espace de travail, 
 * formate chaque publication avec ses détails (créateur, date, titre, résumé, image, tags, 
 * et nombre de réactions et commentaires) et génère le HTML correspondant.
 *
 * @param array $posts Liste des publications à afficher.
 * @return string Le HTML formaté contenant toutes les publications.
 */
public function show_posts($posts) {
    $html = "";
    $html_post = $this->rc()->output->parse("mel_forum.model-post", false, false);

    // Supposons que la fonction get_all_posts_byworkspace() retourne les posts sans les images
    $posts = $this->get_all_posts_byworkspace();

    // Définir la locale en français pour le formatage de la date
    $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);

    foreach ($posts as $post) {
        $html_post_copy = $html_post;

        // Convertit la date du post en un timestamp Unix
        $timestamp = strtotime($post->created);
        // Formate la date du post
        $formatted_date = $formatter->format($timestamp);

        // Remplacer les placeholders par les valeurs des posts
        $html_post_copy = str_replace("<post-creator/>", htmlspecialchars(driver_mel::gi()->getUser($post->creator)->name), $html_post_copy);
        $html_post_copy = str_replace("<post-date/>", htmlspecialchars($formatted_date), $html_post_copy);
        $html_post_copy = str_replace("<post-title/>", htmlspecialchars($post->title), $html_post_copy);
        $html_post_copy = str_replace("<post-summary/>", htmlspecialchars($post->summary), $html_post_copy);

        // Récupérer la première image associée au post
        $images = $this->get_images($post->post_id);
        
        // Ajouter uniquement la première image au HTML, s'il y en a
        $image_html = '';
        if (!empty($images)) {
            $image_html = '<img src="' . htmlspecialchars($images[0]) . '" alt="Image illustrant l\'article" />';
        }
        $html_post_copy = str_replace("<post-image/>", $image_html, $html_post_copy);

        // Récupérer les tags associés au post
        $tags = $this->get_all_tags_bypost($post->uid);

        // Création des éléments HTML pour les tags
        $tags_html = '';
        foreach ($tags as $tag) {
            $tags_html .= '<span class="tag">#' . htmlspecialchars($tag->tag_name) . '</span>';
        }

        // Ajoute les tags au HTML du post
        $html_post_copy = str_replace("<post-tag/>", $tags_html, $html_post_copy);

        // Récupérer le nombre de réaction
        $reaction_count = $this->count_reactions($post->uid);

        // Ajoute le nombre de réaction au HTML du post
        $html_post_copy = str_replace("<post-count-reactions/>", $reaction_count, $html_post_copy);

        // Récupérer le nombre de likes
        $like_count = $this->count_likes($post->uid);

        // Ajoute le nombre de likes au HTML du post
        $html_post_copy = str_replace("<post-count-thumb-up/>", $like_count, $html_post_copy);

        // Récupérer le nombre de commentaire
        $comment_count = $this->count_comments($post->id);

        //Ajoute le nombre de commentaire au HTML du post
        $html_post_copy = str_replace("<post-count-comments/>", $comment_count, $html_post_copy);
                
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

public function test_update_post()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser()->uid;

    // Récupérer les valeurs des champs POST
    $uid = 'zF5lAVs66fzNhvPw8EhMaj45'; // UID de l'article à mettre à jour
    $title = 'La Mythique Route des Vacances';
    $content = '<p><img style="display: block; margin-left: auto; margin-right: auto;" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSP-Sk2BRt4F5MA9sP3NAlN-BqkchzXkV_kCQ&s" alt="Nationale 7" max-width="500" /></p><br><br>
    <p>La Nationale 7, souvent surnommée "la route des vacances", est une route emblématique de la France, reliant Paris à Menton sur la Côte d\'Azur. Ce trajet de plus de 990 kilomètres traverse une grande partie du pays, offrant un panorama varié des paysages français, des régions viticoles aux montagnes pittoresques.</p><br><br>
    <p><img src="https://cdn-s-www.leprogres.fr/images/CD83B948-0E26-471E-971A-8558623750BE/NW_raw/title-1405193035.jpg" alt="Tracé de la Nationale 7 de Paris à Menton" max-width="500" /></p><br><br>
    <p>Créée en 1959, la Nationale 7 a été, pendant des décennies, la principale artère empruntée par des générations de vacanciers en quête de soleil et de mer Méditerranée. Avant l\'ère des autoroutes, cette route représentait l\'évasion estivale, un symbole de liberté et d\'aventure pour de nombreuses familles françaises. Des voitures surchargées de bagages, des arrêts fréquents dans des auberges et des relais routiers typiques, des pique-niques improvisés au bord de la route : tels étaient les rituels de ceux qui empruntaient cette route légendaire.</p><br><br>
    <p><img src="https://www.lesbiefs.eu/2020/wp-content/uploads/2020/01/embouteillage-1024x523.jpg" alt="Illustration de la circulation sur la Nationale 7" max-width="500" /></p><br><br>
    <p>La Nationale 7 est également ancrée dans la culture populaire française. Elle a inspiré des chansons, des films et des livres, devenant un symbole de la dolce vita à la française. Charles Trenet l\'a immortalisée dans sa célèbre chanson "Nationale 7", évoquant le charme et la convivialité de cette route mythique.</p><br><br>
    <p><img src="https://lavaurinitiatives.fr/wp-content/uploads/2019/02/autobus-fiat500-bouchon-site.jpg" alt="Fiat 500 dans les bouchons" max-width="700" /></p><br><br>
    <p>Au fil des ans, avec la construction des autoroutes, la Nationale 7 a perdu de son rôle central dans les trajets estivaux. Cependant, elle a conservé son charme et continue d\'attirer les amateurs de rétro et de nostalgie, qui apprécient de parcourir cette route historique à un rythme plus tranquille.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMDeCMx4SnwfdJxTTFnbBgeWE1w0CsXkkCssS3TO8JuJoYjz83KC2k33h17hwOquV4Hiw&usqp=CAU" alt="Voiture historique de nos jours" max-width="700" /></p><br><br>
    <p>Aujourd\'hui, parcourir la Nationakjle 7, c\'est faire un voyage dans le temps, redécouvrir les plaisirs simples et authentiques des vacances d\'antan, et se plonger dans l\'histoire et la culture d\'une France en mouvement. Cette route reste une invitation à l\'évasion, un itinéraire empreint de souvenirs et de découvertes, où chaque kilomètre raconte une histoire.</p><br><br>'; // Valeur en dur pour le test
    $summary = $this->create_summary_from_content($content);
    $workspace = 'un-espace-2';
    $settings = 'Modifiable'; // Valeur en dur pour le test

    // Récupérer l'article existant
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $uid;
    if (!$post->load()) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Récupérer les images existantes liées au post
    $images = $post->listImages();
    foreach ($images as $image) {
        if (!$image->delete()) {
            echo json_encode(['status' => 'error', 'message' => 'Echec de suppression de l\'image existante.']);
            exit;
        }
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
    $this->save_post_history($post, $user, $new_data);

    // Définir les nouvelles propriétés de l'article
    $post->title = $title;
    $post->content = $content;
    $post->summary = $summary;
    $post->workspace_uid = $workspace;
    $post->settings = $settings;
    $post->updated = date('Y-m-d H:i:s');
    $post->creator = $user;

    // Sauvegarde de l'article
    // TODO demander a thomas si comportement normal (this->hasChanged ne garde pas la valeur donc ->save() return null)
    $post_id = $post->save();
    if (!$post_id) {
        $post->load();
        // Extraire les liens d'image et les enregistrer
        $imageLinks = $this->test_extractImageLinks($content);
        $imageSaved = true;
        $errors = [];

        foreach ($imageLinks as $link) {
            if (!$this->test_save_image($post->id, $link)) {
                $imageSaved = false;
                $errors[] = "Echec de l'enregistrement de l'image: $link";
            }
        }
        
        // Réponse JSON en fonction de la sauvegarde des images
        if ($imageSaved) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Article mis à jour avec succès.']);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Article mis à jour, mais échec de l\'enregistrement de certaines images.', 'errors' => $errors]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Échec de mise à jour de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_delete_post()
{
    // Récupérer l'utilisateur
    $user = driver_mel::gi()->getUser();

    // Récupérer la valeur du champ POST
    $uid = 'yeCrPF4rA4r61UuQuFc4EX9R';

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

public function test_delete_image()
{
    // Récuperer l'Uid de l'image
    $uid ='23mo20v73S8aEaMNa4GBvEdy';

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

public function test_get_image($post_uid = 'zF5lAVs66fzNhvPw8EhMaj45')
{
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->uid = $post_uid;

    if ($post->load()) {
        $images = $post->listImages();

        if (!empty($images)) {
            header('Content-Type: application/json');
            $images_array = [];
            foreach ($images as $image) {
                $images_array[] = [
                    'image_uid' => $image->uid,
                    'image_data' => $image->data,
                ];
            } echo json_encode([
                'status' => 'success',
                'images' => $images_array
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Aucune image trouvée.']);
        }
    
        exit;
    }
}


private function test_extractImageLinks($content) {
    $imageLinks = [];
    $dom = new DOMDocument();
    
    // Supprimer les erreurs HTML malformées
    libxml_use_internal_errors(true);
    $dom->loadHTML($content);
    libxml_clear_errors();
    
    $images = $dom->getElementsByTagName('img');
    
    foreach ($images as $img) {
        $imageLinks[] = $img->getAttribute('src');
    }
    
    return $imageLinks;
}

public function test_create_post()
{
    $workspace = 'un-espace-2';

    $title = 'Dodo';
    $content = 'Test Dodo';
    $summary = $this->create_summary_from_content($content); // Valeur en dur pour le test
    $settings = 'Modifiable'; // Valeur en dur pour le test

    // Validation des données saisies
    if (empty($title) || empty($content) || empty($summary) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouvel Article
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->title = $title;
    $post->summary = $summary;
    $post->content = $content;
    $post->uid = $this->generateRandomString(24);
    $post->created = date('Y-m-d H:i:s');
    $post->modified = date('Y-m-d H:i:s');
    $post->creator = driver_mel::gi()->getUser()->uid;
    $post->settings = $settings;
    $post->workspace = $workspace;

    // Sauvegarde de l'article
    $post_id = $post->save();
    if ($post_id) {
        $post->load();
        // Extraire les liens d'image et les enregistrer
        $imageLinks = $this->test_extractImageLinks($content);
        $imageSaved = true;
        foreach ($imageLinks as $link) {
            if (!$this->test_save_image($post->id, $link)) {
                $imageSaved = false;
                break; // On arrête si une image échoue à être enregistrée
            }
        }

        // Réponse JSON en fonction de la sauvegarde des images
        if ($imageSaved) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Article créé avec succès.']);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Article créé, mais échec de l\'enregistrement de certaines images.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Échec de création de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

public function test_save_image($post_id, $data)
{
    // Validation des données saisies
    if (empty($post_id) || empty($data)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        return false;
    }

    // Créer une nouvelle image
    $image = new LibMelanie\Api\Defaut\Posts\Image();
    $image->uid = $this->generateRandomString(24);
    $image->post = $post_id;
    $image->data = $data;

    // Sauvegarde de l'image
    $ret = $image->save();
    return !is_null($ret);
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