// Conserver en mémoire le onboarding courant
current_onboarding = null;

// Item courant
current_item = null;

// Dernier item modifié pour remettre le css
last_modified_item = null;

// Le css du dernier item modifié
last_item_css = null;


if (window.rcmail) {
    rcmail.addEventListener('init', function(evt) {
        rcmail.show_current_page_onboarding();
    });
}

/**
 * Permet d'afficher l'onboarding de page courante en se basant sur la task
 */
rcube_webmail.prototype.show_current_page_onboarding = function() {
    fetch('/bureau/plugins/mel_onboarding/json/' + this.env.task + '.json', {credentials: "include", cache: "no-cache"}).then((res) => {
        res.text().then((json) => {
            window.current_onboarding = JSON.parse(json);

            let html = $('<div id="dimScreen"></div>');
            html.append($('<h1>' + window.current_onboarding.title + '</h1>'));

            // Gestion du padding ?
            if (window.current_onboarding.addpadding) {
                let div = $('<div class="onboarding-padding"></div>');
                div.attr('style', 'height: 60em;');
                console.log('Addpadding : ' + window.current_onboarding.addpadding);
                $(window.current_onboarding.addpadding).append(div);
            }

            let first_item = null;

            if (window.current_onboarding.stepper) {
                let stepper = $('<div class="blocnavigation"></div>');
                stepper.append($('<h2>' + window.current_onboarding.stepper.title + '</h2>'));

                let div = $('<div class="wrapper option-1 option-1-1"></div>');
                let ol = $('<ol class="c-stepper">');
                let first = true;
                let i = 0;

                for (const key in window.current_onboarding.stepper.items) {
                    if (Object.hasOwnProperty.call(window.current_onboarding.stepper.items, key)) {
                        const element = window.current_onboarding.stepper.items[key];
                        
                        // Affichage de l'élément dans la navigation
                        let li = $('<li class="c-stepper__item ' + key + '"></li>');
                        li.append($('<h3 class="c-stepper__title">' + element.title + '</h3>'));
                        li.append($('<p class="c-stepper__desc">' + element.description + '</p>'));

                        i++;
                        if (first) {
                            first_item = key;
                            window.current_onboarding.stepper.items[key].first = true;
                            first = false;
                        }
                        if (Object.keys(window.current_onboarding.stepper.items).length == i) {
                            window.current_onboarding.stepper.items[key].last = true;
                        }
                       

                        // Gestion du onclick
                        li.click(function() {
                            let item = $(this).attr('class').replace(/c-stepper__item/, '').replace(/active/, '').trim();
                            rcmail.onboarding_show_item(item);
                        });

                        ol.append($(li));

                        // Bloc d'affichage de l'élément
                        let bloc = $('<div class="bloc ' + key + '"></div>');
                        bloc.append($('<h2>' + element.bloc.title + '</h2>'));
    
                        if (element.bloc.video) {
                            bloc.append($('<div class="video"><img title="' + element.bloc.title + '" src="/bureau/plugins/mel_onboarding/images/' + element.bloc.img + '" /></div>'));
                        }
                        if (element.bloc.description) {
                            bloc.append($('<div class="description">' + element.bloc.description + '</div>'));
                        }

                        html.append(bloc);
                    }
                }
                div.append(ol);
                stepper.append(div);

                // Ajout des boutons
                let buttonPrevious = $('<button class="btn btn-secondary btn-onboarding-previous">' + rcmail.gettext('previous') + '</button>');
                buttonPrevious.click(function() {
                    if (!$(this).hasClass('disabled')) {
                        let previousItem = rcmail.onboarding_get_previous_item();
                        if (previousItem) {
                            rcmail.onboarding_show_item(previousItem);
                        }
                    }
                });
                stepper.append(buttonPrevious);

                let buttonNext = $('<button class="btn btn-secondary btn-onboarding-next">' + rcmail.gettext('next') + '</button>');
                buttonNext.click(function() {
                    if (!$(this).hasClass('disabled')) {
                        let nextItem = rcmail.onboarding_get_next_item();
                        if (nextItem) {
                            rcmail.onboarding_show_item(nextItem);
                        }
                    }
                });
                stepper.append(buttonNext);

                let buttonClose = $('<button class="btn btn-secondary btn-onboarding-close">' + rcmail.gettext('close') + '</button>');
                buttonClose.click(function() {
                    rcmail.onboarding_close();
                });
                stepper.append(buttonClose);
                stepper.append($('<div><label><input type="checkbox"> Ne plus afficher cette aide au démarrage (elle reste accessible depuis le bouton Assistance)</label></div>'));

                html.append(stepper);
            }
            else {
                let button = $('<button class="btn btn-secondary btn-onboarding-close">' + rcmail.gettext('close') + '</button>');
                button.click(function() {
                    rcmail.onboarding_close();
                });
                html.append(button);
                html.append($('<div><label><input type="checkbox"> Ne plus afficher cette aide au démarrage (elle reste accessible depuis le bouton Assistance)</label></div>'));
            }
            $("#layout").after(html);

            if (first_item) {
                rcmail.onboarding_show_item(first_item);
            }
        });
    });
};

