<?php

// Labels used for different portions of the plugin
$labels = array();
$labels['activate'] = 'Activer';
$labels['desactivate'] = 'Désactiver';
$labels['label_activate'] = "Activez l'authentification à deux facteurs";
$labels['mel_doubleauth'] = 'Authentification à deux facteurs';
$labels['code'] = 'Google Authenticator Code';

$labels['two_step_verification_form'] = 'L\'authentification à deux facteurs est activée pour votre compte.
<br>Veuillez saisir le code généré par votre téléphone mobile.';

$labels['secret'] = 'Secret';
$labels['qr_code'] = "Scanner l`image ci-dessous";
// $labels['msg_infor'] = 'Vous pouvez ajouter un <i>secret</i> généré avec <a href="https://code.google.com/p/google-authenticator/" target="_blank">google-authenticator</a> et l\'utiliser';
$labels['msg_infor'] = '<p>L\'authentification à deux facteurs renforce la sécurité de votre compte Mél en exigeant,
pour toute connexion au Bnum depuis Internet, la saisie d’un code à usage unique généré par votre téléphone mobile en plus de
votre mot de passe.</p>
<p>Pour activer l\'authentification à deux facteurs, vous devez disposer au préalable sur votre téléphone de l'."'".'application FreeOTP Authenticator ou Google Authenticator,
disponible sur <a target="_blank" href="https://play.google.com/store/apps/details?id=org.fedorahosted.freeotp&hl=fr">Android</a> et
<a target="_blank" href="https://itunes.apple.com/fr/app/freeotp-authenticator/id872559395?mt=8">iOS</a>, ou d’une autre application compatible.</p>';

$labels['info_activer'] = '<p>
<b>Attention</b> : si vous cliquez sur &laquo; Activer &raquo;, il ne sera plus possible de vous connecter au Bnum depuis Internet sans la saisie d’un code à usage unique.
</p>';

$labels['info_desactiver'] = '<p>
Pour reconfigurer votre téléphone actuel ou configurer un nouveau téléphone,
vous pouvez désactiver l\'authentification à deux facteurs puis la réactiver.
</p><p>
<b>Attention</b> : si vous désactivez l\'authentification à deux facteurs,
la configuration que vous avez réalisée sur votre téléphone sera inopérante.
</p>';

$labels['show_secret'] = 'Afficher le secret';
$labels['hide_secret'] = 'Masquer le secret';
$labels['create_secret'] = 'Générer un secret';

$labels['action_2'] = "Sur votre téléphone, ouvrez FreeOTP et cliquer sur l'icône ";
$labels['action_3'] = "Scannez l'image ci-dessous ou copiez le code suivant : ";
$labels['action_4'] = "Tapez le code donné par votre téléphone puis cliquez sur &laquo; Vérifier &raquo;";
$labels['action_5'] = "Si le code est correct, enregistrez la configuration";

$labels['show_qr_code'] = 'Afficher le QR Code';
$labels['hide_qr_code'] = 'Masquer QR Code';

$labels['recovery_codes'] = 'Vous pouvez générer des codes de secours,
                            utilisables en cas de défaillance de votre téléphone.
                            Notez-les préciseusement';
$labels['show_recovery_codes'] = 'Afficher les codes de secours';
$labels['hide_recovery_codes'] = 'Masquer les codes de secours';

$labels['setup_all_fields'] = 'Générer un secret (vérification nécessaire)';

$labels['enrollment_dialog_title'] = 'Double authentification';
$labels['enrollment_dialog_msg'] = '<strong>La vérification en 2 étapes</strong> est recommandée, merci de la configurer';

$labels['check_code'] = 'Vérifier';
$labels['code_ok'] = 'Le code est correct, votre téléphone est correctement configuré.';
$labels['code_ko'] = 'Le code est incorrect. Veuillez réessayer ou, si le problème persiste, paramétrer à nouveau votre téléphone.';
$labels['info_check_code'] = "
Pour vérifier que votre téléphone est correctement configuré,
tapez le code donné par votre téléphone puis cliquez sur &laquo; Vérifier &raquo;
.";
$labels['info_active_ok'] = "L'authentification à deux facteurs est activée pour votre compte.";



$labels['check_code_to_activate'] = 'Pour sauvegarder vous devez valider un code au préalable';

$labels['logout_2fa_needed'] = "L'authentification à deux facteurs est obligatoire pour votre compte.";
$labels['logout_2fa_needed_not_secure'] = "L'authentification à deux facteurs est obligatoire pour vous connecter depuis internet !";
$labels['logout_2fa_needed_unknown'] = "Utilisateur incconnu !";
$labels['logout_2fa_code_error'] = "Le code saisi est erroné.";

$labels['recovery_guard_text'] = 'Pour recevoir un code de validation sur votre adresse de récupération, cliquez sur le bouton ci-dessous.';
$labels['recovery_title'] = 'Récupération par adresse mail';
$labels['recovery_back'] = 'Retour';
$labels['recovery_send'] = 'Envoyer le code';
$labels['recovery_resend'] = 'Renvoyer un code';
$labels['recovery_connect'] = 'Connexion';
$labels['recovery_code_label'] = 'Saisissez le code reçu par mail';
$labels['recovery_code_hint'] = 'Code à 6 chiffres reçu sur votre adresse de récupération';

// Page de saisie du code (templates/da.html et js/mel_doubleauth_form_v2.js)
$labels['da_card_title'] = 'Double authentification';
$labels['da_credentials_title'] = 'Rentrez votre code OTP';
$labels['da_code_section_title'] = 'Saisie du code de vérification';
$labels['da_code_intro'] = 'Ouvrez votre application d’authentification et saisissez le code à 6 chiffres affiché pour votre compte. Le code change toutes les 30 secondes.';
$labels['da_code_label'] = 'Code de vérification';
$labels['da_code_hint'] = 'Code à 6 chiffres, par exemple 123456, ou code de secours';
$labels['da_validate'] = 'Valider le code';
$labels['da_cancel'] = "Revenir à l'identification";
$labels['da_help_title'] = 'Vous ne recevez pas le code ?';
$labels['da_lost_code'] = 'J’ai perdu l’accès à mon moyen d’authentification';
$labels['da_internet_warning_1'] = "Si vous êtes sur internet et n'avez pas activé l'authentification à double facteur vous ne pouvez pas vous connecter.";
$labels['da_internet_warning_2'] = "Vous devez passer par le VPN pour vous connecter et ainsi activer l'authentification à deux facteurs.";
$labels['da_empty_code'] = 'Saisissez le code de vérification.';
$labels['da_page_unavailable'] = "Impossible d'afficher la page de double authentification !";
$labels['da_page_degraded'] = "Impossible d'afficher correctement la page de double authentification !";

// Parcours « code perdu » (js/lib/recovery_flow.js)
$labels['recovery_empty_token'] = 'Saisissez le code reçu par mail.';
$labels['recovery_sent'] = 'Message envoyé !';
$labels['recovery_send_error'] = "Impossible d'envoyer le code de validation !";
$labels['recovery_invalid_address'] = "Votre adresse de récupération n'est pas valide ! Connectez-vous en intranet pour vous connecter et changer votre adresse de récupération.";

// Messages used for the different portions of the plugin
$messages = array();
$messages['successfully_saved'] = 'Configuration sauvegardée';
?>
