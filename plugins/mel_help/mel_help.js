var handle;
let initial_modal_height;

rcube_webmail.prototype.help_search = function(event, object) {
    _search = rcmail.env.help_array;
    _index = rcmail.env.help_index;

    if (!initial_modal_height) {
        initial_modal_height = $(".global-modal-body").css("height");
    }

    if (event.keyCode == 27) {
        object.value = "";
        document.getElementById("help-search-results").innerHTML = "";
        document.getElementById("help-search-results").style = "display: none;";
        return;
    }
    var results = {};
    if (object.value.length > 3) {
        if (handle) {
            clearTimeout(handle);
        }
        handle = setTimeout(function() {
            document.getElementById("noresulthelp").style.display = "block";
            var values = object.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(' ');
            for (const word in _index) {
                for (const value of values) {
                    if (value.length > 3) {
                        if (word.indexOf(value) !== -1) {
                            for (const key of _index[word]) {
                                if (results[key]) {
                                    results[key]++;
                                } else {
                                    results[key] = 1;
                                }
                            }
                        }
                    }
                }
            }
            if (Object.keys(results).length) {
                var _res = [];
                // Trier les résultats
                for (const key in results) {
                    _res.push({ key: key, value: results[key] });
                }
                _res.sort((a, b) => (a.value < b.value) ? 1 : -1)
                document.getElementById("help-search-results").style = "display: block;";
                document.getElementById("help-search-results").innerHTML = "";

                var i = 0;
                for (const r of _res) {
                    if (i++ > 4) {
                        break;
                    }
                    // A href for url
                    var url = document.createElement('a');
                    url.href = _search[r.key].action_url && !rcmail.env.ismobile ? _search[r.key].action_url : _search[r.key].help_url;
                    url.target = "_blank";
                    url.title = _search[r.key].description;
                    // Title
                    var title = document.createElement('span');
                    title.className = "title";
                    title.textContent = _search[r.key].title;
                    url.appendChild(title);
                    // Description
                    if (_search[r.key].description) {
                        var description = document.createElement('span');
                        description.className = "description";
                        description.innerHTML = _search[r.key].description;
                        url.appendChild(description);
                    }
                    // Numbers
                    var numbers = document.createElement('span');
                    numbers.className = "numbers";
                    numbers.textContent = r.value === 1 ? "(1)" : "(" + r.value + ")";
                    url.appendChild(numbers);
                    // Buttons
                    var buttons = document.createElement('div');
                    buttons.className = "buttons"
                        // Help url button
                    if (_search[r.key].help_url) {
                        var help_url = document.createElement('a');
                        help_url.href = _search[r.key].help_url;
                        help_url.target = "_blank";
                        help_url.title = _search[r.key].help_title;
                        // help_url.className = "help button";
                        help_url.className = "hide-touch mel-button no-button-margin mel-before-remover mel-focus btn btn-secondary";
                        help_url.innerHTML = _search[r.key].help_name ? "<span class='icon-mel-help mr-2'></span>" + _search[r.key].help_name : "<span class='icon-mel-help mr-2'></span>" + rcmail.get_label('help search open', 'mel_help');
                        buttons.appendChild(help_url);
                    }
                    // Url button
                    if (_search[r.key].action_url && !rcmail.env.ismobile) {
                        var action_url = document.createElement('a');
                        action_url.href = _search[r.key].action_url;
                        action_url.target = "_blank";
                        action_url.title = _search[r.key].action_title;
                        // action_url.className = _search[r.key].action_class ? (_search[r.key].action_class + " button") : "action button";
                        action_url.className = "hide-touch bckg mel-button no-button-margin mel-before-remover mel-focus btn btn-secondary ml-4";
                        action_url.innerHTML = _search[r.key].action_class ? "<span class='icon-mel-" + _search[r.key].action_class + " mr-2'></span>" + _search[r.key].action_name : "<span class='icon-mel-parameters-invert mr-2'></span>" + _search[r.key].action_name;
                        buttons.appendChild(action_url);
                    }
                    url.appendChild(buttons);
                    var result = document.createElement('div');
                    result.className = "result";
                    result.appendChild(url);
                    document.getElementById("help-search-results").appendChild(result);
                    $(".global-modal-body").css("height", `${window.innerHeight - 200}px`).css("overflow-y", "auto").css("overflow-x", "hidden");

                }
            } else {
                document.getElementById("help-search-results").style = "display: block; text-align: center;";
                document.getElementById("help-search-results").innerHTML = "<p style='font-size:1.2rem'>" + rcmail.get_label('help search no result', 'mel_help') + "</p>";
                document.getElementById("help-search-results").innerHTML += "<br/>";
                document.getElementById("help-search-results").innerHTML += "<p>" + rcmail.get_label('help no result', 'mel_help') + "</p>";
                document.getElementById("help-search-results").innerHTML += "<br/>";
                // document.getElementById("help-search-results").innerHTML += "<button class='hide-touch mel-button bckg no-button-margin mel-before-remover mel-focus btn btn-secondary' onclick='window.open(`" + rcmail.env.help_channel_support + "`, `_blank`)'>Ouvrir le salon de discussion<span class='icon-mel-unreads ml-3'></span></button>";
                document.getElementById("help-search-results").innerHTML += "<button class='hide-touch mel-button bckg no-button-margin mel-before-remover mel-focus btn btn-secondary' onclick='rcmail.help_redirect()'>Ouvrir le salon de discussion<span class='icon-mel-unreads ml-3'></span></button>";
                $(".global-modal-body").css("height", initial_modal_height).css("overflow-y", "auto").css("overflow-x", "hidden");

            }
        }, 300);
    } else {
        document.getElementById("help-search-results").innerHTML = "";
        document.getElementById("help-search-results").style = "display: none;";
        document.getElementById("noresulthelp").innerHTML = "";
        document.getElementById("noresulthelp").style = "display: none;";
        $(".global-modal-body").css("height", initial_modal_height).css("overflow-y", "auto").css("overflow-x", "hidden");


    }
}


