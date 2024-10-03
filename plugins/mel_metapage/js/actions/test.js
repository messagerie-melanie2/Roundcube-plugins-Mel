$(document).ready(async () => {
  const loadJsModule =
    window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;
  const { RcmailDialog, RcmailDialogChoiceButton, MelDialog, DialogPage } =
    await loadJsModule('mel_metapage', 'modal.js', '/js/lib/classes/');

  // const button1 = new RcmailDialogChoiceButton("Aller à l'accueil", 'home', {
  //   click: () => {
  //     dialog.switch_page('page2');
  //   },
  // });
  // const button2 = new RcmailDialogChoiceButton(
  //   'Aller aux paramètres',
  //   'settings',
  //   {},
  // );

  // const page = DialogPage.DrawChoice('Test', button1, button2, 'index');
  // let dialog = new MelDialog(page);
  // dialog.show();

  // dialog.add_page('page2', {
  //   content: $('<div>Yolo</div>'),
  //   title: 'Strat',
  //   buttons: [button1, button2],
  // });

  // window.dialog = dialog;

  if (
    await MelDialog.Confirm('Veux-tu le faire ?', {
      title: 'le faire ?',
      waiting_button_enabled: 0,
    })
  ) {
    alert('gg');
  } else alert('notgg');
});
