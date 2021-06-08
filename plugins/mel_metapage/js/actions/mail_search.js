function search_action(searchValue)
{
    const timeoutValue = 111;
    setTimeout(async () => {
        await wait(() => rcmail.busy);
        $("#mailsearchform").val(searchValue).parent().submit();
    }, timeoutValue);
}