rcube_webmail.prototype.help_redirect = function() {
    help_popUp.close();
    mel_metapage.Functions.change_frame('rocket', true, true).then(() => {
        parent.$('.discussion-frame')[0].contentWindow.postMessage({
            externalCommand: 'go',
            path: `/channel/Bnum-infos`
        }, '*')
    });
};

rcube_webmail.prototype.video_search = function(event, object) {
    _search = rcmail.env.video_array;
    _index = rcmail.env.video_index;

    if (event.keyCode == 27) {
        object.value = "";
        document.getElementById("video-search-results").innerHTML = "";
        document.getElementById("video-search-results").style = "display: none;";
        return;
    }
    var results = {};
    if (object.value.length > 3) {
        if (handle) {
            clearTimeout(handle);
        }
        handle = setTimeout(function() {
            document.getElementById("noresultvideo").style.display = "block";
            var values = object.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(' ');
            for (const word in _index) {
                for (const value of values) {
                    if (value.length > 3) {
                        if (word.indexOf(value) !== -1) {
                            for (const key of _index[word]) {
                                if (results[key]) {
                                    results[key]++;
                                } else {
                                    results[key] = 1;
                                }
                            }
                        }
                    }
                }
            }
            if (Object.keys(results).length) {
                var _res = [];
                // Trier les résultats
                for (const key in results) {
                    _res.push({ key: key, value: results[key] });
                }
                _res.sort((a, b) => (a.value < b.value) ? 1 : -1)
                document.getElementById("video-search-results").style = "display: block;";
                document.getElementById("video-search-results").innerHTML = "";

                var i = 0;
                for (const r of _res) {
                    if (i++ > 4) {
                        break;
                    }
                    let json_video = rcmail.env.help_video[_search[r.key].video];

                    let ul = document.createElement('ul');
                    ul.className = "row ignore-bullet";


                    let video = document.createElement('li');
                    video.className = "col-sd-12 col-md-12";
                    video.title = "Cliquer ici pour voir la video";
                    ul.appendChild(video);

                    let button = document.createElement('button');
                    button.className = "btn btn-block btn-secondary btn-mel text-left";
                    button.onclick = function() {
                        rcmail.m_mp_help_video_player(_search[r.key].video);
                    }
                    video.appendChild(button);

                    let row = document.createElement('div');
                    row.className = "row";
                    button.appendChild(row);

                    let image_col = document.createElement('div');
                    image_col.className = "col-4";
                    row.appendChild(image_col);

                    let image = document.createElement('img');
                    image.className = "img-fluid rounded-start";
                    image.src = location.protocol + '//' + location.host + location.pathname + '/plugins/mel_onboarding/images/' + json_video.poster;
                    image_col.appendChild(image);

                    let text_col = document.createElement('div');
                    text_col.className = "col-8";
                    row.appendChild(text_col);

                    let title = document.createElement('h2');
                    title.textContent = json_video.title;
                    text_col.appendChild(title);

                    let description = document.createElement('p');
                    description.textContent = json_video.description;
                    text_col.appendChild(description);

                    var result = document.createElement('div');
                    result.className = "result";
                    result.appendChild(ul);

                    document.getElementById("videolist").style = "display: none;";

                    document.getElementById("video-search-results").appendChild(result);
                    $(".global-modal-body").css("height", `${window.innerHeight - 200}px`).css("overflow-y", "auto").css("overflow-x", "hidden");

                }
            } else {
                document.getElementById("videolist").style = "display: none;";
                document.getElementById("video-search-results").style = "display: block; text-align: center;";
                document.getElementById("video-search-results").innerHTML = "<p style='font-size:1.2rem'>" + rcmail.get_label('video search no result', 'mel_help') + "</p>";
                document.getElementById("video-search-results").innerHTML += "<br/>";
                // document.getElementById("video-search-results").innerHTML += "<button class='hide-touch mel-button bckg no-button-margin mel-before-remover mel-focus btn btn-secondary' onclick='window.open(`" + rcmail.env.video_channel_support + "`, `_blank`)'>Ouvrir le salon de discussion<span class='icon-mel-unreads ml-3'></span></button>";


            }
        }, 300);
    } else {
        document.getElementById("videolist").style = "display: block;";

        document.getElementById("video-search-results").innerHTML = "";
        document.getElementById("video-search-results").style = "display: none;";
        document.getElementById("noresultvideo").innerHTML = "";
        document.getElementById("noresultvideo").style = "display: none;";


    }
}