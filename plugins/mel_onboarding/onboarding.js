// Conserver en mémoire le onboarding courant
current_onboarding = null;

// Item courant
current_item = null;

// Dernier item modifié pour remettre le css
last_modified_item = null;

// Le css du dernier item modifié
last_item_css = null;

launched_onboarding = false;

// Conserver en mémoire le css de l'iframe
current_iframe_css = null;

let current_window = null;

if (window.rcmail) {
  rcmail.addEventListener('init', function (evt) {
    let current_task = rcmail.env.task;
    window.addEventListener('message', (e) => {
      if (e.data == 'onboarding') {
        rcmail.show_current_page_onboarding(current_task, true);
        parent.rcmail.env.hide_modal = 1;
      }
    });
    if (rcmail.env.action) {
      current_task += "-" + rcmail.env.action;
    }
    if (rcmail.env.help_page_onboarding[current_task]) {
      if (!rcmail.env.onboarding) {
        rcmail.show_current_page_onboarding(current_task);
      }
    }
  });
}

//Ouvre l'onboarding depuis la fenêtre d'assistance
rcube_webmail.prototype.current_page_onboarding = function (task) {
  window.help_popUp.close();
  var iframe = (parent ?? window).$('iframe.' + task + '-frame')[0];
  if (iframe) {
    (parent ?? window).document.getElementById(iframe.id).contentWindow.postMessage("onboarding")
  } else {
    (parent ?? window).rcmail.show_current_page_onboarding(task, true);
    (parent ?? window).rcmail.env.hide_modal = 1;
    // (parent ?? window).rcmail.onboarding_close(true)
  }
}


/**
 * Permet d'afficher l'onboarding de page courante en se basant sur la task
 */
rcube_webmail.prototype.show_current_page_onboarding = function (task, assistance = false) {
  let json_page = rcmail.env.help_page_onboarding[task];
  fetch(window.location.pathname + 'plugins/mel_onboarding/json/' + json_page, { credentials: "include", cache: "no-cache" }).then((res) => {
    res.text().then((json) => {
      json = json.replace("%%POSTER%%", location.protocol + '//' + location.host + location.pathname + '/plugins/mel_onboarding/thumbnail/' + task + '.png')
      json = json.replace("%%VIDEO%%", location.protocol + '//' + location.host + location.pathname + '/plugins/mel_onboarding/videos/Capsule-' + task + ".mp4")

      json = replaceImages(json);
// debugger
      window.current_onboarding = JSON.parse(json);
      current_window = rcmail.env.is_framed && task == "bureau" ? window.parent : window;

      if (task == "mail") {
        if (!assistance) {
          rcmail.addEventListener('responsebefore', function (props) {
            if (props.response && (props.response.action === 'list')) {
              if (!launched_onboarding) {
                rcmail.show_contentframe(true)
                current_window.startIntro(task);
                setTimeout(() => {
                  rcmail.show_message(Object.keys(rcmail.env.messages)[0], false, true);
                }, 250);
                launched_onboarding = true;
              }
            }
          });
        } else {
          rcmail.show_contentframe(true)
          current_window.startIntro(task);
          setTimeout(() => {
            rcmail.show_message(Object.keys(rcmail.env.messages)[0], false, true);
          }, 250);
        }
      } else if (rcmail.env.is_framed) {
        parent = startIntro(task, assistance)
      } else {
        startIntro(task, assistance);
      }
    });
  });
};