/**
 * Permet d'afficher l'item courant
 */
 rcube_webmail.prototype.onboarding_show_item = function(item) {
    console.log("onboarding_show_item : " + item);
    // Réinitialiser l'ancien item
    if (window.last_modified_item) {
        $(window.last_modified_item).attr('style', window.last_item_css);
        
    }
    // Mettre à jour le nouvel item
    if (window.current_onboarding.stepper.items[item]) {
        window.current_item = item;

        $('#dimScreen .c-stepper__item').removeClass('active');
                            
        $('#dimScreen > div.bloc').hide();
        $('#dimScreen > div.bloc.' + item).show();

        $('#dimScreen .c-stepper__item.' + item).prevAll().addClass('active');
        $('#dimScreen .c-stepper__item.' + item).addClass('active');

        // Gérer les boutons
        $('#dimScreen .btn-onboarding-next').removeClass('disabled');
        $('#dimScreen .btn-onboarding-previous').removeClass('disabled');
        if (window.current_onboarding.stepper.items[item].last) {
            $('#dimScreen .btn-onboarding-next').addClass('disabled');
        }
        if (window.current_onboarding.stepper.items[item].first) {
            $('#dimScreen .btn-onboarding-previous').addClass('disabled');
            $('#dimScreen > h1').show();
        }
        else {
            $('#dimScreen > h1').hide();
        }

        // Mettre en surbrillance l'objet associé
        if (window.current_onboarding.stepper.items[item].highlight) {
            console.log("onboarding_show_item highlight : " + window.current_onboarding.stepper.items[item].highlight);
            window.last_modified_item = window.current_onboarding.stepper.items[item].highlight;
            window.last_item_css = $(window.current_onboarding.stepper.items[item].highlight).attr('style');

            if (window.last_item_css == null) {
                window.last_item_css = '';
            }

            let css = "z-index: 1001; box-shadow: 1px 1px 10px 1px rgba(255, 255, 255, 0.7);";
            if (window.current_onboarding.stepper.items[item].css) {
                css = window.current_onboarding.stepper.items[item].css;
            }
            $(window.current_onboarding.stepper.items[item].highlight).attr('style', window.last_item_css + css);

            if (window.current_onboarding.stepper.items[item].bloccss) {
                $('#dimScreen > div.bloc.' + item).attr('style', window.current_onboarding.stepper.items[item].bloccss);
            }

            if (window.current_onboarding.stepper.items[item].scrollto) {
                let element = $(window.current_onboarding.stepper.items[item].highlight).get(0);
                element.scrollIntoView();
            }
        }
    }
    else {
        window.last_modified_item = null;
        window.last_item_css = null;
    }
};

/**
 * Récupérer l'item après le courant
 */
rcube_webmail.prototype.onboarding_get_next_item = function() {
    let nextItem = null;

    // Vérifie que ce n'est pas le dernier
    if (!window.current_onboarding.stepper.items[window.current_item].last) {
        let keys = Object.keys(window.current_onboarding.stepper.items);
        let nextIndex = keys.indexOf(window.current_item) + 1;
        nextItem = keys[nextIndex];
    }
    return nextItem;
};

/**
 * Récupérer l'item avant le courant
 */
rcube_webmail.prototype.onboarding_get_previous_item = function() {
    let prevItem = null;

    // Vérifie que ce n'est pas le premier
    if (!window.current_onboarding.stepper.items[window.current_item].first) {
        let keys = Object.keys(window.current_onboarding.stepper.items);
        let prevIndex = keys.indexOf(window.current_item) - 1;
        prevItem = keys[prevIndex];
    }
    return prevItem;
};

/**
 * Fermer l'onboarding
 */
rcube_webmail.prototype.onboarding_close = function() {
    $('#dimScreen').remove();

    // Gestion du padding ?
    if (window.current_onboarding.addpadding) {
        $('.onboarding-padding').remove();
    }
};
