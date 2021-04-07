(() => {
    window.addEventListener("message", receiveMessage, false);
    function receiveMessage(event)
    {
        console.log("exec_info", event, event.data);
        if (event.data.exec_info === undefined)
            return;
        const message = event.data.exec_info;
        const datas = event.data.datas;
        switch (message) {
            case "UpdateMenu":
                console.log("UpdateMenu", UpdateMenu, datas);
                UpdateMenu(datas.class, datas.picture, datas.toolbar);
                break;
            case "ChangeFrame":
                if (metapage_frames.workspace === undefined)
                {
                    metapage_frames.workspace = false;
                    metapage_frames.addEvent("changepage.before", (eClass) => {
                        console.log("addEvent", $(".tiny-wsp-menu"));
                        if ($(".tiny-wsp-menu").length > 0 && $(".tiny-wsp-menu").css("display") !== "none")
                        {
                            console.log("test");
                            try {
                                //$(".tiny-rocket-chat").css("display", "block");
                                console.log("test", $(".wsp-toolbar-edited").css("display") !== "none");
                                $(".tiny-wsp-menu").css("display", "none")
                                .data("toolbaropen", $(".wsp-toolbar-edited").css("display") !== "none")
                                .data("lastopenedframe", rcmail.env.wsp_datas.toolbar.current);
                                $(".wsp-toolbar-edited").css("display", "none");               
                            } catch (error) {
                                console.error(error);
                            }
                            console.log("addEvent", $(".tiny-wsp-menu"));
                            metapage_frames.workspace = true;
                        }
                    });
                    metapage_frames.addEvent("changepage.after", (eClass, changepage, isAriane, querry, id) => {
                        if (metapage_frames.workspace === true && eClass === "workspace")
                        {
                            $(".tiny-wsp-menu").css("display", "");
                            $(".tiny-rocket-chat").css("display", "none");
                            const lastFrame = $(".tiny-wsp-menu").data("lastopenedframe");
                            const toolbaropen = $(".tiny-wsp-menu").data("toolbaropen");
                            console.log("test", toolbaropen, lastFrame);
                            if (toolbaropen)
                                $(".wsp-toolbar-edited").css("display", "");
                            ChangeFrame(lastFrame);
                            metapage_frames.workspace = false;
                        }
                    });
                }
                switch (datas) {
                    case "rocket":
                        ChangeFrame(datas, event.data.url);
                        break;
                
                    default:
                        ChangeFrame(datas);
                        break;
                }
                break;
            case "ChangePage":
                ChangePage(datas);
                break;
            case "change_environnement":
                InitialiseDatas();
                rcmail.env.wsp_datas.toolbar.current = datas;
                break;
            case "ChangeToolbarPage":
                console.log("here", datas);
                ChangeToolbarPage(datas);
                break;
            default:
                break;
        }
    }
})();

function InitialiseDatas()
{
    if (rcmail.env.wsp_datas === undefined)
        rcmail.env.wsp_datas = {
            toolbar:{}
        };
}


function UpdateMenu(_class, _picture, _toolbar)
{
    InitialiseDatas();
    if (rcmail.env.wsp_datas.toolbar.current === "inpage")
    {
        let button = $(".tiny-rocket-chat");
        if (button.length > 0)
            button.css("display", "block");
        $(".tiny-wsp-menu").remove();
        if ($(".wsp-toolbar-edited").length > 0)
            $(".wsp-toolbar-edited").remove();
        else
            $(".wsp-toolbar") 
            .css("margin", "")
            .css("position", "")
            .css("bottom", "")
            .css("right", "")
            .css("z-index", "");
            $(".added-wsp-item").remove();
            rcmail.env.wsp_datas.toolbar.exists = false;
    }
    else {
        rcmail.env.wsp_datas.toolbar.current = _class;
        if (rcmail.env.wsp_datas.toolbar.exists === true)
            return;
        const basePx = "50px";
        let right = basePx;
        let bottom = basePx;
        let button = $(".tiny-rocket-chat");
        if (button.length > 0)
        {
            button.css("display", "none");
            right = button.css("right");
            bottom = button.css("bottom");
            if (right === "auto")
                right = basePx;
            if (bottom === "auto")
                bottom = basePx;

        }
        console.log("button", button, right, bottom);
        button = $(".tiny-wsp-menu");
        if (button.length === 0)
        {
            let picture = $(".wsp-picture");
            $("#layout").append(`<div onclick=HideOrShowMenu(this) class="tiny-wsp-menu enabled"></div>`)
            button = $(".tiny-wsp-menu");
            button.css("position", "absolute");
            button.css("right", right)
            .css("bottom", bottom)
            .css("background-color", _picture === null ? picture.css("background-color") : _picture.color)
            .css("z-index", 999)
            .addClass("dwp-round")
            .append(_picture === null ? picture.html() : _picture.picture);
        }
        button.css("display", "");
        //console.log("ShowToolbar", $(".wsp-toolbar"));
        (_toolbar !== null && $(".wsp-toolbar-edited").length === 0 ? $("#layout").append(_toolbar).find(".wsp-toolbar-edited") : $(".wsp-toolbar-edited") )
        .css("margin", "initial")
        .css("position", "fixed")
        .css("bottom", (parseInt(bottom.replace("px", "")) - 3) + "px")
        .css("right", right)
        .css("z-index", 99)
        .append('<div class="wsp-toolbar-item added-wsp-item" style="pointer-events:none"></div>');
        rcmail.env.wsp_datas.toolbar = {
            current: _class,
            exists: true
        };
    }
}

