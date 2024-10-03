const enable_custom_uid = true;
jQuery.fn.swap = function (b) {
  b = jQuery(b)[0];
  var a = this[0];
  var t = a.parentNode.insertBefore(document.createTextNode(''), a);
  b.parentNode.insertBefore(a, b);
  t.parentNode.insertBefore(b, t);
  t.parentNode.removeChild(t);
  return this;
};

function get_action(text, icon, action) {
  return {
    text: rcmail.gettext(text),
    icon: icon,
    action: action,
  };
}

async function m_mp_create_note() {
  if (window.create_popUp !== undefined) {
    window.create_popUp.close();
    window.create_popUp = undefined;
  }

  const init = Object.keys(rcmail.env.mel_metapages_notes);

  const Sticker = (
    await loadJsModule(
      'mel_metapage',
      'sticker',
      '/js/lib/metapages_actions/notes/',
    )
  ).Sticker;

  await Sticker.new();

  let notes = await loadAction(
    'mel_metapage',
    'notes.js',
    '/js/lib/metapages_actions/',
  );

  if (notes) {
    const new_note = Enumerable.from(rcmail.env.mel_metapages_notes)
      .where((x) => !init.includes(x.key))
      .firstOrDefault();

    if (new_note) {
      let sticker = Sticker.from(new_note.value);

      await sticker.post('pin', {
        _uid: sticker.uid,
        _pin: true,
      });

      sticker.pin = true;
      rcmail.env.mel_metapages_notes[sticker.uid].pin = true;

      sticker.after = () => {
        sticker.uid = `pin-${sticker.uid}`;
        sticker.get_html().find('textarea')[0].focus();
      };

      Sticker.helper.trigger_event('notes.apps.tak', sticker);
    }
    //notes.select_note_button().click();

    //$('.mel-note').last().find("textarea")[0].focus();
  }
}

/**
 * Affiche la modale du bouton "créer".
 */
function m_mp_Create() {
  FullscreenItem.close_if_exist();
  m_mp_step3_param.datas = null;

  if (
    ($('#otherapps a.wekan').length || $('#taskmenu a.wekan').length) &&
    !$('.wekan-frame').length
  )
    m_mp_Create.current_promise = mel_metapage.Functions.change_frame(
      'wekan',
      false,
      true,
    );

  //window.create_popUp = undefined;
  //Si problème de configuration, on gère.
  window.mel_metapage_tmp = rcmail.env.is_stockage_active ? true : null;

  const actions = {
    mail: get_action(
      'mel_metapage.a_mail',
      'icon-mel-mail',
      "rcmail.command('compose','',this,event)",
    ),
    espace: get_action(
      'mel_metapage.a_worspace',
      'icon-mel-workplace',
      'm_mp_createworkspace()',
    ),
    event: get_action(
      'mel_metapage.a_meeting',
      'icon-mel-calendar',
      'mm_create_calendar(this);',
    ),
    visio: get_action(
      'mel_metapage.a_web_conf',
      'icon-mel-videoconference',
      'window.webconf_helper.go()',
    ),
    tache: get_action(
      'mel_metapage.a_task',
      'icon-mel-survey',
      "m_mp_CreateOrOpenFrame('tasklist', () => m_mp_set_storage('task_create'), m_mp_NewTask)",
    ),
    documents: get_action(
      'mel_metapage.a_document',
      'icon-mel-folder',
      'm_mp_InitializeDocument()',
    ),
    sondages: get_action(
      'mel_metapage.a_survey',
      'icon-mel-sondage',
      'm_mp_sondage()',
    ),
    notes: get_action(
      'mel_metapage.a_wordpad',
      'icon-mel-notes',
      'm_mp_create_note()',
    ),
  };

  const isSmall =
    $('html').hasClass('layout-small') || $('html').hasClass('layout-phone');

  if (window.create_event === true) {
    eval(actions.event.action);
    return;
  }

  let $have_minified = $('#mel-have-something-minified-main-create');

  if ($have_minified.length > 0) $have_minified.remove();
  $have_minified = null;

  //Si la popup n'existe pas, on la créer.
  if (window.create_popUp === undefined) {
    const canDrive = mel_metapage.Functions.stockage.canDriveActions();
    let haveNextcloud = {
      style: !canDrive ? 'display:none' : '',
      col: !canDrive ? '4' : '3',
    };
    let button = function (txt, font, click = '') {
      let disabled = click === '' ? 'disabled' : '';
      return (
        '<button class="btn btn-block btn-secondary btn-mel ' +
        disabled +
        '" onclick="' +
        click +
        '"' +
        disabled +
        '><span class="' +
        font +
        '"></span>' +
        txt +
        '</button>'
      );
    };
    const _button = function (action, block = true) {
      return button(
        action.text,
        `${action.icon} ${block ? 'block' : ''}`,
        action.action,
      );
    };
    //debugger;
    let workspace =
      `<li class="col-12" id="workspace" title="${rcmail.gettext('mel_metapage.menu_create_help_workspace')}">` +
      _button(actions.espace, false) +
      '</li>';
    let mail =
      `<li class="col-sd-4 col-md-4" id="mail" title="${rcmail.gettext('mel_metapage.menu_create_help_email')}">` +
      _button(actions.mail) +
      '</li>';
    let reu =
      `<li class="col-sd-4 col-md-4" id="reu" title="${rcmail.gettext('mel_metapage.menu_create_help_event')}">` +
      _button(actions.event) +
      '</li>';
    let viso =
      `<li class="col-sd-4 col-md-4" id="viso" title="${rcmail.gettext('mel_metapage.menu_create_help_webconf')}">` +
      _button(actions.visio) +
      '</li>';
    let tache =
      `<li class="col-md-${haveNextcloud.col}" id="tache" title="${rcmail.gettext('mel_metapage.menu_create_help_task')}">` +
      _button(actions.tache) +
      '</li>';
    let document =
      `<li class="col-md-3" style="${haveNextcloud.style}" id="document" title="${rcmail.gettext('mel_metapage.menu_create_help_doc')}">` +
      _button(actions.documents) +
      '</li>';
    let blocnote =
      `<li class="col-md-${haveNextcloud.col}"  id="blocnote" title="${rcmail.gettext('mel_metapage.menu_create_help_note')}">` +
      _button(actions.notes) +
      '</li>';
    let pega =
      `<li class="col-md-${haveNextcloud.col}" id="pega" title="${rcmail.gettext('mel_metapage.menu_create_help_survey')}">` +
      _button(actions.sondages) +
      '</li>';

    if (!rcmail.env.plugin_list_workspace) {
      workspace = '';
    }

    if (!rcmail.env.plugin_list_agenda) {
      viso = viso.replace('col-6', 'col-12');
      viso = viso.replace('col-sd-4 col-md-4', 'col-6');
      mail = mail.replace('col-6', 'col-12');
      mail = mail.replace('col-sd-4 col-md-4', 'col-6');
      reu = '';
    }

    if (!rcmail.env.plugin_list_visio) {
      reu = reu.replace('col-6', 'col-12');
      reu = reu.replace('col-sd-4 col-md-4', 'col-6');
      mail = mail.replace('col-6', 'col-12');
      mail = mail.replace('col-sd-4 col-md-4', 'col-6');
      viso = '';
    }

    if (!rcmail.env.plugin_list_tache) {
      document = document
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      blocnote = blocnote
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      pega = pega
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      tache = '';
    }

    if (!rcmail.env.plugin_list_document) {
      tache = tache
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      blocnote = blocnote
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      pega = pega
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      document = '';
    }

    if (!rcmail.env.plugin_list_sondage) {
      document = document
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      blocnote = blocnote
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      tache = tache
        .replace('col-md-6', 'col-md-12')
        .replace('col-md-4', 'col-md-6')
        .replace('col-md-3', 'col-md-4');
      pega = '';
    }

    html =
      '<ul id=globallist class="row ignore-bullet">' +
      workspace +
      mail +
      reu +
      viso +
      tache +
      document +
      blocnote +
      pega +
      '</ul>';
    let config = new GlobalModalConfig(
      rcmail.gettext('mel_metapage.what_do_you_want_create'),
      'default',
      html,
      '   ',
    );
    let create_popUp = new GlobalModal('globalModal', config, !isSmall);
    const func_minifier = () => {
      if (
        $('#mel-have-something-minified-main-create').length === 0 &&
        $('#globallist').length === 0
      ) {
        let $qu = $('#button-create').append(`
                <span id="mel-have-something-minified-main-create" class="badge badge-pill badge-primary" style="position: absolute;
                top: -5px;
                pointer-events:none;
                right: -5px;">•</span>
                `);

        if ($qu.css('position') !== 'relative') $qu.css('position', 'relative');
      }
    };
    create_popUp.on_click_exit = () => {
      if (window.create_popUp) {
        window.create_popUp = undefined;
        create_popUp.close();

        let $have_minified = $('#mel-have-something-minified-main-create');
        if ($have_minified.length > 0) $have_minified.length.remove();

        $('#button-create').focus();
      }
    };
    create_popUp.on_click_minified = () => {
      window.create_popUp.close();
      func_minifier();
      $('#button-create').focus();
    };
    create_popUp.onClose(() => {
      if (window.create_popUp) func_minifier();
      else {
        let $have_minified = $('#mel-have-something-minified-main-create');
        if ($have_minified.length > 0) $have_minified.length.remove();
      }
    });
    window.create_popUp = create_popUp.haveReduced();

    rcmail.triggerEvent('on_create_window.matomo');
  } else if (!isSmall) {
    //Si elle existe, on l'affiche.
    window.create_popUp.show();
  }

  $('.global-modal-body.modal-body').css('height', '');

  if ($('#globallist').length > 0 && !isSmall) {
    $('#globalModal .icon-mel-undo.mel-return').remove();
  }

  if (isSmall) {
    if (!$('#groupoptions-createthings').hasClass('initialized')) {
      for (const key in actions) {
        if (Object.hasOwnProperty.call(actions, key)) {
          const element = actions[key];
          $('#ul-createthings').append(`
                    <li role="menuitem">
                        <a class="${element.icon}" role="button" href="#" onclick="${element.action}">
                            <span class="restore-font">${element.text}</span>
                        </a>
                    </li>
                    `);
        }
      }

      $('#groupoptions-createthings').addClass('initialized');
    }
    window.create_popUp.close();

    setTimeout(() => {
      $('#open-created-popup').click();
    }, 1);
  }
}

