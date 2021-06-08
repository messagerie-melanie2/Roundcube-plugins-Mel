function search_action(searchValue)
{
    const timeoutValue = 111;
    setTimeout(async () => {
        await wait(() => rcmail.busy);

        let item = $("#quicksearchbox").length === 0 ? $("#searchform") : $("#quicksearchbox");
        item.val(searchValue).parent().submit();
    }, timeoutValue);
}