function startIntro(task, assistance = false) {
  window.exit_main_intro = true;
  window.exit_details_intro = true;
  let intro = current_window.introJs();

  if (task == "bureau" && rcmail.env.is_framed) {
    intro = bureau_intro(intro);
  } else {
    intro.setOptions({
      scrollToElement: window.current_onboarding.scrollToElement,
      scrollTo: window.current_onboarding.scrollTo,
      showBullets: window.current_onboarding.showBullets,
      disableInteraction: window.current_onboarding.disableInteraction,
      exitOnOverlayClick: window.current_onboarding.exitOnOverlayClick,
      // exitOnEsc: true,
      hidePrev: window.current_onboarding.hidePrev,
      nextLabel: window.current_onboarding.nextLabel,
      prevLabel: window.current_onboarding.prevLabel,
      doneLabel: window.current_onboarding.doneLabel,
      steps: window.current_onboarding.steps
    })
  }

  intro.onbeforechange(function () {
    //On ajoute le bouton permettant de lancer la démonstration
    let item = this._introItems[this._currentStep];
    if (item.button && !item.passed) {
      let buttonDetails = '<div class="text-left"><a href="#" class="float-right" id="' + item.id + '-details">' + item.button + '</a></div><br/>'

      item.intro += buttonDetails;
      item.passed = true;
    }

    if (item.hideButtons && !item.buttonPassed) {
      item.intro += "<div class='row'><div class='custom-tooltipbuttons mx-5 mb-3'>" + item.customButton + "</div></div>",
        item.buttonPassed = true;
    }

    //On skip l'intro si l'élément n'existe pas
    if (item.skippable) {
      if (!$(item.skipElement).length) {
        let step = intro._direction == "forward" ? 1 : -1;
        setTimeout(() => {
          intro.goToStepNumber(item.step + step);
        }, 10);
      }
    }
  }).onafterchange(function () {
    $('.introjs-tooltipbuttons').hide();

    setTimeout(() => {
      if (this._introItems[this._currentStep].hideButtons) {
        $('.introjs-tooltipbuttons').hide();

        $('#accueil').focus();

        $('#custom-next-button').on('click', function () {
          intro.nextStep();
        })
        $('#custom-previous-button').on('click', function () {
          intro.previousStep();
        })

        $('#custom-done-button').on('click', function () {
          intro.exit();
          send_notification();
        })
      }
      else {
        $('.introjs-tooltipbuttons').show();
      }

      if ($('#theme_select').length) {
        for (const key in MEL_ELASTIC_UI.themes) {
          if (Object.hasOwnProperty.call(MEL_ELASTIC_UI.themes, key)) {
            const theme = MEL_ELASTIC_UI.themes[key];
            let value = theme.id;
            let text = theme.displayed;//theme.name == 'default' ? 'Par défaut' : theme.name;
            $('#theme_select').append(new Option(text, value))
          }
        }

        //On ajoute le thème sombre manuellement
        $('#theme_select').append(new Option("Sombre", "Sombre"))

        if (MEL_ELASTIC_UI.color_mode() == 'dark') {
          $('#theme_select option[value="Sombre"]').prop('selected', true);
        }
        else {
          $('#theme_select option[value="' + MEL_ELASTIC_UI.get_current_theme() + '"]').prop('selected', true);
        }
      }

      $('#theme_select').on('change', function (e) {
        if (MEL_ELASTIC_UI.color_mode() != 'dark' && e.currentTarget.value == 'Sombre') {
          MEL_ELASTIC_UI.switch_color();
        }
        else {
          if (MEL_ELASTIC_UI.color_mode() == 'dark' && e.currentTarget.value != 'Sombre') {
            MEL_ELASTIC_UI.switch_color();
          }
          MEL_ELASTIC_UI.update_theme(e.currentTarget.value);
          $('#theme-panel .contents').find('.mel-selectable').removeClass('selected');
          $('#theme-panel .contents').find(`[data-name='${e.currentTarget.value}']`).addClass('selected');
        }
      })

      if (this._introItems[this._currentStep].passed) {
        let item = this._introItems[this._currentStep];
        current_window.$('#' + item.id + '-details').on('click', function () {
          if (item.details.hints) {
            intro_hints(item, intro);
          } else if (item.details.steps) {
            intro_details_tour(item, intro)
          }
        });
      }
    }, 400);
  }).onexit(function () {
    if (window.exit_main_intro) {
      return (parent ?? window).rcmail.onboarding_close()
    }
  }).start();

  if (assistance) {
    intro.goToStep(4);
  }
  addBulletTitle();
}

