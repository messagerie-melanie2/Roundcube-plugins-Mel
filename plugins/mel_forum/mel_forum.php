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
    $uid = 'iDaeXxkems6Ize9DH8TrZMDh';
    $this->current_post = $this->get_post($uid);

    $this->rc()->output->add_handlers(array('show_post_title' => array($this, 'show_post_title')));
    $this->rc()->output->add_handlers(array('show_post_tags' => array($this, 'show_post_tags')));
    $this->rc()->output->add_handlers(array('show_post_creator' => array($this, 'show_post_creator')));
    $this->rc()->output->add_handlers(array('show_post_date' => array($this, 'show_post_date')));
    $this->rc()->output->add_handlers(array('show_post_content' => array($this, 'show_post_content')));
    
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

    // $images = $this->current_post->listImages();

    // foreach ($images as $image) {
    //     $img_tag = '<img src="' . htmlspecialchars($image->image_data) . '" alt="Image" />';
    //     $content = str_replace("<image-" . htmlspecialchars($image->uid) . "/>", $img_tag, $content);
    // }

    return $content;
}



// Fonctions qui sont nécessaires à la création d'un article.

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
 * Crée un nouvel article dans l'espace de travail.
 *
 * Cette fonction récupère les valeurs des champs POST, valide les données saisies,
 * crée une nouvelle publication avec les propriétés définies, et sauvegarde l'article.
 * Elle extrait également les liens d'image du contenu et les enregistre.
 * La fonction retourne une réponse JSON indiquant le statut de la création de l'article.
 *
 * @return void
 */