function m_mp_createworskpace_steps() {
  return {
    init: () => {
      const tmp = (img) => {
        img = img.split('.');
        if (img.length > 1) img[img.length - 1] = '';
        img = img.join('.');
        img = img.slice(0, img.length - 1);
        return img;
      };
      let html = '';
      if (rcmail.env.mel_metapage_workspace_logos.length > 0) {
        html +=
          '<li role=menuitem><a title="" aria-disabled=true href=# tabindex=-1 class="active" id="" href="#" onclick="m_mp_change_picture(null)"><img src="' +
          rcmail.env.mel_metapage_workspace_logos[0].path +
          '" class="menu-image invisible">Aucune image</a></li>';
        for (
          let index = 0;
          index < rcmail.env.mel_metapage_workspace_logos.length;
          index++
        ) {
          const element = rcmail.env.mel_metapage_workspace_logos[index];
          html +=
            `<li role=menuitem><a aria-disabled=true href=# alt="${Enumerable.from(element.path.replace('.png', '').replace('.jpg', '').replace('.PNG', '').split('/')).last()}" title="" class="active" id="" tabindex=-1 href="#" onclick="m_mp_change_picture('` +
            element.path +
            '\')"><img src="' +
            element.path +
            '" class=menu-image>' +
            tmp(element.name) +
            '</a></li>';
        }
      }
      $('#ul-wsp').html(html);

      return '';
    },
    step3: () => {
      let html = '';
      html +=
        '<h3 class="span-mel t1 first">Sélectionner les services à intégrer à l’espace de travail</h3>';
      html += '<div class=row>';
      const mel_metapage_templates_services =
        rcmail.env.mel_metapage_templates_services;
      for (
        let index = 0;
        index < mel_metapage_templates_services.length;
        ++index
      ) {
        const element = mel_metapage_templates_services[index];

        switch (element.type) {
          case 'doc':
            if (!mel_metapage.Functions.stockage.canDriveActions()) continue;
            break;

          default:
            break;
        }

        html += '<div class="col-md-4" style="position:relative;">';
        html +=
          '<button type=button aria-pressed=false data-type="' +
          element.type +
          '" class="doc-' +
          element.type +
          ' btn-template-doc btn btn-block btn-secondary btn-mel" onclick="m_mp_UpdateWorkspace_type(this, `' +
          JSON.stringify(element).replace(/"/g, '¤¤¤') +
          '`)"><span style="display:block;margin-right:0px" class="' +
          m_mp_CreateDocumentIconContract(element.icon) +
          '"></span>' +
          rcmail.gettext(element.name) +
          '</button>';

        if (element.param === true) {
          html += `<button type=button class="mel-button no-button-margin bckg true under-button" style="position: absolute;
                    top: 0px;
                    right: 15px;
                    border-radius: 0;
                    border-top-right-radius: 5px;
                    " onclick="m_mp_step3_param('${element.type}')"><span class="icon-mel-parameters"></span></button>`;
        }

        html += '</div>';
      }
      html += '</div>';
      html += '<div style=margin:15px></div>';
      html +=
        '<div class="row"><div class="col-12" style="text-align: center;"><span id="wspsse" style="color: red;display:none;"></span></div></div>';
      html +=
        '    <button style="margin-top: 30px;float: left;" class="mel-button invite-button create btn-workspace-left" onclick="m_mp_switch_step(`workspace-step2`)"><span>Retour</span><span class="icon-mel-undo  plus" style="margin-left: 15px;"></span></button>';
      html +=
        '    <button style="margin-top: 30px;float: right;" class="mel-button invite-button create btn-workspace-right" onclick="m_mp_check_w(3, null)"><span>Continuer</span><span class="icon-mel-arrow-right  plus" style="margin-left: 15px;"></span></button>';
      return html;
    },
  };
}

function m_mp_step3_param(type) {
  let $querry = $('#workspace-step3').css('display', 'none').parent();
  $querry = $querry
    .append(
      `
    <div id="workspace-step3-extra">
    </div>
    `,
    )
    .find('#workspace-step3-extra');

  const update_title = (str) => {
    return mel_metapage.Functions.remove_accents(
      mel_metapage.Functions.replace_special_char(
        mel_metapage.Functions.replace_dets(str.toLowerCase(), '-'),
        '-',
      ),
    ).replaceAll(' ', '-');
  };

  const wsp_title = $('#workspace-title').val();
  const wsp_uid = $('#custom-uid').val();
  const have_datas = !!m_mp_step3_param.datas && !!m_mp_step3_param.datas[type];

  switch (type) {
    case 'channel':
      {
        let $master_button = $('.doc-channel');

        if (!$master_button.hasClass('active')) $master_button.click();

        let $param_button = $master_button.parent().find('.under-button');
        let custom_channel_datas = null;
        const default_custom_value =
          have_datas && m_mp_step3_param.datas[type].mode === 'custom_name'
            ? m_mp_step3_param?.datas[type]?.value ?? ''
            : null;

        const html_title =
          '<h3 class="span-mel t1 first">Paramètres du canal</h3>';

        let $select =
          $(`<select class="custom-calendar-option-select form-control input-mel custom-select pretty-select">
                    <option value="default">Un canal ayant comme nom l'id sera créé</option>
                    <option value="custom_name">Choisissez le nom du canal</option>
                    <option value="already_exist">Lié à un canal existant</option>
                </select> `);

        if (have_datas) $select.val(m_mp_step3_param.datas[type].mode);

        let $custom_name_div = $(`
                    <div style=margin-top:15px>
                        <h3 class="span-mel t2 first">Nom personalisé du nouveau canal</h3>
                    </div>
                `).css('display', 'none');

        let $custom_name_input = $(`
                    <input class="form-control input-mel" value="${default_custom_value || wsp_uid || update_title(wsp_title)}" placeholder="Nom du canal" maxlength=30 /> 
                `)
          .on('input', () => {
            $custom_name_input.val(update_title($custom_name_input.val()));
            m_mp_step3_param.datas[type].value = $custom_name_input.val();
          })
          .appendTo($custom_name_div);

        let $linked_channel_div = $(`                    
                    <div style=margin-top:15px>
                        <h3 class="span-mel t2 first">Entrer l'identifiant interne du canal existant</h3>
                    </div>`).css('display', 'none');

        let $linked_channel_select = $(`
                    <select class="custom-calendar-option-select form-control input-mel custom-select pretty-select"></select>
                `)
          .on('change', () => {
            const val = custom_channel_datas[$linked_channel_select.val()];
            m_mp_step3_param.datas[type].value = {
              id: val?._id,
              name: val?.name,
            };
          })
          .appendTo($linked_channel_div);

        $select.on('change', () => {
          if (!m_mp_step3_param.datas) {
            m_mp_step3_param.datas = {};
          }

          if (!m_mp_step3_param.datas[type])
            m_mp_step3_param.datas[type] = {
              mode: $select.val(),
              value: undefined,
            };
          else m_mp_step3_param.datas[type].mode = $select.val();

          switch ($select.val()) {
            case 'default':
              $custom_name_div.css('display', 'none');
              $linked_channel_div.css('display', 'none');
              $param_button.removeClass('selected');
              break;

            case 'custom_name':
              $param_button.addClass('selected');
              $custom_name_div.css('display', '');
              $linked_channel_div.css('display', 'none');
              m_mp_step3_param.datas[type].value = $custom_name_input.val();
              break;

            case 'already_exist':
              $param_button.addClass('selected');
              $custom_name_div.css('display', 'none');
              $select.attr('disabled', 'disabled').addClass('disabled');
              rcmail.set_busy(true, 'loading');

              mel_metapage.Functions.post(
                mel_metapage.Functions.url('discussion', 'get_joined'),
                {
                  _moderator: true,
                  _mode: $('#workspace-private')[0].checked ? 2 : 1,
                },
                (datas) => {
                  //console.log('datas', JSON.parse(datas));
                  custom_channel_datas = JSON.parse(datas);

                  // for (const iterator of datas) {
                  //     $linked_channel_select.append(`<option value="${JSON.stringify({id:iterator._id, name:iterator.name})}">${iterator.name}</option>`);
                  // }
                  for (const key in custom_channel_datas) {
                    if (Object.hasOwnProperty.call(custom_channel_datas, key)) {
                      const element = custom_channel_datas[key];
                      $linked_channel_select.append(
                        `<option value="${key}" ${element._id === m_mp_step3_param.datas[type].value?.id && !!m_mp_step3_param.datas[type].value ? 'selected' : ''}>${element.name}</option>`,
                      );
                    }
                  }

                  $linked_channel_div.css('display', '');
                  rcmail.clear_messages();
                  $select
                    .removeAttr('disabled', 'disabled')
                    .removeClass('disabled');
                },
              );

              break;

            default:
              break;
          }

          m_mp_step3_param.datas[type].mode = $select.val();
        });

        $select.change();

        let $button_back = $(`
                <button style="margin-top: 30px;float: left;" class="mel-button invite-button create btn-workspace-left">
                    <span>Retour</span>
                    <span class="icon-mel-undo  plus" style="margin-left: 15px;"></span>
                </button>
                `).click(() => {
          $querry.remove();
          $querry = null;
          $('#workspace-step3').css('display', '');
        });

        $querry
          .append(html_title)
          .append($select)
          .append($custom_name_div)
          .append($linked_channel_div)
          .append($button_back);
      }
      break;

    case 'tasks':
      {
        let $master_button = $('.doc-tasks');

        if (!$master_button.hasClass('active')) $master_button.click();

        let $param_button = $master_button.parent().find('.under-button');
        const default_custom_value =
          have_datas && m_mp_step3_param.datas[type].mode === 'custom_name'
            ? m_mp_step3_param?.datas[type]?.value ?? ''
            : null;

        const html_title =
          '<h3 class="span-mel t1 first">Paramètres du kanban</h3>';

        let $select =
          $(`<select class="custom-calendar-option-select form-control input-mel custom-select pretty-select">
                    <option value="default">Un kanban ayant le nom de l'espace sera créé</option>
                    <option value="custom_name">Choisissez le nom du nouveau kanban</option>
                    <option value="already_exist">Lié à un kanban existant</option>
                </select> `).attr(
            'title',
            'Choisir la méthode de création du kanban',
          );

        if (have_datas) $select.val(m_mp_step3_param.datas[type].mode);

        let $custom_name_div = $(`
                    <div style=margin-top:15px>
                        <h3 id="kanban-custom-name" class="span-mel t2 first">Nom personalisé du nouveau kanban</h3>
                    </div>
                `).css('display', 'none');

        let $custom_name_input = $(`
                    <input aria-labelledby="kanban-custom-name" class="form-control input-mel" value="${default_custom_value || wsp_title}" placeholder="Nom du kanban" maxlength=30 /> 
                `)
          .on('input', () => {
            m_mp_step3_param.datas[type].value = $custom_name_input.val();
          })
          .appendTo($custom_name_div);

        let $linked_kanban_div = $(`
                    <div style=margin-top:15px>
                        <h3 class="span-mel t2 first">Lié à un kanban existant</h3>
                    </div>
                `).css('display', 'none');

        let $linked_kanban_select = $(`
                    <select title="Lié à un kanban existant - Choisir un kanban parmis la liste" class="custom-calendar-option-select form-control input-mel custom-select pretty-select"></select>
                `)
          .on('change', () => {
            m_mp_step3_param.datas[type].value = $linked_kanban_select.val();
          })
          .appendTo($linked_kanban_div);

        $select.on('change', () => {
          if (!m_mp_step3_param.datas) {
            m_mp_step3_param.datas = {};
          }

          if (!m_mp_step3_param.datas[type])
            m_mp_step3_param.datas[type] = {
              mode: $select.val(),
              value: undefined,
            };
          else m_mp_step3_param.datas[type].mode = $select.val();

          switch ($select.val()) {
            case 'default':
              $param_button.removeClass('selected');
              $custom_name_div.css('display', 'none');
              $linked_kanban_div.css('display', 'none');
              break;

            case 'custom_name':
              $param_button.addClass('selected');
              $linked_kanban_div.css('display', 'none');
              $custom_name_div.css('display', '');
              m_mp_step3_param.datas[type].value = $custom_name_input.val();
              break;

            case 'already_exist':
              $param_button.addClass('selected');
              $select.attr('disabled', 'disabled').addClass('disabled');
              rcmail.set_busy(true, 'loading');
              $custom_name_div.css('display', 'none');
              mel_metapage.Functions.post(
                mel_metapage.Functions.url('wekan', 'get_user_board'),
                {
                  _moderator: true,
                  _mode: $('#workspace-private')[0].checked ? 2 : 1,
                  _minified_datas: true,
                },
                (datas) => {
                  datas = JSON.parse(datas);

                  for (const it of datas) {
                    $linked_kanban_select.append(`
                                            <option ${it.id === m_mp_step3_param.datas[type].value ? 'selected' : ''} value="${it.id}">${it.title}</option>
                                        `);
                  }

                  $linked_kanban_div.css('display', '');
                  rcmail.clear_messages();
                  $select
                    .removeAttr('disabled', 'disabled')
                    .removeClass('disabled');
                },
              );

              break;

            default:
              break;
          }

          m_mp_step3_param.datas[type].mode = $select.val();
        });

        $select.change();

        let $button_back = $(`
                <button style="margin-top: 30px;float: left;" class="mel-button invite-button create btn-workspace-left">
                    <span>Retour</span>
                    <span class="icon-mel-undo  plus" style="margin-left: 15px;"></span>
                </button>
                `).click(() => {
          $querry.remove();
          $querry = null;
          $('#workspace-step3').css('display', '');
        });

        $querry
          .append(html_title)
          .append($select)
          .append($custom_name_div)
          .append($linked_kanban_div)
          .append($button_back);
      }
      break;

    case 'tchap-channel':
      {
        let $master_button = $('.doc-tchap-channel');

        if (!$master_button.hasClass('active')) $master_button.click();

        let $param_button = $master_button.parent().find('.under-button');
        let custom_channel_datas = null;
        const default_custom_value =
          have_datas && m_mp_step3_param.datas[type].mode === 'custom_name'
            ? m_mp_step3_param?.datas[type]?.value ?? ''
            : null;

        const html_title =
          '<h3 class="span-mel t1 first">Paramètres du canal tchap</h3>';

        let $select =
          $(`<select class="custom-calendar-option-select form-control input-mel custom-select pretty-select">
                    <option value="default">Un canal ayant comme nom l'id sera créé</option>
                    <option value="custom_name">Choisissez le nom du canal</option>
                    <option value="already_exist">Lié à un canal existant</option>
                </select> `);

        if (have_datas) $select.val(m_mp_step3_param.datas[type].mode);

        let $custom_name_div = $(`
                    <div style=margin-top:15px>
                        <h3 class="span-mel t2 first">Nom personalisé du nouveau canal</h3>
                    </div>
                `).css('display', 'none');

        let $custom_name_input = $(`
                    <input class="form-control input-mel" value="${default_custom_value || wsp_uid || update_title(wsp_title)}" placeholder="Nom du canal" maxlength=30 /> 
                `)
          .on('input', () => {
            $custom_name_input.val(update_title($custom_name_input.val()));
            m_mp_step3_param.datas[type].value = $custom_name_input.val();
          })
          .appendTo($custom_name_div);

        let $linked_channel_div = $(`                    
                    <div style=margin-top:15px>
                        <h3 class="span-mel t2 first">Entrer l'identifiant d'un canal tchap existant</h3>
                    </div>`).css('display', 'none');

        let image_src = {
          parametres: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/tchap_info_salon.png`,
          channel_uid: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/tchap_uid_salon.png`,
        };
        let $linked_channel_uid = $(
          `
            <input type="text" id="tchap_uid" class="form-control input-mel"/>
            <div style=margin-top:15px>
                <h4 class="span-mel t2 first">Pour trouver l'identifiant interne d'un canal cliquer sur le nom du canal -> Paramètres -> Avancé</h34>
            </div>
            <img src="${image_src.parametres}" width=100% alt="Pour trouver l'identifiant interne d'un canal cliquer sur le nom du canal -> Paramètres -> Avancé"/>
            <img src="${image_src.channel_uid}" width=100% alt="Pour trouver l'identifiant interne d'un canal cliquer sur le nom du canal -> Paramètres -> Avancé"/>
            `,
        )
          .on('change', () => {
            const val = custom_channel_datas[$linked_channel_uid.val()];
            m_mp_step3_param.datas[type].value = {
              id: val?._id,
            };
          })
          .appendTo($linked_channel_div);

        $select.on('change', () => {
          if (!m_mp_step3_param.datas) {
            m_mp_step3_param.datas = {};
          }

          if (!m_mp_step3_param.datas[type])
            m_mp_step3_param.datas[type] = {
              mode: $select.val(),
              value: undefined,
            };
          else m_mp_step3_param.datas[type].mode = $select.val();

          switch ($select.val()) {
            case 'default':
              $custom_name_div.css('display', 'none');
              $linked_channel_div.css('display', 'none');
              $param_button.removeClass('selected');
              break;

            case 'custom_name':
              $param_button.addClass('selected');
              $custom_name_div.css('display', '');
              $linked_channel_div.css('display', 'none');
              m_mp_step3_param.datas[type].value = $custom_name_input.val();
              break;

            case 'already_exist':
              $param_button.addClass('selected');
              $custom_name_div.css('display', 'none');
              $select.attr('disabled', 'disabled').addClass('disabled');
              rcmail.set_busy(true, 'loading');

              mel_metapage.Functions.post(
                mel_metapage.Functions.url('discussion', 'get_joined'),
                {
                  _moderator: true,
                  _mode: $('#workspace-private')[0].checked ? 2 : 1,
                },
                (datas) => {
                  //console.log('datas', JSON.parse(datas));
                  custom_channel_datas = JSON.parse(datas);

                  // for (const iterator of datas) {
                  //     $linked_channel_select.append(`<option value="${JSON.stringify({id:iterator._id, name:iterator.name})}">${iterator.name}</option>`);
                  // }
                  for (const key in custom_channel_datas) {
                    if (Object.hasOwnProperty.call(custom_channel_datas, key)) {
                      const element = custom_channel_datas[key];
                      $linked_channel_uid.append(
                        `<option value="${key}" ${element._id === m_mp_step3_param.datas[type].value?.id && !!m_mp_step3_param.datas[type].value ? 'selected' : ''}>${element.name}</option>`,
                      );
                    }
                  }

                  $linked_channel_div.css('display', '');
                  rcmail.clear_messages();
                  $select
                    .removeAttr('disabled', 'disabled')
                    .removeClass('disabled');
                },
              );

              break;

            default:
              break;
          }

          m_mp_step3_param.datas[type].mode = $select.val();
        });

        $select.change();

        let $button_back = $(`
                <button style="margin-top: 30px;float: left;" class="mel-button invite-button create btn-workspace-left">
                    <span>Retour</span>
                    <span class="icon-mel-undo  plus" style="margin-left: 15px;"></span>
                </button>
                `).click(() => {
          $querry.remove();
          $querry = null;
          $('#workspace-step3').css('display', '');
        });

        $querry
          .append(html_title)
          .append($select)
          .append($custom_name_div)
          .append($linked_channel_div)
          .append($button_back);
      }
      break;
    default:
      break;
  }
}

function m_mp_input_change(event) {
  return;
  // if ($("#workspace-uid").data("edited") || !enable_custom_uid)
  //     return;
  // if ($(".btn-workspace-right").find("span").length === 0)
  //     $(".btn-workspace-right").html("<span>" + $(".btn-workspace-right").html() + "</span>");
  // const tmp_html = $(".btn-workspace-right").find("span").html();
  // $(".btn-workspace-right").addClass("disabled").find("span").addClass("spinner-border").html("");
  // $.ajax({ // fonction permettant de faire de l'ajax
  //     type: "POST", // methode de transmission des données au fichier php
  //     data: {
  //         "_title": event.value,
  //     },
  //     url: "/?_task=workspace&_action=get_uid",
  //     success: function(ariane) {
  //         $("#workspace-uid").val(ariane);
  //     },
  //     error: function(xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
  //         console.error(xhr, ajaxOptions, thrownError);
  //     },
  // }).always(() => {
  //     $(".btn-workspace-right").removeClass("disabled").find("span").removeClass("spinner-border").html(tmp_html);
  // });
}

function m_mp_input_uid_change(params) {
  if (params.value === '') {
    $(params).data('edited', false);
    m_mp_input_change($('#workspace-title')[0]);
  } else $(params).data('edited', true);
}

function m_mp_createworkspace() {
  try {
    let html = '';
    const object = m_mp_createworskpace_steps();
    for (const key in object) {
      if (Object.hasOwnProperty.call(object, key)) {
        const element = object[key];
        if (key === 'init') html += element();
        else continue;
      }
    }
    rcmail.triggerEvent(
      'on_click_button.matomo',
      'Créer - Un espace de travail',
    );

    create_popUp.contents.html(
      '<center><span class="spinner-border"></span></center>',
    );
    mel_metapage.Functions.get(
      mel_metapage.Functions.url('mel_metapage', 'get_create_workspace'),
      {},
      (datas) => {
        // eslint-disable-next-line no-async-promise-executor
        if ($('#globallist').length > 0) return;

        create_popUp.contents.html(
          html +
            datas +
            `<div style=display:none class=step id=workspace-step3>${object.step3()}</div>`,
        );

        if ($('#tmpavatar').find('a').length === 0)
          $('#worspace-avatar-a')
            .html('')
            .css('display', '')
            .appendTo($('#tmpavatar'));

        m_mp_switch_step('workspace-step1');
        rcmail.init_address_input_events($('#_workspace-user-list'));
        $('.global-modal-body')
          .css('height', `${window.innerHeight - 200}px`)
          .css('overflow-y', 'auto')
          .css('overflow-x', 'hidden');

        create_popUp.contents.find('#workspace-title-param').click((e) => {
          e = $(e.currentTarget);
          let $div = $('#custom-div-uid');
          const class_name = 'active';

          if (e.hasClass(class_name)) {
            $div.css('display', 'none');
            e.removeClass(class_name);
          } else {
            $div.css('display', '');
            e.addClass(class_name);
          }
        });

        create_popUp.contents.find('#custom-div-uid button').click((e) => {
          e = $(e.currentTarget);
          let $div = $('#custom-div-input-uid');
          const class_name = 'active';

          if (e.hasClass(class_name)) {
            $div.css('display', 'none');
            e.removeClass(class_name);
            e.html("Activer l'id personalisé");
          } else {
            $div.css('display', '');
            e.addClass(class_name);
            e.html("Désactiver l'id personalisé");

            let $input = $('#custom-uid');

            if ($input.val() === '') {
              const title = mel_metapage.Functions.remove_accents(
                mel_metapage.Functions.replace_special_char(
                  mel_metapage.Functions.replace_dets(
                    $('#workspace-title').val().toLowerCase(),
                    '-',
                  ),
                  '-',
                ),
              ).replaceAll(' ', '-');
              $input.val(title);
            }
          }
        });

        let $custom_uid = $('#custom-uid');
        $custom_uid.on('input', () => {
          let val = $custom_uid.val();
          val = mel_metapage.Functions.replace_special_char(
            mel_metapage.Functions.remove_accents(val),
            '-',
          )
            .replaceAll(' ', '-')
            .toLowerCase();
          $custom_uid.val(val);
        });

        setTimeout(() => {
          const rdmColor = MEL_ELASTIC_UI.getRandomColor();
          $('#workspace-color')
            .val(rdmColor)
            .on('change', (e) => {
              const color = $(e.currentTarget).val();
              let $span = $('#worspace-avatar-a');
              if ($span.length > 0) {
                if (
                  !mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(
                    mel_metapage.Functions.colors.kMel_extractRGB('#363A5B'),
                    mel_metapage.Functions.colors.kMel_extractRGB(color),
                  )
                ) {
                  $span.attr('style', 'color:white!important');
                } else {
                  $span.attr('style', 'color:#363A5B!important');
                }

                $span.css('background-color', color);
              }
              $span = null;
            });
          let $span = $('#worspace-avatar-a');
          if ($span.length > 0) {
            if (
              !mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(
                mel_metapage.Functions.colors.kMel_extractRGB('#363A5B'),
                mel_metapage.Functions.colors.kMel_extractRGB(rdmColor),
              )
            ) {
              $span.attr('style', 'color:white!important');
            } else {
              $span.attr('style', 'color:#363A5B!important');
            }
          }
          $span.css('background-color', rdmColor);
          $span = null;
          $('#workspace-date-end').datetimepicker({
            format: 'd/m/Y H:i',
            dayOfWeekStart: 1,
          });
          MEL_ELASTIC_UI.redStars();
        }, 10);
      },
    );
    create_popUp.editTitleAndSetBeforeTitle(
      '<a href="javascript:void(0)" class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="m_mp_reinitialize_popup(() => {$(`#worspace-avatar-a`).css(`display`, `none`).appendTo($(`#layout`));})"><span class=sr-only>Retour à la modale de création</span></a>',
      "Création d'un espace de travail",
    );
    create_popUp.modal.focus();
    create_popUp.show();
  } catch (error) {
    console.error(error);
  }
}

function m_mp_change_picture(img) {
  if (img === null) {
    $('#worspace-avatar-a').html('');
    m_mp_input($('#workspace-title')[0]);
  } else
    $('#worspace-avatar-a').html(
      `<img alt="${Enumerable.from(img.replace('.png', '').replace('.PNG', '').split('/')).last()}" src="${img}" /><p class="sr-only"> - Changer d'avatar</p>`,
    );
}

async function m_mp_avatarOnSelect(e) {
  if (e.type === 'keydown') {
    if (e.originalEvent.code === 'Enter' || e.originalEvent.code === 'Space') {
      $('#user-up-panel').focus().popover('show').data('event', 'key'); //.trigger("click", e);
    }
  }
}

function m_mp_input(element) {
  if ($('#worspace-avatar-a').find('img').length === 0)
    $('#worspace-avatar-a').html(
      '<span>' + element.value.slice(0, 3).toUpperCase() + '</span>',
    );
}

async function m_mp_check_w(step, next) {
  let stop = false;
  switch (step) {
    case 1:
      if ($('#workspace-title').val() === '') {
        $('#workspace-title').css('border-color', 'red');
        if ($('#wspte').length === 0)
          $('#workspace-title')
            .parent()
            .append(
              '<span id=wspte class=input-error-r style=color:red></span>',
            );
        $('#wspte').html("* L'espace de travail doit avoir un titre !");
        $('#wspte').css('display', '');
        stop = true;
      } else {
        $('#wspte').css('display', 'none');
        $('#workspace-title').css('border-color', '');
      }
      if (
        $('#workspace-private')[0].checked === false &&
        $('#workspace-public')[0].checked === false
      ) {
        $('#workspace-private').parent().css('color', 'red');
        $('#workspace-public').parent().css('color', 'red');
        if ($('#wspae').length === 0)
          $('#workspace-private')
            .parent()
            .parent()
            .append(
              '<span id=wspae class=input-error-r style=color:red></span>',
            );
        $('#wspae').html(
          "* L'espace de travail doit avoir un accès de défini !",
        );
        $('#wspae').css('display', '');
        stop = true;
      } else {
        $('#wspae').css('display', 'none');
        $('#workspace-private').parent().css('color', '');
        $('#workspace-public').parent().css('color', '');
      }

      if (enable_custom_uid && $('#custom-uid-is-enabled').hasClass('active')) {
        const input_uid = '#custom-uid';
        $('.btn-right-step1')
          .addClass('disabled')
          .find('span.plus')
          .addClass('spinner-grow spinner-grow-sm')
          .removeClass('icon-mel-arrow-right'); //.html("");
        await $.ajax({
          // fonction permettant de faire de l'ajax
          type: 'POST', // methode de transmission des données au fichier php
          data: {
            _uid: $(input_uid).val(),
          },
          url: mel_metapage.Functions.url('workspace', 'check_uid'),
          success: function (ariane) {
            if (ariane !== 'uid_ok') {
              stop = true;
              $(input_uid).css('border-color', 'red');
              if ($('#wsptuid').length === 0)
                $(input_uid)
                  .parent()
                  .append(
                    '<span id=wsptuid class=input-error-r style=color:red></span>',
                  );
              if (ariane === 'uid_exists')
                $('#wsptuid').html("* L'id existe déjà !");
              else if (ariane === 'uid_not_ok')
                $('#wsptuid').html("* L'id n'est pas valide !");
              else if (ariane === 'ui_empty')
                $('#wsptuid').html("* L'id ne doit pas être vide !");
              else $('#wsptuid').html('* Erreur inconnue !');
              $('#wsptuid').css('display', '');
            } else $('#wsptuid').css('display', 'none');
          },
          error: function (xhr, ajaxOptions, thrownError) {
            // Add these parameters to display the required response
            console.error(xhr, ajaxOptions, thrownError);
          },
        }).always(() => {
          $(input_uid).css('border-color', '');
          $('.btn-right-step1')
            .removeClass('disabled')
            .find('span.plus')
            .removeClass('spinner-grow')
            .addClass('icon-mel-arrow-right'); //.html(tmp_html);
        });
      }

      break;
    case 2:
      let users = [];
      $('#wspf .workspace-recipient').each((i, e) => {
        users.push($(e).find('.email').html());
      });
      let input = $('#_workspace-user-list');
      if (input.val().length > 0) users.push(input.val());
      if (users.length > 0) {
        if (confirm("Ajouter les utilisateurs qui n'ont pas été ajouter ?")) {
          await m_mp_add_users();
        } else stop = true;
      }
      break;
    case 3:
      break;
    default:
      break;
  }

  if (!stop) {
    if (next !== null) m_mp_switch_step(next);
    else m_mp_CreateWorkSpace();
  }
}

async function m_mp_CreateWorkSpace() {
  rcmail.set_busy(true);
  rcmail.display_message("Création d'un espace de travail...", 'loading');
  let datas = {
    avatar:
      $('#worspace-avatar-a').find('img').length === 0
        ? false
        : $('#worspace-avatar-a')
            .find('img')[0]
            .src.replace(window.location.origin, ''),
    title: $('#workspace-title').val(),
    desc: $('#workspace-desc').val(),
    end_date: $('#workspace-date-end').val(),
    hashtag: $('#workspace-hashtag').val(),
    visibility: $('#workspace-private')[0].checked ? 'private' : 'public',
    custom_uid:
      enable_custom_uid && $('#custom-uid-is-enabled').hasClass('active')
        ? $('#custom-uid').val()
        : '',
    color: $('#workspace-color').val(),
    users: [],
    services: [],
    _services_params: m_mp_step3_param.datas,
  };

  $('#mm-cw-participants')
    .find('.workspace-users-added')
    .each((i, e) => {
      datas.users.push($(e).find('.email').html());
    });
  $('.btn-template-doc.active').each((i, e) => {
    datas.services.push($(e).data('type'));
  });
  $('#worspace-avatar-a').css('display', 'none').appendTo($('#layout'));
  create_popUp.contents.html('<span class=spinner-border></span>');
  create_popUp.editTitle('<h2 class=""><span>Chargement...</span></h2>');

  if (m_mp_Create.current_promise) {
    await m_mp_Create.current_promise;
    m_mp_Create.current_promise = null;
  } else if (
    ($('#otherapps a.wekan').length || $('#taskmenu a.wekan').length) &&
    !$('.wekan-frame').length
  ) {
    await mel_metapage.Functions.change_frame('wekan', false, true);
  }

  $.ajax({
    // fonction permettant de faire de l'ajax
    type: 'POST', // methode de transmission des données au fichier php
    data: datas,
    url: mel_metapage.Functions.url('workspace', 'create'), //"/?_task=workspace&_action=create",
    success: function (data) {
      data = JSON.parse(data);

      rcmail.set_busy(false);
      rcmail.clear_messages();

      for (let it = 0; it < data.errored_user.length; it++) {
        const element = data.errored_user[it];
        rcmail.display_message(
          "impossible d'ajouter " + element + " à l'espace de travail !",
        );
      }

      const action = {
        func: mel_metapage.Functions.call,
        args: [
          true,
          {
            _uid: data.workspace_uid,
            _integrated: true,
          },
        ],
        url: mel_metapage.Functions.url('workspace', 'workspace', {
          _uid: data.workspace_uid,
        }),
      };

      {
        const tmp = window.create_popUp;
        delete window.create_popUp;
        tmp.close();
      }

      top.rcmail.triggerEvent(
        mel_metapage.EventListeners.workspaces_updated.get,
      );

      if (
        $('.workspace-frame').length > 0 &&
        $('iframe.workspace-frame').length === 0
      )
        window.location.href = action.url;
      else if ($('iframe.workspace-frame').length === 0) {
        mel_metapage.Functions.change_frame('wsp', true, true, {
          _action: 'workspace',
          _uid: data.workspace_uid,
        });
      } else if ($('iframe.workspace-frame').length === 1) {
        mel_metapage.Functions.change_frame('wsp', true, true).then(() => {
          let config = {
            _uid: data.workspace_uid,
          };
          config[rcmail.env.mel_metapage_const.key] =
            rcmail.env.mel_metapage_const.value;

          $('iframe.workspace-frame')[0].src = mel_metapage.Functions.url(
            'workspace',
            'workspace',
            config,
          );
        });
      } else window.location.href = action.url;

      m_mp_step3_param.datas = null;
    },
    error: function (xhr, ajaxOptions, thrownError) {
      // Add these parameters to display the required response
      console.error(xhr, ajaxOptions, thrownError);
      rcmail.clear_messages();
      rcmail.display_message(xhr, 'error');
      window.create_popUp.close();
      window.create_popUp = undefined;
    },
  });
}

function m_mp_UpdateWorkspace_type(event, element) {
  //console.log("m_mp_UpdateWorkspace_type", event, element);
  event = $(event);
  //console.log(event, event.hasClass("active"));
  if (event.hasClass('active'))
    event.removeClass('active').attr('aria-pressed', false);
  else event.addClass('active').attr('aria-pressed', true);
  document.activeElement.blur();
}

function m_mp_affiche_hashtag_if_exists(
  containerSelector = '#list-of-all-hashtag',
) {
  let querry = $(containerSelector);
  if (querry.find('button').length > 0) querry.css('display', '');
}

async function m_mp_get_all_hashtag_input(
  inputSelector = '#workspace-hashtag',
  containerSelector = '#list-of-all-hashtag',
) {
  const Mel_Promise = (await loadJsModule('mel_metapage', 'mel_promise'))
    ?.Mel_Promise;

  if (Mel_Promise) {
    if (m_mp_get_all_hashtag_input.current) {
      if (m_mp_get_all_hashtag_input.current.isPending())
        m_mp_get_all_hashtag_input.current.abort();
    }

    m_mp_get_all_hashtag_input.current = new Mel_Promise(
      m_mp_get_all_hashtag,
      inputSelector,
      containerSelector,
    );
  } else {
    console.error(
      '###[m_mp_get_all_hashtag_input]Le module "Mel_Promise" n\'est pas chargé !',
      Mel_Promise,
      inputSelector,
      containerSelector,
    );
    rcmail.display_message(
      'Impossible de récupérer les thèmes, le module "Mel_Promise" n\'est pas chargé.',
      'error',
    );
  }
}

/**
 *
 * @param {Mel_Promise} mel_promise
 * @param {*} inputSelector
 * @param {*} containerSelector
 * @returns
 */
async function m_mp_get_all_hashtag(
  mel_promise,
  inputSelector = '#workspace-hashtag',
  containerSelector = '#list-of-all-hashtag',
) {
  const val = $(inputSelector).val();
  if (val.length > 0) {
    let querry = $(containerSelector).css('display', '');
    querry.parent().attr('data-visible', true);
    querry.html('<center><span class=spinner-border></span></center>');

    if (mel_promise.isCancelled()) return;

    await mel_promise
      .create_ajax_get_request({
        url: mel_metapage.Functions.url('workspace', 'hashtag'),
        success: (datas) => {
          try {
            if (mel_promise.isCancelled()) return;

            datas = JSON.parse(datas);
            if (datas.length > 0) {
              html = '<div class=btn-group-vertical style=width:100%>';

              for (let index = 0; index < datas.length; ++index) {
                const element = datas[index];
                html += `<button onclick="m_mp_hashtag_select(this, '${inputSelector}', '${containerSelector}')" class="btn-block metapage-wsp-button btn btn-primary"><span class=icon-mel-pin style=margin-right:15px></span><text>${element}</text></button>`;
              }

              html += '</div>';
              if (mel_promise.isCancelled()) return;
              querry.html(html);
            } else {
              if (mel_promise.isCancelled()) return;
              querry.html(
                `La thématique "${val}" n'existe pas.</br>Elle sera créée lors de la création de l'espace de travail.`,
              );
            }
          } catch (error) {}
        },
      })
      .always(() => {
        rcmail.triggerEvent('onHashtagChange', {
          input: inputSelector,
          container: containerSelector,
        });
      });

    mel_promise.onAbort = () => {
      ajax.abort();
    };

    await ajax;
  } else $(containerSelector).css('display', 'none');

  let tmpfunc = (event) => {
    m_mp_hashtag_on_click(event, inputSelector, containerSelector);
  };

  // if (!mel_metapage.Functions.handlerExist($("body"), tmpfunc))
  //   $("body").click(tmpfunc);
  if (m_mp_get_all_hashtag.handlers === undefined)
    m_mp_get_all_hashtag.handlers = [];

  if (m_mp_get_all_hashtag.handlers[containerSelector] === undefined) {
    m_mp_get_all_hashtag.handlers[containerSelector] = tmpfunc;
  }

  let clickFunction = (event) => {
    for (const key in m_mp_get_all_hashtag.handlers) {
      if (Object.hasOwnProperty.call(m_mp_get_all_hashtag.handlers, key)) {
        const element = m_mp_get_all_hashtag.handlers[key];

        if ($(key).css('display') !== 'none') {
          element(event);
        }
      }
    }
  };

  if (mel_promise.isCancelled()) return;

  if (!mel_metapage.Functions.handlerExist($('body'), clickFunction))
    $('body').click(clickFunction);
}

function m_mp_hashtag_select(
  e,
  inputSelector = '#workspace-hashtag',
  containerSelector = '#list-of-all-hashtag',
) {
  $(inputSelector).val($(e).find('text').html());
  $(containerSelector)
    .css('display', 'none')
    .parent()
    .attr('data-visible', false);
}

function m_mp_hashtag_on_click(event, inputSelector, containerSelector) {
  try {
    let querry = $(containerSelector);
    const id = querry.attr('id');
    const inputId = $(inputSelector).attr('id');

    if (
      querry.css('display') !== 'none' &&
      querry.find('.spinner-border').length === 0
    ) {
      let target = event.target;
      while (target.nodeName !== 'BODY') {
        if (target.id === id || target.id === inputId) {
          return;
        } else target = target.parentElement;
      }
      querry.css('display', 'none').parent().attr('data-visible', false);
    }
  } catch (error) {}
}

function m_mp_autocomplete(element, force = false) {
  element = element.val === undefined ? $(element) : element;

  let val = element.val();
  const defaultValue = val;

  m_mp_autocomplete_startup(element, val);

  if ((val.includes(',') || force) && val.includes('@')) {
    val = val.replaceAll(',', '');

    let email = '';
    let name = '';
    if (val.includes('<') && val.includes('>')) {
      val = val.split('<');
      name = val[0];
      email = val[1].replace('>', '');
    } else email = name = val;

    html = '<li class="recipient workspace-recipient">';
    html += `<span class="email">${email}</span>`;
    html += `<span class="name">${name}</span>`;
    html += '<a class="button icon remove" </a>';
    html += '</li>';

    html = $(html);

    const remove = () => {
      html.remove();
    };

    html
      .attr('title', email)
      .find('span')
      .click(() => {
        element.val(defaultValue.replace(',', ''));
        remove();
        element.focus();
      });

    html.find('a').click(() => {
      remove();
    });

    element.parent().parent().prepend(html);

    element.val('');
  }

  return element;
}

function m_mp_autocomplete_startup($element, val = '') {
  if ($element.parent().length > 0 && $element.parent()[0].nodeName !== 'LI') {
    let $parent = $element.parent();

    let $div = $(`                <div class="input-group">
        <textarea name="_to_workspace" spellcheck="false" id="to-workspace" tabindex="-1" data-recipient-input="true" style="position: absolute; opacity: 0; left: -5000px; width: 10px;" autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"></textarea>
        <ul style="height:auto" class="form-control input-mel mel-input-container recipient-input ac-input rounded-left">
            <li class="input">
                <!--Participants à ajouter-->
               
            </li>
        </ul>
        <span class="input-group-append">
            <!--Ouvre l'annuaire-->
        <!--Ajoute les contacts de l'input-->
        </span>
    </div>`);

    $element
      .on('change', (e) => {
        m_mp_autocomplete(e.currentTarget);
      })
      .on('input', (e) => {
        m_mp_autocomplete(e.currentTarget);
      })
      .on('focusout', (e) => {
        m_mp_autocomplete(e.currentTarget, true);
      })
      .appendTo($div.find('ul .input'))
      .val(val);

    top.rcmail.init_address_input_events($element);

    $(
      '<button href="#add-contact" class="add-contact btn btn-secondary mel-focus input-group-text mel-text-center icon add recipient mel-text" title="Ajouter un contact"><span class="inner">Ajouter un contact</span></button>',
    )
      .appendTo($div.find('.input-group-append'))
      .click((e) => {
        m_mp_openTo(e.currentTarget, $element.attr('id'));
      });

    $parent.append($div);

    return $parent;
  }
}

function m_mp_autocoplete(element, action_after = null, append = true) {
  element = element.val === undefined ? '#' + element.id : '#' + element[0].id;

  let val = $(element).val();

  if (val.includes(',')) {
    val = val.replace(',', '');
    let html = '<li class="recipient workspace-recipient">';
    if (val.includes('<') && val.includes('>')) {
      let _enum = Enumerable.from(val);
      let index1 = val.indexOf('<');
      let index2 = val.indexOf('>');
      //console.log(val, _enum);
      //.where((x, i) => i > index2).toArray().splice(1).join("").replace(",", "")
      html +=
        '<span class="email">' +
        _enum
          .where((x, i) => index1 < i && i < index2)
          .toArray()
          .join('') +
        '</span>'; //.join("")
      html +=
        '<span class="name">' +
        _enum
          .where((x, i) => i < index1)
          .toArray()
          .join('')
          .replace(',', '') +
        '</span>';
    } else {
      html += '<span class="name">' + val + '</span>';
      html += '<span class="email">' + val + '</span>';
    }
    html += '<a class="button icon remove" onclick=m_mp_remove_li(this)></a>';
    html += '</li>';

    if (append === true) {
      $('#wspf').append(html);
      $(element).val('');
      //console.log("html", $($("#wspf").children()[$("#wspf").children().length-1])[0].outerHTML,     $(element).parent()[0].outerHTML);
      html = $(element).parent()[0].outerHTML;
      console.log($(element).parent());
      //$(element).parent().remove();
      rcmail.init_address_input_events($(element));
      $(element).focus();
    }

    //console.log("auto", $(element).val(), html, append, element);
    if (append === true) {
      $('#wspf').append(html);
      $(element).val('');

      html = $(element).parent()[0].outerHTML;

      $(element).parent().remove();
      rcmail.init_address_input_events($(element));
      $(element).focus();
    }

    if (action_after !== null) {
      action_after({
        $element: $(element),
        val,
      });
    }
  }
}

function m_mp_add_users() {
  let users = [];
  $('#wspf .workspace-recipient').each((i, e) => {
    users.push($(e).find('.email').html());
  });

  let input = $('#_workspace-user-list');

  if (input.val().length > 0)
    users.push(
      input.val().includes('<')
        ? input.val().split('<')[1].split('>')[0]
        : input.val(),
    );

  input.val('');

  $('#wspf .workspace-recipient').each((i, e) => {
    $(e).remove();
  });

  if (users.length > 0) {
    $('#mm-wsp-loading').css('display', '');
    return mel_metapage.Functions.post(
      mel_metapage.Functions.url('mel_metapage', 'check_users'),
      {
        _users: users,
      },
      (datas) => {
        datas = JSON.parse(datas);
        let html;
        let querry = $('#mm-cw-participants').css(
          'height',
          `${window.innerHeight - 442}`,
        );

        /**
         * Ajouter un utilisateur
         * @param {*} element
         */
        function addUser(element) {
          html = '<li>';
          html += '<div class="row" style="margin-top:15px">';
          html += '<div class="col-2">';
          html += `<div class="dwp-round" style="background-color:transparent"><img alt="" src="${rcmail.env.rocket_chat_url}avatar/${element.uid}" /></div>`;
          html += '</div>';
          html += `<div class="col-10 workspace-users-added" ${element.title ? `title="${element.title}"` : ''}>`;
          html += `<span class="name">${element.name}</span><br/>`;
          html += `<span class="email">${element.email}</span>`;
          html +=
            '<button onclick=m_mp_remove_user(this) class="mel-return mel-focus" style="border:none;float:right;margin-top:-10px;display:block;background-color:var(--input-mel-background-color);color: var(--input-mel-text-color);">Retirer <span class=icon-mel-minus></span></button>';
          html += '</div>';
          html += '</div></li>';

          querry.append(html);
        }

        // Utilisateurs internes
        for (let index = 0; index < datas.added.length; ++index) {
          addUser(datas.added[index]);
        }

        // Utilisateurs externes
        for (let index = 0; index < datas.externs.length; ++index) {
          addUser(datas.externs[index]);
        }

        // Utilisateurs non trouvés
        for (let it = 0; it < datas.unexist.length; it++) {
          const element = datas.unexist[it];
          rcmail.display_message(
            "impossible d'ajouter " + element + " à l'espace de travail !",
          );
        }
      },
    ).always(() => {
      $('#mm-wsp-loading').css('display', 'none');
    });
  }
}

function m_mp_remove_user(e) {
  $(e).parent().parent().parent().remove();
}

function m_mp_remove_li(event) {
  $(event).parent().remove();
  $('#_workspace-user-list').focus();
}

// function m_mp_open_contact(e, idInput, actions = null)
// {

// }

function m_mp_openTo(e, idInput, actions = null) {
  if (
    $('#compose-contacts').length === 0 ||
    (parent !== window &&
      (window.mmp_open_contact === undefined ||
        window.mmp_open_contact[idInput] === undefined))
  ) {
    new Promise(async () => {
      let list = await rcmail.env.mel_metapage_call_parsed.contact_list();
      ($('#layout').length === 0 ? $('body') : $('#layout')).append(list);
      list = null;
      $('head').append(
        '<script src="plugins/mel_metapage/js/program/../../../annuaire/annuaire.js"></script>',
      );
      $('head')
        .append('<script src="program/js/treelist.min.js"></script>')
        .append(
          '<link rel="stylesheet" type="text/css" href="plugins/mel_metapage/skins/elastic/annuaire_part.css">',
        );
      setTimeout(() => {
        rcmail.gui_objects.annuaire_list = $('#annuaire-list')[0];
        if (rcmail.gui_objects.annuaire_list && window.rcube_treelist_widget) {
          rcmail.annuaire_list = new rcube_treelist_widget(
            rcmail.gui_objects.annuaire_list,
            {
              selectable: true,
              id_prefix: 'rcmrow',
            },
          );

          rcmail.annuaire_list
            .addEventListener('expand', function (node) {
              rcmail.annuaire_folder_expand(node);
            })
            .addEventListener('beforeselect', function (node) {
              return (
                !$('#rcmrow' + node.id).hasClass('folder') &&
                !$('#rcmrow' + node.id).hasClass('legend')
              );
              // return !$('#rcmrow' + node.id).hasClass('legend');
            })
            .addEventListener('select', function (node) {
              rcmail.annuaire_node_select(node);

              if (!!actions && !!actions.onselect)
                actions.onselect(node, idInput);
            });

          if (rcmail.env.annuaire_list) {
            rcmail.annuaire_list_fill_list(null, rcmail.env.annuaire_list);
          }
          //console.log("timeout lunched");
        }
        setTimeout(() => {
          if (window.mmp_open_contact === undefined)
            window.mmp_open_contact = {};
          window.mmp_open_contact[idInput] = true;
          m_mp_openTo(e, idInput);
        }, 100);
      }, 100);
    });
    return;
  }

  if (rcmail.env.action !== 'compose') {
    if (!$(e).hasClass('initialized')) {
      $(e).addClass('showcontacts')[0].id = `showcontacts_${idInput}`;
      setTimeout(() => {
        rcmail.annuaire_set_show_contacts();
        setTimeout(() => {
          $(e).click();
        }, 100);
      }, 100);

      $('#compose-contact-close-modal').click(() => {
        $('#compose-contacts').modal('hide');
      });

      $('#compose-contacts').on('hide.bs.modal', () => {
        if (window.create_popUp !== undefined)
          create_popUp.modal.css('z-index', '');
        else if ($('#globalModal').length > 0)
          $('#globalModal').css('z-index', '');

        if (rcmail.env.task === 'calendar') $('.ui-dialog').css('display', '');
        delete rcmail.env.annuaire_select_actions;
      });
    }

    if (actions?.onselect) {
      if (!rcmail.env.annuaire_select_actions)
        rcmail.env.annuaire_select_actions = {};
      rcmail.env.annuaire_select_actions.onselect = actions.onselect;
    }
  }

  if (window.create_popUp !== undefined) create_popUp.modal.css('z-index', 1);
  else if ($('#globalModal').length > 0) $('#globalModal').css('z-index', 1);

  if (rcmail.env.task === 'calendar') $('.ui-dialog').css('display', 'none');
}

function m_mp_on_open_select_calendar_contacts(node, node_id, fieldId) {
  console.log(node, fieldId);

  if (!!node.email && !!rcmail.env.email && node.email === rcmail.env.email) {
    rcmail.display_message("Vous êtes déjà l'organisateur !", 'error');
    $('#rcmrow' + node_id).removeClass('added');
  } else {
    let can = true;
    let title = '';
    $('#edit-attendees-table .attendee-name span').each((i, e) => {
      if (can) {
        title = $(e).attr('title');

        if (title === node.email) can = false;
      }
    });

    if (node.classes.includes('list')) {
      rcmail.display_message('Chargement de la liste...');
    } else {
      if (can) {
        $('#edit-attendee-add').click();
        $('#compose-contact-close-modal').click();
      } else {
        rcmail.display_message(
          'Vous avez déjà ajouté cet utilisateur !',
          'error',
        );
        $('#rcmrow' + node_id).removeClass('added');
      }
    }
  }
}

function m_mp_reinitialize_popup(funcBefore = null, funcAfter = null) {
  if (rcmail.busy === true) return;

  if (
    $('html').hasClass('layout-phone') ||
    $('html').hasClass('layout-small')
  ) {
    m_mp_Create();
    return;
  }

  if (funcBefore !== null) funcBefore();
  if (window.create_popUp !== undefined)
    window.create_popUp.removeBeforeTitle();
  delete window.create_popUp; // = undefined;
  $('.global-modal-body').css('height', '');
  m_mp_Create();
  if (funcAfter !== null) funcAfter();
}

function m_mp_switch_step(id) {
  $('.step').css('display', 'none');
  $('#' + id).css('display', '');

  create_popUp.modal.focus();
}

/**
 * Ouvre la fenêtre d'aide.
 */

/**
 * Affiche la modale du bouton "créer".
 */
function m_mp_Help() {
  FullscreenItem.close_if_exist();

  window.help_popUp = undefined;
  window.create_popUp = undefined;

  const actions = {
    helppage_general: get_action(
      'mel_metapage.h_general',
      'icon-mel-help',
      "window.open('" + rcmail.env.help_page + "', '_blank');",
    ),
    helppage_video: get_action(
      'mel_metapage.h_video',
      'icon-mel-camera',
      'm_mp_help_video()',
    ),
    helppage_suggestion: get_action(
      'mel_metapage.h_suggestion',
      'icon-mel-notes',
      '',
    ),
    helppage_current: get_action(
      'mel_metapage.h_current',
      'icon-mel-newspaper',
      "rcmail.current_page_onboarding((m_mp_DecodeUrl().task).replace('#',''))",
    ),
  };

  const isSmall =
    $('html').hasClass('layout-small') || $('html').hasClass('layout-phone');

  const isTouch = $('html').hasClass('touch');

  if (window.create_event === true && !!actions.event) {
    eval(actions.event.action);
    return;
  }

  //Si la popup n'existe pas, on la créer.
  if (window.help_popUp === undefined) {
    // Récupération du json
    fetch(window.location.pathname + 'plugins/mel_help/public/help.json', {
      credentials: 'include',
      cache: 'no-cache',
    }).then((res) => {
      res.json().then((help_array) => {
        // Génération de l'index
        let index = [];
        help_array.forEach((help, k) => {
          help.keywords.forEach((word) => {
            if (index[word]) {
              if (index[word] != k) {
                index[word].push(k);
              }
            } else {
              index[word] = [k];
            }
          });
        });

        // Positionnement des variables d'env
        rcmail.env.help_array = help_array;
        rcmail.env.help_index = index;
      });
    });
    let button = function (txt, font, click = '', external) {
      let disabled = click === '' ? 'disabled' : '';
      let external_logo =
        external === true
          ? '<span class="icon-mel-external top-right"></span>'
          : '';
      return (
        '<button class="btn btn-block btn-secondary btn-mel ' +
        disabled +
        '" onclick="' +
        click +
        '"' +
        disabled +
        '>' +
        external_logo +
        '<span class="' +
        font +
        '"></span>' +
        txt +
        '</button>'
      );
    };
    const _button = function (action, block = true, external = false) {
      return button(
        action.text,
        `${action.icon} ${block ? 'block' : ''}`,
        action.action,
        external,
      );
    };

    let helppage_general =
      `<li class="col-sd-4 col-md-4 mt-5" id="helppage_general" title="${rcmail.gettext('mel_metapage.menu_assistance_helppage_general')}">` +
      _button(actions.helppage_general, true, true) +
      '</li>';
    let helppage_video =
      `<li class="col-sd-4 col-md-4 mt-5" id="helppage_video" title="${rcmail.gettext('mel_metapage.menu_assistance_helppage_video')}">` +
      _button(actions.helppage_video) +
      '</li>';
    let helppage_suggestion =
      `<li class="col-sd-4 col-md-4 mt-5" id="helppage_suggestion" title="${rcmail.gettext('mel_metapage.menu_assistance_helppage_suggestion')}">` +
      _button(actions.helppage_suggestion, true, false) +
      '</li>';
    let helppage_current = '';
    if (
      rcmail.env.help_page_onboarding[m_mp_DecodeUrl().task.replace('#', '')] &&
      !isTouch
    ) {
      helppage_current =
        `<li class="col-12" id="helppage_current" title="${rcmail.gettext('mel_metapage.menu_assistance_helppage_current')}">` +
        _button(actions.helppage_current, false) +
        '</li>';
    }

    let html = "<div class='row' id='search_row'>";
    html +=
      '<label for="workspace-title" class="span-mel t2 first ml-4">' +
      rcmail.gettext('mel_metapage.describe_your_need_in_few_words') +
      '</label>';
    html += '<div class="input-group mx-4">';
    html +=
      '<label class="sr-only" for="helppage-search-input">Rechercher une aide pour le Bnum</label>';
    html +=
      '<input id="helppage-search-input" type="text" title="Recherche globale" placeholder="Recherche globale..." class="form-control mel-focus" onkeyup="rcmail.help_search(event, this);">';
    html += ' <div class="input-group-append">';
    html += '<span class="icofont-search input-group-text"></span>';
    html += '</div></div></div>';
    html += '<div id="help-search-results"></div>';
    html += '<div id="noresulthelp"></div>';

    html +=
      '<ul id=globallist class="row ignore-bullet">' +
      helppage_general +
      helppage_video +
      helppage_suggestion +
      helppage_current +
      '</ul>';
    let config = new GlobalModalConfig(
      rcmail.gettext('mel_metapage.assistance'),
      'default',
      html,
      '   ',
    );
    help_popUp = new GlobalModal('globalModal', config, !isSmall);
    help_popUp.contents
      .find('#helppage_suggestion button')
      .click(() => {
        mel_metapage.Functions.change_page(
          rcmail.env.help_suggestion_url.task,
          rcmail.env.help_suggestion_url.action,
        );
        help_popUp.close();
      })
      .removeClass('disabled')
      .removeAttr('disabled');

    rcmail.triggerEvent('on_create_window.matomo');
  } else if (!isSmall) {
    //Si elle existe, on l'affiche.
    window.help_popUp.show();
  }

  if ($('#globallist').length > 0 && !isSmall) {
    $('#globalModal .icon-mel-undo.mel-return').remove();
  }

  if (isSmall) {
    if (!$('#groupoptions-createthings').hasClass('initialized')) {
      for (const key in actions) {
        if (Object.hasOwnProperty.call(actions, key)) {
          //On cache l'onboarding sur mobile
          if (key !== 'helppage_current') {
            const element = actions[key];
            $('#ul-createthings').append(`
                  <li role="menuitem">
                      <a class="${element.icon}" role="button" href="#" onclick="${element.action}">
                          <span class="restore-font">${element.text}</span>
                      </a>
                  </li>
              `);
          }
        }
      }

      $('#groupoptions-createthings').addClass('initialized');
    }
    window.help_popUp.close();

    setTimeout(() => {
      $('#open-created-popup').click();
    }, 1);
  }
}

// Ancienne fonction d'aide
// function m_mp_Help() {
//     FullscreenItem.close_if_exist();

//     rcmail.mel_metapage_url_info = m_mp_DecodeUrl();
//     rcmail.command("help_open_dialog");
//     setTimeout(async() => {
//         let it = 0;

//         await wait(() => {
//             return $(".ui-widget-overlay.ui-front").length === 0 && it++ < 5; // ~2,5s
//         });

//         if ($(".ui-widget-overlay.ui-front").length > 0) {
//             $(".ui-widget-overlay.ui-front").on("click", () => {
//                 $(".ui-dialog-titlebar-close ").click();
//             });
//         }
//     }, 10);
// }

/**
 * Affiche la liste des vidéos d'assistance
 */

function m_mp_help_video() {
  try {
    // Génération de l'index
    let index = [];
    let k = -1;
    for (const [key, element] of Object.entries(rcmail.env.help_video)) {
      k++;
      let keywords = element.description + ' ' + element.title;
      let array = keywords.split(' ');

      array.forEach((word) => {
        if (index[word]) {
          if (index[word] != k) {
            index[word].push(k);
          }
        } else {
          index[word] = [k];
        }
      });
    }

    rcmail.triggerEvent('on_click_button.matomo', 'Aide - Voir les vidéos');

    // Positionnement des variables d'env
    rcmail.env.video_index = index;

    let html =
      '<label id="video-search-label-title" for="workspace-title" class="span-mel t2 first">' +
      rcmail.gettext('mel_metapage.search_a_video') +
      '</label>';
    html +=
      '<input id="videos-search-input" aria-labelledby="video-search-label-title" type="text" title="Rechercher" placeholder="Accueil..." class="form-control mel-focus mb-4" onkeyup="rcmail.video_search(event, this);">';

    html += '<div id="video-search-results"></div>';
    html += '<div id="noresultvideo"></div>';

    html += '<ul id="videolist" class="row ignore-bullet">';

    for (const [key, element] of Object.entries(rcmail.env.help_video)) {
      html +=
        '<li class="col-sd-12 col-md-12" id="helppage_video" title="Cliquer pour voir la vidéo">';
      html +=
        '<button class="btn btn-block btn-secondary btn-mel text-left" onclick="rcmail.m_mp_help_video_player(`' +
        key +
        '`)"><div class="row"><div class="col-4"><img src="' +
        location.protocol +
        '//' +
        location.host +
        location.pathname +
        '/plugins/mel_onboarding/thumbnail/' +
        element.poster +
        '" class="img-fluid rounded-start" alt="..."></div><div class="col-8"><h2>' +
        element.title +
        '</h2><p>' +
        element.description +
        '</p></div></div></button>';
      html += '</li>';
    }
    html += '</ul>';

    help_popUp.contents.html(html);

    help_popUp.editTitleAndSetBeforeTitle(
      '<a href="javascript:void(0)" class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="m_mp_Help()"><span class=sr-only>Retour à la modale de création</span></a>',
      'Vidéos du bureau numérique',
    );

    help_popUp.modal.focus();
    help_popUp.show();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Affiche une vidéo d'assistance
 */

rcube_webmail.prototype.m_mp_help_video_player = function (task) {
  try {
    help = rcmail.env.help_video[task];
    let html = '<div class="row">';
    html +=
      '<div class="max-video mb-3 p-3"><video controls autoplay id="help_video"><source src="' +
      location.protocol +
      '//' +
      location.host +
      location.pathname +
      '/plugins/mel_onboarding/videos/' +
      help.video +
      '" type="video/mp4">Désolé, votre navigateur ne prend pas en charge les vidéos intégrées.</video></div></div><h2>' +
      help.title +
      '</h2><p>' +
      help.description +
      '</p></div>';

    html += '</div>';

    help_popUp.contents.html(html);

    help_popUp.editTitleAndSetBeforeTitle(
      '<a href="javascript:void(0)" class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="m_mp_help_video()"><span class=sr-only>Retour à la modale de création</span></a>',
      help.title,
    );

    help_popUp.modal.focus();
    help_popUp.show();

    $('#globalModal').on('hide.bs.modal', function (e) {
      let video = document.getElementById('help_video');
      video.pause();
    });
  } catch (error) {
    console.error(error);
  }
};

/**
 * Change l'icône en classe en fonction du type.
 * @param {string} icon Icône à changer en classe.
 * @param {string} type Type du document.
 * @returns {string} Classe.
 */
function m_mp_CreateDocumentIconContract(icon, type) {
  return nextcloud_document.getIcon(icon, type);
}

/**
 * @async
 * Affiche les données pour créer un document dans la modale de création.
 */
async function m_mp_InitializeDocument(initPath = null) {
  rcmail.triggerEvent('on_click_button.matomo', 'Créer - Un document');

  create_popUp.editTitleAndSetBeforeTitle(
    '<a href="javascript:void(0)" class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="m_mp_reinitialize_popup(() => {})"><span class=sr-only>Retour à la modale de création</span></a>',
    "Création d'un nouveau document",
  );
  create_popUp.contents.html(
    '<center><span class="spinner-border"></span></center>',
  );

  let url_config = {
    _send: true,
  };

  if (initPath !== null) url_config['_initPath'] = initPath;

  url_config[rcmail.env.mel_metapage_const.key] =
    rcmail.env.mel_metapage_const.value;

  $(
    `<iframe style="display:none;width:100%;height:100%" src="${mel_metapage.Functions.url(
      'roundrive',
      'files_create',
      url_config,
    )}"></iframe>`,
  )
    .on('load', async () => {
      create_popUp.contents.find('.spinner-border').parent().remove();
      let iframe = create_popUp.contents.find('iframe').css('display', '');

      if (
        $('html').hasClass('layout-normal') ||
        $('html').hasClass('layout-large')
      ) {
        let it = 0;
        await wait(() => {
          if (++it > 4) return false;

          return (
            iframe[0].contentWindow.$('#roundrive-elements .col-md-3').length ==
            0
          );
        });
        iframe[0].contentWindow
          .$('#roundrive-elements .col-md-3')
          .removeClass('col-md-3')
          .addClass('col-3');
      }
      //console.log("iframe", iframe, iframe[0].contentWindow.$("#roundrive-elements .col-md-3"));

      $('.global-modal-body')
        .css('height', `${window.innerHeight - 200}px`)
        .css('overflow-y', 'auto')
        .css('overflow-x', 'hidden');
    })
    .appendTo(create_popUp.contents);
  create_popUp.show();
  // mel_metapage.Functions.get(
  //     mel_metapage.Functions.url("roundrive", "files_create"),
  //     {
  //         _send:false
  //     },(datas) => {
  //         create_popUp.contents.html(datas);
  //     }
  // )

  return;
  //window.create_popUp = new GlobalModal("globalModal", config, true);
  //$this->rc->config->get('documents_types');
  let html = '<form>';
  html +=
    '<label>' + rcmail.gettext('mel_metapage.choose_type_doc') + '</label>';
  html += '<div class=row>';
  let col = 0; //rcmail.env.mel_metapage_templates_doc.length/5;
  let ret = 0;
  for (
    let index = 0;
    index < rcmail.env.mel_metapage_templates_doc.length;
    index++
  ) {
    const element = rcmail.env.mel_metapage_templates_doc[index];
    html +=
      '<div class=col-3><button type=button class="doc-' +
      element.type +
      ' btn-template-doc btn btn-block btn-secondary btn-mel" onclick="m_mp_UpdateCreateDoc(`' +
      JSON.stringify(element).replace(/"/g, '¤¤¤') +
      '`)"><span style="display:block;margin-right:0px" class="' +
      m_mp_CreateDocumentIconContract(element.icon) +
      '"></span>' +
      rcmail.gettext('mel_metapage.' + element.name) +
      '</button></div>';
  }
  html += '</div>';
  html +=
    '<label>' + rcmail.gettext('mel_metapage.document_folder') + '</label>';
  html += '<div class=row><div class=col-12>';
  html +=
    '<select id="' +
    mel_metapage.Ids.create.doc_input_path +
    '" class=form-control>';
  html += '<option value=default>---</option>';
  folders = await window.mel_metapage_tmp;
  window.mel_metapage_tmp = null;
  for (let index = 0; index < folders.length; index++) {
    const element = folders[index];
    html +=
      '<option value="' + element.link + '">' + element.name + '</option>';
  }
  html += '</select>';
  html += '</div></div>';
  html += '<label>' + rcmail.gettext('mel_metapage.document_name') + '</label>';
  html += '<div class=row><div class=col-12><div class="input-group">';
  html +=
    '<input type=hidden id=' + mel_metapage.Ids.create.doc_input_hidden + '>';
  html +=
    '<input class=form-control id="' +
    mel_metapage.Ids.create.doc_input +
    '" type=text placeholder="Nouveau document texte" />';
  html += '<div class="input-group-append">';
  html += '<span class=input-group-text>.</span>';
  html +=
    '<input style="    border-left: initial;border-bottom-left-radius: 0;border-top-left-radius: 0" class="form-control input-group-input" id=' +
    mel_metapage.Ids.create.doc_input_ext +
    ' type=text placeholder="txt">';
  html += '</div></div></div></div>';
  html += '<div id=' + mel_metapage.Ids.create.doc_input + '-div ></div>';
  html +=
    '<button type=button style="margin-top:5px; margin-right:5px" class="btn btn-primary" onclick="m_mp_CreateDoc()">' +
    rcmail.gettext('mel_metapage.create_doc') +
    '</button>';
  html +=
    '<button type=button style=margin-top:5px class="btn btn-warning" onclick="m_mp_CreateDocRetour()">' +
    rcmail.gettext('back') +
    '</button>';
  html += '</form>';
  create_popUp.contents.html(html);
  $('.doc-' + rcmail.env.mel_metapage_templates_doc[0].type)[0].click();
  /*
  POST https://mel.din.developpement-durable.gouv.fr/mdrive/index.php/apps/richdocuments/ajax/documents/create
mimetype	"application/vnd.oasis.opendocument.text"
filename	"Test.odt"
dir	"/"
*/
}

/**
 * Met à jours les boutons de la création d'un document.
 * @param {string} json Données à traité.
 */
function m_mp_UpdateCreateDoc(json) {
  json = JSON.parse(json.replace(/¤¤¤/g, '"'));
  let querry = $('.doc-' + json.type);
  $('.btn-template-doc').removeClass('disabled').removeClass('active');
  querry.addClass('active').addClass('disabled');
  $('#' + mel_metapage.Ids.create.doc_input_hidden).val(JSON.stringify(json));
  $('#' + mel_metapage.Ids.create.doc_input).attr(
    'placeholder',
    (json.tags !== undefined && json.tags.includes('f')
      ? rcmail.gettext('mel_metapage.new_f')
      : rcmail.gettext('mel_metapage.new_n')) +
      ' ' +
      rcmail.gettext('mel_metapage.' + json.name).toLowerCase(),
  );
  $('#' + mel_metapage.Ids.create.doc_input_ext).attr(
    'placeholder',
    json.default_ext,
  );
  if (json.tags !== undefined && json.tags.includes('l'))
    $('#' + mel_metapage.Ids.create.doc_input_ext)
      .removeClass('disabled')
      .removeAttr('disabled');
  else
    $('#' + mel_metapage.Ids.create.doc_input_ext)
      .addClass('disabled')
      .attr('disabled', 'disabled');

  show_models_input(json.name);
}

function show_models_input(name) {
  const models_name = Object.keys(rcmail.env.mel_metapage_templates_models);
  let $querry = $('#models-input').html('');

  if (models_name.includes(name)) {
    $('#models-inputs-group').show();

    for (
      let i = 0;
      i < rcmail.env.mel_metapage_templates_models[name].length;
      i++
    ) {
      const element = rcmail.env.mel_metapage_templates_models[name][i];
      $querry.append(
        new Option(
          rcmail.gettext('mel_metapage.' + element.name),
          element.name,
        ),
      );
    }
  } else $('#models-inputs-group').hide();
}

function m_mp_CreateDocRetour() {
  create_popUp = undefined;
  m_mp_Create();
}

async function m_mp_CreateDoc() {
  let configModifier = function (type, value, path, modifiers = null) {
    return (config) => {
      if (path != null) path = Nextcloud_File.get_path(path);
      config.method = 'POST';
      config.body = JSON.stringify({
        mimetype: 'application/' + type,
        filename: value,
        dir: '/' + (path === null ? '' : path),
      });
      if (modifiers !== null && modifiers.length > 0) {
        if (modifiers.length === undefined)
          config = modifiers(val, path, config);
        else if (modifiers.length === 1)
          config = modifiers[0](val, path, config);
        else {
          for (let j = 0; j < modifiers.length; j++) {
            const element = modifiers[j];
            config = element(val, path, config);
          }
        }
      }
      //'mimetype="application/'+type+'"&filename="'+value+'"&dir="/'+(path === null ? "" : path)+'"';
      return config;
    };
  };
  let json = JSON.parse(
    $('#' + mel_metapage.Ids.create.doc_input_hidden).val(),
  );
  //console.log(json);
  if ($('#' + mel_metapage.Ids.create.doc_input).val() === '')
    $('#' + mel_metapage.Ids.create.doc_input).val(
      (json.tags !== undefined && json.tags.includes('f')
        ? 'Nouvelle'
        : 'Nouveau') +
        ' ' +
        json.name.toLowerCase(),
    );
  if ($('#' + mel_metapage.Ids.create.doc_input_ext).val() === '')
    $('#' + mel_metapage.Ids.create.doc_input_ext).val(json.default_ext);
  else if ($('#' + mel_metapage.Ids.create.doc_input_ext).val()[0] === '.')
    $('#' + mel_metapage.Ids.create.doc_input_ext).val(
      $('#' + mel_metapage.Ids.create.doc_input_ext)
        .val('txt')
        .replace('.', ''),
    );
  let val =
    $('#' + mel_metapage.Ids.create.doc_input).val() +
    '.' +
    $('#' + mel_metapage.Ids.create.doc_input_ext).val();
  let href = $('#' + mel_metapage.Ids.create.doc_input_path).val();
  if (href === 'default') href = null;
  //console.log("vall", val, href,$("#" + mel_metapage.Ids.create.doc_input_path).val());
  let nextcloud = new Nextcloud(rcmail.env.nextcloud_username);
  if ((await nextcloud.searchDocument(val, null, href)) === undefined) {
    create_popUp.contents.html(
      '<center><span class=spinner-border></span></center>',
    );
    {
      let embed_datas = {
        val: val,
        href: href,
        path: href === null ? null : Nextcloud_File.get_path(href),
        json: json,
      };
      if (
        !(await nextcloud_document.createDocument(
          json.type,
          nextcloud,
          embed_datas,
          configModifier,
        ))
      ) {
        console.error('Type de fichier inconnu !');
        throw 'Type de fichier inconnu !';
      }
    }

    let doc = await nextcloud.searchDocument(val, null, href);
    window.create_popUp.close();
    window.create_popUp = undefined;
    //console.log(doc, "doc");
    await nextcloud.go(doc);
  } else {
    window.create_popUp = undefined;
    $('#' + mel_metapage.Ids.create.doc_input).css('border-color', 'red');
    $('#' + mel_metapage.Ids.create.doc_input + '-div')
      .css('color', 'red')
      .html('Le nom ' + val + ' existe déjà dans ce dossier.');
  }
  //console.log("nc", await nextcloud.searchDocument(val), val);
}

async function m_mp_CreateDocCurrent(val = null, close = true) {
  let querry = $('.stockage-frame');
  if (val === null) {
    if ($('#' + mel_metapage.Ids.create.doc_input).val() === '')
      $('#' + mel_metapage.Ids.create.doc_input).val(
        'Nouveau document texte.txt',
      );
    val = $('#' + mel_metapage.Ids.create.doc_input).val();
  }
  if (close) {
    window.create_popUp.close();
    window.create_popUp = undefined;
  }
  rcmail.set_busy(true, 'loading');
  while (querry.contents().find('.button.new').length === 0) {
    await delay(500);
  }
  rcmail.set_busy(true, 'loading');

  querry.contents().find('.button.new')[0].click();

  querry
    .contents()
    .find('.menuitem')
    .each((i, e) => {
      if (e.dataset.filetype !== undefined && e.dataset.filetype === 'file')
        e.click();
    });
  rcmail.set_busy(true, 'loading');
  while (
    !Enumerable.from(querry.contents().find('input'))
      .select((x) => x.id)
      .where((x) => x.includes('input-file'))
      .any()
  ) {
    await delay(500);
  }

  let id = Enumerable.from(querry.contents().find('input'))
    .select((x) => x.id)
    .where((x) => x.includes('input-file'))
    .first();
  querry
    .contents()
    .find('#' + id)
    .val(val + (val.includes('.') ? '' : '.txt'));
  await delay(500);
  rcmail.set_busy(true, 'loading');
  if (
    !Enumerable.from(querry.contents().find('div'))
      .where(
        (x) =>
          Enumerable.from(x.classList).where((s) =>
            s.includes('tooltip').any(),
          ) &&
          x.innerHTML.includes(val) &&
          $(x).parent().hasClass('tooltip'),
      )
      .any()
  )
    querry
      .contents()
      .find('#' + id)
      .parent()
      .find('.icon-confirm')
      .click();
  //window.querry = querry;

  let it = 2;
  let bool = false;
  let tmpval = val;
  while (
    !Enumerable.from(querry.contents().find('input'))
      .where(
        (x) =>
          x.attributes.type !== undefined &&
          x.attributes.type.value === 'submit' &&
          x.classList.contains('primary'),
      )
      .any()
  ) {
    await delay(500);
    if (
      Enumerable.from(querry.contents().find('div'))
        .where(
          (x) =>
            Enumerable.from(x.classList).where((s) =>
              s.includes('tooltip').any(),
            ) &&
            x.innerHTML.includes(val) &&
            $(x).parent().hasClass('tooltip'),
        )
        .any()
    ) {
      // m_mp_Create();
      // m_mp_InitializeDocument();
      // $("#" + mel_metapage.Ids.create.doc_input).val(val).css("border-color", "red").parent().append("<br/><span style=color:red;>*Un fichier avec le même nom existe déjà !</span>");
      // rcmail.set_busy(false);
      // rcmail.clear_messages();
      // return;
      val = it + '-' + tmpval;
      ++it;
      querry
        .contents()
        .find('#' + id)
        .val(val);
      bool = true;
      //await delay(500);
      //querry.contents().find("#" + id).parent().find(".icon-confirm").click();
    } else if (bool) {
      querry
        .contents()
        .find('#' + id)
        .parent()
        .find('.icon-confirm')
        .click();
      rcmail.display_message(
        'Le nom ' + tmpval + ' existe déjà et sera remplacer par ' + val,
      );
    }
  }
  Enumerable.from(querry.contents().find('input'))
    .where(
      (x) =>
        x.attributes.type !== undefined &&
        x.attributes.type.value === 'submit' &&
        x.classList.contains('primary'),
    )
    .first()
    .click();

  //console.log("7 change page");
  m_mp_CreateOrOpenFrame(
    'stockage',
    () => {},
    () => {
      rcmail.set_busy(false);
      rcmail.clear_messages();
    },
  );
}

function m_mp_CreateDocNotCurrent() {
  if ($('#' + mel_metapage.Ids.create.doc_input).val() === '')
    $('#' + mel_metapage.Ids.create.doc_input).val(
      'Nouveau document texte.txt',
    );
  let val = $('#' + mel_metapage.Ids.create.doc_input).val();
  create_popUp.contents.html(
    '<center><span class=spinner-border></span></center>',
  );
  m_mp_CreateOrOpenFrame(
    'stockage',
    () => {},
    () => {
      rcmail.set_busy(true, 'loading');
      $('.stockage-frame')[0].src =
        'http://localhost/nextcloud/index.php' + '/apps/files';
      let querry = $('.stockage-frame');
      window.create_popUp.close();
      window.create_popUp = undefined;
      querry.css('margin-top', '60px');

      new Promise(async (a, b) => {
        await m_mp_CreateDocCurrent(val, false);
      });
    },
    false,
  );
}

function m_mp_DecodeUrl() {
  let url; // = $("#" + rcmail.env.current_frame)[0].contentDocument.location.href;
  if (
    rcmail.env.current_frame === undefined ||
    rcmail.env.current_frame == 'default' ||
    rcmail.env.current_frame_name === 'discussion'
  )
    url = window.location.href;
  else
    url =
      $('#' + rcmail.env.current_frame)[0]?.contentDocument?.location?.href ??
      $('#' + rcmail.env.current_frame)[0]?.contentWindow?.location?.href ??
      window.location.href;

  let text = '';
  let hasTask = false;
  let task = null;
  let action = null;
  for (let index = 0; index < url.length; ++index) {
    const element = url[index];
    if (element === '/') text = '';
    else if (element === '&' || index == url.length - 1) {
      if (index == url.length - 1) text += element;
      if (hasTask && text.includes('_action')) {
        action = text.replace('&', '').replace('?', '').replace('_action=', '');
        break;
      } else if (!hasTask && text.includes('_task')) {
        hasTask = true;
        task = text.replace('?', '').replace('&', '').replace('_task=', '');
        text = ';';
      } else text = '';
    } else text += element;
  }
  // console.log("url decode", {
  //     task:task,
  //     action:action
  // });
  return {
    task: task,
    action: action,
  };
}

/**
 * Ouvre ou créer une frame.
 * @param {string} frameClasse Frame à ouvrir
 * @param {function} funcBefore Fonction à appelé avant d'ouvrir.
 * @param {function} func Fonction à appelé une fois ouvert.
 */
async function m_mp_CreateOrOpenFrame(
  frameClasse,
  funcBefore,
  func = () => {},
  changepage = true,
) {
  if (funcBefore !== null) funcBefore();

  //mm_st_CreateOrOpenModal(frameClasse, changepage);
  await mel_metapage.Functions.change_frame(frameClasse, changepage, true);

  if (func !== null) {
    if (isAsync(func)) await func();
    else func();
  }
  // new Promise(async (a,b) => {
  //     while (parent.rcmail.env.frame_created === false) {
  //         await delay(1000);
  //     }
  //     if (func !== null)
  //         func();
  // });
}

async function m_mp_sondage() {
  $('.modal-close ').click();
  // let $querry = $('iframe.sondage-frame');

  // if ($querry.length > 0) $querry[0].src = rcmail.env.sondage_create_sondage_url;
  // else if($('.sondage-frame').length > 0) $('.sondage-frame')[0].contentWindow.$('#mel_sondage_frame')[0].src = rcmail.env.sondage_create_sondage_url;
  // else
  // {
  //     await mel_metapage.Functions.change_frame('sondage', true, true, {
  //         _url:rcmail.env.sondage_create_sondage_url
  //     });
  // }

  await mel_metapage.Functions.change_page(
    'sondage',
    null,
    {
      _url: encodeURIComponent(rcmail.env.sondage_create_sondage_url),
    },
    true,
    true,
  );
}

/**
 * Action de créer un évènement.
 */
function m_mp_CreateEvent(_action = null) {
  if (window.create_popUp !== undefined) window.create_popUp.close();
  const action =
    _action === null
      ? () => {
          m_mp_set_storage('calendar_create');
        }
      : _action;
  const calendar = 'calendar';
  //console.log(window.rcube_calendar_ui, rcmail.env.current_frame_name, rcmail.env.task);
  if (parent.child_cal === undefined) action();
  else {
    if (rcmail.env.current_frame_name !== undefined) {
      if (rcmail.env.current_frame_name === calendar)
        parent.child_cal.add_event('');
      else action();
    } else if (rcmail.env.task === calendar) parent.child_cal.add_event('');
    else action();
  }
}

/**
 * Action de créer un évènement après affichage de la frame.
 */
function m_mp_CreateEvent_inpage() {
  let event = rcmail.local_storage_get_item('calendar_create');
  let category = rcmail.local_storage_get_item('calendar_category');
  if (event !== null) {
    config = {};
    if (category != null) config['categories'] = ['ws#apitech-1'];

    if (event === true) parent.child_cal.add_event(config);
    rcmail.local_storage_remove_item('calendar_create');
    rcmail.local_storage_remove_item('calendar_category');
  }
}

/**
 * Sauvegarde une donnée et ferme la fenêtre de création.
 * @param {string} key Clé à sauvegarder.
 * @param {boolean} item Données à sauvegarder. "true" par défaut.
 * @param {boolean} close Ferme la fenêtre de création. "true" par défaut.
 */
function m_mp_set_storage(key, item = true, close = true) {
  rcmail.local_storage_set_item(key, item);
  if (close && window.create_popUp !== undefined) window.create_popUp.close();
}

/**
 * Effectue une action à faire si il y a des données dans le stockage local.
 * @param {string} storage_key Clé de la donnée à réupérer.
 * @param {function} action Action à faire si la donnée existe.
 * @param {boolean} remove Supprimer la données après avoir fait l'action. "true" par défaut.
 * @param {*} eventValue La valeur du stockage pour faire l'action. "true" par défaut. Si "¤avoid", l'action est toujours faite.
 */
function m_mp_action_from_storage(
  storage_key,
  action,
  remove = true,
  eventValue = true,
) {
  let event = rcmail.local_storage_get_item(storage_key);
  if (event !== null) {
    if (eventValue === '¤avoid') action(event);
    else {
      if (event === eventValue) action(event);
    }
    if (remove) rcmail.local_storage_remove_item(storage_key);
  }
}

/**
 * Ouvre une nouvelle tâche.
 */
function m_mp_OpenTask() {
  let navigator = window.child_rcmail === undefined ? rcmail : child_rcmail;
  new Promise(async (a, b) => {
    while (navigator.busy || rcmail.busy) {
      await delay(100);
    }
    navigator.command('newtask', '', this, event);
  });
}

/**
 * Ferme ariane.
 */
function m_mp_close_ariane() {
  try {
    event.preventDefault();
  } catch (e) {}

  if (parent.mel_metapage.PopUp.ariane !== undefined)
    parent.mel_metapage.PopUp.ariane.hide();
}

/**
 * Ouvre la frame d'ariane.
 */
function m_mp_full_screen_ariane() {
  event.preventDefault();
  parent.mm_st_CreateOrOpenModal('rocket');
}

/**
 * Ancre ariane.
 */
function m_mp_anchor_ariane() {
  event.preventDefault();
  if (parent.mel_metapage.PopUp.ariane !== undefined)
    parent.mel_metapage.PopUp.ariane.anchor();
}

async function m_mp_shortcuts() {
  if (window.shortcuts === undefined) {
    if ($('.fullscreen-item').length > 0) $('.fullscreen-item').remove();

    const tab_tasks = {
      left: '',
      right: 'Toute les tâches',
    };
    const config = {
      add_day_navigation: true,
      add_create: true,
      create_function:
        "html_helper.Calendars.create({selector:'.fullscreen-item .mm-agenda-date'});window.shortcuts.close();",
      add_see_all: true,
    };
    const tab_content = 'mel-responsive-tab-content';
    const tab_namespace = 'namespace-reponsive-tab-shortcut';
    const parent_selector = '.mm-shortcuts.apps';
    const attribs = {
      tasks: {
        'data-tab-name': 'Tâches',
        'data-selector-tab': '.square_div.shortcut-task.t',
        'data-is-default-tab': false,
        'data-parent-tabs': parent_selector,
      },
      calendar: {
        'data-tab-name': 'Agenda',
        'data-selector-tab': '.square_div.shorcut-calendar',
        'data-is-default-tab': true,
        'data-parent-tabs': parent_selector,
      },
    };

    let shortcuts = new FullscreenItem('body', true);
    shortcuts.generate_flex();
    html = '<div class=mm-shortcuts>';

    if (rcmail.env.shortcuts_queue_before !== undefined) {
      for (const key in rcmail.env.shortcuts_queue_before) {
        if (
          Object.hasOwnProperty.call(rcmail.env.shortcuts_queue_before, key)
        ) {
          const element = rcmail.env.shortcuts_queue_before[key];
          html += html_helper(
            html_helper.options.block,
            typeof element.html === 'function' ? element.html() : element.html,
            `shortcut-task shortcut-${element.key} ${tab_content} ${tab_namespace}`,
            {
              'data-tab-name': element?.name ?? element.key,
              'data-selector-tab': `.square_div.shortcut-task.shortcut-${element.key}`,
              'data-is-default-tab': false,
              'data-parent-tabs': parent_selector,
            },
          );
        }
      }
    }

    html += html_helper(
      html_helper.options.block,
      await html_helper.TasksAsync(tab_tasks, null, null, 'Toutes mes tâches'),
      tab_namespace + ' shortcut-task t ' + tab_content,
      attribs.tasks,
    );
    html += html_helper(
      html_helper.options.block,
      await html_helper.CalendarsAsync(config),
      tab_namespace + ' shortcut-task shorcut-calendar ' + tab_content,
      attribs.calendar,
    );

    if (rcmail.env.shortcuts_queue !== undefined) {
      for (const key in rcmail.env.shortcuts_queue) {
        if (Object.hasOwnProperty.call(rcmail.env.shortcuts_queue, key)) {
          const element = rcmail.env.shortcuts_queue[key];
          html += html_helper(
            html_helper.options.block,
            typeof element.html === 'function' ? element.html() : element.html,
            `shortcut-task shortcut-${element.key} ${tab_content} ${tab_namespace}`,
            {
              'data-tab-name': element?.name ?? element.key,
              'data-selector-tab': `.square_div.shortcut-task.shortcut-${element.key}`,
              'data-is-default-tab': false,
              'data-parent-tabs': parent_selector,
            },
          );
        }
      }
    }

    html += '</div>';
    shortcuts.add_app('items', html);

    if (html_helper.Calendars.$jquery_array) {
      const $jquery_array = html_helper.Calendars.$jquery_array;
      html_helper.Calendars.$jquery_array = undefined;
      shortcuts.item.find('.shorcut-calendar ul').html($jquery_array);
    }

    window.shortcuts = shortcuts;

    //debugger;
    MEL_ELASTIC_UI.initResponsive('shortcut', true).update();

    rcmail.triggerEvent('apps.create');
  } else {
    if (window.shortcuts.is_open) window.shortcuts.close();
    else window.shortcuts.open();
  }

  setTimeout(() => {
    $('#fullscreenreaderfocus').focus();
  }, 100);
}

function mm_add_shortcut(key, html, before = false, name = null) {
  let restart_shortcut = false;
  if (window.shortcuts !== undefined) {
    restart_shortcut = true;
  }

  if (!before) {
    if (rcmail.env.shortcuts_queue === undefined)
      rcmail.env.shortcuts_queue = [];

    rcmail.env.shortcuts_queue.push({
      key,
      html,
      name,
    });
  } else {
    if (rcmail.env.shortcuts_queue_before === undefined)
      rcmail.env.shortcuts_queue_before = [];

    rcmail.env.shortcuts_queue_before.push({
      key,
      html,
      name,
    });
  }

  if (restart_shortcut) {
    delete window.shortcuts;
    m_mp_shortcuts();
  }
}

function mm_create_calendar(e, existingEvent = null) {
  if (window.create_popUp !== undefined) {
    window.create_popUp.close();
    window.create_popUp = undefined;
  }

  let event;

  if (existingEvent === null || existingEvent === undefined)
    event = {
      // categories:["ws#" + id],
      // calendar_blocked:true,
      start: moment(),
      end: moment().add(1, 'h'),
      from: 'barup',
    };
  else {
    event = existingEvent;
    event.completeEvent = true;
  }

  rcmail.local_storage_set_item('tmp_calendar_event', event);
  return rcmail.commands['add-event-from-shortcut']
    ? rcmail.command('add-event-from-shortcut', '', e.target, e)
    : rcmail.command('addevent', '', e.target, e);
}

function m_mp_NewTask() {
  let func = () => {
    if (rcmail._events['pamella.tasks.afterinit'] !== undefined)
      rcmail.triggerEvent('pamella.tasks.afterinit', undefined);
  };

  mel_metapage.Functions.call(func, true);
}

function open_task(id, config = {}) {
  if (event !== undefined) event.preventDefault();

  mel_metapage.Storage.set('task_to_open', id);
  mel_metapage.Functions.change_frame('tasklist', true, false, config);

  if ($('iframe.tasks-frame').length > 0)
    $('iframe.tasks-frame')[0].contentWindow.rcmail.triggerEvent(
      'plugin.data_ready',
    );
  else if ($('.tasks-frame').length > 0)
    rcmail.triggerEvent('plugin.data_ready');
}

/**
 * Permet d'afficher masquer la pop up user Bienvenue
 */
async function m_mp_ToggleGroupOptionsUser(opener) {
  let $goupoptions_user = $('#groupoptions-user');
  let $button_settings = $('#button-settings');
  const state = $goupoptions_user.is(':visible') == true;

  if ($goupoptions_user.is(':visible') == true) {
    $goupoptions_user.hide();
    $goupoptions_user.data('aria-hidden', 'true');
    $goupoptions_user.data('opener', null);
    $button_settings.removeClass('force-fill');
    $(opener).data('aria-expanded', 'false');
    rcmail.triggerEvent('toggle-options-user', { show: false });
  } else {
    $('.options-custom')
      .css('position', 'relative')
      .css('min-height', '300px')
      .html(window.MEL_ELASTIC_UI.create_loader('options-loader'));
    $goupoptions_user.show();
    $goupoptions_user.data('opener', opener);
    $goupoptions_user.data('aria-hidden', 'false');
    $button_settings.addClass('force-fill');
    $(opener).data('aria-expanded', 'true');
    rcmail.menu_stack.push('groupoptions-user');
    rcmail.triggerEvent('toggle-options-user', { show: true });

    await mel_metapage.Functions.get(
      mel_metapage.Functions.url('mel_settings', 'load'),
      { _option: rcmail.env.current_frame_name },
      (data) => {
        data = JSON.parse(data);
        $('.options-custom').html(data.html);
        for (const [key, value] of Object.entries(data.settings)) {
          $input = $(`[name="${key}"]`);
          switch ($input[0].nodeName) {
            case 'INPUT':
              switch ($input.attr('type')) {
                case 'checkbox':
                  $input.prop('checked', JSON.parse(value));
                  break;
                case 'radio':
                  $input
                    .filter(`[data-value="${value}"]`)
                    .prop('checked', true);
                  break;
                case 'text':
                  $input.val(value);
                  break;
                default:
                  break;
              }
              break;

            case 'SELECT':
              $input.val(value);
              break;

            default:
              throw 'error';
          }
        }
      },
    );
  }

  rcmail.triggerEvent('toggle-quick-options.after', {
    hidden: state,
    frame: rcmail.env.current_frame_name,
  });

  $goupoptions_user = null;
  $button_settings = null;
}

/**
 * Permet de sauvegarder une option rapide
 */
function save_option(_option_name, _option_value, element) {
  element = $(element);
  const name = element.attr('name');

  $(`[name="${name}"]`).attr('disabled', 'disabled');
  const id = rcmail.set_busy(true, 'loading');

  return mel_metapage.Functions.post(
    mel_metapage.Functions.url('mel_settings', 'save'),
    { _option_name, _option_value },
    (data) => {
      const parsed_datas = JSON.parse(data);
      const is_string = typeof parsed_datas === 'string';

      console.log('datas', parsed_datas, is_string);

      $(`[name="${name}"]`).removeAttr('disabled');

      rcmail.set_busy(false, 'loading', id);
      rcmail.display_message('Enregistré avec succès', 'confirmation');

      if (element.data('no-action') || false) return;

      let func = element.data('function');
      if (func)
        eval(
          `${func}({key:'${_option_name}', value:${is_string ? `'${parsed_datas}'` : data}})`,
        );
      else {
        func = element.data('command');

        if (func)
          rcmail.command(func, { key: _option_name, value: parsed_datas });
        else rcmail.command('refreshFrame');
      }
    },
  );
}

//0007910: Popup d'information lors du clic sur un lien dans un mail
function external_link_modal(_url, isSuspect = false) {
  let url = new URL(_url);
  let domain = url.hostname;
  let html = new mel_html2('div', {
    attribs: { id: 'external-link-modal' },
    contents: [],
  });
  let title = new mel_html(
    'label',
    { class: 'span-mel t2' },
    rcmail.gettext('mel_metapage.leaving_bnum'),
  );
  let link = new mel_html('p', { class: 'external_url' }, _url);
  let warning = new mel_html2('label', {
    attribs: { class: 'text-danger mt-3 warning-label' },
    contents: [
      new mel_html(
        'span',
        { class: 'material-symbols-outlined warning-icon-large' },
        'warning',
      ),
      new mel_html(
        'span',
        { class: 'ml-2' },
        rcmail.gettext('mel_metapage.warning_external_link'),
      ),
    ],
  });
  let disableButton = false;
  let custom_switch = null;

  if (!isSuspect) {
    custom_switch = new mel_html2('div', {
      attribs: { class: 'custom-control custom-switch no-click-focus' },
      contents: [
        new mel_html('input', {
          name: '_trust_domain',
          id: 'rcmfd_trust_domain',
          type: 'checkbox',
          value: 'false',
          class: 'form-check-input custom-control-input no-click-focus',
          onchange: '$(this).val(this.checked)',
        }),
        new mel_html(
          'label',
          {
            for: 'rcmfd_trust_domain',
            class: 'custom-control-label option-switch no-click-focus pl-6',
          },
          rcmail.gettext('mel_metapage.always_authorize') +
            '<span class="external_domain">' +
            domain +
            '</span>',
        ),
      ],
    });
  } else {
    disableButton = true;
    let check = new mel_field('input', {
      name: 'warning_suspect_url',
      id: 'warning_suspect_url',
      type: 'checkbox',
      value: 'false',
      class: 'form-check-input custom-control-input no-click-focus',
    });
    check.onchange.push((e) => {
      e.currentTarget.checked
        ? $('#modal-save-footer').removeClass('disabled')
        : $('#modal-save-footer').addClass('disabled');
    });

    custom_switch = new mel_html2('div', {
      attribs: { class: 'custom-control custom-switch no-click-focus' },
      contents: [
        check,
        new mel_html(
          'label',
          {
            for: 'warning_suspect_url',
            class: 'custom-control-label option-switch no-click-focus pl-6',
          },
          '<span class="external_domain">' +
            domain +
            '</span>' +
            rcmail.gettext('mel_metapage.warning_suspect_url'),
        ),
      ],
    });
  }

  html.addContent(title);
  html.addContent(link);
  html.addContent(custom_switch);
  html.addContent(warning);

  let buttons = [
    {
      text: rcmail.gettext('mel_metapage.back'),
      class:
        'modal-close-footer btn mel-button btn-danger mel-before-remover px-4 ',
      click: function () {
        $(this).closest('.ui-dialog-content').dialog('close');
      },
    },
    {
      id: 'modal-save-footer',
      text: rcmail.gettext('mel_metapage.open_external_link'),
      class:
        'modal-save-footer btn btn-secondary mel-button px-4 ' +
        (disableButton ? 'disabled' : ''),
      click: function () {
        if ($('#rcmfd_trust_domain').val() === 'true') {
          mel_metapage.Functions.post(
            mel_metapage.Functions.url('mel_metapage', 'save_user_pref_domain'),
            { _domain: domain },
          );
        }
        window.open(_url, '_blank');
        $(this).closest('.ui-dialog-content').dialog('close');
      },
    },
  ];

  rcmail.show_popup_dialog(
    html.generate(),
    rcmail.gettext('mel_metapage.attention'),
    buttons,
    { width: 600, resizable: false, height: 210 },
  );
}

function tchap_options() {
  let $tchap = $('.tchap-frame');
  if ($tchap.length > 0) {
    $tchap[0].contentWindow.rcmail.triggerEvent('tchap.options');
  }
}

function tchap_disconnect() {
  let $tchap = $('.tchap-frame');
  if ($tchap.length > 0) {
    $tchap[0].contentWindow.rcmail.triggerEvent('tchap.disconnect');
  }
}

function tchap_sidebar() {
  let $tchap = $('.tchap-frame');
  if ($tchap.length > 0) {
    $tchap[0].contentWindow.rcmail.triggerEvent('tchap.sidebar');
  }
}
