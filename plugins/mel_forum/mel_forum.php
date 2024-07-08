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

class mel_forum extends rcube_plugin
{
/**
 *
 * @var string
 */
public $task = '.*';

/**
 * (non-PHPdoc)
 * @see rcube_plugin::init()
 */
function init()
{
    $rcmail = rcmail::get_instance();

    // Chargement de la conf
    $this->load_config();
    // Gestion des différentes langues
    $this->add_texts('localization/', true);

    // Ajout du css
    $this->include_stylesheet($this->local_skin_path().'/mel_forum.css');

    // ajout de la tache
    $this->register_task('forum');
    
    if ($rcmail->task === "forum"){
        $this->register_action('index', [$this, 'action']);
        $this->register_action('test', array($this,'test'));
        $this->register_action('elements', array($this, 'elements'));
        $this->register_action('test_create_tag', array($this, 'test_create_tag'));
        $this->register_action('test_get_all_tags', array($this, 'test_get_all_tags'));

        // Récupérer le User Connecté
        $this->register_action('check_user', array($this, 'check_user'));
        //Ajouter une réaction
        $this->register_action('add_reaction', array($this, 'add_reaction'));
        //modifier une réaction
        $this->register_action('update_reaction', array($this, 'update_reaction'));
        // Supprimer une réaction
        $this->register_action('delete_reaction', array($this, 'delete_reaction'));
        // Créer un article
        $this->register_action('create_post', array($this, 'create_post'));
        //modifier un article
        $this->register_action('update_post', array($this, 'update_post'));
        //supprimer un article
        $this->register_action('delete_post', array($this, 'delete_post'));
        // récupérer un  article
        $this->register_action('show_one_post', array($this, 'show_one_post'));
        // récupérer tous les articles
        $this->register_action('show_all_posts', array($this, 'show_all_posts'));
        // Ajouter un commentaire ou une réponse
        $this->register_action('create_comment', array($this, 'create_comment'));
        // Répondre à un commentaire ou une réponse
        $this->register_action('reply_to_comment', array($this, 'reply_to_comment'));
        // Modifier un commentaire ou une réponse
        $this->register_action('update_comment', array($this, 'update_comment'));
        // Supprimer un commentaire ou une réponse
        $this->register_action('delete_comment', array($this, 'delete_comment'));
        // Liker un commentaire ou une réponse
        $this->register_action('like_comment', array($this, 'like_comment'));
        // Créer un tag
        $this->register_action('create_tag', array($this, 'create_tag'));
        // Modifier un tag
        $this->register_action('update_tag', array($this, 'update_tag'));
        // Supprimer un tag
        $this->register_action('delete_tag', array($this, 'delete_tag'));
        // afficher les articles par tag
        $this->register_action('all_posts_by_tag', array($this, 'all_posts_by_tag'));
        
    }
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
    $workspace = driver_mel::gi()->get_workspace_group();

    // récupérer les valeurs des champs POST
    $title = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST);
    $content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST);
    $summary = rcube_utils::get_input_value('_summary', rcube_utils::INPUT_POST);
    $settings = rcube_utils::get_input_value('_settings', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($uid) ||empty($title) || empty($content) || empty($description) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    //Créer un nouvel Article
    $post = new LibMelanie\Api\Defaut\Posts\Post();

    //Définition des propriétés de l'article
    $post->post_title = $title;
    $post->post_summary = $summary;
    $post->post_content = $content;
    $post->post_uid = generateRandomString(24);
    $post->created = date('Y-m-d H:i:s');
    $post->updated = date('Y-m-d H:i:s');
    $post->user_uid = $user->uid;
    $post->post_settings = $settings;
    $post->workspace_uid = $workspace;

    // Sauvegarde de l'article
    $ret = $post->save();
    if (!is_null($ret)) {
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
    $description = rcube_utils::get_input_value('_description', rcube_utils::INPUT_POST);
    $settings = rcube_utils::get_input_value('_settings', rcube_utils::INPUT_POST);

    // Validation des données saisies
    if (empty($uid) || empty($title) || empty($content) || empty($description) || empty($settings)) {
        echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis.']);
        exit;
    }

    // Récupérer l'article existant
    $post = LibMelanie\Api\Defaut\Posts\Post($uid);

    // Vérifier si l'article existe
    if (!$post) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Préparer les nouvelles données
    $new_data = [
        'title' => $title,
        'content' => $content,
        'description' => $description,
        'settings' => $settings
    ];
    
    // Enregistrer les modifications dans l'historique
    $this->save_post_history($post, $user->uid, $new_data);

    // Définir les nouvelles propriétés de l'article
    $post->title = $title;
    $post->content = $content;
    $post->description = $description;
    $post->settings = $settings;
    $post->updated_at = date('Y-m-d H:i:s');
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

    // Comparer les valeurs et ajouter les modifications à l'historique
    foreach ($new_data as $field => $new_value) {
        $old_value = $post->$field;
        if ($old_value !== $new_value) {
            $history[] = [
                'field' => $field,
                'old_value' => $old_value,
                'new_value' => $new_value,
                'user_id' => $user_uid,
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
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
    $post = LibMelanie\Api\Defaut\Posts\Post($uid);

    // Vérifier si l'article existe
    if (!$post) {
        echo json_encode(['status' => 'error', 'message' => 'Article introuvable.']);
        exit;
    }

    // Supprimer l'article
    $ret = $post->delete();
    if ($ret) {
        echo json_encode(['status' => 'success', 'message' => 'Article supprimé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Echec de suppression de l\'article.']);
    }

    // Arrêt de l'exécution du script
    exit;
}





// TESTS

function test()
{
    $a=2;
    $b=4;
    $c=$a+$b;

    echo($c);
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


public function test_create_tag()
{
    
    //Créer un tag
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();

    //Définition des propriétés du tag
    $tag->name = 'testtag4';
    $tag->workspace = 'un-espace-1';

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


public function test_get_all_tags()
{
    // Charger tous les tags
    $tag = new LibMelanie\Api\Defaut\Posts\Tag();
    $tag->workspace = 'un-espace-1';

    $tags = $tag->getList();

        
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