public function create_post()
{
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
    $post->user_uid = driver_mel::gi()->getUser()->uid;
    $post->post_settings = $settings;
    $post->workspace_uid = $workspace;

    // Sauvegarde de l'article
    $post_id = $post->save();
    if ($post_id) {
        $post->load();
        // Extraire les liens d'image et les enregistrer
        $imageLinks = $this->extractImageLinks($content);
        $imageSaved = true;
        foreach ($imageLinks as $link) {
            if (!$this->test_create_image($post->id, $link)) {
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
 * Met à jour une publication existante.
 *
 * Cette fonction récupère les valeurs des champs POST, valide les données saisies,
 * charge la publication existante, enregistre les modifications dans l'historique,
 * met à jour les propriétés de la publication et sauvegarde les modifications.
 * Elle extrait également les liens d'image du contenu et les enregistre.
 * La fonction retourne une réponse JSON indiquant le statut de la mise à jour de l'article.
 *
 * @return void
 */
public function update_post()
{
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
    if ($post_id) {
        $post->load();
        // Extraire les liens d'image et les enregistrer
        $imageLinks = $this->test_extractImageLinks($content);
        $imageSaved = true;
        foreach ($imageLinks as $link) {
            if (!$this->test_create_image($post->id, $link)) {
                $imageSaved = false;
                break; // On arrête si une image échoue à être enregistrée
            }
        }

        // Réponse JSON en fonction de la sauvegarde des images
        if ($imageSaved) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Article mis à jour avec succès.']);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Article mis à jour, mais échec de l\'enregistrement de certaines images.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Échec de mise à jour de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}

/**
 * Enregistre une nouvelle image associée à une publication.
 *
 * Cette fonction valide les données saisies, crée une nouvelle image avec les
 * propriétés définies, et la sauvegarde. Elle retourne un booléen indiquant
 * si l'image a été sauvegardée avec succès.
 *
 * @param string $post_id L'identifiant de la publication à laquelle l'image est associée.
 * @param string $data Les données de l'image à enregistrer.
 * @return bool True si l'image a été sauvegardée avec succès, sinon false.
 */
public function save_new_image($post_id, $data)
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
        // Retourner les informations du post sous forme de tableau associatif
        // return [
        //     'status' => 'success',
        //     'title' => $post->title,
        //     'creator' => driver_mel::gi()->getUser($post->user_id)->name,
        //     'created' => $post->created,
        //     'content' => $post->content
        // ];
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

    // if (!empty($posts)) {
    //     header('Content-Type: application/json');
    //     // Préparer les données des tags pour la réponse JSON
    //     $posts_array = [];
    //     foreach ($posts as $post) {
    //         $posts_array[] = [
    //             'id' => $post->id,
    //             'title' => $post->title,
    //             'summary'=> $post->summary,
    //             'content' => $post->content,
    //             'created' => $post->created,
    //             'author' => driver_mel::gi()->getUser()->name,
    //             'settings' => $post->settings,
    //             'workspace' => $post->workspace
    //         ];
    //     }
    //     echo json_encode([
    //         'status' => 'success',
    //         'tags' => $posts_array
    //     ]);
    // } else {
    //     echo json_encode(['status' => 'error', 'message' => 'Aucun post trouvé.']);
    // }

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
public function get_all_tags_bypost($uid)
{
    // Récupérer l'uid de l'article du champ POST
    // $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);
    // $uid = "hiXJayua2jFhoAoQIeVUC4NN";

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

    // // Vérifier si l'article existe
    // if (!$post->load()) {
    //     echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
    //     exit;
    // }

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
 * Affiche une liste de publications avec leurs détails formatés en HTML.
 *
 * Cette fonction récupère toutes les publications d'un espace de travail, 
 * formate chaque publication avec ses détails (créateur, date, titre, résumé, image, tags, 
 * et nombre de commentaires) et génère le HTML correspondant.
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

        // Récupérer l'image associée au post
        $image_link = $this->get_image($post->post_id);
        
        // Ajouter le lien de l'image
        if (!empty($image_link)) {
            $image_tag = '<img src="' . htmlspecialchars($image_link) . '" alt="Image illustrant l\'article" />';
            $html_post_copy = str_replace("<post-image/>", $image_tag, $html_post_copy);
        } else {
            // Si pas d'image, remplacer par un placeholder ou rien
            $html_post_copy = str_replace("<post-image/>", '', $html_post_copy);
        }

        // Récupérer les tags associés au post
        $tags = $this->get_all_tags_bypost($post->uid);

        // Création des éléments HTML pour les tags
        $tags_html = '';
        foreach ($tags as $tag) {
            $tags_html .= '<span class="tag">#' . htmlspecialchars($tag->tag_name) . '</span>';
        }

        // Ajoute les tags au HTML du post
        $html_post_copy = str_replace("<post-tag/>", $tags_html, $html_post_copy);

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
    $user = driver_mel::gi()->getUser();

    // Récupérer les valeurs des champs POST
    $uid = '0VEBPgVgzEPVr4dQYygH9dvj'; // UID de l'article à mettre à jour
    $title = 'Dragon Ball Z'; // Valeur en dur pour le test
    $content = '<p><img style="display: block; margin-left: auto; margin-right: auto;" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReaE06z2MlFj8ap8pDCcV_96CyaxxYE1hoCwU3YKnycI7MvuwjIMC2fh3Mjcl3c4BUs98&usqp=CAU"alt="Illustration Dragon Ball Z" max-width="500" /></p><br><br>
    <p>Dragon Ball Z (DBZ) est une série d\’animation japonaise adaptée du manga "Dragon Ball" d\’Akira Toriyama. Elle se compose de plusieurs sagas majeures et de nombreux épisodes. Voici un résumé complet de chaque saga principale de Dragon Ball Z :<br><br></p>
    <h2>Saga Saiyan<br><br></h2>
    <p>Raditz arrive sur Terre et révèle à Goku qu\’il est un Saiyan et son frère. Raditz kidnappe Gohan, le fils de Goku. Goku et Piccolo s\’allient pour affronter Raditz. Goku se sacrifie pour permettre à Piccolo de tuer Raditz. Avant de mourir, Raditz informe ses camarades Saiyans, Nappa et Vegeta, de la présence des Dragon Balls sur Terre. Goku est ressuscité grâce aux Dragon Balls et s\’entraîne dans l\’autre monde avec Kaio-sama. Nappa et Vegeta arrivent sur Terre. Les Z Fighters (Piccolo, Krillin, Yamcha, Tien et Chiaotzu) affrontent Nappa, mais plusieurs d\’entre eux sont tués. Goku revient juste à temps pour vaincre Nappa et affronter Vegeta. Après un combat épique, Vegeta est finalement battu mais épargné par Goku.<br><br></p>
    <p><img src="https://m.media-amazon.com/images/I/91of7+DvLDL.jpg"alt="" max-width="700" /></p><br><br>
    <h2>Saga Namek<br><br></h2>
    <p>Les héros se rendent sur la planète Namek pour utiliser ses Dragon Balls afin de ressusciter leurs amis. Sur Namek, ils rencontrent Freezer, un tyran intergalactique également à la recherche des Dragon Balls. Vegeta, devenu ennemi de Freezer, s\’allie momentanément avec les héros. La Ginyu Force, une équipe d\’élite de Freezer, affronte les héros, mais Goku arrive et les vainc. Goku combat Freezer, et après un long et difficile combat, il se transforme en Super Saiyan pour la première fois, battant finalement Freezer. Cependant, la planète Namek est détruite dans le processus. Goku parvient à s\’échapper avant l\’explosion.<br><br></p>
    <p><img src="https://static1.cbrimages.com/wordpress/wp-content/uploads/2016/11/dbz-sagas-namek.jpg"alt="" max-width="700" /></p><br><br>
    <h2>Saga des Cyborgs et de Cell<br><br></h2>
    <p>Après leur retour sur Terre, les héros sont confrontés à de nouveaux ennemis : les cyborgs créés par le Dr. Gero. Trunks, un mystérieux jeune homme venu du futur, avertit les héros de la menace des cyborgs. Les cyborgs #17 et #18 sont libérés et se révèlent extrêmement puissants. La menace principale, cependant, est Cell, un bio-android qui absorbe les cyborgs pour atteindre sa forme parfaite. Goku et les autres s\’entraînent intensivement dans la Salle de l\’Esprit et du Temps. Gohan atteint finalement le niveau de Super Saiyan 2 et, après un combat acharné, parvient à vaincre Cell avec un Kamehameha puissant.<br><br></p>
    <p><img src="https://www.kanpai.fr/sites/default/files/uploads/2010/11/dragon-ball-kai-cyborgs.jpg"alt="" max-width="700" /></p><br><br>
    <h2>Saga Boo<br><br></h2>
    <p>Sept ans après la défaite de Cell, une nouvelle menace apparaît sous la forme de Majin Boo, un être magique puissant et imprévisible. Goku, revenu temporairement à la vie pour participer à un tournoi, s\’implique dans la lutte contre Boo. Vegeta se sacrifie pour tenter de détruire Boo, mais échoue. Goku atteint le niveau de Super Saiyan 3 pour combattre Boo, mais même cette transformation n\’est pas suffisante pour le vaincre. Goten et Trunks fusionnent pour former Gotenks et combattre Boo. Boo absorbe plusieurs des héros, devenant de plus en plus puissant. Finalement, Goku et Vegeta fusionnent grâce aux boucles d\’oreilles Potara pour former Vegito, mais même cette fusion est absorbée par Boo. Après de nombreuses péripéties, Goku parvient à rassembler l\’énergie de tous les habitants de la Terre pour créer une gigantesque bombe spirituelle, détruisant Boo une fois pour toutes.<br><br></p>
    <p><img src="https://i.ytimg.com/vi/dpsgNlVwvos/sddefault.jpg"alt="" max-width="700" /></p><br><br>
    <h2>Conclusion<br><br></h2>
    <p>À la fin de Dragon Ball Z, Goku rencontre Uub, la réincarnation humaine de Boo, et décide de l\’entraîner pour qu\’il devienne le prochain protecteur de la Terre. La série se termine sur une note d\’espoir, avec Goku transmettant son savoir à la nouvelle génération.<br><br></p>'; // Valeur en dur pour le test
    $summary = 'Dragon Ball Z suit Goku et ses amis dans des combats épiques contre des ennemis menaçant la Terre, tout en explorant les origines de Goku et introduisant de nouveaux personnages.'; // Valeur en dur pour le test
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
    $uid = '30VpIZ1SHoErLZQk0rd9zh4e';

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

    $title = 'Les Jeux Olympiques';
    $content = '<p><img style="display: block; margin-left: auto; margin-right: auto;" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMLJc80xN6OEfStcY3D-hsiYtq9zWKRzTRaw&s"alt="Anneaux Olympiques" max-width="500" /></p><br><br>
    <p>Les Jeux Olympiques, souvent simplement appelés les Jeux, sont une célébration mondiale du sport qui remonte à l\’antiquité. Originaires de la Grèce antique, ils ont été réinventés au XIXe siècle par le baron Pierre de Coubertin et sont devenus l\’événement sportif le plus prestigieux au monde. Les Jeux Olympiques modernes, organisés par le Comité International Olympique (CIO), rassemblent des milliers d\’athlètes de presque tous les pays pour concourir dans une grande variété de disciplines sportives. Cet essai de 5000 mots explore l\’histoire des Jeux Olympiques, leur évolution, leur impact culturel et politique, ainsi que les défis auxquels ils sont confrontés.</p><br><br>
    <h2>Les Origines des Jeux Olympiques<br><br></h2>
    <p>Les premiers Jeux Olympiques remontent à 776 avant J.-C. à Olympie, en Grèce. Ils étaient organisés en l\’honneur de Zeus, le roi des dieux dans la mythologie grecque. Ces jeux se déroulaient tous les quatre ans, une tradition qui se perpétue encore aujourd\’hui. Les épreuves originales comprenaient la course à pied, le saut en longueur, le lancer du disque et du javelot, la lutte, et le pentathlon, une combinaison de plusieurs de ces épreuves.
    Les athlètes de l\’Antiquité concouraient nus, et la victoire leur apportait une grande gloire personnelle ainsi que des avantages matériels pour leur cité. Les Jeux étaient aussi un moment de trêve où les conflits entre les cités-États grecques étaient suspendus. Cependant, malgré leur prestige, les Jeux antiques prirent fin en 393 après J.-C. sous l\’empereur romain Théodose Ier, qui interdit les cultes païens.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToZ_D7rPEU20tMXiq1eWks9njoHmHu8fEuMw&s"alt="Allumage antique de la flamme Olympique" max-width="700" /></p><br><br>
    <h2>La Renaissance des Jeux Olympiques<br><br></h2>
    <p>Les Jeux Olympiques modernes doivent leur existence à Pierre de Coubertin, un éducateur français passionné par le sport et l\’éducation physique. Coubertin voyait le sport comme un moyen d\’unir les nations et de promouvoir la paix. En 1894, il fonda le Comité International Olympique (CIO), et deux ans plus tard, les premiers Jeux Olympiques modernes eurent lieu à Athènes, en Grèce.
    Les premiers Jeux modernes, bien que modestes en comparaison avec les standards actuels, marquèrent le début d\’une nouvelle ère pour le sport international. Seulement 14 nations y participèrent, et les épreuves étaient principalement concentrées sur l\’athlétisme, la natation, la gymnastique et quelques autres sports. La flamme olympique, symbole de paix et d\’amitié, fut introduite plus tard, en 1928 à Amsterdam.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9HVDrI-ZsZsNDP2QWcZcD0j4QCyuHpADIHA&s"alt="Portrait de Pierre de Coubertin" max-width="700" /></p><br><br>
    <h2>L\’Évolution des Jeux Olympiques<br><br></h2>
    <p>Depuis leur renaissance, les Jeux Olympiques ont évolué de manière significative. Ils sont devenus de plus en plus inclusifs, intégrant de nouveaux sports et disciplines et permettant la participation d\’un nombre croissant de nations. Les femmes, initialement exclues, ont commencé à concourir en 1900 à Paris et ont progressivement obtenu l\’accès à presque toutes les disciplines.
    Les Jeux d\’été et d\’hiver, autrefois organisés la même année, sont désormais alternés tous les deux ans. Les Jeux d\’hiver, introduits en 1924 à Chamonix, en France, incluent des sports tels que le ski, le patinage artistique et le hockey sur glace.
    Les Jeux Olympiques ont également vu l\’introduction de nombreux symboles et traditions, tels que le serment olympique, la devise olympique "Citius, Altius, Fortius" (plus vite, plus haut, plus fort), et la mascotte olympique, introduite pour la première fois en 1972 à Munich.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjWNi-w4Wi7svzBa2tLfcSfZxKkZ8QA8FI9A&s"alt="Stade Olympique ancien" max-width="700" /></p><br><br>
    <h2>Les Jeux Olympiques et la Politique<br><br></h2>
    <p>Les Jeux Olympiques, malgré leur objectif de promouvoir la paix et l\’unité, ont souvent été le théâtre de tensions politiques. L\’exemple le plus marquant est peut-être les Jeux de Berlin en 1936, utilisés par le régime nazi comme outil de propagande. Cependant, ces jeux sont également célèbres pour les performances exceptionnelles de Jesse Owens, un athlète afro-américain qui remporta quatre médailles d\’or, défiant les idéologies racistes du régime hitlérien.
    La Guerre froide a également marqué les Jeux, avec des boycotts significatifs en 1980 et 1984. Les États-Unis boycottèrent les Jeux de Moscou en 1980 en réponse à l\’invasion soviétique de l\’Afghanistan, et en représailles, l\’Union soviétique et plusieurs de ses alliés boycottèrent les Jeux de Los Angeles en 1984.
    Malgré ces tensions, les Jeux Olympiques ont souvent servi de plateforme pour des gestes symboliques de paix et de réconciliation. Par exemple, les Jeux de Séoul en 1988 ont été marqués par la participation de nombreux pays qui avaient été absents des Jeux précédents en raison des boycotts, symbolisant un rapprochement dans les relations internationales.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHEsz1-HmVfd7aA_GrfFwYAuJpBI2uhUkC2HF5GTy86T2R_YgOHY2wv55EdClpsnstVKo&usqp=CAU"alt="Jeux Olympiques et Politique" max-width="700" /></p><br><br>
    <h2>L\’Impact Culturel des Jeux Olympiques<br><br></h2>
    <p>Les Jeux Olympiques ont un impact culturel immense, transcendant les frontières nationales et unissant des millions de personnes à travers le monde. Ils célèbrent non seulement l\’excellence sportive, mais aussi la diversité culturelle et les valeurs de fair-play, de respect et de solidarité.
    Les cérémonies d\’ouverture et de clôture sont devenues des spectacles culturels de grande envergure, mettant en valeur les traditions et l\’histoire du pays hôte. Les Jeux sont également une vitrine pour l\’architecture moderne et les infrastructures, avec des villes hôtes construisant souvent des stades et des installations de pointe pour accueillir l\’événement.
    Les athlètes olympiques eux-mêmes deviennent des symboles culturels et des modèles pour des millions de jeunes. Leurs histoires de persévérance, de dévouement et de succès inspirent et motivent les gens à travers le monde à poursuivre leurs propres rêves et objectifs.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0JHndQdOexZ8ib8Cm0b-fliv6uUXPBHlhwQ&s"alt="Illustration des Jeux Olympiques" max-width="700" /></p><br><br>
    <h2>Les Défis des Jeux Olympiques<br><br></h2>
    <p>Malgré leur succès, les Jeux Olympiques ne sont pas sans défis. L\’un des principaux problèmes est le coût exorbitant de l\’organisation des Jeux, qui peut placer une pression financière énorme sur les pays hôtes. Par exemple, les Jeux de Sotchi en 2014 sont devenus les Jeux d\’hiver les plus chers de l\’histoire, coûtant environ 50 milliards de dollars.
    Il y a aussi des préoccupations concernant la durabilité et l\’impact environnemental des Jeux. Les constructions massives et les infrastructures nécessaires peuvent avoir des effets négatifs sur l\’environnement local. Cependant, le CIO a pris des mesures pour promouvoir des pratiques durables et encourager les villes hôtes à minimiser leur empreinte écologique.
    Un autre défi majeur est le dopage, qui ternit la réputation des Jeux et soulève des questions sur l\’intégrité des compétitions. Le CIO et les fédérations sportives internationales ont mis en place des mesures strictes de contrôle anti-dopage, mais le problème persiste, nécessitant des efforts continus pour garantir des compétitions équitables.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBpT493uciUvoLcLFiFO1apHCnKMJ3V4lpsg&s"alt="Défis des jeux Olympiques" max-width="700" /></p><br><br>
    <h2>Les Jeux Olympiques et l\’Innovation Technologique<br><br></h2>
    <p>Les Jeux Olympiques ont toujours été à la pointe de l\’innovation technologique. Des avancées dans la diffusion télévisée ont permis à des millions de personnes de suivre les Jeux en direct, peu importe où ils se trouvent dans le monde. Les technologies de pointe en matière de chronométrage et de mesure garantissent des résultats précis et équitables.
    Les Jeux de Tokyo 2020, bien que reportés à 2021 en raison de la pandémie de COVID-19, ont été particulièrement marqués par l\’innovation. Des robots ont été utilisés pour assister les spectateurs et les athlètes, et des technologies de réalité virtuelle et augmentée ont enrichi l\’expérience des téléspectateurs. Les mesures strictes de contrôle sanitaire et les protocoles de sécurité ont également démontré l\’importance de la technologie dans la gestion des événements de grande envergure en période de crise.</p><br><br>
    <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkY5BN3lMmtrJiuiNpiBMbXrwNw8rAdf588A&s"alt="Technologies et Jeux Olympiques" max-width="700" /></p><br><br>
    <h2>Conclusion<br><br></h2>
    <p>Les Jeux Olympiques, avec leur riche histoire et leur impact mondial, restent une célébration unique de l\’excellence sportive et de l\’unité humaine. Ils reflètent à la fois les aspirations les plus nobles de l\’humanité et les défis complexes auxquels nous sommes confrontés. En célébrant la diversité et en encourageant la compétition équitable, les Jeux Olympiques continuent d\’inspirer des millions de personnes à travers le monde, rappelant l\’importance de la paix, de la coopération et de la persévérance.
    Les Jeux de l\’avenir devront relever des défis croissants, notamment en matière de durabilité, de coût et d\’intégrité sportive, mais avec les innovations technologiques et les efforts continus du CIO et des nations participantes, ils continueront de briller comme un phare d\’espoir et d\’inspiration pour les générations futures.</p><br><br>'; // Valeur en dur pour le test
    $summary = 'Les Jeux Olympiques, réinventés au XIXe siècle par Pierre de Coubertin après leurs origines antiques en Grèce, sont le plus prestigieux événement sportif mondial. Depuis les premiers Jeux modernes en 1896 à Athènes, ils ont évolué pour inclure de nouveaux sports et des athlètes féminins, alternant entre été et hiver tous les deux ans. Malgré des influences politiques comme les boycotts de la Guerre froide, les Jeux restent une plateforme de paix et de célébration culturelle. Les défis incluent les coûts élevés, les préoccupations environnementales et le dopage, mais les innovations technologiques continuent d\’améliorer leur gestion et leur diffusion.'; // Valeur en dur pour le test
    $settings = 'Modifiable'; // Valeur en dur pour le test

    // Validation des données saisies
    if (empty($title) || empty($content) || empty($summary) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Créer un nouvel Article
    $post = new LibMelanie\Api\Defaut\Posts\Post();
    $post->post_title = $title;
    $post->post_summary = $summary;
    $post->post_content = $content;
    $post->post_uid = $this->generateRandomString(24);
    $post->created = date('Y-m-d H:i:s');
    $post->updated = date('Y-m-d H:i:s');
    $post->user_uid = driver_mel::gi()->getUser()->uid;
    $post->post_settings = $settings;
    $post->workspace_uid = $workspace;

    // Sauvegarde de l'article
    $post_id = $post->save();
    if ($post_id) {
        $post->load();
        // Extraire les liens d'image et les enregistrer
        $imageLinks = $this->test_extractImageLinks($content);
        $imageSaved = true;
        foreach ($imageLinks as $link) {
            if (!$this->test_create_image($post->id, $link)) {
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

public function test_create_image($post_id, $data)
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