function bureau_intro(intro) {
  var iframe = (parent ?? window).$('iframe.bureau-frame')[0];
  let steps = window.current_onboarding.steps;
  intro.setOptions({
    scrollToElement: window.current_onboarding.scrollToElement,
    scrollTo: window.current_onboarding.scrollTo,
    showBullets: window.current_onboarding.showBullets,
    disableInteraction: window.current_onboarding.disableInteraction,
    exitOnOverlayClick: window.current_onboarding.exitOnOverlayClick,
    // exitOnEsc: true,
    hidePrev: window.current_onboarding.hidePrev,
    nextLabel: window.current_onboarding.nextLabel,
    prevLabel: window.current_onboarding.prevLabel,
    doneLabel: window.current_onboarding.doneLabel,
    steps: [steps[0], steps[1], steps[2],
    {
      "title": "Ma journée",
      "element": (parent ?? window).document.getElementById(iframe.id).contentWindow.document.querySelector("#myday"),
      "intro": "<br/>\"Ma journée\" permet de visualiser les rendez-vous de la journée ainsi que les tâches en cours. Si un rendez-vous possède un lien de visioconférence, ce lien sera directement cliquable depuis ce menu.",
      "tooltipClass": "iframed big-width-intro",
      "highlightClass": "iframed"
    },
    {
      "title": "Informations",
      "element": (parent ?? window).document.getElementById(iframe.id).contentWindow.document.querySelector(".--row.--row-dwp--under"),
      "intro": "<br/>\"Informations\" permet de visualiser les informations importantes diffusées par votre service ainsi que celles diffusées par votre ministère",
      "tooltipClass": "iframed big-width-intro",
      "highlightClass": "iframed"
    },
    {
      "title": "Mes espaces de travail",
      "element": (parent ?? window).document.getElementById(iframe.id).contentWindow.document.querySelector(".workspaces.module_parent"),
      "intro": "<br/>\"Mes espaces de travail\" vous affiche les trois derniers espaces de travail accessibles directement depuis le Bnum. Vous pouvez visualiser les informations de ces espaces et les ouvrir directement depuis ce menu.",
      "tooltipClass": "iframed big-width-intro",
      "highlightClass": "iframed",
      "tooltipPosition": "top"
    },
    {
      "title": "Discussion ",
      "element": ".tiny-rocket-chat",
      "intro": "Ce raccourci permet d'ouvrir directement votre onglet de discussion dans votre page d'accueil",
      "tooltipPosition": "top"
    }
    ]
  })

  return intro;
}

/**
 * Fermer l'onboarding
 */
rcube_webmail.prototype.onboarding_close = function (popup = false) {
debugger
  if (popup) {
    let buttons = [{
      text: rcmail.gettext('hide all help', 'mel_onboarding'),
      click: function () {
        rcmail.http_post('settings/plugin.set_onboarding', {
          _onboarding: true,
          _see_help_again: $('#see_help_again').is(":checked"),
        });
        $(this).closest('.ui-dialog-content').dialog('close');
      }
    },
    {
      text: rcmail.gettext('hide this help', 'mel_onboarding'),
      'class': 'mainaction text-white',
      click: function () {
        rcmail.http_post('settings/plugin.set_onboarding', {
          _onboarding: true,
          _see_help_again: $('#see_help_again').is(":checked"),
        });
        $(this).closest('.ui-dialog-content').dialog('close');
      }
    }
    ];


    let content = rcmail.gettext('to display this help again, you can go to', 'mel_onboarding') + "<button class='hide-touch help mel-before-remover mel-focus' onclick='m_mp_Help()' title=`Afficher l' aide`><span style='position:relative'>Assistance<span class='icon-mel-help question'></span></span></button><br /><br /><div class='custom-control custom-switch'><input type='checkbox' id='see_help_again' class='form-check-input custom-control-input' checked><label for='see_help_again' class ='custom-control-label' title=''>" + rcmail.gettext('Do not display this help again during my future connections', 'mel_onboarding') + "</label></div>";

    let title = rcmail.gettext('close help', 'mel_onboarding');
    // On n'ouvre pas la modal si l'onboarding est lancé depuis l'assistance
    if (!(parent ?? window).rcmail.env.hide_modal) {
      (parent ?? window).rcmail.show_popup_dialog(content, title, buttons, { height: 100 })
    }
    delete (parent ?? window).rcmail.env.hide_modal;
  }
  else { 
    rcmail.http_post('settings/plugin.set_onboarding', {
      _onboarding: true,
      _see_help_again: false,
    });
  }

};