async function ChangeToolbar(_class, event, otherDatas = null)
{
    if(rcmail.busy)
        return;
    $(".wsp-toolbar").css("z-index", "0");
    $(".wsp-toolbar-item").removeClass("active");
    $(event).addClass("active");
    let datas = [];
    let picture = $(".wsp-picture");
    switch (_class) {
        case "calendar":
            //let picture = $(".wsp-picture");
            datas.push({
                exec_info:"change_environnement",
                datas:_class
            })
            datas.push({
                exec_info:"UpdateMenu",
                datas:{
                    class:_class,
                    picture:{
                        color:picture.css("background-color"),
                        picture:picture.html()
                    },
                    toolbar:$(".wsp-toolbar")[0].outerHTML.replace("wsp-toolbar", "wsp-toolbar wsp-toolbar-edited")
                }
            });
            datas.push(
                {
                    exec_info:"ChangeFrame",
                    datas:_class
                }
            );
            break;
        case "rocket":
            datas.push({
                exec_info:"change_environnement",
                datas:_class
            })
            datas.push({
                exec_info:"UpdateMenu",
                datas:{
                    class:_class,
                    picture:{
                        color:picture.css("background-color"),
                        picture:picture.html()
                    },
                    toolbar: $(".wsp-toolbar")[0].outerHTML.replace("wsp-toolbar", "wsp-toolbar wsp-toolbar-edited")
                }
            });
            datas.push(
                {
                    exec_info:"ChangeFrame",
                    datas:"rocket",
                    url:otherDatas
                }
            );
            break;
        case "home":
            datas.push({
                exec_info:"change_environnement",
                datas:"inpage"
            })
            datas.push({
                exec_info:"UpdateMenu",
                datas:{
                    class:_class,
                    picture:{
                        color:null,
                        picture:null
                    },
                    toolbar:null
                }
            });
            datas.push(
                {
                    exec_info:"ChangePage",
                    datas:_class
                }
            );
            break;
        case "tasklist":
            //let picture = $(".wsp-picture");
            datas.push({
                exec_info:"change_environnement",
                datas:_class
            })
            datas.push({
                exec_info:"UpdateMenu",
                datas:{
                    class:_class,
                    picture:{
                        color:picture.css("background-color"),
                        picture:picture.html()
                    },
                    toolbar:$(".wsp-toolbar")[0].outerHTML.replace("wsp-toolbar", "wsp-toolbar wsp-toolbar-edited")
                }
            });
            datas.push(
                {
                    exec_info:"ChangeFrame",
                    datas:_class
                }
            );
            break;
        case "params":
            datas.push({
                exec_info:"change_environnement",
                datas:"inpage"
            })
            datas.push({
                exec_info:"UpdateMenu",
                datas:{
                    class:"inpage",
                    picture:{
                        color:null,
                        picture:null
                    },
                    toolbar:null
                }
            });
            datas.push(
                {
                    exec_info:"ChangePage",
                    datas:_class
                }
            );
            break;
        case "back":
            datas.push({
                exec_info:"change_environnement",
                datas:"inpage"
            })
            datas.push({
                exec_info:"UpdateMenu",
                datas:{
                    class:"inpage",
                    picture:{
                        color:null,
                        picture:null
                    },
                    toolbar:null
                }
            });
            datas.push(
                {
                    exec_info:"ChangePage",
                    datas:_class
                }
            );
            break;
                   
        default:
            break;
    }

    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
        parent.postMessage(element);
    }
}

