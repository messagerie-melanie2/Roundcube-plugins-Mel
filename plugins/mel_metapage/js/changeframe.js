(() => {
  //window.addEventListener("message", receiveMessage, false);
  function mel_wsp_changeframe(event) {
    if (window !== top) top.mel_wsp_changeframe(event);

    // console.log("exec_info", event, event.data);
    if (event.data.exec_info === undefined) return;
    const message = event.data.exec_info;
    const datas = event.data.datas;
    switch (message) {
      case 'uid':
        rcmail.env.current_workspace_multipage_uid = datas;
        break;
      case 'UpdateMenu':
        //console.log("UpdateMenu", UpdateMenu, datas);
        UpdateMenu(datas.class, datas.picture, datas.toolbar);
        break;
      case 'ChangeFrame':
        if (metapage_frames.workspace === undefined) {
          metapage_frames.workspace = false;
          metapage_frames.addEvent('changepage.before', (eClass) => {
            //console.log("addEvent", $(".tiny-wsp-menu"));
            if (
              rcmail.env.wsp_datas.toolbar.exists === true &&
              metapage_frames.workspace === false
            ) {
              //($(".tiny-wsp-menu").length > 0 && $(".tiny-wsp-menu").css("display") !== "none")
              //console.log("test");
              try {
                //console.log("test", $(".wsp-toolbar-edited").css("display") !== "none");
                if (true || window.webconf_master_bar === undefined) {
                  $('.tiny-rocket-chat').css('display', 'block');
                  $('.tiny-wsp-menu')
                    .css('display', 'none')
                    .data(
                      'toolbaropen',
                      $('.wsp-toolbar-edited').css('display') !== 'none',
                    )
                    .data(
                      'lastopenedframe',
                      rcmail.env.wsp_datas.toolbar.current,
                    );
                  $('.wsp-toolbar-edited').css('display', 'none');

                  $('iframe.mwsp')
                    .removeClass('mwsp')
                    .each((i, e) => {
                      if (!$(e).hasClass('workspace-frame'))
                        e.contentWindow
                          .$('html')
                          .removeClass('mwsp')
                          .removeClass('mwvcs');
                    });
                } else {
                  $('.wsp-toolbar ').data(
                    'lastopenedframe',
                    rcmail.env.wsp_datas.toolbar.current,
                  );
                }
              } catch (error) {
                console.error(error);
              }
              //console.log("addEvent", $(".tiny-wsp-menu"));
              metapage_frames.workspace = true;
            } else {
              $('iframe.mwsp')
                .removeClass('mwsp')
                .each((i, e) => {
                  if (!$(e).hasClass('workspace-frame'))
                    e.contentWindow.$('html').removeClass('mwsp'); //.find(".mwsp-style").remove();
                });
            }
          });
          metapage_frames.addEvent(
            'changepage.after',
            (eClass, changepage, isAriane, querry, id) => {
              if (
                metapage_frames.workspace === true &&
                eClass === 'workspace'
              ) {
                if (true || window.webconf_master_bar === undefined) {
                  $('.tiny-wsp-menu').css('display', '');

                  if (
                    rcmail.env.mel_metapage_mail_configs[
                      'mel-chat-placement'
                    ] !== rcmail.gettext('up', 'mel_metapage')
                  )
                    $('.tiny-rocket-chat').css('display', 'none');

                  const lastFrame = $('.tiny-wsp-menu').data('lastopenedframe');
                  const toolbaropen = $('.tiny-wsp-menu').data('toolbaropen');
                  //console.log("test", toolbaropen, lastFrame, $(".tiny-wsp-menu").data("toolbaropen"));
                  if (toolbaropen) $('.wsp-toolbar-edited').css('display', '');

                  if (lastFrame === 'wekan')
                    ChangeFrame(
                      lastFrame,
                      $('iframe.workspace-frame').length > 0
                        ? $('iframe.workspace-frame')[0].contentWindow.rcmail
                            .env.wekan_datas.id
                        : rcmail.env.wekan_datas.id,
                    );
                  else if (lastFrame === 'stockage')
                    ChangeFrame(
                      lastFrame,
                      `uid:${rcmail.env.current_workspace_multipage_uid}`,
                    );
                  else ChangeFrame(lastFrame);
                } else {
                  const lastFrame = $('.wsp-toolbar').data('lastopenedframe');
                  ChangeFrame(lastFrame);
                }
                metapage_frames.workspace = false;

                if (
                  rcmail.env.wsp_datas.toolbar.exists === true &&
                  window.webconf_master_bar !== undefined
                ) {
                  let toolbar_conf = $('.webconf-toolbar');
                  if (!toolbar_conf.hasClass('switched-toolbar'))
                    window.webconf_master_bar.switch_toolbar();
                  toolbar_conf.find('.conf-switch-toolbar').css('display', '');
                }
              } else {
                if (
                  rcmail.env.wsp_datas.toolbar.exists === true &&
                  window.webconf_master_bar !== undefined
                ) {
                  let toolbar_conf = $('.webconf-toolbar');
                  if (toolbar_conf.hasClass('switched-toolbar'))
                    window.webconf_master_bar.switch_toolbar();
                  toolbar_conf
                    .find('.conf-switch-toolbar')
                    .css('display', 'none');
                }
              }
            },
          );
        }
        switch (datas) {
          case 'rocket':
            ChangeFrame(datas, event.data.url);
            break;
          default:
            ChangeFrame(
              datas,
              event.data.args === undefined ? null : event.data.args,
            );
            break;
        }
        break;
      case 'ChangePage':
        ChangePage(datas);
        break;
      case 'change_environnement':
        InitialiseDatas();
        rcmail.env.wsp_datas.toolbar.current = datas;
        break;
      case 'ChangeToolbarPage':
        //console.log("here", datas);
        ChangeToolbarPage(datas);
        break;
      default:
        break;
    }
  }

  window.mel_wsp_changeframe = mel_wsp_changeframe;
})();

