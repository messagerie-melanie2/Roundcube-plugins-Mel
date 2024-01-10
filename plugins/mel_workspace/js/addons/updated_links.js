function update_wsp_links(result, link) {
    if ( top.$('iframe.workspace-frame').length > 0)
    {
        top.$('iframe.workspace-frame')[0].contentWindow.$('#side-workspaces iframe').each((i, e) => {
            if (e.contentWindow.refreshUsefulLinks) e.contentWindow.refreshUsefulLinks();
        });
    }
    else {
        try {
            refreshUsefulLinks();
        } catch (error) {
            
        }
    }

    if (result === true) {
        window.location.reload();
    }
    else {
        if (!!link.links)  GetLinkPopUp().setMultiLinkEditor(link, "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}, update_wsp_links).show();
        else GetLinkPopUp().setLinkEditor(link, "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}, update_wsp_links);
    }
};

function ModifyLink(link)
{
    if (!!link.links) GetLinkPopUp().setMultiLinkEditor(link, "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}, update_wsp_links).show();
    else GetLinkPopUp().setLinkEditor(link, "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}, update_wsp_links).show();
}

function CreateLink()
{

    GetLinkPopUp().drawChoice('', {
        icon:'icon-mel-link',
        name:'Créer un lien unique',
        click:() => {
            GetLinkPopUp().setLinkEditor(new MelLink(), "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}, update_wsp_links).show();
        }
    },
    {
        icon:'icon-mel-grid',
        name:'Créer un multi-lien',
        click:() => {
            GetLinkPopUp().setMultiLinkEditor(new MelMultiLink(), "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}, update_wsp_links).show();
        }
    }).show();
    //GetLinkPopUp().setLinkEditor(new MelLink(), "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}).show();
}

/**
 * 
 * @param {MelLink} link 
 */
 function DeleteLink(link)
 {
     GetLinkPopUp().setLoading();
     return link.callDelete("workspace", "delete_ulink", {_workspace_id:rcmail.env.current_workspace_id}).then(() => {
         GetLinkPopUp().hide();
         update_wsp_links(true, null);
         window.location.reload();
     });
 }
 
 function TakLink(id)
 {
     return MelLink.from(id).callPin("workspace", "pin_ulink", {_workspace_id:rcmail.env.current_workspace_id}).then(() => {
        // mel_metapage.Functions.call(`
        //     try {
        //         refreshUsefulLinks();
        //     }catch(e) {}
        // `, true); 
        window.location.reload();
     });
 }

//  $(document).ready(() => {
     
//     $(".logo-mel.startup").remove();
//     $("#layout-content").css("padding", "0 20px").css("margin-top", "0");

//  });