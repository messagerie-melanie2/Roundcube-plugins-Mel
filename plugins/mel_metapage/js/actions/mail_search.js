function search_action(searchValue, activeFields = [])
{
    const timeoutValue = 1;
    setTimeout(async () => {
        await wait(() => rcmail.busy);
        console.log("search", searchValue);

        let fields = {
            subject:$("#icochk1")[0],
            from:$("#icochk2")[0],
            to:$("#icochk3")[0],
            cc:$("#icochk4")[0],
            bcc:$("#icochk5")[0],
            body:$("#icochk6")[0],
            mail:$("#icochk7")[0],
            //searchfilter:$("#searchfilter"),
        }

        for (const key in fields) {
            if (Object.hasOwnProperty.call(fields, key)) {
                var element = fields[key];
                //console.log("array", element, key, element.checked !== undefined, activeFields.includes(key));
                if (element.checked !== undefined)
                {
                    if ((activeFields.includes(key) && !element.checked) || 
                    (!activeFields.includes(key) && element.checked))
                        $(`#${element.id}`)[0].click();//checked = activeFields.includes(key); 
                    //}, 100);
                    //console.log($(`#${element.id}`)[0],$(`#${element.id}`)[0].checked );
                }
            }
        }

        //console.log("e", activeFields, fields);

        setTimeout(() => {
            $("#mailsearchform").val(searchValue).parent().submit();
        }, timeoutValue);
    }, timeoutValue);
}