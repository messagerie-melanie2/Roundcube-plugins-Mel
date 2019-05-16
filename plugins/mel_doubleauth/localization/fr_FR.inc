<?php

// Labels used for different portions of the plugin
$labels = array();
$labels['activate'] = 'Activer';
$labels['desactivate'] = 'Désactiver';
$labels['label_activate'] = "Activez la double authentification";
$labels['mel_doubleauth'] = 'Double authentification';
$labels['code'] = 'Google Authenticator Code';

$labels['two_step_verification_form'] = 'La double authentification est activée pour votre compte.
<br>Veuillez saisir le code généré par votre téléphone mobile.';

$labels['secret'] = 'Secret';
$labels['qr_code'] = "Scanner l`image ci-dessous";
// $labels['msg_infor'] = 'Vous pouvez ajouter un <i>secret</i> généré avec <a href="https://code.google.com/p/google-authenticator/" target="_blank">google-authenticator</a> et l\'utiliser';
$labels['msg_infor'] = '<p>La double authentification renforce la sécurité de votre compte Mélanie2 en exigeant,
pour toute connexion à Mélanie2Web depuis Internet, la saisie d’un code à usage unique généré par votre téléphone mobile en plus de
votre mot de passe.</p>
<p>Pour activer la double authentification, vous devez disposer au préalable sur votre téléphone de l'."'".'application FreeOTP Authenticator,
disponible sur <a target="_blank" href="https://play.google.com/store/apps/details?id=org.fedorahosted.freeotp&hl=fr">Android</a> et
<a target="_blank" href="https://itunes.apple.com/fr/app/freeotp-authenticator/id872559395?mt=8">iOS</a>, ou d’une autre application compatible.</p>';

$labels['info_activer'] = '<p>
<b>Attention</b> : si vous cliquez sur &laquo; Activer &raquo;, il ne sera plus possible de vous connecter à Mélanie2Web depuis Internet sans la saisie d’un code à usage unique.
</p>';

$labels['info_desactiver'] = '<p>
Pour reconfigurer votre téléphone actuel ou configurer un nouveau téléphone,
vous pouvez désactiver la double authentification puis la réactiver.
</p><p>
<b>Attention</b> : si vous désactivez la double authentification,
la configuration que vous avez réalisée sur votre téléphone sera inopérante.
</p>';

$labels['show_secret'] = 'Afficher le secret';
$labels['hide_secret'] = 'Masquer le secret';
$labels['create_secret'] = 'Générer un secret';

$labels['action_2'] = "Sur votre téléphone, ouvrez FreeOTP et cliquer sur l'icône ";
$labels['action_3'] = "Scannez l'image ci-dessous";
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
$labels['info_active_ok'] = "La double authentification est activée pour votre compte.";



$labels['check_code_to_activate'] = 'Pour sauvegarder vous devez valider un code au préalable';

// Messages used for the different portions of the plugin
$messages = array();
$messages['successfully_saved'] = 'Configuration sauvegardée';
?>
