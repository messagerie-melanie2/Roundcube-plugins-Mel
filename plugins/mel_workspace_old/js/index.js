function wsp_epingle(id) {
  event.preventDefault();

  if (rcmail.busy) return async () => {};

  rcmail.set_busy(true, 'loading');
  const initialId = id.replace('-epingle', '');
  workspaces.sync.PostToParent({
    exec: 'workspace_disable_epingle(`' + initialId + '`)',
  });
  workspace_disable_epingle(initialId);
  //$("#tak-" + initialId).addClass("disabled");
  $('#tak-' + initialId + '-epingle').addClass('disabled');
  if (id.includes('wsp-')) id = id.replace('wsp-', '').replace('-epingle', '');
  return $.ajax({
    // fonction permettant de faire de l'ajax
    type: 'POST', // methode de transmission des données au fichier php
    url: mel_metapage.Functions.url('workspace', 'epingle'), //"/?_task=workspace&_action=epingle",
    data: {
      _uid: id,
    },
    success: function (data) {
      data = JSON.parse(data);
      // workspace_load_epingle(data, initialId);

      // let querry = $("#tak-" + initialId);
      // querry.removeClass("disabled");

      // if (querry.hasClass("active"))
      //     querry.attr("title", querry.attr("title").replace("Épingler", "Désépingler"));
      // else
      //     querry.attr("title", querry.attr("title").replace("Désépingler", "Épingler"));

      // $("#tak-" + initialId + "-epingle").removeClass("disabled").attr("title", querry.attr("title"));

      // EpingleEmpty();

      workspaces.sync.PostToParent({
        datas: data,
        id: initialId,
        exec:
          '(' +
          function exec(is_epingle, id) {
            if (is_epingle) $('#tak-' + id).addClass('active');
            else $('#tak-' + id).removeClass('active');
          } +
          ')(' +
          data.is_epingle +
          ', `' +
          initialId +
          '`)',
      });
    },
    error: function (xhr, ajaxOptions, thrownError) {
      // Add these parameters to display the required response
      console.error(xhr, ajaxOptions, thrownError);
    },
  }).always(() => {
    workspaces.sync.PostToParent({
      exec: 'workspace_enable_epingle(`' + initialId + '`)',
    });
    workspace_enable_epingle(initialId);

    window.location.reload();
  });
}

$(document).ready(() => {
  //console.log("ready", rcmail.env.action, rcmail.env.action === "action");
  if (rcmail.env.action === 'action') {
    switch (rcmail.env.wsp_action_event) {
      case 'list_public':
        rcmail.register_command(
          'workspaces.page',
          (page) => {
            rcmail.set_busy(true, 'loading');
            //console.log("here");
            window.location.href = MEL_ELASTIC_UI.url('workspace', 'action', {
              _event: 'list_public',
              _page: page,
            });
          },
          true,
        );
        break;
      case 'list_public_search':
        rcmail.register_command(
          'workspaces.page',
          (page) => {
            rcmail.set_busy(true, 'loading');
            //console.log("here");
            window.location.href = MEL_ELASTIC_UI.url('workspace', 'action', {
              _search: rcmail.env.wsp_action_search,
              _event: 'list_public_search',
              _page: page,
            });
          },
          true,
        );
        break;
      default:
        break;
    }
  }

  let events_already_created = false;
  rcmail.register_command(
    'workspaces.go',
    (uid) => {
      if (window.workspace_frame_manager) {
        if (!events_already_created) {
          events_already_created = true;
          workspace_frame_manager.oncreatebefore.push(() => {
            top.rcmail.set_busy(true);
            top.$('#bnum-loading-div').removeClass('loaded');
          });

          workspace_frame_manager.oncreated.push(() => {
            top.$('#bnum-loading-div').addClass('loaded');
            top.rcmail.set_busy(false);
          });
        }

        top.current_workspace_in_background = workspace_frame_manager
          .go(uid)
          .getActiveFrame();
      }
    },
    true,
  );

  new Mel_Update(
    mel_metapage.EventListeners.tasks_updated.after,
    'wsp-tasks-all-number',
    update_tasks,
  );

  rcmail.addEventListener('frame_opened', (args) => {
    const { eClass } = args;
    if (eClass === 'workspace') {
      for (const iterator of $('#side-workspaces iframe')) {
        iterator.contentWindow.rcmail.triggerEvent('frame_opened', args);
      }
    }
  });

  //window.runModule?.('mel_workspace', 'index', '/js/mel_lib/');
});

function load_archives(e) {
  rcmail.set_busy(true, 'loading');
  let config = {
    // fonction permettant de faire de l'ajax
    type: 'GET', // methode de transmission des données au fichier php
    url: MEL_ELASTIC_UI.url('workspace', 'archived'), //rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
    success: (html) => {
      $('.wsp-archive-items').html(html);
    },
    error: () => {},
  };

  return $.ajax(config).always(() => {
    rcmail.set_busy(false);
    rcmail.clear_messages();
  });
}

function update_tasks() {
  //console.log("here", "update_tasks()");
  $('.workspace').each((i, e) => {
    const id = e.id.replace('wsp-', '').replace('-epingle', '');
    const datas = mel_metapage.Storage.get(mel_metapage.Storage.other_tasks)[
      id
    ];
    const count = mel_metapage.Storage.get(
      mel_metapage.Storage.other_tasks_count,
    )[id];
    //console.log("update_tasks()", id, datas, count);
    if (datas !== undefined && count !== undefined)
      $(e)
        .find('.wsp-tasks-all')
        .html(
          '<span style="font-size:large">' +
            (count - datas.length) +
            '</span> tâches réalisées sur ' +
            count +
            '</div>',
        );
  });
}

//SetupToolbar();
// async function SetupToolbar() {
//     debugger;
//     const MODULE_TOOLBAR = await loadJsModule('mel_metapage', 'toolbar');
//     const MODULE_MATH = await loadJsModule('mel_metapage', 'mel_maths');

//     const Toolbar = MODULE_TOOLBAR.HideOrShowToolbar;
//     const MaterialToolbarIcon = MODULE_TOOLBAR.MaterialToolbarIcon;
//     const ToolbarItem = MODULE_TOOLBAR.ToolbarItem;
//     const Point = MODULE_MATH.Point;

//     /**
//      * @type {Toolbar}
//      */
//     let toolbar = new Toolbar({
//         $parent:top.$('body'),
//         height:'60px',
//         width:'calc(100% - 60px)',
//         pos: new Point(60, 0),
//         color:'#2C3054'
//     });

//     let icon1 = new MaterialToolbarIcon('arrow_back');
//     let icon2 = new MaterialToolbarIcon('home');

//     const icons = [icon1, icon2];
//     const texts = ['Retour', 'Accueil'];

//     let it = 0;
//     for (const icon of icons) {
//         const item = new ToolbarItem({
//             icon:icon,
//             text:texts[it++],
//             $parent:toolbar.$toolbar
//         });

//         toolbar.addItem(item.text, item, {updateOrder:true});
//     }
// // debugger
//     toolbar.refresh();
// }
