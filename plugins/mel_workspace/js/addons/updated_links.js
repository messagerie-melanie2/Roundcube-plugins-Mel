function ModifyLink(link)
{
    GetLinkPopUp().setLinkEditor(link, "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}).show();
}

function CreateLink()
{
    GetLinkPopUp().setLinkEditor(new MelLink(), "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_id}).show();
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
     });
 }
 
 function TakLink(id)
 {
     return MelLink.from(id).callPin("workspace", "pin_ulink", {_workspace_id:rcmail.env.current_workspace_id}).then(() => {
         window.location.reload();
     });
 }

 $(document).ready(() => {
     
    $(".logo-mel.startup").remove();
    $("#layout-content").css("padding", "0 20px").css("margin-top", "0");

 });