async function search_action(searchValue, activeFields = [])
{
    const timeoutValue = 1;
    setTimeout(async () => {
        await wait(() => rcmail.busy);

        let fields = {
            subject:$("#icochk1")[0],
            from:$("#icochk2")[0],
            to:$("#icochk3")[0],
            cc:$("#icochk4")[0],
            bcc:$("#icochk5")[0],
            body:$("#icochk6")[0],
            mail:$("#icochk7")[0],
        }

        for (const key in fields) {
            if (Object.hasOwnProperty.call(fields, key)) {
                var element = fields[key];

                if (element.checked !== undefined)
                {
                    if ((activeFields.includes(key) && !element.checked) || 
                    (!activeFields.includes(key) && element.checked)) $(`#${element.id}`)[0].click()
                }
            }
        }

        setTimeout(() => {
            $("#mailsearchform").val(searchValue);
            const params = {
                _q: searchValue,
                _headers: activeFields.join(','),
                _filter: "ALL",
                _scope: "base",
                _mbox: "INBOX"
              };
              rcmail.clear_message_list();
              let lock = rcmail.set_busy(true, 'searching');
              rcmail.http_request('search', params, lock);
        }, timeoutValue);
    }, timeoutValue);
}