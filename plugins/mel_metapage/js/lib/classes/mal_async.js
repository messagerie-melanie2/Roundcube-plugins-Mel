export class MelAsync {
    constructor() {}

    static async forof(iterable, action, await_action = true) {
        let actions = null;
        for (const iterator of iterable) {
            if (isAsync(action)) {
                if (await_action) await action(iterator);
                else {
                    if (!actions) actions = [];

                    actions.push(action(iterator));
                }
            }
            else action(iterator);
        }

        if (!!actions) {
            await Promise.allSettled(actions);
        }
    }
}