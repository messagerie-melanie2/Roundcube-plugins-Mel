<?php
/**
 * Connecteurs vers les plugins ou les clients
 */
interface iChatModuleConnectors {
    function create_channel_connector($room, ...$otherArgs);
    function add_user_connector($user, $room, ...$otherArgs);
    function get_user_info_connector($user, ...$otherArgs);
    function get_channel_unread_count_connector($room, ...$otherArgs);
    function get_joined_connector($user, ...$otherArgs);
    function get_status_connector(...$otherArgs);
    function set_status_connector($status, ...$otherArgs);
    function logout_connector(...$otherArgs);

    function post_message_connector($room_id, $text, $alias, $avatar = null, ...$otherArgs);
    function update_owner_connector($user, $channel_id, $private, $remove = false, ...$otherArgs);
    function kick_user_connector($channel_id, $user, $private, ...$otherArgs);
    function delete_channel_connector($channel_id, $private, ...$otherArgs);
    function update_channel_type_connector($channel_id, $private, ...$otherArgs);
    function check_if_room_exist_connector($room_id, ...$otherArgs);
    function check_if_room_exist_by_name_connector($room_name, ...$otherArgs);
    function room_info_connector($room_name, ...$otherArgs);

}

/**
 * Action vers les connecteurs
 */
interface iChatModuleActions {
    function create_channel_action($args = null);
    function add_user_action($args = null);
    function get_user_info_action($args = null);
    function get_channel_unread_count_action($args = null);
    function get_joined_action($args = null);
    function get_status_action($args = null);
    function set_status_action($args = null);
    function logout_action($args = null);
}

/**
 * Fonctions des clients
 */
interface iChatClient extends iChatModuleConnectors, iChatModuleActions {
    function setup_hooks();

    function post_message_action($args = null);
    function update_owner_action($args = null);
    function kick_user_action($args = null);
    function delete_channel_action($args = null);
    function update_channel_type_action($args = null);
    function check_if_room_exist_action($args = null);
    function check_if_room_exist_by_name_action($args = null);
    function room_info_action($args = null);
}

/**
 * Fonctions du module
 */
interface iChatModule extends iChatModuleConnectors, iChatModuleActions {
    function setup_task();
    function setup_actions();
}