function intro_hints(item, intro_main) {
  if (item.id === "navigation") {
    (parent ?? window).$('#layout-menu').addClass('force-open');
  }

  intro_main.setOptions({ exitOnEsc: false })

  let details = item.details;
  let intro = current_window.introJs();

  item.passed_hints = false;
  intro.removeHints();

  intro.setOptions({
    hintButtonLabel: details.hintButtonLabel,
    tooltipClass: details.tooltipClass,
    hints: Object.values(details.hints)
  }).onhintclose(function () {
    let nextStep = (parent ?? window).$('[data-step="' + (parseInt(this._currentStep) + 1) + '"]')
    if (nextStep.length && !nextStep.attr('class').includes('hidehint')) {
      intro.showHintDialog(parseInt(this._currentStep) + 1);
    }
  }).addHints();
  setTimeout(() => {
    intro.showHintDialog(0);
    if (details.hintClass) {
      current_window.$(".hide-hint").css('display', 'none');
      current_window.$(".introjs-hint-dot").addClass(details.hintClass);
    }
  }, 100);

  $(current_window.document).on('click', function (e) {
    if (!item.passed_hints) {
      if (current_window.$(e.target).attr('class') === "introjs-overlay") {
        intro.hideHints();
        if ((parent ?? window).$('#layout-menu').hasClass('force-open')) {
          (parent ?? window).$('#layout-menu').removeClass('force-open');
        }
        current_window.$(".hide-hint").css('display', 'block');
        item.passed_hints = true;
      }
    }
  });

  $(current_window.document).on('keyup', function (e) {
    if (e.key === "Escape") {
      intro.hideHints();
      if ((parent ?? window).$('#layout-menu').hasClass('force-open')) {
        (parent ?? window).$('#layout-menu').removeClass('force-open');
      }
      current_window.$(".hide-hint").css('display', 'block');
      item.passed_hints = true;
      intro_main.setOptions({ exitOnEsc: true })
    }
  });
}


function intro_details_tour(item, intro_main) {
  let intro_main_step = intro_main._currentStep;

  window.exit_main_intro = false;
  intro_main.exit();
  window.exit_main_intro = true;

  let details = item.details;
  let intro_details = current_window.introJs();

  intro_details.setOptions({
    nextLabel: details.nextLabel,
    prevLabel: details.prevLabel,
    doneLabel: details.doneLabel,
    tooltipClass: details.tooltipClass,
    steps: Object.values(details.steps)
  }).onbeforechange(function () {
    //On ajoute le bouton permettant de lancer la démonstration
    let item = this._introItems[this._currentStep];
    if (item.button && !item.passed) {
      let buttonDetails = '<div class="text-left"><button class="btn btn-secondary mt-4" id="' + item.id + '-details-open">' + item.button + '</button></div>'
      item.intro += buttonDetails;
      item.passed = true;
    }
    if (item.skip) {
      setTimeout(() => {
        intro_details.goToStepNumber(item.step + item.skip);
      }, 10);
    }

    if (item.checkSize) {
      if ($(item.elementSize).width() < item.maxSize) {
        this._introItems[this._currentStep + 1].skip = item.skipSize;
      } else {
        setTimeout(() => {
          intro_details.goToStepNumber(item.step + 1);
        }, 10);
      }
    }
  }).onafterchange(function () {
    setTimeout(() => {
      if (this._introItems[this._currentStep].passed) {
        let currentStep = this._introItems[this._currentStep];
        (parent ?? window).$('#' + this._introItems[this._currentStep].id + '-details-open').on('click', { intro_details, currentStep, stepNumber: this._currentStep }, intro_details_popup)
      }
    }, 500);
  }).onbeforeexit(function () {
    (parent ?? window).$("#otherapps").css("display", "none");
  }).onexit(function () {
    if (window.exit_details_intro) {
      intro_main.goToStep(intro_main_step + 1);
    }
  }).start();

  addBulletTitle();

}

