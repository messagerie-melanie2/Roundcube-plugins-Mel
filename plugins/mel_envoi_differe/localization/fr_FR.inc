<?php

/**
 * Plugin Mél Envoi différé
 *
 * Plugin d'envoi de mail différé depuis Roundcube
 * Les messages sont stocké sur un serveur jusqu'au moment de l'envoi
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

$labels = array();
$labels['null'] = ' ';
$labels['buttontext'] = 'Différer';
$labels['buttontitle'] = 'Faire une remise différée de votre message';
$labels['title'] = 'Remise différée de votre message';
$labels['title_futur'] = 'Date de remise différée non valide';
$labels['date'] = 'Le : ';
$labels['time'] = 'À : ';
$labels['description_enable'] = "La remise différée est activée pour le %%date%%<br><br>Votre message sera remis à la date et à l'horaire défini. Vous pouvez toujours modifier l'horaire, la date ou désactiver la remise différée. La remise différée ne peut pas dépasser %%max_days%% jours.";
$labels['description_disable'] = "La remise différée est désactivée<br><br>Choisissez une date et un horaire ci-dessous, cliquez sur Activer et votre message sera remis au moment défini après son envoi. La remise différée ne peut pas dépasser %%max_days%% jours.";
$labels['description_warning'] = "Attention: la remise différée ne permet pas de modifier ou d'annuler l'envoi du message.";
$labels['description_info'] = 'Cette remise différée est une étape préalable avant une véritable fonction d\'envoi différé';
$labels['description_futur'] = 'La date choisie pour la remise différée à été dépassée';
$labels['enable'] = 'Activer';
$labels['modify'] = 'Modifier';
$labels['send_normally'] = 'Envoyer normalement';
$labels['disable'] = 'Désactiver';
$labels['disable once'] = 'Désactiver pour cet envoi';
$labels['cancel'] = 'Annuler';
$labels['error_message'] = 'La date choisie n\'est pas valide';
$labels['empty_message'] = 'Merci de remplir les champs ci-dessus';
$labels['max_days_error'] = 'Erreur : le message n\'a pas été envoyé, la remise différée dépasse la limite de %%max_days%% jours.';
$labels['saving_remise'] = 'Conserver la remise différée pour les envois suivants';
$labels['saving_remise_description'] = 'En cochant cette case le paramètrage de la remise différée sera conservée pour les prochains envois, jusqu\'a ce qu\'elle soit désactivée ou que la date choisie soit dépassée.';