function InitialiseDatas() {
  if (rcmail.env.wsp_datas === undefined)
    rcmail.env.wsp_datas = {
      toolbar: {},
    };
}

function UpdateMenu(_class, _picture, _toolbar) {
  const is_in_visio = !!top['mel.visio.started'];
  var $ = top.$;
  InitialiseDatas();
  if (rcmail.env.wsp_datas.toolbar.current === 'inpage') {
    if (true || window.webconf_master_bar === undefined) {
      let button = $('.tiny-rocket-chat');
      if (button.length > 0) button.css('display', 'block');
      $('.tiny-wsp-menu').remove();
      if ($('.wsp-toolbar-edited').length > 0)
        $('.wsp-toolbar-edited').remove();
      else
        $('.wsp-toolbar')
          .css('margin', '')
          .css('position', '')
          .css('bottom', '')
          .css('right', '')
          .css('z-index', '')
          .css('width', '');
      $('.added-wsp-item').remove();
    } else {
      let toolbar_conf = $('.webconf-toolbar');
      if (toolbar_conf.hasClass('switched-toolbar'))
        window.webconf_master_bar.switch_toolbar();
      toolbar_conf.find('.conf-switch-toolbar').remove();
      toolbar_conf.find('.wsp-toolbar-item-wsp').remove();
    }
    rcmail.env.wsp_datas.toolbar.exists = false;
  } else {
    if (true || window.webconf_master_bar === undefined) {
      rcmail.env.wsp_datas.toolbar.current = _class;
      if (
        rcmail.env.wsp_datas.toolbar.exists === true ||
        $('.wsp-toolbar-edited').length > 0
      )
        return;
      const basePx = '50px';
      let right = basePx;
      let bottom = basePx;

      let button = $('.tiny-rocket-chat');
      if (button.length > 0) {
        if (
          rcmail.env.mel_metapage_mail_configs['mel-chat-placement'] !==
          rcmail.gettext('up', 'mel_metapage')
        )
          button.css('display', 'none');

        right = button.css('right');
        bottom = button.css('bottom');

        if (right === 'auto') right = basePx;

        if (bottom === 'auto') bottom = basePx;
      }
      //console.log("button", button, right, bottom);
      button = top.$('.tiny-wsp-menu');

      if (button.length === 0) {
        let picture = $('.wsp-picture');
        top.$('#layout').append('<div class="tiny-wsp-menu enabled"></div>');
        button = top.$('.tiny-wsp-menu');
        button.css('position', 'absolute');
        button
          .css('left', '80px')
          .css('bottom', '2px')
          .css('height', '54px')
          .css('width', '54px')
          .css(
            'background-color',
            _picture === null
              ? picture.css('background-color')
              : _picture.color,
          )
          .css('z-index', 100)
          .addClass('dwp-round')
          .append(_picture === null ? picture.html() : _picture.picture);
      }
      button.css('display', '');

      (_toolbar !== null && top.$('.wsp-toolbar-edited').length === 0
        ? top.$('#layout').append(_toolbar).find('.wsp-toolbar-edited')
        : top.$('.wsp-toolbar-edited')
      )
        .css('margin', 'initial')
        .css('position', 'fixed')
        // .css("bottom", (parseInt(bottom.replace("px", "")) - 3) + "px")
        // .css("right", right)
        .css('z-index', 99)
        // .css("width", "calc(100% - 120px)")
        .prepend(
          '<div class="wsp-toolbar-item added-wsp-item" style="pointer-events: none;border:none"></div><v_separate></v_separate>',
        )
        .find('.wsp-toolbar-melw-wsp-hider')
        .click((e) => {
          const down = 'icon-mel-chevron-down';
          const up = 'icon-mel-chevron-up';
          let $children = $(e.currentTarget).children();

          if ($children.hasClass(down)) {
            let $parent = $(e.currentTarget)
              .css('right', '0')
              .css('width', '100%')
              .attr('title', "Afficher la barre d'accès rapide")
              .parent();
            $parent.css('bottom', `-${$parent[0].clientHeight}px`);
            $('.tiny-wsp-menu').css('bottom', `-${$parent[0].clientHeight}px`);
            $children.removeClass(down).addClass(up);
            //.addClass("moved");
            $('.mwsp').addClass('moved');
          } else {
            let $parent = $(e.currentTarget)
              .css('right', '')
              .css('width', '')
              .attr('title', "Cacher la barre d'accès rapide")
              .parent();
            $parent.css('bottom', '');
            $('.tiny-wsp-menu').css('bottom', '2px');
            $children.removeClass(up).addClass(down);
            $('.mwsp').removeClass('moved');
          }
        });
      rcmail.env.wsp_datas.toolbar = {
        current: _class,
        exists: true,
      };

      if (is_in_visio) {
        $('.wsp-toolbar-edited')
          .addClass('webconfstarted')
          .css(
            'max-width',
            `calc(100% - ${$('iframe.webconf-frame').width()}px)`,
          );
      }
    } else {
      if (rcmail.env.wsp_datas.toolbar.exists === true) return;
      let toolbar_conf = $('.webconf-toolbar');
      const toolbar_wsp = $(_toolbar);
      toolbar_wsp.find('.wsp-toolbar-item').each((i, e) => {
        toolbar_conf.append(
          ($(e).hasClass('first')
            ? $(e).css('margin-left', '60px').css('pointer-events', 'all')
            : $(e)
          )
            .addClass('wsp-toolbar-item-wsp')
            .css('display', 'none'),
        );
      });
      toolbar_conf.append(
        '<div onclick="window.webconf_master_bar.switch_toolbar()" class="wsp-toolbar-item conf-switch-toolbar"><span class="icofont-exchange"></span><span class="text-item">Espace</span></div>',
      );
      rcmail.env.wsp_datas.toolbar = {
        current: _class,
        exists: true,
      };
      window.webconf_master_bar.switch_toolbar();
    }
  }
}

