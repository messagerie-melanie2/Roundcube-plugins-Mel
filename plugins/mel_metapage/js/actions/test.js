$(document).ready(async () => {
     //debugger;
     const loadJsModule = window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;
    const {MelHtml} = await loadJsModule('mel_metapage', '');

    window.a = MelHtml.start
    .row()
        .col_10()
            .select()
                .option({value:''}).text('Defaut').end()
                .option({value:'other', selected:'selected'}).text('Autre').end()
            .end('select')
        .end()
        .comment('Commentaire html')
        .col_2()
            .button().text('Envoyer').end()
        .end()
    .end()
    .generate().appendTo($('#layout-content'));
    //window.b = a.generate().appendTo($('#layout-content'));

});