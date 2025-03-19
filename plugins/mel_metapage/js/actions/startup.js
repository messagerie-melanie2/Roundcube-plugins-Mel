// import { FrameManager } from '../lib/classes/frame_manager';
// import { WrapperObject } from '../lib/mel_object';

rcmail.addEventListener('init', async () => {
  if (
    window !== top ||
    rcmail.env.mel_metapage_is_from_iframe ||
    rcmail.env.extwin
  )
    return;

  const { FramesManager } = await loadJsModule(
    'mel_metapage',
    'frame_manager',
    '/js/lib/classes/',
  );

  /**
   * @type {WrapperObject<FrameManager>}
   */
  const Manager = FramesManager;

  Manager.Instance.add_buttons_actions();

  rcmail.triggerEvent('frames.setup.after');
});