async function ChangeToolbar(_class, event, otherDatas = null) {
  const uid = $(event).data('uid');

  if (rcmail.busy) {
    rcmail.clear_messages();
    rcmail.set_busy(false);
  }

  $('.wsp-toolbar-item')
    .removeClass('active')
    .removeAttr('disabled')
    .removeAttr('aria-disabled');
  $(event).addClass('active');
  if (_class !== 'rocket') {
    $(event).attr('disabled', 'disabled').attr('aria-disabled', 'true');
  }

  let datas = [
    {
      exec_info: 'uid',
      datas: uid,
    },
  ];
  let picture = $('.wsp-picture');

  switch (_class) {
    case 'calendar':
      datas.push({
        exec_info: 'change_environnement',
        datas: _class,
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: picture.css('background-color'),
            picture: picture.html(),
          },
          toolbar: $('.wsp-toolbar')[0].outerHTML.replace(
            'wsp-toolbar',
            'wsp-toolbar wsp-toolbar-edited',
          ),
        },
      });
      datas.push({
        exec_info: 'ChangeFrame',
        datas: _class,
      });
      break;
    case 'mail':
      datas.push({
        exec_info: 'change_environnement',
        datas: _class,
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: picture.css('background-color'),
            picture: picture.html(),
          },
          toolbar: $('.wsp-toolbar')[0].outerHTML.replace(
            'wsp-toolbar',
            'wsp-toolbar wsp-toolbar-edited',
          ),
        },
      });
      datas.push({
        exec_info: 'ChangeFrame',
        datas: _class,
        args: $(event).data('email'),
      });
      break;
    case 'stockage':
      datas.push({
        exec_info: 'change_environnement',
        datas: _class,
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: picture.css('background-color'),
            picture: picture.html(),
          },
          toolbar: $('.wsp-toolbar')[0].outerHTML.replace(
            'wsp-toolbar',
            'wsp-toolbar wsp-toolbar-edited',
          ),
        },
      });
      datas.push({
        exec_info: 'ChangeFrame',
        datas: _class,
        args: otherDatas === null ? `uid:${uid}` : otherDatas,
      });
      break;
    case 'rocket':
      if (parent.$('html').hasClass('webconf-started')) {
        if (
          parent.$('.webconf-toolbar').length > 0 &&
          parent
            .$('.webconf-toolbar .wsp-toolbar-item.conf-ariane')
            .css('display') !== 'none'
        ) {
          if (
            !parent
              .$('.webconf-toolbar .wsp-toolbar-item.conf-ariane')
              .hasClass('active')
          ) {
            parent.$('.webconf-toolbar .wsp-toolbar-item.conf-ariane').click();
          }

          (parent.$('iframe.webconf-frame').length > 0
            ? parent
                .$('iframe.webconf-frame')[0]
                .contentWindow.$('#mm-ariane')[0]
            : parent.$('#mm-ariane')[0]
          ).contentWindow.postMessage(
            {
              externalCommand: 'go',
              path: otherDatas,
            },
            '*',
          );
        } else {
          alert(
            "Cette option n'est pas compatible avec votre visioconférence.",
          );
        }

        return;
      }

      datas.push({
        exec_info: 'change_environnement',
        datas: _class,
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: picture.css('background-color'),
            picture: picture.html(),
          },
          toolbar: $('.wsp-toolbar')[0].outerHTML.replace(
            'wsp-toolbar',
            'wsp-toolbar wsp-toolbar-edited',
          ),
        },
      });
      datas.push({
        exec_info: 'ChangeFrame',
        datas: 'rocket',
        url: otherDatas,
      });
      break;
    case 'tchap':
      datas.push({
        exec_info: 'change_environnement',
        datas: _class,
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: picture.css('background-color'),
            picture: picture.html(),
          },
          toolbar: $('.wsp-toolbar')[0].outerHTML.replace(
            'wsp-toolbar',
            'wsp-toolbar wsp-toolbar-edited',
          ),
        },
      });
      datas.push({
        exec_info: 'ChangeFrame',
        datas: 'tchap',
        url: otherDatas,
      });
      break;
    case 'home':
      datas.push({
        exec_info: 'change_environnement',
        datas: 'inpage',
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: null,
            picture: null,
          },
          toolbar: null,
        },
      });
      datas.push({
        exec_info: 'ChangePage',
        datas: _class,
      });
      break;

    case 'tasklist':
      datas.push({
        exec_info: 'change_environnement',
        datas: _class,
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: picture.css('background-color'),
            picture: picture.html(),
          },
          toolbar: $('.wsp-toolbar')[0].outerHTML.replace(
            'wsp-toolbar',
            'wsp-toolbar wsp-toolbar-edited',
          ),
        },
      });
      datas.push({
        exec_info: 'ChangeFrame',
        datas: _class,
        args: rcmail.env.current_workspace_tasklist_uid,
      });
      break;

    case 'wekan':
      datas.push({
        exec_info: 'change_environnement',
        datas: _class,
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: _class,
          picture: {
            color: picture.css('background-color'),
            picture: picture.html(),
          },
          toolbar: $('.wsp-toolbar')[0].outerHTML.replace(
            'wsp-toolbar',
            'wsp-toolbar wsp-toolbar-edited',
          ),
        },
      });
      datas.push({
        exec_info: 'ChangeFrame',
        datas: _class,
        args: otherDatas !== null ? otherDatas : $(event).data('wekan'),
      });
      break;
    case 'params':
      datas.push({
        exec_info: 'change_environnement',
        datas: 'inpage',
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: 'inpage',
          picture: {
            color: null,
            picture: null,
          },
          toolbar: null,
        },
      });
      datas.push({
        exec_info: 'ChangePage',
        datas: _class,
      });
      break;
    case 'back':
      datas.push({
        exec_info: 'change_environnement',
        datas: 'inpage',
      });
      datas.push({
        exec_info: 'UpdateMenu',
        datas: {
          class: 'inpage',
          picture: {
            color: null,
            picture: null,
          },
          toolbar: null,
        },
      });
      datas.push({
        exec_info: 'ChangePage',
        datas: _class,
      });
      break;

    default:
      console.log(_class);
      break;
  }

  try {
    for (let index = 0; index < datas.length; index++) {
      const element = datas[index];
      mel_wsp_changeframe({
        data: element,
      });
    }
  } catch (error) {
    console.error(
      "###Une erreur c'est produite lors du changement de page.",
      error,
      datas,
    );
  }

  if (uid !== undefined) {
    const url =
      mel_metapage.Functions.url('workspace', 'workspace', {
        _uid: uid,
        _page: _class,
      }) + '&_force_bnum=1';
    window.history.replaceState(
      {},
      document.title,
      url.replace(
        `&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`,
        '',
      ),
    );
    if (window !== top)
      top.history.replaceState(
        {},
        document.title,
        url.replace(
          `&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`,
          '',
        ),
      );
  }
}

