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

// Charset to use for filenames inside the zip
// ASCII//TRANSLIT//IGNORE pour ignorer les accents
$config['mel_archivage_charset'] = $_ENV['RC_MEL_ARCHIVAGE_CHARSET'] ?? 'ASCII//TRANSLIT//IGNORE';

// Name of the folder where to move messages
$config['mel_archivage_folder'] = $_ENV['RC_MEL_ARCHIVAGE_FOLDER'] ?? "Messages archiv&AOk-s";

// Help page
$config['mel_archivage_help_url'] = $_ENV['RC_MEL_ARCHIVAGE_HELP_URL'] ?? "./aide/doc/archivage/";
