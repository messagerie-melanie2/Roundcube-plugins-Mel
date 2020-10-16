<?php
/**
 * Plugin Mél Archivage
 *
 * Plugin d'archivage des messages depuis Roundcube
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans 'mel_archivage_folder' 
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
$labels['title'] = 'Archiver les courriels de ce dossier';
$labels['archive'] = 'Archiver';
$labels['date'] = "Soit jusqu'au : ";
$labels['nb_jours'] = 'Messages de plus de  : ';
$labels['jours'] = 'jours';
$labels['buttontext'] = 'Archiver';
$labels['buttontitle'] = 'Archiver ce courriel';
$labels['description'] = "Comment fonctionne l'archivage : Sélectionnez un nombre de jours ou une date, tous les messages du dossier sélectionné antérieurs à cette date seront téléchargés sur votre poste. Ces messages ne seront pas supprimés de votre messagerie mais déplacés dans un dossier Messages archivés. Une fois que l'archive téléchargée vous convient, vous pouvez supprimer les messages contenus dans Messages archivés pour libérer de la place.";
$labels['generating_archive'] = "Génération de l'archive en cours...";
$labels['dont_reload_page'] = "Ne pas fermer la fenêtre";
$labels['archive_generated'] = "L'archive est générée et va être téléchargée. La page va se recharger dans quelques instants";
$labels['archive_downloading'] = "L'archive est en cours de téléchargement. Vous pouvez fermer la fenêtre, les mails continuerons de se télécharger en arrière-plan. Les mails disparaîtrons de la liste après l'actualisation de la page.";
$labels['archive_downloading_finish'] = "Téléchargement des mails archivés terminé";
$labels['error_no_message'] = "Il n'y a pas de courriel à archiver. Essayer de diminuer le nombre de jours.";
$labels['error_bad_folder'] = "Vous ne pouvez pas archiver ce dossier (c'est déjà un dossier d'archives)";
$labels['error_too_many_messages'] = "Une erreur s'est produite lors de la génération de l'archive. Essayez de réduire le nombre de jours pour diminuer la taille de l'archive.";
$labels['INBOX'] = 'boite de reception';
$labels['help'] = 'Afficher l\'aide';

?>