async function ChangeFrame(_class, otherDatas = null) {
  const is_in_visio = !!top['mel.visio.started'];
  //Actions à faire avant de changer de frame
  if (
    rcmail.env.mel_metapage_mail_configs['mel-chat-placement'] ===
    rcmail.gettext('up', 'mel_metapage')
  )
    ArianeButton.default().hide_button();

  try {
    m_mp_close_ariane();
  } catch (error) {}
  if (
    _class === 'rocket' &&
    $('.discussion-frame').length > 0 &&
    $('.discussion-frame').css('display') !== 'none'
  ) {
    $('.discussion-frame')[0].contentWindow.postMessage(
      {
        externalCommand: 'go',
        path: otherDatas,
      },
      '*',
    );
    return;
  }

  const style =
    $('iframe.workspace-frame').length > 0
      ? $('iframe.workspace-frame')[0].contentWindow.rcmail.env
          .current_bar_colors
      : rcmail.env.current_bar_colors;

  if (!is_in_visio) $('.mm-frame').css('display', 'none');
  else
    $('.mm-frame').each((i, e) => {
      if (!$(e).hasClass('webconf-frame')) $(e).css('display', 'none');
    });

  $('.wsp-object').css('display', 'none');

  $('.workspace-frame').css('display', 'none');

  //Gestion de la config en fonction des dofférentes frame voulues
  let config = null;

  if (
    _class === 'tasklist' &&
    otherDatas !== undefined &&
    otherDatas !== null
  ) {
    parent.$('.tasks-frame').remove();

    config = {
      source: otherDatas,
    };
    await mel_metapage.Functions.post(
      mel_metapage.Functions.url('tasks', 'tasklist'),
      {
        action: 'subscribe',
        l: {
          id: otherDatas,
          active: 1,
        },
      },
      (success) => {
        console.log('change task to ok', success);
      },
    );
  } else if (_class === 'links') {
    config = {
      _task: 'workspace',
      _action: 'show_links',
      _id: otherDatas,
    };

    if (
      $('.links-frame').length > 0 &&
      !$('.links-frame')[0].contentWindow.window.location.href.includes(
        otherDatas,
      ) &&
      otherDatas !== null
    )
      $('.links-frame').remove();
  } else if (_class === 'stockage' && otherDatas !== null) {
    if (
      otherDatas !== undefined &&
      otherDatas !== null &&
      otherDatas.includes('uid:')
    )
      config = {
        _params: `/apps/files?dir=/dossiers-${otherDatas.replace(':uid', '')}`,
      };
    else config = { _params: otherDatas.replace(rcmail.env.nextcloud_url, '') };
  }

  if (_class === 'calendar')
    rcmail.env.have_calendar_frame = parent.$('.calendar-frame').length !== 0;

  rcmail.set_busy(true, 'loading');
  rcmail.env.can_change_while_busy = true;

  //Ouverture de la frame
  const id = top.mm_st_OpenOrCreateFrame(_class, false, config);
  await wait(() => rcmail.env.frame_created !== true);

  //Gestion de "l'encadrage"
  parent.$('.mwsp').each((i, e) => {
    try {
      let $style =
        e.nodeName === 'IFRAME'
          ? e.contentWindow.$('.mwsp-style')
          : $('.mwsp-style');

      if ($style.length > 0) $style.remove();
    } catch (error) {}
  });

  if (_class !== 'rocket') {
    let $querry = $(`iframe#${id}`);
    //Si la frame n'existe pas
    if ($querry.length === 0) {
      //On récupère le nom de la frame
      const $layout_thing =
        $('#layout-content').length > 0
          ? $('#layout-content')
          : $('#layout-sidebar');
      const currentFrameClasse = Enumerable.from($layout_thing[0].classList)
        .first((x) => x.includes('-frame') && x !== 'mm-frame')
        .replaceAll('-frame', '');

      $(`.${currentFrameClasse}-frame`).remove();
      rcmail.env.frame_created = false;

      //On supprime et on ouvre une nouvelle frame
      return await ChangeFrame(
        mm_st_ClassContract(currentFrameClasse),
        otherDatas,
      );
    } else {
      try {
        //On ajoute les différents styles et classes
        $querry.addClass('mwsp')[0].contentWindow.$('html').addClass('mwsp');

        if (parent.$('html').hasClass('webconf-started'))
          $querry.addClass('mwvcs');

        if (style !== undefined && style !== null && style !== '')
          $querry
            .addClass('mwsp')[0]
            .contentWindow.$('body')
            .prepend(`<div class="mwsp-style">${style}</div>`);
      } catch (error) {
        console.error('###[ChangeFrame]', error);
      }
    }
  }

  //Choses à faire en fonction des différentes frames voulues
  if (
    $(`#${id}`).length === 0 ||
    $(`#${id}`).parent()[0].id !== 'layout-frames'
  )
    $('#layout-frames').css('display', 'none');

  if (window.webconf_master_bar === undefined)
    (_class === 'rocket'
      ? $('#' + id)
          .css('display', '')
          .parent()
          .parent()
      : $('#' + id)
          .css('display', '')
          .parent()
    )
      .css('display', '')
      .css('position', 'absolute')
      .css('height', '100%');

  if (_class === 'rocket') {
    $('.a-frame').css('display', '');
    $('#' + id)[0].contentWindow.postMessage(
      {
        externalCommand: 'go',
        path: otherDatas,
      },
      '*',
    );
    $('.card-disabled').find('iframe').addClass('mwsp');
  } else {
    $('.a-frame').css('display', 'none');
    $('.card-disabled').find('iframe').removeClass('mwsp');
  }

  let uid = undefined;
  if (
    otherDatas !== undefined &&
    otherDatas !== null &&
    otherDatas.includes('uid:')
  ) {
    uid = otherDatas.replace('uid:', '');
    otherDatas = null;
  }

  let currentFrame;
  //Mails
  if (_class === 'mail') {
    //`edt.${rcmail.env.current_workspace_uid}@i-carre.net`
    currentFrame = parent.$('iframe.mail-frame');
    $(
      currentFrame.length > 0
        ? currentFrame[0].contentDocument
        : parent.document,
    ).ready(() => {
      mel_metapage.Functions.searchOnMail(otherDatas, ['to', 'cc', 'bcc']);
    });
  }
  if (_class === 'calendar') {
    currentFrame = parent.$('iframe.calendar-frame');
    calendar = (
      currentFrame.length === 0 ? parent : currentFrame[0].contentWindow
    ).$('#calendar'); //.scrollToTime( durationInput );
    calendar.fullCalendar('rerenderEvents');
    $scroll = calendar.find('.fc-scroller');
    const currentHour = moment().format('HH');
    var testOffset = calendar.find(`tr[data-time="${currentHour}:00:00"]`);
    $scroll.scrollTop(0);

    const y = testOffset[0].getClientRects()[0].y;
    const t = $scroll.offset().top;

    if (rcmail.env.have_calendar_frame !== true) {
      setTimeout(() => {
        $scroll.scrollTop(y - t);
      }, 100);
      rcmail.env.have_calendar_frame = true;
    } else $scroll.scrollTop(y - t);
    //parent.rotomeca = calendar.fullCalendar('getCalendar');//.scrollToTime(`${rcmail.env.calendar_settings.first_hour}:00`);
  }

  //Stockage
  else if (_class === 'stockage') {
    currentFrame = parent.$('iframe.stockage-frame');
    //Mode frame
    if (currentFrame.length > 0) {
      currentFrame[0].contentWindow.rcmail.env.nextcloud_gotourl =
        otherDatas ?? `${Nextcloud.index_url}/apps/files?dir=/dossiers-${uid}`;
      currentFrame[0].contentWindow.$('#mel_nextcloud_frame')[0].src =
        otherDatas ?? `${Nextcloud.index_url}/apps/files?dir=/dossiers-${uid}`;
    } else {
      parent.rcmail.env.nextcloud_gotourl =
        otherDatas ?? `${Nextcloud.index_url}/apps/files?dir=/dossiers-${uid}`;
      parent.$('#mel_nextcloud_frame')[0].src =
        otherDatas ?? `${Nextcloud.index_url}/apps/files?dir=/dossiers-${uid}`;
    }
    // mel_metapage.Functions.call("update_location", false, {
    //     _integrated:true,
    //     args:[otherDatas !== null ? otherDatas :`${Nextcloud.index_url}/apps/files?dir=/dossiers-${uid}`,"stockage-frame","mel_nextcloud_frame"]
    // });
  }
  //Kanban
  else if (_class === 'wekan') {
    if (otherDatas !== null) {
      mel_metapage.Functions.call('update_location', false, {
        _integrated: true,
        args: [
          otherDatas === null
            ? rcmail.env.wekan_base_url
            : `${rcmail.env.wekan_base_url}/b/${otherDatas}/null`,
          'wekan-frame',
          'wekan-iframe',
        ],
      });
    }
  }

  $(`#${id}`).css('display', '');
  $('.workspace-frame').css('display', 'none');

  if (is_in_visio) {
    $(`#${id}`).css(
      'width',
      `calc(100% - ${$('iframe.webconf-frame').width()}px)`,
    );
  }

  rcmail.env.have_frame_positioned = true;
  rcmail.set_busy(false);
  rcmail.clear_messages();
}

