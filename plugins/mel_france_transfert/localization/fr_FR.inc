<?php

/*
 +-----------------------------------------------------------------------+
 | plugins/mel_francetransfert/localization/<lang>.inc                           |
 |                                                                       |
 | Localization file of the Roundcube Webmail Managesieve plugin         |
 | Copyright (C) 2012-2013, The Roundcube Dev Team                       |
 |                                                                       |
 | Licensed under the GNU General Public License version 3 or            |
 | any later version with exceptions for skins & plugins.                |
 | See the README file for a full license statement.                     |
 |                                                                       |
 +-----------------------------------------------------------------------+

 For translation see https://www.transifex.com/projects/p/roundcube-webmail/resource/plugin-managesieve/
*/

$labels = array();

$labels['Send France Transfert title'] = "Envoi France Transfert";
$labels['Send France Transfert text'] = "La taille du message est trop importante pour un envoi par la messagerie. Si vous continuez, votre message sera envoyé par le service France Transfert et vos destinataires recevront un lien de téléchargement des pièces jointes.";
$labels['Send France Transfert keep the file'] = "Conserver les fichiers pendant : ";
$labels['Send France Transfert days'] = "jours";
$labels['maxuploadsize'] = 'La taille de fichier maximum autorisée est $size. À partir de %%max_attachments_size%% le message sera envoyé par le service France Transfert sous forme de pli.';
$labels['cancel'] = "Annuler";
$labels['send_francetransfert'] = "Envoyer";
$labels['Over size France Transfert error'] = "La taille totale des pièces jointes ne doit pas dépasser %%max_francetransfert_size%% octets (vous êtes à %%size%% octets)";
$labels['Send France Transfert message'] = "Envoi du message au service France Transfert...";
$labels['Download files France Transfert message'] = "Téléchargement des fichiers vers France Transfert...";
$labels['France Transfert remise differee error'] = "Vous avez configuré une remise différée pour votre message mais celui-ci dépasse la taille autorisée par la messagerie Mél. Vous pouvez soit envoyer immédiatement ce message et ses pièces jointes grâce au service Mélanissimo soit annuler l'envoi et diminuer la taille de ses pièces jointes.";
$labels['France Transfert service down'] = "Le service France Transfert n'est pas accessible mais votre message dépasse la taille autorisée par la messagerie Mél, essayez de vous connecter directement à Mélanissimo.";
$labels['Send France Transfert error'] = "Une erreur s'est produite, impossible d'envoyer le message";
$labels['Send France Transfert success'] = "Le message vient d'être envoyé via France Transfert";
$labels['button send now'] = 'Envoyer immédiatement avec France Transfert';
$labels['action connection'] = "Connexion au service France Transfert";
$labels['action message'] = "Téléchargement du message sur le service France Transfert";
$labels['action fichier'] = "Envoi du fichier %%filename%% au service France Transfert";
$labels['action envoi'] = "Envoi du message";
$labels['action garde'] = "Enregistrement de la durée de garde";
$labels['pref_max_attachments_size'] = "Taille maximum des pièces jointes avant un envoi par France Transfert";
$labels['error_message_size_limit'] = "Un message France Transfert ne peux pas dépasser les %%max_message_size%% caractères. Si vous avez faire un Répondre à, pensez à supprimer les citations en dessous de votre texte pour réduire la taille du message.";
