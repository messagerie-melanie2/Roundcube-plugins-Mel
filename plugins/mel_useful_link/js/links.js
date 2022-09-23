function PaperClipCopy(link)
{
    function copyOnClick (val) {
        var tempInput = document.createElement ("input"); 
        tempInput.value = val;
         document.body.appendChild (tempInput); 
         tempInput.select (); 
         document.execCommand ("copy"); 
         document.body.removeChild (tempInput); 
    }
    const url = link[0].href;
    copyOnClick(url);
    rcmail.display_message(`${url} copier dans le presse-papier.`, "confirmation")
}

function EditLink(id)
{
    if (rcmail.busy)
        return;

    GetLinkPopUp().setPopUpChoice(MelLink.from(id)).show();
}

function ModifyLink(link)
{
    if (!!link.links) GetLinkPopUp().setMultiLinkEditor(link).show(); 
    else GetLinkPopUp().setLinkEditor(link).show();
}

function CreateLink()
{
    if (rcmail.busy)
        return;

    GetLinkPopUp().drawChoice('', {
        icon:'icon-mel-link',
        name:'Créer un lien unique',
        click:() => {
            GetLinkPopUp().setLinkEditor(new MelLink()).show();
        }
    },
    {
        icon:'icon-mel-grid',
        name:'Créer un multi-lien',
        click:() => {
            GetLinkPopUp().setMultiLinkEditor().show();
        }
    }).show();//.setLinkEditor(new MelLink()).show();
}

function SearchLinks(search)
{
    if (rcmail.busy)
        return;

    search = search.value;

    $(".epingle").css("display", search === "" ? "" : "none");
    $(".joined").css("display", search === "" ? "" : "none");

    if (search === "")
    {
        $(".searched").remove();
    }
    else 
    {
        if ($(".searched").length === 0)
            $("#layout-content .body").prepend(`<div class="searched"><h2>Liens trouvés</h2><div class="found-links"></div>`)
        else
            $(".searched .found-links").html("");

        $(".joined .link-block").each((i,e) => {
            e = $(e);

            if (e.data("title").toUpperCase().includes(search.toUpperCase()) || e.data("link").toUpperCase().includes(search.toUpperCase()))
                e.clone().appendTo($(".searched .found-links"));
        });
    }
}

/**
 * 
 * @param {MelLink} link 
 */
function DeleteLink(link)
{
    GetLinkPopUp().setLoading();
    return link.callDelete().then(() => {
        GetLinkPopUp().hide();
        window.location.reload();
    });
}

function TakLink(id)
{
    if (rcmail.busy)
        return;

    return MelLink.from(id).callPin().then(() => {
        window.location.reload();
    });
}

function HideOrShowLink(id)
{   if (rcmail.busy)
        return;
    
    return MelLink.from(id).callHideOrShow();/*.then(() => {
        const haveHidden = Enumerable.from(rcmail.env.mul_hiddens).where(x => Enumerable.from(x.value).where(parent => parent.value === true ? true : parent.value.length !== undefined ? Enumerable.from(parent.value).where(child => child.value) > 0 : parent.value) > 0).any();
        if (haveHidden && $("#mulsah").length === 0)
        {
            $(`<button id="mulsah" class="mel-button btn btn-secondary crossed-eye" title="Afficher toutes les vignettes" style="margin-right:15px;" onclick="ShowOrHideAllHidden()"><span class="icon-mel-eye-crossed"></span></button>`)
            .appendTo($(".joined .title-wsp"));
        }
        else if (!haveHidden && $("#mulsah").length > 0)
            $("#mulsah").remove();
    });*/
}

function ShowOrHideAllHidden()
{
    if (rcmail.busy)
        return;

    if (rcmail.env.showHiddenLinks === undefined)
        rcmail.env.showHiddenLinks = false;

    $("#mulsah").addClass("disabled").attr("disabled", "disabled");
    rcmail.set_busy(true, "loading");

    if (!rcmail.env.showHiddenLinks)
    {
        MelLink.updateLinks("useful_links", true).then(() => {
            rcmail.set_busy(false);
            rcmail.clear_messages();
            $("#mulsah").removeClass("disabled").removeAttr("disabled", "disabled");
        });
        rcmail.env.showHiddenLinks = true;
        $("#mulsah").removeClass("crossed-eye")
        .addClass("eye")
        .attr("title", "Cacher les vignettes cachées")
        .find("span")
        .removeClass("icon-mel-eye-crossed")
        .addClass("icon-mel-eye");
    }
    else {
        MelLink.updateLinks("useful_links", null).then(() => {
            rcmail.set_busy(false);
            rcmail.clear_messages();
            $("#mulsah").removeClass("disabled").removeAttr("disabled", "disabled");
        });
        rcmail.env.showHiddenLinks = null;
        $("#mulsah").addClass("crossed-eye")
        .removeClass("eye")
        .attr("title", "Afficher toutes les vignettes")
        .find("span")
        .addClass("icon-mel-eye-crossed")
        .removeClass("icon-mel-eye");
    }


}

function PublicCommands(element)
{
    switch ($(element).val()) {
        case "\\correctLinks":
            rcmail.display_message("Mise à jour des liens...", "loading");
            $("#layout").css("display", "block").html(`<center><span style="width:300px;height:300px" class="spinner-grow"></span></center>`);
            mel_metapage.Functions.post(mel_metapage.Functions.url("useful_links", "correct"), {}).always(() => {
                window.location.reload();
            });
            break;
        case "\\oldLinks":
            try {
                console.log("OBJET : ", rcmail.env.mul_old_items, "STRING : ", JSON.stringify(rcmail.env.mul_old_items));
                rcmail.display_message("Anciens liens affichés dans la console javascript !", "confirmation");
                $(element).val("");
                SearchLinks(element);
            } catch (error) {
                console.error(error);
            }
            break;
    
        default:
            break;
    }
}