async function ChangePage(_class) {
  const is_in_visio = !!top['mel.visio.started'];
  if (!is_in_visio) $('.mm-frame').css('display', 'none');
  else
    $('.mm-frame').each((i, e) => {
      if (!$(e).hasClass('webconf-frame')) $(e).css('display', 'none');
    });
  $('.a-frame').css('display', 'none');

  let layout_frame = $('#layout-frames');

  if (true) {
    layout_frame.css('position', '').css('height', '');

    if (layout_frame.find('.workspace-frame').length >= 1)
      layout_frame.css('display', '');
    else layout_frame.css('display', 'none');
  } else {
    if ($('iframe.workspace-frame').length > 0) layout_frame.css('width', '');
    else
      layout_frame.css(
        'width',
        `${window.webconf_master_bar.webconf.ariane.size}px`,
      );
  }

  $('.workspace-frame').css('display', '');
  let frame = $('iframe.workspace-frame');

  if (frame.length >= 1) {
    //&& Enumerable.from(frame.parent()).any(x => x.id === "layout-frames"))
    const base_context = frame[0].contentWindow;
    if (base_context.workspace_frame_manager) {
      const context = base_context.workspace_frame_manager
        .getActiveFrame()
        .get()[0].contentWindow;
      context.ChangeToolbarPage(_class);
      context.rcmail.set_busy(false);
      context.rcmail.clear_messages();
    }
  } else ChangeToolbarPage(_class);
}