async function ChangeFrame(_class, otherDatas = null)
{
    $(".mm-frame").css("display", "none");
    $(".wsp-object").css("display", "none");

    $(".workspace-frame").css("display", "none");

     const id = mm_st_OpenOrCreateFrame(_class, false);
     await wait(() => rcmail.env.frame_created !== true);

    (_class === "rocket" ? $("#" + id).css("display", "").parent().parent() : $("#" + id).css("display", "").parent()).css("display", "").css("position", "absolute").css("height", "100%");

    if (_class === "rocket")
    {
        $(".a-frame").css("display", "");
        $("#" + id)[0].contentWindow.postMessage({
            externalCommand: 'go',
            path: otherDatas
        }, '*');
    }
    else
        $(".a-frame").css("display", "none");

    if ($("#layout-content").hasClass("workspace-frame"))
        $("#layout-content").css("display", "");
     rcmail.env.have_frame_positioned = true;
     rcmail.set_busy(false);
     rcmail.clear_messages();
}

async function ChangePage(_class)
{
    $(".mm-frame").css("display", "none");
    $(".a-frame").css("display", "none");
    let layout_frame = $("#layout-frames")
    .css("position", "")
    .css("height", "");
    if (layout_frame.find(".workspace-frame").length >= 1)
        layout_frame.css("display", "");
    else
        layout_frame.css("display", "none")
    $(".workspace-frame").css("display", "");
    let frame = $("iframe.workspace-frame");
    console.log(frame.length >= 1, Enumerable.from(frame.parent()).any(x => x.id === "layout-frames"))
    if (frame.length >= 1 && Enumerable.from(frame.parent()).any(x => x.id === "layout-frames"))
        frame[0].contentWindow.postMessage({
            exec_info:"ChangeToolbarPage",
            datas:_class
        })
    else
        ChangeToolbarPage(_class);
}

async function ChangeToolbarPage(_class)
{
    $(".wsp-toolbar").css("z-index", "");
    $(".wsp-object").css("display", "none");
    $(".wsp-toolbar-item").removeClass("active");
    //console.log($(".wsp-object"), $(".wsp-toolbar-item.first"), $(".wsp-home"));
    switch (_class) {
        case "home":
            $(".wsp-toolbar-item.wsp-home").addClass("active");
            $(".wsp-home").css("display", "");
            break;
        case "params":
            $(".wsp-toolbar-item.wsp-item-params").addClass("active");
            $(".wsp-params").css("display", "");
            break;
        case "back":
            rcmail.set_busy(false);
            $(".body").html($('<span style="margin-top:30px;width:200px;height:200px" class=spinner-border></span>')).css("display", "grid").css("justify-content", "center");
            rcmail.command("workspace.go");
        break;
        default:
            break;
    }
}

function HideOrShowMenu(element)
{
    const enabled = "enabled";
    const disabled = "disabled";
    element = $(element);
    if (element.hasClass(enabled))
    {
        element.removeClass(enabled);
        element.addClass(disabled);
        $(".wsp-toolbar-edited").css("display", "none");
    }
    else
    {
        element.removeClass(disabled);
        element.addClass(enabled);
        $(".wsp-toolbar-edited").css("display", ""); 
    }
}
// function ChangeMenu(hide = true ,_picture = null, _toolbar = null)
// {
//     console.log("ChangeMenu", hide, _picture, _toolbar);
//     if (hide)
//     {
//         if (parent !== window)
//         {
//             return {
//                 message:"ChangeMenu()",
//                 datas:{
//                     hide:hide,
//                     toolbar:true
//                 }
//             };
//         }
//         HideToolbar(_toolbar);
//     }
//     else
//     {
//         if (parent !== window)
//         {
//             return {
//                 message:"ChangeMenu()",
//                 datas:{
//                     hide:hide,
//                     picture:{
//                         color:$(".wsp-picture").css("background-color"),
//                         picture:$(".wsp-picture").html()
//                     },
//                     toolbar:$(".wsp-toolbar")[0].outerHTML
//                 }
//             };
//         }
//         ShowToolbar(_picture, _toolbar);
//     }
// }

