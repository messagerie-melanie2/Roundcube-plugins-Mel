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
    GetLinkPopUp().setPopUpChoice(MelLink.from(id)).show();
}

function ModifyLink(link)
{
    GetLinkPopUp().setLinkEditor(link).show();
}

function CreateLink()
{
    GetLinkPopUp().setLinkEditor(new MelLink()).show();
}

function SearchLinks(search)
{
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
    return MelLink.from(id).callPin().then(() => {
        window.location.reload();
    });
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
    
        default:
            break;
    }
}