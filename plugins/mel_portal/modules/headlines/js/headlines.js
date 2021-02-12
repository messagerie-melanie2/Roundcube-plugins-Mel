function headlines()
{
    console.log("headlines",rcmail.env.mp_headlines);
    $(".he1").html(header(rcmail.env.mp_headlines, "news", 0))
    $(".be1").html(body(rcmail.env.mp_headlines, "news", 0))
    $(".fe1").html(footer(rcmail.env.mp_headlines, "news", 0))
    $(".fe1").parent().append(add_signet());
    $(".he2").html(header(rcmail.env.mp_headlines, "fi"))
    $(".be2").html(body(rcmail.env.mp_headlines, "fi"))
    $(".fe2").html(footer(rcmail.env.mp_headlines, "fi"))
    $(".fe2").parent().append(add_signet());
}

function create_headline(data, head, index = null)
{
    return header(data, head, index) + "<br/>" + body(data, head, index) + "<br/>"  + footer(data, head, index);
}

function header(data, head, index = null)
{
    let tmp = index === null ? data[head].header : data[head][index].header;
    if (tmp === null || tmp === undefined)
        return "";
    else
        return tmp;
}

function body(data, head, index = null)
{
    let tmp = index === null ? data[head].body : data[head][index].body;
    if (tmp === null || tmp === undefined)
        return "";
    else
        return "<h3>" + tmp + "</h3>";
}

function footer(data, head, index = null)
{
    let tmp = index === null ? data[head].footer : data[head][index].footer;
    if (tmp === null || tmp === undefined)
        return "";
    else
        return tmp;
}

function add_signet()
{
    return `<i class="icofont-book-mark roundbadge signet"></i>`;
}


Main.Add(headlines); 