window.ChangeToolbarPage = ChangeToolbarPage;

async function ChangeToolbarPage(_class) {
  const is_in_visio = !!top['mel.visio.started'];
  let layout_frame = $('#layout-frames');
  let workspace_frame = layout_frame.find('.workspace-frame');

  const _$ =
    workspace_frame.length === 0 ? $ : workspace_frame[0].contentWindow.$;

  if (
    rcmail.env.mel_metapage_mail_configs['mel-chat-placement'] ===
    rcmail.gettext('up', 'mel_metapage')
  )
    ArianeButton.default().show_button();

  _$('.wsp-toolbar').css('z-index', '');
  _$('.wsp-object').css('display', 'none');
  _$('.wsp-toolbar-item')
    .removeClass('active')
    .removeAttr('disabled')
    .removeAttr('aria-disabled');

  // if (window.webconf_master_bar !== undefined)
  //     window.webconf_master_bar.minify_toolbar();
  if (is_in_visio && !!top.masterbar) {
    top.masterbar.show_masterbar();
  }
  //console.log($(".wsp-object"), $(".wsp-toolbar-item.first"), $(".wsp-home"));
  switch (_class) {
    case 'home':
      _$('.wsp-toolbar-item.wsp-home')
        .addClass('active')
        .attr('disabled', 'disabled')
        .attr('aria-disabled', 'true');
      _$('.wsp-home').css('display', '');
      break;
    case 'wekan':
      _$('.wsp-toolbar-item.wsp-wekan')
        .addClass('active')
        .attr('disabled', 'disabled')
        .attr('aria-disabled', 'true');

      if (_$('iframe.wsp-wekan-frame').length === 0) {
        _$('.body').append(`
                <div class="wsp-services wsp-object wsp-wekan">
                <iframe style=width:100%;min-height:500px;margin-top:30px; title="wekan" class="wsp-wekan-frame" src="${rcmail.env.wekan_base_url}/b/${rcmail.env.wekan_datas.id}/${rcmail.env.wekan_datas.title}"></iframe>
                </div>
                `);
      } else _$('.wsp-wekan').css('display', '');

      //console.log("wekan_url", `${rcmail.env.wekan_base_url}/b/${rcmail.env.wekan_datas.id}/${rcmail.env.wekan_datas.title}`);
      break;
    case 'links':
      _$('.wsp-toolbar-item.wsp-links')
        .addClass('active')
        .attr('disabled', 'disabled')
        .attr('aria-disabled', 'true');

      if (_$('iframe.wsp-links-frame').length === 0) {
        _$('.body').append(`
                <div class="wsp-services wsp-object wsp-links">
                <iframe style=width:100%;min-height:500px;margin-top:30px; title="Liens utiles" class="wsp-links-frame" src="${mel_metapage.Functions.url('workspace', 'show_links', { _is_from: 'iframe', _id: rcmail.env.current_workspace_uid })}"></iframe>
                </div>
                `);
      } else _$('.wsp-links').css('display', '');

      //console.log("wekan_url", `${rcmail.env.wekan_base_url}/b/${rcmail.env.wekan_datas.id}/${rcmail.env.wekan_datas.title}`);
      break;
    case 'params':
      _$('.wsp-toolbar-item.wsp-item-params')
        .addClass('active')
        .attr('disabled', 'disabled')
        .attr('aria-disabled', 'true');
      _$('.wsp-params').css('display', '');
      break;
    case 'back':
      rcmail.set_busy(false);

      if (parent.webconf_master_bar !== undefined) {
        parent.webconf_master_bar.update_toolbar_position(true);
      }

      if (!window.workspace_frame_manager) {
        _$('.body')
          .html(
            $(
              '<span style="margin-top:30px;width:200px;height:200px" class=spinner-border></span>',
            ),
          )
          .css('display', 'grid')
          .css('justify-content', 'center');
        rcmail.command('workspace.go');
      } else {
        await ChangeToolbarPage('home');
        workspace_frame_manager.goToList();
      }

      break;
    default:
      break;
  }
}

