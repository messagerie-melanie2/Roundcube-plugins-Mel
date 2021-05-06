function RoundriveCreate(...args)
{
    this.init(...args);
}

RoundriveCreate.prototype.init = function()
{
    this.item = $("#roundrive-create");
    this.buttons = {
        parent:$("#roundrive-elements")
    }
    this.create_buttons();
}

RoundriveCreate.prototype.create_buttons = function()
{
    let html = "";

    for (let index = 0; index < rcmail.env.mel_metapage_templates_doc.length; index++) {
        const element = rcmail.env.mel_metapage_templates_doc[index];
        html += '<div class=col-3><button data-doc="'+element.type+'" type=button class="doc-'+element.type+' btn-template-doc btn btn-block btn-secondary btn-mel" onclick="m_mp_UpdateCreateDoc(`'+JSON.stringify(element).replace(/"/g, "¤¤¤")+'`)"><span style="display:block;margin-right:0px" class="'+m_mp_CreateDocumentIconContract(element.icon)+'"></span>'+ rcmail.gettext("mel_metapage." + element.name) +'</button></div>';
    }

    this.buttons.parent.html(`<div class=row>${html}</div>`);

    this.buttons.parent.find("button").each((i,e) => {
        e = $(e);
        this.buttons[e.data("doc")] = e;
    });


}

$(document).ready(() => {

    rcmail.env.roundrive = new RoundriveCreate();
    console.log(rcmail.env.roundrive);
    
})