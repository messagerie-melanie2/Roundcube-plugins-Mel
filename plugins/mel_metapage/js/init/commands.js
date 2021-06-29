if (rcmail)
{
    (() => { //

        function change_frame(frame, args = null) {
            
            let config = {
                changeframe:true,
                wait:false,
                args:{},
                action:"update_location",
                action_args:[]
            }

            if (args !== null && args !== undefined)
            {
                for (const key in args) {
                    if (Object.hasOwnProperty.call(args, key)) {
                        const element = args[key];
                        config[key] = element;                        
                    }
                }
            }

            mel_metapage.Functions.change_frame(frame, config.changeframe, config.wait, config.args, [{
                action:config.action, 
                args:config.action_args,
                onlyExist:true
            }]);

        }

        rcmail.register_command("manage_mailbox_folders",
            () => {

                let config = {};

                if (rcmail.env.mel_metapage_const !== undefined)
                    config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

                change_frame("settings", {
                    args:{
                        "_action":"folders"
                    },
                    action_args:[mel_metapage.Functions.url("settings", "folders", config)]
                });

            }, true);

            rcmail.register_command("mel_metapage_manage_mail_box",
            () => {

                let config = {};

                if (rcmail.env.mel_metapage_const !== undefined)
                    config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

                change_frame("settings", {
                    args:{
                        "_action":"plugin.mel_resources_bal"
                    },
                    action_args:[mel_metapage.Functions.url("settings", "plugin.mel_resources_bal", config)]
                });

            }, true);

            rcmail.drag_menu_action = function(action)
            {
              var menu = this.gui_objects.dragmenu;
              if (menu) {
                  if ($(menu).show)
                    $(menu).show();
                  else
                    $(menu).removeClass("hidden").css("display", "");

              }
          
              this.command(action, this.env.drag_target);
              this.env.drag_target = null;
            };

    })(); //
}