function HideOrShowMenu(element) {
  const enabled = 'enabled';
  const disabled = 'disabled';
  element = $(element);
  if (element.hasClass(enabled)) {
    element.removeClass(enabled);
    element.addClass(disabled);
    $('.wsp-toolbar-edited').css('display', 'none');
  } else {
    element.removeClass(disabled);
    element.addClass(enabled);
    $('.wsp-toolbar-edited').css('display', '');
  }

  if ($('.layout-small').length > 0 || $('.layout-phone').length > 0) {
    $('#menu-hanburger-wsp').click();
  }

  if ($('html').hasClass('layout-small') || $('html').hasClass('layout-phone'))
    ClickOnButton(true);
}

function ClickOnButton(addAll = false) {
  let options = [];

  $('.wsp-toolbar-item').each((i, e) => {
    if ($(e).hasClass('small-item')) return;
    else if (!addAll && ($(e).hasClass('first') || $(e).hasClass('wsp-home')))
      return;

    const text = $(e).find('.text-item').html();
    if (
      !Enumerable.from(options).any((x) => x.text === text) &&
      text != 'undefined' &&
      text !== undefined
    )
      options.push(
        new OptionObject(
          text,
          `$('.${Enumerable.from(e.classList).toArray().join('.')}').click()`,
        ),
      );
  });

  let customOption = new CustomOption({ options: options });
  customOption.show();
  setTimeout(() => {
    customOption.click();
  }, 100);
}
// function ChangeMenu(hide = true ,_picture = null, _toolbar = null)
// {
//     console.log("ChangeMenu", hide, _picture, _toolbar);
//     if (hide)
//     {
//         if (parent !== window)
//         {
//             return {
//                 message:"ChangeMenu()",
//                 datas:{
//                     hide:hide,
//                     toolbar:true
//                 }
//             };
//         }
//         HideToolbar(_toolbar);
//     }
//     else
//     {
//         if (parent !== window)
//         {
//             return {
//                 message:"ChangeMenu()",
//                 datas:{
//                     hide:hide,
//                     picture:{
//                         color:$(".wsp-picture").css("background-color"),
//                         picture:$(".wsp-picture").html()
//                     },
//                     toolbar:$(".wsp-toolbar")[0].outerHTML
//                 }
//             };
//         }
//         ShowToolbar(_picture, _toolbar);
//     }
// }

