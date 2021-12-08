$(document).ready(async () => {

    if (window.wait === undefined)
    {
        window.wait = async function (func, waitTime = 500)
                    {
                        while ((func.constructor.name === "AsyncFunction" ? await func() : func()))
                        {
                            await new Promise(res => setTimeout(res, waitTime));
                        }
                    }
    }

    let it = 0;
    await wait(() => {
        if (it++ > 5)
            return false;

        return rcmail.editor === undefined || rcmail.editor === null || rcmail.editor.editor === null;
    });

    if (rcmail.editor === undefined || rcmail.editor === null || rcmail.editor.editor === null)
        return;

    function updateEditor()
    {
        const dark = 'dark';
        if (MEL_ELASTIC_UI.color_mode() === dark && rcmail.editor._conf.content_css !== dark) rcmail.editor.update_to_dark();
        else if (MEL_ELASTIC_UI.color_mode() !== dark && rcmail.editor._conf.content_css === dark) rcmail.editor.restart();
    }

    updateEditor();

    rcmail.addEventListener("switched_color_theme" ,(c) => {
        updateEditor();
    });


});