export { MelObject };
import { Main } from "./main";
import { Update } from "./update";

class MelObject {
    constructor() {
        Main.add(() => {
            this.main();
        });

        let _update = new Update();
        _update.add(() => {
            this.update();
        });
    }

    main() {}

    update() {}
}