function intro_details_popup(event) {
  //On ferme l'ancien introjs
  window.exit_details_intro = false;
  event.data.intro_details.exit();
  window.exit_details_intro = true;
  rcmail.env.hide_popup = false;

  //On déclenche l'évènement spécifique a l'item
  switch (event.data.currentStep.popup) {
    case "Create":
      (parent ?? window).m_mp_Create();
      break;
    case "Help":
      (parent ?? window).m_mp_Help()
      break;
    case "Shortcut":
      (parent ?? window).m_mp_shortcuts()
      break;
    case "User":
      setTimeout(() => {
        (parent ?? window).$("#groupoptions-user").show();
      }, 100);
      break;
    default:
      break;
  }

  let intro_details;

  intro_details = (parent ?? window).introJs();
  setTimeout(function () {
    if (event.data.currentStep.details.hints) {
      intro_popup_hint(event, intro_details);
    } else {
      intro_popup_tour(event, intro_details);
    }
  }, 400);
}

function intro_popup_tour(event, intro_details) {
  let details = event.data.currentStep.details
  intro_details.setOptions({
    tooltipClass: details.tooltipClass,
    nextLabel: details.nextLabel,
    prevLabel: details.prevLabel,
    doneLabel: details.doneLabel,
    steps: Object.values(details.steps)
  });
  intro_details.start()
  intro_details.onexit(function () {
    switch (event.data.currentStep.popup) {
      case "Create":
        (parent ?? window).create_popUp.close();
        break;
      case "Help":
        (parent ?? window).help_popUp.close();
        break;
      case "Shortcut":
        (parent ?? window).$('.fullscreen-close').trigger("click");
        break;
      case "User":
        (parent ?? window).$("#groupoptions-user").hide();
        break;
      default:
        break;
    }
    goToNextIntroStep(event)
  });
  addBulletTitle();

}

function goToNextIntroStep(event) {
  event.data.intro_details.goToStepNumber(event.data.stepNumber + 2)
}

function addBulletTitle() {
  let bullets = $(".introjs-bullets ul li a");
  for (let i = 0; i < bullets.length; i++) {
    const element = bullets[i];
    $(element).attr('aria-label', $(element).data('title'));
    $(element).attr('role', 'tab');
  }
}

function replaceImages(json) {
  let imageReplace = json.match(/(?<=%%)([A-Z_]*?)(?=%%)/g);
  imageReplace.forEach(image => {
    let imageSplit = image.split('_');
    let imageName = imageSplit[0].toLowerCase();
    let imageFormat = imageSplit[1].toLowerCase();
    json = json.replace('%%' + image + '%%', location.protocol + '//' + location.host + location.pathname + '/plugins/mel_onboarding/images/' + imageName + '.' + imageFormat)
  });
  return json;
}

function send_notification() {
  top.rcmail.triggerEvent('plugin.push_notification', {
    uid: 'help-' + Math.random(),
    title: "Aide interactive",
    content: "Retrouvez votre aide interactive sur le bouton 'Aide de la page'",
    category: 'onboarding',
    action: [
      {
        href: 'javascript:void(0)',
        title: "Cliquez ici pour ouvrir l'aide",
        text: "Lancer l'aide",
        command: "open_help",
      }
    ],
    created: Math.floor(Date.now() / 1000),
    modified: Math.floor(Date.now() / 1000),
    isread: false,
    local: true,
  });
};