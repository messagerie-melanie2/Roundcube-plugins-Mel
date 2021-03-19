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
$labels['buttontext'] = 'Remise différée';
$labels['buttontitle'] = 'Remise différée';
$labels['title'] = 'Remise différée de mon mail';
$labels['title_futur'] = 'Date de remise différée non valide';
$labels['date'] = 'Le : ';
$labels['time'] = 'A : ';
$labels['description'] = "Votre mail sera remis à la date et à l'horaire défini ci-dessous.";
$labels['description_warning'] = "Attention : il est en revanche impossible de modifier et annuler ce mail une fois envoyé.";
$labels['description_info'] = 'Cette remise différée est une étape préalable avant une véritable fonction d\'envoi différé';
$labels['description_futur'] = 'La date choisie pour la remise différée à été dépassée';
$labels['save'] = 'Enregistrer';
$labels['send_normally'] = 'Envoyer normalement';
$labels['cancel'] = 'Annuler la remise différée';
$labels['modify'] = 'Modifier la remise différée';
$labels['error_message'] = 'La date choisie n\'est pas valide';
$labels['empty_message'] = 'Merci de remplir les champs ci-dessus';