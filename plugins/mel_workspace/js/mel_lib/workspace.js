import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { PlanningManager } from './parts/planning_manager';
export { Workspace };

class Workspace extends MelObject {
	constructor() {
		super();
	}

	main() {
		super.main();

		PlanningManager.Start();
	}

	static IsPublic() {
		return [true, 1, 'true', '1'].includes(
			rcmail.env.current_workspace_is_public,
		);
	}
}
