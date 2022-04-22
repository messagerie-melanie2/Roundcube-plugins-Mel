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
        window.parent.rcmail.env.hide_modal = 1;
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
  // window.parent.help_popUp.close();
  window.help_popUp.close();
  var iframe = window.parent.$('iframe.' + task + '-frame')[0];
  if (iframe) {
    window.parent.document.getElementById(iframe.id).contentWindow.postMessage("onboarding")
  } else {
    window.parent.rcmail.show_current_page_onboarding(task, true);
    window.parent.rcmail.env.hide_modal = 1;
  }
}


/**
 * Permet d'afficher l'onboarding de page courante en se basant sur la task
 */
rcube_webmail.prototype.show_current_page_onboarding = function (task, assistance = false) {
  let json_page = rcmail.env.help_page_onboarding[task];
  fetch(window.location.pathname + 'plugins/mel_onboarding/json/' + json_page, { credentials: "include", cache: "no-cache" }).then((res) => {
    res.text().then((json) => {
      json = json.replace("%%POSTER%%", location.protocol + '//' + location.host + location.pathname + '/plugins/mel_onboarding/images/' + task + '.png')
      json = json.replace("%%VIDEO%%", location.protocol + '//' + location.host + location.pathname + '/plugins/mel_onboarding/videos/Capsule-' + task + ".mp4")
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
        window.parent = startIntro(task)
      } else {
        startIntro(task);
      }
    });
  });
};

function startIntro(task) {
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
      let buttonDetails = '<div class="text-left"><button class="mel-button btn btn-secondary float-right" id="' + item.id + '-details">' + item.button + '</button></div><br/><br/><br/>'

      this._introItems[this._currentStep].intro += buttonDetails;
      this._introItems[this._currentStep].passed = true;
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
    setTimeout(() => {
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
    }, 500);
  }).onexit(function () {
    if (window.exit_main_intro) {
      return window.parent.rcmail.onboarding_close()
    }
  }).start();

  addBulletTitle();
}

function bureau_intro(intro) {
  var iframe = window.parent.$('iframe.bureau-frame')[0];
  let steps = window.current_onboarding.steps;
  intro.setOptions({
    scrollToElement: window.current_onboarding.scrollToElement,
    scrollTo: window.current_onboarding.scrollTo,
    disableInteraction: window.current_onboarding.disableInteraction,
    exitOnOverlayClick: window.current_onboarding.exitOnOverlayClick,
    nextLabel: window.current_onboarding.nextLabel,
    prevLabel: window.current_onboarding.prevLabel,
    doneLabel: window.current_onboarding.doneLabel,
    steps: [steps[0], steps[1], steps[2],
    {
      "title": "Ma journée",
      "element": window.parent.document.getElementById(iframe.id).contentWindow.document.querySelector("#myday"),
      "intro": "<br/>\"Ma journée\" permet de visualiser les rendez-vous de la journée ainsi que les tâches en cours. Si un rendez-vous possède un lien de visioconférence, ce lien sera directement cliquable depuis ce menu.",
      "tooltipClass": "iframed big-width-intro",
      "highlightClass": "iframed"
    },
    {
      "title": "Informations",
      "element": window.parent.document.getElementById(iframe.id).contentWindow.document.querySelector(".--row.--row-dwp--under"),
      "intro": "<br/>\"Informations\" permet de visualiser les informations importantes diffusées par votre service ainsi que celles diffusées par votre ministère",
      "tooltipClass": "iframed big-width-intro",
      "highlightClass": "iframed"
    },
    {
      "title": "Mes espaces de travail",
      "element": window.parent.document.getElementById(iframe.id).contentWindow.document.querySelector(".workspaces.module_parent"),
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
rcube_webmail.prototype.onboarding_close = function () {

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
  if (!window.parent.rcmail.env.hide_modal) {
    window.parent.rcmail.show_popup_dialog(content, title, buttons, { height: 100 })
  }
  delete window.parent.rcmail.env.hide_modal;
};


function intro_hints(item, intro_main) {
  if (item.id === "navigation") {
    window.parent.$('#layout-menu').addClass('force-open');
  }

  // window.exit_main_intro = false;
  // intro_main.exit();
  // window.exit_main_intro = true;

  let details = item.details;
  let intro = current_window.introJs();

  item.passed_hints = false;
  intro.removeHints();

  intro.setOptions({
    hintButtonLabel: details.hintButtonLabel,
    tooltipClass: details.tooltipClass,
    hints: Object.values(details.hints)
  }).onhintclose(function () {
    let nextStep = window.parent.$('[data-step="' + (parseInt(this._currentStep) + 1) + '"]')
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
        if (window.parent.$('#layout-menu').hasClass('force-open')) {
          window.parent.$('#layout-menu').removeClass('force-open');
        }
        current_window.$(".hide-hint").css('display', 'block');
        item.passed_hints = true;
      }
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
        window.parent.$('#' + this._introItems[this._currentStep].id + '-details-open').on('click', { intro_details, currentStep, stepNumber: this._currentStep }, intro_details_popup)
      }
    }, 500);
  }).onbeforeexit(function () {
    window.parent.$("#otherapps").css("display", "none");
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
      window.parent.m_mp_Create();
      break;
    case "Help":
      window.parent.m_mp_Help()
      break;
    case "Shortcut":
      window.parent.m_mp_shortcuts()
      break;
    case "User":
      setTimeout(() => {
        window.parent.$("#groupoptions-user").show();
      }, 100);
      break;
    default:
      break;
  }

  let intro_details;

  intro_details = window.parent.introJs();
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
        window.parent.create_popUp.close();
        break;
      case "Help":
        window.parent.help_popUp.close();
        break;
      case "Shortcut":
        window.parent.$('.fullscreen-close').trigger("click");
        break;
      case "User":
        window.parent.$("#groupoptions-user").hide();
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