// function ShowToolbar(_picture = null, _toolbar = null)
// {
//     if (rcmail.env.workspace_menu_minified !== true)
//         rcmail.env.workspace_menu_minified = true;
//     else 
//         return;
//     let right = "50px";
//     let bottom = "50px";
//     let button = $(".tiny-rocket-chat");
//     if (button.length > 0)
//     {
//         button.css("display", "none");
//         right = button.css("right");
//         bottom = button.css("bottom");
//     }
//     button = $(".tiny-wsp-menu");
//     if (button.length === 0)
//     {
//         let picture = $(".wsp-picture");
//         $("#layout").append(`<div class=tiny-wsp-menu></div>`)
//         button = $(".tiny-wsp-menu");
//         button.css("position", "absolute");
//         button.css("right", right)
//         .css("bottom", bottom)
//         .css("background-color", _picture === null ? picture.css("background-color") : _picture.color)
//         .css("z-index", 999)
//         .addClass("dwp-round")
//         .append(_picture === null ? picture.html() : _picture.picture);
//     }
//     button.css("display", "");
//     console.log("ShowToolbar", $(".wsp-toolbar"));
//     (_toolbar !== null && $(".wsp-toolbar").length === 0 ? $("#layout").append(_toolbar).find(".wsp-toolbar") : $(".wsp-toolbar") )
//     .css("margin", "initial")
//     .css("position", "fixed")
//     .css("bottom", (parseInt(bottom.replace("px", "")) - 3) + "px")
//     .css("right", right)
//     .css("z-index", 99)
//     .append('<div class="wsp-toolbar-item added-wsp-item" style="pointer-events:none"></div>');
// }

// function HideToolbar(fromChild)
// {
//     console.log("HideToolbar("+fromChild+")");
//     let button = $(".tiny-rocket-chat");
//     if (button.length > 0)
//         button.css("display", "");
//     if (fromChild)
//     {
//         $(".tiny-wsp-menu").remove();
//         $(".wsp-toolbar").remove();
//     }
//     else {
//         $(".tiny-wsp-menu").css("display", "none");
//         $(".wsp-toolbar").css("margin", "")
//         .css("position", "")
//         .css("bottom", "")
//         .css("right", "")
//         .css("z-index", "");
//         $(".added-wsp-item").remove();
//     }
// }

// async function ChangeFrameWorkspace(_class)
// {
//     if (parent !== window)
//     {
//         parent.postMessage(ChangeMenu(false));
//         parent.postMessage({
//             message:"_ChangeFrameWorkspace()",
//             datas:_class
//         });
//         return;
//     }
//     else {
//         ChangeMenu(false);
//         await _ChangeFrameWorkspace(_class);
//     }
// }

// async function _ChangeFrameWorkspace(_class, editPos = true, hideOnlyWorkSpace = true)
// {
//     $(".wsp-object").css("display", "none");
//     $(".wsp-toolbar-item").removeClass("active");
//     $(".wsp-toolbar-item.wsp-agenda").addClass("active");

//     if (hideOnlyWorkSpace)
//         $(".workspace-frame").css("display", "none");
//     else
//         $(".mm-frame").css("display", "none");
//      const id = mm_st_OpenOrCreateFrame(_class, false);
//      await wait(() => rcmail.env.frame_created !== true);

//      if (editPos)
//         $("#" + id).css("display", "").parent().css("display", "").css("position", "absolute").css("height", "100%");

//     if ($("#layout-content").hasClass("workspace-frame"))
//         $("#layout-content").css("display", "");
//      rcmail.env.have_frame_positioned = true;
//      rcmail.set_busy(false);
//      rcmail.clear_messages();
// }

// var cumulativeOffset = function(element) {
//     var top = 0, left = 0;
//     do {
//         top += element.offsetTop  || 0;
//         left += element.offsetLeft || 0;
//         element = element.offsetParent;
//     } while(element);

//     return {
//         top: top,
//         left: left
//     };
// };

// function OpenHome()
// {
//     ChangeMenu(true, false, rcmail.env.wsp_from_child !== undefined)
//     if (rcmail.env.wsp_from_child !== undefined)
//         delete rcmail.env.wsp_from_child;
//     _OpenHome();
// }

// async function _OpenHome()
// {
//     $(".wsp-object").css("display", "none");
//     $(".wsp-home").css("display", "");
//     $(".wsp-toolbar-item").removeClass("active");
//     $(".wsp-toolbar-item.first").addClass("active");

//     await _ChangeFrameWorkspace("workspace", false, false);
//     $(".workspace-frame").css("display", "");
//     rcmail.env.workspace_menu_minified = false;
// }