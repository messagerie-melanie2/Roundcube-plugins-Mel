<?php
/**
 * Plugin Mél Electron
 *
 * Plugin d'affichage de Mél dans un client Electron en lien avec le plugin Mél_archivage
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans le dossier d'archive
 * Du dossier de l'application Electron 
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
$labels['import_button'] = 'Importer des archives';
$labels['create_folder'] = 'Créer un dossier local';
$labels['create'] = 'Créer';
$labels['delete_folder'] = 'Supprimer un dossier local';
$labels['delete'] = 'Supprimer le dossier';
$labels['electron'] = 'Electron';

$labels['archive_path'] = 'Chemin vers le dossier des archives : ';
$labels['actual_archive_path'] = 'Chemin actuel vers le dossier des archives : ';
$labels['save'] = 'Enregistrer';
$labels['change'] = 'Modifier';
$labels['change_archive_path'] = 'Changer le dossier de destination des archives';
$labels['log_open'] = 'Ouvrir les logs';

?>
