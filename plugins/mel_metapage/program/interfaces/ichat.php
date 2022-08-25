<?php 
 /**
  * Actions necéssaires au BNUM pour fonctionner correctement avec un plugin de chat.
  */
interface iChat
{
    /**
     * Action par défaut (&_action=index)
     *
     * @param array $args
     * @return void
     */
    function action($args = []);
    /**
     * Connecte le Bnum à l'application de chat
     *
     * @return void
     */
    function login($args = []);
    /**
     * Déconnecte le Bnum à l'application de chat
     *
     * @return void
     */
    function logout();
    /**
     * Créer un canal public ou privé
     *
     * @param string $room_name Nom du canal
     * @param [type] $users Utilisateurs du canal
     * @param bool $is_public Si le canal est public ou privé
     * @return array
     */
    function create_channel($room_name, $users, $is_public);
    /**
     * Ajoute des utilisateurs à un canal
     *
     * @param [type] $users Utilisateurs qui seront ajoutés
     * @param string $channel_id Id du canal
     * @param bool $private Canal privé ou non
     * @param array ...$miscs Données supplémentaires
     * @return array
     */
    function add_users($users, $channel_id, $private, ...$miscs);
    /**
     * Récupère les infos d'un utilisateur
     *
     * @param [type] $user
     * @return array
     */
    function get_user_info($user);
    /**
     * Récupère le nombre de messages non-lu
     *
     * @param [type] $channel
     * @return array
     */
    function get_channel_unread_count($channel);
    /**
     * Vire un utilisateur d'un canal
     *
     * @param string $channel_id Id du canal
     * @param [type] $user Utilisateur à supprimer
     * @param bool $private Si le canal est privé ou non
     * @param array ...$miscs Données supplémentaires
     * @return array
     */
    function kick_user($channel_id, $user, $private, ...$miscs);

    function post_message($room_id, $text);
    function advanced_post_message($room_id, $text, $alias, $avatar = null);

    function update_owner($user, $channel_id, $private, $remove = false);

    function delete_channel($channel_id, $private);

    function update_channel_type($channel_id, $private);

    function get_joined();

    function get_all_moderator_joined($user = null);

    function check_if_room_exist($room_id);

    function check_if_room_exist_by_name($room_name);

    function room_info($room_name);

    /**
     * Vérifie si il y a un plugin de chat.
     *
     * @param boolean $arg
     * @return boolean
     */
    function have_chat_plugin($arg = false);
}

/**
 * Interface de la classe Chat.
 * Demande d'implémenter les fonctions lié aux actions.
 */
interface iChatBnum extends iChat
{
    /**
     * Connecte le Bnum à l'application de chat
     *
     * @param array $args
     * @return void
     */
    function get_log($args = []);
    /**
     * Récupère le nombre de messages non-lu
     *
     * @param array $args
     * @return void
     */
    function get_channel_unread_count_action($args = []);
    /**
     * Récupère les infos d'un utilisateur
     *
     * @param array $args
     * @return void
     */
    function get_user_info_action($args = []);
    /**
     * Ajoute des utilisateurs à un canal
     *
     * @param array $args
     * @return void
     */
    function add_users_action($args = []);
    /**
     * Créer un canal public ou privé
     *
     * @param array $args
     * @return void
     */
    function create_chanel_action($args = []);
}