// function ShowToolbar(_picture = null, _toolbar = null)
// {
//     if (rcmail.env.workspace_menu_minified !== true)
//         rcmail.env.workspace_menu_minified = true;
//     else
//         return;
//     let right = "50px";
//     let bottom = "50px";
//     let button = $(".tiny-rocket-chat");
//     if (button.length > 0)
//     {
//         button.css("display", "none");
//         right = button.css("right");
//         bottom = button.css("bottom");
//     }
//     button = $(".tiny-wsp-menu");
//     if (button.length === 0)
//     {
//         let picture = $(".wsp-picture");
//         $("#layout").append(`<div class=tiny-wsp-menu></div>`)
//         button = $(".tiny-wsp-menu");
//         button.css("position", "absolute");
//         button.css("right", right)
//         .css("bottom", bottom)
//         .css("background-color", _picture === null ? picture.css("background-color") : _picture.color)
//         .css("z-index", 999)
//         .addClass("dwp-round")
//         .append(_picture === null ? picture.html() : _picture.picture);
//     }
//     button.css("display", "");
//     console.log("ShowToolbar", $(".wsp-toolbar"));
//     (_toolbar !== null && $(".wsp-toolbar").length === 0 ? $("#layout").append(_toolbar).find(".wsp-toolbar") : $(".wsp-toolbar") )
//     .css("margin", "initial")
//     .css("position", "fixed")
//     .css("bottom", (parseInt(bottom.replace("px", "")) - 3) + "px")
//     .css("right", right)
//     .css("z-index", 99)
//     .append('<div class="wsp-toolbar-item added-wsp-item" style="pointer-events:none"></div>');
// }

// function HideToolbar(fromChild)
// {
//     console.log("HideToolbar("+fromChild+")");
//     let button = $(".tiny-rocket-chat");
//     if (button.length > 0)
//         button.css("display", "");
//     if (fromChild)
//     {
//         $(".tiny-wsp-menu").remove();
//         $(".wsp-toolbar").remove();
//     }
//     else {
//         $(".tiny-wsp-menu").css("display", "none");
//         $(".wsp-toolbar").css("margin", "")
//         .css("position", "")
//         .css("bottom", "")
//         .css("right", "")
//         .css("z-index", "");
//         $(".added-wsp-item").remove();
//     }
// }

// async function ChangeFrameWorkspace(_class)
// {
//     if (parent !== window)
//     {
//         parent.postMessage(ChangeMenu(false));
//         parent.postMessage({
//             message:"_ChangeFrameWorkspace()",
//             datas:_class
//         });
//         return;
//     }
//     else {
//         ChangeMenu(false);
//         await _ChangeFrameWorkspace(_class);
//     }
// }

// async function _ChangeFrameWorkspace(_class, editPos = true, hideOnlyWorkSpace = true)
// {
//     $(".wsp-object").css("display", "none");
//     $(".wsp-toolbar-item").removeClass("active");
//     $(".wsp-toolbar-item.wsp-agenda").addClass("active");

//     if (hideOnlyWorkSpace)
//         $(".workspace-frame").css("display", "none");
//     else
//         $(".mm-frame").css("display", "none");
//      const id = mm_st_OpenOrCreateFrame(_class, false);
//      await wait(() => rcmail.env.frame_created !== true);

//      if (editPos)
//         $("#" + id).css("display", "").parent().css("display", "").css("position", "absolute").css("height", "100%");

//     if ($("#layout-content").hasClass("workspace-frame"))
//         $("#layout-content").css("display", "");
//      rcmail.env.have_frame_positioned = true;
//      rcmail.set_busy(false);
//      rcmail.clear_messages();
// }

// var cumulativeOffset = function(element) {
//     var top = 0, left = 0;
//     do {
//         top += element.offsetTop  || 0;
//         left += element.offsetLeft || 0;
//         element = element.offsetParent;
//     } while(element);

//     return {
//         top: top,
//         left: left
//     };
// };

// function OpenHome()
// {
//     ChangeMenu(true, false, rcmail.env.wsp_from_child !== undefined)
//     if (rcmail.env.wsp_from_child !== undefined)
//         delete rcmail.env.wsp_from_child;
//     _OpenHome();
// }

// async function _OpenHome()
// {
//     $(".wsp-object").css("display", "none");
//     $(".wsp-home").css("display", "");
//     $(".wsp-toolbar-item").removeClass("active");
//     $(".wsp-toolbar-item.first").addClass("active");

//     await _ChangeFrameWorkspace("workspace", false, false);
//     $(".workspace-frame").css("display", "");
//     rcmail.env.workspace_menu_minified = false;
// }
