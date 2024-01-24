import { MainMetapageModule } from "../../../mel_metapage/js/lib/metapages_actions/metapage_module.js";

export class WorkspaceModule extends MainMetapageModule
{
    constructor(...args) {
        super(...args);
    }

    main() {
        super.main();
    }

    _create_action(args) {
        args.config.main = args.manager.create_button('workspaces', 'Un espace de travail', () => {
            m_mp_createworkspace();
            args.manager.hide();
        }, false);

        return args;
    }
}