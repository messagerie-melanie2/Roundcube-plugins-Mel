$(document).ready(async () => {
     //debugger;
    const JsHtml = await module_helper_mel.JsHtml({includes_inputs:true, includes_bootstrap: true});

    window.a = JsHtml.start
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