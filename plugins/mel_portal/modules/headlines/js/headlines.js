(() => {
function headlines()
{
    //console.log("headlines",rcmail.env.mp_headlines);
    $(".he1").parent().html(create_headline(rcmail.env.mp_headlines, 0));
    // $(".be1").html(body(rcmail.env.mp_headlines, "news", 0))
    // $(".fe1").html(footer(rcmail.env.mp_headlines, "news", 0))
    //$(".fe1").parent().append(add_signet());
     $(".he2").parent().html(create_headline(rcmail.env.mp_headlines, 1));
    // $(".be2").html(body(rcmail.env.mp_headlines, "fi"))
    // $(".fe2").html(footer(rcmail.env.mp_headlines, "fi"))
    //$(".fe2").parent().append(add_signet());
}

function create_headline(datas, index)
{
    return by(datas, index) + title(datas, index) + publishAt(datas, index) + contents(datas, index);
}

function by(datas, index)
{
    return '<p class=headlines-by>Information '+datas[index].by+'</p>'
}

function title(datas, index)
{
    return '<h3 class=headlines-title>'+datas[index].title+'</h3>'
}

function publishAt(datas, index)
{
    const date = moment(datas[index].date);
    let html = '<p class=headlines-publish>';
    if (date._isValid)
        html += "Publié le " + GetDateFr(date.format("dddd DD MMMM YYYY"));
    return html + "</p>";
}

function contents(datas, index)
{
    return '<p class=headlines-contents>'+datas[index].contents+'</p>'
}

// function header(data, head, index = null)
// {
//     let tmp = index === null ? data[head].header : data[head][index].header;
//     if (tmp === null || tmp === undefined)
//         return "";
//     else
//         return tmp;
// }

// function body(data, head, index = null)
// {
//     let tmp = index === null ? data[head].body : data[head][index].body;
//     if (tmp === null || tmp === undefined)
//         return "";
//     else
//         return "<h3>" + tmp + "</h3>";
// }

// function footer(data, head, index = null)
// {
//     let tmp = index === null ? data[head].footer : data[head][index].footer;
//     if (tmp === null || tmp === undefined)
//         return "";
//     else
//         return tmp;
// }

function add_signet()
{
    return `<i class="icofont-book-mark roundbadge signet"></i>`;
}

function GetDateFr(date)
{
    const capitalize = (s) => {
        if (typeof s !== 'string') return ''
        s = s.toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1)
      }
    const arrayTransform = {
        "MONDAY":"LUNDI",
        "TUESDAY":"MARDI",
        "WEDNESDAY":"MERCREDI",
        "THURSDAY":"JEUDI",
        "FRIDAY":"VENDREDI",
        "SATURDAY":"SAMEDI",
        "SUNDAY":"DIMANCHE",
        "JANUARY":"JANVIER",
        "FEBRUARY":"FÉVRIER",
        "MARCH":"MARS",
        "APRIL":"AVRIL",
        "MAY":"MAI",
        "JUNE":"JUIN",
        "JULY":"JUILLET",
        "AUGUST":"AOÛT",
        "SEPTEMBER":"SEPTEMBRE",
        "OCTOBER":"OCTOBRE",
        "NOVEMBER":"NOVEMBRE",
        "DECEMBER":"DECEMBRE"
    }
    date = date.toUpperCase();
    for (const key in arrayTransform) {
        if (Object.hasOwnProperty.call(arrayTransform, key)) {
            const element = arrayTransform[key];
            if (date.includes(key))
                date = date.replace(key, element);
        }
    }
    return capitalize(date);
}

Main.Add(headlines); 
})();