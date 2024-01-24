$(document).ready(async () => {
    const loadJsModule = window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;
    const {RcmailDialog, RcmailDialogChoiceButton} = await loadJsModule('mel_metapage', 'modal.js', '/js/lib/classes/');

    const button1 = new RcmailDialogChoiceButton('Aller à l\'accueil', 'home', {});
    const button2 = new RcmailDialogChoiceButton('Aller aux paramètres', 'settings', {});

    // RcmailDialog.DrawChoice('Test', button1, button2);
    let dial = new RcmailDialog($('<div>Test</div>'), {title: 'Test', buttons: [button1, button2]});
});